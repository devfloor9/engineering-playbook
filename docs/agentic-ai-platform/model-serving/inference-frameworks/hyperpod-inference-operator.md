---
title: HyperPod Inference Operator (관리형 KV 캐시·지능형 라우팅)
description: SageMaker HyperPod Inference Operator의 관리형 KV 캐시·지능형 라우팅·DPD를 Tiered Gateway와 비교하고, L2 추론 라우팅 레이어로서의 역할과 한계를 정리
created: "2026-06-23"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 12
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

Amazon SageMaker HyperPod Inference Operator는 EKS 위에서 LLM 추론을 서빙하는 관리형 컴포넌트입니다. 관리형 KV 캐시(Managed Tiered KV Cache)와 지능형 라우팅(Intelligent Routing)을 EKS 애드온 형태로 제공하여, vLLM 기반 워크로드의 prefill 재계산을 줄이고 처리량을 개선합니다.

본 문서는 HyperPod의 추론 라우팅이 [티어드 게이트웨이 아키텍처](../../model-serving/inference-routing/tiered-gateway-architecture.md)의 어느 계층에 해당하는지, 풀스택 게이트웨이와 무엇이 다른지, 그리고 KV 캐시 구성·라우팅 전략·인스턴스 요건을 정리합니다. 대상 독자는 HyperPod 추론 엔드포인트를 평가·구성하는 플랫폼 엔지니어입니다.

## 배경: HyperPod 추론의 두 라우팅 레이어

HyperPod 추론 엔드포인트는 두 개의 라우팅 레이어로 구성됩니다. 이 구분이 "HyperPod 게이트웨이가 풀스택 게이트웨이인가"라는 질문의 출발점입니다.

| 레이어 | 컴포넌트 | 책임 | 책임이 아닌 것 |
|--------|----------|------|---------------|
| **L1 (엣지)** | Application Load Balancer | TLS 종료, 헬스 체크, DNS(Route 53 연동, 선택) | 인증·인가, Rate Limiting, 모델/프로바이더 선택 |
| **L2 (추론 라우팅)** | Intelligent Router (Inference Operator) | KV 캐시 상태 기반 Pod 선택(prefix-aware 등) | 인증, Rate Limiting, 컨텍스트 인지(시맨틱) 라우팅 |

요청 단위 Rate Limiting은 라우터가 아니라 **Pod별 nginx 사이드카**(`InferenceEndpointConfig`의 `RequestLimits`: `maxConcurrentRequests`·`maxQueueSize`·`overflowStatusCode`)로 처리됩니다. 즉 Pod 레벨(L3) 제어이며 게이트웨이 레벨 정책이 아닙니다.

## HyperPod Intelligent Router vs Tiered Gateway

[라우팅 전략 문서](../../model-serving/inference-routing/routing-strategy.md)의 2-Tier 게이트웨이는 **L1 엣지 게이트웨이**(인증·Rate Limit·TLS)와 **L2 추론 라우팅**(KV-aware Pod 선택)을 별도 컴포넌트로 분리합니다. HyperPod Intelligent Router는 이 중 **L2만** 담당합니다.

| 기능 | HyperPod Intelligent Router | Tiered Gateway (kgateway + EPP) |
|------|----------------------------|--------------------------------|
| KV 캐시 인지 Pod 라우팅 | 제공(prefixaware·kvaware 등) | 제공(EPP `prefix-cache-scorer`) |
| 관리 모델 | AWS 관리형(EKS 애드온) | self-managed(K8s 표준) |
| 인증·인가 | 미제공(앞단 별도 구성) | 게이트웨이 레벨에서 구성 |
| Rate Limiting | Pod별 nginx 사이드카(L3) | 게이트웨이 레벨 토큰/요청 단위 |
| 컨텍스트 인지(시맨틱) 라우팅 | 미제공 | LLM Classifier·vLLM Semantic Router 연계 |
| MCP/A2A | 미제공 | agentgateway 연계 |

