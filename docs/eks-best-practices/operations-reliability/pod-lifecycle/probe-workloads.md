---
title: 워크로드별 Probe 패턴
description: REST, gRPC, 배치, JVM, AI 워크로드별 예제를 확인합니다.
created: "2026-02-12"
last_update:
  date: "2026-09-17"
  author: YoungJoon Jeong
reading_time: 7
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: 워크로드별 Probe 패턴
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md) · [체크리스트와 참고 자료](./checklist-references.md)

## 워크로드별 Probe 패턴 {#24-워크로드별-probe-패턴}

이미지 이름과 헬스 엔드포인트는 예시입니다. 조직에서 검증한 이미지·설정으로 교체하고, Probe와 종료 시간을 실제 워크로드에서 측정하세요.

### 패턴 1: 웹 서비스 (REST API) {#패턴-1-웹-서비스-rest-api}

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rest-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rest-api
  template:
    metadata:
      labels:
        app: rest-api
    spec:
      containers:
      - name: api
        image: myapp/rest-api:v1.2.3
        ports:
        - containerPort: 8080
          protocol: TCP
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        # Startup Probe: 30초 이내 시작 완료 확인
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          failureThreshold: 6
          periodSeconds: 5
        # Liveness Probe: 내부 헬스체크만 (외부 의존성 제외)
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 0  # Startup Probe 사용 시 0으로 설정
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness Probe: 외부 의존성 포함 가능
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
          successThreshold: 1
        lifecycle:
          preStop:
            exec:
              command:
              - /bin/sh
              - -c
              - sleep 5
      terminationGracePeriodSeconds: 60
```

:::tip preStop에서 kill -TERM 1이 불필요한 이유
Kubernetes는 preStop Hook 완료 후 자동으로 컨테이너의 PID 1에 SIGTERM을 전송합니다. preStop에서 별도로 `kill -TERM 1`을 실행하면 SIGTERM이 중복 전송되며, PID 1이 init 프로세스(tini, dumb-init)인 경우 예상과 다르게 동작할 수 있습니다. SIGTERM 전송은 kubelet에 맡깁니다. 위 `sleep 5`는 트래픽 전파 지연을 가정한 예시이며, 실제 EndpointSlice·로드 밸런서 전파 시간을 측정해 필요 여부와 길이를 정하세요. preStop 실행 시간도 전체 종료 유예 시간에 포함됩니다.
:::

**헬스체크 엔드포인트 구현 (Node.js/Express):**

기존 Express 앱에 추가하는 부분 예제입니다. `app`, `db`, `redis`의 초기화와 의존성 호출의 타임아웃은 앱에서 구성해야 합니다. DB와 Redis가 요청 처리에 필수인지, 공통 장애가 모든 복제본을 동시에 제외시키는지 확인한 뒤 readiness에 포함하세요.

```javascript
// /healthz - Liveness: 애플리케이션 자체 상태만 확인
app.get('/healthz', (req, res) => {
  // 이벤트 루프가 응답하는지 확인하는 최소 예제입니다.
  // 순간 메모리 사용률이나 외부 서비스 장애를 재시작 조건으로 쓰지 않습니다.
  res.status(200).json({ status: 'ok' });
});

// /ready - Readiness: 외부 의존성 포함 확인
app.get('/ready', async (req, res) => {
  try {
    // DB 연결 확인
    await db.ping();
    // Redis 연결 확인
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', reason: err.message });
  }
});
```

### 패턴 2: gRPC 서비스 {#패턴-2-grpc-서비스}

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grpc-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grpc-service
  template:
    metadata:
      labels:
        app: grpc-service
    spec:
      containers:
      - name: grpc-server
        image: myapp/grpc-service:v2.1.0
        ports:
        - containerPort: 9090
          name: grpc
        resources:
          requests:
            cpu: 300m
            memory: 512Mi
          limits:
            cpu: 1
            memory: 1Gi
        # gRPC native probe (K8s 1.27+)
        startupProbe:
          grpc:
            port: 9090
            service: myapp.HealthService  # 선택 사항
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          grpc:
            port: 9090
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          grpc:
            port: 9090
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
      terminationGracePeriodSeconds: 45
```

