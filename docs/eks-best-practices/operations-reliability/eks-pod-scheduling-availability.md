---
title: EKS Pod 스케줄링 & 가용성 패턴
description: Kubernetes Pod 스케줄링 전략, Affinity/Anti-Affinity, PDB, Priority/Preemption, Taints/Tolerations 모범 사례
created: "2026-02-12"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 88
tags:
  - eks
  - kubernetes
  - scheduling
  - affinity
  - pdb
  - priority
  - taints
  - tolerations
  - descheduler
  - scope:ops
sidebar_label: Pod 스케줄링 & 가용성
category: operations
---

> **📌 기준 환경**: EKS 1.33+, Karpenter v1.x, Kubernetes 1.30+

## 1. 개요

Kubernetes의 Pod 스케줄링은 서비스 가용성, 성능, 비용 효율성에 직접적인 영향을 미치는 핵심 메커니즘입니다. 올바른 스케줄링 전략을 적용하면 다음과 같은 이점을 얻을 수 있습니다:

- **고가용성**: 장애 도메인 분리를 통한 서비스 중단 최소화
- **성능 최적화**: 워크로드 특성에 맞는 노드 배치로 응답 시간 개선
- **리소스 효율**: 노드 리소스의 균형 있는 활용으로 비용 절감
- **안정적 운영**: 우선순위 기반 리소스 보장 및 Preemption 제어

본 문서는 Pod 스케줄링의 핵심 개념부터 고급 패턴까지 다루며, EKS 환경에서 실전 적용 가능한 YAML 예시와 의사결정 가이드를 제공합니다.

:::info 고가용성 아키텍처 참고
본 문서는 **Pod 수준**의 스케줄링 패턴에 초점을 맞춥니다. 클러스터 전체의 고가용성 아키텍처(Multi-AZ 전략, Topology Spread, Cell Architecture)는 [EKS 고가용성 아키텍처 가이드](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide)를 참조하세요.
:::

### 스케줄링이 중요한 이유

| 시나리오 | 잘못된 스케줄링 | 올바른 스케줄링 |
|---------|----------------|----------------|
| **장애 격리** | 모든 replica가 같은 노드 → 노드 장애 시 전체 중단 | Anti-Affinity로 노드 분산 → 부분 장애만 발생 |
| **리소스 경합** | CPU 집약적 Pod들이 한 노드에 집중 → 성능 저하 | Node Affinity로 워크로드 분리 → 안정적 성능 |
| **비용 최적화** | GPU 필요 없는 Pod가 GPU 노드에 배치 → 비용 낭비 | Taints/Tolerations로 전용 노드 격리 → 비용 절감 |
| **업그레이드 안전성** | 롤아웃 전략·Readiness 미설계, 노드 Drain 시 PDB 미설정 → 가용 replica 과다 감소 | 롤링 업데이트는 workload controller 설정으로 제어하고, Eviction API 기반 노드 Drain은 PDB로 제한 |
| **긴급 대응** | 우선순위 미설정 → 중요 워크로드 Pending | PriorityClass 설정 → 중요 Pod 우선 스케줄링 |

---

## 2. Kubernetes 스케줄링 기본 원리

### 2.1 스케줄링 프로세스

Kubernetes 스케줄러는 3단계 프로세스를 거쳐 Pod를 노드에 배치합니다:

```mermaid
flowchart TB
    subgraph "Phase 1: Filtering"
        P1[새 Pod 생성 요청]
        P2[모든 노드 목록 조회]
        P3{노드 필터링<br/>Predicates}
        P4[리소스 부족]
        P5[Taint 불일치]
        P6[Node Selector 불일치]
        P7[적합한 노드 목록]
    end

    subgraph "Phase 2: Scoring"
        S1[각 노드 점수 계산<br/>Priorities]
        S2[리소스 균형]
        S3[Affinity/Anti-Affinity]
        S4[이미지 캐시 여부]
        S5[최고 점수 노드 선택]
    end

    subgraph "Phase 3: Binding"
        B1[노드에 Pod 할당<br/>Bind]
        B2[Kubelet에 통보]
        B3[컨테이너 시작]
    end

    P1 --> P2
    P2 --> P3
    P3 -->|통과 못한 노드 제거| P4
    P3 --> P5
    P3 --> P6
    P3 -->|적합한 노드만| P7
    P7 --> S1
    S1 --> S2
    S1 --> S3
    S1 --> S4
    S2 --> S5
    S3 --> S5
    S4 --> S5
    S5 --> B1
    B1 --> B2
    B2 --> B3

    style P1 fill:#4286f4,stroke:#2a6acf,color:#fff
    style P3 fill:#fbbc04,stroke:#c99603,color:#000
    style P7 fill:#34a853,stroke:#2a8642,color:#fff
    style S5 fill:#34a853,stroke:#2a8642,color:#fff
    style B3 fill:#34a853,stroke:#2a8642,color:#fff
```

**1. Filtering (Predicates)**: 요구사항을 충족하지 못하는 노드를 제외
- 리소스 부족 (CPU, Memory)
- Taints/Tolerations 불일치
- Node Selector 조건 미충족
- Volume 토폴로지 제약 (EBS AZ-Pinning)
- Port 충돌

**2. Scoring (Priorities)**: 남은 노드들에 점수를 매겨 최적의 노드 선택
- 리소스 밸런스 (균등 사용)
- Pod Affinity/Anti-Affinity 만족도
- 이미지 캐시 존재 여부
- Topology Spread 균등도
- 노드 Preference (PreferredDuringScheduling)

**3. Binding**: 최고 점수 노드에 Pod를 할당하고 Kubelet에 통보

:::tip 스케줄링 실패 디버깅
Pod가 `Pending` 상태로 남아있다면, `kubectl describe pod <pod-name>`으로 Events 섹션을 확인하세요. `Insufficient cpu`, `No nodes available`, `Taint not tolerated` 등의 메시지로 실패 원인을 파악할 수 있습니다.
:::

### 2.2 스케줄링에 영향을 주는 요소

| 요소 | 타입 | 영향 단계 | 강제성 | 주요 사용 사례 |
|------|------|-----------|--------|---------------|
| **Node Selector** | Pod | Filtering | Hard | 특정 노드 타입 지정 (GPU, ARM) |
| **Node Affinity** | Pod | Filtering/Scoring | Hard/Soft | 세밀한 노드 선택 조건 |
| **Pod Affinity** | Pod | Filtering/Scoring | Hard/Soft | 필수 조건으로 후보를 거르고 선호 조건으로 점수 부여 |
| **Pod Anti-Affinity** | Pod | Filtering/Scoring | Hard/Soft | Pod를 서로 멀리 배치 |
| **Taints/Tolerations** | Node + Pod | Filtering/Scoring, NoExecute 퇴거 | Effect에 따라 다름 | 새 배치의 허용·회피와 기존 Pod 퇴거를 구분 |
| **Topology Spread** | Pod | Filtering/Scoring | Hard/Soft | 선택된 Pod의 도메인별 수를 비교 |
| **PriorityClass** | Pod | 대기열 순서, 허용된 Preemption | 다른 배치 조건을 우회하지 않음 | 높은 우선순위 Pod를 먼저 검토 |
| **Resource Requests** | Pod | Filtering | Hard | 노드 allocatable과 기존 요청량을 기준으로 배치 가능 여부 판단 |
| **PDB** | Pod Group | Eviction API | Hard | 중단 예산을 초과하는 Eviction 요청 제한 |

**Hard vs Soft 제약:**
- **Hard (Required)**: 조건을 충족하지 못하면 스케줄링 실패 → `Pending` 상태
- **Soft (Preferred)**: 조건을 충족하지 못해도 다른 Hard 조건을 만족하는 노드에 배치 가능

---

## 3. Node Affinity & Anti-Affinity

### 3.1 Node Selector (기본)

Node Selector는 가장 간단한 노드 선택 메커니즘으로, 레이블 기반 정확한 일치(exact match)만 지원합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gpu-workload
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-training
  template:
    metadata:
      labels:
        app: ml-training
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: g5.2xlarge
        workload-type: gpu
      containers:
      - name: trainer
        image: ml/trainer:v2.0
        resources:
          requests:
            nvidia.com/gpu: 1
          limits:
            nvidia.com/gpu: 1
```

GPU 예제는 드라이버와 device plugin이 `nvidia.com/gpu`를 노드 자원으로 제공하는 환경을 전제로 합니다. 이미지 이름은 예시이므로 사용할 이미지와 node label을 확인해야 합니다. [GPU 자원 규칙](https://v1-34.docs.kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)에 따라 GPU는 `limits`만 지정하거나, `requests`와 `limits`를 같은 값으로 지정합니다.

**제한사항**: Node Selector는 `AND` 조건만 지원하며, `OR`, `NOT`, 비교 연산자 등을 사용할 수 없습니다. 복잡한 조건이 필요하면 Node Affinity를 사용하세요.

### 3.2 Node Affinity 상세

Node Affinity는 Node Selector의 확장 버전으로, 복잡한 논리 조건과 선호도(preference)를 표현할 수 있습니다.

#### Required vs Preferred

| 타입 | 동작 | 사용 시기 |
|------|------|----------|
| `requiredDuringSchedulingIgnoredDuringExecution` | 조건 충족 필수 (Hard) | 반드시 특정 노드에 배치해야 할 때 |
| `preferredDuringSchedulingIgnoredDuringExecution` | 조건 선호 (Soft, 가중치 기반) | 선호하지만 대안 허용할 때 |

:::info IgnoredDuringExecution의 의미
`IgnoredDuringExecution`은 스케줄링 후 node label이 조건과 달라져도 이 affinity 규칙만으로 Pod를 퇴거하거나 재배치하지 않는다는 의미입니다. [Kubernetes 1.34의 Node Affinity API](https://v1-34.docs.kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity)에는 실행 중 조건을 다시 강제하는 `RequiredDuringExecution` 필드가 없습니다.
:::

#### 연산자 종류

| 연산자 | 설명 | 예시 |
|--------|------|------|
| `In` | 값이 목록에 포함됨 | `values: ["t3.xlarge", "t3.2xlarge"]` |
| `NotIn` | 값이 목록에 없거나 해당 label이 없음 | `values: ["t2.micro", "t2.small"]`; label 존재가 필요하면 `Exists`도 지정 |
| `Exists` | 키가 존재함 (값 무관) | 레이블 존재 여부만 확인 |
| `DoesNotExist` | 키가 존재하지 않음 | 특정 레이블이 없는 노드 선택 |
| `Gt` | 값이 크다 (숫자) | `values: ["100"]` (CPU 코어 수 등) |
| `Lt` | 값이 작다 (숫자) | `values: ["10"]` |

#### 사용 사례별 YAML 예시

**예시 1: GPU 노드에 ML 워크로드 배치 (Hard)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-training
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ml-training
  template:
    metadata:
      labels:
        app: ml-training
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - g5.2xlarge
                - g5.4xlarge
              - key: karpenter.sh/capacity-type
                operator: Exists
              - key: karpenter.sh/capacity-type
                operator: NotIn
                values:
                - spot  # GPU 워크로드는 Spot 제외
      containers:
      - name: trainer
        image: ml/trainer:v3.0
        resources:
          requests:
            nvidia.com/gpu: 1
            cpu: "4"
            memory: 16Gi
          limits:
            nvidia.com/gpu: 1
```

이 예제는 Karpenter의 capacity-type label이 있고 값이 `spot`이 아닌 노드를 선택합니다. CPU·메모리 요청은 시스템 예약량과 DaemonSet 요청량을 제외한 여유 자원에 들어가야 합니다.

**예시 2: 인스턴스 패밀리 선호 (Soft, 가중치)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 6
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      affinity:
        nodeAffinity:
          # 필수: On-Demand 노드만 사용
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: karpenter.sh/capacity-type
                operator: In
                values:
                - on-demand
          # 선호: c7i > c6i > m6i 순서
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - c7i.xlarge
                - c7i.2xlarge
          - weight: 80
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - c6i.xlarge
                - c6i.2xlarge
          - weight: 50
            preference:
              matchExpressions:
              - key: node.kubernetes.io/instance-type
                operator: In
                values:
                - m6i.xlarge
                - m6i.2xlarge
      containers:
      - name: api
        image: api-server:v2.5
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
```

**예시 3: 특정 AZ 지정 (데이터베이스 클라이언트)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db-client
spec:
  replicas: 4
  selector:
    matchLabels:
      app: db-client
  template:
    metadata:
      labels:
        app: db-client
    spec:
      affinity:
        nodeAffinity:
          # RDS 인스턴스와 같은 AZ (us-east-1a)에 배치하여 Cross-AZ 비용 절감
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values:
                - us-east-1a
      containers:
      - name: client
        image: db-client:v1.2
        env:
        - name: DB_ENDPOINT
          value: "mydb.us-east-1a.rds.amazonaws.com"
```

### 3.3 Node Anti-Affinity

Node Anti-Affinity는 명시적인 문법이 없지만, Node Affinity의 `NotIn`, `DoesNotExist` 연산자로 구현합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: avoid-spot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: critical-service
  template:
    metadata:
      labels:
        app: critical-service
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              # Label이 있는 노드 중 Spot 노드 회피
              - key: karpenter.sh/capacity-type
                operator: Exists
              - key: karpenter.sh/capacity-type
                operator: NotIn
                values:
                - spot
              # Label이 있는 노드 중 ARM 아키텍처 회피
              - key: kubernetes.io/arch
                operator: Exists
              - key: kubernetes.io/arch
                operator: NotIn
                values:
                - arm64
      containers:
      - name: app
        image: critical-service:v1.0
```

---

## 4. Pod Affinity & Anti-Affinity

Pod Affinity와 Anti-Affinity는 **Pod 간의 관계**를 기반으로 스케줄링 결정을 내립니다. 이를 통해 관련된 Pod들을 가까이 배치하거나(Affinity), 멀리 배치(Anti-Affinity)할 수 있습니다.

### 4.1 Pod Affinity

Pod Affinity는 특정 Pod가 있는 토폴로지 도메인(노드, AZ, 리전)에 다른 Pod를 함께 배치합니다.

**주요 사용 사례:**
- **Cache Locality**: 캐시 서버와 애플리케이션을 같은 노드에 배치하여 레이턴시 최소화
- **Data Locality**: 데이터 처리 워크로드를 데이터 소스와 가까이 배치
- **Communication Intensive**: 빈번하게 통신하는 마이크로서비스를 같은 AZ에 배치

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cache-client
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cache-client
  template:
    metadata:
      labels:
        app: cache-client
    spec:
      affinity:
        podAffinity:
          # Hard: Redis Pod와 같은 노드에 배치 (초저지연 요구사항)
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - redis
            topologyKey: kubernetes.io/hostname
      containers:
      - name: client
        image: cache-client:v1.0
```

**topologyKey 설명:**

| topologyKey | 범위 | 설명 |
|-------------|------|------|
| `kubernetes.io/hostname` | 노드 | 같은 노드에 배치 (가장 강력한 co-location) |
| `topology.kubernetes.io/zone` | AZ | 같은 AZ에 배치 |
| `topology.kubernetes.io/region` | 리전 | 같은 리전에 배치 |
| 커스텀 레이블 | 사용자 정의 | 예: `rack`, `datacenter` |

**Soft Affinity 예시 (선호, 대안 허용):**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
spec:
  replicas: 6
  selector:
    matchLabels:
      app: web-frontend
  template:
    metadata:
      labels:
        app: web-frontend
    spec:
      affinity:
        podAffinity:
          # Soft: API 서버와 같은 AZ 선호 (Cross-AZ 비용 절감)
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api-server
              topologyKey: topology.kubernetes.io/zone
      containers:
      - name: frontend
        image: web-frontend:v2.0
```

### 4.2 Pod Anti-Affinity

Pod Anti-Affinity는 특정 Pod가 있는 토폴로지 도메인에 다른 Pod를 배치하지 **않도록** 합니다. 고가용성 확보의 핵심 패턴입니다.

```mermaid
flowchart TB
    subgraph "노드 1 (AZ-1a)"
        N1P1[replica-1<br/>app=api-server]
        N1P2[...]
    end

    subgraph "노드 2 (AZ-1b)"
        N2P1[replica-2<br/>app=api-server]
        N2P2[...]
    end

    subgraph "노드 3 (AZ-1c)"
        N3P1[replica-3<br/>app=api-server]
        N3P2[...]
    end

    subgraph "Pod Anti-Affinity 규칙"
        RULE[topologyKey: topology.kubernetes.io/zone<br/>app=api-server Pod끼리 다른 AZ에 배치]
    end

    RULE -.->|적용| N1P1
    RULE -.->|적용| N2P1
    RULE -.->|적용| N3P1

    style N1P1 fill:#34a853,stroke:#2a8642,color:#fff
    style N2P1 fill:#4286f4,stroke:#2a6acf,color:#fff
    style N3P1 fill:#fbbc04,stroke:#c99603,color:#000
    style RULE fill:#ff9900,stroke:#cc7a00,color:#fff
```

#### Hard Anti-Affinity (장애 도메인 격리)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 6
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      affinity:
        podAntiAffinity:
          # Hard: 각 노드에 최대 1개 replica만 배치 (노드 장애 격리)
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - api-server
            topologyKey: kubernetes.io/hostname
      containers:
      - name: api
        image: api-server:v3.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
```

:::warning Hard Anti-Affinity 주의사항
Hard Anti-Affinity를 `kubernetes.io/hostname`에 적용하면, replica 수가 노드 수보다 많을 때 일부 Pod가 `Pending` 상태로 남습니다. 예를 들어 노드 3개에 replica 5개를 배포하면 2개가 스케줄링되지 않습니다. 이 경우 Soft Anti-Affinity를 사용하세요.
:::

#### Soft Anti-Affinity (권장 패턴)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
spec:
  replicas: 10
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      affinity:
        podAntiAffinity:
          # Soft: 가능한 한 다른 노드에 분산 배치 (유연성 확보)
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - worker
              topologyKey: kubernetes.io/hostname
      containers:
      - name: worker
        image: worker:v2.1
        resources:
          requests:
            cpu: "500m"
            memory: 1Gi
```

#### Hard vs Soft 선택 기준

| 시나리오 | 권장 | 이유 |
|---------|------|------|
| replica 수 ≤ 노드 수 | Hard | 각 노드에 정확히 1개씩 배치 가능 |
| replica 수 > 노드 수 | Soft | 일부 노드에 2개 이상 배치 허용 |
| 미션 크리티컬 서비스 | Hard (AZ 레벨) | 장애 도메인 완전 격리 |
| 일반 워크로드 | Soft | 스케줄링 유연성 확보 |
| 빠른 스케일링 필요 | Soft | Pending 상태 방지 |

### 4.3 Affinity/Anti-Affinity vs Topology Spread 비교

| 비교 항목 | Pod Anti-Affinity | Topology Spread Constraints |
|----------|-------------------|----------------------------|
| **목적** | Pod 간 분리 | Pod 균등 분산 |
| **세밀함** | Pod 단위 제어 | 도메인 간 균형 제어 |
| **복잡성** | 낮음 | 중간 |
| **유연성** | Hard/Soft 선택 | maxSkew로 허용 범위 제어 |
| **주요 사용** | 같은 앱 replica 분리 | 여러 앱의 전체 균형 |
| **AZ 분산** | 가능 | 더 정교함 (minDomains) |
| **노드 분산** | 가능 | 더 정교함 (maxSkew) |
| **권장 조합** | Topology Spread (AZ) + Anti-Affinity (노드) | |

:::info Topology Spread Constraints 참고
Topology Spread Constraints는 Pod Anti-Affinity보다 더 정교한 분산 제어를 제공합니다. 자세한 내용과 YAML 예시는 [EKS 고가용성 아키텍처 가이드](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide#pod-topology-spread-constraints)를 참조하세요.
:::

#### 4.3.1 Topology Spread Constraints 실전 패턴

Topology Spread Constraints는 복잡한 분산 요구사항을 우아하게 해결합니다. 실제 프로덕션 환경에서 자주 사용되는 패턴을 YAML과 함께 소개합니다.

##### 패턴 1: Multi-AZ 균등 분배 (기본)

가장 일반적인 패턴으로, 모든 replica를 AZ 간에 균등하게 분산시킵니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-az-app
  namespace: production
spec:
  replicas: 9
  selector:
    matchLabels:
      app: multi-az-app
  template:
    metadata:
      labels:
        app: multi-az-app
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: multi-az-app
      containers:
      - name: app
        image: myapp:v1.0
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
```

**동작 방식:**
- `maxSkew: 1`: AZ 간 Pod 수 차이가 최대 1개까지 허용
- 9개 replica → us-east-1a(3), us-east-1b(3), us-east-1c(3)
- `whenUnsatisfiable: DoNotSchedule`: 조건 위반 시 Pod를 Pending 상태로 유지

**사용 시나리오:**
- 미션 크리티컬 서비스의 AZ 장애 대응
- 클라이언트 트래픽이 모든 AZ에서 균등하게 들어오는 경우
- 데이터센터 수준의 장애 격리가 필요한 경우

##### 패턴 2: minDomains 활용 (최소 AZ 보장)

`minDomains`는 Pod가 반드시 분산되어야 하는 최소 도메인(AZ) 수를 보장합니다. AZ 축소 시나리오에서 Pod가 한 곳으로 밀리는 것을 방지합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ha-critical-service
  namespace: production
spec:
  replicas: 6
  selector:
    matchLabels:
      app: ha-critical-service
      tier: critical
  template:
    metadata:
      labels:
        app: ha-critical-service
        tier: critical
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        minDomains: 3  # 반드시 3개 AZ에 분산
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: ha-critical-service
      containers:
      - name: service
        image: critical-service:v2.5
        resources:
          requests:
            cpu: "1"
            memory: 1Gi
          limits:
            cpu: "2"
            memory: 2Gi
```

**동작 방식:**
- `minDomains: 3`: 최소 3개 AZ에 Pod 분산 보장
- 6개 replica → 각 AZ에 최소 2개씩 배치
- 특정 AZ가 리소스 부족이어도, 다른 AZ로만 몰리지 않음

**사용 시나리오:**
- 금융, 결제 시스템 등 초고가용성 요구 서비스
- SLA 99.99% 이상 보장 필요 시
- AZ 축소(Zonal Shift) 중에도 최소 가용성 유지

:::warning minDomains 설정 시 주의사항
`minDomains`를 설정하면 해당 수만큼의 도메인이 존재하지 않거나 리소스가 부족할 경우, Pod가 Pending 상태로 남습니다. 클러스터에 실제로 사용 가능한 AZ 수를 확인 후 설정하세요.
:::

##### 패턴 3: Anti-Affinity + Topology Spread 조합

같은 노드에 replica를 2개 이상 배치하지 않으면서, 동시에 AZ 간 균등 분배를 보장하는 패턴입니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: combined-constraints-app
  namespace: production
spec:
  replicas: 12
  selector:
    matchLabels:
      app: combined-app
  template:
    metadata:
      labels:
        app: combined-app
        version: v3.0
    spec:
      # 1. Topology Spread: AZ 간 균등 분산 (Hard)
      topologySpreadConstraints:
      - maxSkew: 1
        minDomains: 3
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: combined-app

      # 2. Anti-Affinity: 노드 간 분산 (Hard)
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - combined-app
            topologyKey: kubernetes.io/hostname

      containers:
      - name: app
        image: combined-app:v3.0
        resources:
          requests:
            cpu: "2"
            memory: 4Gi
```

