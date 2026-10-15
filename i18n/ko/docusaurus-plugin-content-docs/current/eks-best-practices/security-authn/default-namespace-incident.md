---
title: EKS Default Namespace 삭제 시 장애 대응 가이드
description: EKS 클러스터에서 default namespace 삭제로 인한 Control Plane 접근 불가 장애의 원인 분석, 복구 절차, 그리고 재발 방지 전략을 다룹니다.
created: "2025-01-07"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 23
tags:
  - eks
  - security
  - incident-response
  - namespace
  - troubleshooting
  - scope:ops
sidebar_label: Default Namespace 장애
category: security-compliance
---

## 1. 개요 (TL;DR)

:::danger Critical Alert
이 문서는 `default` namespace가 실제로 삭제된 예외적 상황을 가정한 사고 대응·가설 점검 가이드입니다. 일반적인 클러스터에서는 Kubernetes의 내장 `NamespaceLifecycle` admission 플러그인이 `default`·`kube-system`·`kube-public` namespace의 삭제 요청을 거부하므로, `kubectl delete ns default`는 정상 설정에서 거부되는 것이 기대 동작입니다. 따라서 kubectl 연결 실패를 관찰했다고 해서 곧바로 default namespace가 삭제되었다고 단정하지 말고, 네트워크·인증·API 상태를 먼저 진단해야 합니다. 만약 admission 통제가 약화된 환경에서 실제로 삭제가 일어났다면 클러스터 내부 `kubernetes` Service가 함께 삭제되어 **클러스터 내부에서의** API Server 접근 경로가 사라질 수 있습니다. EKS가 kubectl에 제공하는 외부 API 엔드포인트는 이 in-cluster Service와 별개로 관리됩니다. 재발 방지를 위해 Admission Controller 등 접근 통제로 Critical 리소스를 보호할 것을 강력히 권장합니다.
:::

- **가정하는 사고**: admission 통제가 약화된 환경에서 `default` namespace가 삭제되어 in-cluster `kubernetes` Service가 함께 삭제된 경우
- **영향 범위(해당 사고 발생 시)**: 클러스터 내부 컴포넌트의 API Server 접근 경로 손실 → 클러스터 내부 관리 저하 → (장기화 시) 서비스 영향
- **복구 방법**: 먼저 아래 진단 절차로 원인을 확인하고, 권한 있는 운영자가 복구할 수 없는 경우에 한해 **AWS Support 케이스를 오픈**

:::tip 복구 방법 한 줄 요약
먼저 아래 진단 절차로 원인(네트워크·인증·API 상태, namespace 실제 삭제 여부)을 확인하세요. 권한 있는 운영자가 EKS access API나 기존 생성자 권한으로 복구할 수 없는 경우에 한해, AWS Support에 케이스를 오픈하고 Account Team과 WWSO Specialist를 티켓에 참조로 추가하여 복구를 요청하세요.
:::

---

## 2. 장애 원인 분석

### 2.1 Default Namespace의 역할

`default` namespace는 단순히 사용자 워크로드를 배포하는 기본 공간이 아닙니다. Kubernetes 클러스터의 핵심 리소스들이 이 namespace에 존재합니다.

**default namespace에 포함된 핵심 리소스**:

:::warning 주의
`kubernetes` Service는 클러스터 **내부**에서 API Server에 접근할 때 사용하는 ClusterIP 경로입니다. 이 Service가 삭제되면 in-cluster 클라이언트(예: ServiceAccount 토큰을 쓰는 컴포넌트)가 ClusterIP로 Control Plane과 통신하지 못할 수 있습니다. 다만 EKS가 kubectl·AWS CLI에 제공하는 외부 API 엔드포인트는 이 in-cluster Service와 별개로 관리되므로, 외부에서의 접근 가능 여부는 별도로 확인해야 합니다.
:::

### 2.2 장애 발생 메커니즘

`default` namespace 삭제 시 발생하는 연쇄적인 장애 과정을 다이어그램으로 살펴보겠습니다.

```mermaid
flowchart TD
    A["🗑️ default namespace 삭제<br/>(kubectl delete ns default)"] --> B["kubernetes Service 삭제"]
    B --> C["API Server endpoint 접근 불가"]
    C --> D["kubectl 명령어 실행 불가"]
    D --> E["클러스터 관리 완전 불가"]

    E --> F["❌ Velero 백업 복구 불가"]
    E --> G["❌ etcd 스냅샷 복구 불가"]
    E --> H["❌ GitOps 재배포 불가"]

    style A fill:#ff6b6b,color:#fff
    style B fill:#ff8c42,color:#fff
    style C fill:#ff8c42,color:#fff
    style D fill:#ff6b6b,color:#fff
    style E fill:#cc0000,color:#fff
    style F fill:#666,color:#fff
    style G fill:#666,color:#fff
    style H fill:#666,color:#fff
```

**장애 발생 순서**:

1. **namespace 삭제 명령 실행**: `kubectl delete namespace default`
2. **Cascading 삭제**: namespace 내 모든 리소스가 함께 삭제됨
3. **kubernetes Service 삭제**: API Server endpoint가 사라짐
4. **연결 단절**: 클러스터 내부 컴포넌트들이 API Server와 통신 불가
5. **관리 불가 상태**: 어떤 kubectl 명령어도 실행할 수 없음

### 워커 노드에 미치는 영향

API Server endpoint가 사라진 상태가 지속되면 워커 노드에도 연쇄적인 영향이 발생합니다.

```mermaid
flowchart TD
    A["kubernetes Service 삭제"] --> B["kubelet → API Server 통신 불가"]
    B --> C["Node Lease 갱신 실패<br/>(kube-node-lease)"]
    C --> D["하트비트 유예(기본 약 50초, 버전·설정에 따라 다름) 경과"]
    D --> E["노드 Ready 컨디션 Unknown"]
    E --> F["Node Controller가 taint 추가<br/>(API 접근이 유지되는 경우)"]
    F --> G["node.kubernetes.io/not-ready:NoExecute"]
    F --> H["node.kubernetes.io/unreachable:NoExecute"]
    G --> I["Pod는 기본 NoExecute toleration(기본 300초) 경과 후 축출 대상"]
    H --> I

    style A fill:#ff6b6b,color:#fff
    style D fill:#ff8c42,color:#fff
    style F fill:#ff8c42,color:#fff
    style I fill:#cc0000,color:#fff
```

**시간에 따른 노드 상태 변화**:

:::warning 중요
위 전이는 Control Plane의 API Server가 정상 동작하고 Node Controller가 노드 상태를 갱신할 수 있을 때의 노드 연결 끊김(node-disconnection) 동작입니다. 반대로 Control Plane 자체에 접근·동작이 불가능한 경우에는 Node Controller가 노드 상태를 갱신하거나 taint를 추가하는 작업 자체를 수행하지 못하므로, 위 taint·축출 전이는 일어나지 않습니다. 이 경우 기존에 실행 중인 Pod는 노드에서 계속 동작하지만, 새로운 스케줄링이나 상태 변경은 반영되지 않습니다. 두 경우를 구분해 진단해야 합니다.
:::

### Frozen 상태에서의 서비스 영향

클러스터가 frozen 상태에 빠지면 **기존 워크로드는 일정 시간 동안 계속 동작**하지만, 시간이 경과할수록 서비스에 심각한 영향이 발생합니다.

**즉시 영향받는 부분**:

- ❌ 새로운 Pod 스케줄링 불가
- ❌ Pod 재시작/재배포 불가
- ❌ ConfigMap, Secret 변경 반영 불가
- ❌ HPA(Horizontal Pod Autoscaler) 스케일링 불가

**시간 경과에 따른 서비스 영향**:

:::danger 특히 위험한 시나리오

- DNS 캐시가 만료되거나 TLS 인증서 만료시 서비스 디스커버리 실패로 인한 통신 불가
- Pod가 OOMKilled 되거나 crash 되면, 노드가 정상이고 kubelet이 동작하는 한 컨테이너는 restartPolicy에 따라 **로컬에서 재시작**됩니다. 다만 API 접근이 끊긴 상태에서는 새 Pod 생성·교체나 다른 노드로의 재스케줄링은 이뤄지지 않습니다
- 노드가 장애나면 해당 노드의 **모든 워크로드 손실**(다른 노드로 재스케줄링 불가)
- ALB/NLB Target Group 업데이트 불가로 **트래픽 라우팅 실패**

시간이 지날수록 장애 범위가 확대되므로, **가능한 빨리 AWS Support에 연락**하는 것이 중요합니다.
:::

---

## 3. 장애 대응 절차

### Step 1: 장애 상황 확인

`default` namespace 삭제로 인한 장애가 의심되면, 먼저 클러스터 상태를 확인해야 합니다.

### 1-1. kubectl 접근 테스트

가장 먼저 kubectl 명령어가 정상 작동하는지 확인합니다.

```bash
# 클러스터 정보 조회 시도
kubectl cluster-info

# 예상되는 에러 메시지
# Unable to connect to the server: dial tcp: lookup kubernetes on 10.100.0.10:53: no such host
# 또는
# The connection to the server <cluster-endpoint> was refused
```

:::warning 주의
위와 같은 에러가 발생하면 kubernetes Service가 삭제되어 API Server에 접근할 수 없는 상태입니다.
:::

### 1-2. AWS CLI로 클러스터 상태 확인

kubectl이 작동하지 않더라도 AWS CLI를 통해 EKS 클러스터의 상태를 확인할 수 있습니다.