:::tip 핵심 구분
HyperPod에서는 ALB(L1)와 Intelligent Router(L2)가 함께 배포되어 **아키텍처상 한곳에 모여 보이지만**, Rate Limiting·인증·시맨틱 라우팅 같은 풀스택 게이트웨이 기능은 포함하지 않습니다. 이 기능들이 필요하면 HyperPod 앞단에 별도 L1 게이트웨이(kgateway·Kong 등)를 두어야 합니다. self-managed EKS에서는 게이트웨이와 라우터가 처음부터 분리된 컴포넌트입니다.
:::

## KV 캐시 구성: L1/L2 캐시와 라우팅 전략

HyperPod 관리형 KV 캐시는 추론 엔드포인트 설정에서 **2계층 캐시**로 구성됩니다.

- **L1 캐시**: 각 추론 노드의 CPU 메모리. 노드 로컬 저지연 재사용.
- **L2 캐시**: 노드 간 공유 계층. 백엔드를 `redis`(고객 관리형) 또는 `tieredstorage`(HyperPod 관리형 분산 메모리) 중 선택.

설정은 `InferenceEndpointConfig`의 KV 캐시 스펙에서 `enableL1Cache`·`enableL2Cache`를 켜고, `l2CacheBackend`를 지정하는 형태입니다.

```yaml
# 개념 예시 — 정확한 필드명·스키마는 사용 중인 Operator 버전 문서로 확인
kvCacheSpec:
  enableL1Cache: true
  enableL2Cache: true
  l2CacheSpec:
    l2CacheBackend: tieredstorage   # 또는 redis
```

### 라우팅 전략 4종

지능형 라우팅은 들어온 요청을 관련 KV 캐시를 보유했을 가능성이 가장 높은 인스턴스로 보냅니다. 다음 전략을 제공합니다.

| 전략 | 동작 |
|------|------|
| `prefixaware` (기본값) | 동일 prompt prefix 요청을 같은 인스턴스로 라우팅 |
| `kvaware` | KV 캐시 적중률이 가장 높은 인스턴스로 라우팅 |
| `session` | 동일 사용자 세션 요청을 같은 인스턴스로 라우팅 |
| `roundrobin` | KV 캐시 상태를 고려하지 않고 균등 분배 |

`kvaware` 전략에는 제약이 있습니다. vLLM 기반 이미지에서만 동작하며, `/completions` 엔드포인트를 요구하고(`/v1/chat/completions` 미지원), Inference Operator v3.1.3 이상과 호환되는 LMCache/vLLM 버전이 필요합니다.

:::caution P-type 인스턴스 요건은 확인 필요 (미확인)
관리형 tiered KV 캐시(L2 `tieredstorage`)가 **P 계열 인스턴스에서만 생성된다는 요건은 공식 문서에서 확인되지 않았습니다.** 공식 문서가 인스턴스 패밀리를 명시적으로 요구하는 부분은 아래 **Disaggregated Prefill/Decode(DPD)** 이며, 이는 EFA·GPUDirect RDMA 지원 인스턴스(`ml.p5`·`ml.p5e`·`ml.p5en`·`ml.p6-b200`·`ml.p6-b300`)를 요구합니다.

현장에서 "비 P-type 인스턴스에서 tiered KV 캐시 설정 객체가 생성되지 않는다"는 관측이 보고된 바 있으나, 이는 공개 문서에 반영되어 있지 않습니다. "언제부터 P 전용인가"를 포함해, 사용 중인 **Operator 버전과 실제 CRD 스펙으로 직접 검증**해야 하는 열린 항목입니다. 객체 이름(`TieredKvcacheConfig` 등)도 버전에 따라 다를 수 있으므로 적용 시점 릴리스 노트를 재확인하는 것을 권장합니다.
:::

## Disaggregated Prefill/Decode (DPD)

HyperPod는 v3.2(2026-06)에서 관리형 Disaggregated Prefill/Decode를 도입했습니다. prefill(compute-bound)과 decode(memory-bound)를 분리하여 각 단계를 독립적으로 스케일링하는 패턴으로, 긴 컨텍스트·대형 모델에서 효과가 큽니다(개념은 [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) 참조).

