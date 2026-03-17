---
title: "추론 플랫폼 벤치마크: Bedrock AgentCore vs EKS 자체 구축"
sidebar_label: "AgentCore vs EKS 추론"
description: "Bedrock AgentCore를 기본으로 EKS 자체 구축(vLLM, llm-d) 대비 기능, 성능, 비용을 비교하는 벤치마크 계획"
tags: [benchmark, bedrock, agentcore, eks, vllm, llm-d, inference, cost]
category: "benchmark"
last_update:
  date: 2026-03-18
  author: devfloor9
---

# 추론 플랫폼 벤치마크: Bedrock AgentCore vs EKS 자체 구축

> **작성일**: 2026-03-18 | **상태**: 계획 (Plan)

## 목적

Bedrock AgentCore를 기본 추론 플랫폼으로 설정하고, EKS 자체 구축이 필요한 시점과 조건을 정량적으로 검증한다.

:::info 기본 전제
**Bedrock AgentCore가 기본 선택이다.** 매니지드 서비스로 구축 시간, 운영 부담, 스케일링을 AWS가 해결한다. 오픈소스/커스텀 모델도 Custom Model Import로 지원하므로, 모델 지원 여부 자체는 자체 구축의 이유가 되지 않는다. 자체 구축은 **추론 엔진 레벨 제어, 대규모 비용 최적화, 캐시 라우팅**이 필요할 때만 정당화된다.
:::

---

## 비교 대상

| 구성 | 설명 | 검증 목적 |
|------|------|----------|
| **Baseline. AgentCore (기본 모델)** | Bedrock 제공 모델 즉시 사용 | 기준점 |
| **Baseline+. AgentCore (커스텀 모델)** | Custom Model Import로 자체 모델 서빙 | 매니지드 환경에서 커스텀 모델 성능/비용 |
| **대안 A. EKS + vLLM** | 자체 구축 추론 (일반 로드밸런싱) | AgentCore 대비 비용/성능 이점 구간 확인 |
| **대안 B. EKS + vLLM + llm-d** | 캐시 인식 라우팅 추가 | 대안 A 대비 추가 투자 가치 확인 |

### 아키텍처 구성

```
Baseline:   Client → AgentCore Gateway → Bedrock Inference (기본 모델)
Baseline+:  Client → AgentCore Gateway → Bedrock Inference (Custom Import 모델)
대안 A:     Client → LiteLLM → kgateway (RoundRobin) → vLLM Pods
대안 B:     Client → LiteLLM → llm-d (Prefix-Cache Aware) → vLLM Pods
```

---

## AgentCore 제공 범위

| 영역 | AgentCore 기본 제공 | 자체 구축 시 필요한 것 |
|------|---------------------|----------------------|
| 추론 (기본 모델) | Claude, Llama, Mistral 등 즉시 사용 | vLLM + GPU + 모델 배포 |
| 추론 (커스텀 모델) | Custom Model Import / Marketplace | vLLM + GPU + 모델 배포 |
| 스케일링 | 자동 (매니지드) | Karpenter + HPA/KEDA |
| 에이전트 런타임 | Agent Runtime 내장 | LangGraph / Strands 직접 구축 |
| MCP 연결 | MCP 커넥터 내장 | MCP 서버 직접 배포/운영 |
| 가드레일 | Bedrock Guardrails | 직접 구현 또는 오픈소스 |
| 옵저버빌리티 | CloudWatch 통합 | Langfuse + Prometheus + Grafana |
| 보안 | IAM 네이티브, VPC 통합 | Pod Identity + NetworkPolicy |
| 운영 | 없음 (매니지드) | GPU 모니터링, 모델 업데이트, 장애 대응 |

---

## 검증 질문

| # | 질문 | 시나리오 |
|---|------|----------|
| Q1 | AgentCore 기본 모델 성능은 프로덕션 SLA를 충족하는가? | 1 |
| Q2 | Custom Model Import 성능은 vLLM 직접 서빙과 비교해 어떤가? | 2 |
| Q3 | Custom Model Import의 제약사항은? (양자화, 배치 전략 등) | 2 |
| Q4 | 어떤 트래픽 규모에서 자체 구축이 비용 효율적인가? | 6 |
| Q5 | 에이전트 워크플로우 복잡도를 AgentCore가 감당하는가? | 4 |
| Q6 | llm-d 캐시 최적화가 비용 차이를 뒤집을 만큼 효과적인가? | 3, 5 |
| Q7 | 버스트 트래픽에서 AgentCore 응답성은? | 8 |
| Q8 | 멀티 테넌트 환경에서 AgentCore 격리 수준은 충분한가? | 5 |

---

## 테스트 환경