**gRPC Health Check 구현 (Go):**

```go
package main

import (
    "log"
    "net"
    "google.golang.org/grpc"
    "google.golang.org/grpc/health"
    "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
    server := grpc.NewServer()

    // Health 서비스 등록
    healthServer := health.NewServer()
    grpc_health_v1.RegisterHealthServer(server, healthServer)

    // 서비스를 SERVING 상태로 설정
    healthServer.SetServingStatus("myapp.HealthService", grpc_health_v1.HealthCheckResponse_SERVING)

    // 의존성 체크 후 NOT_SERVING으로 변경 가능
    // healthServer.SetServingStatus("myapp.HealthService", grpc_health_v1.HealthCheckResponse_NOT_SERVING)

    // gRPC 서버 시작
    lis, err := net.Listen("tcp", ":9090")
    if err != nil {
        log.Fatal(err)
    }
    if err := server.Serve(lis); err != nil {
        log.Fatal(err)
    }
}
```

### 패턴 3: 워커/배치 처리 {#패턴-3-워커배치-처리}

배치 워커는 HTTP 서버가 없으므로 `exec` Probe를 사용합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: batch-worker
  template:
    metadata:
      labels:
        app: batch-worker
    spec:
      containers:
      - name: worker
        image: myapp/batch-worker:v3.0.1
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2
            memory: 4Gi
        # Startup Probe: 워커 초기화 확인
        startupProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - test -f /tmp/worker-ready
          failureThreshold: 12
          periodSeconds: 5
        # Liveness Probe: 하트비트 파일 확인
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - find /tmp/heartbeat -mmin -2 | grep -q heartbeat
          initialDelaySeconds: 10
          periodSeconds: 30
          failureThreshold: 3
        # Readiness Probe: 작업 큐 연결 확인
        readinessProbe:
          exec:
            command:
            - /app/check-queue-connection.sh
          periodSeconds: 10
          failureThreshold: 3
      terminationGracePeriodSeconds: 120
```

**워커 애플리케이션 (Python):**

```python
import os
import time
from pathlib import Path

HEARTBEAT_FILE = Path("/tmp/heartbeat")
READY_FILE = Path("/tmp/worker-ready")

def worker_loop():
    # 초기화 완료 시그널
    READY_FILE.touch()

    while True:
        # 주기적으로 하트비트 업데이트
        HEARTBEAT_FILE.touch()

        # 작업 처리
        process_jobs()
        time.sleep(5)

def process_jobs():
    # 실제 작업 로직
    pass

if __name__ == "__main__":
    worker_loop()
```

### 패턴 4: 느린 시작 앱 (Spring Boot, JVM) {#패턴-4-느린-시작-앱-spring-boot-jvm}

JVM 애플리케이션은 시작 시간이 30초 이상 소요될 수 있습니다. Startup Probe로 보호합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 4
  selector:
    matchLabels:
      app: spring-boot
  template:
    metadata:
      labels:
        app: spring-boot
    spec:
      containers:
      - name: app
        image: myapp/spring-boot:v2.7.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 1
            memory: 2Gi
          limits:
            cpu: 2
            memory: 4Gi
        env:
        - name: JAVA_OPTS
          value: "-Xms1g -Xmx3g"
        # Startup Probe: 최대 5분(30 x 10s) 대기
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          failureThreshold: 30
          periodSeconds: 10
        # Liveness Probe: Startup 성공 후 활성화
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness Probe: 외부 의존성 포함
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
      terminationGracePeriodSeconds: 60
```

