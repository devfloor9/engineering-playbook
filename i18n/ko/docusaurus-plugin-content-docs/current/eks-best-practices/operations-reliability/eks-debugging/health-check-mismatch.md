---
title: Probe vs Health Check 불일치 디버깅
description: K8s Probe와 ALB/NLB/Ingress Controller Health Check의 메커니즘 차이 및 timeout 불일치로 인한 장애 진단 가이드
created: "2026-04-07"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 17
tags:
  - eks
  - debugging
  - health-check
  - probe
  - alb
  - nlb
  - ingress
  - scope:ops
sidebar_label: Health Check 불일치
---

> **📌 기준 환경**: EKS 1.33+, AWS Load Balancer Controller v2.9+, Ingress-NGINX v1.11+

## 1. 개요

Kubernetes Probe와 Load Balancer/Ingress Controller의 Health Check는 **독립적으로 실행**되며, **서로 다른 메커니즘과 타이밍**을 가집니다. 이로 인한 불일치는 다음과 같은 장애를 유발합니다:

- **503 Service Unavailable**: Probe는 성공하지만 ALB Health Check 실패
- **502 Bad Gateway**: Graceful Shutdown 시퀀스 불일치로 종료 중인 Pod로 트래픽 전송
- **일시적 장애**: Rolling Update 중 새 Pod가 준비되기 전에 트래픽 수신
- **504 Gateway Timeout**: Ingress 타임아웃과 백엔드 응답 시간 불일치

본 문서는 K8s Probe와 ALB/NLB/Ingress Health Check의 메커니즘 차이를 명확히 하고, 빈발하는 불일치 패턴별 진단 방법과 권장 설정을 제공합니다.

:::tip 관련 문서 참조
- **Probe 기초**: [Pod 헬스체크 & 라이프사이클](../eks-pod-health-lifecycle.md) — Probe 설정 상세
- **네트워킹 디버깅**: [네트워킹 문제 해결](./networking.md) — Service/DNS 이슈
- **고가용성**: [EKS 고가용성 아키텍처 가이드](../eks-resiliency-guide.md) — PDB, Graceful Shutdown
:::

---

## 2. 메커니즘 비교: Probe vs Health Check

### 2.1 Kubernetes Probe (kubelet 실행)

Kubernetes Probe는 **kubelet**이 각 노드에서 독립적으로 실행하는 헬스 체크입니다.

**표 1. Kubernetes Probe 유형별 실행 주체와 체크 대상, 실패 시 동작**

| Probe 유형 | 실행 주체 | 체크 대상 | 실패 시 동작 |
|-----------|----------|----------|-------------|
| **readinessProbe** | kubelet | 컨테이너 | Service Endpoints에서 **제거** (Pod는 살아있음) |
| **livenessProbe** | kubelet | 컨테이너 | 컨테이너 **재시작** (SIGTERM → SIGKILL) |
| **startupProbe** | kubelet | 컨테이너 | 초기화 완료 전 다른 Probe 비활성화, 실패 시 재시작 |

**핵심 특징:**
- **노드의 kubelet이 실행**: Probe는 Pod 내부가 아니라 각 노드의 kubelet이 컨테이너에 직접 접근해 실행합니다.
- **Service Endpoint 제어**: readinessProbe가 실패하면 해당 주소가 NotReady로 표시됩니다(EndpointSlice의 `conditions.ready=false`, Endpoints의 `notReadyAddresses`로 이동). Endpoints 오브젝트 전체에서 사라지는 것이 아니라 ready 주소 목록에서 빠집니다.
- **빠른 체크**: 기본 1초 timeout, 10초 간격

### 2.2 AWS Load Balancer Health Check

AWS Load Balancer Controller(LBC)가 관리하는 ALB/NLB Health Check는 **AWS 인프라 레벨**에서 독립적으로 실행됩니다.

**표 2. ALB/NLB Health Check 유형별 실행 주체와 체크 대상, 실패 시 동작**

| Health Check 유형 | 실행 주체 | 체크 대상 | 실패 시 동작 |
|------------------|----------|----------|-------------|
| **ALB Target Group HC** | ALB | HTTP(S) endpoint | **unhealthy로 표시 → 트래픽 중단** (등록은 유지, Pod 상태와 무관) |
| **NLB Target Group HC** | NLB | TCP or HTTP | **unhealthy로 표시 → 트래픽 중단** (등록은 유지) |

