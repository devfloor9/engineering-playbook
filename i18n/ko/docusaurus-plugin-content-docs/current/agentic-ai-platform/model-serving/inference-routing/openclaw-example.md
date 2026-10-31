---
title: OpenClaw AI Agent Gateway 배포 및 Full Observability
description: OpenClaw AI 에이전트 게이트웨이를 EKS에 비용 최적화 배포하고, LiteLLM Auto Router + Cilium Hubble + Langfuse로 Full Observability 구현
created: "2026-03-06"
last_update:
  date: 2026-10-31
  author: YoungJoon Jeong
reading_time: 35
tags:
  - eks
  - openclaw
  - litellm
  - langfuse
  - cilium
  - hubble
  - bedrock
  - graviton
  - pod-identity
  - observability
  - scope:impl
sidebar_label: OpenClaw AI Gateway
sidebar_position: 5
category: genai-aiml
---

## 개요

OpenClaw은 범용 AI 에이전트 프레임워크로, 다양한 LLM을 활용한 자율 에이전트 워크플로우를 제공합니다. AWS에서는 `aws-samples/sample-OpenClaw-on-AWS-with-Bedrock` 샘플이 EC2 + CloudFormation 기반의 빠른 시작 가이드를 제공하며, 단일 인스턴스에서 Bedrock 모델 하나를 연동하는 간단한 구성입니다. 아래 비교는 **그 샘플의 단일 모델·단일 인스턴스 구성**을 기준으로 하며, 샘플 자체가 이후 멀티 모델을 지원하도록 바뀌었다면 각 항목을 샘플의 현재 버전과 다시 대조해야 합니다.

이 문서는 그 샘플 대신 **기존 EKS 클러스터 위에 OpenClaw 게이트웨이를 배포**하고 멀티 모델 라우팅과 3계층 관측성을 결합하는 **대안 아키텍처를 제안**합니다. 여기서 제시하는 구성·수치·절감 효과는 운영자가 자신의 트래픽과 환경에서 검증한 뒤 채택해야 하는 설계안이며, 그 자체로 프로덕션 준비가 완료되었음을 보장하지 않습니다.

**표 1. EC2 단독 배포와 EKS 기반 배포 비교**

| | EC2 단독 배포(참조 샘플) | EKS 기반 배포 (본 문서가 제안하는 대안) |
|---|---|---|
| **인프라** | EC2 + CloudFormation, 인스턴스 단위 관리 | 기존 EKS 클러스터에 Pod 추가, Karpenter 자동 스케일링 |
| **LLM 연동** | Bedrock 단일 모델 | LiteLLM Auto Router → 질의 내용 기반 멀티 모델 (Bedrock의 Claude/GLM + 외부 경유 Solar) |
| **관측성** | CloudWatch 기본 메트릭 | 3-Layer: 네트워크(Hubble) + LLM(Langfuse) + 시스템(OTEL/Prometheus) |
| **비용 제어** | 인스턴스 크기 조절 | Graviton4 ARM + Spot + 시맨틱 캐싱 + 예산 제어 |
| **확장성** | 수동 스케일링 | HPA/Karpenter 자동 스케일링, Spot 인스턴스 네이티브 중단 대응 |

### 관련 문서

**표 2. 관련 문서와 본 문서의 관계**

| 문서 | 내용 | 관계 |
|------|------|------|
| [Inference Gateway](routing-strategy.md) | Kgateway 기반 라우팅 | 이론적 기반 |
| [Agent 모니터링](../../operations-mlops/observability/agent-monitoring.md) | Langfuse/LangSmith 모니터링 | 모니터링 이론 |
| **17. OpenClaw AI Gateway** (본 문서) | OpenClaw 실전 배포 + Full o11y | **실습 구현** |

---

## 아키텍처 설계

이 구성은 6가지 핵심 설계 결정을 바탕으로, 엔터프라이즈 환경에서 요구하는 **비용 효율성**, **관측 가능성**, **운영 자동화**를 동시에 달성합니다.

import OpenClawArchitecture from '@site/src/components/OpenClawArchitecture';

<OpenClawArchitecture />

### 핵심 설계 결정 요약

이 아키텍처의 각 계층은 다음과 같은 설계 결정에 기반합니다:

**표 3. 계층별 설계 결정: 선택·대안·근거**