```
Region: us-east-1

Baseline (AgentCore 기본 모델):
  - Bedrock Claude 3.5 Sonnet (온디맨드 + 프로비저닝)
  - Bedrock Llama 3.1 70B (온디맨드)
  - AgentCore Agent Runtime + MCP 커넥터
  - Bedrock Guardrails, CloudWatch

Baseline+ (AgentCore 커스텀 모델):
  - Llama 3.1 70B 파인튜닝 모델 → Custom Model Import
  - 동일 AgentCore 런타임

대안 A (EKS + vLLM):
  - EKS v1.32, Karpenter v1.2
  - g5.2xlarge (A10G) x 4, vLLM v0.7.x
  - Llama 3.1 70B (AWQ 4bit)
  - LiteLLM v1.60+ → kgateway (RoundRobin)
  - Langfuse + Prometheus

대안 B (EKS + vLLM + llm-d):
  - 대안 A + llm-d v0.3+

부하 생성: Locust + LLMPerf
```

---

## 테스트 시나리오

### 시나리오 1: 단순 추론 — AgentCore 기본 성능

- 매번 다른 프롬프트, 입력 500 / 출력 1000 토큰
- 동시성: 1, 10, 50, 100, 200
- 대상: Baseline (기본 모델)
- **검증**: AgentCore TTFT, TPS가 프로덕션 SLA를 충족하는가?

### 시나리오 2: Custom Model Import vs vLLM 직접 서빙

- 동일 모델(Llama 3.1 70B)을 Baseline+ vs 대안 A에서 서빙
- 입력 500 / 출력 1000 토큰, 동시성: 1, 10, 50, 100
- 측정: TTFT, TPS, E2E Latency
- **검증**: Custom Import의 성능 차이와 제약사항
  - 양자화 옵션 비교 (Import 지원 범위 vs vLLM AWQ/GPTQ/FP8)
  - 배치 사이즈 / 동시 처리 제어 가능 여부
  - 모델 업데이트 소요 시간 (Import 재배포 vs vLLM 롤링 업데이트)

### 시나리오 3: 반복 시스템 프롬프트 — 캐싱 효과

- 시스템 프롬프트 3종 (각 2000토큰) 고정 + 유저 입력만 변경
- 동시성: 10, 50, 100
- 대상: Baseline (프롬프트 캐싱) vs 대안 A vs 대안 B (llm-d)
- **검증**: Bedrock 프롬프트 캐싱 vs llm-d 프리픽스 캐싱, TTFT/비용 비교

### 시나리오 4: 멀티턴 에이전트 워크플로우

- 5턴 대화 + 3회 도구 호출 (웹 검색, DB 조회, 계산)
- AgentCore: Agent Runtime + MCP 커넥터
- EKS: LangGraph + MCP 서버
- **검증**: AgentCore Agent Runtime 복잡 워크플로우 처리 능력, 커스터마이징 한계

### 시나리오 5: 멀티 테넌트

- 테넌트 5개, 각각 다른 시스템 프롬프트/가드레일 정책
- AgentCore: IAM 기반 격리
- EKS: 네임스페이스 + llm-d 테넌트별 캐시 라우팅
- **검증**: AgentCore 격리 수준 vs EKS, llm-d 테넌트별 캐시 효과

### 시나리오 6: 손익분기점 탐색

- 일정 부하 단계적 증가: 1, 5, 10, 30, 50, 100 req/s
- 각 단계에서 4개 구성 월간 비용 산출
- **검증**: 정확한 비용 교차점 도출

### 시나리오 7: 장시간 운영 (24h)

- 30 req/s, 24시간 유지
- 총 비용, 안정성(에러율), 성능 편차
- **검증**: AgentCore 비용 예측 가능성 vs EKS GPU 유휴 비용

### 시나리오 8: 버스트 트래픽

- 평상시 10 req/s → 5분간 100 req/s → 다시 10 req/s
- **검증**: AgentCore 스로틀링/큐잉 동작 vs EKS Karpenter 스케일 아웃 지연

---

## 측정 메트릭

| 카테고리 | 메트릭 | Baseline | Baseline+ | 대안 A | 대안 B |
|----------|--------|:--------:|:---------:|:------:|:------:|
| **성능** | TTFT (p50/p95/p99) | O | O | O | O |
| | TPS (출력 토큰/초) | O | O | O | O |
| | E2E Latency | O | O | O | O |
| | Throughput (req/s) | O | O | O | O |
| | Cold Start | O | O | O | O |
| **캐싱** | Bedrock 프롬프트 캐싱 절감률 | O | O | - | - |
| | KV Cache Hit Rate | - | - | - | O |
| **비용** | 월간 총비용 (트래픽별) | O | O | O | O |
| | 토큰당 실효 비용 | O | O | O | O |
| | 유휴 비용 | - | - | O | O |
| **모델** | 양자화 옵션 | O | O | O | O |
| | 모델 업데이트 소요 시간 | O | O | O | O |
| | 배치/스케줄링 제어 수준 | O | O | O | O |
| **운영** | 구축 시간 | O | O | O | O |
| | 장애 복구 시간 | O | O | O | O |
| | 필요 인력/스킬셋 | O | O | O | O |

---

## 비용 시뮬레이션

### 고정 비용 (월간)

| 항목 | Baseline | Baseline+ | 대안 A | 대안 B |
|------|:--------:|:---------:|:------:|:------:|
| GPU 인스턴스 (g5.2xlarge x4) | - | - | ~$4,800 | ~$4,800 |
| EKS 클러스터 | - | - | $73 | $73 |
| llm-d (CPU Pod) | - | - | - | ~$50 |
| Bedrock 프로비저닝 | 별도 산정 | 별도 산정 | - | - |