**핵심 특징:**
- **외부에서 실행**: ALB/NLB가 Pod IP로 HTTP/TCP 요청
- **독립적 설정**: K8s Probe와 별도로 interval, timeout, threshold 설정
- **느린 체크**: 기본 5초 timeout, 15-30초 간격

### 2.3 Ingress-NGINX Health Check

Ingress-NGINX Controller는 **nginx upstream** 레벨에서 헬스 체크를 수행합니다.

**표 3. Ingress-NGINX Health Check 유형별 실행 주체와 체크 대상, 실패 시 동작**

| Health Check 유형 | 실행 주체 | 체크 대상 | 실패 시 동작 |
|------------------|----------|----------|-------------|
| **upstream health** | nginx process | HTTP backend | `proxy_next_upstream` 동작 (다른 upstream으로 재시도) |

**핵심 특징:**
- **nginx process 내부**: L7 프록시 레벨 체크
- **timeout 설정**: `proxy-read-timeout`, `proxy-send-timeout` (기본 60초)
- **암묵적 체크**: 별도 health check endpoint 없이 실제 요청 결과로 판단

---

## 3. 타이밍 비교표

다음 표는 각 Health Check의 기본 타이밍과 체크 주체, 실패 시 동작을 비교합니다. 각 열의 기본값은 서로 다른 출처에서 나옵니다. K8s Probe 값은 kubelet의 Probe 기본값이고, ALB·NLB 열의 값은 AWS Load Balancer Controller(LBC)가 annotation으로 설정하는 기본값이며, Ingress-NGINX 값은 nginx 지시어 기본값입니다. LBC가 생성하는 Target Group의 기본값은 ELB API를 직접 호출할 때의 기본값(예: ALB 대상 유형 `instance`/`ip`의 기본 interval 30초)과 다를 수 있으므로, 아래 값은 LBC/annotation 기준으로 읽어야 합니다.

**표 4. K8s Probe·ALB·NLB·Ingress-NGINX의 설정별 기본 타이밍 비교(출처별)**

| 설정 | K8s Probe (kubelet) | ALB (LBC annotation) | NLB (LBC annotation) | Ingress-NGINX (nginx) |
|------|----------|-----------------|-----------------|---------------|
| **기본 interval** | 10s | 15s | 30s | - (실제 트래픽) |
| **기본 timeout** | 1s | 5s | 6s | 60s (proxy_read_timeout) |
| **실패 threshold** | 3 | 2 (unhealthy) | 3 | - |
| **체크 주체** | kubelet | ALB | NLB | nginx process |
| **실패 시 동작** | ready 주소에서 제거 | unhealthy 표시 → 트래픽 중단 | unhealthy 표시 → 트래픽 중단 | upstream 제거 후 재시도 |
| **체크 경로** | `/healthz` 등 | `/` 또는 커스텀 | TCP 또는 HTTP | 실제 요청 경로 |
| **설정 위치** | Pod spec | Service annotation | Service annotation | Ingress annotation |

**타이밍 불일치의 핵심:**
- **ALB는 K8s보다 느리게 체크**: 15초 간격 vs 10초 간격
- **ALB timeout이 더 김**: 5초 vs 1초 → Probe는 통과하지만 ALB는 실패 가능
- **체크 경로 불일치**: readinessProbe `/healthz` ≠ ALB Health Check `/`

---

## 4. 빈발 불일치 패턴

### 패턴 1: Probe 성공 + ALB Health Check 실패 → 503

**증상:**
- `kubectl get pods` → Pod는 `Running`, `Ready 1/1`
- `kubectl get endpoints` → Endpoints에 Pod IP 존재
- 실제 요청 → `503 Service Unavailable`

**근본 원인:**
1. **Health Check 경로 불일치** (가장 흔함)
   - readinessProbe: `GET /healthz` → 200 OK
   - ALB Target Group HC: `GET /` → 404 Not Found
   - **결과**: K8s는 Ready 판정, ALB는 Unhealthy 판정

2. **타임아웃 불일치**
   - readinessProbe timeout 1초 → 앱이 800ms에 응답
   - ALB HC timeout 5초 내에 앱이 응답 못함 (예: DB 쿼리 지연)

3. **Security Group 설정 오류**
   - ALB → Pod CIDR 트래픽 차단
   - kubelet은 노드 내부에서 체크 (통과), ALB는 외부에서 체크 (실패)

**그림 1. 503 Service Unavailable 진단 플로우**