```bash
# 클러스터 상태 확인
aws eks describe-cluster \
  --name <cluster-name> \
  --query 'cluster.{Name:name,Status:status,Endpoint:endpoint,Version:version}' \
  --output table

# 예상 출력 (클러스터 자체는 ACTIVE 상태)
# -------------------------------------------------------------------
# |                        DescribeCluster                          |
# +----------+------------------------------------------------------+
# |  Name    |  my-eks-cluster                                      |
# |  Status  |  ACTIVE                                              |
# |  Endpoint|  https://XXXXX.gr7.ap-northeast-2.eks.amazonaws.com  |
# |  Version |  1.31                                                |
# +----------+------------------------------------------------------+
```

```bash
# 노드 그룹 상태 확인
aws eks list-nodegroups --cluster-name <cluster-name>

aws eks describe-nodegroup \
  --cluster-name <cluster-name> \
  --nodegroup-name <nodegroup-name> \
  --query 'nodegroup.{Name:nodegroupName,Status:status,DesiredSize:scalingConfig.desiredSize}' \
  --output table
```

### 1-3. 장애 상황 판단 기준

:::tip 핵심 포인트
AWS 콘솔이나 CLI에서 클러스터는 ACTIVE 상태로 보이지만, kubectl 명령어가 전혀 작동하지 않는다면 default namespace 삭제를 의심해야 합니다.
:::

✅ **체크포인트**: 위 증상이 확인되면 즉시 **Step 2: AWS Support 케이스 오픈**으로 진행하세요.

### Step 2: AWS Support 케이스 오픈

아래 진단으로 권한 있는 운영자가 복구할 수 없다고 확인된 경우, AWS Support를 통한 복구가 필요합니다. 그런 경우 즉시 케이스를 오픈하세요.

### 2-1. 케이스 오픈 정보

케이스를 오픈하기 전에 아래 정보를 준비합니다.

- 클러스터 이름, 리전, AWS 계정 ID, Kubernetes 버전
- 서비스: Elastic Kubernetes Service (EKS)
- 카테고리: Cluster Issue
- 심각도: 입증된 비즈니스 영향에 맞는 값(최고 심각도는 가입 플랜에서 지원하는 경우 선택)
- 영향 범위와 발생 시각, 이미 수행한 진단 결과(아래 2-2 템플릿에 기입)

### 2-2. 케이스 본문 템플릿

아래 템플릿을 복사하여 케이스 본문에 붙여넣으세요.

```text
[긴급] EKS 클러스터 default namespace 삭제로 인한 Control Plane 접근 불가

■ 클러스터 정보
- Cluster Name: <클러스터 이름>
- Region: <리전>
- Account ID: <AWS 계정 ID>
- Cluster Version: <Kubernetes 버전>

■ 장애 상황
- 발생 시각: <YYYY-MM-DD HH:MM KST>
- 증상: default namespace 삭제 후 kubectl 명령어 실행 불가
- 영향 범위: 클러스터 전체 관리 불가

■ 확인된 사항
- AWS CLI로 클러스터 상태 확인: ACTIVE
- kubectl cluster-info 실행 결과: 연결 실패
- kubectl get ns default 실행 결과: 연결 실패

■ 요청 사항
default namespace 및 kubernetes Service 복구를 요청드립니다.
프로덕션 환경으로 긴급 복구가 필요합니다.

■ 연락처
- 담당자: <이름>
- 전화번호: <연락처>
- 이메일: <이메일>
```

### 2-3. AWS 콘솔에서 케이스 오픈 방법

1. AWS Support Center 접속
2. **Create case** 클릭
3. **Technical** 선택
4. Service: **Elastic Kubernetes Service (EKS)** 선택
5. Category: **Cluster Issue** 선택
6. Severity: 입증된 비즈니스 영향에 맞는 심각도를 선택합니다. 최고 심각도(예: "Business-critical system down")는 Business Support 이상, Enterprise Support, Unified Operations 플랜에서 선택할 수 있습니다(플랜별 지원 범위는 변동될 수 있으니 가입한 플랜의 현재 지원 조건을 확인하세요). 심각도는 플랜 종류가 아니라 실제 영향 수준에 따라 선택합니다
7. 위 템플릿을 본문에 붙여넣기
8. Contact options에서 **Phone** 선택 (빠른 응답)
9. **Submit** 클릭

:::warning 중요
케이스 오픈 후 케이스 ID를 반드시 기록해두세요. Account Team과 WWSO Specialist에게 연락할 때 필요합니다.
:::

### Step 3: Account Team/WWSO Specialist 연락

AWS Support 케이스 오픈과 동시에 Account Team과 WWSO(Worldwide Specialist Organization) Specialist에게 연락하여 복구 속도를 높이세요.

### 3-1. 티켓에 참조 추가

AWS Support 케이스에 Account Team과 WWSO Specialist를 참조로 추가합니다.

1. 오픈한 케이스의 **Correspondence** 섹션으로 이동
2. **Reply** 버튼 클릭
3. 아래 내용을 추가하여 참조 요청

```text
CC 요청:
- AWS Account Team: <Account Manager 이름/이메일>
- WWSO EKS Specialist: <Specialist 이름/이메일 (알고 있는 경우)>

긴급 복구가 필요한 프로덕션 환경입니다.
Account Team과 EKS Specialist의 지원을 요청드립니다.
```