**Spring Boot Actuator 설정:**

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
```

### 패턴 5: 사이드카 패턴 (Istio Proxy + 앱) {#패턴-5-사이드카-패턴-istio-proxy--앱}

사이드카 패턴에서는 메인 컨테이너와 사이드카 모두에 Probe를 설정합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-sidecar
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      # 메인 애플리케이션 컨테이너
      - name: app
        image: myapp/app:v1.0.0
        ports:
        - containerPort: 8080
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          failureThreshold: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
      # Istio 사이드카 (자동 주입 시 Istio가 Probe 추가)
      # 수동 설정 예시:
      - name: istio-proxy
        image: istio/proxyv2:1.22.0
        ports:
        - containerPort: 15090
          name: http-envoy-prom
        startupProbe:
          httpGet:
            path: /healthz/ready
            port: 15021
          failureThreshold: 30
          periodSeconds: 1
        livenessProbe:
          httpGet:
            path: /healthz/ready
            port: 15021
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthz/ready
            port: 15021
          periodSeconds: 2
      terminationGracePeriodSeconds: 90
```

:::tip Istio Sidecar Injection
Istio가 자동 주입을 사용하는 경우 (`istio-injection=enabled` 레이블), Istio가 사이드카에 적절한 Probe를 자동으로 추가합니다. 수동 설정은 불필요합니다.
:::

### Native Sidecar Containers (K8s 1.33 Stable) {#native-sidecar-containers-k8s-128-ga}

[Native Sidecar Container](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/)는 Kubernetes 1.28에서 처음 도입되었고, 1.29부터 기본 활성화되었으며, 1.33에서 Stable이 되었습니다. 이 기능은 Init Container에 `restartPolicy: Always`를 설정하여 사이드카로 동작시키는 공식 기능입니다. 이를 통해 기존 사이드카 패턴의 **종료 순서 문제**를 해결합니다.

**기존 문제**: 일반 사이드카는 메인 컨테이너와 동시에 SIGTERM을 수신하므로, Istio proxy가 먼저 종료되면 메인 앱의 네트워크가 끊기는 문제가 발생합니다.

**Native Sidecar 해결**: Init Container로 정의된 사이드카는 모든 일반 컨테이너가 종료된 **후에** 종료됩니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-native-sidecar
spec:
  selector:
    matchLabels:
      app: "app-with-native-sidecar"
  template:
    metadata:
      labels:
        app: "app-with-native-sidecar"
    spec:
      initContainers:
      # Native Sidecar: 메인 컨테이너보다 먼저 시작, 나중에 종료
      - name: log-collector
        image: ghcr.io/your-org/log-collector:replace-with-tested-tag
        restartPolicy: Always  # 이 설정이 Native Sidecar로 동작하게 함
        ports:
        - containerPort: 2020
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
      containers:
      - name: app
        image: myapp:v1
        ports:
        - containerPort: 8080
