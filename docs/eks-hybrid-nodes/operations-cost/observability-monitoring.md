---
title: 관측성 통합 — 자가진단·Container Insights·eBPF
description: "EKS Hybrid Nodes 관측성 구현 가이드 — Cluster Insights 구성 자가진단, CloudWatch Container Insights 하이브리드 구성(RUN_WITH_IRSA), NVIDIA GPU 메트릭 통합, Cilium Hubble 기반 eBPF 대시보드, Network Flow Monitor 적용성 분석을 다룹니다."
created: "2026-08-26"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 11
tags:
  - eks
  - hybrid-node
  - observability
  - ebpf
  - cilium
  - monitoring
  - scope:ops
keywords:
  - Cluster Insights
  - Container Insights
  - Hubble
  - Network Flow Monitor
  - DCGM
sidebar_label: 관측성 통합
category: hybrid-multicloud
---

## 개요

하이브리드 클러스터의 관측 체계는 [운영과 비용 최적화](./operations-cost-optimization#모니터링-체계)의 3계층 모델(노드·워크로드 / 크로스 네트워크 경로 / Gateway)을 전제로 합니다. 본 문서는 그 구현을 다룹니다 — EKS Cluster Insights의 하이브리드 구성 자가진단, CloudWatch Container Insights의 하이브리드 특화 구성과 제약, NVIDIA GPU 메트릭 통합, Cilium Hubble 기반 eBPF 네트워크 대시보드, 그리고 CloudWatch Network Flow Monitor(NFM)의 하이브리드 적용성 분석입니다.

## EKS Cluster Insights: 구성 자가진단

EKS Cluster Insights는 세 가지 인사이트 유형(구성·업그레이드·롤백 준비) 중 **구성 인사이트(Configuration insights)** 를 하이브리드 노드 클러스터에 특화해 제공합니다. 컨트롤 플레인이 클러스터를 자동 스캔해 다음과 같은 사설망 네트워크·권한 문제를 탐지하고 시정 권고를 제시합니다.

- **컨트롤 플레인 → 웹훅 통신 장애**: RemotePodNetwork 미구성 또는 Pod CIDR 미라우팅 상태에서 하이브리드 노드에 웹훅이 배치된 경우
- **`kubectl exec`/`kubectl logs` 실패**: 컨트롤 플레인 → kubelet(TCP 10250) 경로 문제 — 방화벽 inbound 방향 오류가 전형적 원인 ([방향 주의](../networking/firewall-connectivity#zone-a-온프레미스-방화벽-상시-운영-룰))
- 그 밖의 원격 네트워크 구성 불일치

운영 워크플로우는 다음과 같습니다. 인사이트는 24시간 주기로 자동 갱신되며, 조치 후 수동 갱신으로 해소 여부를 즉시 확인할 수 있습니다.

```bash
# 구성 인사이트 목록 조회
aws eks list-insights \
  --cluster-name CLUSTER_NAME \
  --filter categories=CONFIGURATION

# 개별 인사이트의 상세 진단·권고 확인
aws eks describe-insight \
  --cluster-name CLUSTER_NAME \
  --id INSIGHT_ID
```

컨트롤 플레인 관점의 Cluster Insights와 노드 관점의 `nodeadm debug`([구성 검증 자동화](./operations-cost-optimization#구성-검증-자동화))를 짝으로 운용하면 "클러스터 쪽에서 본 문제"와 "노드 쪽에서 본 문제"를 양방향으로 교차 진단할 수 있습니다. 신규 구축·방화벽 변경·업그레이드 직후를 필수 점검 시점으로 런북에 고정합니다.

## CloudWatch Container Insights 통합

CloudWatch Observability 애드온(`amazon-cloudwatch-observability`)은 v2.2.1-eksbuild.1 이상에서 하이브리드 노드와 호환됩니다. 온프레미스 노드의 메트릭·로그를 클라우드 노드와 동일한 CloudWatch 화면으로 통합하되, 하이브리드 특화 제약 세 가지를 반영해야 합니다.

| 항목 | 내용 | 대응 |
|------|------|------|
| IMDS 부재 | 하이브리드 노드에는 EC2 Instance Metadata Service가 없어 **노드 레벨 메트릭이 수집되지 않음** (클러스터·워크로드·Pod·컨테이너 레벨은 정상) | 노드 레벨은 Prometheus Node Exporter(하이브리드 호환 애드온)로 보완 |
| 자격 증명 | 에이전트가 IMDS 기반 자격 증명을 획득할 수 없음 | `AmazonCloudWatchAgent` 리소스에 `RUN_WITH_IRSA=True` 환경 변수 추가 (필수) |
| Operator 웹훅 | 애드온 operator가 웹훅을 사용 | Pod CIDR 라우팅/Gateway 구성, 또는 mixed mode에서 operator를 클라우드 노드에 배치 |

```bash
# 애드온 설치 후 — 하이브리드 노드에서 에이전트가 동작하도록 매니페스트 수정
kubectl edit amazoncloudwatchagents -n amazon-cloudwatch cloudwatch-agent
```

```yaml
# spec.env에 추가
spec:
  env:
    - name: RUN_WITH_IRSA
      value: "True"
```

로그 수집(Fluent Bit)도 동일 애드온으로 처리되며, 하이브리드 노드의 kubelet·시스템 로그가 CloudWatch Logs로 집계됩니다. 폐쇄망에서는 `logs`·`monitoring` VPC 엔드포인트가 전제입니다 ([엔드포인트 매핑](../networking/private-vpc-endpoints#필수-인터페이스-엔드포인트-매핑)).

### NVIDIA GPU 메트릭 통합

온프레미스 GPU(DGX 등)의 가속기 메트릭은 DCGM(Data Center GPU Manager) Exporter를 기준으로 수집합니다. AWS 공식 레퍼런스 아키텍처는 DCGM Exporter → Amazon Managed Service for Prometheus(AMP) → Amazon Managed Grafana(AMG) 경로입니다.

- **DCGM Exporter**: GPU 사용률·메모리·온도·전력·XID 오류를 Prometheus 형식으로 노출합니다. [하이브리드 전용 Device Plugin](../compute-gpu/gpu-scheduling-failover#하이브리드-전용-nvidia-device-plugin)과 동일하게 `eks.amazonaws.com/compute-type: hybrid` nodeSelector로 배포 범위를 제한합니다.
- **수집 경로 선택**: AMP managed collector는 Pod 메트릭 엔드포인트가 VPC에서 도달 가능해야 하므로 Pod CIDR 라우팅(BGP/Gateway)이 전제입니다. unroutable 구성에서는 ADOT 애드온 또는 클러스터 내 Prometheus가 스크래핑 후 AMP로 remote write하는 경로를 사용합니다.
- **CloudWatch 일원화가 요구되는 조직**: CloudWatch agent의 Prometheus 스크래핑 구성으로 DCGM 메트릭을 CloudWatch로 적재해 Container Insights 화면과 같은 계정·콘솔에서 관측할 수 있습니다.
- Node Monitoring Agent(하이브리드 호환 애드온)를 함께 배포하면 GPU 관련 노드 헬스 이슈 탐지가 보강됩니다.

## eBPF 기반 통합 네트워크 대시보드: Cilium Hubble

하이브리드 노드의 CNI가 Cilium이라는 사실은 곧, 별도 에이전트 없이 **커널 eBPF 레벨의 네트워크 관측 데이터가 이미 데이터 플레인에 존재**한다는 뜻입니다. Hubble은 Cilium에 내장된 관측 계층으로, Pod 간 플로우·DNS 조회·정책 드롭을 eBPF로 캡처합니다.

### 활성화 구성

```yaml
# cilium-values.yaml에 추가 (기존 values와 병합)
hubble:
  enabled: true
  metrics:
    enableOpenMetrics: true
    enabled:
      - dns
      - drop            # 정책·라우팅 드롭 — 하이브리드 경로 문제의 1차 신호
      - tcp
      - flow
      - port-distribution
  relay:
    enabled: true       # 클러스터 전체 플로우 집계
  ui:
    enabled: true       # 서비스 맵 시각화 (선택)
```

```bash
helm upgrade cilium oci://public.ecr.aws/eks/cilium/cilium \
  --namespace kube-system --reuse-values --values cilium-values.yaml

# 플로우 실시간 확인 (드롭 원인 진단)
hubble observe --verdict DROPPED --last 100
```

- Hubble 메트릭은 각 Cilium 에이전트의 9965 포트(기본)로 노출되며, Prometheus/AMP가 스크래핑해 Grafana의 공식 Hubble 대시보드(L3/L4 플로우, DNS, 드롭 사유별 분포)로 시각화합니다.
- **Hybrid Nodes Gateway와의 상충 주의**: Gateway는 `l7Proxy=false`를 요구하므로([도입 전 체크리스트](../networking/hybrid-nodes-gateway#도입-전-체크리스트)), Gateway 환경에서는 Hubble의 HTTP 등 L7 프로토콜 가시성은 사용할 수 없습니다. L3/L4 플로우·DNS·드롭 관측은 L7 proxy와 무관하게 동작합니다.
- Hubble Relay·UI를 하이브리드 노드에 배치하면 관측 트래픽이 온프레미스에서 완결됩니다. 클라우드 측 Grafana(AMG)에서 조회하는 경우 데이터 소스(AMP) 기준으로는 배치 위치가 무관합니다.
- **지원 범위 주의**: Hubble은 공식 문서의 Cilium 지원 범위 표(네트워크 정책·BGP·Ingress·LB IPAM 등)에 포함되지 않은 업스트림 Cilium 기능입니다. 기술적으로 EKS 배포판 Cilium에서 동작하지만 AWS Support 범위 밖이므로, 지원 계약이 중요한 조직은 이 경계를 운영 문서에 명시합니다.

### 통합 대시보드 구성 전략

관측 스택을 AMP(또는 자체 Prometheus) + Grafana로 단일화하면, 성격이 다른 네 계열의 메트릭을 하나의 화면에서 상관 분석할 수 있습니다.

| 패널 계열 | 데이터 소스 | 관측 대상 |
|-----------|------------|----------|
| Pod 네트워크 플로우 (eBPF) | Hubble 메트릭 (`hubble_*`) | 온프렘 Pod 간·크로스 네트워크 플로우, 드롭, DNS 실패 |
| 크로스 네트워크 터널 | Gateway 메트릭 (`hybrid_gateway_*`) | VXLAN 트래픽량, leader 상태, 라우트 갱신 오류 |
| GPU 가속기 | DCGM 메트릭 (`DCGM_FI_*`) | GPU 사용률·메모리·XID 오류 |
| 노드·연결 계층 | Node Exporter, CloudWatch(DX/VPN) | 노드 리소스, 터널·회선 가용성 |

예를 들어 "추론 지연 급증" 상황에서 GPU 사용률(DCGM), Gateway 대역폭 포화(`hybrid_gateway_primary_nic_*`), Pod 드롭(`hubble_drop_total`)을 한 화면에서 대조하면 병목 계층을 즉시 좁힐 수 있습니다.

## Network Flow Monitor 적용성 분석

CloudWatch Network Flow Monitor(NFM)는 eBPF(`bpf_sock_ops`) 기반 경량 에이전트로 TCP 플로우의 재전송·RTT·전송량을 수집하고, EKS 콘솔의 Container Network Observability(서비스 맵·플로우 테이블)를 구동하는 서비스입니다. 하이브리드 클러스터 적용성을 판정하면 다음과 같습니다.

| 판정 축 | 내용 | 판정 |
|---------|------|------|
| 지원 대상 | 공식 문서는 에이전트 설치 대상을 "AWS compute resources (Amazon EC2 and Amazon EKS)"로 규정 | 온프렘 노드는 대상 외 |
| 하이브리드 애드온 호환성 | NFM 에이전트 애드온(`aws-network-flow-monitoring-agent`)은 하이브리드 노드 호환 검증 애드온 목록에 **미포함** — 공식 문서는 목록 외 애드온을 미검증으로 규정하며, 비호환 애드온에는 hybrid 레이블 anti-affinity가 적용됨 | 미검증 — 지원 문서화 없음 |
| Mixed mode 클라우드 노드 | EKS 애드온으로 정상 지원 (애드온 v1.1.0+, 커널 5.8+, 클러스터당 약 5,000노드/500만 플로우·분 한도) | 사용 가능 |
| 폐쇄망 | NFM 수집 경로의 PrivateLink 지원 | 사용 가능 (엔드포인트 개설 시) |

**결론**: NFM의 하이브리드 노드 지원은 문서화되어 있지 않으며(명시적 금지 문구도 없으나 검증 목록 부재), 프로덕션 설계에서는 mixed mode 클러스터의 **클라우드 노드 구간 전용** 관측 도구로 위치시키는 것이 안전합니다. 결과적으로 권장 구도는 역할 분담입니다.

- **클라우드 노드 구간**: NFM 애드온 — EKS 콘솔 서비스 맵·플로우 테이블, AWS 네트워크 헬스 인디케이터(NHI). 에이전트의 OpenMetrics 엔드포인트(`OPEN_METRICS=on`)를 Prometheus로 스크래핑하면 위 통합 Grafana 대시보드에 클라우드 구간 패널로 편입할 수 있습니다.
- **하이브리드 노드 구간**: Cilium Hubble — 동일한 eBPF 계열 데이터(플로우·드롭·DNS)를 온프레미스에서 수집. NFM이 커버하지 못하는 구간을 보완합니다.
- **두 구간의 접점(크로스 네트워크)**: Gateway 메트릭과 DX/VPN CloudWatch 메트릭이 담당합니다.

NFM의 하이브리드 노드 지원 여부는 애드온 호환 목록 기준으로 판단이 달라질 수 있으므로, 정기적으로 [하이브리드 호환 애드온 문서](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html)를 재확인합니다.

## 권장 사항 요약

- Cluster Insights(컨트롤 플레인 관점)와 `nodeadm debug`(노드 관점)를 교차 진단 도구로 런북에 고정하고, 구축·변경 직후 수동 갱신으로 확인합니다.
- Container Insights는 `RUN_WITH_IRSA=True` 설정이 필수이며, 하이브리드 노드의 노드 레벨 메트릭 공백은 Node Exporter로 보완합니다.
- GPU 메트릭은 DCGM Exporter → AMP → Grafana를 기본 경로로 하고, CloudWatch 일원화 요구 시 CloudWatch agent 스크래핑을 사용합니다.
- Cilium 환경의 eBPF 관측은 Hubble 활성화만으로 확보됩니다 — Gateway 사용 시 L7 가시성 제약만 유의합니다.
- NFM은 클라우드 노드 전용으로 배치하고, 온프레미스 구간은 Hubble이 담당하는 역할 분담 구도로 설계합니다.
- 통합 대시보드는 Hubble·Gateway·DCGM·연결 계층 4계열 메트릭을 단일 Grafana에 모아 상관 분석 가능하게 구성합니다.

## 참고 자료

### 공식 문서
- [Prepare for Kubernetes version upgrades and troubleshoot misconfigurations with cluster insights](https://docs.aws.amazon.com/eks/latest/userguide/cluster-insights.html) — 하이브리드 구성 인사이트
- [Configure add-ons for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html) — Container Insights 하이브리드 제약(RUN_WITH_IRSA·IMDS)·호환 애드온 목록
- [Monitor Kubernetes workload traffic with Container Network Observability](https://docs.aws.amazon.com/eks/latest/userguide/network-observability.html) — NFM 기반 EKS 네트워크 관측
- [How Network Flow Monitor works](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-NetworkFlowMonitor-inside-network-flow-monitor.html) — eBPF(bpf_sock_ops) 수집 원리와 한도
- [Hubble — Cilium Documentation](https://docs.cilium.io/en/stable/observability/hubble/) — Hubble 아키텍처·메트릭 구성

### 기술 블로그
- [Deploy production generative AI at the edge using Amazon EKS Hybrid Nodes with NVIDIA DGX — AWS Containers Blog](https://aws.amazon.com/blogs/containers/deploy-production-generative-ai-at-the-edge-using-amazon-eks-hybrid-nodes-with-nvidia-dgx/) — DCGM → AMP → AMG GPU 관측 레퍼런스

### 관련 문서 (내부)
- [운영과 비용 최적화](./operations-cost-optimization) — 3계층 관측 모델과 크로스 네트워크 SPOF
- [Hybrid Nodes Gateway 구축과 운영](../networking/hybrid-nodes-gateway) — `hybrid_gateway_*` 메트릭과 l7Proxy 제약
- [GPU 스케줄링과 클라우드 폴백](../compute-gpu/gpu-scheduling-failover) — DCGM Exporter 배포 범위 제한
- [사설 폐쇄망 VPC 엔드포인트 설계](../networking/private-vpc-endpoints) — logs·monitoring·aps 엔드포인트