```mermaid
flowchart TD
    START[503 Service Unavailable 발생] --> CHECK_POD{kubectl get pods<br/>Pod Ready?}
    CHECK_POD -->|Ready 1/1| CHECK_EP{kubectl get endpoints<br/>Pod IP 존재?}
    CHECK_POD -->|Not Ready| FIX_PROBE[Probe 설정 수정]

    CHECK_EP -->|존재함| CHECK_TG{aws elbv2<br/>describe-target-health<br/>Target Healthy?}
    CHECK_EP -->|없음| FIX_PROBE

    CHECK_TG -->|healthy| CHECK_SG[Security Group 확인]
    CHECK_TG -->|unhealthy| PATH_MISMATCH{HC Path 일치?}

    PATH_MISMATCH -->|불일치| FIX_PATH[Service annotation<br/>health-check-path 수정]
    PATH_MISMATCH -->|일치| TIMEOUT{Timeout 설정?}

    TIMEOUT -->|ALB timeout 짧음| FIX_TIMEOUT[health-check-timeout<br/>증가]
    TIMEOUT -->|정상| CHECK_SG

    CHECK_SG --> CHECK_APP[애플리케이션 로그 확인]
    FIX_PATH --> VERIFY[검증]
    FIX_TIMEOUT --> VERIFY
    CHECK_APP --> VERIFY

    style START fill:#ff4444,stroke:#cc3636,color:#fff
    style FIX_PATH fill:#34a853,stroke:#2a8642,color:#fff
    style FIX_TIMEOUT fill:#34a853,stroke:#2a8642,color:#fff
    style VERIFY fill:#4286f4,stroke:#2a6acf,color:#fff
```

**해결책:**

```yaml
# ALB는 Service가 아니라 Ingress로 생성하며, alb.ingress.* annotation은 Ingress에 둡니다.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    # ALB Health Check 경로를 readinessProbe와 통일
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "2"
spec:
  ingressClassName: alb
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
---
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP        # ALB target-type: ip는 ClusterIP Service로 충분합니다.
  selector:
    app: my-app          # Deployment Pod 레이블과 일치해야 합니다.
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app       # Service selector와 일치해야 합니다.
    spec:
      containers:
      - name: app
        image: my-app:1.0
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /healthz  # ALB HC 경로와 일치
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 1
          failureThreshold: 3
```

### 패턴 2: Graceful Shutdown 시 502 Bad Gateway

**증상:**
- Pod 종료 중에 `502 Bad Gateway` 발생
- 일부 요청만 실패 (간헐적)

**근본 원인:**
Pod 종료 시퀀스와 ALB deregistration 타이밍 불일치로 **종료 중인 Pod로 트래픽 전송**

**Pod 종료 시퀀스:**
1. `kubectl delete pod` 또는 Rolling Update 시작
2. API 서버가 Pod에 `deletionTimestamp`를 설정합니다(`kubectl`에는 `Terminating`으로 표시되며, 이는 별도의 phase가 아니라 삭제 진행 상태입니다).
3. **동시에 두 가지 동작:**
   - kubelet: `preStop` hook 실행 → `SIGTERM` 전송
   - EndpointSlice/endpoints 컨트롤러: 해당 주소를 Endpoints에서 제거하고, kube-proxy는 이 변경을 받아 각 노드의 iptables/IPVS 규칙을 다시 프로그래밍합니다.
4. `terminationGracePeriodSeconds` (기본 30초) 대기
5. grace period가 지나도 컨테이너가 종료되지 않은 경우에만 `SIGKILL`로 강제 종료

**ALB deregistration 시퀀스:**
1. ALB가 Target Group에서 Pod 제거 요청 수신
2. `deregistration_delay` (기본 300초) 동안 대기
3. 대기 중에도 기존 연결은 유지 (connection draining)
4. 300초 후 Target 완전 제거

**문제 상황:**

```
시간축:
T+0s   Pod Terminating, preStop 실행 (없으면 즉시 SIGTERM)
T+0s   ALB deregistration 시작 (하지만 300초 대기)
T+0s   SIGTERM 전송 → 앱이 즉시 종료 시작
T+1s   앱 프로세스 종료
T+1s~  ALB가 아직 connection draining 중 → 502 발생
T+30s  terminationGracePeriodSeconds 도달 → SIGKILL
T+300s ALB deregistration 완료
```

**권장 설정 공식:**