```

**종료 순서 보장:**
1. 일반 컨테이너(app)에 SIGTERM 전송
2. 일반 컨테이너 종료 완료 대기
3. Native Sidecar(log-collector)에 SIGTERM 전송
4. Native Sidecar 종료

이 패턴은 Istio 사이드카, 로그 수집기, 모니터링 에이전트 등 메인 앱보다 오래 살아있어야 하는 보조 컨테이너에 적합합니다.

### Windows 컨테이너 Probe 고려사항 {#246-windows-컨테이너-probe-고려사항}

EKS는 Windows Server 2019/2022 기반 Windows 노드를 지원하며, Windows 컨테이너는 Linux 컨테이너와 다른 Probe 동작 특성을 가집니다.

#### Windows vs Linux Probe 동작 차이 {#windows-vs-linux-probe-동작-차이}

| 항목 | Linux 컨테이너 | Windows 컨테이너 | 영향 |
|------|---------------|-----------------|------|
| **컨테이너 런타임** | containerd | containerd (1.6+) | 동일한 런타임, 다른 OS 레이어 |
| **exec Probe 실행** | `/bin/sh -c` | `cmd.exe /c` 또는 `powershell.exe` | 스크립트 문법 차이 |
| **httpGet Probe** | 동일 | 동일 | 차이 없음 |
| **tcpSocket Probe** | 동일 | 동일 | 차이 없음 |
| **콜드 스타트 시간** | 빠름 (수초) | 느림 (10-30초) | Startup Probe failureThreshold 증가 필요 |
| **메모리 오버헤드** | 낮음 (50-100MB) | 높음 (200-500MB) | 리소스 요청 증가 필요 |
| **Probe 타임아웃** | 일반적으로 1-5초 | 3-10초 권장 | Windows I/O 지연 고려 |

#### Windows 워크로드 Probe 설정 예시 {#windows-워크로드-probe-설정-예시}

**IIS/.NET Framework 앱:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iis-app
  namespace: windows-workloads
spec:
  replicas: 2
  selector:
    matchLabels:
      app: iis-app
  template:
    metadata:
      labels:
        app: iis-app
    spec:
      nodeSelector:
        kubernetes.io/os: windows
        kubernetes.io/arch: amd64
      containers:
      - name: iis
        image: mcr.microsoft.com/windows/servercore/iis:windowsservercore-ltsc2022
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
        # Startup Probe: Windows 콜드 스타트 고려
        startupProbe:
          httpGet:
            path: /
            port: 80
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 12  # Linux 대비 2배 (최대 60초)
          successThreshold: 1
        # Liveness Probe: IIS 프로세스 상태
        livenessProbe:
          httpGet:
            path: /healthz
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness Probe: ASP.NET 앱 준비 상태
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 3
          successThreshold: 1
      terminationGracePeriodSeconds: 60
```

**ASP.NET Core 헬스체크 엔드포인트 구현:**

```csharp
// Program.cs (ASP.NET Core 6+)
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// 헬스체크 추가
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy())
    .AddSqlServer(
        connectionString: builder.Configuration.GetConnectionString("DefaultConnection"),
        name: "sqlserver",
        tags: new[] { "ready" }
    );

var app = builder.Build();

// /healthz - Liveness: 애플리케이션 자체만
app.MapHealthChecks("/healthz", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("self") || check.Tags.Count == 0
});

// /ready - Readiness: 외부 의존성 포함
app.MapHealthChecks("/ready", new HealthCheckOptions
{
    Predicate = _ => true  // 모든 헬스체크
});

app.Run();
```

#### Windows 워크로드 Probe 타임아웃 주의사항 {#windows-워크로드-probe-타임아웃-주의사항}

Windows 컨테이너는 다음 이유로 Probe 타임아웃이 길어질 수 있습니다:

1. **Windows 커널 오버헤드**: Windows의 무거운 OS 레이어로 인한 시스템 콜 지연
2. **디스크 I/O 성능**: NTFS 파일시스템의 메타데이터 오버헤드
3. **.NET Framework 워밍업**: CLR JIT 컴파일 및 어셈블리 로딩 시간
4. **Windows Defender**: 실시간 스캔으로 인한 프로세스 시작 지연

**Probe 타이밍 예시 (Windows):**

아래는 컨테이너 설정에 합치는 부분 예제입니다. 숫자는 측정 후 조정해야 하며, `5-10` 같은 범위 문자열은 Kubernetes 정수 필드에 사용할 수 없습니다. 헬스 엔드포인트도 앱에 맞게 변경하세요.

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 5
  periodSeconds: 5
  failureThreshold: 12

livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 5
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  timeoutSeconds: 5
  periodSeconds: 5
  failureThreshold: 3
```

#### CloudWatch Container Insights for Windows (2025-08) {#cloudwatch-container-insights-for-windows-2025-08}

AWS는 2025년 8월에 Windows 워크로드용 CloudWatch Container Insights 지원을 발표했습니다.

**Windows 노드에 Container Insights 설치:**

```bash
# CloudWatch Agent ConfigMap (Windows)
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig-windows
  namespace: amazon-cloudwatch
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "cluster_name": "my-eks-cluster",
            "metrics_collection_interval": 60
          }
        }
      },
      "metrics": {
        "namespace": "ContainerInsights",
        "metrics_collected": {
          "statsd": {
            "service_address": ":8125"
          }
        }
      }
    }