### 3-2. Account Team 직접 연락

AWS Support 케이스와 별도로 Account Team에게 직접 연락합니다.

**이메일 템플릿**:

```text
제목: [긴급] EKS 클러스터 장애 - Support Case #<케이스 ID>

안녕하세요,

프로덕션 EKS 클러스터에서 긴급 장애가 발생하여 연락드립니다.

■ 장애 요약
- 클러스터: <클러스터 이름>
- 증상: default namespace 삭제로 인한 Control Plane 접근 불가
- Support Case ID: <케이스 ID>

■ 요청 사항
해당 케이스의 우선순위 상향 및 EKS Specialist 연결을 요청드립니다.

감사합니다.
<이름>
<연락처>
```

**Slack/SMS 메시지** (Account Team 채널이 있는 경우):

```text
🚨 [긴급] EKS 클러스터 장애 발생

- Account: <계정 ID>
- Cluster: <클러스터 이름>
- Issue: default namespace 삭제로 Control Plane 접근 불가
- Support Case: #<케이스 ID>

프로덕션 환경으로 긴급 지원 요청드립니다.
```

### 3-3. WWSO Specialist 연락

WWSO EKS Specialist를 알고 있다면 직접 연락합니다. 스페셜리스트에게 연락을 하게 되면 내부 티켓을 활용하여 티켓의 중요도를 상승 시키고, 인터널 파이프라인을 통해서 할당된 엔지니어에게 직접 작업 요청을 전달 합니다.

### 3-4. 연락 체크리스트

연락이 완료되었는지 다음 항목을 확인합니다.

- Support 케이스 ID를 기록했는가
- Account Team(Account Manager)에게 케이스 ID와 함께 연락했는가
- 아는 경우 WWSO EKS Specialist에게 연락했는가
- 케이스 Correspondence에 Account Team/Specialist를 참조로 추가했는가
- 긴급 연락 가능한 담당자 연락처를 케이스에 기재했는가

### Step 4: 복구 후 검증

AWS Support를 통해 `default` namespace가 복구되면, 클러스터가 정상적으로 작동하는지 검증합니다.

### 4-1. 기본 연결 검증

```bash
# 1. 클러스터 연결 확인
kubectl cluster-info

# 예상 출력:
# Kubernetes control plane is running at https://XXXXX.gr7.ap-northeast-2.eks.amazonaws.com
# CoreDNS is running at https://XXXXX.gr7.ap-northeast-2.eks.amazonaws.com/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

```bash
# 2. default namespace 존재 확인
kubectl get namespace default

# 예상 출력:
# NAME      STATUS   AGE
# default   Active   <시간>
```

```bash
# 3. kubernetes Service 확인
kubectl get svc kubernetes -n default

# 예상 출력:
# NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
# kubernetes   ClusterIP   10.100.0.1   <none>        443/TCP   <시간>
```

### 4-2. 핵심 컴포넌트 상태 검증

```bash
# 4. 노드 상태 확인
kubectl get nodes

# 모든 노드가 Ready 상태인지 확인
```

```bash
# 5. 시스템 Pod 상태 확인
kubectl get pods -n kube-system

# 모든 Pod이 Running 상태인지 확인
# 특히 coredns, kube-proxy, aws-node 확인
```

```bash
# 6. 모든 namespace 확인
kubectl get namespaces

# default, kube-system, kube-public, kube-node-lease 존재 확인
```

### 4-3. API Server 기능 검증

```bash
# 7. API 리소스 조회 테스트
kubectl api-resources | head -20

# 8. 간단한 리소스 생성/삭제 테스트 (선택사항)
kubectl run test-pod --image=nginx --restart=Never -n default
kubectl get pod test-pod -n default
kubectl delete pod test-pod -n default
```

✅ **검증 체크리스트**:

- `kubectl cluster-info`가 정상 응답하는가
- `default` namespace가 Active 상태인가
- `kubernetes` Service(ClusterIP 10.100.0.1 등)가 존재하는가
- 모든 노드가 Ready 상태인가
- kube-system의 coredns·kube-proxy·aws-node Pod가 Running인가
- `default`·`kube-system`·`kube-public`·`kube-node-lease` namespace가 모두 존재하는가

### Step 5: 워크로드 점검

복구 후 기존 워크로드들이 정상적으로 동작하는지 점검합니다.

### 5-1. 워크로드 상태 점검

```bash
# 1. 모든 namespace의 Pod 상태 확인
kubectl get pods --all-namespaces | grep -v Running | grep -v Completed

# Running, Completed 상태가 아닌 Pod 확인
```

```bash
# 2. Deployment 상태 확인
kubectl get deployments --all-namespaces