**동작 방식:**
- **Level 1 (AZ)**: 12개 replica → 각 AZ에 4개씩 균등 배치
- **Level 2 (Node)**: 각 노드에 최대 1개 Pod만 배치

**효과:**
- 노드 장애 시 최대 1개 Pod만 영향
- AZ 장애 시 최대 4개 Pod만 영향
- 총 12개 중 8개(66.7%) 항상 가용

**사용 시나리오:**
- 단일 장애점(Single Point of Failure) 완전 제거
- 하드웨어 장애와 데이터센터 장애 모두 대응
- 고트래픽 API 서버, 결제 게이트웨이

##### 패턴 4: 다중 Topology Spread (Zone + Node)

하나의 Pod Spec에서 여러 토폴로지 레벨의 분산을 동시에 제어합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-level-spread
  namespace: production
spec:
  replicas: 18
  selector:
    matchLabels:
      app: multi-level-app
  template:
    metadata:
      labels:
        app: multi-level-app
    spec:
      topologySpreadConstraints:
      # 제약 1: AZ 레벨 분산 (Hard)
      - maxSkew: 1
        minDomains: 3
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: multi-level-app

      # 제약 2: 노드 레벨 분산 (Soft)
      - maxSkew: 2
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: multi-level-app

      containers:
      - name: app
        image: multi-level-app:v1.5
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
```

**동작 방식:**
- **1단계 (AZ)**: 18개 → us-east-1a(6), us-east-1b(6), us-east-1c(6)
- **2단계 (Node)**: 각 AZ 내에서 노드당 Pod 수 차이 최대 2개
- Node 제약은 Soft(`ScheduleAnyway`)로 설정하여 스케줄링 실패 방지

**사용 시나리오:**
- 대규모 replica(10개 이상) 배포
- 노드 수가 유동적인 환경 (Karpenter 오토스케일링)
- AZ 분산은 필수, 노드 분산은 선호하는 경우

##### 패턴 비교표

| 패턴 | maxSkew | minDomains | whenUnsatisfiable | 추가 제약 | 복잡도 | 권장 Replica 수 |
|------|---------|------------|-------------------|----------|--------|----------------|
| **패턴 1: 기본 Multi-AZ** | 1 | - | DoNotSchedule | 없음 | 낮음 | 3~12 |
| **패턴 2: minDomains** | 1 | 3 | DoNotSchedule | 없음 | 중간 | 6~20 |
| **패턴 3: Anti-Affinity 조합** | 1 | 3 | DoNotSchedule | Hard Anti-Affinity | 높음 | 12~50 |
| **패턴 4: 다중 Spread** | 1, 2 | 3 | Mixed | 2단계 Topology | 높음 | 15+ |

##### 트러블슈팅: Topology Spread 실패 원인

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| Pod가 Pending 상태 | `maxSkew` 초과 또는 `minDomains` 미충족 | `kubectl describe pod`로 Events 확인, replica 수 조정 또는 노드 추가 |
| 특정 AZ에만 Pod 집중 | `whenUnsatisfiable: ScheduleAnyway` 사용 | `DoNotSchedule`로 변경하여 Hard 제약 적용 |
| 신규 AZ 추가 시 재배치 안됨 | 스케줄러는 기존 Pod 재배치 안함 | Descheduler 사용 또는 Rolling Restart |
| `minDomains` 설정 후 모든 Pod Pending | 클러스터에 해당 수의 AZ 없음 | 실제 AZ 수에 맞춰 `minDomains` 조정 |

:::tip Topology Spread 디버깅 명령어
같은 클러스터의 Pod·Node 스냅샷을 사용하고 수집 시각을 기록합니다. `spec.nodeSelector`는 입력 제약이며, 실제 AZ는 `spec.nodeName`으로 연결한 Node의 label에서 확인합니다. 두 목록은 원자적 스냅샷이 아닙니다.

```bash
: "${CONTEXT:?대상 Kubernetes context 지정}"
: "${NAMESPACE:?워크로드 namespace 지정}"
: "${SELECTOR:?워크로드 label selector 지정}"
kubectl --context "$CONTEXT" get pods -n "$NAMESPACE" -l "$SELECTOR" -o json > pods.json
kubectl --context "$CONTEXT" get nodes -o json > nodes.json
```

다음 오프라인 함수는 전달받은 JSON 객체를 연결합니다. 노드·AZ별 수를 집계할 때 미배치 Pod, 누락된 Node, 알 수 없는 AZ와 `Unknown` readiness를 별도로 유지합니다.

```python
def placement_report(pod_list, node_list):
    """Join supplied snapshots only; labels are observations, not ownership proof."""
    nodes = {n["metadata"]["name"]: n for n in node_list["items"]}
    result = []
    for pod in pod_list["items"]:
        name = pod.get("spec", {}).get("nodeName")
        node = nodes.get(name)
        labels = (node or {}).get("metadata", {}).get("labels", {})
        ready = next((c.get("status", "Unknown")
                      for c in (node or {}).get("status", {}).get("conditions", [])
                      if c.get("type") == "Ready"), "Unknown")
        result.append({
            "namespace": pod["metadata"].get("namespace", "default"),
            "pod": pod["metadata"]["name"],
            "node": name,
            "placement": ("unscheduled" if not name else
                          "node_missing" if node is None else "node_found"),
            "zone": labels.get("topology.kubernetes.io/zone"),
            "nodeReady": ready,
            "providerID": (node or {}).get("spec", {}).get("providerID"),
            "nodepoolLabel": labels.get("karpenter.sh/nodepool"),
            "nodegroupLabel": labels.get("eks.amazonaws.com/nodegroup"),
            "owners": pod["metadata"].get("ownerReferences", []),
        })
    return result
```
:::

**권장 조합 패턴:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: best-practice-app
spec:
  replicas: 6
  selector:
    matchLabels:
      app: best-practice-app
  template:
    metadata:
      labels:
        app: best-practice-app
    spec:
      # Topology Spread: AZ 간 균등 분산 (Hard)
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: best-practice-app
        minDomains: 3
      # Anti-Affinity: 노드 간 분산 (Soft)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - best-practice-app
              topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: app:v1.0
```

---

## 5. Taints & Tolerations

Taint는 노드에, toleration은 Pod에 지정합니다. 스케줄러는 Pod가 tolerate하지 않는 taint의 effect에 따라 배치를 차단하거나 피합니다. Toleration이 있어도 그 노드로 배치가 보장되지는 않으며 affinity와 자원 조건도 만족해야 합니다.

**개념:**
- **Taint**: 노드에 적용 (예: "이 노드는 GPU 전용입니다")
- **Toleration**: Pod에 적용 (예: "나는 GPU 노드를 Tolerate합니다")

### 5.1 Taint 효과 (Effect)

| Effect | 동작 | 기존 Pod 영향 | 사용 시기 |
|--------|------|--------------|----------|
| `NoSchedule` | 새 Pod 스케줄링 차단 | 기존 Pod 유지 | 신규 전용 노드 생성 시 |
| `PreferNoSchedule` | 가능하면 스케줄링 차단 (Soft) | 기존 Pod 유지 | 선호 회피 (대안 허용) |
| `NoExecute` | 일치하는 toleration이 없는 Pod의 배치 차단 | Toleration이 없으면 퇴거; 있으면 `tolerationSeconds`에 따라 결정 | 노드 상태 변화에 따른 퇴거 정책 |

**Taint 적용 명령어:**

```bash
# NoSchedule: 신규 Pod 스케줄링 차단
kubectl taint nodes node1 workload-type=gpu:NoSchedule

# NoExecute: 신규 차단 + 기존 Pod Evict
kubectl taint nodes node1 maintenance=true:NoExecute

# Taint 제거 (마지막에 '-' 추가)
kubectl taint nodes node1 workload-type=gpu:NoSchedule-
```

### 5.2 일반적인 Taint 패턴

#### 패턴 1: 전용 노드 그룹 (GPU, High-Memory)

```yaml
# 노드에 Taint 적용 (kubectl 또는 Karpenter)
# kubectl taint nodes gpu-node-1 nvidia.com/gpu=present:NoSchedule

# GPU Pod가 Toleration 선언
apiVersion: v1
kind: Pod
metadata:
  name: gpu-job
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Equal
    value: present
    effect: NoSchedule
  nodeSelector:
    node.kubernetes.io/instance-type: g5.2xlarge
  containers:
  - name: trainer
    image: ml/trainer:v1.0
    resources:
      limits:
        nvidia.com/gpu: 1
```

#### 패턴 2: 시스템 워크로드 격리

이 독립 실행형 Karpenter 예시는 `v1.14.1`의 NodePool/EC2NodeClass 규약을 기준으로 합니다. 참조하는 `default` EC2NodeClass에는 대상 AMI, 노드 역할, 서브넷, 보안 그룹이 미리 구성되어 있어야 합니다. 설치된 컨트롤러·CRD와 클러스터 버전의 호환성을 확인하며, 참조 자체가 이 의존 리소스를 생성하지는 않습니다.

```yaml
# 시스템 전용 NodePool
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: system-pool
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["c6i.large", "c6i.xlarge"]
      taints:
      - key: workload-type
        value: system
        effect: NoSchedule
  limits:
    cpu: "20"
---
# 시스템 DaemonSet (모니터링 에이전트)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: monitoring-agent
spec:
  selector:
    matchLabels:
      app: monitoring-agent
  template:
    metadata:
      labels:
        app: monitoring-agent
    spec:
      tolerations:
      - key: workload-type
        operator: Equal
        value: system
        effect: NoSchedule
      # 이 DaemonSet 기본 toleration이 모든 사용자 정의 taint 우회를 허용하는 것은 아님
      - key: node.kubernetes.io/not-ready
        operator: Exists
        effect: NoExecute
      - key: node.kubernetes.io/unreachable
        operator: Exists
        effect: NoExecute
      containers:
      - name: agent
        image: monitoring-agent:v2.0
```

#### 패턴 3: 노드 유지보수 (Drain 준비)

계획된 유지보수에서 PDB를 적용하려면 `kubectl drain`의 기본 Eviction API 경로를 사용합니다. 아래 `NoExecute` 예시는 Taint 기반 삭제 동작을 보여주며, PDB를 적용하는 Drain 절차를 대신하지 않습니다.

```bash
# Step 1: 노드에 NoExecute Taint 적용
kubectl taint nodes node-1 maintenance=true:NoExecute

# 결과: Toleration 없는 모든 Pod가 즉시 Evict되고 다른 노드로 이동
# NoExecute에 의한 삭제는 Eviction API를 거치지 않으므로 PDB로 제한되지 않음

# Step 2: 유지보수 완료 후 Taint 제거
kubectl taint nodes node-1 maintenance=true:NoExecute-
kubectl uncordon node-1
```

### 5.3 Toleration 설정

#### Operator: Equal vs Exists

```yaml
# Equal: 정확한 key=value 일치 필요
tolerations:
- key: workload-type
  operator: Equal
  value: gpu
  effect: NoSchedule

---
# Exists: key만 존재하면 됨 (value 무시)
tolerations:
- key: workload-type
  operator: Exists
  effect: NoSchedule

---
# Wildcard 문법: readiness·격리 guard를 포함한 모든 taint를 tolerate함
# DaemonSet의 기본 권장값으로 사용하지 않음
tolerations:
- operator: Exists
```

#### tolerationSeconds (NoExecute 전용)

`NoExecute` taint를 tolerate하지 않는 기존 Pod는 퇴거 대상이 됩니다. 일치하는 toleration에 `tolerationSeconds`가 있으면 그 시간 동안 유지하고, 시간을 생략하면 해당 taint로는 시간 제한 없이 유지합니다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resilient-app
spec:
  tolerations:
  # 노드가 NotReady 상태가 되어도 300초 동안 유지 (일시적 장애 대응)
  - key: node.kubernetes.io/not-ready
    operator: Exists
    effect: NoExecute
    tolerationSeconds: 300
  # 노드가 Unreachable 상태가 되어도 300초 동안 유지
  - key: node.kubernetes.io/unreachable
    operator: Exists
    effect: NoExecute
    tolerationSeconds: 300
  containers:
  - name: app
    image: app:v1.0
```

**자동으로 추가되는 toleration과 명시한 toleration은 다릅니다.** 기본 admission 설정에서는 일반 Pod에 `not-ready`·`unreachable` toleration이 없을 때 각각 300초의 toleration을 추가합니다. 직접 명시한 `NoExecute` toleration에서 시간을 생략하면 300초가 아닌 무기한 허용입니다. DaemonSet controller는 두 taint에 시간 제한이 없는 toleration을 추가합니다. 이 시간은 장애 감지부터 서비스 복구까지 걸리는 전체 시간을 보장하지 않습니다.

### 5.4 EKS 기본 Taints

아래는 EKS에서도 사용하는 Kubernetes의 노드 상태 taint와 기본 toleration 동작입니다. [공식 taint·toleration 설명](https://v1-34.docs.kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)에서 스케줄링 차단과 퇴거를 구분해 확인할 수 있습니다.

| Taint | 적용 대상 | 효과 | 대응 방법 |
|-------|----------|------|----------|
| `node.kubernetes.io/not-ready` | Ready=False | NoExecute | 기본 admission은 일반 Pod에 300초, DaemonSet controller는 무기한 toleration 추가 |
| `node.kubernetes.io/unreachable` | Ready=Unknown | NoExecute | 기본 admission은 일반 Pod에 300초, DaemonSet controller는 무기한 toleration 추가 |
| `node.kubernetes.io/disk-pressure` | 디스크 부족 노드 | NoSchedule | DaemonSet에 자동 추가; 다른 Pod도 명시 가능 |
| `node.kubernetes.io/memory-pressure` | 메모리 부족 노드 | NoSchedule | BestEffort가 아닌 Pod와 DaemonSet에 자동 추가 |
| `node.kubernetes.io/pid-pressure` | PID 부족 노드 | NoSchedule | DaemonSet에 자동 추가; 다른 Pod도 명시 가능 |
| `node.kubernetes.io/network-unavailable` | 네트워크 미구성 노드 | NoSchedule | hostNetwork DaemonSet에는 자동 toleration; 일반 워크로드는 네트워크 준비 확인 |

Toleration은 부족한 자원이나 연결을 복구하지 않습니다. 스케줄링이 허용되어도 노드 압박에 따른 퇴거나 애플리케이션 실패가 발생할 수 있습니다.

### 5.5 Karpenter에서 Taint 관리

Karpenter는 NodePool에서 선언적으로 Taint를 관리합니다:

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-pool
spec:
  template:
    spec:
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["g5.xlarge", "g5.2xlarge"]
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand"]
      # 노드 프로비저닝 시 자동으로 Taint 적용
      taints:
      - key: nvidia.com/gpu
        value: present
        effect: NoSchedule
      - key: workload-type
        value: ml
        effect: NoSchedule
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodes
  limits:
    cpu: "100"
    memory: 500Gi
```

Karpenter가 프로비저닝하는 모든 노드에 자동으로 Taint가 적용되므로, 수동으로 `kubectl taint` 명령을 실행할 필요가 없습니다.

### 5.6 Cluster Autoscaler에서 Karpenter로 마이그레이션

Cluster Autoscaler는 기존 ASG의 크기를 조정하고, Karpenter는 Pod의 요구 조건에 맞춰 새 노드를 프로비저닝합니다. 마이그레이션할 때는 두 컨트롤러의 관리 범위와 Pod의 실제 배치를 함께 확인해야 합니다.

먼저 대상 AWS 계정, 역할/profile, 리전, Kubernetes context, 워크로드 namespace, ASG/관리형 노드 그룹과 NodePool을 확인합니다. NodePool 필드는 Karpenter `v1.14.1` 기준이며, 참조 EC2NodeClass에는 호환 AMI·IAM·네트워크 설정이 있어야 합니다. Cluster Autoscaler는 Kubernetes minor 버전과 맞춰야 합니다. 아래 설정 조각은 Kubernetes/CA `1.34`를 사용합니다.

롤백할 수 있도록 현재 CA 설치, launch template, 목표 용량과 워크로드 배치 설정을 보관합니다. 주차별 일정은 예시입니다. 실제로 다음 단계로 진행할지는 워크로드 상태, 용량과 데이터 검증 결과로 결정합니다.

#### 5.6.1 스케줄링 동작 차이

Cluster Autoscaler와 Karpenter의 핵심 차이는 **노드 프로비저닝 방식**과 **Pod 스케줄링과의 통합 수준**입니다.

##### 동작 비교

| 비교 항목 | Cluster Autoscaler | Karpenter |
|----------|-------------------|-----------|
| **트리거 방식** | Pending Pod 감지 → ASG 확장 요청 | Pending Pod 감지 → 즉시 EC2 프로비저닝 |
| **확장 속도** | 수십 초 ~ 수 분 (ASG 대기 시간) | 수 초 (직접 EC2 API 호출) |
| **노드 선택** | 미리 정의된 ASG 그룹 중 선택 | Pod 요구사항 기반 실시간 인스턴스 타입 선택 |
| **인스턴스 타입 다양성** | ASG당 고정된 타입 (LaunchTemplate) | 100+ 타입 중 최적 선택 (NodePool 요구사항) |
| **비용 최적화** | 수동 ASG 설정 필요 | 자동 Spot/On-Demand 믹스, 최저가 선택 |
| **Bin Packing** | 제한적 (ASG 단위) | 고급 (Pod 요구사항 인식) |
| **Taints/Tolerations 인식** | 제한적 | 네이티브 통합 |
| **Topology Spread 인식** | 제한적 | 네이티브 통합 |
| **통합 수준** | Kubernetes 외부 도구 | Kubernetes 네이티브 (CRD 기반) |

##### 확장 시나리오 예시

**시나리오: GPU를 요청하는 Pod 3개 생성**

**Cluster Autoscaler 동작:**
```text
1. GPU Pod 3개를 기존 노드에 배치할 수 없다.
2. CA가 설정된 스캔 주기로 스케줄링 불가 Pod를 평가한다.
3. 후보 노드 그룹을 시뮬레이션하고 적합한 GPU ASG의 용량 확장을 요청한다.
4. ASG가 인스턴스를 시작하고 노드가 등록되어 런타임·GPU 리소스를 초기화한다.
5. 제약을 충족하면 kube-scheduler가 Pod를 바인딩하고 kubelet이 컨테이너를 시작한다.
6. 트리거부터 용량 확보, 노드 등록, 바인딩, 워크로드 준비까지의 시간을 각각 측정한다.
```

**Karpenter 동작:**
```text
1. GPU Pod 3개를 기존 노드에 배치할 수 없다.
2. Karpenter가 Pod·NodePool 제약에 따라 프로비저닝 결정을 배치 처리한다.
3. Karpenter가 제약에 따라 NodeClaim을 생성하고 AWS provider가 적합한 인스턴스 offering을 선택한다.
4. provider v1.14.1의 인스턴스 생성 경로는 EC2 CreateFleet를 사용한다.
5. 노드 등록·리소스 초기화 후 kube-scheduler가 배치 가능한 Pod를 바인딩하고 kubelet이 시작한다.
6. 소요 시간은 용량, AMI, 네트워크, 드라이버, 워크로드 시작에 따라 달라진다. 실측 비교가 아닌 흐름 예시다.
```

##### 비용 최적화 차이

**Cluster Autoscaler:**
- ASG별로 Spot/On-Demand 분리 설정 필요
- 인스턴스 타입 변경 시 LaunchTemplate 수동 업데이트
- 과도한 프로비저닝(over-provisioning) 발생 가능

**Karpenter:**
- NodePool requirements에 허용할 capacity type을 선언하며, 배열 순서가 On-Demand 우선순위를 뜻하지 않습니다.
- 실시간으로 가장 저렴한 인스턴스 타입 선택
- Pod 요구사항에 정확히 맞는 노드 프로비저닝

**비용 절감 예시 (실측 데이터):**
```yaml
# Cluster Autoscaler: 고정 ASG
# m5.2xlarge (8 vCPU, 32GB) → $0.384/시간
# → Pod가 2 vCPU만 요청해도 전체 노드 비용 부담

# Karpenter: 유연한 선택
# m5.large (2 vCPU, 8GB) → $0.096/시간
# → Pod 요구사항에 맞춰 작은 노드 선택
# → 75% 비용 절감
```

#### 5.6.2 마이그레이션 체크리스트

Cluster Autoscaler에서 Karpenter로의 안전한 전환을 위한 단계별 가이드입니다.

##### 1단계: NodePool 정의 (ASG → NodePool 매핑)

기존 ASG 설정을 Karpenter NodePool CRD로 변환합니다.

**기존 Cluster Autoscaler 설정:**
```yaml
# ASG: eks-general-purpose-asg
# - 인스턴스 타입: m5.xlarge, m5.2xlarge
# - 용량 타입: On-Demand
# - AZ: us-east-1a, us-east-1b, us-east-1c
```

**Karpenter NodePool 변환:**
```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general-purpose
spec:
  template:
    spec:
      expireAfter: 720h  # 노드 수명 30일 예시
      requirements:
      # 인스턴스 타입: ASG LaunchTemplate에서 가져옴
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["m5.xlarge", "m5.2xlarge", "m5a.xlarge", "m5a.2xlarge"]

      # 허용 capacity type 목록이며 배열 순서는 우선순위가 아님
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]

      # AZ: 기존 ASG AZ 유지
      - key: topology.kubernetes.io/zone
        operator: In
        values: ["us-east-1a", "us-east-1b", "us-east-1c"]

      # 아키텍처: x86_64만 (ARM 제외)
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]

      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default

  # 리소스 제한: ASG Max Size 기반
  limits:
    cpu: "1000"
    memory: 1000Gi

  # 통합 정책: Consolidation 활성화
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m  # Pod 변경 후 대기 시간 예시
```

**변환 가이드:**

| ASG 설정 | NodePool 필드 | 비고 |
|---------|--------------|------|
| LaunchTemplate 인스턴스 타입 | `requirements[instance-type]` | 더 넓은 범위 권장 (비용 최적화) |
| Spot/On-Demand | `requirements[capacity-type]` | 허용 값이며 우선순위 배열이나 목표 비율이 아님 |
| Subnets (AZ) | `requirements[zone]` | SubnetSelector로도 가능 |
| Max Size | `limits.cpu`, `limits.memory` | vCPU/메모리 총합으로 환산 |
| Tags | `EC2NodeClass.tags` | 보안, 비용 추적용 태그 |

##### 2단계: Taints/Tolerations 호환성 확인

기존 ASG에 적용된 Taints를 NodePool에서도 동일하게 적용해야 합니다.