### 변동 비용

| 항목 | Baseline | Baseline+ | 대안 A | 대안 B |
|------|----------|-----------|--------|--------|
| 과금 방식 | 토큰당 | 토큰당 | GPU 시간 배분 | GPU 시간 배분 |
| 캐시 절감 | 프롬프트 캐싱 할인 | 프롬프트 캐싱 할인 | 없음 | KV 캐시 히트 → GPU 절감 |
| 유휴 비용 | 없음 (온디맨드) | 없음 (온디맨드) | GPU 유휴 시 과금 | GPU 유휴 시 과금 |

### 예상 비용 곡선

```
월간 비용
  ↑
  |  AgentCore 온디맨드 (기본/커스텀)
  |          \
  |           \                    / 대안 A (EKS+vLLM)
  |            \                  /
  |             \                /   대안 B (EKS+llm-d)
  |              \              /   /
  |    AgentCore  \            /   /
  |    프로비저닝   \          /   /
  |                 \        /   /
  |                  \      /   /
  |                   X    /  <-- 손익분기점
  |                  / \  /
  |  EKS 고정비용 --/---\/------------
  |               /
  +-------------------------------------> 트래픽 (req/s)
       5    10    30    50    100
```

| 트래픽 구간 | 추천 | 이유 |
|------------|------|------|
| 손익분기점 이하 | **AgentCore 온디맨드** | GPU 고정비 없음, 즉시 시작 |
| 손익분기점 부근 | **AgentCore 프로비저닝** | 할인된 처리량, 여전히 매니지드 |
| 손익분기점 이상 + 다양한 프롬프트 | **대안 A** | 토큰당 비용 역전 |
| 손익분기점 이상 + 반복 프롬프트 | **대안 B** | 캐시 효과로 추가 절감 |

---

## 의사결정 플로차트

```mermaid
flowchart TD
    Start["AgentCore로 시작"] --> Q1{"필요 모델이\nBedrock에 있는가?"}
    Q1 -->|Yes| Baseline["AgentCore 기본 모델"]
    Q1 -->|No| Q2{"Custom Model Import로\n가능한가?"}
    Q2 -->|Yes| BaselinePlus["AgentCore 커스텀 모델"]
    Q2 -->|"No\n(추론 엔진 커스터마이징,\n지원 외 양자화 등)"| Q3{"월 트래픽이\n손익분기점 이하?"}
    Q3 -->|Yes| Hybrid["AgentCore +\n외부 엔드포인트 연결"]
    Q3 -->|No| Q4{"프롬프트 반복\n패턴이 높은가?"}
    Q4 -->|Yes| AltB["대안 B\nEKS + vLLM + llm-d"]
    Q4 -->|No| AltA["대안 A\nEKS + vLLM"]

    style Start fill:#232F3E,color:#fff
    style Baseline fill:#FF9900,color:#fff
    style BaselinePlus fill:#FF9900,color:#fff
    style Hybrid fill:#FF9900,color:#fff
    style AltA fill:#3B48CC,color:#fff
    style AltB fill:#3B48CC,color:#fff
```

---

## EKS 자체 구축이 정당화되는 조건

:::warning AgentCore로 충분하지 않은 경우에만 자체 구축을 검토
아래 조건 중 하나 이상에 해당할 때 EKS 자체 구축이 정당화됩니다.
:::

| 조건 | 이유 |
|------|------|
| 추론 엔진 세밀 제어 | vLLM 스케줄링, 배치 전략, 양자화(AWQ/GPTQ/FP8) 자유 선택 |
| 대규모 트래픽 비용 최적화 | 손익분기점 이상에서 토큰당 비용 역전 |
| KV 캐시 라우팅 | llm-d 프리픽스 캐시로 TTFT/GPU 효율 극대화 |
| 최신 모델 즉시 적용 | Bedrock Import 전 커뮤니티 최신 모델 사용 |
| 데이터 주권 / 에어갭 | Bedrock API 호출 자체가 불가한 환경 |

---

## 결과 리포트 구성 (예정)

| 섹션 | 내용 |
|------|------|
| Executive Summary | "AgentCore로 충분한 경우"와 "자체 구축이 필요한 경우" 명확 구분 |
| AgentCore 기본 성능 | 기본 모델 TTFT, TPS, Throughput 기준치 |
| Custom Import vs vLLM | 동일 모델 성능/비용/제약 비교 |
| 캐싱 전략 비교 | Bedrock 프롬프트 캐싱 vs llm-d 프리픽스 캐싱 |
| 에이전트 런타임 비교 | AgentCore Runtime vs LangGraph 기능/유연성 |
| 비용 손익분기 | 트래픽 구간별 4개 구성 비용 그래프 + 교차점 |
| 의사결정 가이드 | 워크로드 특성 → 최적 구성 플로차트 |
| 마이그레이션 경로 | AgentCore → EKS 전환 시 작업과 리스크 |