# READY 컬럼에서 원하는 replica 수와 실제 수가 일치하는지 확인
```

```bash
# 3. StatefulSet 상태 확인
kubectl get statefulsets --all-namespaces
```

```bash
# 4. DaemonSet 상태 확인
kubectl get daemonsets --all-namespaces

# DESIRED와 READY 수가 일치하는지 확인
```

### 5-2. 서비스 연결 점검

```bash
# 5. Service 및 Endpoints 확인
kubectl get svc --all-namespaces
kubectl get endpoints --all-namespaces

# Endpoints에 IP가 정상적으로 할당되어 있는지 확인
```

```bash
# 6. Ingress 상태 확인 (사용하는 경우)
kubectl get ingress --all-namespaces
```

### 5-3. 스토리지 점검

```bash
# 7. PersistentVolumeClaim 상태 확인
kubectl get pvc --all-namespaces

# 모든 PVC가 Bound 상태인지 확인
```

```bash
# 8. PersistentVolume 상태 확인
kubectl get pv

# 모든 PV가 Bound 상태인지 확인
```

### 5-4. 이벤트 및 로그 확인

```bash
# 9. 최근 Warning 이벤트 확인
kubectl get events --all-namespaces --field-selector type=Warning --sort-by='.lastTimestamp' | tail -20
```

```bash
# 10. 문제가 있는 Pod의 로그 확인
kubectl logs <pod-name> -n <namespace> --tail=100
```

### 5-5. 워크로드 점검 체크리스트

:::tip
장애 발생 시간 동안 완료되지 못한 Job이나 CronJob이 있을 수 있습니다. 아래 명령은 성공 Pod가 0인 Job(아직 실행 중이거나 새로 생성된 Job 포함)을 선택하므로, 그대로 "실패한 Job"으로 간주하지 마세요. 재실행 전에 각 Job의 Failed 컨디션과 `status.failed`, 완료(completion) 상태를 확인하여 중복 실행을 피하세요.
:::

```bash
# 성공 Pod가 0인 Job 확인 (실패가 아니라 '미완료/0-성공' Job을 선택함)
kubectl get jobs --all-namespaces --field-selector status.successful=0
```

✅ **최종 체크포인트**: 모든 워크로드가 정상 상태로 확인되면 장애 대응이 완료됩니다. 이후 **재발 방지 대책**을 검토하세요.

---

## 4. Critical 리소스 목록

### 4.1 Critical Namespaces

`default` namespace 외에도 삭제 시 클러스터에 치명적인 영향을 주는 시스템 namespace들이 있습니다. 이러한 namespace들은 절대로 삭제해서는 안 됩니다.

:::danger Critical Warning
`default`와 `kube-system` namespace가 실제로 삭제되면 kubectl 접근이 어려워 수동 복구가 제한됩니다. 접근만 막힌 경우(aws-auth 손상 등)에는 생성자 권한이나 EKS access entry로 복구를 시도하고, 이런 경로로 복구할 수 없는 namespace 삭제의 경우에 한해 AWS Support를 통해 복구해야 합니다.
:::

**각 Namespace의 상세 역할**:

**default**:

- `kubernetes` Service: 클러스터 내부에서 API Server에 접근하기 위한 endpoint
- `default` ServiceAccount: namespace에 ServiceAccount가 지정되지 않은 Pod의 기본 인증 주체

**kube-system**:

- 클러스터 운영에 필수적인 모든 시스템 컴포넌트가 배포되는 namespace
- EKS Add-on (CoreDNS, kube-proxy, VPC CNI) 및 컨트롤러들이 위치

**kube-public**:

- 인증되지 않은 사용자도 읽을 수 있는 공개 정보 저장
- `cluster-info` ConfigMap에 클러스터 CA 인증서와 API Server 주소 포함

**kube-node-lease**:

- 각 노드의 Lease 객체가 저장되어 heartbeat 역할 수행
- Node Controller가 이 정보를 기반으로 노드 상태를 판단

### 4.2 kube-system 핵심 컴포넌트

`kube-system` namespace에는 클러스터 운영에 필수적인 컴포넌트들이 배포되어 있습니다. 이 컴포넌트들을 개별적으로 삭제하거나 수정하면 심각한 장애가 발생할 수 있습니다.

### EKS 핵심 Add-on

- CoreDNS: 클러스터 내부 DNS 이름 해석을 담당합니다.
- kube-proxy: Service의 ClusterIP를 노드의 네트워크 규칙으로 구현합니다.
- Amazon VPC CNI (aws-node): Pod에 VPC IP를 할당하는 네트워킹 플러그인입니다.

### EKS 스토리지 컴포넌트

- Amazon EBS CSI Driver: EBS 볼륨 기반 PersistentVolume을 프로비저닝합니다.
- Amazon EFS CSI Driver: EFS 파일 시스템을 PersistentVolume으로 마운트합니다(사용 시).

### 네트워킹 및 로드밸런싱 컴포넌트

- AWS Load Balancer Controller: Ingress/Service를 ALB·NLB로 프로비저닝합니다(설치한 경우).
- CoreDNS·kube-proxy·VPC CNI는 위 Add-on 항목과 함께 네트워킹 경로를 구성합니다.

:::tip
EKS Add-on으로 관리되는 컴포넌트(CoreDNS, kube-proxy, VPC CNI, EBS CSI Driver)는 AWS 콘솔이나 CLI에서 Add-on을 재설치하여 복구할 수 있습니다.
:::

```bash
# EKS Add-on 상태 확인
aws eks list-addons --cluster-name <cluster-name>