**기존 ASG Taint (UserData 스크립트):**
```bash
# /etc/eks/bootstrap.sh 옵션
--kubelet-extra-args '--register-with-taints=workload-type=batch:NoSchedule'
```

**Karpenter NodePool Taint:**
```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: batch-workload
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot"]  # Batch는 Spot 사용

      # Taint 적용: 기존 ASG와 동일하게
      taints:
      - key: workload-type
        value: batch
        effect: NoSchedule
```

**검증 명령어:**
```bash
# 기존 ASG 노드의 Taints 확인
kubectl get nodes -l eks.amazonaws.com/nodegroup=batch-asg \
  -o jsonpath='{.items[*].spec.taints}' | jq

# Karpenter 노드의 Taints 확인
kubectl get nodes -l karpenter.sh/nodepool=batch-workload \
  -o jsonpath='{.items[*].spec.taints}' | jq

# 일치 여부 확인
```

##### 3단계: PDB 검증 (마이그레이션 중 중단 최소화)

마이그레이션 중 Pod 중단을 최소화하려면 PodDisruptionBudget이 올바르게 설정되어 있어야 합니다.

**PDB 설정 확인:**
```bash
# 모든 PDB 조회
kubectl get pdb -A

# 특정 PDB 상세 확인
kubectl describe pdb api-server-pdb -n production
```

**권장 PDB 설정 (마이그레이션용):**
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: critical-app-pdb
  namespace: production
spec:
  minAvailable: 2  # 마이그레이션 중 최소 2개 유지
  selector:
    matchLabels:
      app: critical-app
```

**검증 체크리스트:**
- [ ] 모든 프로덕션 워크로드에 PDB 설정 확인
- [ ] `minAvailable` 또는 `maxUnavailable` 적절히 설정
- [ ] StatefulSet은 추가 주의 (순차 종료 확인)

##### 4단계: Topology Spread 재검증

Karpenter는 Topology Spread Constraints를 네이티브 지원하지만, 기존 설정을 재검증해야 합니다.

**검증 포인트:**

| 항목 | 확인 사항 |
|------|----------|
| **maxSkew** | Karpenter가 새 노드를 어느 AZ에 생성할지 결정할 때 영향 |
| **minDomains** | 클러스터의 실제 AZ 수와 일치하는지 확인 |
| **whenUnsatisfiable** | `DoNotSchedule` 사용 시 Karpenter가 노드를 생성해도 Pod가 Pending 가능 |

**예시: Topology Spread 문제 디버깅**
```bash
# Pod가 Pending인 이유 확인
kubectl describe pod my-app-xyz -n production

# Events 섹션에서 확인 가능한 메시지:
# "0/10 nodes are available: 3 node(s) didn't match pod topology spread constraints."

# 해결: maxSkew 완화 또는 replica 수 조정
```

##### 5단계: 모니터링 전환 (메트릭 변경)

Cluster Autoscaler와 Karpenter는 다른 메트릭을 제공합니다.

**Cluster Autoscaler 메트릭:**
```promql
# 기존 메트릭 예시
cluster_autoscaler_scaled_up_nodes_total
cluster_autoscaler_scaled_down_nodes_total
cluster_autoscaler_unschedulable_pods_count
```

**Karpenter 메트릭:**
```promql
# 새로운 메트릭 예시
karpenter_nodes_created
karpenter_nodes_terminated
karpenter_pods_startup_duration_seconds
karpenter_disruption_queue_depth
karpenter_nodepool_usage
```

**CloudWatch 대시보드 업데이트:**
```yaml
# CloudWatch Container Insights 위젯 예시
{
  "type": "metric",
  "properties": {
    "metrics": [
      [ "AWS/Karpenter", "NodesCreated", { "stat": "Sum" } ],
      [ ".", "NodesTerminated", { "stat": "Sum" } ],
      [ ".", "PendingPods", { "stat": "Average" } ]
    ],
    "period": 300,
    "stat": "Average",
    "region": "us-east-1",
    "title": "Karpenter 노드 오토스케일링"
  }
}
```

**알람 전환 체크리스트:**
- [ ] Cluster Autoscaler 알람 비활성화
- [ ] Karpenter 메트릭 기반 새 알람 생성
- [ ] 노드 생성 실패 알람 (`karpenter_nodeclaims_created{reason="failed"}`)
- [ ] Pending Pod 지속 알람 (`karpenter_pods_state{state="pending"} > 5`)

##### 6단계: 단계별 마이그레이션 전략

워크로드별로 순차적으로 전환하여 리스크를 최소화합니다.

**Phase 1: 비프로덕션 워크로드 (Week 1-2)**
선택한 Deployment에 배치 가능한 Karpenter NodePool selector를 지정하고 대체 용량과 rollout 전략을 확인합니다. 아래 재시작은 해당 Deployment만 대상으로 하며, 명령 자체가 Pod를 이동시키거나 PDB가 Deployment rollout을 제한하도록 만들지는 않습니다.

```bash
: "${CONTEXT:?대상 Kubernetes context 지정}"
: "${NAMESPACE:?개발 namespace 지정}"
: "${DEPLOYMENT:?검토한 Deployment 하나의 이름 지정}"
kubectl --context "$CONTEXT" -n "$NAMESPACE" rollout restart "deployment/$DEPLOYMENT"
kubectl --context "$CONTEXT" -n "$NAMESPACE" rollout status "deployment/$DEPLOYMENT" --timeout=5m
```

다른 워크로드로 진행하기 전에 앞의 Pod·Node 스냅샷 연결로 실제 배치와 서비스 준비 상태를 확인합니다. 검증 중에는 기존 ASG를 유지합니다.

**Phase 2: 프로덕션 워크로드 (Week 3-4)**
별도 replica 2개의 canary입니다. 기존 Deployment가 10개라면 합계 목표는 12개이며, 8+2를 목표로 하려면 기존 컨트롤러에 대한 별도 변경과 상태 확인이 필요합니다. Deployment selector가 겹치지 않는지, HPA 동작과 Service/트래픽 경로를 확인합니다. replica 비율이 트래픽 비율을 뜻하지는 않습니다.

```yaml
# 별도 canary 컨트롤러이며 트래픽 경로는 명시적으로 구성
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server-karpenter
  namespace: production
spec:
  replicas: 2  # 추가 canary replica
  selector:
    matchLabels:
      app: api-server-canary
      migration: karpenter
  template:
    metadata:
      labels:
        app: api-server-canary
        migration: karpenter
    spec:
      nodeSelector:
        karpenter.sh/nodepool: general-purpose
      containers:
      - name: api
        image: api-server:v3.0
```

**Phase 3: 병행 운영 검증 (Week 5-6)**
- Cluster Autoscaler와 Karpenter가 동시에 실행
- 트래픽 패턴 모니터링
- 비용 비교 분석
- 스케일링 속도 비교

**Phase 4: 완전 전환 (Week 7-8)**
정리 절차는 노드의 소유 주체에 따라 다릅니다. nodegroup label이나 Pod 이름으로 ASG 소속을 증명할 수 없습니다. 같은 context에서 클러스터 전체 PodList·NodeList를 수집하고 `placement_report`로 각 Pod의 owner, Node 이름, provider ID와 관찰된 pool/group label을 유지합니다.

```bash
: "${CONTEXT:?대상 Kubernetes context 지정}"
kubectl --context "$CONTEXT" get pods -A -o json > migration-pods.json
kubectl --context "$CONTEXT" get nodes -o json > migration-nodes.json
```

| 정리 기록 | 필요한 내용과 판단 |
|---|---|
| 소유 관계 인벤토리 | Node provider ID를 수집 시각이 있는 EC2/ASG·EKS 관리형 노드 그룹 인벤토리와 연결합니다. 정확한 instance ID, ASG 이름, 관리형 노드 그룹 식별자와 남은 Pod owner를 기록하며, 연결이 불명확하면 정리를 진행하지 않습니다. |
| 워크로드 이전 | 선택한 노드별로 대체 서비스·데이터 상태, PDB eviction 여유, StatefulSet 볼륨, 로컬 저장소, bootstrap/system 에이전트를 확인합니다. 검증이 끝날 때까지 대체 용량과 기존 용량을 유지합니다. |
| 소유 주체별 정리 | EKS 관리형 노드 그룹은 EKS 관리 수명주기를, 자체 관리 ASG는 검토한 IaC/ASG 수명주기를 따릅니다. CA의 재조정을 고려한 제한된 drain/scale-in 절차를 사용합니다. |
| CA 정리와 복구 | CA가 계속 담당하는 모든 ASG의 잔여 용량 계획을 확인한 후 비활성화합니다. 설치본, IAM/discovery 설정과 이전 replica 수를 보관하고, 롤백 필요 기간이 지난 후에만 설치본을 삭제합니다. |

노드를 종료하기 전에 위 항목을 확인합니다. 실제 종료 명령과 순서는 수집한 인벤토리와 해당 노드 그룹의 관리 절차에 맞춰 작성해야 합니다. ASG `ForceDelete`는 연결된 인스턴스를 종료하므로, 워크로드 이전이 끝났는지 확인하는 절차를 대신할 수 없습니다.

#### 5.6.3 병행 운영 패턴 (Cluster Autoscaler + Karpenter)

마이그레이션 기간 동안 두 오토스케일러를 안전하게 병행 운영하는 방법입니다.

##### 충돌 방지 설정

**1. NodePool 조건과 ASG 소유권 구분**

NodePool requirements는 새로 프로비저닝할 노드의 제약이며, 기존 ASG 노드에 대한 소유권 필터가 아닙니다. Karpenter는 자신의 NodeClaim·인스턴스를 관리하고 CA는 discovery 대상 ASG에 작용합니다. 두 인벤토리와 IAM 범위를 분리합니다.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: karpenter-only
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]
```

**2. Cluster Autoscaler에 노드 제외 설정**

CA의 discovery tag와 범위를 제한한 IAM 권한이 변경 가능한 ASG를 정합니다. `skip-nodes-with-system-pods`와 `skip-nodes-with-local-storage`는 scale-down 보호 설정이며 Karpenter 소유권 필터가 아닙니다.

아래는 **Kubernetes 1.34의 기존 CA Deployment용 container 목록 조각**이며 완전한 설치 예제가 아닙니다. 이름이 일치하는 컨테이너에 병합하고 기존 ServiceAccount, RBAC, IAM 연결, 리소스와 스케줄링 설정을 유지합니다. discovery tag는 실제 클러스터에 맞춥니다.

```yaml
# 기존 Deployment.spec.template.spec.containers 항목
- name: cluster-autoscaler
  image: registry.k8s.io/autoscaling/cluster-autoscaler:v1.34.0
  command:
  - ./cluster-autoscaler
  - --v=4
  - --cloud-provider=aws
  - --skip-nodes-with-system-pods=true
  - --skip-nodes-with-local-storage=true
  - --balance-similar-node-groups
  - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/my-cluster
```

**3. Pod NodeSelector로 명시적 분리**

워크로드별 실제 노드 소유 그룹을 지정합니다. 아래는 서로 다른 Deployment의 `spec.template.spec`에 병합할 조각이며, 기존 컨테이너와 selector/template label을 유지합니다. `prod-managed-nodegroup`은 임의 ASG 이름이 아니라 실제 관찰된 EKS 관리형 노드 그룹 이름이어야 합니다. 자체 관리 ASG는 검증한 사용자 정의 노드 label을 사용하고 CA의 node-template discovery 메타데이터에도 반영합니다.

```yaml
# legacy-app: 기존 Deployment.spec.template.spec 조각
nodeSelector:
  eks.amazonaws.com/nodegroup: prod-managed-nodegroup
---
# new-app: 기존 Deployment.spec.template.spec 조각
nodeSelector:
  karpenter.sh/nodepool: general-purpose
```

##### 병행 운영 체크리스트

- [ ] NodeClaim/provider ID 소유 관계와 ASG·관리형 노드 그룹 소속을 구분해 확인
- [ ] CA discovery·IAM을 대상 ASG로 제한하고 scale-down 보호 설정 유지
- [ ] 워크로드별 NodeSelector 또는 NodeAffinity 설정
- [ ] 두 오토스케일러의 메트릭 동시 모니터링
- [ ] 비용 비교 대시보드 생성
- [ ] 롤백 계획 수립 (Karpenter 문제 시 ASG로 복귀)

:::warning 병행 운영 시 주의사항
Cluster Autoscaler와 Karpenter를 동시에 실행하면 다음 문제가 발생할 수 있습니다:
- 노드 프로비저닝 경쟁 (같은 워크로드를 두 오토스케일러가 동시에 처리)
- 비용 예측 어려움 (어느 오토스케일러가 노드를 생성했는지 추적 필요)
- 디버깅 복잡성 증가

**권장 접근:**
- 워크로드 검증과 롤백 용량 유지 조건에 따라 병행 기간을 정함
- 검증한 NodeSelector 또는 NodeAffinity 제약으로 대상 워크로드를 분리
- 단계별 전환 일정 수립
:::

##### 롤백 절차