`deregistration_delay`는 Pod의 grace period와 순차로 더해지는 단계가 아니라, LB에서 **병렬로** 진행되는 connection draining 시간입니다. Pod는 이 전체 합이 아니라, LB가 대상을 unhealthy/draining으로 인지하는 데 걸리는 시간(일반적으로 preStop의 `sleep`으로 확보)과 그 뒤 진행 중인 요청을 마치는 시간만 버티면 됩니다.

```
terminationGracePeriodSeconds > preStop_sleep + app_shutdown_time
```

여기서 `preStop_sleep`은 LB가 대상 제거를 감지할 때까지 트래픽을 계속 받을 수 있도록 두는 지연이며, `deregistration_delay`보다 짧게 잡아도 됩니다. `deregistration_delay`는 LB 쪽에서 별도로 진행됩니다.

예시: `preStop_sleep=15s`, `app_shutdown=5s`
→ `terminationGracePeriodSeconds=25s` 이상

**그림 2. 502 Bad Gateway(Pod 종료 중) 진단 플로우**

```mermaid
flowchart TD
    START[502 Bad Gateway<br/>Pod 종료 중] --> CHECK_TIMING{preStop hook 존재?}

    CHECK_TIMING -->|없음| ADD_PRESTOP[preStop sleep 15 추가]
    CHECK_TIMING -->|있음| CHECK_GRACE{terminationGracePeriodSeconds<br/>충분?}

    CHECK_GRACE -->|짧음| INCREASE_GRACE[terminationGracePeriodSeconds<br/>증가]
    CHECK_GRACE -->|충분| CHECK_DEREG{ALB deregistration_delay<br/>설정?}

    CHECK_DEREG -->|300s 기본값| DECREASE_DEREG[deregistration_delay<br/>감소 15-30s]
    CHECK_DEREG -->|이미 짧음| CHECK_SIGTERM{SIGTERM 핸들러<br/>구현?}

    ADD_PRESTOP --> VERIFY[검증:<br/>kubectl delete pod 테스트]
    INCREASE_GRACE --> VERIFY
    DECREASE_DEREG --> VERIFY
    CHECK_SIGTERM --> IMPLEMENT_SIGTERM[언어별 Graceful Shutdown<br/>구현]
    IMPLEMENT_SIGTERM --> VERIFY

    style START fill:#ff4444,stroke:#cc3636,color:#fff
    style ADD_PRESTOP fill:#34a853,stroke:#2a8642,color:#fff
    style VERIFY fill:#4286f4,stroke:#2a6acf,color:#fff
```

**해결책:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  annotations:
    # ALB deregistration delay 단축 (기본 300초 → 15초)
    alb.ingress.kubernetes.io/target-group-attributes: deregistration_delay.timeout_seconds=15
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 40  # preStop_sleep + app shutdown 여유 (deregistration은 LB 병렬)
      containers:
      - name: app
        image: my-app:1.0
        lifecycle:
          preStop:
            exec:
              command:
              - /bin/sh
              - -c
              - |
                # 1. ALB가 deregistration을 감지할 시간 확보
                sleep 15
                # 2. 애플리케이션에 종료 신호 (선택)
                # curl -X POST localhost:8080/shutdown
        # 애플리케이션은 SIGTERM을 받아 graceful shutdown 수행
```

**언어별 SIGTERM 핸들러 예시 (Node.js):**

```javascript
// server.js
const express = require('express');
const app = express();
const server = app.listen(8080);

// 진행 중인 요청 추적
let isShuttingDown = false;

app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).send('Server is shutting down');
  }
  next();
});

// SIGTERM 핸들러
process.on('SIGTERM', () => {
  console.log('SIGTERM received, starting graceful shutdown');
  isShuttingDown = true;

  server.close(() => {
    console.log('All connections closed, exiting');
    process.exit(0);
  });

  // 강제 종료 타임아웃 (25초 후)
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 25000);
});
```

### 패턴 3: Rolling Update 시 일시적 503

**증상:**
- `kubectl rollout status` 중 간헐적 503
- 새 Pod는 `Running`, `Ready`, 하지만 일부 요청 실패

**근본 원인:**
ALB Health Check가 **통과하기 전에** K8s가 Pod를 "Ready" 상태로 판정하여 트래픽 전송

ALB에 대상이 실제로 등록·healthy 상태가 될 때까지 Pod를 Ready로 보지 않도록 하려면 **Pod Readiness Gates**(AWS Load Balancer Controller의 `elbv2.k8s.aws/pod-readiness-gate-inject`)를 사용합니다. 이것이 ALB 등록과 Pod Ready를 실제로 동기화하는 메커니즘입니다. `minReadySeconds`는 ALB 등록을 기다리지 않고 Pod가 Ready가 된 뒤 일정 시간을 더 기다리게 하는 **휴리스틱**이며, ALB HC 주기에 맞춰 잡으면 완화에는 도움이 되지만 등록 완료를 보장하지는 않습니다.

**타이밍 불일치:**

```
T+0s   새 Pod 시작
T+10s  readinessProbe 성공 (첫 체크 10초 후)
T+10s  K8s Endpoints에 Pod 추가 → ALB에 Target 등록 요청
T+10s  K8s가 구 Pod로 트래픽 전송 중지
T+15s  ALB 첫 Health Check 실행
T+30s  ALB Health Check 2회 성공 (healthy threshold=2)
T+30s  ALB가 새 Pod로 트래픽 전송 시작

