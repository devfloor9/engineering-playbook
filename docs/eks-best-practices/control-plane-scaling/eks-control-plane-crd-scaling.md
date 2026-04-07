---
title: "EKS Control Plane Deep Dive — CRD at Scale 종합 가이드"
sidebar_label: "Control Plane & CRD Scaling"
description: "EKS Control Plane 동작 원리를 이해하고, CRD 기반 플랫폼을 안정적으로 확장하기 위한 Provisioned Control Plane 활용법, 모니터링 전략, CRD 설계 베스트 프랙티스"
tags: [eks, kubernetes, control-plane, crd, etcd, scaling, monitoring, best-practices]
sidebar_position: 1
last_update:
  date: 2026-03-24
  author: devfloor9
---

# EKS Control Plane Deep Dive — CRD at Scale 종합 가이드

> 📅 **작성일**: 2026-03-24 | ⏱️ **읽는 시간**: 약 25분

CRD(Custom Resource Definition) 기반 플랫폼을 EKS 위에서 운영할 때, Control Plane은 가장 먼저 병목이 되는 지점입니다. 이 가이드는 **Control Plane이 어떻게 동작하는지 이해**하고, **CRD가 미치는 구체적 영향을 파악**한 뒤, **Provisioned Control Plane(PCP)과 모니터링을 통해 선제적으로 대응**하는 실전 전략을 제공합니다.

---

## 목차