EOF

# Windows DaemonSet 배포
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-daemonset-windows.yaml
```

**Container Insights 메트릭 확인:**

```bash
# Windows 노드 메트릭
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name node_memory_utilization \
  --dimensions Name=ClusterName,Value=my-eks-cluster Name=NodeName,Value=windows-node-1 \
  --start-time 2026-02-12T00:00:00Z \
  --end-time 2026-02-12T23:59:59Z \
  --period 300 \
  --statistics Average

# Windows Pod 메트릭
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name pod_cpu_utilization \
  --dimensions Name=ClusterName,Value=my-eks-cluster Name=Namespace,Value=windows-workloads \
  --start-time 2026-02-12T00:00:00Z \
  --end-time 2026-02-12T23:59:59Z \
  --period 60 \
  --statistics Average
```

#### 혼합 클러스터 (Linux + Windows) 통합 모니터링 전략 {#혼합-클러스터-linux--windows-통합-모니터링-전략}

**1. 노드 셀렉터 기반 분리:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: unified-app
spec:
  selector:
    app: unified-app  # OS 무관
  ports:
  - port: 80
    targetPort: 8080
---
# Linux Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unified-app-linux
spec:
  replicas: 3
  selector:
    matchLabels:
      app: unified-app
      os: linux
  template:
    metadata:
      labels:
        app: unified-app
        os: linux
    spec:
      nodeSelector:
        kubernetes.io/os: linux
      containers:
      - name: app
        image: myapp:linux-v1
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
---
# Windows Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unified-app-windows
spec:
  replicas: 2
  selector:
    matchLabels:
      app: unified-app
      os: windows
  template:
    metadata:
      labels:
        app: unified-app
        os: windows
    spec:
      nodeSelector:
        kubernetes.io/os: windows
      containers:
      - name: app
        image: myapp:windows-v1
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 10      # Windows: 더 긴 간격
          timeoutSeconds: 10     # Windows: 더 긴 타임아웃
```

**2. CloudWatch Logs Insights 통합 쿼리:**

```sql
-- Linux와 Windows Pod 로그를 동시에 검색
fields @timestamp, kubernetes.namespace_name, kubernetes.pod_name, kubernetes.host, @message
| filter kubernetes.labels.app = "unified-app"
| sort @timestamp desc
| limit 100
```

**3. Grafana 대시보드 통합:**

```promql
# Prometheus Query (혼합 클러스터)
# Linux + Windows Pod CPU 사용률
sum(rate(container_cpu_usage_seconds_total{namespace="default", pod=~"unified-app-.*"}[5m])) by (pod, node, os)

# OS별 집계
sum(rate(container_cpu_usage_seconds_total{namespace="default", pod=~"unified-app-.*"}[5m])) by (os)
```

:::warning Windows 컨테이너 제약사항
- **이미지 크기**: Windows 이미지는 수 GB (Linux는 수십 MB)
- **라이선스 비용**: Windows Server 라이선스 비용 발생 (EC2 인스턴스 비용에 포함)
- **노드 부팅 시간**: Windows 노드는 부팅이 느림 (5-10분)
- **특권 컨테이너**: Windows는 Linux의 `privileged` 모드 미지원
- **HostProcess 컨테이너**: Windows Server 2022 (1.22+)부터 지원
:::

:::info 참고 자료
- [AWS Blog: CloudWatch Container Insights for Windows](https://aws.amazon.com/blogs/mt/announcing-amazon-cloudwatch-container-insights-for-amazon-eks-windows-workloads-monitoring)
- [EKS Windows 컨테이너 공식 문서](https://docs.aws.amazon.com/eks/latest/userguide/windows-support.html)
- [Kubernetes Windows 컨테이너 가이드](https://kubernetes.io/docs/concepts/windows/)
:::