Karpenter에서 Cluster Autoscaler와 ASG로 돌아가려면 **대체 용량과 워크로드 동작을 먼저 복구한 뒤** 기존 노드를 종료해야 합니다. [Karpenter의 삭제 동작](https://karpenter.sh/docs/concepts/disruption/#manual-methods)에 따르면 NodePool 삭제는 소유한 NodeClaim과 노드의 연쇄 삭제·인스턴스 종료로 이어집니다. `kubectl delete nodepool --all`을 노드 보존 절차로 사용하지 않습니다.

1. 대상 AWS 계정·역할·리전·클러스터, ASG와 NodePool을 식별합니다. 기존 launch template, IAM, 네트워크, CA 설치 및 워크로드 배치 설정을 복구할 수 있어야 합니다. 앞 단계에서 CA Deployment나 ASG를 삭제했다면 `scale` 명령으로 되살릴 수 없으므로 보관한 IaC·설치 설정으로 다시 생성해야 합니다.
2. 선택한 ASG에 필요한 용량을 준비하고 CA의 권한·노드 그룹 검색·확장 동작을 확인합니다. 새 노드가 Ready인 것뿐 아니라 필요한 AZ, 이미지 pull, 볼륨 연결과 네트워크 접근도 검증합니다.
3. 해당 워크로드의 nodeSelector·affinity·toleration을 실제 ASG 노드의 label과 맞춥니다. Karpenter 전용 selector가 남아 있으면 대체 용량이 있어도 배치되지 않습니다. 작은 워크로드부터 옮겨 서비스 오류율·지연과 데이터 상태를 확인합니다.
4. 이전이 확인된 범위에서 기존 노드를 하나씩 cordon하고 PDB를 존중하는 drain 절차를 적용합니다. 대체 Pod가 정상 서비스하지 못하면 추가 종료를 중단하고 아직 유지 중인 용량·배치 설정으로 복귀합니다. 전체 운영 namespace를 한 번에 재시작하지 않습니다.
5. 워크로드와 데이터 이전을 확인한 뒤 정확히 식별한 NodeClaim·노드만 해당 Karpenter 버전의 종료 절차로 정리합니다. 소유 리소스가 남은 NodePool을 삭제하면 그 리소스도 종료될 수 있습니다. finalizer를 제거하거나 리소스를 orphan 처리해 종료 과정을 우회하지 않습니다.

이 순서는 복구 설계의 조건입니다. 실제 용량과 PDB, 저장소, CA·Karpenter 버전이 정해지기 전에는 그대로 실행할 수 있는 일괄 롤백 스크립트가 아닙니다.


---

## 6. PodDisruptionBudget (PDB) 고급 패턴

PodDisruptionBudget은 **Eviction API를 통한 자발적 중단**에서 중단 예산을 초과하는 요청을 제한합니다. Deployment·StatefulSet의 롤링 업데이트나 Pod 직접 삭제는 PDB로 제한되지 않습니다. 롤아웃 중 비가용 Pod도 중단 예산에는 반영되지만, 업데이트 자체의 가용성은 해당 workload controller의 전략과 Readiness 설정으로 관리합니다. 자세한 범위는 [Kubernetes Pod disruption budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/#pod-disruption-budgets)를 참조하세요.

### 6.1 PDB 기본 복습

:::info 기본 PDB 개념
PDB의 기본 개념과 Karpenter와의 상호작용은 [EKS 고가용성 아키텍처 가이드](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide#poddisruptionbudgets-pdb)에서 다룹니다. 본 섹션은 고급 패턴과 트러블슈팅에 초점을 맞춥니다.
:::

**자발적 vs 비자발적 중단:**

| 중단 유형 | 예시 | PDB 적용 | 대응 방법 |
|----------|------|---------|----------|
| **자발적: Eviction API 사용** | 기본 `kubectl drain`, Eviction API를 사용하는 노드 업그레이드·통합 | ✅ Eviction 요청 제한 | PDB 설정 |
| **자발적: controller 롤아웃·직접 삭제** | Deployment·StatefulSet 롤링 업데이트, Pod 직접 삭제 | ❌ 작업을 제한하지 않음; 비가용 Pod는 예산에 반영 | 롤아웃 전략·Readiness 설정, 직접 삭제 회피 |
| **비자발적** | 노드 크래시, OOM Kill, 하드웨어 장애, AZ 장애 | ❌ 중단을 막지 않음; 비가용 Pod는 예산에 반영 | Replica 증가, Anti-Affinity |

### 6.2 PDB 고급 전략

#### 전략 1: Rolling Update + PDB 조합

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2         # 롤아웃 중 추가 replica 최대 2개 허용
      maxUnavailable: 0   # 롤아웃으로 가용 replica를 목표 수 아래로 줄이지 않음
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api
        image: api-server:v3.0
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
spec:
  minAvailable: 8  # Eviction 허용 여부를 판단하는 최소 healthy Pod 수
  selector:
    matchLabels:
      app: api-server
```

**효과:**
- Rolling Update 중: Deployment의 `maxUnavailable: 0`과 `maxSurge: 2`가 교체 속도를 제어합니다. 새 Pod의 가용성은 Readiness와 `minReadySeconds`로 판단하며, PDB가 롤아웃을 제어하지는 않습니다. 예제의 컨테이너에는 Readiness Probe가 생략되어 있으므로 실제 서비스 준비 상태에 맞는 Probe를 추가해야 합니다.
- 노드 Drain 중: 정상 Pod가 10개이고 다른 중단이 없다면 `minAvailable: 8`은 2개 Pod의 추가 Eviction을 허용하는 예산을 만듭니다. 롤아웃이나 장애로 이미 비가용 Pod가 있으면 예산이 줄어듭니다. PDB는 장애나 직접 삭제에 의한 가용성 저하를 막지 못합니다.

롤아웃 설정의 의미는 [Kubernetes Deployment 전략](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy)을 참조하세요.

#### 전략 2: StatefulSet + PDB (데이터베이스 클러스터)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: cassandra
spec:
  serviceName: cassandra
  replicas: 5
  selector:
    matchLabels:
      app: cassandra
  template:
    metadata:
      labels:
        app: cassandra
    spec:
      containers:
      - name: cassandra
        image: cassandra:4.1
        ports:
        - containerPort: 9042
          name: cql
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: cassandra-pdb
spec:
  maxUnavailable: 1  # 선택된 Pod 집합에서 비가용 Pod를 최대 1개로 제한
  selector:
    matchLabels:
      app: cassandra
```

이 예시는 PDB와 StatefulSet의 연결을 보여주며, 완전한 Cassandra 배포 설정이 아닙니다. Cassandra의 quorum은 전체 Pod 수가 아니라 keyspace의 replication factor, 일관성 수준과 데이터 배치에 따라 정해집니다. [Cassandra 복제·일관성 설명](https://cassandra.apache.org/doc/4.1/cassandra/architecture/dynamo.html)을 바탕으로 readiness, 데이터 복제 상태와 장애 영역을 따로 확인합니다.

PDB는 선택된 **Pod 집합**의 자발적 축출 예산을 제한합니다. 모든 Karpenter 노드가 한 번에 하나씩만 제거되도록 만드는 설정은 아닙니다. 자발적 consolidation·drift 등의 노드 중단 동시성은 NodePool disruption budget에서 별도로 다룹니다.

#### 전략 3: 비율 기반 PDB (대규모 Deployment)

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: worker-pdb
spec:
  maxUnavailable: "25%"  # 동시에 최대 25% 중단 허용
  selector:
    matchLabels:
      app: worker
```

| Replica 수 | maxUnavailable: "25%" | 동시 Evict 가능 수 |
|-----------|---------------------|------------------|
| 4 | 1개 | 1 |
| 10 | 2.5 → 3개 (올림) | 3 |
| 100 | 25개 | 25 |

[Kubernetes는 PDB의 백분율을 올림합니다](https://v1-34.docs.kubernetes.io/docs/tasks/run-application/configure-pdb/#rounding-logic-when-specifying-percentages). 위 표는 대상 Pod가 모두 건강하고 다른 중단이 없을 때의 계산입니다. 실제 추가 Eviction 허용량은 이미 비가용하거나 축출 중인 Pod 등을 반영한 `status.disruptionsAllowed`로 확인합니다. 따라서 10개의 25% 설정이 3개의 중단을 허용할 수 있습니다.

**비율 기반의 장점:**
- 스케일링 시 자동으로 비율 조정
- Cluster Autoscaler / Karpenter와 자연스럽게 협업

### 6.3 PDB 트러블슈팅

#### 문제 1: Drain이 영구적으로 차단됨

**증상:**
```bash
$ kubectl drain node-1 --ignore-daemonsets
error: cannot delete Pods with local storage (use --delete-emptydir-data to override)
Cannot evict pod as it would violate the pod's disruption budget.
```

**원인:** PDB의 `minAvailable`이 현재 `replicas`와 동일하거나, 노드에 PDB 대상 Pod가 과도하게 집중됨

```yaml
# 잘못된 설정 예시
apiVersion: apps/v1
kind: Deployment
metadata:
  name: critical-app
spec:
  replicas: 3  # ⚠️ 문제: minAvailable과 같음
  # ...
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: critical-app-pdb
spec:
  minAvailable: 3  # ⚠️ 문제: replica 수와 같음
  selector:
    matchLabels:
      app: critical-app
```

**해결 방법:**

```yaml
# 올바른 설정 예시
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: critical-app-pdb
spec:
  minAvailable: 2  # ✅ replica 수(3)보다 작게 설정
  selector:
    matchLabels:
      app: critical-app
```

`minAvailable: "67%"`로 바꾸면 3 × 0.67 = 2.01을 올림하여 **3개**를 요구합니다. 이 예제처럼 3개 중 2개를 유지하려면 위의 정수 `minAvailable: 2`를 사용합니다. replica 수를 변경할 때는 애플리케이션의 가용성 요구와 예산을 다시 확인합니다.

:::warning PDB 설정 시 주의사항
`minAvailable`을 replica 수와 같게 두는 것은 해당 PDB가 선택한 건강한 Pod의 자발적 축출을 금지하려는 유효한 정책일 수 있습니다. 이 유지보수 예제에서는 축출 여유가 필요하지만, 모든 워크로드의 예산을 일괄 완화해서는 안 됩니다. 애플리케이션 담당자와 필요한 복제본·건강 상태·유지보수 조건을 확인합니다. 해당 Pod가 없는 다른 노드까지 모두 drain 불가라는 뜻은 아닙니다.
:::

#### 문제 2: PDB가 적용되지 않음

**증상:** 노드 Drain 시 PDB 무시되고 모든 Pod가 동시에 Evict됨

**원인:**
1. PDB의 `selector`가 Pod `labels`와 일치하지 않음
2. PDB가 다른 namespace에 생성됨
3. PDB의 `minAvailable: 0` 또는 `maxUnavailable: "100%"`

**확인 방법:**

```bash
# PDB 상태 확인
kubectl get pdb -A
kubectl describe pdb <pdb-name>

# PDB가 선택하는 Pod 수 확인
# ALLOWED DISRUPTIONS 컬럼이 0이면 Drain 차단, 1 이상이면 허용
```

#### 문제 3: Karpenter 통합과 PDB 충돌

**증상:** Karpenter가 노드를 제거하려 하지만 PDB 때문에 실패하고, 노드가 `cordoned` 상태로 남음

**원인:** PDB가 너무 엄격하여 Karpenter의 Disruption budget과 충돌

**해결 방법:**

```yaml
# Karpenter NodePool에 Disruption budget 설정
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general-pool
spec:
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m
    # 동시에 최대 20% 노드 중단 허용
    budgets:
    - nodes: "20%"
  # ...
```

**균형 잡힌 PDB 예시:**

```yaml
# 애플리케이션 PDB: 최소 가용성 보장
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  maxUnavailable: "33%"  # 동시에 33%까지 중단 허용
  selector:
    matchLabels:
      app: my-app
```

이렇게 설정하면 Karpenter가 노드를 통합할 때 PDB를 존중하면서도 유연하게 통합을 진행할 수 있습니다.

---

## 7. Priority & Preemption

PriorityClass는 Pod의 우선순위를 정의하며, 리소스 부족 시 낮은 우선순위 Pod를 Evict(Preemption)하여 높은 우선순위 Pod를 스케줄링합니다.

### 7.1 PriorityClass 정의

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 1000000  # 높을수록 우선순위 높음 (최대 10억)
globalDefault: false
description: "High priority for mission-critical services"
```

**주요 속성:**

| 속성 | 설명 | 권장값 |
|------|------|--------|
| `value` | 우선순위 값 (정수) | 0 ~ 1,000,000,000 |
| `globalDefault` | 기본 PriorityClass 여부 | `false` (명시적 지정 권장) |
| `preemptionPolicy` | Preemption 정책 | `PreemptLowerPriority` (기본) 또는 `Never` |
| `description` | 설명 | 사용 목적 명시 |

:::warning System PriorityClass 예약 범위
10억 이상의 값은 Kubernetes 시스템 컴포넌트(kube-system)용으로 예약되어 있습니다. 사용자 정의 PriorityClass는 10억 미만의 값을 사용하세요.
:::

### 7.2 프로덕션 5-Tier 우선순위 체계 {#72-프로덕션-4-tier-우선순위-체계}

**권장 우선순위 계층:**

```yaml
# Tier 1: Critical System (10억 미만 최고값)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: system-critical
value: 999999000
globalDefault: false
description: "Critical system components (DNS, CNI, monitoring)"
---
# Tier 2: Business Critical (100만)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: business-critical
value: 1000000
globalDefault: false
description: "Revenue-impacting services (payment, checkout, auth)"
---
# Tier 3: High Priority (10만)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 100000
globalDefault: false
description: "Important services (API, web frontend)"
---
# Tier 4: Standard (1만, 기본값)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: standard-priority
value: 10000
globalDefault: true  # PriorityClass 미지정 시 기본값
description: "Standard workloads"
---
# Tier 5: Low Priority (1천)
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: low-priority
value: 1000
globalDefault: false
preemptionPolicy: Never  # 다른 Pod를 Preempt하지 않음
description: "Batch jobs, non-critical background tasks"
```

**적용 예시:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      priorityClassName: business-critical  # 최우선 보장
      containers:
      - name: payment
        image: payment-service:v2.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: data-cleanup
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          priorityClassName: low-priority  # 배치 작업은 낮은 우선순위
          containers:
          - name: cleanup
            image: data-cleanup:v1.0
```

### 7.3 Preemption 동작 이해

Preemption은 높은 우선순위 Pod가 스케줄링되지 못할 때, 낮은 우선순위 Pod를 Evict하여 리소스를 확보하는 메커니즘입니다.

```mermaid
flowchart TB
    START[높은 우선순위 Pod<br/>스케줄링 요청]
    CHECK{리소스 충분?}
    SCHEDULE[즉시 스케줄링]
    FIND[Preemption 후보<br/>노드 탐색]
    CANDIDATE{낮은 우선순위<br/>Pod 존재?}
    EVICT[낮은 우선순위 Pod<br/>Evict]
    WAIT[Evict 완료 대기<br/>gracePeriod]
    BIND[높은 우선순위 Pod<br/>스케줄링]
    PENDING[Pending 상태 유지<br/>Cluster Autoscaler 대기]

    START --> CHECK
    CHECK -->|예| SCHEDULE
    CHECK -->|아니오| FIND
    FIND --> CANDIDATE
    CANDIDATE -->|예| EVICT
    CANDIDATE -->|아니오| PENDING
    EVICT --> WAIT
    WAIT --> BIND

    style START fill:#4286f4,stroke:#2a6acf,color:#fff
    style EVICT fill:#ff4444,stroke:#cc3636,color:#fff
    style BIND fill:#34a853,stroke:#2a8642,color:#fff
    style PENDING fill:#fbbc04,stroke:#c99603,color:#000
```

**Preemption 의사결정 과정:**

1. **높은 우선순위 Pod 스케줄링 실패**
2. **Preemption 후보 노드 탐색**: 낮은 우선순위 Pod를 제거하면 스케줄링 가능한 노드 찾기
3. **Victim Pod 선택**: 가장 낮은 우선순위부터 제거 대상 선정
4. **PDB 고려**: PDB 위반을 피하는 Victim 조합을 우선 탐색하되, 가능한 조합이 없으면 PDB를 위반하는 Preemption도 허용
5. **Graceful Eviction**: `terminationGracePeriodSeconds` 존중하며 Evict
6. **리소스 확보 후 스케줄링**: 높은 우선순위 Pod 배치

:::tip Preemption과 PDB의 관계
스케줄러의 Preemption은 PDB를 **best effort로 고려**합니다. PDB를 위반하지 않는 Victim을 찾지 못하면 낮은 우선순위 Pod를 제거하면서 PDB를 위반할 수 있습니다. Eviction API의 예산 강제와 같은 보장이 아닙니다. [Kubernetes Preemption의 PDB 지원 범위](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#poddisruptionbudget-is-supported-but-not-guaranteed)를 참조하세요.
:::

**Preemption 예시 시나리오:**

```yaml
# 현재 클러스터 상태: 노드 리소스가 거의 가득 참
# Node-1: low-priority-pod (CPU: 2, Memory: 4Gi)
# Node-2: standard-priority-pod (CPU: 2, Memory: 4Gi)

# 높은 우선순위 Pod 생성 요청
apiVersion: v1
kind: Pod
metadata:
  name: critical-payment
spec:
  priorityClassName: business-critical  # 우선순위: 1000000
  containers:
  - name: payment
    image: payment:v1.0
    resources:
      requests:
        cpu: "2"
        memory: 4Gi

# 결과:
# 1. 스케줄러가 리소스 부족 감지
# 2. low-priority-pod (우선순위: 1000)를 Victim으로 선택
# 3. low-priority-pod Evict (graceful shutdown)
# 4. critical-payment Pod 스케줄링
```

### 7.4 PreemptionPolicy: Never

특정 워크로드가 다른 Pod를 Preempt하지 않도록 설정할 수 있습니다:

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: batch-job
value: 5000
globalDefault: false
preemptionPolicy: Never  # 다른 Pod를 Preempt하지 않음
description: "Batch jobs that wait for available resources"
```

**사용 사례:**
- **배치 작업**: 리소스가 생길 때까지 대기하는 것이 더 나은 경우
- **테스트/개발 워크로드**: 프로덕션 워크로드를 방해하지 않아야 할 때
- **낮은 긴급성**: 즉시 실행되지 않아도 괜찮은 작업

### 7.5 Priority + QoS Class 조합 고급 패턴

PriorityClass는 스케줄링·선점과 kubelet pressure eviction에 영향을 주며, QoS는 admission 후의 리소스 구성을 나타냅니다. 아래 예시는 Pod 수준 리소스 선언이 아닌 컨테이너별 CPU·메모리 설정을 사용하는 Linux Pod 기준입니다. 기본값과 주입된 컨테이너를 포함한 실제 Pod를 확인합니다. 이 설정만으로 즉시 배치, OOM 생존이나 실측 비용 등급이 보장되지는 않습니다.

#### QoS Class 복습

Kubernetes는 Pod의 리소스 요청(requests)과 제한(limits) 설정에 따라 자동으로 QoS Class를 할당합니다.

| QoS Class | admission 후 조건 | CPU 동작 | 메모리 pressure 판단 | 일반적 사용 |
|-----------|------|-------------|-------------------|------------|
| **Guaranteed** | 모든 컨테이너에 양수인 CPU·메모리 request와 limit이 있고 리소스별 두 값이 같음 | CPU limit에 도달하면 스로틀링 가능 | request가 순위에 영향을 주며 eviction·OOM은 여전히 가능 | 리소스를 신중히 산정한 중요 워크로드 |
| **Burstable** | Guaranteed가 아니며 하나 이상의 컨테이너에 양수인 CPU 또는 메모리 request나 limit이 있음 | 컨테이너의 limit과 경합에 따라 달라짐 | request 초과 사용 여부와 priority가 중요 | 일반 웹 앱, API |
| **BestEffort** | 모든 컨테이너에 양수인 CPU·메모리 request와 limit이 없음 | 이 구성에는 컨테이너 CPU limit이 없지만 경합은 발생 가능 | 메모리를 사용하면 request 0을 초과함 | 리소스 경합을 감수하도록 설계한 워크로드 |

**QoS Class 결정 규칙:**

```yaml
# Guaranteed: requests = limits (모든 컨테이너)
resources:
  requests:
    cpu: "1"
    memory: 2Gi
  limits:
    cpu: "1"      # requests와 동일
    memory: 2Gi   # requests와 동일

---
# Burstable 예시: Guaranteed 조건 미충족
resources:
  requests:
    cpu: "500m"
    memory: 1Gi
  limits:
    cpu: "2"      # requests보다 큼
    memory: 4Gi   # requests보다 큼

---
# BestEffort: 아무것도 설정 안함
resources: {}
```

**QoS Class 확인:**
```bash
# Pod의 QoS Class 확인
kubectl get pod my-pod -o jsonpath='{.status.qosClass}'

# 네임스페이스 전체 Pod의 QoS 분포
kubectl get pods -n production \
  -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
```

#### 권장 조합 매트릭스

아래 매트릭스는 워크로드 정책 예시입니다. priority 값과 이름은 실제 클러스터의 PriorityClass에 맞춰야 하며, 표는 실측 생존율이나 비용 순위를 나타내지 않습니다.

| 조합 | Priority 정책 | QoS | 스케줄링 판단 | 메모리 pressure 판단 | 워크로드 예시 |
|------|----------|-----|-----------------|-------------|------|
| **Tier 1** | critical | Guaranteed | 높은 우선순위지만 배치 가능 조건 필요 | 양수인 request/limit이 일치해도 OOM·eviction 가능 | 결제 시스템, DB |
| **Tier 2** | high | Guaranteed | critical 정책보다 낮음 | 같은 QoS 분류에 다른 priority 적용 | API 게이트웨이 |
| **Tier 3** | standard | Burstable | 일반 정책 | 실제 사용량과 request를 비교 | 프론트엔드, 백오피스 |
| **Tier 4** | low | Burstable | 낮은 우선순위 정책 | 낮은 priority로 eviction·선점 가능성 증가 | 내부 도구 |
| **Tier 5** | batch | BestEffort | 이 예시에서 가장 낮은 정책 | 메모리 사용량이 request를 초과 | 재시도 가능한 배치, CI/CD |

**조합별 상세 설명:**

##### Tier 1: Guaranteed + critical-priority (최고 보장)

**특징:**
- 낮은 priority Pod를 제거해 배치가 가능해지는 경우 높은 priority가 선점에 사용될 수 있음
- 이 예시의 양수인 CPU·메모리 request/limit 일치로 Guaranteed QoS가 성립
- request와 priority는 kubelet pressure eviction에 영향을 주며 kernel OOM은 별도 메커니즘
- 메모리 limit, 노드 pressure와 다른 장애로 Pod가 종료될 수 있음

**실전 YAML:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
  namespace: production
spec:
  replicas: 6
  selector:
    matchLabels:
      app: payment-gateway
      tier: critical
  template:
    metadata:
      labels:
        app: payment-gateway
        tier: critical
    spec:
      priorityClassName: critical-priority  # Priority: 10000
      containers:
      - name: gateway
        image: payment-gateway:v3.5
        resources:
          requests:
            cpu: "2"
            memory: 4Gi
          limits:
            cpu: "2"       # requests와 동일 → Guaranteed
            memory: 4Gi    # requests와 동일 → Guaranteed
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: payment-gateway-pdb
  namespace: production
spec:
  minAvailable: 4  # 6개 중 최소 4개 항상 유지
  selector:
    matchLabels:
      app: payment-gateway
```

**사용 시나리오:**
- 금융 거래 시스템 (결제, 송금)
- 실시간 주문 처리
- 데이터베이스 (MySQL, PostgreSQL)
- 메시지 큐 (Kafka, RabbitMQ)

##### Tier 2: Guaranteed + high-priority (핵심 서비스)

**특징:**
- critical 다음 우선순위
- 예시 컨테이너의 CPU·메모리 request와 같은 limit으로 Guaranteed QoS 성립
- pressure eviction과 kernel OOM이 가능하며 QoS만으로 고정된 종료 순서는 없음
- 일반적인 프로덕션 서비스의 권장 설정

**실전 YAML:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      priorityClassName: high-priority  # Priority: 5000
      containers:
      - name: api
        image: api-server:v2.8
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
          limits:
            cpu: "1"       # Guaranteed
            memory: 2Gi    # Guaranteed
        env:
        - name: MAX_CONNECTIONS
          value: "1000"
```

**사용 시나리오:**
- REST API 서버
- GraphQL 서버
- 인증/인가 서비스
- 세션 관리 서비스

##### Tier 3: Burstable + standard-priority (일반 웹 앱)

**특징:**
- request는 스케줄링 용량과 경합 시 CPU 배분에 사용되며 서비스 무중단을 보장하지 않음
- 유휴 시 추가 리소스 사용 가능 (limits > requests)
- 비용 효율적이면서 안정적
- 대부분의 웹 애플리케이션에 적합

**실전 YAML:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
  namespace: production
spec:
  replicas: 8
  selector:
    matchLabels:
      app: web-frontend
  template:
    metadata:
      labels:
        app: web-frontend
    spec:
      priorityClassName: standard-priority  # Priority: 1000
      containers:
      - name: frontend
        image: web-frontend:v1.12
        resources:
          requests:
            cpu: "500m"    # 스케줄링·상대적 배분에 사용하는 CPU request
            memory: 1Gi    # 메모리 request이며 limit이 아님
          limits:
            cpu: "2"       # 최대 4배 버스트 허용
            memory: 4Gi    # 최대 4배 버스트 허용
        env:
        - name: NODE_ENV
          value: "production"
```

**사용 시나리오:**
- 웹 프론트엔드 (React, Vue, Angular)
- 백오피스 애플리케이션
- 내부 대시보드
- CMS (Content Management System)

##### Tier 4: Burstable + low-priority (내부 도구)

**특징:**
- 작은 리소스 request를 사용하며 실제 사용량을 기준으로 산정
- 리소스 부족 시 Preempt 대상
- 비용 최소화
- 서비스 중단 시 영향 제한적

**실전 YAML:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: monitoring-agent
  namespace: monitoring
spec:
  replicas: 3
  selector:
    matchLabels:
      app: monitoring-agent
  template:
    metadata:
      labels:
        app: monitoring-agent
    spec:
      priorityClassName: low-priority  # Priority: 500
      containers:
      - name: agent
        image: monitoring-agent:v2.1
        resources:
          requests:
            cpu: "100m"    # CPU request
            memory: 256Mi
          limits:
            cpu: "500m"
            memory: 1Gi
```

**사용 시나리오:**
- 모니터링 에이전트
- 로그 수집기 (Fluent Bit, Fluentd)
- 메트릭 Exporter
- 개발 도구

##### Tier 5: BestEffort + batch-priority (배치 작업)

**특징:**
- 이 예시에는 CPU·메모리 request/limit이 없으며 리소스 경합이 발생할 수 있음
- 메모리를 사용하면 request를 초과하지만 pressure eviction 순위에는 priority도 작용
- 비용 최소화 (Spot 인스턴스 활용 가능)
- 재시도 가능한 작업에 적합

**실전 YAML:**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: data-pipeline
  namespace: batch
spec:
  schedule: "0 2 * * *"  # 매일 새벽 2시
  jobTemplate:
    spec:
      template:
        spec:
          priorityClassName: batch-priority  # Priority: 100
          restartPolicy: OnFailure
          containers:
          - name: etl
            image: data-pipeline:v1.8
            resources: {}  # BestEffort: requests/limits 없음
            env:
            - name: BATCH_SIZE
              value: "10000"
          # Spot 인스턴스에 배치
          nodeSelector:
            karpenter.sh/capacity-type: spot
          tolerations:
          - key: karpenter.sh/capacity-type
            operator: Equal
            value: spot
            effect: NoSchedule
```

**사용 시나리오:**
- ETL 파이프라인
- 데이터 분석 작업
- CI/CD 빌드
- 이미지/동영상 처리

#### Eviction 순서 (OOM 발생 시)

아래 다이어그램은 kubelet의 **메모리 pressure eviction**을 설명하며 kernel OOM killer나 컨테이너의 메모리 limit 초과를 나타내지 않습니다. kubelet은 먼저 노드 수준 리소스 회수를 시도하고, Pod eviction이 필요하면 부족한 리소스를 기준으로 후보를 정렬합니다.

```mermaid
flowchart TD
    A["메모리 pressure 임계값 충족"]
    B["노드 수준 리소스 회수 시도"]
    C["메모리 request를 초과한 Pod 우선"]
    D["그다음 낮은 Pod priority 순"]
    E["그다음 request 대비 초과 사용량이 큰 순"]
    F["후보를 evict하고 pressure 재평가"]
    A --> B
    B -->|Pod eviction이 계속 필요| C
    C --> D
    D --> E
    E --> F
```

**Eviction 결정 요소:**

1. 부족한 리소스의 사용량이 request를 초과하는지 여부.
2. 해당 그룹 안에서 Pod priority.
3. priority가 같을 때 request 대비 사용량.

QoS는 일부 메모리 request 구성과 연관되지만 정렬 알고리즘 자체는 아닙니다. 디스크 pressure는 디스크 관련 신호를 사용하며, kernel OOM killer는 `oom_score_adj`와 프로세스 메모리 사용량을 사용합니다. 어느 쪽도 QoS만으로 무조건적인 생존 순서를 정하지 않습니다.

**예시 시나리오:**

```text
메모리 pressure 후보 예시(실측 이벤트 아님):
Pod 1: request 0, 사용량 4 GiB, priority 500       -> request 초과
Pod 2: request 2 GiB, 사용량 6 GiB, priority 1000 -> request 초과
Pod 3: request 4 GiB, 사용량 5 GiB, priority 5000 -> request 초과
Pod 4: request 8 GiB, 사용량 8 GiB, priority 10000 -> request 미초과
이 후보 사이의 순서는 1, 2, 3, 4다.
이는 request와 priority에 따른 결과이며 보편적인 QoS 순서가 아니다.
kubelet은 eviction 후 pressure를 다시 평가하므로 모든 후보를 evict할 필요는 없다.
```

#### Kubelet Eviction 설정

Karpenter `v1.14.1`과 호환 AL2023 EC2NodeClass에서는 지원되는 `spec.kubelet` 필드를 설정합니다. 해당 class의 검증된 AMI, role/instance profile, 서브넷·보안 그룹 selector를 유지합니다. 새로 프로비저닝할 노드의 설정 병합이며, user data로 실행 중인 kubelet 파일을 덮어쓰거나 서비스를 재시작하지 않습니다.

**Eviction 임계값 예시:**

실제로 적용되는 기본값은 AMI와 bootstrap 설정에 따라 다릅니다. 아래 JSON은 설정할 수 있는 값의 예시입니다. 해당 클러스터의 EKS 기본값을 측정한 결과는 아닙니다.

```json
{
  "evictionHard": {
    "memory.available": "100Mi",
    "nodefs.available": "10%",
    "imagefs.available": "15%"
  },
  "evictionSoft": {
    "memory.available": "500Mi",
    "nodefs.available": "15%"
  },
  "evictionSoftGracePeriod": {
    "memory.available": "1m30s",
    "nodefs.available": "2m"
  }
}
```

**커스터마이징 예시 (Karpenter EC2NodeClass):**

병합 후 적용될 전체 임계값을 검토한 뒤 아래 매핑을 `EC2NodeClass/custom-eviction.spec.kubelet`에 병합합니다. 설정한 모든 soft 신호에는 대응하는 soft grace period가 필요합니다.

```yaml
# EC2NodeClass.spec.kubelet 조각이며 값은 예시
evictionHard:
  memory.available: 200Mi
  nodefs.available: "10%"
  imagefs.available: "15%"
  nodefs.inodesFree: "5%"
  imagefs.inodesFree: "5%"
evictionSoft:
  memory.available: 1Gi
  nodefs.available: "15%"
evictionSoftGracePeriod:
  memory.available: 2m
  nodefs.available: 3m
evictionMaxPodGracePeriod: 60
```

**Eviction 임계값 설명:**

| 설정 | 의미 | 병합 예시 값 |
|------|------|--------|
| `evictionHard.memory.available` | soft grace period가 없는 hard 임계값 | 200Mi |
| `evictionSoft.memory.available` | grace period 동안 평가하는 soft 임계값 | 1Gi |
| `evictionSoftGracePeriod.memory.available` | soft 임계값 충족 상태가 지속되어야 하는 시간 | 2m |
| `evictionMaxPodGracePeriod` | soft eviction의 최대 종료 유예 시간 | 60초 |

:::warning Eviction 설정 시 주의사항
임계값에는 워크로드와 노드 메모리 근거가 필요합니다. 너무 낮으면 kubelet이 메모리를 회수하기 전에 kernel OOM이 발생할 수 있고, 높으면 가용 여유가 줄어듭니다. hard 임계값에 의한 eviction은 graceful termination을 제공하지 않습니다.

**권장 접근:**
- 값을 정하기 전에 노드 예약량, 최대 메모리, 이미지·디스크 사용과 회수 동작을 측정합니다.
- 기본값을 재정의할 때 필요한 hard 신호를 유지하고 최종 AMI/kubelet 설정을 확인합니다.
- pressure와 종료 결과를 관찰하며, 예시 값을 프로덕션 용량 산정 결과로 간주하지 않습니다.
:::

#### 실전 조합 패턴 검증

**패턴 1: Multi-Tier 아키텍처**

```yaml
# Tier 1: Database (Guaranteed + critical)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  template:
    spec:
      priorityClassName: critical-priority
      containers:
      - name: postgres
        image: postgres:16
        resources:
          requests:
            cpu: "4"
            memory: 16Gi
          limits:
            cpu: "4"
            memory: 16Gi
---
# Tier 2: API Server (Guaranteed + high)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 10
  template:
    spec:
      priorityClassName: high-priority
      containers:
      - name: api
        resources:
          requests: { cpu: "1", memory: 2Gi }
          limits: { cpu: "1", memory: 2Gi }
---
# Tier 3: Frontend (Burstable + standard)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 8
  template:
    spec:
      priorityClassName: standard-priority
      containers:
      - name: frontend
        resources:
          requests: { cpu: "500m", memory: 1Gi }
          limits: { cpu: "2", memory: 4Gi }
---
# Tier 4: Monitoring (Burstable + low)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  template:
    spec:
      priorityClassName: low-priority
      containers:
      - name: exporter
        resources:
          requests: { cpu: "100m", memory: 128Mi }
          limits: { cpu: "200m", memory: 256Mi }
```

**검증 명령어:**
```bash
# QoS + Priority 분포 확인
kubectl get pods -A -o custom-columns=\
NAME:.metadata.name,\
NAMESPACE:.metadata.namespace,\
QOS:.status.qosClass,\
PRIORITY:.spec.priorityClassName,\
CPU_REQ:.spec.containers[0].resources.requests.cpu,\
MEM_REQ:.spec.containers[0].resources.requests.memory

# 노드별 QoS 분포 확인
kubectl describe node <node-name> | grep -A 10 "Non-terminated Pods"
```

#### 트러블슈팅: QoS + Priority 조합 문제

| 증상 | 원인 | 해결 방법 |
|------|------|----------|
| Guaranteed Pod가 OOM Kill됨 | limits 설정이 너무 낮음 | 메모리 프로파일링 후 limits 상향 |
| Burstable Pod가 CPU 스로틀링 | limits 도달, 노드 리소스 부족 | requests 상향 또는 노드 추가 |
| Low-priority Pod가 계속 Pending | High-priority Pod가 리소스 독점 | 노드 추가 또는 Priority 재조정 |
| BestEffort Pod가 즉시 종료됨 | Eviction 임계값 도달 | Burstable로 전환, requests 설정 |

:::tip QoS + Priority 최적화 팁
1. **모니터링**: Prometheus의 `container_memory_working_set_bytes`, `container_cpu_usage_seconds_total` 메트릭으로 실제 사용량 추적
2. **Rightsizing**: VPA(Vertical Pod Autoscaler) 권장값 참고
3. **단계적 전환**: BestEffort → Burstable → Guaranteed 순으로 점진적 적용
4. **비용 균형**: 모든 Pod를 Guaranteed로 설정하면 비용 증가, 워크로드 중요도에 따라 차등 적용
:::

---

## 8. Descheduler

Descheduler는 이미 스케줄링된 Pod를 **재배치**하여 클러스터의 균형을 맞추는 도구입니다. Kubernetes 스케줄러는 초기 배치만 담당하므로, 시간이 지나면 노드 간 불균형이 발생할 수 있습니다.

### 8.1 Descheduler가 필요한 이유

**시나리오 1: 노드 추가 후 불균형**
- 기존 노드에 Pod가 몰려있고, 새로 추가된 노드는 비어있음
- Descheduler가 오래된 Pod를 Evict → 스케줄러가 새 노드에 재배치

**시나리오 2: Affinity/Anti-Affinity 위반**
- Pod 배치 후 노드 레이블이 변경되어 Affinity 조건 위반
- Descheduler가 위반 Pod를 Evict → 조건에 맞는 노드에 재배치

**시나리오 3: 리소스 파편화**
- 일부 노드는 CPU 과다 사용, 일부는 유휴 상태
- Descheduler가 불균형 해소

### 8.2 Descheduler 설치 (Helm)

```bash
# Descheduler Helm Chart 추가
helm repo add descheduler https://kubernetes-sigs.github.io/descheduler/
helm repo update

# 기본 설치
helm install descheduler descheduler/descheduler \
  --namespace kube-system \
  --set cronJobApiVersion="batch/v1" \
  --set schedule="*/15 * * * *"  # 15분마다 실행
```

**CronJob vs Deployment 모드:**

| 모드 | 실행 주기 | 리소스 사용 | 권장 환경 |
|------|----------|------------|----------|
| **CronJob** | 주기적 (예: 15분) | 실행 시만 리소스 사용 | 소~중규모 클러스터 (권장) |
| **Deployment** | 지속적 실행 | 항상 리소스 사용 | 대규모 클러스터 (1000+ 노드) |

### 8.3 주요 Descheduler 전략

#### 전략 1: RemoveDuplicates

**목적**: 같은 Controller(ReplicaSet, Deployment)의 Pod가 한 노드에 중복 배치된 경우, 분산시킴

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        pluginConfig:
        - name: RemoveDuplicates
          args:
            # 노드당 같은 Controller의 Pod 1개만 유지
            excludeOwnerKinds:
            - "ReplicaSet"
            - "StatefulSet"
        plugins:
          balance:
            enabled:
            - RemoveDuplicates
```

**효과**: 같은 Deployment의 replica가 여러 개 한 노드에 있으면, 일부를 Evict하여 다른 노드로 분산

#### 전략 2: LowNodeUtilization

**목적**: 리소스 사용률이 낮은 노드와 높은 노드 간 균형 조정

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        pluginConfig:
        - name: LowNodeUtilization
          args:
            # 낮은 사용률 기준 (이 이하면 underutilized)
            thresholds:
              cpu: 20
              memory: 20
              pods: 20
            # 높은 사용률 기준 (이 이상이면 overutilized)
            targetThresholds:
              cpu: 50
              memory: 50
              pods: 50
        plugins:
          balance:
            enabled:
            - LowNodeUtilization
```

**동작:**
1. CPU/Memory/Pod 수가 20% 미만인 노드 식별 (underutilized)
2. 50% 이상인 노드 식별 (overutilized)
3. overutilized 노드에서 Pod를 Evict
4. Kubernetes 스케줄러가 underutilized 노드에 재배치

#### 전략 3: RemovePodsViolatingNodeAffinity

**목적**: Node Affinity 조건을 위반하는 Pod 제거 (노드 레이블 변경 후)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        pluginConfig:
        - name: RemovePodsViolatingNodeAffinity
          args:
            nodeAffinityType:
            - requiredDuringSchedulingIgnoredDuringExecution
        plugins:
          deschedule:
            enabled:
            - RemovePodsViolatingNodeAffinity
```

**시나리오**: GPU 노드에서 `gpu=true` 레이블 제거 → GPU 요구 Pod가 레이블 없는 노드에 남음 → Descheduler가 Evict → GPU 노드에 재배치

#### 전략 4: RemovePodsViolatingInterPodAntiAffinity

**목적**: Pod Anti-Affinity 조건을 위반하는 Pod 제거

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        plugins:
          deschedule:
            enabled:
            - RemovePodsViolatingInterPodAntiAffinity
```

**시나리오**: 초기에는 노드가 충분하여 Anti-Affinity 만족 → 노드 축소로 같은 노드에 위반 Pod 배치 → 노드 추가 후 Descheduler가 재배치

#### 전략 5: RemovePodsHavingTooManyRestarts

**목적**: 과도하게 재시작되는 문제 있는 Pod 제거 (다른 노드에서 재시도)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        pluginConfig:
        - name: RemovePodsHavingTooManyRestarts
          args:
            podRestartThreshold: 10  # 10회 이상 재시작 시 Evict
            includingInitContainers: true
        plugins:
          deschedule:
            enabled:
            - RemovePodsHavingTooManyRestarts
```

#### 전략 6: PodLifeTime

**목적**: 오래된 Pod를 제거하여 최신 이미지/설정으로 교체

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        pluginConfig:
        - name: PodLifeTime
          args:
            maxPodLifeTimeSeconds: 604800  # 7일 (7 * 24 * 3600)
            # 특정 상태의 Pod만 대상
            states:
            - Running
            # 특정 레이블의 Pod 제외
            labelSelector:
              matchExpressions:
              - key: app
                operator: NotIn
                values:
                - stateful-db
        plugins:
          deschedule:
            enabled:
            - PodLifeTime
```

### 8.4 Descheduler vs Karpenter Consolidation 비교

| 기능 | Descheduler | Karpenter Consolidation |
|------|------------|------------------------|
| **목적** | Pod 재배치 (균형) | 노드 제거 (비용 절감) |
| **범위** | Pod 레벨 | 노드 레벨 |
| **실행 주기** | CronJob (예: 15분) | 지속적 감시 (실시간) |
| **전략** | 다양한 전략 (6+개) | Empty / Underutilized 노드 |
| **PDB 존중** | ✅ 예 | ✅ 예 |
| **노드 추가/제거** | ❌ 아니오 | ✅ 예 |
| **Cluster Autoscaler 호환** | ✅ 예 | N/A (대체재) |
| **주요 사용 사례** | 불균형 해소, Affinity 위반 해결 | 비용 최적화, 노드 통합 |
| **함께 사용 가능** | ✅ Karpenter와 병행 가능 | ✅ Descheduler와 병행 가능 |

:::tip Descheduler + Karpenter 조합 권장
Descheduler는 Pod 재배치에 특화되고, Karpenter는 노드 관리에 특화되어 있습니다. 두 도구를 함께 사용하면 시너지가 발생합니다:
- Descheduler가 불균형 Pod를 Evict
- Kubernetes 스케줄러가 Pod를 다른 노드에 재배치
- Karpenter가 비어있는 노드를 제거하여 비용 절감
:::

**함께 사용하는 설정 예시:**

```yaml
# Descheduler: 15분마다 균형 조정
apiVersion: batch/v1
kind: CronJob
metadata:
  name: descheduler
  namespace: kube-system
spec:
  schedule: "*/15 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: descheduler
            image: registry.k8s.io/descheduler/descheduler:v0.29.0
            command:
            - /bin/descheduler
            - --policy-config-file=/policy/policy.yaml
---
# Karpenter: 지속적 노드 통합
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general
spec:
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m  # 5분 후 통합 시작
    budgets:
    - nodes: "20%"
```

#### 8.4.1 Descheduler + Karpenter 실전 조합 패턴

Descheduler와 Karpenter를 함께 사용하면 Pod 재배치와 노드 통합이 자동으로 조율되어 클러스터 효율성과 비용 절감을 동시에 달성할 수 있습니다.

**조합의 시너지 원리:**

1. **1단계 (Descheduler)**: 리소스 불균형 감지 및 Pod 재배치
   - `LowNodeUtilization` 전략으로 과도하게 사용되는 노드에서 Pod Evict
   - `RemoveDuplicates`, `RemovePodsViolatingNodeAffinity` 등으로 불필요한 Pod 재배치

2. **2단계 (Kubernetes Scheduler)**: Evict된 Pod를 최적의 노드에 재스케줄링
   - 리소스 여유가 있는 노드 선택
   - Affinity/Anti-Affinity, Topology Spread 조건 만족

3. **3단계 (Karpenter)**: 비어있거나 저활용 노드 제거
   - `consolidateAfter` 시간 경과 후 빈 노드 통합
   - 여러 저활용 노드의 Pod를 더 작은 수의 노드로 통합
   - 불필요한 노드 종료로 비용 절감

**타이밍 조율 예시:**

```yaml
# Descheduler: 15분 주기로 LowNodeUtilization 실행
apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha2"
    kind: "DeschedulerPolicy"
    profiles:
      - name: default
        pluginConfig:
        - name: LowNodeUtilization
          args:
            thresholds:
              cpu: 20
              memory: 20
              pods: 20
            targetThresholds:
              cpu: 50
              memory: 50
              pods: 50
        plugins:
          balance:
            enabled:
            - LowNodeUtilization
---
# Karpenter: 5분 후 빈 노드 통합 (Descheduler 실행 후 충분한 시간 부여)
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general-pool
spec:
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m  # Descheduler가 Pod를 이동시킨 후 5분 대기
    budgets:
    - nodes: "20%"  # 동시에 최대 20% 노드만 통합
  template:
    spec:
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]
```

**실제 동작 시나리오:**

```
시간: 00:00 - Descheduler 실행 (15분 주기)
  └─ Node-A (CPU 80%, Memory 85%) → overutilized 감지
  └─ Node-B (CPU 15%, Memory 10%) → underutilized 감지
  └─ Node-A에서 Pod-1, Pod-2 Evict

시간: 00:01 - Kubernetes Scheduler 재배치
  └─ Pod-1 → Node-B로 스케줄링
  └─ Pod-2 → Node-C로 스케줄링
  └─ Node-A는 이제 CPU 50%, Memory 55% (정상 범위)

시간: 00:06 - Karpenter 통합 (5분 경과)
  └─ Node-B: 여전히 저활용 상태지만 Pod 실행 중 → 유지
  └─ Node-D: 빈 노드 감지 (이전에 Pod가 있었으나 이동) → 종료
  └─ 비용 절감 달성
```

**PDB와의 상호작용:**

Descheduler와 Karpenter는 모두 PDB를 존중하므로, 안전한 조합이 가능합니다:

```yaml
# 애플리케이션 PDB 설정
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api-server
---
# Descheduler와 Karpenter는 모두 이 PDB를 존중하며 동작
# - Descheduler: minAvailable을 위반하는 Eviction 차단
# - Karpenter: 노드 제거 시 minAvailable 보장
```

**주의사항: Pod Flapping 방지**

Descheduler와 Karpenter의 타이밍이 충돌하면 Pod가 반복적으로 이동하는 현상이 발생할 수 있습니다:

:::warning Pod Flapping 방지
Descheduler 실행 주기와 Karpenter `consolidateAfter` 간격을 적절히 조율하세요:
- **권장 패턴**: Descheduler 15분 주기 + Karpenter 5분 `consolidateAfter`
- **위험 패턴**: Descheduler 5분 주기 + Karpenter 1분 `consolidateAfter` (너무 빈번)
- **안전장치**: Karpenter `budgets`로 동시 통합 노드 수 제한
:::

**모니터링 및 검증:**

```bash
# 1. Descheduler 로그 확인
kubectl logs -n kube-system -l app=descheduler --tail=50

# 2. Karpenter 통합 이벤트 확인
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter --tail=50 | grep consolidation

# 3. 노드별 Pod 분포 확인
kubectl get pods -A -o wide | awk '{print $8}' | sort | uniq -c

# 4. 노드 리소스 사용률 확인
kubectl top nodes

# 5. PDB 상태 확인 (Eviction 차단 여부)
kubectl get pdb -A
```

**조합의 장점:**

| 장점 | 설명 |
|------|------|
| **자동 균형 조정** | Descheduler가 리소스 불균형 자동 해소 |
| **비용 최적화** | Karpenter가 불필요한 노드 제거 |
| **안전성 보장** | PDB 존중으로 서비스 중단 방지 |
| **운영 부담 감소** | 수동 개입 없이 자동 조율 |
| **확장성** | 클러스터 규모에 관계없이 동작 |

---

## 9. EKS 스케줄링 종합 전략

### 9.1 워크로드 유형별 스케줄링 설정 매트릭스

아래 표는 다양한 워크로드 유형에 대한 권장 스케줄링 설정을 정리한 것입니다.

| 워크로드 유형 | Node Selector/Affinity | Pod Anti-Affinity | Topology Spread | Taints/Tolerations | PriorityClass | PDB | 추가 고려사항 |
|-------------|----------------------|-------------------|-----------------|-------------------|---------------|-----|-------------|
| **API 서버** | On-Demand 노드 | Soft (노드 분산) | Hard (AZ 분산) | - | `high-priority` | `minAvailable: "67%"` | Readiness Probe 필수 |
| **결제 서비스** | On-Demand, 특정 인스턴스 타입 | Hard (노드 분산) | Hard (AZ 분산, minDomains: 3) | - | `business-critical` | `minAvailable: 2` | PCI-DSS 준수 노드 |
| **ML 학습** | GPU 노드 (g5.xlarge+) | Soft (노드 분산) | - | GPU Taint Tolerate | `high-priority` | `maxUnavailable: 1` | Spot 가능 (checkpointing 있을 때) |
| **ML 추론** | GPU 노드 | Hard (AZ 분산) | Hard (AZ 분산) | GPU Taint Tolerate | `high-priority` | `minAvailable: 2` | On-Demand 권장 |
| **데이터베이스 (StatefulSet)** | EBS 가용 노드, WaitForFirstConsumer | Hard (노드 분산) | Hard (AZ 분산) | - | `business-critical` | `maxUnavailable: 1` | PVC 백업 필수 |
| **캐시 (Redis)** | Memory 최적화 노드 (r6i) | Hard (노드 분산) | Hard (AZ 분산) | - | `high-priority` | `minAvailable: 2` | Persistence 설정 |
| **배치 작업** | Spot 노드 허용 | - | - | Spot Tolerate | `low-priority`, `preemptionPolicy: Never` | - | 재시작 가능 설계 |
| **CI/CD Runner** | Spot 노드 선호 | - | - | Spot Tolerate | `low-priority` | - | Ephemeral 작업 |
| **로그 수집 (DaemonSet)** | 수집 대상 노드 | - | - | 노드·에이전트에 필요한 toleration만 | `system-critical` | - | `hostPath` 사용 |
| **Ingress Controller** | On-Demand | Hard (노드 분산) | Hard (AZ 분산) | - | `high-priority` | `minAvailable: 2` | NodePort / LB 구성 |
| **모니터링 (Prometheus)** | 전용 모니터링 노드 | Soft (노드 분산) | Soft (AZ 분산) | 모니터링 Taint Tolerate | `high-priority` | `minAvailable: 1` | 대용량 스토리지 |
| **웹 프론트엔드** | ARM 노드 가능 | Soft (노드 분산) | Hard (AZ 분산) | - | `standard-priority` | `minAvailable: "50%"` | CDN 통합 |
| **백그라운드 워커** | Spot 노드 | - | Soft (AZ 분산) | Spot Tolerate | `standard-priority` | `maxUnavailable: "50%"` | 재시도 로직 필수 |
| **Serverless (Knative)** | Spot + On-Demand 혼합 | - | Soft (AZ 분산) | - | `standard-priority` | - | Scale-to-zero 설정 |
| **AI/ML 학습** | GPU 노드 (g5.xlarge+) | Soft (노드 분산) | Soft (AZ 분산) | GPU Taint Tolerate | `high-priority` | `maxUnavailable: 1` | Checkpointing, Spot 가능 |
| **AI/ML 추론** | GPU/Inferentia 노드 | Hard (노드 분산) | Hard (AZ 분산) | GPU Taint Tolerate | `high-priority` | `minAvailable: 2` | On-Demand 권장 |

### 9.2 AI/ML 워크로드 스케줄링 패턴

AI/ML 워크로드는 GPU, 대용량 메모리, 특수 가속기(Inferentia, Trainium) 등의 리소스를 필요로 하며, 학습과 추론의 요구사항이 크게 다릅니다.

#### 9.2.1 GPU 워크로드 스케줄링

GPU 워크로드는 전용 노드 격리, 리소스 요청, Node Affinity를 조합하여 효율적으로 스케줄링합니다.

**GPU 리소스 요청 패턴:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-training-job
spec:
  containers:
  - name: trainer
    image: ml/trainer:v3.0
    resources:
      requests:
        nvidia.com/gpu: 1  # GPU 1개 요청
        cpu: "4"
        memory: 16Gi
      limits:
        nvidia.com/gpu: 1  # limits는 requests와 동일하게 설정
        cpu: "4"
        memory: 16Gi
```

:::info GPU 리소스 관리
`nvidia.com/gpu`는 정수 단위로만 요청 가능하며, limits는 requests와 동일해야 합니다. GPU는 오버커밋(overcommit)이 불가능하므로 fractional GPU가 필요하면 Multi-Instance GPU(MIG) 또는 Time-Slicing을 고려하세요.
:::

**GPU 전용 NodePool + 워크로드 배포:**

이 예시는 Karpenter `v1.14.1`을 기준으로 하며 Kubernetes 버전, 리전, GPU 계열에 맞는 EKS-optimized AL2023 x86_64 NVIDIA AMI를 검증해야 합니다. EKS는 2025년 11월 26일 AL2 optimized/accelerated AMI 게시를 중단했습니다. 아래 AMI ID는 자리표시자이므로 이를 교체하고 역할·네트워크 selector를 확인하기 전에는 구조 예시입니다. AMI의 드라이버·런타임 호환표와 필요한 allocatable GPU를 보고하는 NVIDIA device plugin을 확인하며, `amiFamily`만으로 이 기능의 설치나 동작이 증명되지는 않습니다.
```yaml
# Karpenter NodePool: GPU 전용 노드 그룹
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-pool
spec:
  template:
    spec:
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values:
        - g5.xlarge   # 1x NVIDIA A10G, 4 vCPU, 16 GiB
        - g5.2xlarge  # 1x NVIDIA A10G, 8 vCPU, 32 GiB
        - g5.4xlarge  # 1x NVIDIA A10G, 16 vCPU, 64 GiB
        - g5.12xlarge # 4x NVIDIA A10G, 48 vCPU, 192 GiB
      - key: karpenter.sh/capacity-type
        operator: In
        values:
        - on-demand  # 학습 워크로드는 On-Demand 권장
      # GPU 전용 노드 격리
      taints:
      - key: nvidia.com/gpu
        value: present
        effect: NoSchedule
      - key: workload-type
        value: ml-training
        effect: NoSchedule
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodes
  limits:
    cpu: "200"
    memory: 800Gi
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 10m  # 빈 GPU 노드는 10분 후 제거 (비용 절감)
---
# EC2NodeClass: AL2023 NVIDIA AMI 선택의 구조 예시
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-nodes
spec:
  amiFamily: AL2023
  amiSelectorTerms:
  - id: ami-0123456789abcdef0  # 자리표시자: 해당 리전에서 검증한 x86_64 NVIDIA AMI ID 필요
  role: KarpenterNodeRole
  subnetSelectorTerms:
  - tags:
      karpenter.sh/discovery: my-cluster
  securityGroupSelectorTerms:
  - tags:
      karpenter.sh/discovery: my-cluster
---
# ML 학습 워크로드: GPU 노드에 스케줄링
apiVersion: batch/v1
kind: Job
metadata:
  name: model-training
spec:
  parallelism: 4  # 4개 병렬 학습
  completions: 4
  template:
    metadata:
      labels:
        app: model-training
    spec:
      # GPU Taint Tolerate
      tolerations:
      - key: nvidia.com/gpu
        operator: Equal
        value: present
        effect: NoSchedule
      - key: workload-type
        operator: Equal
        value: ml-training
        effect: NoSchedule
      # GPU 노드 선택
      nodeSelector:
        node.kubernetes.io/instance-type: g5.2xlarge
      # Pod Anti-Affinity: 각 Job Pod를 다른 노드에 배치
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - model-training
              topologyKey: kubernetes.io/hostname
      containers:
      - name: trainer
        image: ml/pytorch-trainer:v2.0
        resources:
          requests:
            nvidia.com/gpu: 1
            cpu: "7"
            memory: 28Gi
          limits:
            nvidia.com/gpu: 1
            cpu: "7"
            memory: 28Gi
        env:
        - name: NCCL_DEBUG
          value: "INFO"
        volumeMounts:
        - name: data
          mountPath: /data
        - name: checkpoints
          mountPath: /checkpoints
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: training-data
      - name: checkpoints
        persistentVolumeClaim:
          claimName: model-checkpoints
      restartPolicy: OnFailure
```

**Multi-Instance GPU (MIG) 활용:**

NVIDIA A100, A30 등의 GPU는 MIG를 지원하여 하나의 GPU를 여러 독립적인 인스턴스로 분할할 수 있습니다.

```yaml
# MIG 프로파일 요청 예시 (A100 GPU)
apiVersion: v1
kind: Pod
metadata:
  name: mig-inference
spec:
  containers:
  - name: inference
    image: ml/inference:v1.0
    resources:
      requests:
        nvidia.com/mig-1g.5gb: 1  # 1/7 A100 (1 GPU slice, 5GB memory)
      limits:
        nvidia.com/mig-1g.5gb: 1
```

**MIG 프로파일:**

| MIG 프로파일 | GPU Slice | 메모리 | 사용 사례 |
|-------------|-----------|--------|----------|
| `mig-1g.5gb` | 1/7 | 5GB | 소형 추론 |
| `mig-2g.10gb` | 2/7 | 10GB | 중형 추론 |
| `mig-3g.20gb` | 3/7 | 20GB | 대형 추론 |
| `mig-7g.40gb` | 7/7 | 40GB | 전체 GPU (학습) |

#### 9.2.2 DRA (Dynamic Resource Allocation) 소개

Kubernetes 1.34+에서는 Dynamic Resource Allocation(DRA)을 통해 GPU 등의 특수 리소스를 더 유연하게 할당할 수 있습니다.

**DRA의 장점:**

| 기존 방식 (Device Plugin) | DRA (K8s 1.34+) |
|-------------------------|----------------|
| 정적 리소스 이름 (`nvidia.com/gpu`) | 동적 리소스 클레임 |
| 노드 레벨 할당 | Pod 레벨 세밀한 제어 |
| 단순 카운팅 (1, 2, 3...) | 리소스 속성 기반 선택 |
| 제한적 공유 | 동적 공유/분할 |
| 노드 재시작 필요 | 런타임 재구성 |

**DRA ResourceClass 및 ResourceClaim 예시:**

```yaml
# ResourceClass: GPU 리소스 클래스 정의
apiVersion: resource.k8s.io/v1alpha4
kind: ResourceClass
metadata:
  name: nvidia-a100-gpu
spec:
  driverName: gpu.nvidia.com
  parameters:
    apiVersion: gpu.nvidia.com/v1alpha1
    kind: GpuConfig
    memory: "40Gi"
    computeCapability: "8.0"  # A100
    migEnabled: true
---
# ResourceClaim: GPU 리소스 요청
apiVersion: resource.k8s.io/v1alpha4
kind: ResourceClaim
metadata:
  name: ml-training-gpu
  namespace: ml-team
spec:
  resourceClassName: nvidia-a100-gpu
  parametersRef:
    apiGroup: gpu.nvidia.com
    kind: GpuClaimParameters
    name: training-params
---
# GpuClaimParameters: 세부 요구사항
apiVersion: gpu.nvidia.com/v1alpha1
kind: GpuClaimParameters
metadata:
  name: training-params
  namespace: ml-team
spec:
  count: 1  # GPU 1개
  migProfile: "mig-3g.20gb"  # MIG 프로파일 지정
  sharing: "TimeSlicing"  # 시간 분할 공유 허용
---
# Pod: ResourceClaim 사용
apiVersion: v1
kind: Pod
metadata:
  name: dra-training-pod
  namespace: ml-team
spec:
  resourceClaims:
  - name: gpu-claim
    resourceClaimName: ml-training-gpu
  containers:
  - name: trainer
    image: ml/trainer:v3.0
    resources:
      claims:
      - name: gpu-claim
    env:
    - name: CUDA_VISIBLE_DEVICES
      value: "0"
```

:::info DRA 도입 시기
DRA 코어는 Kubernetes 1.34에서 GA되었습니다 (`resource.k8s.io/v1`, 기본 활성화). 프로덕션 사용 가능하며, 현재는 기존 Device Plugin 방식과 병행 사용 가능합니다.
:::

#### 9.2.3 AI 학습 vs 추론 스케줄링 전략

AI/ML 워크로드는 학습(Training)과 추론(Inference)의 요구사항이 크게 다르므로, 각각에 맞는 스케줄링 전략이 필요합니다.

**학습 vs 추론 비교:**

| 비교 항목 | 학습 (Training) | 추론 (Inference) |
|----------|----------------|-----------------|
| **GPU 요구** | 대규모 (4-8+ GPU) | 소규모 (1-2 GPU) 또는 Inferentia |
| **실행 시간** | 장시간 (수 시간~수 일) | 짧은 지연 (ms~초) |
| **워크로드 타입** | 배치 작업 (Job) | 상시 서비스 (Deployment) |
| **인스턴스 타입** | g5, p4d, p5 (NVIDIA) | g5 (소형), inf2 (Inferentia), c7g (Graviton) |
| **Spot 사용** | ✅ 가능 (Checkpointing 필수) | ⚠️ 신중 (고가용성 필요) |
| **PriorityClass** | `standard-priority` | `high-priority` |
| **PDB** | `maxUnavailable: 1` (재시작 허용) | `minAvailable: 2` (가용성 보장) |
| **스케줄링 전략** | Soft Anti-Affinity (분산 선호) | Hard Anti-Affinity (장애 격리) |
| **비용 최적화** | Spot + Reserved Instances | On-Demand + Savings Plans |

**학습 워크로드 스케줄링 예시:**

이 Job의 목표 병렬도는 8개 Pod이며, 각 Pod가 GPU 4개를 요청하므로 모두 실행될 때 총 32개 GPU를 할당합니다. [G5 사양](https://aws.amazon.com/ec2/instance-types/g5/)상 `g5.12xlarge`는 A10G GPU 4개를 제공하므로 GPU 공유를 구성하지 않은 경우 목표 병렬도에는 이 인스턴스 8대가 필요합니다. `parallelism`은 [Job의 Pod 병렬도](https://kubernetes.io/docs/concepts/workloads/controllers/job/#controlling-parallelism)이며 GPU 수 자체가 아닙니다. GPU의 `requests`와 `limits`는 [Kubernetes GPU 리소스 규칙](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/#using-device-plugins)에 따라 같은 값으로 설정합니다.

```yaml
# 대규모 분산 학습: 32-GPU Job (8 Pod × Pod당 4 GPU)
apiVersion: batch/v1
kind: Job
metadata:
  name: distributed-training
spec:
  parallelism: 8
  completions: 8
  template:
    metadata:
      labels:
        app: distributed-training
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        operator: Equal
        value: spot
        effect: NoSchedule  # Spot 노드 허용
      nodeSelector:
        node.kubernetes.io/instance-type: g5.12xlarge  # 4x A10G per node
      affinity:
        # Soft Anti-Affinity: 가능하면 다른 노드에 분산
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: distributed-training
              topologyKey: kubernetes.io/hostname
      containers:
      - name: trainer
        image: ml/pytorch-distributed:v2.0
        resources:
          requests:
            nvidia.com/gpu: 4  # Pod당 4 GPU
            cpu: "45"
            memory: 180Gi
          limits:
            nvidia.com/gpu: 4
        env:
        - name: MASTER_ADDR
          value: "distributed-training-master"
        - name: WORLD_SIZE
          value: "8"  # 총 8개 프로세스
        - name: RANK
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        volumeMounts:
        - name: checkpoints
          mountPath: /checkpoints
      volumes:
      - name: checkpoints
        persistentVolumeClaim:
          claimName: training-checkpoints
      restartPolicy: OnFailure
```

#### 9.2.4 Setu: Kueue + Karpenter 프로액티브 스케줄링

분산 AI 학습 워크로드(예: PyTorch DDP, JAX)는 **Gang Scheduling** 요구사항을 가집니다. 모든 GPU 노드가 동시에 준비되지 않으면 리소스 낭비가 발생하거나 학습이 시작되지 않습니다. 기존 Karpenter는 **반응형(reactive)** 프로비저닝만 지원하여, Pod가 Pending 상태가 된 후에야 노드를 생성합니다. 이로 인해 다음과 같은 문제가 발생합니다:

**기존 Karpenter의 한계:**

| 문제 | 설명 | 영향 |
|------|------|------|
| **부분 할당 리스크** | 4-GPU 노드 4대가 필요한데 2대만 프로비저닝 성공 | 2대는 유휴 상태 유지, 비용 낭비 |
| **스케줄링 지연** | Pod Pending → Karpenter 감지 → EC2 프로비저닝 (순차 프로세스) | 분산 학습 시작까지 수 분 소요 |
| **원자성 부재** | 일부 노드만 생성되고 나머지는 용량 부족으로 실패 | 워크로드가 무한 대기 상태 |

**Setu 솔루션:**

Setu는 Kueue의 **AdmissionCheck**와 Karpenter의 **NodeClaim v1 API**를 브릿지하여, 워크로드 승인 전에 필요한 모든 노드를 **프로액티브하게** 프로비저닝합니다.

**동작 흐름:**

```mermaid
sequenceDiagram
    participant User
    participant Kueue
    participant Setu
    participant Karpenter
    participant EC2

    User->>Kueue: Job 제출 (4-GPU 노드 4대 필요)
    Kueue->>Kueue: Workload 생성 (Pending)
    Kueue->>Setu: AdmissionCheck 요청
    Setu->>Karpenter: NodeClaim 4개 생성 (원자적)
    Karpenter->>EC2: EC2 인스턴스 4대 프로비저닝
    EC2-->>Karpenter: 모든 노드 Ready
    Karpenter-->>Setu: NodeClaim 승인 완료
    Setu-->>Kueue: AdmissionCheck 통과
    Kueue->>Kueue: Workload 승인 (Active)
    Kueue->>User: Pod 스케줄링 시작 (즉시 배치)
```

**Gang Scheduling과 스케줄링 안전성:**

Setu의 핵심 가치는 **All-or-Nothing** 보장입니다. 분산 학습 워크로드는 모든 replica가 동시에 실행되어야 의미가 있습니다.

| 시나리오 | 기존 Karpenter | Setu + Kueue |
|---------|---------------|-------------|
| **4-GPU 노드 4대 필요** | 2대만 생성 → 2대 유휴 → 비용 낭비 | 4대 모두 Ready 확인 후 승인 → 낭비 제로 |
| **노드 프로비저닝 실패** | 일부 Pod만 Running, 나머지 무한 Pending | 자동 롤백 + 지수 백오프 재시도 (5s-80s, 최대 5회) |
| **스케줄링 시작 시점** | 노드가 생성될 때마다 순차 스케줄링 | 모든 노드 Ready → 동시 스케줄링 |

**실패 처리 및 재시도 로직:**

Setu는 노드 프로비저닝 실패 시 지능적으로 대응합니다:

```
실패 시나리오:
1. NodeClaim 4개 중 3개만 성공 (1개는 Spot 용량 부족)
2. Setu가 실패 감지 → 모든 NodeClaim 삭제 (롤백)
3. 지수 백오프 재시도:
   - 1회 재시도: 5초 후
   - 2회 재시도: 10초 후
   - 3회 재시도: 20초 후
   - 4회 재시도: 40초 후
   - 5회 재시도: 80초 후 (최종)
4. 5회 실패 시 AdmissionCheck 영구 실패 → Kueue가 Workload 거부
```

**Kueue 통합 아키텍처:**

Setu는 Kueue의 AdmissionCheck CRD를 사용하여 워크로드 승인 프로세스에 통합됩니다.

```yaml
# 1. AdmissionCheck 정의: Setu 컨트롤러 지정
apiVersion: kueue.x-k8s.io/v1beta1
kind: AdmissionCheck
metadata:
  name: karpenter-provision
spec:
  controllerName: setu.io/karpenter-provision
---
# 2. ClusterQueue: AdmissionCheck 적용
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: ml-training-queue
spec:
  namespaceSelector: {}
  resourceGroups:
  - coveredResources: ["cpu", "memory", "nvidia.com/gpu"]
    flavors:
    - name: gpu-flavor
      resources:
      - name: nvidia.com/gpu
        nominalQuota: 32  # 총 32 GPU까지 허용
  # Setu AdmissionCheck 연결
  admissionChecks:
  - karpenter-provision
---
# 3. LocalQueue: 네임스페이스별 큐
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: training-jobs
  namespace: ml-team
spec:
  clusterQueue: ml-training-queue
---
# 4. Job: Kueue 라벨 추가
apiVersion: batch/v1
kind: Job
metadata:
  name: distributed-training
  namespace: ml-team
  labels:
    kueue.x-k8s.io/queue-name: training-jobs  # LocalQueue 지정
spec:
  parallelism: 4
  completions: 4
  template:
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: g5.2xlarge
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: trainer
        image: ml/pytorch-distributed:v2.0
        resources:
          requests:
            nvidia.com/gpu: 1
            cpu: "7"
            memory: 28Gi
      restartPolicy: OnFailure
```

**실행 흐름 상세:**

```
1. Job 제출 → Kueue Workload 생성 (Pending 상태)
2. Kueue가 리소스 쿼터 확인 (ClusterQueue: 32 GPU 중 4 GPU 사용 가능)
3. Kueue가 AdmissionCheck 실행 → Setu 컨트롤러 호출
4. Setu가 NodeClaim 4개 생성 (g5.2xlarge, 각 1 GPU)
5. Karpenter가 EC2 인스턴스 4대 프로비저닝
6. 모든 노드 Ready 확인 (kubelet 등록 + GPU 디바이스 플러그인 활성화)
7. Setu가 AdmissionCheck 승인 → Kueue가 Workload Active로 전환
8. Kueue가 Job의 suspend: false 설정 → Pod 4개 스케줄링 시작
9. Scheduler가 Pod를 새로 생성된 GPU 노드에 즉시 배치 (Pending 시간 제로)
```

**비교: 기존 Karpenter vs Setu + Kueue:**

| 단계 | 기존 Karpenter | Setu + Kueue |
|------|---------------|-------------|
| **Job 제출** | 즉시 Pod 생성 (Pending) | Kueue가 Workload로 관리 (승인 대기) |
| **노드 프로비저닝** | Pod Pending 감지 후 반응 | AdmissionCheck에서 사전 프로비저닝 |
| **부분 실패 처리** | 일부 Pod만 Running, 나머지 무한 대기 | 전체 롤백 + 재시도 (All-or-Nothing) |
| **스케줄링 시작** | 노드 생성 시마다 순차 | 모든 노드 Ready 후 동시 |
| **소요 시간** | 2-3분 (순차 프로세스) | 1-2분 (병렬 + 사전 준비) |

**권장 사용 사례:**

| 워크로드 유형 | Setu 필요 여부 | 이유 |
|-------------|--------------|------|
| **대규모 분산 학습** (16+ GPU) | ✅ 필수 | Gang Scheduling 보장, 부분 할당 방지 |
| **소규모 학습** (1-4 GPU) | ⚠️ 선택 | 오버헤드 대비 이득 제한적 |
| **단일 GPU 추론** | ❌ 불필요 | 기존 Karpenter로 충분 |
| **배치 처리** (CPU 워크로드) | ⚠️ 선택 | 비용 효율성 목적이라면 유용 |

:::info Setu 설치 및 설정
Setu는 Karpenter v1.0+ 및 Kueue v0.6+를 요구합니다. Helm 차트를 통해 설치 가능하며, 상세 가이드는 [Setu GitHub 저장소](https://github.com/sanjeevrg89/Setu)를 참조하세요.
:::

:::warning 프로덕션 사용 시 고려사항
Setu는 커뮤니티 프로젝트로, 프로덕션 환경에서는 다음을 검증해야 합니다:
- Karpenter/Kueue 버전 호환성
- NodeClaim 생성 실패 시 알람 설정
- ClusterQueue 쿼터 모니터링 (리소스 고갈 방지)
:::

**추론 워크로드 스케줄링 예시:**

하나의 `podAntiAffinity` 아래에 노드별 필수 조건과 AZ별 선호 조건을 함께 둡니다. 4개 replica는 서로 다른 적격 노드 4대가 필요하지만, AZ는 선호 조건이므로 3개 AZ에서도 배치할 수 있습니다. AZ별 균등 분산을 보장하는 설정은 아닙니다. 필수 anti-affinity의 `topologyKey`를 `kubernetes.io/hostname`으로 제한하는 admission 설정도 고려한 구성입니다. [Kubernetes inter-pod affinity와 anti-affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#inter-pod-affinity-and-anti-affinity)를 참조하세요.

```yaml
# 고가용성 추론 서비스: On-Demand GPU 노드
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference
spec:
  replicas: 4
  selector:
    matchLabels:
      app: ml-inference
  template:
    metadata:
      labels:
        app: ml-inference
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      nodeSelector:
        karpenter.sh/capacity-type: on-demand  # On-Demand만 사용
      affinity:
        # Hard Anti-Affinity: 각 노드에 최대 1개 replica
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: ml-inference
            topologyKey: kubernetes.io/hostname
          # Soft Anti-Affinity: 가능하면 다른 AZ에 분산
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: ml-inference
              topologyKey: topology.kubernetes.io/zone
      priorityClassName: high-priority
      containers:
      - name: inference
        image: ml/triton-inference:v2.0
        resources:
          requests:
            nvidia.com/gpu: 1
            cpu: "3"
            memory: 12Gi
          limits:
            nvidia.com/gpu: 1
            cpu: "3"
            memory: 12Gi
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 8001
          name: grpc
        livenessProbe:
          httpGet:
            path: /v2/health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /v2/health/ready
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 5
---
# PDB: Eviction API 요청에 최소 2개 healthy Pod 기준 적용
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ml-inference-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: ml-inference
```

**Inferentia/Graviton 추론 최적화:**

AWS Inferentia는 추론 전용 가속기로, GPU 대비 최대 70% 비용 절감이 가능합니다.

```yaml
# Inferentia 노드 스케줄링
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inferentia-inference
spec:
  replicas: 6
  selector:
    matchLabels:
      app: inferentia-inference
  template:
    metadata:
      labels:
        app: inferentia-inference
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: inf2.xlarge  # AWS Inferentia2
      tolerations:
      - key: aws.amazon.com/neuron
        operator: Exists
        effect: NoSchedule
      containers:
      - name: inference
        image: ml/neuron-inference:v1.0
        resources:
          requests:
            aws.amazon.com/neuron: 1  # Inferentia 코어 1개
            cpu: "3"
            memory: 8Gi
          limits:
            aws.amazon.com/neuron: 1
        env:
        - name: NEURON_RT_NUM_CORES
          value: "1"
```

**비용 최적화 전략 요약:**

| 워크로드 | 인스턴스 타입 | Spot 사용 | 권장 전략 |
|---------|-------------|----------|----------|
| **대규모 학습** | g5.12xlarge, p4d.24xlarge | ✅ 가능 | Spot + Checkpointing + Spot Interruption Handler |
| **소규모 학습** | g5.2xlarge, g5.4xlarge | ✅ 가능 | Spot 70% + On-Demand 30% 혼합 |
| **고성능 추론** | g5.xlarge, g5.2xlarge | ❌ 비권장 | On-Demand + Savings Plans |
| **경량 추론** | inf2.xlarge, c7g.xlarge | ❌ 비권장 | On-Demand 또는 Reserved Instances |
| **배치 추론** | g5.xlarge | ✅ 가능 | Spot + 재시도 로직 |

### 9.2 스케줄링 의사결정 플로우차트

```mermaid
flowchart TB
    START[새 워크로드 배포]
    Q1{미션 크리티컬?<br/>매출/보안 영향}

    Q2{GPU/특수 HW<br/>필요?}
    Q3{재시작<br/>허용 가능?}
    Q4{여러 AZ에<br/>분산 필요?}
    Q5{동일 노드에<br/>여러 replica<br/>허용 가능?}
    Q6{특정 노드 타입<br/>필요?}

    A1[PriorityClass:<br/>business-critical]
    A2[PriorityClass:<br/>high-priority]
    A3[PriorityClass:<br/>standard-priority]
    A4[PriorityClass:<br/>low-priority]

    B1[Node Affinity:<br/>GPU 노드 지정]
    B2[Taints/Tolerations:<br/>전용 노드 격리]
    B3[Spot 노드 허용]

    C1[Topology Spread:<br/>maxSkew: 1, AZ 분산]
    C2[Topology Spread:<br/>maxSkew: 2, Soft]

    D1[Pod Anti-Affinity:<br/>Hard, hostname]
    D2[Pod Anti-Affinity:<br/>Soft, hostname]

    E1[PDB:<br/>minAvailable: 2]
    E2[PDB:<br/>minAvailable: 67%]
    E3[PDB:<br/>maxUnavailable: 1]

    F1[Node Selector:<br/>특정 인스턴스 타입]
    F2[Node Affinity:<br/>인스턴스 패밀리 선호]

    FINAL[배포 설정 완료]

    START --> Q1
    Q1 -->|예| A1
    Q1 -->|중요| A2
    Q1 -->|보통| A3
    Q1 -->|배치 작업| A4

    A1 --> Q2
    A2 --> Q2
    A3 --> Q2
    A4 --> Q3

    Q2 -->|예| B1
    Q2 -->|아니오| Q6

    Q3 -->|예| B3
    Q3 -->|아니오| Q6

    B1 --> B2
    B2 --> Q4
    B3 --> FINAL

    Q6 -->|예| F1
    Q6 -->|선호| F2
    Q6 -->|아니오| Q4
    F1 --> Q4
    F2 --> Q4

    Q4 -->|예| C1
    Q4 -->|선호| C2
    Q4 -->|아니오| Q5

    C1 --> E1
    C2 --> Q5

    Q5 -->|아니오| D1
    Q5 -->|예| D2
    Q5 -->|무관| E2

    D1 --> E1
    D2 --> E2
    E1 --> FINAL
    E2 --> FINAL
    E3 --> FINAL

    style START fill:#4286f4,stroke:#2a6acf,color:#fff
    style A1 fill:#ff4444,stroke:#cc3636,color:#fff
    style A2 fill:#ff9900,stroke:#cc7a00,color:#fff
    style FINAL fill:#34a853,stroke:#2a8642,color:#fff
```

**의사결정 가이드:**

1. **비즈니스 영향도 평가** → PriorityClass 결정
2. **하드웨어 요구사항** → Node Affinity, Taints/Tolerations
3. **비용 최적화** → Spot 노드 허용 여부
4. **고가용성 요구사항** → Topology Spread, Anti-Affinity
5. **업그레이드 안전성** → 롤아웃 전략·Readiness 설정, Eviction API 기반 노드 Drain에는 PDB 설정

---

## 10. 2025-2026 AWS 혁신과 스케줄링 전략

AWS re:Invent 2025에서 발표된 주요 혁신들은 EKS 스케줄링 전략에 큰 영향을 미치고 있습니다. 본 섹션에서는 Provisioned Control Plane, EKS Auto Mode, Karpenter + ARC 통합, Container Network Observability 등 최신 기능이 Pod 스케줄링과 가용성에 어떻게 적용되는지 다룹니다.

### 10.1 Provisioned Control Plane 스케줄링 성능

**개요:**

Provisioned Control Plane은 XL, 2XL, 4XL 등 사전 정의된 티어로 컨트롤 플레인 용량을 프로비저닝하여 예측 가능한 고성능 Kubernetes 운영을 제공합니다.

**티어별 성능 특성:**

| 티어 | API 동시성 | Pod 스케줄링 속도 | 클러스터 규모 | 사용 사례 |
|------|-----------|-----------------|------------|----------|
| **Standard** | 동적 스케일링 | 일반 | ~1,000 노드 | 일반 워크로드 |
| **XL** | 높음 | 빠름 | ~2,000 노드 | 대규모 배포 |
| **2XL** | 매우 높음 | 매우 빠름 | ~4,000 노드 | AI/ML 학습, HPC |
| **4XL** | 극대화 | 극대화 | ~8,000 노드 | 초대규모 클러스터 |

**스케줄링 성능 향상:**

Provisioned Control Plane은 다음과 같은 방식으로 스케줄링 성능을 향상시킵니다:

1. **API 서버 동시 처리 능력**: 더 많은 스케줄링 요청을 동시에 처리
2. **etcd 용량 확장**: 더 많은 노드 및 Pod 메타데이터 저장
3. **스케줄러 처리량 증가**: 초당 더 많은 Pod 바인딩 처리
4. **예측 가능한 지연**: 트래픽 버스트 시에도 일관된 스케줄링 지연 보장

**대규모 클러스터 스케줄링 전략:**

```yaml
# 예시: Provisioned Control Plane XL 티어에서 대규모 Deployment 배포
apiVersion: apps/v1
kind: Deployment
metadata:
  name: large-scale-app
spec:
  replicas: 1000  # 1000개 replica 동시 배포
  selector:
    matchLabels:
      app: large-scale-app
  template:
    metadata:
      labels:
        app: large-scale-app
    spec:
      # Topology Spread: 1000개 Pod를 균등 분산
      topologySpreadConstraints:
      - maxSkew: 10  # 대규모 배포에서는 maxSkew를 높여 유연성 확보
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: large-scale-app
      - maxSkew: 50
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: large-scale-app
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: large-scale-app
              topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: app:v1.0
        resources:
          requests:
            cpu: "500m"
            memory: 1Gi
```

**AI/ML 학습 워크로드 최적화 (수천 GPU Pod):**

Provisioned Control Plane은 AI/ML 학습 워크로드에서 수천 개의 GPU Pod를 동시에 스케줄링하는 시나리오에 최적화되어 있습니다.

```mermaid
sequenceDiagram
    participant User
    participant APIServer as API Server<br/>(Provisioned XL)
    participant Scheduler as Kube-Scheduler<br/>(Enhanced)
    participant Karpenter
    participant EC2 as EC2 Auto Scaling

    User->>APIServer: Job 생성 (1000 GPU Pod)
    APIServer->>Scheduler: 1000 Pod 스케줄링 요청

    Note over Scheduler: 병렬 스케줄링<br/>(초당 100+ Pod)

    Scheduler->>Karpenter: 부족한 GPU 노드 요청
    Karpenter->>EC2: 250 GPU 노드 프로비저닝

    Note over EC2: 노드 병렬 생성<br/>(5-10분)

    EC2-->>Karpenter: 노드 준비 완료
    Karpenter-->>Scheduler: 노드 등록

    Scheduler->>APIServer: Pod 바인딩 (250 batch)
    APIServer->>Scheduler: 다음 배치 스케줄링

    Note over Scheduler,APIServer: 4번 반복<br/>(1000 Pod 완료)

    APIServer-->>User: Job 실행 시작
```

**사용 사례별 권장 티어:**

| 사용 사례 | 권장 티어 | 이유 |
|----------|----------|------|
| **일반 웹 애플리케이션** | Standard | 동적 스케일링으로 충분 |
| **대규모 배치 작업 (500+ Pod)** | XL | 빠른 동시 스케줄링 필요 |
| **분산 ML 학습 (1000+ GPU Pod)** | 2XL | 초고속 스케줄링 + 높은 API 동시성 |
| **HPC 클러스터 (수천 노드)** | 4XL | 최대 스케일 + 예측 가능한 성능 |
| **미션 크리티컬 서비스** | XL 이상 | 트래픽 버스트 시에도 일관된 지연 |

:::tip Provisioned Control Plane 선택 기준
- **노드 수 > 1,000**: XL 이상 고려
- **빈번한 대규모 배포 (500+ Pod)**: XL 이상
- **GPU 워크로드 (100+ GPU)**: 2XL 이상
- **예측 가능한 성능 요구**: 모든 규모에서 Provisioned 고려
:::

### 10.2 EKS Auto Mode 자동 노드 프로비저닝

**개요:**

EKS Auto Mode는 노드 프로비저닝과 유지보수를 관리합니다. 아래 코드는 두 구성을 비교하는 예시입니다. 독립 실행형 Karpenter에는 기존 `default` EC2NodeClass가 필요합니다. Auto Mode 구성에는 Auto Mode 활성화, Ready 상태인 NodeClass, 배치 가능한 NodePool, 호환 이미지, IAM과 네트워크 접근이 필요합니다.

기본 `general-purpose`는 On-Demand `amd64` 용량을 사용합니다. Spot에는 적합한 사용자 정의 pool이, ARM에는 배치 가능한 `arm64` pool과 호환 이미지가 필요합니다. 기본 `system` pool도 ARM을 지원하지만 중요 워크로드용 `CriticalAddonsOnly` taint가 있습니다.

독립 실행형 Karpenter는 `karpenter.k8s.aws/EC2NodeClass`, Auto Mode는 `eks.amazonaws.com/NodeClass`를 사용합니다. 예제를 적용할 때 각 NodePool이 올바른 종류의 NodeClass를 참조하는지 확인합니다.

**Auto Mode가 스케줄링에 미치는 영향:**

| 기능 | 기존 방식 (수동) | Auto Mode |
|------|---------------|----------|
| **노드 선택** | 호환 NodePool·Pod 제약 구성 | NodePool·Pod 제약 안에서 배치 가능한 offering 선택 |
| **동적 스케일링** | Cluster Autoscaler 또는 Karpenter 구성 | 설정한 용량·접근 범위 안에서 프로비저닝 관리 |
| **비용 최적화** | 허용 capacity type·아키텍처 구성 | Spot·Graviton에는 적합한 pool과 호환 워크로드 필요 |
| **AZ 배치** | 필요한 topology 정책 구성 | 애플리케이션 topology 정책과 적합한 서브넷이 계속 적용 |
| **노드 업그레이드** | AMI 수명주기 관리 | 지원되는 구성 안에서 노드 OS 수명주기 관리 |

**수동 NodeSelector/Affinity vs Auto Mode 비교:**

```yaml
# 기존 방식: 수동 NodeSelector + Karpenter NodePool
---
# Karpenter NodePool 생성
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general-pool
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["c6i.xlarge", "c6i.2xlarge", "c6a.xlarge"]
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]
---
# Deployment: NodeSelector로 노드 지정
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 10
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      nodeSelector:
        karpenter.sh/nodepool: general-pool
      containers:
      - name: api
        image: api:v1.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
```

```yaml
# Auto Mode 방식: 최소한의 설정
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 10
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      nodeSelector:
        eks.amazonaws.com/compute-type: auto
      containers:
      - name: api
        image: api:v1.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
      # 배치 가능한 NodePool 제약과 애플리케이션 topology 정책은 계속 적용
```

**Auto Mode 환경에서 여전히 필요한 스케줄링 설정:**

Auto Mode는 노드 프로비저닝을 자동화하지만, 다음 스케줄링 설정은 **여전히 명시적으로 설정해야 합니다**:

| 설정 | Auto Mode 자동화 여부 | 설명 |
|------|---------------------|------|
| **Resource Requests/Limits** | ❌ 필수 설정 | 워크로드 리소스 요구사항 명시 필요 |
| **Topology Spread** | ⚠️ 애플리케이션 요구에 맞는 명시적 정책 | 기본 스케줄러 동작만으로 필요한 AZ 분산이 성립하지 않음 |
| **Pod Anti-Affinity** | ❌ 필수 설정 | 같은 앱 replica 분산은 명시 필요 |
| **PDB** | ❌ 필수 설정 | 최소 가용성 보장은 앱 담당 |
| **PriorityClass** | ❌ 필수 설정 | 우선순위는 앱 담당 |
| **Taints/Tolerations** | ⚠️ 특수 노드만 | GPU 등 특수 워크로드는 명시 필요 |

**Auto Mode 환경의 권장 스케줄링 패턴:**

```yaml
# Auto Mode에서 권장되는 최소한의 스케줄링 설정
apiVersion: apps/v1
kind: Deployment
metadata:
  name: production-app
spec:
  replicas: 6
  selector:
    matchLabels:
      app: production-app
  template:
    metadata:
      labels:
        app: production-app
    spec:
      # 1. Resource Requests (필수)
      containers:
      - name: app
        image: app:v1.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
          limits:
            cpu: "2"
            memory: 4Gi

      # 2. Topology Spread (세밀한 AZ 분산 제어)
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: production-app
        minDomains: 3

      # 3. Pod Anti-Affinity (노드 분산)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: production-app
              topologyKey: kubernetes.io/hostname

      # 4. PriorityClass (우선순위)
      priorityClassName: high-priority
---
# 5. PDB (가용성 보장)
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: production-app-pdb
spec:
  minAvailable: 4
  selector:
    matchLabels:
      app: production-app
```

**Auto Mode + PDB + Karpenter 상호작용:**

Auto Mode는 내부적으로 Karpenter와 유사한 자동 스케일링을 제공하며, PDB를 존중합니다.

```mermaid
flowchart TB
    subgraph "Auto Mode 환경"
        POD[새 Pod 생성 요청]
        AUTOMODE[EKS Auto Mode]
        SCHEDULE[Kubernetes Scheduler]
        NODE[노드 프로비저닝]
        PDB[PDB 확인]
    end

    POD --> SCHEDULE
    SCHEDULE -->|적합한 노드 없음| AUTOMODE
    AUTOMODE -->|인스턴스 타입 자동 선택| NODE
    NODE -->|노드 준비 완료| SCHEDULE
    SCHEDULE -->|Pod 배치| DONE[실행]

    subgraph "노드 통합 (Consolidation)"
        UNDERUTIL[저활용 노드 감지]
        EVICT[Pod Eviction 시도]
        UNDERUTIL --> PDB
        PDB -->|minAvailable 확인| EVICT
        EVICT -->|PDB 존중| REBALANCE[재배치]
    end

    style AUTOMODE fill:#4286f4,stroke:#2a6acf,color:#fff
    style PDB fill:#ff9900,stroke:#cc7a00,color:#fff
    style DONE fill:#34a853,stroke:#2a8642,color:#fff
```

### 10.3 ARC + Karpenter 통합 AZ 대피

**개요:**

AWS Application Recovery Controller(ARC)와 Karpenter의 통합은 AZ 장애 시 자동 Zonal Shift를 통해 워크로드를 건강한 AZ로 대피시킵니다.

**AZ 장애 자동 복구 패턴:**

```mermaid
sequenceDiagram
    participant AZ1 as AZ us-east-1a<br/>(장애)
    participant ARC as AWS ARC<br/>(Zonal Shift)
    participant Karpenter
    participant AZ2 as AZ us-east-1b<br/>(정상)
    participant AZ3 as AZ us-east-1c<br/>(정상)
    participant PDB as PodDisruptionBudget
    participant LB as Load Balancer

    Note over AZ1: Gray Failure 발생<br/>(높은 지연, 패킷 손실)

    AZ1->>ARC: CloudWatch 메트릭 이상 탐지
    ARC->>ARC: Zonal Shift 시작<br/>(us-east-1a 트래픽 차단)
    ARC->>LB: us-east-1a 트래픽 제거

    ARC->>Karpenter: AZ-1a Pod 대피 요청
    Karpenter->>PDB: minAvailable 확인
    PDB-->>Karpenter: 안전한 Eviction 허용

    Karpenter->>AZ2: 신규 노드 프로비저닝
    Karpenter->>AZ3: 신규 노드 프로비저닝

    AZ2-->>Karpenter: 노드 준비 완료
    AZ3-->>Karpenter: 노드 준비 완료

    Karpenter->>AZ1: AZ-1a Pod Eviction
    Note over AZ1: 기존 Pod 종료

    Karpenter->>AZ2: Pod 재스케줄링
    Karpenter->>AZ3: Pod 재스케줄링

    Note over AZ2,AZ3: 서비스 복구 완료<br/>(2-3분 소요)

    AZ2->>LB: 새 Pod Ready
    AZ3->>LB: 새 Pod Ready
    LB-->>ARC: 정상 상태 확인
```

**ARC + Karpenter 통합 설정 예시:**

```yaml
# Karpenter NodePool: AZ 대피 지원
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: arc-enabled-pool
spec:
  template:
    spec:
      requirements:
      - key: topology.kubernetes.io/zone
        operator: In
        values:
        - us-east-1a
        - us-east-1b
        - us-east-1c
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand"]  # AZ 대피 시 On-Demand 권장
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m
    budgets:
    - nodes: "30%"  # AZ 대피 시 빠른 재배치를 위한 여유
---
# 애플리케이션: Topology Spread + PDB
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resilient-app
spec:
  replicas: 9  # 3 AZ x 3 replica
  selector:
    matchLabels:
      app: resilient-app
  template:
    metadata:
      labels:
        app: resilient-app
    spec:
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: resilient-app
        minDomains: 3  # 반드시 3 AZ에 분산
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: resilient-app
              topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: app:v1.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
---
# PDB: AZ 대피 중에도 6개 유지 (9개 중 3개 Evict 허용)
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: resilient-app-pdb
spec:
  minAvailable: 6
  selector:
    matchLabels:
      app: resilient-app
```

**Istio 서비스 메시 통합 End-to-end 복구:**

Istio와 ARC를 함께 사용하면 AZ 장애 시 트래픽 라우팅과 Pod 재배치를 조율하여 End-to-end 복구를 달성합니다.

```yaml
# Istio DestinationRule: AZ별 Subset
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: resilient-app-dr
spec:
  host: resilient-app.default.svc.cluster.local
  trafficPolicy:
    loadBalancer:
      localityLbSetting:
        enabled: true
        failover:
        - from: us-east-1a
          to: us-east-1b
        - from: us-east-1b
          to: us-east-1c
        - from: us-east-1c
          to: us-east-1a
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
  - name: az-1a
    labels:
      topology.kubernetes.io/zone: us-east-1a
  - name: az-1b
    labels:
      topology.kubernetes.io/zone: us-east-1b
  - name: az-1c
    labels:
      topology.kubernetes.io/zone: us-east-1c
---
# Istio VirtualService: 정상 AZ로만 트래픽
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: resilient-app-vs
spec:
  hosts:
  - resilient-app.default.svc.cluster.local
  http:
  - route:
    - destination:
        host: resilient-app.default.svc.cluster.local
        subset: az-1b
      weight: 50
    - destination:
        host: resilient-app.default.svc.cluster.local
        subset: az-1c
      weight: 50
    # ARC Zonal Shift 시 az-1a는 자동 제거됨
```

**Gray Failure 감지 패턴:**

Gray Failure는 완전한 장애는 아니지만 성능 저하로 서비스 품질이 떨어지는 상황입니다. ARC는 CloudWatch 메트릭 기반으로 Gray Failure를 감지합니다.

```yaml
# CloudWatch Alarm: Gray Failure 감지
apiVersion: v1
kind: ConfigMap
metadata:
  name: gray-failure-detection
data:
  alarm.json: |
    {
      "AlarmName": "EKS-AZ-1a-HighLatency",
      "MetricName": "TargetResponseTime",
      "Namespace": "AWS/ApplicationELB",
      "Statistic": "Average",
      "Period": 60,
      "EvaluationPeriods": 3,
      "Threshold": 1.0,
      "ComparisonOperator": "GreaterThanThreshold",
      "Dimensions": [
        {
          "Name": "AvailabilityZone",
          "Value": "us-east-1a"
        }
      ],
      "TreatMissingData": "notBreaching"
    }
```

**AZ 대피 전략 요약:**

| 시나리오 | PDB 설정 | Topology Spread | Karpenter 설정 | 복구 시간 |
|---------|---------|----------------|---------------|----------|
| **완전 AZ 장애** | `minAvailable: 6` (9개 중) | `minDomains: 3` | On-Demand 우선 | 2-3분 |
| **Gray Failure** | `minAvailable: 6` (9개 중) | `minDomains: 2` 허용 | Spot 가능 | 3-5분 |
| **계획된 유지보수** | `maxUnavailable: 3` | `minDomains: 2` 허용 | Spot + On-Demand | 5-10분 |

### 10.4 Container Network Observability와 스케줄링

**개요:**

Container Network Observability는 세분화된 네트워크 메트릭을 제공하여 Pod 배치와 네트워크 성능의 상관관계를 분석하고, 스케줄링 전략을 최적화할 수 있게 합니다.

**Pod 배치와 네트워크 성능 상관관계:**

| Pod 배치 패턴 | 네트워크 지연 | Cross-AZ 트래픽 비용 | 사용 사례 |
|-------------|-------------|-------------------|----------|
| **Same Node** | ~0.1ms | $0 | Cache 서버 + 애플리케이션 |
| **Same AZ** | ~0.5ms | $0 | 빈번한 통신하는 마이크로서비스 |
| **Cross-AZ** | ~2-5ms | $0.01/GB | 고가용성 필요 서비스 |
| **Cross-Region** | ~50-100ms | $0.02/GB | 지역별 분산 서비스 |

**Cross-AZ 트래픽 비용을 고려한 스케줄링:**

```yaml
# 예시: API Gateway + Backend Service 같은 AZ 배치
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 6
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
        network-locality: same-az  # 네트워크 관찰성 라벨
    spec:
      # Topology Spread: AZ 균등 분산
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: api-gateway
      containers:
      - name: gateway
        image: api-gateway:v1.0
        resources:
          requests:
            cpu: "1"
            memory: 2Gi
---
# Backend Service: API Gateway와 같은 AZ 선호
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-service
spec:
  replicas: 6
  selector:
    matchLabels:
      app: backend-service
  template:
    metadata:
      labels:
        app: backend-service
        network-locality: same-az
    spec:
      affinity:
        # Pod Affinity: API Gateway와 같은 AZ 선호 (Cross-AZ 비용 절감)
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api-gateway
              topologyKey: topology.kubernetes.io/zone
      containers:
      - name: backend
        image: backend-service:v1.0
        resources:
          requests:
            cpu: "2"
            memory: 4Gi
```

**네트워크 관찰성 기반 Topology Spread 최적화:**

Container Network Observability 메트릭을 분석하여 스케줄링 전략을 조정합니다.

```yaml
# CloudWatch Container Insights 메트릭 쿼리 예시
apiVersion: v1
kind: ConfigMap
metadata:
  name: network-metrics-query
data:
  query.json: |
    {
      "MetricName": "pod_network_rx_bytes",
      "Namespace": "ContainerInsights",
      "Dimensions": [
        {"Name": "PodName", "Value": "api-gateway-*"},
        {"Name": "Namespace", "Value": "default"}
      ],
      "Period": 300,
      "Stat": "Sum"
    }
```

**네트워크 관찰성 기반 최적화 패턴:**

1. **높은 Cross-AZ 트래픽 감지** → Pod Affinity로 같은 AZ 배치
2. **특정 AZ 네트워크 혼잡 감지** → Topology Spread로 다른 AZ 분산
3. **Pod 간 통신 패턴 분석** → Service Mesh(Istio)로 트래픽 최적화
4. **네트워크 지연 급증 감지** → ARC Zonal Shift로 장애 AZ 대피

```mermaid
flowchart TB
    subgraph "Container Network Observability"
        METRICS[네트워크 메트릭 수집]
        ANALYZE[트래픽 패턴 분석]
        ALERT[이상 탐지 알림]
    end

    subgraph "스케줄링 최적화"
        DECISION{최적화 유형}
        AFFINITY[Pod Affinity 조정]
        SPREAD[Topology Spread 조정]
        SHIFT[AZ Shift]
    end

    METRICS --> ANALYZE
    ANALYZE --> ALERT
    ALERT --> DECISION

    DECISION -->|높은 Cross-AZ 트래픽| AFFINITY
    DECISION -->|특정 AZ 혼잡| SPREAD
    DECISION -->|AZ 장애| SHIFT

    style METRICS fill:#4286f4,stroke:#2a6acf,color:#fff
    style ALERT fill:#ff9900,stroke:#cc7a00,color:#fff
    style DECISION fill:#fbbc04,stroke:#c99603,color:#000
```

**실전 예시: ML 추론 서비스 네트워크 최적화:**

```yaml
# ML 추론 서비스: 낮은 지연 + 비용 최적화
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-inference-optimized
spec:
  replicas: 9
  selector:
    matchLabels:
      app: ml-inference
  template:
    metadata:
      labels:
        app: ml-inference
    spec:
      # 1. Topology Spread: AZ 균등 분산 (고가용성)
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: ml-inference
        minDomains: 3

      # 2. Pod Affinity: API Gateway와 같은 AZ (낮은 지연)
      affinity:
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 80
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - api-gateway
              topologyKey: topology.kubernetes.io/zone

      containers:
      - name: inference
        image: ml-inference:v1.0
        resources:
          requests:
            cpu: "2"
            memory: 8Gi
```

**네트워크 관찰성 기반 비용 절감 효과:**

| 최적화 전 | 최적화 후 | 절감 효과 |
|----------|----------|----------|
| Cross-AZ 트래픽: 1TB/월 | Cross-AZ 트래픽: 0.2TB/월 | $8/월 절감 |
| 평균 지연: 3ms | 평균 지연: 0.5ms | 6배 성능 향상 |
| Pod Affinity 미사용 | Pod Affinity 최적화 | 운영 효율 증가 |

---

### 10.5 Node Readiness Controller — 스케줄링 안전성 강화

**개요:**

Node Readiness Controller(NRC)는 2026년 2월 3일 Kubernetes 블로그에서 소개한 별도 Kubernetes SIGs 컨트롤러입니다. 사용자 정의 Node Condition에 따라 readiness taint를 조정하며, Kubernetes 1.32 내장 feature gate가 아닙니다.

이 섹션은 NRC `v0.5.0` 컨트롤러·CRD와 Karpenter `v1.14.1` 스키마 기준입니다. 단독 rule과 통합 GPU 패턴은 대안 예시이며, 함께 구성할 때는 selector 중복과 taint 소유권을 확인합니다. 예시의 전제조건은 다음과 같습니다.

- 같은 릴리스의 컨트롤러·CRD를 사용하고, 컨트롤러가 자신의 readiness guard로 차단된 노드 밖에서도 실행될 수 있어야 합니다. admission webhook 패키지와 인증서 전제조건은 선택한 릴리스 설치 방식에 따릅니다.
- 대상 label과 일치하는 `NoSchedule` taint를 **노드 등록 시점부터** 설정합니다. Karpenter는 `startupTaints`로 초기 taint를 제공할 수 있으며, 나중에 비동기로 추가하면 배치 경합이 남습니다.
- 아래의 정확한 사용자 정의 condition을 보고할 별도 reporter 구현·권한이 필요합니다. CNI/NVIDIA device plugin이 이를 보고한다고 가정하지 않습니다. 검사 의미, Node status RBAC, 보고 주기, 실패·Unknown 처리와 오래된 신호 처리를 정해야 하며, NRC 자체는 상태 검사기나 freshness timeout이 아닙니다.
- bootstrap 에이전트에는 필요한 guard와 전용 노드 taint의 toleration만 부여합니다. 일반 워크로드는 readiness guard를 tolerate하지 않습니다. GPU 워크로드에는 9.2절의 호환 accelerated AMI·런타임·device plugin 조건도 필요합니다.

rule 객체는 API 규약을 보여줍니다. reporter와 노드 등록 설정을 제공하기 전에는 완전한 실행용 readiness 배포가 아닙니다.

**스케줄링 관점에서의 문제:**

스케줄러는 리소스, taint, affinity, topology 등 여러 제약을 평가합니다. `Ready=True`만으로 모든 워크로드 의존 구성 요소의 사용 가능성이 증명되지는 않습니다. 아래는 발생 가능한 초기화 공백의 예시이며 실측 장애 결과가 아닙니다.

| 시나리오 | 노드 상태 | 실제 상황 | 결과 |
|---------|---------|----------|------|
| **CNI 플러그인 미준비** | `Ready` | Calico/Cilium Pod 시작 중 | Pod 네트워크 연결 실패 |
| **CSI 드라이버 미준비** | `Ready` | EBS CSI Driver 초기화 중 | PVC 마운트 실패 |
| **GPU 드라이버 미준비** | `Ready` | NVIDIA Device Plugin 로딩 중 | GPU 워크로드 시작 실패 |
| **이미지 프리풀 진행 중** | `Ready` | 필요한 이미지 layer 다운로드 중 | 이미지 가용성까지 시작이 지연될 수 있으며 시간은 이미지·캐시·네트워크에 따라 다름 |

**Node Readiness Controller의 동작 원리:**

NRC는 `NodeReadinessRule` CRD(`readiness.node.x-k8s.io/v1alpha1`)를 사용하여 다음과 같이 동작합니다:

1. **조건 기반 taint 관리**: rule이 요구하는 Node Condition에 따라 해당 taint를 조정합니다.
2. **일반 스케줄링 차단**: `NoSchedule` guard는 일치하는 toleration이 없는 신규 Pod를 차단하며 기존 Pod를 evict하지 않습니다.
3. **조건부 taint 제거**: 해당 rule의 condition이 일치하면 그 taint를 제거합니다. 다른 guard와 스케줄러 제약도 배치를 허용해야 합니다.

```mermaid
sequenceDiagram
    participant Karpenter
    participant Node
    participant Reporter as Bootstrap 에이전트와 Reporter
    participant NRC as Node Readiness Controller
    participant Scheduler
    participant Pod
    Karpenter->>Node: 대상 label과 startup NoSchedule guard를 포함해 등록
    Note over Node,Scheduler: 일반 Pod는 readiness guard를 tolerate하지 않음
    Node->>Reporter: 일치하는 toleration이 있는 bootstrap 에이전트 시작
    Reporter->>Node: 설정된 Node Condition 보고
    Node->>NRC: Condition 변경
    NRC->>NRC: 일치하는 rule별 조건 평가
    alt 요구 condition 일치
        NRC->>Node: 해당 rule의 taint 제거
        Note over Node,Scheduler: 다른 guard와 모든 스케줄링 제약도 확인
        Scheduler->>Node: 배치 가능한 Pod 바인딩
        Node->>Pod: Kubelet이 컨테이너 시작
    else Condition 누락 또는 불일치
        NRC->>Node: Guard 유지
    end
```

**두 가지 Enforcement 모드:**

NRC는 두 가지 모드로 동작하며, 각 모드는 스케줄링 안전성에 다른 영향을 미칩니다:

| 모드 | 동작 방식 | 스케줄링 영향 | 사용 사례 |
|------|---------|-------------|----------|
| **bootstrap-only** | condition이 처음 일치하면 taint를 제거하고 완료 표시 | 일회성 guard이며 이후 condition 실패로 이 rule을 재적용하지 않음 | 일회성 초기화·프리풀 |
| **continuous** | 보고된 condition 변경에 따라 taint 조정 | 조정 후 tolerate하지 않는 신규 Pod를 차단하며 기존 Pod를 evict하지 않음 | 지속적인 상태 보고가 필요한 의존 구성 요소 |

**실전 예시 1: CNI 플러그인 준비 확인 (Bootstrap-only)**

```yaml
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: network-readiness-rule
spec:
  # 사용자 정의 network reporter 필요; condition 누락 시 Unknown 유지
  conditions:
    - type: "example.com/NetworkReady"
      requiredStatus: "True"

  # 준비될 때까지 이 taint 적용
  taint:
    key: "readiness.k8s.io/network-unavailable"
    effect: "NoSchedule"
    value: "pending"

  # Bootstrap-only: 한번 준비되면 모니터링 중단
  enforcementMode: "bootstrap-only"

  # 노드 등록 시 제공한 label로 대상 지정
  nodeSelector:
    matchLabels:
      example.com/readiness-profile: network-bootstrap
```

**실전 예시 2: GPU 드라이버 지속 모니터링 (Continuous)**

```yaml
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: gpu-driver-readiness-rule
spec:
  # 사용자 정의 reporter가 device 등록과 드라이버 상태 검사
  conditions:
    - type: "example.com/GPUDevicePluginReady"
      requiredStatus: "True"
    - type: "example.com/GPUDriverReady"
      requiredStatus: "True"

  # GPU 준비될 때까지 이 taint 적용
  taint:
    key: "readiness.k8s.io/gpu-unavailable"
    effect: "NoSchedule"
    value: "pending"

  # Continuous: 보고된 condition이 실패하면 guard 재조정
  enforcementMode: "continuous"

  # GPU 노드 그룹에만 적용
  nodeSelector:
    matchLabels:
      example.com/readiness-profile: gpu-continuous
```

**Pod Scheduling Readiness(schedulingGates)와의 비교:**

Kubernetes는 Pod 수준과 노드 수준 양쪽에서 스케줄링 안전성을 제어할 수 있습니다:

| 비교 항목 | `schedulingGates` (Pod 수준) | `NodeReadinessRule` (노드 수준) |
|----------|------------------------------|--------------------------------|
| **제어 대상** | 특정 Pod의 스케줄링 | guard를 tolerate하지 않는 Pod에 대한 대상 노드의 배치 가능 여부 |
| **사용 사례** | 외부 조건 충족까지 Pod 보류 | 보고된 인프라 condition이 미충족인 동안 노드 보호 |
| **조건 위치** | Pod spec의 gate 이름이며 실제 준비 판단은 외부 컨트롤러 담당 | reporter가 제공하는 Node status의 condition |
| **제거 방법** | 외부 컨트롤러가 gate 제거 | rule이 일치하면 NRC가 해당 taint 제거 |
| **영향 범위** | 단일 Pod | 일치하는 toleration이 없는 신규 Pod이며 `NoSchedule`은 기존 Pod를 evict하지 않음 |

**조합 패턴:**

```yaml
# Pod 수준 + 노드 수준 스케줄링 안전성 조합
apiVersion: v1
kind: Pod
metadata:
  name: ml-training-job
spec:
  # Pod 수준: 데이터셋 준비까지 스케줄링 보류
  schedulingGates:
    - name: "example.com/dataset-ready"

  # 대상 pool은 readiness guard를 포함해 등록하며 이 guard를 tolerate하지 않음
  nodeSelector:
    karpenter.sh/nodepool: gpu-pool

  containers:
    - name: trainer
      image: ml-trainer:v1.0
      resources:
        limits:
          nvidia.com/gpu: 8
```

**Karpenter + NRC 연동 패턴:**

Karpenter로 동적 노드 프로비저닝을 사용하는 환경에서 NRC는 다음과 같은 워크플로우를 제공합니다:

```mermaid
flowchart TB
    PENDING["스케줄링 불가 GPU Pod"]
    KARP["Karpenter가 호환 NodePool과 NodeClass 선택"]
    REGISTER["대상 label과 startup guard를 포함해 노드 등록"]
    BLOCK["일반 스케줄링 차단 유지"]
    AGENT["Bootstrap 에이전트는 필요한 guard를 tolerate"]
    CHECKS["구성한 네트워크·저장소·GPU 검사"]
    CONDITIONS["Reporter가 Node Condition 갱신"]
    NRC["NRC가 일치하는 rule 평가"]
    KEEP["Condition 누락·실패 시 guard 유지"]
    REMOVE["충족된 rule의 taint 제거"]
    SCHEDULE["스케줄러가 남은 guard와 제약 확인"]
    PENDING --> KARP --> REGISTER
    REGISTER --> BLOCK
    REGISTER --> AGENT --> CHECKS --> CONDITIONS --> NRC
    NRC -->|Condition 불일치| KEEP
    NRC -->|Condition 일치| REMOVE --> SCHEDULE
    KEEP --> BLOCK
```

**GPU 노드 그룹 실전 예시:**

이 통합 패턴은 guard가 있는 `gpu-pool`과 사용자 정의 GPU reporter를 사용합니다. `gpu-nodeclass`에는 호환 accelerated AMI, IAM 역할과 네트워크가 미리 구성되어 있어야 합니다. Pod/Job 예시는 이 pool을 대상으로 하며 allocatable GPU 8개가 필요합니다. 앞의 단독 GPU rule과 대안 관계이며, reporter 구현과 실패·Unknown·오래된 신호 처리의 관찰 근거가 필요합니다.

```yaml
# Karpenter NodePool: GPU 노드 그룹
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-pool
spec:
  template:
    spec:
      startupTaints:
        - key: readiness.k8s.io/gpu-unavailable
          value: pending
          effect: NoSchedule
      requirements:
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["p4d.24xlarge", "p5.48xlarge"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: gpu-nodeclass
---
# NodeReadinessRule: GPU 드라이버 준비 확인
apiVersion: readiness.node.x-k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
  name: gpu-readiness-rule
spec:
  conditions:
    - type: "example.com/GPUDriverReady"
      requiredStatus: "True"
    - type: "example.com/GPUDevicePluginReady"
      requiredStatus: "True"
  taint:
    key: "readiness.k8s.io/gpu-unavailable"
    effect: "NoSchedule"
    value: "pending"
  enforcementMode: "continuous"
  nodeSelector:
    matchLabels:
      karpenter.sh/nodepool: gpu-pool
---
# AI 워크로드: guard가 있는 pool을 대상으로 하며 readiness guard는 tolerate하지 않음
apiVersion: batch/v1
kind: Job
metadata:
  name: ml-training
spec:
  template:
    spec:
      # Readiness guard를 tolerate하지 않음
      nodeSelector:
        karpenter.sh/nodepool: gpu-pool

      containers:
        - name: trainer
          image: ml-trainer:v1.0
          resources:
            limits:
              nvidia.com/gpu: 8

      restartPolicy: OnFailure
```

:::tip 스케줄링 안전성 최적화 권장사항
- **CNI 플러그인**: 명시적인 일회성 검사에는 `bootstrap-only`를 사용하며, 지속적인 네트워크 상태에는 continuous rule과 reporter가 필요합니다.
- **GPU/CSI 드라이버**: `continuous`에서는 보고된 실패에 따라 신규 Pod용 guard를 조정합니다. 기존 워크로드의 복구에는 별도 절차가 필요합니다.
- **이미지 프리풀**: 사용자 정의 reporter가 필요한 이미지의 존재를 확인한 후 bootstrap rule을 완료할 수 있습니다.
- **Karpenter 연동**: rule의 selector·taint를 등록 label·startup taint와 맞추고 bootstrap 에이전트가 실행될 수 있는지 확인합니다.
:::

:::warning Alpha 기능 사용 시 주의사항
참조한 외부 NRC 릴리스의 `NodeReadinessRule` API는 `v1alpha1`입니다. 활성화할 Kubernetes control plane의 `NodeReadiness=true` gate는 없습니다.

1. 컨트롤러·CRD·선택한 admission webhook을 같은 릴리스로 고정합니다. `v0.5.0`의 conditions, nodeSelector, enforcementMode와 taint 필드는 불변이므로 기존 rule에서 이를 바꾸려면 직접 수정 대신 계획한 교체 절차가 필요합니다.
2. Node status/reporting 권한, selector 중복과 taint 소유권을 검토합니다. 전체 webhook 패키지에는 문서에 명시된 인증서 구성이 필요합니다.
3. 초기 배치 경합, 누락·실패·오래된 condition, bootstrap 에이전트 배치, 컨트롤러 중단·복구를 별도 시험 계획으로 검증합니다.
4. init container는 Pod가 노드에 배정된 후 실행하므로 노드 스케줄링 guard를 대신하지 않습니다. guard가 있는 노드의 소유 주체별 복구 절차를 유지합니다.
:::

**참고 자료:**

- [Kubernetes Blog: Introducing Node Readiness Controller](https://kubernetes.io/blog/2026/02/03/introducing-node-readiness-controller/)
- [Node Readiness Controller GitHub](https://github.com/kubernetes-sigs/node-readiness-controller)

---

## 11. 종합 체크리스트 & 참고 자료

### 11.1 종합 체크리스트

프로덕션 배포 전 아래 체크리스트를 활용하여 스케줄링 설정을 검증하세요.

#### 기본 스케줄링 (모든 워크로드)

| 항목 | 설명 | 확인 |
|------|------|------|
| **Resource Requests 설정** | 모든 컨테이너에 CPU, Memory requests 명시 | [ ] |
| **PriorityClass 지정** | 워크로드 중요도에 맞는 PriorityClass 할당 | [ ] |
| **Liveness/Readiness Probe** | 헬스 체크 설정으로 Pod 안정성 보장 | [ ] |
| **Graceful Shutdown** | preStop Hook + terminationGracePeriodSeconds | [ ] |
| **Image Pull Policy** | 프로덕션: `IfNotPresent` 또는 `Always` | [ ] |

#### 고가용성 (Critical 워크로드)

| 항목 | 설명 | 확인 |
|------|------|------|
| **Replica 수 ≥ 3** | 장애 도메인 격리를 위한 최소 replica | [ ] |
| **Topology Spread Constraints** | AZ 간 균등 분산 (maxSkew: 1) | [ ] |
| **Pod Anti-Affinity** | 노드 분산 (Soft 또는 Hard) | [ ] |
| **PDB 설정** | minAvailable 또는 maxUnavailable 명시 | [ ] |
| **PDB 검증** | `minAvailable < replicas` 확인 | [ ] |
| **Multi-AZ 배포 확인** | 앞의 스냅샷 방식으로 Pod `spec.nodeName`과 Node AZ label을 연결하며 누락·미배치 결과를 유지 | [ ] |

#### 리소스 최적화

| 항목 | 설명 | 확인 |
|------|------|------|
| **Spot 노드 활용** | 재시작 가능한 워크로드에 Spot 노드 허용 | [ ] |
| **Node Affinity 최적화** | 워크로드에 맞는 인스턴스 타입 선택 | [ ] |
| **Taints/Tolerations** | GPU, 고성능 노드 등 전용 노드 격리 | [ ] |
| **Descheduler 설정** | 노드 불균형 해소 (optional) | [ ] |
| **Karpenter 통합** | Disruption budget 설정 | [ ] |

#### 특수 워크로드

| 항목 | 설명 | 확인 |
|------|------|------|
| **GPU 워크로드** | GPU Taint Tolerate + GPU 리소스 요청 | [ ] |
| **StatefulSet** | WaitForFirstConsumer StorageClass 사용 | [ ] |
| **DaemonSet** | 해당 에이전트에 필요한 toleration만 추가하며 bootstrap 에이전트에는 특정 readiness guard가 필요할 수 있음 | [ ] |
| **배치 작업** | PriorityClass: low-priority, preemptionPolicy: Never | [ ] |

### Pod 스케줄링 검증 명령어

읽기 전용 명령 예시를 사용하기 전에 context와 개별 조회 대상을 지정합니다. 노드·AZ별 수는 두 스냅샷과 앞의 `placement_report`로 집계합니다. 빈 노드 이름을 조회하지 않고 알 수 없는 결과와 미배치 Pod를 유지합니다.

```bash
: "${CONTEXT:?대상 Kubernetes context 지정}"
: "${NAMESPACE:?워크로드 namespace 지정}"
: "${POD:?Pod 하나의 이름 지정}"
: "${PDB:?PDB 하나의 이름 지정}"
: "${NODE:?Node 하나의 이름 지정}"

# 1. Pod·노드 배정이며 wide 출력에는 실제 AZ label이 없음
kubectl --context "$CONTEXT" get pods -n "$NAMESPACE" -o wide

# 2. 선택한 Pod의 스케줄링 이벤트
kubectl --context "$CONTEXT" describe pod "$POD" -n "$NAMESPACE"

# 3. 선택한 namespace의 PDB 상태
kubectl --context "$CONTEXT" get pdb -n "$NAMESPACE"
kubectl --context "$CONTEXT" describe pdb "$PDB" -n "$NAMESPACE"

# 4. PriorityClass 목록
kubectl --context "$CONTEXT" get priorityclass

# 5. 선택한 Node의 taint
kubectl --context "$CONTEXT" get node "$NODE" -o jsonpath='{.spec.taints}'

# 6-7. placement_report의 노드·AZ 집계에 사용할 스냅샷
kubectl --context "$CONTEXT" get pods -n "$NAMESPACE" -o json > pods.json
kubectl --context "$CONTEXT" get nodes -o json > nodes.json

# 8. 선택한 namespace의 Warning 이벤트
kubectl --context "$CONTEXT" get events -n "$NAMESPACE" --field-selector type=Warning --sort-by='.lastTimestamp'

# 9. 해당 namespace·selector를 사용하는 Descheduler가 설치된 경우 로그 조회
kubectl --context "$CONTEXT" logs -n kube-system -l app=descheduler --tail=100
```

### 11.2 관련 문서

**내부 문서:**
- [EKS 고가용성 아키텍처 가이드](/docs/eks-best-practices/operations-reliability/eks-resiliency-guide) — Multi-AZ 전략, Topology Spread, Cell Architecture
- [Karpenter를 활용한 초고속 오토스케일링](/docs/eks-best-practices/resource-cost/karpenter-autoscaling) — Karpenter NodePool 심층 설정
- [EKS 리소스 최적화 가이드](/docs/eks-best-practices/resource-cost/eks-resource-optimization) — 리소스 Requests/Limits 최적화
- [EKS Pod 헬스체크 & 라이프사이클](/docs/eks-best-practices/operations-reliability/eks-pod-health-lifecycle) — Probe, Lifecycle Hooks

### 11.3 외부 참조

**공식 Kubernetes 문서:**
- [Kubernetes Scheduling Framework](https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/)
- [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Pod Priority and Preemption](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/)
- [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/)
- [PodDisruptionBudget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)

**Descheduler:**
- [Descheduler GitHub](https://github.com/kubernetes-sigs/descheduler)
- [Descheduler Strategies](https://github.com/kubernetes-sigs/descheduler#policy-and-strategies)

**AWS EKS 공식 문서:**
- [EKS Best Practices — Reliability](https://docs.aws.amazon.com/eks/latest/best-practices/reliability.html)
- [Karpenter Scheduling](https://karpenter.sh/docs/concepts/scheduling/)
- [EKS Node Taints](https://docs.aws.amazon.com/eks/latest/userguide/node-taints-managed-node-groups.html)

**AWS re:Invent 2025 관련 자료:**
- [Amazon EKS introduces Provisioned Control Plane](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/) — XL/2XL/4XL 티어별 스케줄링 성능
- [Getting started with Amazon EKS Auto Mode](https://aws.amazon.com/blogs/containers/getting-started-with-amazon-eks-auto-mode) — 자동 노드 프로비저닝
- [Enhance Kubernetes high availability with ARC and Karpenter](https://aws.amazon.com/blogs/containers/enhance-kubernetes-high-availability-with-amazon-application-recovery-controller-and-karpenter-integration/) — AZ 자동 대피 패턴
- [Monitor network performance across EKS clusters](https://aws.amazon.com/blogs/aws/monitor-network-performance-and-traffic-across-your-eks-clusters-with-container-network-observability/) — Container Network Observability
- [Proactive EKS monitoring with CloudWatch Operator](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/) — Control Plane 메트릭

**Red Hat OpenShift 문서:**
- [Controlling Pod Placement with Taints and Tolerations](https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-scheduler-taints-tolerations.html) — Taints/Tolerations 운영
- [Placing Pods on Specific Nodes with Pod Affinity](https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-scheduler-pod-affinity.html) — Pod Affinity/Anti-Affinity 구성
- [Evicting Pods Using the Descheduler](https://docs.openshift.com/container-platform/4.18/nodes/scheduling/nodes-descheduler.html) — Descheduler 전략 및 설정
- [Managing Pods](https://docs.openshift.com/container-platform/4.18/nodes/pods/nodes-pods-configuring.html) — Pod 관리 및 스케줄링 기본

**커뮤니티:**
- [CNCF Scheduler SIG](https://github.com/kubernetes/community/tree/master/sig-scheduling)
- [Kubernetes Scheduling Deep Dive (KubeCon)](https://www.youtube.com/results?search_query=kubecon+scheduling)
- [AWS re:Invent 2025 — Amazon EKS Sessions](https://aws.amazon.com/blogs/containers/guide-to-amazon-eks-and-kubernetes-sessions-at-aws-reinvent-2025/)