1. [EKS Control Plane 내부 아키텍처](#1-eks-control-plane-내부-아키텍처)
2. [Control Plane 자동 스케일링](#2-control-plane-자동-스케일링)
3. [EKS Provisioned Control Plane (PCP)](#3-eks-provisioned-control-plane-pcp)
4. [CRD가 Control Plane에 미치는 영향](#4-crd가-control-plane에-미치는-영향)
5. [EKS Control Plane 모니터링](#5-eks-control-plane-모니터링)
6. [CRD 설계 베스트 프랙티스](#6-crd-설계-베스트-프랙티스)
7. [종합 권장사항 & 도입 로드맵](#7-종합-권장사항--도입-로드맵)

---

## 1. EKS Control Plane 내부 아키텍처

### 1.1 물리적 인프라 구조

EKS의 Control Plane은 AWS가 관리하는 전용 VPC 내에서 실행됩니다. 고객의 워커 노드와는 분리된 독립적인 인프라입니다.

```
EKS Control Plane (AWS 관리형)
├── kube-apiserver (최소 2개, 다중 AZ 분산)
├── kube-controller-manager
├── kube-scheduler
├── etcd (분산 키-값 저장소)
└── Network Load Balancer (API Server 엔드포인트)
```

핵심 포인트:
- Control Plane 컴포넌트는 **다중 AZ에 분산**되어 고가용성을 보장합니다
- 고객에게는 NLB를 통해 단일 API Server 엔드포인트가 노출됩니다
- Control Plane은 AWS가 완전 관리하며, 고객 VPC와 분리된 환경에서 실행됩니다

### 1.2 etcd — Control Plane의 심장

etcd는 Kubernetes의 모든 상태(Pod, Service, CRD 오브젝트 등)를 저장하는 분산 키-값 저장소입니다. Control Plane 성능의 핵심 병목이 되는 이유:

| 특성 | 설명 | CRD 영향 |
|------|------|---------|
| **DB Size 한도** | Standard 티어 8GB, Provisioned 티어 16GB | CRD 오브젝트가 많을수록 DB 크기 증가 |
| **요청 크기 제한** | 단일 오브젝트 최대 1.5MB | 큰 spec을 가진 CR이 한도에 근접 가능 |
| **Watch Stream** | 변경 사항을 실시간으로 전파 | CRD 컨트롤러가 Watch를 추가할수록 부하 증가 |
| **RAFT 합의** | 쓰기 시 과반수 합의 필요 | 쓰기가 많은 CRD 패턴에서 지연 발생 |

:::info etcd 아키텍처 진화
AWS는 EKS의 etcd 계층을 지속적으로 개선하고 있으며, **예측 가능한 성능**(일관된 지연 시간), **데이터 내구성 향상**, **가용성 개선**이 진행 중입니다.
:::

---

## 2. Control Plane 자동 스케일링

### 2.1 자동 스케일링 동작 원리

EKS는 Control Plane 인스턴스를 **자동으로 수직 스케일링**합니다. 워크로드 부하에 따라 API Server, etcd 등의 리소스가 자동으로 조정됩니다. 주요 스케일링 신호:

- **API Server 부하**: inflight requests 수, 요청 지연 시간
- **etcd 부하**: 데이터베이스 크기, Watch 스트림 수
- **스케줄링 부하**: 스케줄링 대기 Pod 수
- **데이터 플레인 규모**: Worker Node 수에 따른 선제적 스케일업

### 2.2 스케일링 특성

- **Scale Up**: 부하 증가 감지 시 자동으로 스케일업
- **Scale Down**: 부하 감소 후 보수적으로 스케일다운 (급격한 축소 방지)
- Standard 모드에서는 스케일링 범위에 상한이 있으며, Provisioned 모드로 이를 확장할 수 있습니다

:::warning 핵심 인사이트
Standard 티어에서는 etcd DB Size가 **8GB로 고정**됩니다. CRD 오브젝트가 많은 플랫폼에서는 이 한도가 가장 먼저 병목이 됩니다. 자동 스케일링이 CPU/Memory를 아무리 올려도 etcd 용량은 늘어나지 않습니다.
:::

---

## 3. EKS Provisioned Control Plane (PCP)

### 3.1 개요

**EKS Provisioned Control Plane(PCP)**은 re:Invent 2025에서 GA로 출시되었습니다. 고객이 직접 Control Plane의 스케일링 티어(T-Shirt Size)를 선택하여 **성능 바닥(floor)**을 설정할 수 있는 기능입니다.

기존에는 VAS의 자동 스케일링에만 의존했지만, PCP를 통해 **선제적으로 최소 성능 보장 수준을 확보**할 수 있습니다.

### 3.2 두 가지 운영 모드

| 모드 | 설명 |
|------|------|
| **Standard** (동적 모드) | 기존과 동일. 자동으로 부하에 따라 스케일링. 부하 감소 시 보수적으로 스케일다운 |
| **Provisioned** (프로비저닝 모드) | 고객이 XL/2XL/4XL/8XL 중 원하는 티어를 선택. 해당 티어 아래로 절대 스케일다운하지 않음. 필요시 티어 이상으로 자동 스케일업 가능 |

### 3.3 티어별 사양 및 가격

| 티어 | etcd DB | SLA | 시간당 가격 |
|------|---------|-----|----------|
| Standard | 8GB | 99.95% | $0.10 |
| **XL** | **16GB** | **99.99%** | $1.65 |
| **2XL** | **16GB** | **99.99%** | $3.40 |
| **4XL** | **16GB** | **99.99%** | $6.90 |
| **8XL** | **16GB** | **99.99%** | $13.90 |

> 최신 가격은 [AWS EKS Pricing](https://aws.amazon.com/eks/pricing/) 페이지에서 확인하세요.

### 3.4 Provisioned 티어에서만 사용 가능한 기능

| 기능 | Standard | XL 이상 |
|------|----------|--------|
| API Server 수평 확장 (2개 이상) | 2개 제한 | 가능 |
| etcd DB Size 16GB | 8GB 고정 | 16GB |
| etcd Event Sharding | 불가 | 가능 (이벤트 객체를 별도 etcd 파티션으로 분리) |
| 99.99% SLA | 99.95% | 99.99% |

:::tip CRD 플랫폼에 Provisioned 티어를 권장하는 이유
CRD 기반 플랫폼에서 가장 먼저 한계에 도달하는 것은 **etcd DB Size**입니다. Standard 티어의 8GB 한도는 CRD 오브젝트가 많은 환경에서 금방 소진됩니다. Provisioned 티어는 16GB로 2배 확장되며, Event Sharding을 통해 이벤트 객체의 부하도 분리할 수 있습니다.
:::

### 3.6 CLI/API 사용법

**클러스터 생성 시 티어 지정:**

```bash
aws eks create-cluster --name prod \
  --role-arn arn:aws:iam::012345678910:role/eks-service-role \
  --resources-vpc-config subnetIds=subnet-xxx,securityGroupIds=sg-xxx \
  --control-plane-scaling-config tier=XL
```

**기존 클러스터 티어 변경:**

```bash
aws eks update-cluster-config --name example \
  --control-plane-scaling-config tier=XL
```

**업데이트 진행 확인:**

```bash
aws eks describe-update --name example --update-id <update-id>
# Response: { "update": { "type": "ScalingTierConfigUpdate", "status": "Successful" } }
```

**클러스터 정보 확인:**

```bash
aws eks describe-cluster --name example
# Response에 controlPlaneScalingConfig.tier 필드 포함
```

### 3.7 PCP 관련 클러스터 속성

| 속성 | 설명 |
|------|------|
| `controlPlaneScalingConfig.tier` | 현재 프로비저닝된 티어 (Standard/XL/2XL/4XL/8XL) |

---

## 4. CRD가 Control Plane에 미치는 영향

CRD 기반 플랫폼을 운영할 때 Control Plane에 미치는 영향을 정확히 이해해야 합니다. 영향은 크게 **etcd**, **API Server** 두 축으로 나뉩니다.

### 4.1 etcd에 대한 영향 (가장 중요)

| 영향 요인 | 메커니즘 | 영향도 |
|---------|---------|-------|
| **DB Size 증가** | CRD 오브젝트가 etcd 저장소를 점유 | 높음 |
| **Watch Stream 부하** | CRD 컨트롤러가 Watch 스트림을 생성하여 etcd gRPC 부하 증가 | 높음 |
| **Request Size** | 개별 CRD 오브젝트가 1.5MB 제한에 근접 가능 | 중간 |
| **List Call 비용** | CRD는 JSON 인코딩을 사용 (protobuf 아님) → 성능 병목 | 높음 |

**etcd DB Size 제한 (PCP 티어별):**

| 티어 | DB Size 한도 | 단일 오브젝트 제한 |
|------|-----------|--------------|
| Standard | 8GB | 1.5MB (변경 불가) |
| Provisioned (XL 이상) | 16GB | 1.5MB (변경 불가) |

### 4.2 API Server에 대한 영향

CRD 관련 API Server 성능 이슈:

1. **JSON vs Protobuf**: CRD는 JSON 직렬화를 사용하므로 built-in 리소스 대비 **List/Watch 성능이 현저히 저하**됩니다
2. **APF (API Priority and Fairness)**: List 요청은 Work Estimator에 의해 최대 10개 시트를 차지할 수 있어, inflight 요청 한도에 빠르게 도달합니다
3. **Watch Cache**: CRD의 Watch Cache 용량은 built-in 리소스와 동일하게 기본 100입니다

### 4.3 증상별 원인 매핑

실제 운영 환경에서 발생하는 증상과 그 원인을 매핑하면 다음과 같습니다:

```mermaid
flowchart LR
    A[429 Throttling 증가] --> B[inflight 요청 한도 초과]
    B --> C[CRD List 요청이 APF 시트 과다 소비]

    D[List 응답 느림] --> E[JSON 직렬화 오버헤드]
    E --> F[대량 CRD 오브젝트 + JSON 인코딩]

    G[etcd DB Size 경고] --> H[CRD 오브젝트 누적]
    H --> I[오래된 CR 미정리 + 큰 spec 크기]

    J[Watch 끊김/재연결] --> K[etcd Watch Stream 과부하]
    K --> L[다수 CRD 컨트롤러의 Watch 동시 생성]
```

:::danger CRD 부하 공식
**Control Plane 부하 = CRD 타입 수 x 오브젝트 크기 x 컨트롤러 패턴(List/Watch 빈도)**

세 가지 요소를 모두 관리해야 합니다. CRD 타입이 적더라도 오브젝트가 크거나 컨트롤러가 비효율적이면 동일한 문제가 발생합니다.
:::

---

## 5. EKS Control Plane 모니터링

EKS는 Control Plane에 대한 **4가지 차원의 Observability**를 제공합니다:

```
┌─────────────────────────────────────────────────────────────────────┐
│                 EKS Control Plane Observability                      │
├──────────────────┬──────────────────┬────────────────┬──────────────┤
│ ① CloudWatch     │ ② Prometheus     │ ③ Control      │ ④ Cluster    │
│    Vended Metrics│    Metrics       │    Plane       │    Insights  │
│                  │    Endpoint      │    Logging     │              │
├──────────────────┼──────────────────┼────────────────┼──────────────┤
│ AWS/EKS 네임스페이스│ KCM/KSH/etcd    │ API/Audit/     │ Upgrade      │
│ (자동, 무료)       │ (Prometheus      │ Auth/CM/Sched  │ Readiness    │
│                  │  호환 K8s API)    │ (CloudWatch    │ Health Issues│
│                  │                  │  Logs)         │ Addon Compat │
├──────────────────┼──────────────────┼────────────────┼──────────────┤
│ v1.28+ 자동       │ v1.28+ 수동      │ 모든 버전        │ 모든 버전 자동 │
└──────────────────┴──────────────────┴────────────────┴──────────────┘
```

### 5.1 CloudWatch Vended Metrics (자동, 무료)

K8s 1.28 이상 클러스터에서 추가 비용 없이 자동으로 CloudWatch `AWS/EKS` 네임스페이스에 핵심 Control Plane 메트릭이 게시됩니다.

**주요 Vended Metrics:**

| 컴포넌트 | 메트릭 | 설명 | 중요도 |
|---------|--------|------|-------|
| API Server | `apiserver_request_total` | 총 API 요청 수 | 필수 |
| API Server | `apiserver_request_total_4xx` | 4xx 에러 요청 수 | 필수 |
| API Server | `apiserver_request_total_5xx` | 5xx 에러 요청 수 | 필수 |
| API Server | `apiserver_request_total_429` | 429 Throttling 요청 수 | 필수 |
| API Server | `apiserver_request_duration_seconds` | API 요청 지연 시간 | 권장 |
| API Server | `apiserver_storage_size_bytes` | etcd 스토리지 크기 (defrag 전) | 필수 |
| Scheduler | `scheduler_schedule_attempts_total` | 전체 스케줄링 시도 수 | 권장 |
| Scheduler | `scheduler_schedule_attempts_SCHEDULED` | 성공 스케줄링 수 | 필수 |
| Scheduler | `scheduler_schedule_attempts_UNSCHEDULABLE` | 스케줄 불가 수 | 권장 |

**PCP 전용 추가 메트릭:**

| 메트릭 | 설명 | 활용 |
|--------|------|------|
| `apiserver_flowcontrol_current_executing_seats_total` | API Server 현재 동시 실행 시트 수 | API Request Concurrency 티어 한도 대비 모니터링 |
| `etcd_mvcc_db_total_size_in_use_in_bytes` | etcd DB 실제 사용 크기 | Cluster Database Size 티어 한도 대비 모니터링 |
| `apiserver_storage_size_bytes` | defrag 전 스토리지 크기 | etcd DB 크기 대체 메트릭 |

### 5.2 Prometheus 호환 메트릭 엔드포인트

API Server뿐만 아니라 **KCM(Kube-Controller-Manager)**, **KSH(Kube-Scheduler)**, **etcd** 메트릭도 스크래핑할 수 있습니다.

**메트릭 엔드포인트 경로:**

```bash
# API Server 메트릭 (기존)
kubectl get --raw=/metrics

# Kube-Controller-Manager 메트릭
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/kcm/container/metrics

# Kube-Scheduler 메트릭
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/ksh/container/metrics

# etcd 메트릭
kubectl get --raw=/apis/metrics.eks.amazonaws.com/v1/etcd/container/metrics
```

**Prometheus 스크래핑 설정 예시:**

```yaml
scrape_configs:
  - job_name: 'kcm-metrics'
    honor_labels: true
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    metrics_path: /apis/metrics.eks.amazonaws.com/v1/kcm/container/metrics
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels:
          [__meta_kubernetes_namespace, __meta_kubernetes_service_name,
           __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
```

**필요한 RBAC 권한:**

```yaml
rules:
  - apiGroups: ["metrics.eks.amazonaws.com"]
    resources: ["kcm/metrics", "ksh/metrics", "etcd/metrics"]
    verbs: ["get"]
```

**CRD 운영에 특히 유용한 KCM/KSH 메트릭:**

| 메트릭 | 소스 | 설명 |
|--------|------|------|
| `workqueue_depth` | KCM | 컨트롤러별 작업 큐 깊이 — CRD 컨트롤러 부하 확인 |
| `workqueue_adds_total` | KCM | 큐에 추가된 총 항목 수 |
| `workqueue_retries_total` | KCM | 재시도 횟수 — CRD 컨트롤러 오류율 파악 |
| `scheduler_pending_pods` | KSH | 대기 중인 Pod 수 |
| `scheduler_scheduling_duration_seconds` | KSH | 스케줄링 지연 시간 |
| `apiserver_flowcontrol_current_executing_seats` | API Server | APF별 현재 실행 시트 — CRD List 요청 영향 확인 |

**Amazon Managed Prometheus (AMP) 통합:**

EKS의 **Agentless Collector (Poseidon)**를 사용하면, 클러스터에 Prometheus를 설치하지 않고도 Control Plane 메트릭을 AMP 워크스페이스로 자동 수집할 수 있습니다.

```
EKS Console → Observability 탭 → Add scraper → AMP Workspace 선택
```

### 5.3 Control Plane Logging

EKS는 5가지 Control Plane 로그를 CloudWatch Logs로 내보낼 수 있습니다:

| 로그 유형 | 설명 | CRD 활용 사례 |
|---------|------|------------|
| API Server (api) | API 요청/응답 로그 | CRD API 호출 패턴 분석 |
| Audit (audit) | 누가 무엇을 했는지 감사 로그 | CRD 변경 추적, 보안 감사 |
| Authenticator | IAM 인증 로그 | 인증 문제 디버깅 |
| Controller Manager | KCM 진단 로그 | CRD 컨트롤러 오류 분석 |
| Scheduler | 스케줄러 의사결정 로그 | Pod 스케줄링 문제 분석 |

**활성화 방법:**

```bash
aws eks update-cluster-config --name my-cluster \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

**CloudWatch Logs Insights 쿼리 예시 — CRD 관련 API 호출 패턴 분석:**

```sql
-- CRD 관련 API 호출 패턴 분석
fields @timestamp, userAgent, verb, requestURI
| filter requestURI like /customresourcedefinitions/
| stats count(*) by verb, userAgent
| sort count(*) desc
| limit 20
```

### 5.4 Cluster Insights

EKS Cluster Insights는 자동으로 클러스터를 스캔하여 잠재적 문제를 탐지하고 권장사항을 제공합니다:

| 카테고리 | 설명 | 주기 |
|---------|------|------|
| Upgrade Insights | K8s 버전 업그레이드 시 문제가 될 수 있는 항목 탐지 | 24시간 + 수동 |
| Configuration Insights | 클러스터 구성 오류 탐지 | 24시간 + 수동 |
| Addon Compatibility | EKS Addon이 다음 K8s 버전과 호환되는지 확인 | 24시간 |
| Cluster Health Issues | 현재 클러스터 건강 상태 이슈 | 24시간 |

```bash
aws eks list-insights --cluster-name my-cluster
aws eks describe-insight --cluster-name my-cluster --id <insight-id>
```

### 5.5 EKS Console Observability Dashboard

EKS Console에는 통합 Observability Dashboard가 포함되어 있습니다:

```
EKS Console → Cluster 선택 → Observability 탭
├── Health and Performance Summary (요약 카드)
├── Cluster Health Issues (건강 이슈 목록)
├── Control Plane Monitoring
│   ├── Metrics (CloudWatch 기반 그래프)
│   │   ├── API Server Request Types (Total, 4XX, 5XX, 429)
│   │   ├── etcd Database Size
│   │   └── Kube-Scheduler Scheduling Attempts
│   ├── CloudWatch Log Insights (사전 정의 쿼리)
│   └── Control Plane Logs (CloudWatch 링크)
└── Upgrade Insights (업그레이드 준비 상태)
```

### 5.6 모니터링 채널 비교표

| 채널 | 비용 | 설정 | 데이터 유형 | PCP 지원 |
|------|------|------|----------|---------|
| CloudWatch Vended Metrics | 무료 (AWS/EKS) | 자동 (v1.28+) | 핵심 K8s 메트릭 (시계열) | 티어 사용량 메트릭 포함 |
| Prometheus Endpoint | 무료 (스크래핑) | 수동 구성 필요 | KCM/KSH/etcd 상세 메트릭 | 확장 가능 |
| Control Plane Logging | CloudWatch 표준 요금 | 수동 활성화 | 로그 (API/Audit/Auth/CM/Sched) | — |
| Cluster Insights | 무료 | 자동 | 클러스터 건강/업그레이드 권장 | PCP 티어 추천 (향후) |
| EKS Console Dashboard | 무료 | 자동 | 시각화된 메트릭 + 로그 쿼리 | 티어 정보 표시 |

---

## 6. CRD 설계 베스트 프랙티스

### 6.1 오브젝트 크기 최소화

- 각 CR 인스턴스의 **spec 크기를 가능한 작게 유지** (etcd 1.5MB 요청 제한)
- 대용량 데이터는 **ConfigMap이나 외부 저장소 참조로 분리**
- status 필드도 필요한 정보만 포함 — 히스토리나 로그성 데이터는 외부로

### 6.2 CRD 수 관리

- CRD 타입 수가 많으면 API Server **Watch Cache**와 etcd **Watch Stream**이 비례 증가
- 가능하면 유사한 리소스를 **하나의 CRD로 통합** (subresource 패턴 활용)
- 사용하지 않는 CRD는 반드시 정리

### 6.3 컨트롤러 최적화

| 패턴 | 올바른 사용법 | 피해야 할 사용법 |
|------|-----------|-------------|
| **Watch resourceVersion** | `resourceVersion`을 올바르게 사용 | `resourceVersion=""` 사용 금지 (전체 목록 재조회) |
| **List 호출** | 반드시 **페이지네이션** 사용 | 전체 List를 한 번에 조회 |
| **Informer** | client-go의 **SharedInformer** 패턴 사용 | 각 컨트롤러가 독립적으로 Watch 생성 |
| **재연결** | Watch가 끊겼을 때 **Exponential Backoff** 적용 | 즉시 재연결 시도 (thundering herd) |

### 6.4 K8s 버전 최신 유지

- **K8s 1.33+**에서 **Streaming List** 지원으로 대규모 List 성능이 크게 개선
- 가능하면 최신 K8s 버전을 사용하여 Control Plane 성능 개선 혜택을 받을 것

### 6.5 클러스터 아키텍처 권장사항

**워크로드별 클러스터 분리:**
- CRD가 많은 경우: **코어 CRD 클러스터** / **워크로드 실행 클러스터**를 분리
- 플랫폼 CRD와 테넌트 워크로드를 동일 클러스터에서 운영하면 상호 영향

**Namespace 기반 격리:**
- Kubernetes `ResourceQuota`를 통해 **namespace별 오브젝트 수 제한**
- 잘못된 자동화나 버그로 인한 **"오브젝트 폭주"** 방지

---

## 7. 종합 권장사항 & 도입 로드맵

### 7.1 CRD 규모별 PCP 티어 선택 가이드

| 워크로드 프로파일 | 권장 티어 | 핵심 이유 | 월 비용 (예상) |
|--------------|---------|---------|------------|
| 노드 ~50개, 기본 애드온 (Karpenter, cert-manager) | Standard | 기본 자동 스케일링으로 충분 | ~$73 |
| 노드 ~200개, 5개+ 오퍼레이터 (ArgoCD, Prometheus, 커스텀 컨트롤러) | **XL** | etcd 16GB 확보, 99.99% SLA | ~$1,204 |
| 노드 ~500개, 서비스 메시 + GitOps + 멀티테넌트 | **2XL** | 향상된 API Server 처리량 | ~$2,482 |
| 노드 1,000개+, AI/ML 오퍼레이터 + 대규모 CRD 기반 파이프라인 | **4XL** | API Server 수평 확장 | ~$5,037 |

### 7.2 규모별 컨트롤 플레인 메트릭 참고치

각 규모에서 EKS 컨트롤 플레인 스케일링 팩터가 되는 핵심 메트릭의 산업 평균 참고치입니다. 실제 수치는 워크로드 패턴에 따라 달라지며, **임계값 초과 시 상위 티어를 검토**해야 합니다.

| 메트릭 | ~50 노드 (Standard) | ~200 노드 (XL) | ~500 노드 (2XL) | 1,000+ 노드 (4XL) |
|--------|-------------------|---------------|----------------|-----------------|
| **etcd DB 크기** | 0.5~1.5 GB | 2~5 GB | 5~10 GB | 10~20 GB |
| **etcd 오브젝트 수** | ~5,000 | ~30,000 | ~100,000 | 300,000+ |
| **API QPS** (요청/초) | 20~50 | 100~300 | 300~800 | 1,000~3,000 |
| **API 요청 지연** (p99) | < 200ms | < 500ms | < 1s | < 1.5s (목표) |
| **429 Throttle** (분당) | 0 | < 5 | < 20 | 상위 티어 필요 시점 |
| **Watch 연결 수** | ~200 | ~1,500 | ~5,000 | 15,000+ |
| **CRD 타입 수** (참고) | 5~15 | 15~40 | 40~80 | 80+ |
| **컨트롤러 Reconcile/초** | 5~20 | 50~150 | 150~500 | 500~2,000 |

:::info 측정 방법
- **etcd DB 크기**: `apiserver_storage_size_bytes` (CloudWatch 또는 Prometheus)
- **API QPS**: `apiserver_request_total` rate (verb별 분리 권장)
- **429 Throttle**: `apiserver_request_total{code="429"}` — 0이 아니면 즉시 조사
- **Watch 연결**: `apiserver_longrunning_requests{verb="WATCH"}` — 컨트롤러/노드 수에 비례
- **Reconcile 속도**: 각 컨트롤러의 `controller_runtime_reconcile_total` rate
:::

:::warning etcd 크기 경고 기준
- **Standard**: 6GB 초과 시 Warning → XL 전환 검토
- **XL/2XL**: 12GB 초과 시 Warning → 불필요 CR 정리 또는 상위 티어
- **4XL**: 20GB 초과 시 Critical → 아키텍처 분리 (멀티 클러스터) 검토
:::

### 7.3 핵심 알람 설정

| 알람 이름 | 메트릭 | 임계값 | 심각도 | 대응 액션 |
|---------|--------|-------|-------|---------|
| API Throttling | `apiserver_request_total_429` | > 10/분, 5분간 | Critical | PCP 티어 업그레이드 검토 |
| API Server Errors | `apiserver_request_total_5xx` | > 5/분, 3분간 | Critical | Control Plane 로그 확인 |
| etcd DB 사용량 | `apiserver_storage_size_bytes` | > 6GB (Standard) / > 12GB (Provisioned) | Warning | 불필요한 CRD 리소스 정리 |
| Scheduling 실패 | `scheduler_schedule_attempts_UNSCHEDULABLE` | > 0, 10분간 | Warning | 노드 리소스 확인 |
| API Concurrency | `apiserver_flowcontrol_current_executing_seats_total` | > 80% of 티어 한도 | Warning | 상위 티어 프로비저닝 검토 |

### 7.3 통합 모니터링 스택 권장

```
통합 모니터링 아키텍처
│
[1] CloudWatch Vended Metrics (자동)
│   → AWS/EKS 네임스페이스 알람 설정
│   → Console Observability Dashboard 활용
│
[2] Prometheus Endpoint (수동 구성)
│   → AMP Agentless Scraper 또는 Self-hosted Prometheus
│   → KCM workqueue 메트릭으로 CRD 컨트롤러 모니터링
│   → Grafana 대시보드 구성
│
[3] Control Plane Logging (수동 활성화)
│   → audit + controllerManager 로그 필수 활성화
│   → CRD 관련 API 호출 패턴 분석
│
[4] Cluster Insights (자동)
    → 업그레이드 전 반드시 확인
    → PCP 티어 추천 기능 (향후)
```

### 7.4 단계별 도입 로드맵

| 단계 | 기간 | 주요 활동 |
|------|------|---------|
| **Phase 1: 기본 설정** | 1주 | CloudWatch 알람 설정, Control Plane Logging 활성화 (audit + controllerManager) |
| **Phase 2: Prometheus 통합** | 2주 | AMP Scraper 구성, KCM/KSH 메트릭 수집, Grafana 대시보드 |
| **Phase 3: PCP 적용** | 1주 | 워크로드 프로파일 분석 후 적정 PCP 티어 선택 (XL 이상 권장) |
| **Phase 4: 최적화** | 지속 | Cluster Insights 활용, 모니터링 데이터 기반 티어 조정, CRD 컨트롤러 튜닝 |

### 7.5 최종 요약 — 주요 과제별 대응 전략

| 과제 | EKS 기능 활용 | CRD 설계 대응 |
|------|-----------|------------|
| **CRD로 인한 etcd 과부하** | Provisioned 티어: etcd 16GB + Event Sharding + 자동 스케일링 | Provisioned 티어 적용, CR 오브젝트 크기 최소화 |
| **API Server 성능 저하** | PCP 티어별 보장된 inflight requests + APF 우선순위 관리 | 컨트롤러 List/Watch 패턴 최적화, K8s 최신 버전 사용 |
| **스케줄링 한계** | 상위 티어에서 API Server 수평 확장 | 워크로드 증가 예측 시 상위 티어 사전 프로비저닝 |
| **Control Plane 안정성** | Multi-AZ, 99.99% SLA (Provisioned) | 프로덕션 클러스터는 Provisioned 티어 권장 |
| **비용 예측성** | PCP 티어별 고정 가격 ($0.10 ~ $13.90/hr) | 워크로드 프로파일에 맞는 적정 티어 선택 |
| **가시성 부족** | 4가지 모니터링 채널 (Vended Metrics, Prometheus, Logging, Insights) | Phase 1~4 단계별 모니터링 도입 |

---

:::info 참고 자료

**AWS 공식 문서:**
- [Amazon EKS Provisioned Control Plane](https://docs.aws.amazon.com/eks/latest/userguide/provisioned-control-plane.html)
- [EKS Control Plane Metrics](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-metrics.html)
- [EKS Best Practices — Control Plane](https://docs.aws.amazon.com/eks/latest/best-practices/control-plane.html)
- [EKS Cluster Insights](https://docs.aws.amazon.com/eks/latest/userguide/cluster-insights.html)
- [EKS Pricing](https://aws.amazon.com/eks/pricing/)

**AWS 블로그:**
- [Amazon EKS Introduces Provisioned Control Plane](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-provisioned-control-plane/)
- [Managing etcd Database Size on Amazon EKS Clusters](https://aws.amazon.com/blogs/containers/managing-etcd-database-size-on-amazon-eks-clusters)
- [Amazon EKS Enhances Kubernetes Control Plane Observability](https://aws.amazon.com/blogs/containers/amazon-eks-enhances-kubernetes-control-plane-observability/)
- [Proactive EKS Monitoring with CloudWatch Operator](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)

**re:Invent 2025:**
- [CNS429: Under the Hood — Architecting EKS for Scale and Performance](https://www.youtube.com/watch?v=eFrSL5efkk0) — Control Plane 내부 아키텍처, 100k 노드 스케일링

**Kubernetes upstream:**
- [API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- [Consistent Reads from Cache (v1.31 Beta)](https://kubernetes.io/blog/2024/08/15/consistent-read-from-cache-beta/) — etcd 부하 감소
- [API Streaming (v1.31)](https://kubernetes.io/blog/2024/12/17/kube-apiserver-api-streaming/) — LIST 메모리 오버헤드 해결
- [CRD Watch 10-15x Memory Issue (#124680)](https://github.com/kubernetes/kubernetes/issues/124680) — CRD Watch가 built-in 대비 10-15배 메모리 사용

**etcd:**
- [etcd Performance Best Practices](https://etcd.io/docs/v3.5/op-guide/performance/)
- [etcd System Limits (1.5MB)](https://etcd.io/docs/v3.5/dev-guide/limit/)

**모니터링:**
- [Grafana Dashboard: EKS Control Plane](https://grafana.com/grafana/dashboards/21192-eks-control-plane/)
:::