문제: T+10s ~ T+30s 구간에서 새 Pod 준비 전 트래픽 → 503
```

**그림 3. Rolling Update 중 일시적 503 진단 플로우**

```mermaid
flowchart TD
    START[Rolling Update 중<br/>일시적 503] --> CHECK_MINREADY{minReadySeconds<br/>설정?}

    CHECK_MINREADY -->|0 (기본)| SET_MINREADY[Pod Readiness Gate 적용<br/>+ minReadySeconds는 휴리스틱<br/>예: 15s × 2 = 30s]
    CHECK_MINREADY -->|설정됨| CHECK_READINESS{readinessProbe<br/>충분히 엄격?}

    CHECK_READINESS -->|너무 관대| STRICT_PROBE[failureThreshold 감소<br/>1-2로 설정]
    CHECK_READINESS -->|엄격함| CHECK_MAXUNAVAIL{maxUnavailable<br/>설정?}

    CHECK_MAXUNAVAIL -->|너무 큼| ADJUST_MAXUNAVAIL[maxUnavailable 감소<br/>25% 또는 1]
    CHECK_MAXUNAVAIL -->|적절| CHECK_PDB{PodDisruptionBudget<br/>설정?}

    SET_MINREADY --> VERIFY[검증:<br/>kubectl rollout restart]
    STRICT_PROBE --> VERIFY
    ADJUST_MAXUNAVAIL --> VERIFY
    CHECK_PDB --> ADD_PDB[PDB 추가<br/>minAvailable: 50%]
    ADD_PDB --> VERIFY

    style START fill:#ff4444,stroke:#cc3636,color:#fff
    style SET_MINREADY fill:#34a853,stroke:#2a8642,color:#fff
    style VERIFY fill:#4286f4,stroke:#2a6acf,color:#fff
```

**해결책:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  # ALB 등록 동기화: Readiness Gate가 주입되도록 네임스페이스/Pod에
  # elbv2.k8s.aws/pod-readiness-gate-inject=enabled 레이블을 적용합니다.
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1  # 업데이트 중 동시에 Unavailable 상태가 될 수 있는 Pod 최대 수
      maxSurge: 1        # desired 수를 초과해 추가할 수 있는 Pod 최대 수
  # minReadySeconds는 Pod가 Ready가 된 뒤 추가로 기다리는 안정화 지연(휴리스틱)이며,
  # ALB 등록 완료를 기다리지 않습니다. 등록 동기화는 Readiness Gate로 보장합니다.
  minReadySeconds: 30  # ALB HC interval(15s) × threshold(2)에 맞춘 예시 값
  template:
    spec:
      containers:
      - name: app
        image: my-app:2.0
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 1
          failureThreshold: 2  # 엄격하게 체크
          successThreshold: 1
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2  # 자발적 중단(노드 drain 등)으로부터 최소 가용 Pod 수 보호. 롤아웃 순서를 제어하지는 않습니다.
  selector:
    matchLabels:
      app: my-app
```

### 패턴 4: NLB + externalTrafficPolicy: Local

**증상:**
- NLB 사용 시 일부 요청 타임아웃
- `externalTrafficPolicy: Local` 설정 시 Health Check 실패

**근본 원인:**
NLB는 등록된 **노드(타겟)** 단위로 트래픽을 분산하며, `externalTrafficPolicy: Local`에서는 **Pod가 있는 노드만** Health Check를 통과해 트래픽을 받습니다. 노드별 부하는 노드에 떠 있는 Pod 수가 아니라 NLB의 타겟 분산 방식(기본적으로 healthy 노드에 고르게)에 따라 결정됩니다.

