---
title: HyperPod Inference Operator (관리형 KV Cache·지능형 라우팅)
description: SageMaker HyperPod Inference Operator의 관리형 KV cache·지능형 라우팅·DPD를 Tiered Gateway와 비교하고, L2 추론 라우팅 레이어로서의 역할과 한계를 정리
created: "2026-06-23"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 17
tags:
  - hyperpod
  - sagemaker
  - eks
  - vllm
  - kv-cache
  - inference
  - model-serving
  - scope:tech
keywords:
  - TieredKvcacheConfig
  - Intelligent Routing
  - Disaggregated Prefill Decode
sidebar_label: HyperPod Inference Operator
---

## 개요

Amazon SageMaker HyperPod Inference Operator는 **EKS 오케스트레이션 기반 HyperPod 클러스터** 위에서 LLM 추론을 서빙하는 관리형 컴포넌트입니다. 임의의 EKS 클러스터에 바로 설치하는 범용 애드온이 아니라, 먼저 EKS 오케스트레이션으로 생성한 HyperPod 클러스터가 있어야 하며, `amazon-sagemaker-hyperpod-inference` EKS 애드온 형태로 설치합니다. 설치 전 지원 인프라(AWS Load Balancer Controller, Amazon S3·FSx CSI 드라이버, KEDA, cert-manager)를 갖춰야 합니다. 관리형 KV cache(Managed Tiered KV Cache)와 지능형 라우팅(Intelligent Routing)은 이렇게 설치된 Operator가 제공하며, vLLM 기반 워크로드의 prefill 재계산을 줄이고 처리량을 개선합니다. 정확한 사전 조건과 설치 절차는 [HyperPod 모델 배포 설정 가이드](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-setup.html)를 참조하세요.

본 문서는 HyperPod의 추론 라우팅이 [티어드 게이트웨이 아키텍처](../../model-serving/inference-routing/tiered-gateway-architecture.md)의 어느 계층에 해당하는지, 풀스택 게이트웨이와 무엇이 다른지, 그리고 KV cache 구성·라우팅 전략·인스턴스 요건을 정리합니다. 대상 독자는 HyperPod 추론 엔드포인트를 평가·구성하는 플랫폼 엔지니어입니다.

## 배경: HyperPod 추론의 두 라우팅 레이어