| 결정 영역 | 선택 | 대안 | 핵심 근거 |
|-----------|------|------|-----------|
| **호스팅 플랫폼** | EKS | EC2 단독 / AgentCore | Karpenter 자동 스케일링, o11y 스택 완전 자체 제어, Spot/Graviton 조합 가능, 비용 구조 유연성. Bedrock AgentCore는 2025-10 GA로 전환되어 cron/스케줄링과 관측성 통합을 제공하지만, 관리형 추상화를 쓸지 EKS에서 직접 제어할지는 트레이드오프이므로 요구사항에 맞춰 선택해야 합니다 ([AgentCore 런타임 문서](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html)) |
| **LLM Gateway** | LiteLLM Proxy | Bifrost / llm-d | 이 문서의 게이트웨이 설정(`model_list` / `litellm_params` / `router_settings` / `success_callback`, 포트 4000, `LITELLM_MASTER_KEY`)은 모두 LiteLLM Proxy의 계약입니다. OpenAI 호환 API, 100+ 프로바이더, 가상 키별 예산 제어, `success_callback: ["langfuse"]` 한 줄 콜백을 제공합니다. 자체 vLLM 추가 시 `LiteLLM → llm-d → vLLM` 하이브리드가 가능합니다. Bifrost는 OpenAI 호환 대안이지만 설정 형식(`config.json`+`$schema`·`providers`), 기본 포트(8080), 인증 토큰(`BIFROST_SETUP_TOKEN`)이 달라 아래 설정을 그대로 쓸 수 없습니다 ([LiteLLM Langfuse 연동](https://docs.litellm.ai/docs/observability/langfuse_integration), [Bifrost 설정](https://docs.getbifrost.ai/quickstart/gateway/setting-up)) |
| **LLM Observability** | Langfuse (self-hosted) | Tempo / Loki | Langfuse는 프롬프트/완료 내용, 토큰·비용, 도구 호출 체인을 LLM 트레이스로 저장·조회하는 데 특화되어 있습니다. Tempo/Loki도 OTLP 트레이스·로그를 저장할 수는 있으나, 프롬프트·완료 내용과 토큰·비용을 모델 호출 단위로 보여 주는 LLM 전용 UI는 제공하지 않습니다 |
| **Network Observability** | Cilium Hubble (ENI 모드) | CW Network Flow Monitor | L7 가시성(HTTP 경로, 상태코드, DNS)은 L7 가시성 정책과 Envoy 기반 L7 프록시가 활성화된 경우에만 수집됩니다. Cilium/Hubble 소프트웨어 자체는 무료이나 수집·저장·조회에 쓰는 노드 리소스와 로그 보존 비용은 별도입니다. CW NFM은 L3/L4만 지원하며 $20-45/월입니다 |
| **IAM 인증** | EKS Pod Identity | IRSA | OIDC provider 불필요, `aws eks create-pod-identity-association` 한 줄로 매핑 |
| **컴퓨팅** | Graviton4 M8g + Spot | x86 On-Demand | ARM64 20-40% 저렴, Spot 추가 절감, Karpenter 네이티브 중단 대응 |

---

## Technology Stack

### Compute

OpenClaw(TypeScript/Node.js)과 LiteLLM(Python)은 ARM64 호환 이미지를 제공하며, multi-arch 이미지를 사용합니다.

**표 4. 컴퓨팅 인스턴스 구성과 향후 전환**

| 항목 | 구성 | 상세 |
|------|------|------|
| **인스턴스** | Graviton4 **M8g** | GA, x86 대비 20-40% 비용 절감(워크로드별 상이), 에너지 효율은 AWS 공개 수치 참조 |
| **향후 전환** | Graviton5 **M9g** | M8g 대비 ~25% 성능 향상, **2026-06-10 GA**. 전환 시 동일 비용에서 추가 성능 확보 |
| **구매 옵션** | **Spot Instance** 우선 | On-Demand 대비 절감폭은 인스턴스·리전·시점에 따라 다릅니다. Karpenter v1.0+ 네이티브 중단 대응 + NMA 노드 건강 감시 |

#### Spot Instance 운영 시 고려사항 {#spot-instance-안정-운영}

OpenClaw 게이트웨이를 Spot Instance에서 운영하려면, 게이트웨이가 **상태를 보존하는(stateful) 워크로드**라는 점을 먼저 반영해야 합니다. OpenClaw의 공식 Kubernetes 설치는 에이전트 상태와 설정을 저장하는 PersistentVolumeClaim(기본 10Gi)을 포함하며, 첫 기동 이후에는 PVC에 저장된 사본이 설정의 기준입니다([OpenClaw Kubernetes 설치 문서](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/install/kubernetes.md)). 따라서 노드가 교체되어도 상태가 유지되도록 PVC와 자격 증명을 영속화하고, 복수 레플리카·배치 제약·종료 동작을 함께 정의해야 합니다. 안정 운영을 위해 3가지 계층을 조합합니다:

**표 5. Spot 안정 운영을 위한 3계층 구성**

| 계층 | 도구 | 역할 |
|------|------|------|
| **Spot 중단 대응** | Karpenter v1.0+ | 2분 전 중단 경고(최선 노력, 보장 아님) 수신 → 대체 노드 프로비저닝 → Pod 재스케줄링 |
| **노드 건강 감시** | NMA (EKS Add-on) | 커널/containerd/디스크/네트워크 이상 감지 → Node Condition 업데이트 |
| **자동 복구** | Node Auto Repair | NMA가 보고한 비정상 노드 자동 교체 |

Karpenter NodePool, EC2NodeClass, NMA 설정은 [5.1 Infrastructure](#51-infrastructure)에서 상세히 다룹니다.

**Pod 설정 — graceful shutdown + AZ 분산:**

```yaml
spec:
  terminationGracePeriodSeconds: 120  # 진행 중 요청 종료 처리에 쓸 유예 시간(2분 중단 경고 내에서만 유효)
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: openclaw-gateway
```

`terminationGracePeriodSeconds: 120`은 Pod 종료 시 유예 시간을 지정할 뿐, Spot 2분 중단 경고 안에서 진행 중 응답이 반드시 완료된다고 보장하지는 않습니다(경고 수신 자체가 최선 노력이며, [EC2 Spot 중단 통지](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html) 참조). `topologySpreadConstraints`는 AZ 간 Pod 분산을 유도하지만, 단일 AZ 장애에 대비하려면 복수 레플리카가 실제로 서로 다른 AZ에 배치되는지 함께 확인해야 합니다.

### LLM Models — Content-Based Routing

**표 6. 질의 유형별 모델·프로바이더·라우팅 근거**

| 질의 유형 | 모델 | 프로바이더 | 근거 |
|-----------|------|-----------|------|
| 범용 (기본) | **Claude Sonnet 4.6** | Bedrock | Bedrock에서 지원하는 컨텍스트 길이로 라우팅 기본값. "최고 성능"은 특정 벤치마크 기준으로만 성립하므로, 채택 전 대상 작업으로 비교해야 합니다 |
| 코딩 / 프로그래밍 | **GLM-4.7** | Bedrock | MoE 아키텍처, 코드 생성에 최적화. 총 파라미터 약 355B, 토큰당 활성 파라미터 약 32B입니다. 모델 카드 README에는 수치가 없어 [config.json](https://huggingface.co/zai-org/GLM-4.7/raw/main/config.json)으로 확인했습니다(GLM-4.5와 같은 구조: 92개 레이어, routed expert 160개 중 8개와 shared expert 1개 활성). Hugging Face가 집계한 safetensors 파라미터는 MTP 레이어를 포함해 358.3B입니다(2026-10-13 확인). Bedrock의 [공식 모델 카드](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-zai-glm-4-7.html)에서 ID `zai.glm-4.7`을 확인했으며, 날짜가 명시된 API·리전 정보는 아래를 참조하세요 |
| 한국어 / 한국 관련 | **Solar Pro 3** | 외부 경유(OpenRouter / Upstage Console API) | 128K context, 한국어 최적화. Bedrock 모델 레퍼런스에서 Solar Pro 3를 확인하지 못했으므로 외부 프로바이더 경유로 표기합니다. Bedrock에 추가되었는지는 모델 레퍼런스에서 다시 확인하세요(미확인을 "미제공"으로 단정하지 않음) |

:::note 모델 식별·프로바이더 확인
**2026-10-31** 확인한 [공식 GLM 4.7 모델 카드](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-zai-glm-4-7.html)는 `bedrock-runtime`과 `bedrock-mantle`의 모델 ID로 `zai.glm-4.7`을 명시합니다. **Invoke, Converse, Chat Completions**를 지원하며 Responses는 지원하지 않습니다. 이 게이트웨이의 `bedrock/zai.glm-4.7` 설정은 해당 모델 ID와 일치합니다.

모델 카드의 **in-region** 지원 리전은 `us-east-1`, `us-east-2`, `us-west-2`, `eu-north-1`, `eu-west-2`, `ap-northeast-1`, `ap-northeast-2`, `ap-south-1`, `ap-southeast-1`, `ap-southeast-2`, `ap-southeast-3`, `ap-southeast-4`, `sa-east-1`입니다. 이 모델의 Geo·Global cross-region inference ID는 명시되어 있지 않습니다.

이는 공개 API·리전 사양이며, **대상 계정의 접근 권한·할당량이나 게이트웨이 실행을 확인한 결과가 아닙니다**. 모델 가용성은 바뀔 수 있으므로 배포 전 모델 카드와 계정에서 승인된 가용성을 다시 확인하세요. Solar Pro 3의 Bedrock 모델 ID·API·리전·대상 계정 가용성은 여기서 미확인으로 남으며, 위 외부 프로바이더 경로는 제안된 경로로 유지합니다. 이 출처 확인을 위해 유료 inference는 실행하지 않았습니다.
:::

### Networking

**표 7. 네트워킹 구성요소와 사용 기술**

| Component | Technology |
|-----------|-----------|
| CNI | Cilium (ENI 모드) |
| Service Map | Hubble UI + Grafana |
| Bedrock 연결 | VPC Endpoint (`com.amazonaws.<region>.bedrock-runtime`) |

### Observability (3-Layer)

**표 8. 3계층 관측성: 계층별 도구와 추적 대상**

| Layer | Tool | Tracks |
|-------|------|--------|
| **Network** | Cilium Hubble | L7 HTTP 흐름, DNS, 서비스맵 |
| **LLM** | Langfuse | 프롬프트/응답, 토큰 비용, 도구 호출 체인 |
| **System** | OTEL → Prometheus/Grafana | CPU, 메모리, Pod 헬스, 커스텀 메트릭 |

---

## Cost Analysis

아래 수치는 특정 트래픽·용량 가정을 전제로 한 **예시 추정치**이며, 실제 비용은 요청량, 모델 선택, 캐시 적중률, 리전에 따라 달라집니다. Bedrock API 비용은 사용량에 비례하고, VPC Endpoint·Redis·Langfuse용 스토리지/DB·데이터 전송 등 사용량과 무관하게 발생하는 유료 리소스가 별도로 추가됩니다.

**표 9. 항목별 예상 월 비용과 가정·제외 항목**

| 항목 | 예상 월 비용(예시) | 가정·제외 항목 |
|------|-------------|------|
| Gateway + LiteLLM (ARM) | ~$30 | 소형 Graviton 노드 1대 기준, Spot 적용 시 변동 |
| Bedrock API (Claude/GLM) | ~$15-40 | 월 요청량·토큰 수 가정에 비례, 외부 경유 Solar 비용 별도 |
| Langfuse (self-hosted) | ~$10 | PostgreSQL 스토리지·백업 비용 별도 |
| Redis (캐시) | ~$5 | 메모리 크기·영속화 설정에 따라 변동 |
| Cilium + Hubble | 소프트웨어 $0 | eBPF 데이터 처리에 쓰는 노드 리소스, Hubble 로그 보존 비용은 별도 |
| Prometheus/Grafana | $0 (기존 스택 재사용 시) | 신규 배포 시 스토리지·컴퓨트 비용 발생 |
| VPC Endpoint | 별도 | 인터페이스 엔드포인트 시간당 요금 + 데이터 처리 요금 |
| **합계** | **대략 $60-85/월 + 상기 별도 항목** | 위 가정이 성립할 때의 예시 범위 |

### 비용 최적화 전략

각 수치는 조건부 효과이며, 실제 절감은 트래픽 패턴과 설정에 따라 달라집니다.

**표 10. 비용 최적화 전략과 조건부 효과**

| Strategy | Detail | 효과(조건부) |
|----------|--------|---------|
| Graviton4 ARM | x86 대비 | 워크로드에 따라 약 20-40% 비용 절감 |
| Spot Instance | On-Demand 대비, Karpenter 네이티브 중단 대응 | 절감폭은 인스턴스·리전·시점에 따라 변동 |
| Auto-Router | 특화 모델 라우팅으로 비용/품질 균형 | 질의 분포에 따라 모델별 비용 최적화 |
| 시맨틱 캐싱 | Redis 기반, 동일/유사 요청 캐시 | 반복 요청 비중이 높을 때만 절감 효과가 큼(유사도 임계값·적중률에 의존) |
| 예산 제어 | 가상 키별 월 예산, rate limiting | 예산 소진 시 **비동기로** 요청을 차단하므로 즉시·완전한 과금 방지는 아님 |
| VPC Endpoint | Bedrock 트래픽을 프라이빗 경로로 전송 | NAT Gateway 데이터 전송비 절감(엔드포인트 자체 요금은 별도 발생) |

---

## Deployment Guide

### 5.1 Infrastructure

#### EKS 클러스터 사전 요구사항

**표 11. EKS 클러스터 사전 요구사항**

| 요구사항 | 상세 |
|----------|------|
| EKS 버전 | 1.30+ (사용 Karpenter/애드온 버전이 요구하는 최소 버전 이상) |
| Karpenter | v1.0+ (Spot 네이티브 중단 대응 포함) |
| EKS Add-ons | Pod Identity Agent, EKS Node Monitoring Agent |
| VPC | Bedrock VPC Endpoint (`com.amazonaws.<region>.bedrock-runtime`) |
| CNI | Cilium ENI 모드(Hubble L7 가시성 필요 시) 또는 VPC CNI |

컴퓨팅·CNI는 두 가지 경로 중 하나를 선택하며, 두 경로를 섞을 수 없습니다.

- **직접 관리 경로(본 문서의 Karpenter 예시):** 아래의 `EC2NodeClass`/`NodePool`로 노드를 직접 정의하고, 필요 시 Cilium을 ENI 모드로 설치해 Hubble L7 가시성을 얻습니다. 이 경로는 Karpenter 컨트롤러와 노드 IAM 역할·태그 등 선행 조건을 직접 구성해야 합니다.
- **EKS Auto Mode 경로:** Auto Mode는 노드 프로비저닝과 CNI를 EKS가 관리하므로, 아래의 자체 `EC2NodeClass`를 그대로 적용하거나 Auto Mode 노드에 Cilium ENI를 얹는 구성과는 호환되지 않습니다([EKS Auto Mode 네트워킹](https://docs.aws.amazon.com/eks/latest/userguide/auto-networking.html)). Auto Mode를 쓰려면 아래 Karpenter 예시 대신 Auto Mode의 NodePool/네트워킹 방식을 따르세요.

아래 Karpenter 구성은 **직접 관리 경로**를 전제로 합니다.

#### Karpenter — 비용 최적화 노드 구성

Graviton4 M8g Spot 우선 구성으로 컴퓨팅 비용을 최소화합니다. 아래 YAML에서 `${CLUSTER_NAME}`은 Karpenter가 자동으로 치환하지 않는 **플레이스홀더**이므로, `envsubst`나 Helm/Kustomize 등 템플릿 도구로 실제 값을 주입한 뒤 적용해야 합니다. `al2023@latest` 별칭은 최신 AMI를 가리키는 **가변 참조**라 적용 시점마다 다른 AMI로 해석될 수 있으므로, 재현 가능한 배포가 필요하면 특정 AMI ID로 고정하세요([Karpenter NodeClass](https://karpenter.sh/docs/concepts/nodeclasses/)).

```yaml
# EC2NodeClass — Graviton4 ARM64 노드 설정
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: openclaw-arm64
spec:
  role: "KarpenterNodeRole-${CLUSTER_NAME}"
  amiSelectorTerms:
    - alias: al2023@latest     # Amazon Linux 2023, ARM64 자동 선택
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: "${CLUSTER_NAME}"
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: "${CLUSTER_NAME}"
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 30Gi
        volumeType: gp3
        deleteOnTermination: true
```

```yaml
# NodePool — Graviton4 이상, Spot 우선, On-Demand 폴백
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: openclaw-gateway
spec:
  template:
    metadata:
      labels:
        workload-type: ai-gateway
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]  # Spot 우선, 가용 시
        - key: karpenter.k8s.aws/instance-generation
          operator: Gt
          values: ["7"]                   # 8세대 이상 → m8g, c8g, r8g (Graviton4+)
        - key: karpenter.k8s.aws/instance-size
          operator: In
          values: ["medium", "large"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: openclaw-arm64
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    budgets:
      - nodes: "1"  # 통합(consolidation) 시 한 번에 1개 노드만 축출하도록 제한
  limits:
    cpu: "8"        # 이 NodePool이 프로비저닝할 수 있는 vCPU 총량 상한
    memory: 16Gi
```

:::tip Graviton 세대 선택
`instance-generation: Gt "7"` + `arch: arm64`로 지정하면 **8세대 이상 Graviton 인스턴스**(m8g, c8g, r8g = Graviton4)만 후보가 됩니다. `Gt "3"`은 t4g(Graviton2), m6g/m7g(Graviton2/3)까지 포함하므로 구세대가 프로비저닝될 수 있습니다. 새로운 Graviton 세대가 GA 되면 Karpenter가 요구사항에 맞는 인스턴스 유형 중에서 가격·가용 용량 기준으로 선택하므로, 대개 NodePool 수정 없이 신세대가 후보에 포함됩니다. 다만 "항상 성능 최적 인스턴스를 자동 선택"하는 것은 아니며, 선택 결과는 설정한 requirements와 Karpenter의 비용/용량 판단에 따라 달라집니다([Karpenter NodePool](https://karpenter.sh/docs/concepts/nodepools/)).

`budgets: nodes: "1"`은 통합·중단 과정에서 한 번에 축출되는 노드 수를 1개로 제한할 뿐 가용성을 보장하지는 않습니다. 가용성은 레플리카 수, PodDisruptionBudget, AZ 분산으로 확보해야 합니다([Karpenter Disruption](https://karpenter.sh/docs/concepts/disruption/)). `limits.cpu`는 이 NodePool이 프로비저닝할 수 있는 총 vCPU 상한이며, 개별 노드 크기나 요청당 과금 상한이 아닙니다.
:::

#### Node Monitoring Agent — 노드 건강 상태 감시

Karpenter는 Spot 중단 이벤트에 대응하지만, **노드 자체의 시스템 레벨 이상**(커널 문제, containerd 장애, 디스크/네트워크 이상 등)은 감지하지 않습니다. EKS Node Monitoring Agent(NMA)를 EKS Add-on으로 활성화하면 이 영역을 보완합니다.

**표 12. 감지 영역별 Karpenter와 NMA의 역할 분담**

| 감지 영역 | Karpenter | NMA |
|-----------|-----------|-----|
| Spot 중단 2분 전 경고 | **감지 + 대체 노드 프로비저닝** | - |
| 커널/containerd 장애 | - | **감지 → Node Condition 업데이트** |
| 디스크/네트워크 이상 | - | **감지 → Kubernetes Event 생성** |
| Node Auto Repair 연동 | - | **비정상 노드 자동 교체 트리거** |

```bash
# NMA EKS Add-on 활성화
aws eks create-addon \
  --cluster-name ${CLUSTER_NAME} \
  --addon-name eks-node-monitoring-agent
```

NMA Add-on을 설치하는 것만으로는 비정상 노드가 자동 교체되지 않습니다. 자동 교체는 **Node Auto Repair** 기능을 별도로 활성화해야 동작하며(EKS 관리형 노드 그룹 또는 Karpenter의 복구 기능 등 사용 모드에 따라 활성화 방법과 지원 조건이 다릅니다, [EKS 노드 상태 문서](https://docs.aws.amazon.com/eks/latest/userguide/node-health.html)), NMA는 노드 상태를 감지해 Node Condition과 이벤트를 갱신하는 역할을 합니다.

또한 Karpenter의 Spot 중단 처리는 EC2 중단 경고를 **중단 큐(SQS)와 EventBridge 규칙**을 통해 수신하도록 구성하고, Karpenter 컨트롤러에 해당 큐를 읽을 IAM 권한이 있어야 동작합니다([Karpenter Disruption](https://karpenter.sh/docs/concepts/disruption/)). 교체·복구에 걸리는 시간은 환경에 따라 다르므로 특정 복구 시간을 보장하지 않습니다.

Karpenter(Spot 중단 대응) + NMA(노드 건강 감시) + Node Auto Repair(자동 교체)를 조합하면, Spot 인스턴스 환경에서도 노드 장애 복구를 자동화할 수 있습니다.

#### IAM — EKS Pod Identity

```bash
# Pod Identity Agent add-on 활성화 후:
aws eks create-pod-identity-association \
  --cluster-name ${CLUSTER_NAME} \
  --namespace openclaw \
  --service-account openclaw-sa \
  --role-arn arn:aws:iam::${ACCOUNT_ID}:role/openclaw-bedrock-role
```

IAM Role에 필요한 권한:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`

위 연결(association)이 적용되려면, 해당 역할의 신뢰 정책이 EKS Pod Identity 서비스 주체(`pods.eks.amazonaws.com`)를 신뢰해야 하고, Pod가 `openclaw-sa` ServiceAccount로 실행되어야 하며, 컨테이너의 AWS SDK가 기본 자격 증명 체인과 리전 설정으로 자격 증명을 가져올 수 있어야 합니다([EKS Pod Identity](https://docs.aws.amazon.com/eks/latest/userguide/pod-identities.html)). 명령 한 줄만으로 임의의 Pod나 SDK가 자동으로 역할을 가정하지는 않습니다.

이 아키텍처에서 Bedrock를 직접 호출하는 주체는 게이트웨이(LiteLLM)입니다. 따라서 Bedrock 호출 권한은 게이트웨이 ServiceAccount에만 부여하고, OpenClaw 에이전트는 별도의 최소 권한 ServiceAccount를 사용하는 것이 안전합니다. 하나의 ServiceAccount를 공유하면 Bedrock를 직접 호출하지 않는 에이전트에까지 Bedrock 호출 권한이 불필요하게 열립니다.

### 5.2 LiteLLM AI Gateway {#52-bifrost-ai-gateway}

이 게이트웨이 설정은 **LiteLLM Proxy**의 구성 형식입니다(`model_list`/`litellm_params`/`router_settings`, 기본 포트 4000, `LITELLM_MASTER_KEY`). Bifrost를 쓰려면 `config.json` + `$schema`·`providers` 형식과 기본 포트 8080, `BIFROST_SETUP_TOKEN` 인증으로 다시 작성해야 하므로 아래 설정을 그대로 쓸 수 없습니다.

#### Config — 멀티 모델 + Auto-Router

:::note 버전·스키마 확인
아래 설정은 LiteLLM Proxy의 Auto Router 사용을 전제로 한 예시입니다. Auto Router의 필드명과 동작은 LiteLLM 버전에 따라 다르므로, 사용하는 LiteLLM 버전(`litellm/router_strategy/auto_router/auto_router.py`)에 맞춰 필드를 확인한 뒤 적용하세요.
:::

```yaml
model_list:
  - model_name: claude-sonnet
    litellm_params:
      model: bedrock/anthropic.claude-sonnet-4-6

  - model_name: glm-4.7
    litellm_params:
      model: bedrock/zai.glm-4.7

  - model_name: solar-pro-3
    litellm_params:
      model: openrouter/upstage/solar-pro-3
      api_key: os.environ/OPENROUTER_API_KEY

  # 임베딩 모델 — Auto Router가 질의 임베딩에 사용 (OpenAI 호출, 외부 트래픽·비용 발생)
  - model_name: text-embedding-3-small
    litellm_params:
      model: openai/text-embedding-3-small
      api_key: os.environ/OPENAI_API_KEY

  # Auto Router 설정 — default_model/embedding_model은 LiteLLM AutoRouter의 필수 파라미터
  - model_name: auto_router_1
    litellm_params:
      model: auto_router/auto_router_1
      auto_router_config_path: /config/router.json
      auto_router_default_model: claude-sonnet
      auto_router_embedding_model: text-embedding-3-small

router_settings:
  routing_strategy: simple-shuffle
  fallbacks:
    - claude-sonnet: ["glm-4.7"]
    - glm-4.7: ["claude-sonnet"]

litellm_settings:
  cache: true
  cache_params:
    type: redis
    host: redis
    port: 6379
  success_callback: ["langfuse"]
  failure_callback: ["langfuse"]

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

**Auto Router 구성 파일** (`/config/router.json`):

```json
{
  "routes": [
    {
      "name": "korean-queries",
      "model": "solar-pro-3",
      "utterances": [
        "한국어로 답변해줘",
        "한국 관련 질문",
        "Korean language query",
        "한국 뉴스",
        "한국어 번역"
      ],
      "description": "한국어 질의 또는 한국 관련 질의",
      "score_threshold": 0.5
    },
    {
      "name": "coding-queries",
      "model": "glm-4.7",
      "utterances": [
        "write code",
        "debug this function",
        "코드 작성해줘",
        "프로그래밍",
        "fix this bug"
      ],
      "description": "코딩, 프로그래밍, 디버깅 관련 질의",
      "score_threshold": 0.5
    }
  ],
  "default_route": "claude-sonnet",
  "encoder": {
    "type": "openai",
    "name": "text-embedding-3-small"
  }
}
```

:::note LiteLLM Auto Router
LiteLLM Auto Router는 `model_list`에 `auto_router/auto_router_1` 형태로 라우터를 추가하고, `auto_router_config_path`로 라우팅 규칙 JSON을, `auto_router_default_model`·`auto_router_embedding_model`로 기본 모델과 임베딩 모델을 지정합니다(기본·임베딩 모델은 LiteLLM AutoRouter의 필수 파라미터입니다). 요청 시 `model: "auto_router_1"`을 지정하면 utterances 기반 자동 라우팅이 활성화됩니다. `router.json`의 각 라우트는 `model` 필드로 `model_list`에 정의된 모델 별칭(`solar-pro-3`, `glm-4.7`)을 가리켜야 하며, `default_route` 역시 `model_list`의 별칭이어야 합니다. utterances에 한국어와 영어 표현을 함께 둔 것은 의도된 설계이므로(한국어 질의와 영어 지시를 모두 분류), 번역 시에도 양쪽 언어의 예시를 그대로 유지하세요.
:::

#### Secrets 생성

```bash
kubectl create secret generic litellm-secrets \
  --from-literal=LITELLM_MASTER_KEY='<your-master-key>' \
  --from-literal=OPENAI_API_KEY='<your-openai-key>' \
  --from-literal=OPENROUTER_API_KEY='<your-openrouter-key>'
```

`<...>` 플레이스홀더는 셸에서 리디렉션으로 해석되지 않도록 작은따옴표로 감싸고, 실제 값으로 교체하세요. 시크릿 키 이름은 설정에서 참조하는 환경 변수 이름(`LITELLM_MASTER_KEY`)과 일치해야 합니다.

Bedrock 경유 모델(Claude/GLM)은 EKS Pod Identity의 IAM 인증을 사용하므로 별도 API 키가 필요 없습니다. 다만 Auto Router의 임베딩에 쓰는 OpenAI(`text-embedding-3-small`)와 외부 경유 Solar(OpenRouter)는 각각 `OPENAI_API_KEY`, `OPENROUTER_API_KEY`가 필요하며, 이들 호출은 외부 엔드포인트로 나가는 트래픽과 비용을 발생시킵니다.

- Redis: Auto-Router 임베딩 캐시 및 LiteLLM 응답 캐시(`cache: true` + `type: redis`)
- Service: ClusterIP (port 4000, OpenAI-compatible API)

:::tip 캐시 유형
위 구성의 `cache: true` + `type: redis`는 요청 파라미터가 **동일한** 요청에 대한 정확 일치(exact-match) 캐시입니다. 유사 질의까지 묶는 시맨틱 캐시는 별도 설정이 필요합니다. 유사도 임계값 선택, 캐시 키 설계(멀티테넌트 namespace), PII 안전 처리, 관측성 지표 등 시맨틱 캐시 설계 원칙은 [Semantic Caching 전략](../inference-optimization/semantic-caching-strategy.md) 문서를 참조하세요.
:::

### 5.3 OpenClaw Gateway

#### Deployment

- Image: `ghcr.io/openclaw/openclaw:2026.7.1-2-slim` — 공식 설치가 쓰는 **불변(immutable) 버전 태그**입니다. `:latest`는 재현성과 롤백을 해치므로 사용하지 말고, 업그레이드 시 태그를 올리세요([OpenClaw Kubernetes 설치](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/install/kubernetes.md)).
- Persistence: 에이전트 상태·설정을 저장하는 **PersistentVolumeClaim**(공식 예시 10Gi)이 필요합니다. 첫 기동 이후 PVC의 사본이 설정 기준입니다.
- Auth: 게이트웨이 토큰(`OPENCLAW_GATEWAY_TOKEN`)으로 Control UI/게이트웨이 접근을 보호하고, 루프백 외부로 노출할 때는 TLS와 허용 오리진을 함께 설정하세요([OpenClaw Gateway 보안](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/gateway/security/index.md)).
- Resources: 512Mi memory, 250m CPU — 측정 전까지는 **예시 값**이며, 실제 요청·세션 부하로 측정해 조정해야 합니다.
- NodeSelector: `kubernetes.io/arch: arm64`
- Service: ClusterIP (port 18789)

#### Config (`openclaw.json`)

OpenClaw 설정 스키마에는 최상위 `ai` 키가 없습니다. 모델·프로바이더는 `models`에, 에이전트 기본 모델은 `agents` 계열 설정에 정의하며, 진단은 `diagnostics`에 둡니다. 아래는 OTel 진단만 발췌한 **부분 예시**이며, 모델·에이전트·게이트웨이 설정은 사용하는 버전의 스키마([zod-schema.root-shape.ts](https://raw.githubusercontent.com/openclaw/openclaw/v2026.9.5/src/config/zod-schema.root-shape.ts))에 맞춰 작성해야 합니다. 또한 특정 모델을 고정하면 LiteLLM Auto Router를 거치지 않으므로, 라우팅을 쓰려면 에이전트 기본 모델을 게이트웨이의 `auto_router_1` 별칭으로 지정하세요.

```json
{
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true
    }
  }
}
```

### 5.4 Cilium CNI (ENI 모드) + Hubble

**Cilium ENI 모드** — Pod IP를 ENI에서 직접 할당하는 데이터패스로, VPC CNI를 대체합니다. CNI 교체는 클러스터 네트워킹의 기반을 바꾸는 작업이므로 부수적인 배포 단계가 아니라 별도 계획·검증이 필요합니다.

- Pod IP를 ENI에서 직접 할당
- NetworkPolicy 지원
- 단일 eBPF 데이터패스

**Hubble UI** 기능과 전제 조건:

- 인터랙티브 서비스맵: Pod 간 요청 흐름 시각화
- **L7 가시성(HTTP 경로/상태코드 등)은 자동으로 켜지지 않습니다.** L7 가시성 정책(Layer 7 visibility, 예: `.spec.ingress[].toPorts[].rules.http`)을 적용하거나 L7 프로토콜 가시성을 활성화해야 하며, 이때 트래픽은 Envoy 기반 L7 프록시를 거칩니다([Cilium Layer 7 가시성](https://raw.githubusercontent.com/cilium/cilium/v1.18.1/Documentation/observability/visibility.rst)).
- TLS로 암호화된 트래픽의 HTTP 상세는 종단 간 암호화를 가로채지 않는 한 보이지 않습니다. DNS 가시성도 해당 가시성 정책 범위에서만 수집됩니다.
- 민감정보가 흐를 수 있으므로 캡처 범위·마스킹(redaction)·보존 기간을 정의해야 합니다.
- 비용: Cilium/Hubble **소프트웨어 라이선스는 $0**이지만, eBPF 데이터 처리에 쓰는 노드 리소스와 Hubble 흐름 로그 저장·보존 비용은 별도로 발생합니다.

### 5.5 LLM Observability (Langfuse)

- Langfuse self-hosted Helm chart — Langfuse 서버와 PostgreSQL 외에 **ClickHouse, Redis, S3 호환 오브젝트 스토리지**가 함께 필요합니다. 버전별 필수 구성요소가 다르므로 배포 전 사용 버전의 [Langfuse Kubernetes(Helm) 가이드](https://langfuse.com/self-hosting/deployment/kubernetes-helm)로 확인하세요.
- 게이트웨이(LiteLLM) `success_callback: ["langfuse"]`로 LLM 호출을 Langfuse에 전송합니다. 이는 게이트웨이를 지나는 모델 호출만 포착하므로, OpenClaw 에이전트 내부의 도구 실행 단계까지 하나의 트레이스로 재구성하려면 에이전트의 트레이스를 함께 전파해야 합니다.

**추적 항목(게이트웨이 LLM 호출 기준):**

- 프롬프트/완료 내용
- 토큰 사용량
- 모델별 비용
- 도구 호출 체인(에이전트 트레이스가 전파된 경우)
- 지연시간

### 5.6 System Observability (OTEL + Prometheus/Grafana)

- **OTEL Collector**: OTLP 수신(gRPC `:4317` 및/또는 HTTP `:4318`), Prometheus로 메트릭 익스포트. OpenClaw의 `diagnostics-otel`는 OTLP/HTTP(protobuf)를 사용하므로 HTTP 수신 포트(`:4318`)를 활성화해야 합니다.
- 트레이스·로그는 Prometheus가 아니라 트레이스/로그 백엔드(예: Tempo/Loki 또는 Langfuse)로 보내는 별도 익스포터·파이프라인이 필요합니다.
- 기존 kube-prometheus-stack이 있으면 재활용, 없으면 Helm으로 신규 배포
- OpenClaw 메트릭: `openclaw.tokens`, `openclaw.cost.usd`, `openclaw.run.duration_ms`, `openclaw.message.*`

---

## Dashboards & Alerts

### Langfuse (LLM 수준)

- **Agent Trace Explorer**: 메시지 → LLM 호출 → 도구 실행 → 응답 체인
- **Token Usage**: 모델별/시간별 토큰 소비
- **Cost Analytics**: 일별/주별 비용 트렌드
- **Prompt/Completion Inspector**: 실제 입출력 확인

### Hubble (네트워크 수준)

- **인터랙티브 서비스맵**: Pod 간 HTTP 요청 흐름
- **L7 가시성**: `POST /v1/chat/completions → 200 OK (320ms)`
- **DNS 쿼리 추적**: 어떤 외부 API를 호출하는지

### Grafana (시스템 수준)

- **Gateway Health**: 업타임, 연결 수, 메모리, CPU
- **LiteLLM**: 캐시 히트율, 요청 처리량, 지연시간
- **Pod/Node 리소스 사용량**

### Alert Rules

아래 임계값은 **예시 출발점**이며, 실제 알림은 메트릭 유형·관측 윈도우·트래픽 SLO에 맞춰 조정해야 합니다. 예를 들어 "Pod 재시작 > 3회"는 게이트웨이 다운의 직접 신호가 아니라 조사 트리거이고, 지연·에러율은 측정 윈도우와 샘플 수를 함께 정의해야 의미가 있습니다.

**표 13. 알림 규칙 예시와 임계 조건**

| Alert | Condition(예시) | 비고 |
|-------|-----------|------|
| 예산 초과 임박 | LiteLLM budget > 80% | 가상 키별 예산 기준 |
| Gateway 재시작 반복 | Pod restart > 3 in 5min | 다운 단정이 아니라 조사 트리거 |
| LLM 응답 지연 | p95 latency > 5s (예: 5분 윈도우) | 백분위·윈도우를 SLO에 맞춰 지정 |
| 캐시 히트율 급락 | Cache hit < 30% (충분한 샘플 수 전제) | 트래픽이 적을 때 오탐 주의 |
| 에러율 | Error rate > 5% (예: 5분 윈도우) | 윈도우·최소 요청 수 지정 |

---

## Verification Checklist

Pod가 `Running`이어도 트래픽을 받을 준비가 되었다는 뜻은 아니므로, 준비 상태(readiness)와 종단 간 동작, 장애 복구까지 함께 확인합니다.

**표 14. 배포 검증 체크리스트**

| # | Check | Command / Action |
|---|-------|-----------------|
| 1 | 모든 Pod Ready | `kubectl get pods` 로 `READY` 열 및 readiness probe 통과 확인(단순 `Running` 아님) |
| 2 | Gateway 상태 | `openclaw status` (port-forward 후), `/readyz`·`/startupz` 응답 확인 |
| 3 | Auto-Router 라우팅 | LiteLLM UI/로그에서 모델 목록 + 라우팅 결과 확인 |
| 4 | 서비스맵 | Hubble UI에서 Pod 간 L7 흐름 확인(L7 가시성 정책 적용 상태) |
| 5 | LLM trace | Langfuse UI에서 프롬프트→도구→응답 trace |
| 6 | 시스템 메트릭 | Grafana 대시보드 확인 |
| 7 | Bedrock 감사 | CloudTrail 로그 확인 |
| 8 | 라우팅 검증(종단 간) | 한국어/코딩/범용 질의를 각각 보내 실제 라우팅 모델이 기대와 일치하는지 확인 |
| 9 | Spot 안정성 | `kubectl get events` 로 Karpenter 노드 전환 이벤트 검증, `kubectl get nodeclaims` 로 대체 노드 프로비저닝 확인, 중단 후 요청이 복구되는지 종단 간 확인 |

---

:::tip 다음 단계
- 자체 호스팅 vLLM 추가 시: [llm-d 분산 추론](../../model-serving/inference-frameworks/llm-d-eks-automode.md)를 참조하여 `LiteLLM → llm-d → vLLM` 하이브리드 구성
- Bifrost 대안 사용: LiteLLM 대신 Bifrost(OpenAI 호환, Go 기반)로 교체할 수 있으나, 설정 형식·기본 포트(8080)·인증 토큰이 다르므로 본 문서의 설정을 Bifrost 형식으로 다시 작성해야 합니다
- 벡터 검색 RAG 추가: [Milvus 벡터 DB](../../operations-mlops/data-infrastructure/milvus-vector-database.md) 참조
- 에이전트 평가: [Ragas 평가](../../operations-mlops/governance/ragas-evaluation.md)로 응답 품질 측정
:::
