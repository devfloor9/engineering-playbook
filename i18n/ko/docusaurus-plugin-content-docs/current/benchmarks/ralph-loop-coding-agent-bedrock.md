---
title: "Foundation Model별 토큰 비용 비교: 코딩 에이전트 랄프 루프로 실측한 Amazon Bedrock 14개 모델"
description: RealWorld 백엔드 구현 과제를 랄프 루프로 Amazon Bedrock us-east-1의 14개 모델에서 5회씩 실행하고, 완주 여부와 토큰·비용·LLM 요청 수를 비교한 실측 보고서
created: "2026-10-13"
last_update:
  date: 2026-10-30
  author: YoungJoon Jeong
reading_time: 39
tags:
  - benchmark
  - bedrock
  - coding-agent
  - ralph-loop
  - llm
  - cost
  - agentic-ai
  - scope:tech
sidebar_label: "Report 9. Foundation Model별 토큰 비용 비교 [실측]"
sidebar_position: 9
category: benchmark
---

import {RalphKpiStrip, RalphModelComparison, RalphCostTimeScatter, RalphMetricMatrix, RalphModelCards, RalphMethodFlow, RalphLineupMap, RalphTokenMix, RalphRoleSplit, RalphGroupCompare, RalphPriceLadder} from '@site/src/components/RalphLoopBenchmark';
import DataTableFrame from '@site/src/components/DataTableFrame';