:::info 적용 버전 범위
이 절이 설명하는 2-레이어(ALB + Intelligent Router) 구성은 **Operator-only 아키텍처**(Operator v3.5 / 애드온 v1.6.0-eksbuild.1 이하, 본 문서가 기준으로 삼은 2026-06 v3.2 포함)에 해당합니다. 2026-09-10 출시된 Operator v3.6 / 애드온 `v2.0.0-eksbuild.2`부터는 모델 인지(LLM-aware) 라우팅과 선택적 JWT 인증을 제공하는 **관리형 Inference Gateway**가 추가되었습니다. 이는 아래 ["관리형 Inference Gateway(v3.6+)"](#관리형-inference-gatewayv36)에서 별도로 다룹니다.
:::

HyperPod 추론 엔드포인트는 두 개의 라우팅 레이어로 구성됩니다. 이 구분이 "HyperPod 게이트웨이가 풀스택 게이트웨이인가"라는 질문의 출발점입니다.

| 레이어 | 컴포넌트 | 이 가이드 구성에서 담당 | 이 가이드 구성에서 담당하지 않음 |
|--------|----------|------|---------------|
| **L1 (엣지)** | Application Load Balancer | TLS 종료, 헬스 체크, DNS(Route 53 연동, 선택) | 모델/프로바이더 선택 |
| **L2 (추론 라우팅)** | Intelligent Router (Inference Operator) | KV cache 상태 기반 Pod 선택(prefix-aware 등) | 인증, 동시성 제한, 컨텍스트 인지(시맨틱) 라우팅 |

마지막 열은 **능력의 한계가 아니라 이 가이드가 선택한 아키텍처 배치**를 나타냅니다. 예를 들어 ALB 자체는 HTTPS 리스너에서 `authenticate-oidc`·`authenticate-cognito` 액션으로 OIDC/Cognito 인증을 수행할 수 있으므로([ALB 사용자 인증](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html)), 인증을 ALB에 둘지, 앞단 게이트웨이에 둘지는 설계 선택입니다. 이 가이드의 Operator-only 구성에서는 ALB에 인증을 구성하지 않는 것을 전제로 합니다.

요청 유입 제어는 라우터가 아니라 **Pod별 nginx 사이드카**가 담당합니다. 이 제어는 시간당 요청 수(RPS) 기반의 Rate Limiting이 아니라 **동시 처리 요청 수(concurrency) 상한과 대기 큐(admission control)** 입니다. `InferenceEndpointConfig`의 `worker.requestLimits`에서 `maxConcurrentRequests`(Pod가 동시에 처리하는 요청 수 상한), `maxQueueSize`(상한 도달 시 대기시킬 요청 수), `overflowStatusCode`(상한·큐 초과 시 반환 코드, 기본값 429)를 설정합니다. 상한에 도달하면 큐가 있으면 대기(최대 60초)하고, 큐가 가득 차거나 없으면 즉시 `overflowStatusCode`로 거부합니다. 즉 Pod 레벨(L3) 제어이며 게이트웨이 레벨 정책이 아닙니다.

:::caution 선행 조건: `metrics.enabled: true`
요청 제한을 적용하려면 배포에서 메트릭을 활성화해야 합니다. 요청 제한을 실제로 강제하는 nginx 사이드카 프록시는 `metrics.enabled: true`일 때만 생성되므로, 메트릭이 꺼져 있으면 `requestLimits`를 지정해도 제한이 적용되지 않습니다([Request Limits 문서](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-request-limits.html)).
:::

## HyperPod Intelligent Router vs Tiered Gateway

[라우팅 전략 문서](../../model-serving/inference-routing/routing-strategy.md)의 2-Tier 게이트웨이는 **L1 엣지 게이트웨이**(인증·Rate Limit·TLS)와 **L2 추론 라우팅**(KV-aware Pod 선택)을 별도 컴포넌트로 분리합니다. 아래 비교는 **Operator-only 아키텍처**의 Intelligent Router(관리형 Inference Gateway를 켜지 않은 상태, 즉 L2만 담당)를 기준으로 합니다.

| 기능 | HyperPod Intelligent Router (Operator-only) | Tiered Gateway (kgateway + EPP) |
|------|----------------------------|--------------------------------|
| KV cache 인지 Pod 라우팅 | 제공(prefixaware·kvaware 등) | 제공(EPP `prefix-cache-scorer`) |
| 관리 모델 | AWS 관리형(EKS 애드온) | self-managed(K8s 표준) |
| 인증·인가 | 미제공(앞단 별도 구성, 또는 v3.6+ 관리형 게이트웨이의 선택적 JWT 사용) | 게이트웨이 레벨에서 구성 |
| 동시성 제한(요청 유입 제어) | Pod별 nginx 사이드카(L3) | 게이트웨이 레벨 토큰/요청 단위 |
| 컨텍스트 인지(시맨틱) 라우팅 | 미제공 | LLM Classifier·vLLM Semantic Router 연계 |
| MCP/A2A | 미제공 | agentgateway 연계 |

:::tip 핵심 구분 (Operator-only 아키텍처 기준)
관리형 Inference Gateway를 켜지 않은 Operator-only 구성에서는 ALB(L1)와 Intelligent Router(L2)가 함께 배포되어 **아키텍처상 한곳에 모여 보이지만**, 동시성 제한을 제외하면 인증·시맨틱 라우팅 같은 풀스택 게이트웨이 기능은 L2 라우터 자체에 포함되지 않습니다. 이 기능들이 필요하면 HyperPod 앞단에 별도 L1 게이트웨이(kgateway·Kong 등)를 두거나, 아래의 관리형 Inference Gateway(v3.6+)를 활성화합니다. self-managed EKS에서는 게이트웨이와 라우터가 처음부터 분리된 컴포넌트입니다.
:::

## 관리형 Inference Gateway(v3.6+) {#관리형-inference-gatewayv36}

Operator v3.6 / 애드온 `v2.0.0-eksbuild.2`(2026-09-10)부터 HyperPod는 **관리형 Inference Gateway**를 제공합니다. 이는 위의 Intelligent Router(KV 상태 기반 Pod 선택)와 달리, 요청 본문의 `model` 필드를 읽어 여러 모델 사이에서 트래픽을 분배하는 **모델 인지(LLM-aware) 라우팅 계층**입니다. Operator를 대체하지 않고 그 앞단에 추가되며, 동일한 `amazon-sagemaker-hyperpod-inference` 애드온으로 함께 설치됩니다. 모델의 `InferenceEndpointConfig`에서 `spec.inferenceGateway.enabled: true`로 opt-in합니다(같은 모델에서 `intelligentRoutingSpec.enabled`와 동시 사용 불가).

Operator-only 아키텍처와 비교해 다음 두 가지가 달라집니다.

- **선택적 요청 인증**: `InferenceGatewayConfig`의 `spec.auth.jwt`로 JWT 베어러 토큰 인증을 설정할 수 있습니다. 단 **기본값은 인증 없음**입니다. `spec.auth`를 생략하면 게이트웨이는 네트워크(VPC) 제어로만 접근이 제한되며 어떤 요청이든 수락합니다. AWS는 모든 게이트웨이에 JWT 인증을 켜도록 강력히 권장합니다.
- **모델 서버 범위 확대**: 게이트웨이의 Endpoint Picker는 vLLM과 SGLang을 모두 지원합니다(스케줄러의 `engineType: vllm | sglang`). 반면 관리형 KV cache·`kvaware` 라우팅은 여전히 vLLM 전용입니다(아래 참조).

게이트웨이가 제공하지 않는 것(요청당 시간 기반 Rate Limiting, 시맨틱 라우팅, MCP/A2A 통합 등)은 여전히 앞단 L1 게이트웨이로 보완해야 합니다. 전체 스키마와 설치 절차는 [Inference Gateway 문서](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html)를 참조하세요.

## KV Cache 구성: L1/L2 캐시와 라우팅 전략 {#kv-캐시-구성-l1l2-캐시와-라우팅-전략}

HyperPod 관리형 KV cache는 추론 엔드포인트 설정에서 **2계층 캐시**로 구성됩니다.

- **L1 캐시**: 각 추론 노드의 CPU 메모리. 노드 로컬 저지연 재사용.
- **L2 캐시**: 노드 간 공유 계층. 백엔드를 `redis`(고객 관리형) 또는 `tieredstorage`(HyperPod 관리형 분산 메모리) 중 선택.

설정은 `InferenceEndpointConfig`의 KV cache 스펙에서 `enableL1Cache`·`enableL2Cache`를 켜고, `l2CacheBackend`를 지정하는 형태입니다.

```yaml
# 개념 예시 — 정확한 필드명·스키마는 사용 중인 Operator 버전 문서로 확인
kvCacheSpec:
  enableL1Cache: true
  enableL2Cache: true
  l2CacheSpec:
    l2CacheBackend: tieredstorage   # 또는 redis
```

### 라우팅 전략 4종

지능형 라우팅은 들어온 요청을 관련 KV cache를 보유했을 가능성이 가장 높은 인스턴스로 보냅니다. 다음 전략을 제공합니다.

| 전략 | 동작 |
|------|------|
| `prefixaware` (기본값) | 동일 prompt prefix 요청을 같은 인스턴스로 라우팅 |
| `kvaware` | KV cache 적중률이 가장 높은 인스턴스로 라우팅 |
| `session` | 동일 사용자 세션 요청을 같은 인스턴스로 라우팅 |
| `roundrobin` | KV cache 상태를 고려하지 않고 균등 분배 |

`kvaware` 전략에는 제약이 있습니다. vLLM 기반 이미지에서만 동작하며, 배포 매니페스트의 `invocationEndpoint`를 `/completions`로 설정해야 합니다(`/v1/chat/completions` 미지원). 이 제약은 `kvaware`에만 적용되며, 다른 전략(`prefixaware`·`session`·`roundrobin`)은 임의의 엔드포인트에서 동작합니다.

LMCache·vLLM 호환 버전은 Operator 버전에 따라 **두 가지 지원 조합**이 있습니다. v3.1.3이 최소 요건은 아니며, 공식 호환성 매트릭스는 더 낮은 버전 조합도 지원 대상으로 명시합니다.

| Inference Operator | Amazon EKS 애드온 | LMCache 이미지 | vLLM 이미지 |
|------|------|------|------|
| `>= v3.1.3` (권장) | `>= v1.2.1-eksbuild.1` | `>= v0.4.3` | `>= v0.19.1` |
| `< v3.1.3` | `< v1.2.1-eksbuild.1` | `v0.3.9post2` | `v0.11.1` |

AWS는 텐서 병렬화·향상된 장애 처리·캐시 워커 등록 등 KV-aware 라우팅의 견고성이 개선된 `v3.1.3` 이상(및 해당 LMCache/vLLM 버전) 사용을 권장합니다([Caching and Routing 문서](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-caching-routing.html)).

:::caution P-type 인스턴스 요건은 확인 필요 (미확인)
관리형 tiered KV cache(L2 `tieredstorage`)가 **P 계열 인스턴스에서만 생성된다는 요건은 공식 문서에서 확인되지 않았습니다.** 공식 문서가 인스턴스 패밀리를 명시적으로 요구하는 부분은 아래 **Disaggregated Prefill/Decode(DPD)** 이며, 이는 EFA·GPUDirect RDMA 지원 인스턴스(`ml.p5`·`ml.p5e`·`ml.p5en`·`ml.p6-b200`·`ml.p6-b300`)를 요구합니다.

현장에서 "비 P-type 인스턴스에서 tiered KV cache 설정 객체가 생성되지 않는다"는 관측이 보고된 바 있으나, 이는 공개 문서에 반영되어 있지 않습니다. "언제부터 P 전용인가"를 포함해, 사용 중인 **Operator 버전과 실제 CRD 스펙으로 직접 검증**해야 하는 열린 항목입니다. 객체 이름(`TieredKvcacheConfig` 등)도 버전에 따라 다를 수 있으므로 적용 시점 릴리스 노트를 재확인하는 것을 권장합니다.
:::

## Disaggregated Prefill/Decode (DPD)

HyperPod는 v3.2(2026-06)에서 관리형 Disaggregated Prefill/Decode를 도입했습니다. prefill(compute-bound)과 decode(memory-bound)를 분리하여 각 단계를 독립적으로 스케일링하는 패턴으로, 긴 컨텍스트·대형 모델에서 효과가 큽니다(개념은 [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) 참조).

DPD는 KV cache 전송을 위해 **EFA·GPUDirect RDMA 지원 인스턴스**를 요구합니다: `ml.p5.48xlarge`·`ml.p5e.48xlarge`·`ml.p5en.48xlarge`·`ml.p6-b200.48xlarge`·`ml.p6-b300.48xlarge`. 검색 요약처럼 프롬프트가 짧고 반복적인 워크로드는 DPD보다 prefix 캐시 재사용(아래 처리량 레버)이 더 직접적인 이득을 줍니다.

## 처리량(TTFT·TPS) 레버

prompt의 **동일한 토큰 prefix가 재사용될 때** KV cache 적중률이 처리량을 좌우하는 워크로드(예: 공통 시스템 프롬프트, 반복되는 긴 지시문)에서는 다음 레버가 직접적인 효과를 냅니다. 여기서 재사용 조건은 "같은 키워드가 등장"하는 것이 아니라 **토큰화된 prefix가 블록 단위로 정확히 일치**하는 것입니다. vLLM 자동 prefix 캐싱은 완전히 채워진 블록만 캐시하고, 블록 토큰과 그 앞 prefix 토큰의 해시로 식별하므로 토큰 시퀀스가 동일한 접두부만 재사용됩니다(모델 출력은 바뀌지 않음, [vLLM Automatic Prefix Caching 설계 문서](https://raw.githubusercontent.com/vllm-project/vllm/v0.24.0/docs/design/prefix_caching.md)).

구체적인 성능 수치(TTFT·처리량 개선율)는 모델·하드웨어·백분위수·기준선·측정 지표에 따라 크게 달라지므로, 출처가 명시된 측정값과 함께 [KV Cache 최적화](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing)에서 다룹니다. 아래 표는 각 레버의 효과 방향만 나타내며, 절대 수치는 벤치마크 산출물 없이는 단정하지 않습니다.

| 레버 | 효과(방향) | HyperPod에서 |
|------|------|-------------|
| prefix 캐시 재사용 | 동일 토큰 prefix에 대한 prefill 생략 → TTFT↓·처리량↑ (구체 수치는 KV Cache 최적화 문서 참조) | `prefixaware`/`kvaware` 라우팅 + L2 tiered 캐시 |
| Automatic Prefix Caching (vLLM) | 반복 prefix prefill 스킵 | vLLM 컨테이너 `--enable-prefix-caching` |
| Chunked Prefill | TTFT/처리량 균형 | vLLM 엔진 옵션 |
| DPD | 긴 컨텍스트 tail latency 개선 | v3.2 관리형(EFA P5/P6 요구) |

라우팅 결정(prefix 해시 조회)은 추론이 아니며, 최종 워크로드만 추론이라는 구분은 [KV Cache 최적화 문서의 라우팅 노트](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing)를 참조하세요.

## 적합성과 한계

| 구분 | 내용 |
|------|------|
| **적합** | 운영 인력 최소화, 자동 노드 복구·governance, vLLM 기반 서빙, AWS 관리형 KV cache 활용 |
| **백엔드 제약** | 관리형 KV cache·`kvaware`/`prefixaware` 지능형 라우팅은 **vLLM 전용**이며, `kvaware`는 `invocationEndpoint: /completions`만 지원합니다. 단 v3.6+ 관리형 Inference Gateway의 모델 인지 라우팅은 vLLM과 SGLang을 모두 지원합니다(`engineType: vllm \| sglang`). TensorRT-LLM 성능 천장이 필요하면 Dynamo 등 self-managed를 검토합니다 |
| **게이트웨이 기능** | Operator-only 구성에서는 인증·시맨틱 라우팅·MCP가 L2 라우터에 포함되지 않아 앞단 L1 게이트웨이가 필요합니다. v3.6+ 관리형 Inference Gateway를 켜면 선택적 JWT 인증(기본값: 인증 없음)과 모델 인지 라우팅이 추가됩니다. 요청당 시간 기반 Rate Limiting·시맨틱 라우팅·MCP는 여전히 미포함입니다 |
| **비용** | 인스턴스 단가 비교는 적용 시점·리전·정확한 SKU에 따라 달라집니다. 과거 자료에 EC2 대비 약 +15~20% 프리미엄 예시가 있으나 1차 가격 출처가 확인되지 않았으므로, 실제 평가 시 [SageMaker 가격](https://aws.amazon.com/sagemaker/pricing/)과 [EC2 가격](https://aws.amazon.com/ec2/pricing/)에서 대상 SKU·리전·시점을 직접 비교하세요. 자동 복구·governance로 활용률을 높여 상쇄 가능 |
| **가용성** | 리전·인스턴스 패밀리 가용성 확인 필요. P 계열은 수급 제약이 흔함 |

> 관리형 KV cache·지능형 라우팅은 2025-11 GA, DPD는 v3.2(2026-06)에 도입되었습니다. 기능·버전은 적용 시점에 [HyperPod 추론 릴리스 노트](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html)로 재확인하는 것을 권장합니다.

## 참고 자료

### 공식 문서
- [SageMaker HyperPod — 모델 배포 설정](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-setup.html) — EKS 오케스트레이션 HyperPod 클러스터 전제와 Operator 설치 사전 조건
- [SageMaker HyperPod — Caching and Routing](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-caching-routing.html) — 관리형 tiered KV cache(L1/L2)와 라우팅 전략 4종, `kvaware` 호환성 매트릭스
- [SageMaker HyperPod — Inference Gateway](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-inference-gateway.html) — v3.6+ 관리형 모델 인지 게이트웨이, 선택적 JWT 인증, vLLM·SGLang 지원
- [SageMaker HyperPod — Disaggregated Prefill and Decode](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-dpd.html) — DPD와 EFA 지원 인스턴스 요건
- [SageMaker HyperPod — Request Limits](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-request-limits.html) — Pod별 nginx 사이드카 기반 동시성 제한과 `metrics.enabled` 선행 조건
- [SageMaker HyperPod Inference 릴리스 노트](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html) — 버전별 기능 도입 이력

### 관련 문서 (내부)
- [티어드 게이트웨이 아키텍처](../../model-serving/inference-routing/tiered-gateway-architecture.md) — Tier 1/Tier 2 게이트웨이 계층 정의
- [추론 게이트웨이 라우팅 전략](../../model-serving/inference-routing/routing-strategy.md) — L2 옵션 비교(EPP vs HyperPod vs Dynamo), 멀티리전 주의
- [KV Cache 최적화](../inference-optimization/kv-cache-optimization.md) — Cache-Aware Routing, 처리량 레버, 라우팅≠추론 구분
- [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) — Prefill/Decode 분리 아키텍처