**표 5. externalTrafficPolicy 설정별 Client IP 보존·Health Check·트래픽 분배 동작**

| externalTrafficPolicy | Client IP 보존 | Health Check | 트래픽 분배 |
|----------------------|---------------|-------------|-----------|
| **Cluster (기본)** | 미보존 (SNAT) | 모든 노드 healthy | 노드 간 균등 → 노드 간 추가 hop 발생 |
| **Local** | 보존 | Pod 있는 노드만 healthy | healthy 노드(=Pod 있는 노드) 사이에서 분산; Pod 없는 노드는 제외 |

**문제 상황:**

```
노드 1: Pod A, Pod B → NLB HC 성공 → 트래픽 수신
노드 2: Pod 없음 → NLB HC 실패 → TG에서 제거
노드 3: Pod C → NLB HC 성공 → 트래픽 수신

문제: 노드 1과 노드 3이 노드 단위로 비슷한 트래픽을 받으므로,
      노드 1의 Pod 2개는 노드 3의 Pod 1개보다 Pod당 적은 트래픽을 받습니다(노드당 Pod 수 불균형).
```

**진단 및 해결:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    # NLB Health Check 설정
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: "http"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: "/healthz"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-timeout: "6"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "2"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "2"
spec:
  type: LoadBalancer
  # Client IP 보존 vs 균등 분배 선택
  externalTrafficPolicy: Local  # Client IP 필요 시
  # externalTrafficPolicy: Cluster  # 균등 분배 필요 시
  ports:
  - port: 80
    targetPort: 8080
```

**권장 사항:**
- **Client IP 필요**: `externalTrafficPolicy: Local`(노드당 Pod 최소 1개) 또는 NLB의 proxy protocol v2 사용. `Cluster`는 SNAT로 소스 IP가 노드 IP로 바뀝니다.
- **참고**: `X-Forwarded-For` 헤더는 ALB/Ingress 같은 L7 경로에서 주입됩니다. NLB(L4)는 이 헤더를 추가하지 않으므로 NLB 경로에서는 사용할 수 없습니다.

### 패턴 5: Ingress-NGINX upstream timeout

**증상:**
- `504 Gateway Timeout` 발생
- 파일 업로드, 배치 API 실패
- `413 Request Entity Too Large` (파일 크기 초과)

**근본 원인:**
Ingress-NGINX의 `proxy-read-timeout`(기본 60초)은 백엔드로부터 연속된 두 읽기 작업 **사이의** 무응답 허용 시간(비활성 타임아웃)이며, 요청 전체 처리 시간의 상한이 아닙니다. 백엔드가 60초 넘게 아무 데이터도 보내지 않으면 연결을 끊습니다. 주기적으로 데이터를 보내는 응답은 전체 처리가 60초를 넘어도 끊기지 않지만, 처리 중 60초 넘게 침묵하면 504가 발생합니다.

**진단 및 해결:**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    # Timeout 설정 (초 단위)
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"    # 백엔드 응답 대기
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"    # 백엔드로 전송 대기
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "10"  # 백엔드 연결 대기

    # 파일 업로드 크기 제한 (기본 1m)
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"

    # 버퍼 설정 (대용량 응답)
    nginx.ingress.kubernetes.io/proxy-buffer-size: "8k"
    nginx.ingress.kubernetes.io/proxy-buffers-number: "4"
spec:
  ingressClassName: nginx
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-service
            port:
              number: 80
```

**배치 API 전용 Ingress 분리:**

```yaml
# 일반 API (짧은 timeout)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
---
# 배치 API (긴 timeout)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: batch-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "1800"  # 30분
    nginx.ingress.kubernetes.io/proxy-body-size: "1g"
spec:
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /batch
        pathType: Prefix
        backend:
          service:
            name: batch-service
            port:
              number: 80
```

---

## 5. 권장 설정 가이드

### 5.1 통일 원칙: 경로와 포트 일치

**원칙:**
- ALB/NLB Health Check 경로 = readinessProbe 경로
- Health Check 포트: IP 모드 타겟에서는 트래픽 포트(= Service targetPort)를 쓰지만, instance 모드 타겟이나 `externalTrafficPolicy: Local` NLB에서는 노드의 `healthCheckNodePort`로 체크합니다. 따라서 "HC 포트 = targetPort"는 IP 모드에 한정됩니다.
- Probe timeout < ALB HC timeout (Probe가 더 빠르게 감지)