:::info 참고한 벤치마크
이 벤치마크는 로보코(Roboco) 정도현님의 [랄프 루프 모델별 완주 비교](https://roboco.io/coding-agent-benchmark/) 리포트를 참고해 만들었습니다.
:::

:::info 측정 상태
**실측 완료** — Amazon Bedrock us-east-1에서 14개 모델을 5회씩, 모두 70개 run을 실행했고 그중 69개가 완주했습니다. Claude Fable 5.1을 뺀 13개 모델은 2026-10-12 22:28 ~ 2026-10-13 00:18 UTC에 실행했습니다. Claude Fable 5.1은 계정의 데이터 보존 설정을 바꾼 뒤 2026-10-13 04:36 ~ 05:21 UTC에 따로 실행했습니다.
수치는 모두 실행 기록에서 스크립트로 생성했습니다. 값의 근거는 [사실](직접 실행·조회), [계산](토큰 × 단가처럼 정해진 규칙), [추정](가정 포함), [출처](근거 자료)로 표시했고, 확인되지 않은 값은 "확인 불가"로 적었습니다.
:::

**시리즈:** [전체 안내](./ralph-loop-series.md) · **1편: Bedrock** · [2편: EKS 기준선 — 계획](./ralph-loop-coding-agent-eks.md) · [3편: EKS 추론 최적화 — 계획](./ralph-loop-inference-optimization.md).
공개된 이 데이터에는 아래 14개 모델의 과거 결과만 있습니다. Terra 후속 실행과 EKS 단계의 검증된 결과는 아직 포함하지 않았습니다.

<RalphKpiStrip />

## 개요

이 보고서는 AI 코딩 에이전트가 같은 백엔드 구현 과제를 끝까지 완성하는 데 모델마다 토큰, 비용, LLM 요청이 얼마나 드는지를 Amazon Bedrock에서 직접 측정한 결과입니다. **랄프 루프(Ralph loop)** 는 같은 프롬프트를 새 에이전트 세션에 반복해서 주는 실행 방식으로, 반복과 반복 사이에는 저장소(파일과 git 이력)만 남습니다. 모든 모델을 같은 하네스(pi coding agent)와 같은 API(Bedrock Converse)로 실행했으므로, 여기서 보이는 차이는 같은 실행 조건에서의 모델 간 차이입니다.

## 요약

- **완주** [사실]: 70개 run 중 69개가 완주했습니다. 미완주는 GLM 5.3 4회차입니다. 모든 모델의 랄프 반복 중앙값은 1회입니다.
- **비용은 모델에 따라 크게 다릅니다** [계산]: run당 비용 중앙값은 GPT-6 Luna $0.027부터 GPT-6 Astra $3.495까지 약 130배 차이가 납니다.
- **그룹보다 모델 차이가 큽니다** [계산]: 중국 오픈웨이트 그룹의 대표값($1.621)은 프론티어($0.831)의 약 2.0배였지만, 프론티어 안에서의 차이는 약 130배였습니다.
- **캐시 읽기가 비용의 큰 몫입니다** [계산]: 완주한 run 토큰의 94%가 캐시 읽기였습니다. 캐시 읽기는 단가가 낮아도 양이 많아, 모델에 따라 run 비용의 상당 부분이 여기서 나왔습니다.
- **실행 비용** [계산]: 모두 $106.02입니다(집계에 쓴 실행 $88.42 + 폐기한 1차 실행 $17.60). 실제 청구액이 아닙니다.

**GPT-6 Astra도 포함되어 있습니다.** 기록된 ID는 `us.openai.gpt-6-astra`입니다. 5/5회를 모두 랄프 반복 1회에 완주했고, 비용 중앙값은 **$3.4954**, 시간 중앙값은 **7.883분**입니다. 이 과제의 14개 모델 중 비용 중앙값이 가장 높았다는 뜻이며, 일반적인 코딩 품질을 평가한 결과가 아닙니다. [Astra 상세 결과](#astra-historical-result), [전체 실측 모델](#모델별-결과), [근거 확인 범위](#model-evidence-coverage)를 확인하세요.

### 모델별 근거 확인 범위 {#model-evidence-coverage}

범위 검토일은 **2026-10-30**입니다. "재확인 안 함"은 이번 변경에서 날짜와 정확한 버전이 맞는 공식 평가나 현재 Bedrock 단가를 확인하지 않았다는 뜻입니다. 공개 자료가 없다는 뜻은 아닙니다. [적용 단가](#적용-단가-출처)는 과거 스냅샷이며, 오늘의 단가가 아닙니다. 모든 제공사와 서비스 등급에 같은 기준을 적용합니다.

<DataTableFrame minWidth="60rem">

| 모델 | 기록된 / 계획 ID | 로컬 측정 | 공개 평가 | 현재 Bedrock 단가 |
|---|---|---|---|---|
| Claude Opus 5.5 | `us.anthropic.claude-opus-5-5` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| Claude Sonnet 5.5 | `us.anthropic.claude-sonnet-5-5` | 5/5 완주 | 제공사 보고서 확인; 아래 조건 참조 | 재확인 안 함 |
| Claude Haiku 5.5 | `us.anthropic.claude-haiku-5-5` | 5/5 완주 | 제공사 보고서 확인; 아래 조건 참조 | 재확인 안 함 |
| Claude Fable 5.1 | `us.anthropic.claude-fable-5-1` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| Claude Opus 5 | `us.anthropic.claude-opus-5` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| Claude Sonnet 5 | `us.anthropic.claude-sonnet-5` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| Claude Opus 4.8 | `us.anthropic.claude-opus-4-8` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| GPT-6.1 Sol | `us.openai.gpt-6.1-sol` | 5/5 완주 | 모델 문서 확인; 같은 과제 평가 대기 | Standard US CRIS 확인; 아래 참조 |
| GPT-6 Astra | `us.openai.gpt-6-astra` | 5/5 완주 | 시스템 카드 확인; 아래 검토 범위 참조 | Standard US CRIS 확인; 아래 참조 |
| GPT-6 Sol | `us.openai.gpt-6-sol` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| GPT-6 Luna | `us.openai.gpt-6-luna` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| GPT-5.6 Sol | `us.openai.gpt-5.6-sol` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| Kimi K3 | `us.moonshotai.kimi-k3` | 5/5 완주 | 재확인 안 함 | 재확인 안 함 |
| GLM 5.3 | `us.zai.glm-5.3` | 4/5 완주 | 재확인 안 함 | 재확인 안 함 |
| GPT-6.1 Terra | `us.openai.gpt-6.1-terra` (후속 대상) | 검증된 배치 없음 | 시스템 카드 부록 확인; 아래 검토 범위 참조 | Standard US CRIS 확인; 아래 참조 |

</DataTableFrame>

공개 제공사 평가, 과거 RealWorld 실측, 토큰 단가 계산은 다른 근거입니다. 이 표에 모델을 추가해도 차트에 점을 추가하지 않습니다. 새 평가나 단가를 넣을 때는 정확한 모델·버전, 공식 출처, 확인일과 벤치마크·하네스 또는 리전·라우팅·등급·컨텍스트·캐시 조건이 필요합니다. Sol의 서비스 등급이 다르다고 모델이 추가되는 것은 아닙니다.

### 확인한 공식 출처 범위 {#verified-primary-sources}

아래 출처는 **2026-10-30**에 읽었습니다. 평가 출처를 찾았다고 시스템 카드 전체를 감사하거나 결과를 재현한 것은 아닙니다. 제공사 점수는 Ralph 차트에 넣지 않습니다.

| 모델 | 공식 출처 | 확인 범위 / 비교 한계 |
|---|---|---|
| GPT-6 Astra | [OpenAI 시스템 카드](https://deploymentsafety.openai.com/gpt-6-astra) | 2026-09-03 게시; 안전·정렬 평가의 일부 범위를 검토했습니다. 같은 RealWorld 과제 실행이 아닙니다. |
| GPT-6.1 Terra | [OpenAI 시스템 카드 부록](https://deploymentsafety.openai.com/gpt-6-1-terra) | 2026-10-26 게시; 연구·API 평가는 프롬프트·도구·effort가 다를 수 있습니다. 이전 모델 비교값은 나중의 revision일 수 있습니다. |
| Claude Sonnet 5.5 | [Anthropic 제공사 보고서](https://www.anthropic.com/claude-sonnet-5-5) | 2026-09-28 게시; Terminal-Bench 4.0 등 평가가 있습니다. effort와 사전 배포 주의가 있으며, 이번 확인에서 Ralph 실행기와 동등성을 검증하지 않았습니다. |
| Claude Haiku 5.5 | [Anthropic 제공사 보고서](https://www.anthropic.com/claude-haiku-5-5) | 2026-10-07 게시; Terminal-Bench 4.0, OSWorld 2.1 오프라인 하위 집합 등이 있습니다. 다른 과제이며 Ralph와 실행기·effort 동등성을 확인하지 않았습니다. |

OpenAI 공식 API 모델 문서도 [Astra](https://developers.openai.com/api/docs/models/gpt-6-astra), [Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra), [Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol)에 대해 읽었습니다. 해당 이름의 API 모델과 단가 문서가 있다는 근거이며, 비교 가능한 RealWorld 점수의 근거는 아닙니다. OpenAI 자체 API 단가를 Bedrock 단가로 대신 사용하지 않습니다.

[Terra 소개 페이지](https://openai.com/index/introducing-gpt-6-1-terra/)는 이번 확인에서 브라우저 확인 화면과 HTTP 403을 반환했습니다. 읽지 못한 본문은 근거로 쓰지 않았습니다. 접근 가능한 모델 카드와 시스템 카드 부록은 따로 확인한 출처입니다. 다른 모델의 현재 단가와 같은 과제의 공개 평가는 모델군이나 등급에서 추정하지 않고 미확인으로 둡니다.

### 현재 문서에 적힌 Bedrock 단가 {#current-bedrock-prices}

공식 모델 카드별 확인일은 **2026-10-30**입니다. **Standard**, 상용 **미국 지리적 교차 리전 추론**, `bedrock-runtime`, 출발 리전 `us-east-1`, **입력 272,000토큰 이하** 조건입니다. 단위는 **100만 토큰당 USD**입니다. 미국 추가 요금은 이미 포함되어 있습니다. 캐시 쓰기는 **30분 보존** 행입니다.

<DataTableFrame minWidth="55rem">

| 모델 | 미국 추론 프로필 | 입력 | 캐시 쓰기 | 캐시 읽기 | 출력 | 공식 출처 |
|---|---|---|---|---|---|---|
| GPT-6 Astra | `us.openai.gpt-6-astra` | $11.00 | $13.75 | $1.10 | $55.00 | [Bedrock 모델 카드](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-astra.html) |
| GPT-6.1 Terra | `us.openai.gpt-6.1-terra` | $1.10 | $1.375 | $0.055 | $5.50 | [Bedrock 모델 카드](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-1-terra.html) |
| GPT-6.1 Sol | `us.openai.gpt-6.1-sol` | $2.20 | $2.75 | $0.11 | $11.00 | [Bedrock 모델 카드](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-1-sol.html) |

</DataTableFrame>

이 카드들에서는 입력이 272,000토큰을 넘으면 전체 요청에 장문 단가를 적용합니다. 입력·캐시 단가는 2배, 출력 단가는 1.5배입니다. 다른 라우팅과 서비스 등급은 별도 행이 필요합니다. 이 날짜별 단가 표는 과거 run·비용·캐시 기록·순위를 바꾸지 않습니다. 새 벤치마크 배치나 확인된 청구액도 아닙니다. 이번 문서 확인에서는 계정 접근, 실제 라우팅과 캐시 동작을 실행하지 않았습니다.

## 측정 방식

<RalphMethodFlow />

- **pi 번들 수정 1곳**: pi 0.87.1은 Claude Haiku 5.5에 맞지 않는 thinking 형식을 보내 Bedrock이 요청을 거부합니다. 그래서 pi 번들의 모델 이름 목록 두 곳에 `haiku-5`를 추가했고, 다른 모델의 요청에는 영향이 없습니다.
- **사고(thinking) 설정**: medium으로 두었습니다. Claude 모델에는 adaptive thinking(effort=medium)으로 전달되고, 다른 모델에는 pi가 reasoning 필드를 보내지 않아 모델 기본값이 적용됩니다.

<details>
<summary>지표 정의</summary>

- **완주**: 공식 채점을 통과한 run입니다. 중앙값과 최소·최대는 완주한 run만으로 계산합니다.
- **토큰** [사실]: Bedrock이 응답마다 보고한 사용량을 빌더·검증자의 모든 요청에 걸쳐 더한 값입니다. 입력은 캐시가 적용되지 않은 입력 토큰이고, 출력에는 추론 토큰이 포함됩니다. 캐시 읽기와 캐시 쓰기는 따로 셉니다.
- **비용** [계산]: 토큰 수에 "적용 단가"의 단가를 곱한 값입니다. 캐시 쓰기는 5분 캐시 단가로 계산했습니다. pi가 캐시 유지 시간을 지정하지 않으면 Bedrock 기본값이 5분이기 때문입니다.
- **랄프 반복**: 빌더가 실행된 반복 횟수입니다.
- **LLM 요청**: 모델이 돌려준 응답 수로, 모델 수준의 "턴"에 해당합니다. 빌더와 검증자를 합친 값입니다.
- **run 시간**: run 시작부터 끝까지의 시간으로 빌더·검증자 세션과 채점을 포함합니다.

</details>

## 비교 대상 모델

<RalphLineupMap />

- **오픈웨이트 확인** [출처]: Kimi K3와 GLM 5.3의 Bedrock 모델 카드는 두 모델을 각각 "open-weight model", "open weight text generation model"이라고 적고 있습니다.
- **Claude Fable 5.1** [사실]: 계정의 us-east-1 데이터 보존 모드가 `aws_review` 이상이어야 호출됩니다. 계정 소유자가 `inherit`에서 `aws_review`로 바꾼 뒤(2026-10-13 04:25:43 UTC) 실행했습니다.

- **측정 범위** [출처]: Amazon Bedrock us-east-1에서 호출할 수 있는 텍스트 생성 모델 중 14개를 측정했습니다. Bedrock에는 이 밖에도 Claude Fable 5·Claude Opus 4.7·GPT-5.6 Terra·gpt-oss-120b·Grok 4.7·DeepSeek V3.2·Qwen3 Coder Next·MiniMax M2.5·Kimi K2.5·GLM 5 등의 텍스트 생성 모델이 있지만 이번 측정에는 포함하지 않았습니다([Bedrock 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/models-region-compatibility.html) 2026-10-14 기준).

<details>
<summary>데이터 보존 설정이 미치는 영향</summary>

[Bedrock 사용자 가이드: Data retention](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)(2026-10-13 확인) 기준입니다 [출처].

- 콘솔 화면 없이 API로 설정합니다. 예: `aws bedrock put-account-data-retention --region us-east-1 --mode aws_review`. 되돌릴 때는 `--mode inherit`로 다시 설정합니다.
- 이 계정이 해당 리전에서 보내는 모든 bedrock-runtime 요청에 적용됩니다.
- Fable 5·5.1 요청의 프롬프트와 출력은 AWS 경계 안에 최대 30일 보관되고, AWS가 사람 검토를 할 수 있습니다. 모델 제공사와는 공유되지 않습니다.
- 다른 모델은 각 모델이 허용하는 모드를 따릅니다. 보관 안 함(`none`)을 허용하는 모델의 요청은 이 설정을 켜도 보관되지 않습니다.
- 교차 리전 추론으로 호출하면 보관 데이터는 요청이 실제로 처리된 리전에 저장됩니다.

</details>

## 결과

### 모델 비교

패널마다 지표 하나를 기준으로 완주한 run의 중앙값을 좋은 순서대로 정렬했습니다. 세 지표 모두 값이 작을수록 좋습니다.

<RalphModelComparison />

### 비용과 시간

점 하나가 모델 하나입니다. 가로는 run당 비용 중앙값(로그 눈금), 세로는 run 시간 중앙값이며, 왼쪽 아래에 있을수록 싸고 빠릅니다. 테두리가 있는 점과 이를 잇는 점선은 파레토 경계로, 이 모델들보다 싸면서 동시에 빠른 모델은 없습니다. 점을 가리키거나 포커스하면 5회 실행의 범위가 표시됩니다.

<RalphCostTimeScatter />

### 모델별 결과

지표를 바꿔 가며 5회 실행의 범위(막대)와 중앙값(세로선)을 비교할 수 있고, 행을 펼치면 run별 값이 나옵니다. 아래 표는 같은 값을 숫자로 정리한 것입니다. 값은 완주한 run의 중앙값이고 괄호 안은 최소–최대이며, 비용은 [계산], 나머지는 [사실]입니다.

<RalphMetricMatrix />

**표 1. 모델별 완주·비용·토큰·요청·시간 (완주 run 중앙값)**

<DataTableFrame minWidth="60rem">

| 그룹 | 모델 | 완주 | run당 비용(USD) | 출력 토큰 | 전체 토큰 | LLM 요청 | 랄프 반복 | run 시간(분) |
|---|---|---|---|---|---|---|---|---|
| 프론티어 | Claude Opus 5.5 | 5/5 | $0.907 ($0.861–$1.054) | 20,667 (20,402–23,773) | 796,558 (631,889–1,088,484) | 35 (30–45) | 1 | 6.1 (5.7–8.0) |
| 프론티어 | Claude Sonnet 5.5 | 5/5 | $0.306 ($0.257–$0.328) | 14,161 (12,677–14,407) | 445,388 (226,794–603,161) | 25 (23–27) | 1–2 | 3.8 (3.4–4.1) |
| 프론티어 | Claude Haiku 5.5 | 5/5 | $0.065 ($0.046–$0.084) | 52,713 (42,838–67,557) | 2,156,808 (1,155,347–2,727,358) | 50 (39–77) | 1–2 | 7.4 (6.2–9.9) |
| 프론티어 | Claude Fable 5.1 | 5/5 | $2.566 ($2.118–$2.837) | 26,693 (22,047–29,187) | 1,183,739 (787,229–1,564,029) | 44 (36–58) | 1 | 8.9 (6.9–10.9) |
| 프론티어 | Claude Opus 5 | 5/5 | $1.999 ($1.635–$3.726) | 28,503 (24,165–40,478) | 1,555,721 (1,138,625–3,851,983) | 57 (50–91) | 1 | 8.4 (6.8–14.0) |
| 프론티어 | Claude Sonnet 5 | 5/5 | $1.179 ($1.128–$1.455) | 32,142 (31,074–36,492) | 3,059,198 (2,787,977–4,019,069) | 85 (77–102) | 1 | 9.7 (8.1–11.4) |
| 프론티어 | Claude Opus 4.8 | 5/5 | $2.018 ($1.859–$2.678) | 23,804 (22,316–29,333) | 1,873,275 (1,675,909–2,735,633) | 60 (56–75) | 1 | 7.2 (6.6–9.6) |
| 프론티어 | GPT-6.1 Sol | 5/5 | $0.527 ($0.457–$0.559) | 20,621 (18,490–22,847) | 1,164,468 (1,096,209–1,385,667) | 46 (44–53) | 1 | 8.1 (6.5–8.8) |
| 프론티어 | GPT-6 Astra | 5/5 | $3.495 ($3.102–$3.562) | 22,221 (21,151–23,685) | 1,325,517 (1,139,606–1,479,623) | 48 (46–55) | 1 | 7.9 (7.3–8.8) |
| 프론티어 | GPT-6 Sol | 5/5 | $0.291 ($0.258–$0.358) | 8,544 (7,967–9,605) | 564,091 (432,181–818,653) | 36 (32–51) | 1 | 3.1 (2.5–3.3) |
| 프론티어 | GPT-6 Luna | 5/5 | $0.027 ($0.024–$0.066) | 14,272 (13,818–45,643) | 1,057,982 (848,865–1,979,669) | 50 (43–113) | 1–3 | 4.2 (4.0–15.7) |
| 프론티어 | GPT-5.6 Sol | 5/5 | $0.755 ($0.667–$0.908) | 12,032 (10,223–12,787) | 584,537 (505,256–775,728) | 31 (27–34) | 1 | 4.1 (3.4–5.8) |
| 중국 오픈웨이트 | Kimi K3 | 5/5 | $1.422 ($1.154–$1.640) | 39,505 (32,640–47,056) | 1,658,186 (1,276,997–1,856,453) | 61 (57–65) | 1 | 10.5 (8.2–12.0) |
| 중국 오픈웨이트 | GLM 5.3 | 4/5 | $1.821 ($1.402–$2.062) | 59,582 (48,793–77,914) | 3,766,802 (2,876,201–4,364,926) | 80 (73–89) | 1 | 10.1 (8.2–15.0) |

</DataTableFrame>

#### Astra 과거 결과 {#astra-historical-result}

`gpt6astra` 기록 5개는 펼칠 수 있는 모델 행과 원본 데이터에 그대로 있습니다. 모두 `status: done`, `iterations: 1`입니다. 비용 중앙값은 $3.4954, 시간 중앙값은 7.883분입니다. 단가 스냅샷, run ID, 토큰 수와 다른 모델은 바꾸지 않았습니다.

### 실패 비용을 포함한 완주당 비용 {#failure-inclusive-cost}

**표 3. 모든 시도 비용 ÷ 완주 수**

기록된 시도 5개의 비용 합계를 해당 모델의 완주 수로 나눕니다. 실패한 시도의 비용도 포함합니다. 이 값은 비율이며, 표 1의 완주 run 중앙값과 다릅니다. 과거 데이터의 반올림된 run별 비용을 사용했고, 폐기한 1차 실행과 사전 확인은 이 표에서 제외합니다. 완주가 0회면 값은 0이 아니라 정의할 수 없음입니다.

<DataTableFrame minWidth="40rem">

| 모델 | 시도 | 완주 | 전체 시도 비용(USD) | 완주당 비용(USD) |
|---|---|---|---|---|
| Claude Opus 5.5 | 5 | 5 | $4.7279 | $0.9456 |
| Claude Sonnet 5.5 | 5 | 5 | $1.5158 | $0.3032 |
| Claude Haiku 5.5 | 5 | 5 | $0.3237 | $0.0647 |
| Claude Fable 5.1 | 5 | 5 | $12.8723 | $2.5745 |
| Claude Opus 5 | 5 | 5 | $11.4937 | $2.2987 |
| Claude Sonnet 5 | 5 | 5 | $6.3291 | $1.2658 |
| Claude Opus 4.8 | 5 | 5 | $10.6600 | $2.1320 |
| GPT-6.1 Sol | 5 | 5 | $2.5741 | $0.5148 |
| GPT-6 Astra | 5 | 5 | $16.8230 | $3.3646 |
| GPT-6 Sol | 5 | 5 | $1.5152 | $0.3030 |
| GPT-6 Luna | 5 | 5 | $0.1714 | $0.0343 |
| GPT-5.6 Sol | 5 | 5 | $3.8570 | $0.7714 |
| Kimi K3 | 5 | 5 | $7.0211 | $1.4042 |
| GLM 5.3 | 5 | 4 | $8.5371 | $2.1343 |

</DataTableFrame>

### 토큰과 비용 구성

<RalphTokenMix />

- 출력 토큰은 모든 모델에서 전체 토큰의 3% 이하였지만 단가가 가장 높아, 여러 모델에서 비용의 가장 큰 몫이었습니다. 캐시 읽기는 단가가 낮아도 양이 많아 비용의 상당 부분을 차지했고, GLM 5.3은 run 비용의 약 68%가 캐시 읽기였습니다 [계산].

### 빌더와 검증자의 분담

<RalphRoleSplit />

- 검증자 비용은 run 비용의 약 4%(GLM 5.3)에서 25%(GPT-6 Luna)였습니다 [계산]. 랄프 반복이 대부분 1회로 끝나서, 빌더가 검증자의 REVIEW.md를 실제로 읽은 run은 반복이 2회 이상이었던 4개뿐입니다 [사실].

### 그룹 비교

<RalphGroupCompare />

### 모델별 개요

개발사나 모델명으로 검색해 최대 3개 모델을 골라 나란히 비교합니다. 항목마다 선택한 모델 중 가장 좋은 값에 표시가 붙습니다.

<RalphModelCards />

### 해석

- **단가가 1차 요인입니다.** 입력·출력 단가가 $0.11/$0.55인 GPT-6 Luna, Claude Haiku 5.5 모델은 전체 토큰을 1,057,982개, 2,156,808개 썼는데도 run당 비용이 $0.027, $0.065였습니다.
- **같은 단가 등급에서는 사용량이 갈랐습니다.** Claude Sonnet 5와 Sonnet 5.5는 입력·출력 단가가 같지만($2.2/$11), Sonnet 5는 LLM 요청 85회로 Sonnet 5.5의 25회보다 많았고 비용은 약 3.9배였습니다.
- **단가와 사용량이 겹치면 차이가 커집니다.** Claude Opus 4.8은 Opus 5.5보다 단가가 높고(입력·출력 $5.5/$27.5 대 $4.4/$22) 요청도 많아(60회 대 35회) 비용이 약 2.2배였습니다.
- **5회 실행의 편차는 대체로 작았습니다.** 12개 모델은 5회 중 최대 비용이 중앙값의 1.35배 이내였습니다. 예외는 Claude Opus 5 3회차(약 1.9배), GPT-6 Luna 3회차(약 2.5배)입니다.
- **이 비교는 Bedrock 단가 기준입니다.** 오픈웨이트 모델을 직접 호스팅할 때의 비용은 다루지 않았습니다.
- **이상 사례**: 미완주 1건, 멈춤 감지 후 완주 1건, 자기 종료 세션 3건, 일시적인 Bedrock 스트림 오류 2건이 있었습니다. 자세한 경위는 아래에 접어 두었습니다.

<details>
<summary>이상 사례 상세</summary>

- **미완주, GLM 5.3 4회차**: 첫 번째 반복에서 빌더가 테스트용 node 서버를 포그라운드로 띄운 채 멈췄고, 300초 멈춤 감지로 종료됐습니다. 두 번째 반복은 20분 상한에 걸려 `.ralph-done`을 만들기 전에 끝났습니다. 상한 직후 채점에서 저장소는 13개 파일을 모두 통과했지만, 완주 규칙(`.ralph-done` + 13개 파일 통과)에 따라 미완주로 집계했습니다.
- **멈춤 감지, GPT-6 Luna 3회차**: 첫 번째 반복에서 빌더가 `npm run dev`를 포그라운드로 실행해 세션이 멈췄고, 300초 멈춤 감지로 종료됐습니다. 두 번째 반복 뒤 채점은 13개 파일 중 5개만 통과했고, 세 번째 반복에서 완주했습니다.
- **자기 종료 세션(Claude Sonnet 5.5 빌더, Claude Opus 4.8 검증자, GLM 5.3 검증자)**: 에이전트가 자기 프로세스까지 종료해 exit 143으로 끝난 세션입니다. 이 중 Claude Sonnet 5.5 5회차만 반복이 1회 늘었습니다.
- **Bedrock 스트림 오류(Kimi K3 3회차 2번)**: "Bedrock stream ended without a stop reason" 오류였고, pi가 자동으로 다시 요청해 완주에는 영향이 없었습니다.

</details>

## 적용 단가 [출처]

<RalphPriceLadder />

- **Anthropic**: [Amazon Bedrock 요금 페이지](https://aws.amazon.com/bedrock/pricing/)의 "Geo and In-region Cross-region Inference" 표입니다. 이 페이지가 쓰는 요금 데이터(2026-10-12T08:40:08Z 게시)에서 US East (N. Virginia) 값을 읽었습니다.
- **OpenAI**: Bedrock 모델 카드의 표준 단가(입력 272K 토큰 이하) 표에서 US 교차 리전 추론 행을 따랐습니다. 요청 하나의 컨텍스트는 최대 94,172 토큰이었으므로 장문 단가는 해당하지 않습니다 [사실].
- **Kimi K3, GLM 5.3**: 각각 Bedrock 모델 카드와 요금 페이지의 표입니다. Kimi K3의 캐시 쓰기는 공개된 유일한 값인 30분 캐시 단가를 썼습니다.
- Anthropic·OpenAI 모델의 미국 교차 리전 단가는 글로벌 교차 리전 단가보다 10% 높습니다. 공개 Price List API의 us-east-1 데이터(2026-10-10 게시본)에는 이 모델들의 항목이 없었습니다.

## 실행 비용 [계산]

**표 2. 집계·폐기 실행별 비용 (보고 토큰 × 단가)**

| 구분 | 비용(보고 토큰 × 단가) | 설명 |
|---|---|---|
| 집계에 쓴 실행 | $88.42 | 격리 컨테이너에서 실행한 70개 run 전체(완주·미완주 포함). Claude Fable 5.1 5회 $12.87 포함 |
| 폐기한 1차 실행 | $17.60 | 에이전트를 호스트에서 직접 실행해 run 간 간섭 가능성이 있어 집계에서 뺀 실행 |
| 합계 | $106.02 | 모델별 사전 확인 호출(모델당 1~2회)은 소액이라 넣지 않았습니다 |

이 금액은 보고된 토큰 수에 단가를 곱한 계산값입니다. 실제 청구액은 AWS Cost Explorer에서 확인해야 하며, AWS Marketplace로 청구되는 모델은 청구서에 각 제공사 항목으로 표시됩니다.

## 한계와 해석 주의

1. **과제 하나, 모델당 5회입니다.** 순위는 이 과제와 이 구성에서 관측한 결과입니다. 같은 모델에서도 가장 비싼 run이 가장 싼 run의 최대 약 2.7배(GPT-6 Luna)였습니다.
2. **빌더와 검증자 2-에이전트 구성입니다.** 모든 모델을 pi와 Bedrock Converse에서 빌더+검증자로 실행했습니다. 그래서 토큰과 비용에는 검증자 몫이 포함됩니다.
3. **1차 실행은 폐기했습니다.** 컨테이너 없이 호스트에서 동시에 실행했더니 에이전트가 `pkill -f`, `fuser -k` 같은 호스트 전체 명령으로 다른 run의 서버를 멈출 수 있었습니다. 그래서 격리 컨테이너로 다시 실행했습니다.
4. **검증자가 서버 포트를 완주 기준보다 엄격하게 봤습니다.** 검증자 프롬프트의 `PORT` 환경 변수 요구는 완주 기준에 없으며, 완주 판정에는 영향이 없습니다.
5. **자기 종료 세션(exit 143)이 있었습니다.** pi는 프롬프트를 명령줄 인자로 받기 때문에, 에이전트가 프롬프트 안의 문구로 `pkill -f`를 실행하면 자기 자신도 종료됩니다. 비교를 위해 실행 도중 프롬프트는 바꾸지 않았습니다.
6. **검증자의 효과는 판단할 수 없습니다(확인 불가).** 검증자 없는 비교군이 없습니다.
7. **그룹 2는 모델이 2개입니다.** 그룹 대표값의 신뢰도가 낮습니다.
8. **Kimi K3의 캐시 동작이 모델 카드 설명과 달랐습니다.** Converse 호출에서도 캐시 토큰이 보고됐고, 보고된 그대로 계산했습니다. 적용 방식은 확인하지 못했습니다(확인 불가).
9. **실행 시점이 다릅니다.** Claude Fable 5.1은 다른 모델보다 약 4시간 18분 뒤에 단독으로 실행했고, 이것이 run 시간에 준 영향은 측정하지 않았습니다 [추정].
10. **비용은 2026-10-12 단가로 계산한 값입니다.** 단가가 바뀌면 결과도 달라집니다.

## 재현 정보

- **도구 버전**: pi coding agent 0.87.1(Haiku 5.5용 수정 1곳), hurl 8.0.1, Node 22.23.3, Docker 이미지 기반 Amazon Linux 2023
- **설정값**: 사고 설정 medium, 영어 프롬프트, 반복 상한 30회, run 시간 상한 1,200초, 멈춤 감지 300초, 모델당 5회
- **프롬프트**: 빌더는 `PROMPT-en.md`를 그대로 썼고, 검증자 프롬프트는 이 보고서에서 새로 썼습니다.
- **run별 수치**: "모델별 결과" 차트에서 모델 행을 펼치면 5회 각각의 값이 나옵니다. 같은 값이 이 저장소의 `src/data/ralph-loop-bedrock.json`(`runs` 항목)에 있습니다.
- **하네스 스크립트와 원 데이터**(세션 기록, run별 지표, 집계 파일)는 이 저장소에 포함하지 않았습니다. 과제·빌더 프롬프트·채점용 Hurl 테스트는 [공개 저장소](https://github.com/roboco-io/coding-agent-benchmark)에 있습니다.

## 참고 자료

- 로보코(Roboco) 정도현, [랄프 루프 모델별 완주 비교](https://roboco.io/coding-agent-benchmark/) (참고한 리포트, 2026-10-14 05:27 UTC 확인)
- [roboco-io/coding-agent-benchmark](https://github.com/roboco-io/coding-agent-benchmark) (과제, 빌더 프롬프트, 채점용 Hurl 테스트)
- [Amazon Bedrock 요금](https://aws.amazon.com/bedrock/pricing/)
- [Amazon Bedrock 사용자 가이드: Data retention](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
- [RealWorld 백엔드 API 명세](https://realworld-docs.netlify.app/specifications/backend/endpoints/)
- [pi coding agent](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