# 복구 전에 해당 Add-on 리소스가 이미 존재하는지 확인
aws eks describe-addon --cluster-name <cluster-name> --addon-name coredns

# Add-on이 없을 때만 새로 생성 (이미 존재하면 ResourceInUseException 발생)
aws eks create-addon \
  --cluster-name <cluster-name> \
  --addon-name coredns

# 이미 존재하는 Add-on은 update-addon으로 복구/갱신.
# --resolve-conflicts OVERWRITE는 '생성→갱신' 전환이 아니라 설정 충돌 해소 옵션이며,
# 기존 사용자 설정을 덮어쓸 수 있으므로 주의합니다.
aws eks update-addon \
  --cluster-name <cluster-name> \
  --addon-name coredns \
  --resolve-conflicts OVERWRITE
```

:::warning 주의
위 `aws eks` 명령은 EKS 관리형 Add-on을 대상으로 하는 AWS API 호출이므로 kubectl 접근 없이도 실행할 수 있습니다. 다만 Add-on이 배포될 `kube-system` namespace 자체가 삭제된 경우에는 Add-on 복구만으로는 해결되지 않으며 AWS Support가 필요합니다.
:::

### 4.3 Cluster-Scoped 리소스

Namespace에 속하지 않는 Cluster-Scoped 리소스들도 삭제나 수정 시 클러스터 전체에 영향을 줄 수 있습니다.

### RBAC 관련 리소스

:::warning 특히 위험한 ClusterRole/ClusterRoleBinding

- `system:node` ClusterRole: Kubernetes는 이 역할을 1.8 이전 버전과의 호환용으로 문서화하며, 기본 바인딩은 없음(None)입니다. 최신 클러스터에서 노드 권한은 kubelet의 노드 신원(`system:node:<nodeName>`, 그룹 `system:nodes`)에 대해 **Node authorizer**가 부여하므로, 이 역할/바인딩 삭제가 곧바로 모든 노드의 통신 차단으로 이어지지는 않습니다. 노드 접근은 클러스터별 Node authorizer 활성화와 RBAC 구성에 따라 달라집니다
- `system:kube-controller-manager`: 삭제 시 **컨트롤러 매니저 동작 중단**
- `system:kube-scheduler`: 삭제 시 **Pod 스케줄링 중단**
:::

### CRD (Custom Resource Definition)

:::warning CRD 삭제 주의
CRD를 삭제하면 해당 CRD로 생성된 모든 Custom Resource가 cascading 삭제됩니다. 예를 들어, Cert-Manager의 Certificate CRD를 삭제하면 클러스터의 모든 Certificate 리소스가 삭제됩니다.
:::

### 스토리지 관련 리소스

### 노드 및 네트워크 관련 리소스

### EKS 특화 리소스

:::tip Best Practice
Cluster-Scoped 리소스를 수정하거나 삭제하기 전에 항상 백업을 생성하세요.
:::

```bash
# ClusterRole 백업 예시
kubectl get clusterrole <role-name> -o yaml > clusterrole-backup.yaml

# 모든 ClusterRole 백업
kubectl get clusterroles -o yaml > all-clusterroles-backup.yaml

# CRD 백업 (CR 포함하지 않음)
kubectl get crd <crd-name> -o yaml > crd-backup.yaml
```

---

## 5. 재발 방지 방향성

### 5.1 Admission Controller를 통한 리소스 보호

Kubernetes Admission Controller를 활용하면 Critical 리소스의 삭제를 사전에 차단할 수 있습니다. 여기서는 Kyverno를 사용한 예시를 소개합니다.

### Kyverno를 이용한 Critical Namespace 삭제 방지

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: protect-critical-namespaces
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: block-critical-namespace-deletion
      match:
        any:
          - resources:
              kinds:
                - Namespace
              names:
                - default
                - kube-system
                - kube-public
                - kube-node-lease
      exclude:
        any:
          - clusterRoles:
              - cluster-admin
      validate:
        message: "Critical namespace '{{request.object.metadata.name}}' 삭제가 차단되었습니다."
        deny:
          conditions:
            all:
              - key: "{{request.operation}}"
                operator: Equals
                value: DELETE
```

위 정책을 적용하면 `cluster-admin` 역할이 아닌 사용자가 Critical Namespace를 삭제하려 할 때 요청이 거부됩니다.

### 다른 Admission Controller 옵션

Kyverno 외에도 다양한 Admission Controller를 사용할 수 있습니다.