**템플릿:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  annotations:
    # ALB Health Check 설정
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "2"

    # Graceful Shutdown 설정
    alb.ingress.kubernetes.io/target-group-attributes: deregistration_delay.timeout_seconds=15
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  minReadySeconds: 30  # Ready 후 안정화 지연(휴리스틱). ALB 등록 동기화는 Readiness Gate 사용
  template:
    spec:
      terminationGracePeriodSeconds: 40
      containers:
      - name: app
        image: my-app:1.0
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP

        # Startup Probe (느린 시작 앱)
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 30  # 최대 150초 대기

        # Liveness Probe (데드락 감지)
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 0  # startupProbe 성공 후 활성화
          periodSeconds: 10
          timeoutSeconds: 1
          failureThreshold: 3

        # Readiness Probe (트래픽 수신 제어)
        readinessProbe:
          httpGet:
            path: /healthz  # ALB HC와 동일
            port: 8080
          initialDelaySeconds: 0
          periodSeconds: 5
          timeoutSeconds: 1
          failureThreshold: 2
          successThreshold: 1

        # Graceful Shutdown
        lifecycle:
          preStop:
            exec:
              command:
              - /bin/sh
              - -c
              - sleep 15  # ALB deregistration 대기
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 50%
  selector:
    matchLabels:
      app: my-app
```

### 5.2 종료 시퀀스 공식

`deregistration_delay`는 LB에서 병렬로 진행되므로 Pod의 grace period에 더하지 않습니다. Pod는 LB가 대상 제거를 감지하도록 두는 `preStop_sleep`과 진행 중인 요청을 마치는 시간만 버티면 됩니다.

```
terminationGracePeriodSeconds = preStop_sleep + app_shutdown_buffer

예시:
  preStop_sleep = 15s          # LB가 대상 제거를 감지하도록 두는 지연
  app_shutdown_buffer = 10s    # SIGTERM 처리 + 진행 중 요청 완료
  -------------------
  terminationGracePeriodSeconds = 25s

  # deregistration_delay(예: 15s)는 LB 쪽에서 별도로 진행되며 위 합에 포함하지 않습니다.
```

### 5.3 타이밍 최적화 매트릭스

**표 6. 워크로드 유형별 타이밍 파라미터 권장값 매트릭스**

| 워크로드 유형 | readinessProbe period | ALB HC interval | minReadySeconds | terminationGracePeriodSeconds |
|-------------|----------------------|----------------|-----------------|------------------------------|
| **Stateless API** | 5s | 15s | 30s | 40s |
| **웹 프론트엔드** | 5s | 15s | 30s | 40s |
| **배치 워커** | 10s | 30s | 60s | 120s |
| **Long-lived 연결** | 10s | 30s | 60s | 300s |
| **gRPC 서비스** | 5s (grpc probe) | 15s (HTTP) | 30s | 40s |

---

## 6. 진단 명령어 모음

### 6.1 K8s Endpoints 확인

```bash
# Service Endpoints 목록
kubectl get endpoints my-service -o wide

# Endpoints 상세 (NotReadyAddresses 확인)
kubectl get endpoints my-service -o yaml

# 특정 Pod가 Endpoints에 있는지 확인 (ready 주소가 없을 때도 에러 없이 동작하도록 null-safe 사용)
kubectl get endpoints my-service -o json | jq '.subsets[]?.addresses[]? | select(.ip=="10.0.1.100")'
```

### 6.2 ALB Target Group 상태 확인

```bash
# Target Group ARN 확인 (ARN은 기본 테이블에 표시되지 않으므로 custom-columns로 출력)
kubectl get targetgroupbindings -A -o custom-columns=NAMESPACE:.metadata.namespace,NAME:.metadata.name,ARN:.spec.targetGroupARN

# Target Health 확인
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --query 'TargetHealthDescriptions[*].[Target.Id,TargetHealth.State,TargetHealth.Reason]' \
  --output table

# 특정 Target 상세 (Reason 확인)
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=10.0.1.100,Port=8080
```

**주요 Reason 코드:**
- `Target.FailedHealthChecks`: Health Check 실패 (SG 차단·앱 응답 코드 불일치 등으로 체크 실패)
- `Target.Timeout`: Health Check 요청이 시간 내 응답 없음 (SG로 ALB→Pod 경로가 막힌 경우 포함)
- `Elb.RegistrationInProgress`: 등록 중
- `Target.DeregistrationInProgress`: 해제 중
- `Target.InvalidState`: 대상이 유효하지 않은 상태(예: 인스턴스가 stopped/terminated). SG 도달성 문제가 아니라 대상 자체의 상태 문제입니다.

### 6.3 AWS Load Balancer Controller 로그

```bash
# LBC 로그 (Health Check 관련)
kubectl logs -n kube-system deploy/aws-load-balancer-controller --tail=100 | grep -i health