DPD는 KV 캐시 전송을 위해 **EFA·GPUDirect RDMA 지원 인스턴스**를 요구합니다: `ml.p5.48xlarge`·`ml.p5e.48xlarge`·`ml.p5en.48xlarge`·`ml.p6-b200.48xlarge`·`ml.p6-b300.48xlarge`. 검색 요약처럼 프롬프트가 짧고 반복적인 워크로드는 DPD보다 prefix 캐시 재사용(아래 처리량 레버)이 더 직접적인 이득을 줍니다.

## 처리량(TTFT·TPS) 레버

검색 요약처럼 동일 키워드가 반복되어 KV 캐시 적중률이 처리량을 좌우하는 워크로드에서는 다음 레버가 직접적인 효과를 냅니다. 수치와 구성 상세는 [KV Cache 최적화](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing)에 정리되어 있습니다.

| 레버 | 효과 | HyperPod에서 |
|------|------|-------------|
| prefix 캐시 재사용 | 동일 시스템 프롬프트 TTFT 50-80%↓, 처리량 400%+ | `prefixaware`/`kvaware` 라우팅 + L2 tiered 캐시 |
| Automatic Prefix Caching (vLLM) | 반복 prefix prefill 스킵 | vLLM 컨테이너 `--enable-prefix-caching` |
| Chunked Prefill | TTFT/처리량 균형 | vLLM 엔진 옵션 |
| DPD | 긴 컨텍스트 tail latency 개선 | v3.2 관리형(EFA P5/P6 요구) |

라우팅 결정(prefix 해시 조회)은 추론이 아니며, 최종 워크로드만 추론이라는 구분은 [KV Cache 최적화 문서의 라우팅 노트](../inference-optimization/kv-cache-optimization.md#kv-cache-aware-routing)를 참조하세요.

## 적합성과 한계

| 구분 | 내용 |
|------|------|
| **적합** | 운영 인력 최소화, 자동 노드 복구·governance, vLLM 기반 서빙, AWS 관리형 KV 캐시 활용 |
| **백엔드 제약** | vLLM 전용. `kvaware`는 `/completions`만. TensorRT-LLM 성능 천장이 필요하면 Dynamo 등 self-managed 검토 |
| **게이트웨이 기능** | 인증·Rate Limiting·시맨틱 라우팅·MCP는 미포함 → 앞단 L1 게이트웨이 별도 구성 |
| **비용** | EC2 대비 인스턴스 +15~20% 프리미엄(예: `ml.p5` $66 vs `p5` $55, us-east-1 2026-06 기준). 자동 복구·governance로 활용률을 높여 상쇄 가능 |
| **가용성** | 리전·인스턴스 패밀리 가용성 확인 필요. P 계열은 수급 제약이 흔함 |

> 관리형 KV 캐시·지능형 라우팅은 2025-11 GA, DPD는 v3.2(2026-06)에 도입되었습니다. 기능·버전은 적용 시점에 [HyperPod 추론 릴리스 노트](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html)로 재확인하는 것을 권장합니다.

## 참고 자료

### 공식 문서
- [SageMaker HyperPod — Caching and Routing](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-caching-routing.html) — 관리형 tiered KV 캐시(L1/L2)와 라우팅 전략 4종
- [SageMaker HyperPod — Disaggregated Prefill and Decode](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-dpd.html) — DPD와 EFA 지원 인스턴스 요건
- [SageMaker HyperPod — Request Limits](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-model-deployment-request-limits.html) — Pod별 nginx 사이드카 기반 요청 제한
- [SageMaker HyperPod Inference 릴리스 노트](https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-hyperpod-inference-release-notes.html) — 버전별 기능 도입 이력

### 관련 문서 (내부)
- [티어드 게이트웨이 아키텍처](../../model-serving/inference-routing/tiered-gateway-architecture.md) — Tier 1/Tier 2 게이트웨이 계층 정의
- [추론 게이트웨이 라우팅 전략](../../model-serving/inference-routing/routing-strategy.md) — L2 옵션 비교(EPP vs HyperPod vs Dynamo), 멀티리전 주의
- [KV Cache 최적화](../inference-optimization/kv-cache-optimization.md) — Cache-Aware Routing, 처리량 레버, 라우팅≠추론 구분
- [Disaggregated Serving](../inference-optimization/disaggregated-serving.md) — Prefill/Decode 분리 아키텍처