:::tip 권장
팀의 기술 스택과 정책 복잡도에 따라 선택하세요. 간단한 리소스 보호 정책이라면 Kyverno가 빠르게 적용할 수 있습니다.
:::

### 5.2 GitOps 및 KRMOps 기반 운영

GitOps와 KRMOps(Kubernetes Resource Model Operations) 기반 운영 방식을 도입하면 클러스터 리소스를 선언적으로 관리하고, 의도치 않은 변경으로부터 빠르게 복구할 수 있습니다.

### Argo CD를 통한 Critical 리소스 관리 {#eks-auto-mode의-argocd-capability}

Argo CD로 Critical 리소스를 선언적으로 관리할 수 있습니다. Argo CD는 직접 설치해 운영하거나(self-managed), EKS Capability로 제공되는 관리형 Argo CD를 명시적으로 활성화해 사용할 수 있습니다. 관리형 Argo CD를 포함한 EKS Capability는 클러스터 생성 시 자동으로 포함되는 것이 아니라 개별적으로 생성·활성화하는 리소스입니다. 아래 self-managed Argo CD 예시는 in-cluster 대상(`https://kubernetes.default.svc`)에 배포합니다. 관리형 Argo CD로 다른 클러스터에 배포할 때는 `kubernetes.default.svc`가 아니라 등록된 대상 클러스터의 ARN을 destination으로 사용해야 합니다.

```yaml
# ArgoCD Application 예시 - Critical 리소스 관리
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: cluster-critical-resources
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/k8s-manifests.git
    targetRevision: main
    path: cluster-critical
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: false      # Critical 리소스 자동 삭제 방지
      selfHeal: true    # Drift 발생 시 자동 복구
    syncOptions:
      - CreateNamespace=false
```

**GitOps의 재발 방지 효과**:

:::tip
Critical Namespace와 리소스는 별도의 ArgoCD Application으로 분리하고, prune: false와 selfHeal: true를 설정하여 보호하세요.
:::

### ACK와 KRO를 활용한 KRMOps 전략

**ACK (AWS Controllers for Kubernetes)**와 **KRO (Kube Resource Orchestrator)**를 활용하면 AWS 인프라까지 Kubernetes Resource Model로 관리할 수 있습니다.

**ACK를 통한 AWS 리소스 관리**:

```yaml
# ACK를 사용한 S3 버킷 선언적 관리 예시
apiVersion: s3.services.k8s.aws/v1alpha1
kind: Bucket
metadata:
  name: my-app-bucket
  namespace: default
spec:
  name: my-app-bucket-12345
  tagging:
    tagSet:
      - key: Environment
        value: Production
```

**KRO를 통한 복합 리소스 오케스트레이션**:

```yaml
# KRO ResourceGraphDefinition 예시 (kro.run/v1alpha1) — 애플리케이션 스택 정의
# 아래는 핵심 필드만 보여주는 축약 스캐폴드이며, Deployment/Service의 필수 필드가 생략되어
# 그대로는 적용할 수 없습니다.
apiVersion: kro.run/v1alpha1
kind: ResourceGraphDefinition
metadata:
  name: web-application
spec:
  schema:
    apiVersion: v1alpha1
    kind: WebApplication
    spec:
      name: string
      replicas: integer | default=2
  resources:
    - id: deployment
      template:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: ${schema.spec.name}
        spec:
          replicas: ${schema.spec.replicas}
          # ... 생략 (selector, template 등 필수 필드)
    - id: service
      template:
        apiVersion: v1
        kind: Service
        # ... 생략 (selector, ports 등 필수 필드)
```

**KRMOps의 장점**:

:::tip 권장
ACK와 KRO를 함께 사용하면 EKS 클러스터뿐만 아니라 연관된 AWS 리소스(VPC, IAM, RDS 등)까지 Kubernetes 방식으로 통합 관리할 수 있습니다.
:::

**참고 자료**:

- AWS Controllers for Kubernetes (ACK)
- Kube Resource Orchestrator (KRO)
- EKS Auto Mode 문서

### 5.3 EKS Access Entry 기반 접근 통제

EKS Access Entry는 `aws-auth` ConfigMap의 한계를 극복하고 더 안전한 클러스터 접근 관리를 제공합니다.

### aws-auth ConfigMap의 문제점

기존 `aws-auth` ConfigMap 방식은 다음과 같은 위험이 있습니다:

:::warning 주의
`aws-auth` ConfigMap이 삭제되거나 손상되면 그 ConfigMap으로 매핑된 IAM 신원의 인증이 실패합니다. 다만 모든 IAM 신원이 접근을 잃는 것은 아닙니다. 클러스터 생성자(creator) 권한은 `aws-auth` ConfigMap 바깥에서 유지되며, 호출자가 필요한 IAM 권한을 가진 경우 EKS access API(access entry)로 Kubernetes API 접근 없이도 접근을 복구할 수 있습니다. 이러한 경로로 복구할 수 없는 경우에 한해 AWS Support로 복구를 요청합니다.
:::