# TargetGroupBinding 이벤트
kubectl describe targetgroupbindings -A

# Service 이벤트 (LoadBalancer 생성 과정)
kubectl describe svc my-service
```

### 6.4 Ingress-NGINX 디버깅

```bash
# Ingress 상태 확인
kubectl describe ingress my-ingress

# nginx-ingress-controller 로그
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100

# upstream 설정 확인 (특정 Pod에서)
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf | grep -A 20 "upstream"

# 실시간 액세스 로그
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=1 -f
```

### 6.5 Pod 상태 및 Probe 결과

```bash
# Pod 상태 및 Ready 조건 확인
kubectl get pods -o wide
kubectl describe pod my-app-7d8f9c-abcde

# Probe 실패 이벤트
kubectl get events --field-selector involvedObject.name=my-app-7d8f9c-abcde

# Pod IP 및 Container 상태
kubectl get pod my-app-7d8f9c-abcde -o json | jq '.status.podIP, .status.containerStatuses[]'
```

### 6.6 Security Group 검증

```bash
# Pod 로컬 애플리케이션 응답 확인 (loopback). ALB→대상 네트워크 경로는 거치지 않습니다.
kubectl exec my-app-7d8f9c-abcde -- curl -v http://localhost:8080/healthz

# ALB의 SG 경로 검증: 노드에서 Pod IP로 직접 요청하거나 describe-target-health로 확인합니다.
NODE_IP=$(kubectl get node <node-name> -o json | jq -r '.status.addresses[]? | select(.type=="InternalIP") | .address')
POD_IP=$(kubectl get pod my-app-7d8f9c-abcde -o json | jq -r '.status.podIP')
ssh ec2-user@$NODE_IP "curl -v http://$POD_IP:8080/healthz"

# Security Group 규칙 확인
aws ec2 describe-security-groups --group-ids sg-xxxxxxxx
```

---

## 7. 크로스 레퍼런스

### 관련 문서
- **[Pod 헬스체크 & 라이프사이클](../eks-pod-health-lifecycle.md)** — Probe 설정 상세, 언어별 Graceful Shutdown
- **[EKS 고가용성 아키텍처 가이드](../eks-resiliency-guide.md)** — PDB, Pod Readiness Gates, Zone-aware routing
- **[EKS 디버깅 가이드](./index.md)** — 전체 디버깅 워크플로우

### 외부 참고 자료
- [Kubernetes Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [AWS Load Balancer Controller Annotations](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.9/guide/service/annotations/)
- [Ingress-NGINX Configuration](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/)
- [Zero-downtime Deployments in Kubernetes](https://learnk8s.io/graceful-shutdown)

---

## 8. 요약 체크리스트

배포 전 Health Check 설정 점검:

- [ ] **경로 통일**: ALB/NLB Health Check 경로 = readinessProbe 경로
- [ ] **타이밍 설계**: Probe timeout < ALB HC timeout
- [ ] **Graceful Shutdown**: `preStop` hook + SIGTERM 핸들러 구현
- [ ] **종료 시퀀스**: `terminationGracePeriodSeconds > preStop_sleep + app_shutdown` (deregistration_delay는 LB에서 병렬 진행)
- [ ] **Rolling Update**: `minReadySeconds ≥ ALB HC interval × threshold`
- [ ] **고가용성**: PodDisruptionBudget 설정 (`minAvailable: 50%`)
- [ ] **Security Group**: ALB → Pod CIDR 트래픽 허용
- [ ] **Ingress Timeout**: 배치 API는 별도 Ingress로 분리

장애 발생 시 진단 순서:

1. `kubectl get pods` → Pod Ready 상태 확인
2. `kubectl get endpoints` → Service Endpoints 존재 여부
3. `aws elbv2 describe-target-health` → Target Group 상태 (ALB)
4. `kubectl logs -n kube-system deploy/aws-load-balancer-controller` → LBC 로그
5. `kubectl describe ingress` → Ingress 이벤트 (Ingress-NGINX)
6. Security Group 규칙 검증 → Pod CIDR 도달 가능 여부

---

**다음 단계**: [네트워킹 문제 해결](./networking.md) — Service Discovery, DNS, CNI 디버깅