### EKS Access Entry로 전환

EKS Access Entry는 AWS API를 통해 클러스터 접근을 관리하므로 `aws-auth` ConfigMap의 위험을 제거합니다.

**Access Entry 생성 예시**:

```bash
# 관리자 Access Entry 생성
aws eks create-access-entry \
  --cluster-name my-cluster \
  --principal-arn arn:aws:iam::XXXXXXXXXXXX:role/EKSAdminRole \
  --type STANDARD

# 클러스터 관리자 권한 연결
aws eks associate-access-policy \
  --cluster-name my-cluster \
  --principal-arn arn:aws:iam::XXXXXXXXXXXX:role/EKSAdminRole \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

**Namespace 레벨 접근 통제**:

```bash
# 특정 namespace에만 접근 가능한 개발자 권한 설정
aws eks create-access-entry \
  --cluster-name my-cluster \
  --principal-arn arn:aws:iam::XXXXXXXXXXXX:role/DevTeamRole \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name my-cluster \
  --principal-arn arn:aws:iam::XXXXXXXXXXXX:role/DevTeamRole \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy \
  --access-scope type=namespace,namespaces=dev,staging
```

**EKS Access Entry의 장점**:

- AWS API로 접근을 관리하므로 `aws-auth` ConfigMap 손상에 따른 lockout 위험을 줄입니다.
- CloudFormation·Terraform으로 선언적으로 관리하고 CloudTrail로 변경을 추적할 수 있습니다.
- access scope를 namespace 또는 cluster 범위로 제한해 최소 권한을 적용할 수 있습니다.

**사전 정의된 Access Policy**:

- `AmazonEKSClusterAdminPolicy`: 클러스터 전체 관리자 권한
- `AmazonEKSAdminPolicy`: namespace 관리자 권한
- `AmazonEKSEditPolicy`: 리소스 생성·수정 권한
- `AmazonEKSViewPolicy`: 읽기 전용 권한

:::tip 권장 사항

1. **신규 클러스터**: 처음부터 EKS Access Entry만 사용하려면 클러스터 생성 시 `--access-config` 안에서 `authenticationMode=API`를 명시해 API 전용 접근 모드를 선택합니다. 생성자 admin 권한 부여 여부는 같은 `--access-config`의 `bootstrapClusterCreatorAdminPermissions`(기본값 `true`) 필드로 별도로 결정하며, 이 필드 자체가 인증 모드를 바꾸지는 않습니다
2. **기존 클러스터**: Access Entry로 점진적 마이그레이션 후 `aws-auth` ConfigMap 의존성 제거
3. **최소 권한 원칙**: 클러스터 전체 권한 대신 namespace 스코프 권한 사용
4. **긴급 복구 계정**: 별도의 IAM Role에 클러스터 관리자 권한을 Access Entry로 설정해두어 lockout 상황 대비
:::

**마이그레이션 체크리스트**:

- 현재 Authentication Mode를 확인하고 `API_AND_CONFIG_MAP`으로 전환했는가
- `aws-auth`의 각 mapRoles/mapUsers 항목을 Access Entry로 생성했는가
- 긴급 복구용 IAM Role에 클러스터 관리자 Access Entry를 미리 설정했는가
- 모든 항목 이전을 검증한 뒤 최종적으로 `API` 모드로 전환했는가

**참고 자료**:

- EKS Cluster Access Management
- Migrating from aws-auth ConfigMap

---

## 6. 요약

### 6.1 핵심 내용 요약

:::danger 핵심 메시지
`default`·`kube-system` namespace가 실제로 삭제되어 in-cluster `kubernetes` Service와 시스템 컴포넌트가 사라진 경우에는 kubectl 접근이 어려워 수동 복구가 제한됩니다. 다만 kubectl 접근 실패가 곧 namespace 삭제를 뜻하지는 않으므로 먼저 네트워크·인증·API 상태를 진단하고, aws-auth 손상처럼 접근만 막힌 경우에는 생성자 권한이나 EKS access entry로 복구를 시도하세요. 이런 경로로 복구할 수 없는 경우에 한해 AWS Support로 복구를 요청합니다.
:::

### 6.2 참고 자료

### EKS 공식 문서

- Amazon EKS Best Practices Guide
- EKS Cluster Access Management
- Migrating from aws-auth ConfigMap to Access Entries
- EKS Add-ons
- EKS Auto Mode

### Kubernetes 공식 문서

- Kubernetes RBAC Authorization
- Kubernetes Namespaces
- Admission Controllers Reference

### Admission Controller 도구

- Kyverno - Kubernetes Native Policy Management
- OPA Gatekeeper - Policy Controller for Kubernetes

### GitOps 및 KRMOps 도구

- ArgoCD - Declarative GitOps CD for Kubernetes
- AWS Controllers for Kubernetes (ACK)
- Kube Resource Orchestrator (KRO)
