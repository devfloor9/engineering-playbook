---
title: ADR — Self-Improving Agent Loop 도입 의사결정
description: Self-Improving Agent Loop(자가학습 강화 파이프라인)를 실 운영에 도입하기 전 합의해야 할 원칙·스코프·책임·롤백 경계를 정리한 Architecture Decision Record
created: "2026-04-19"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 14
tags:
  - adr
  - self-improving
  - autoresearch
  - governance
  - agentic-ai
  - scope:design
sidebar_label: "ADR: Self-Improving Loop"
sidebar_position: 99
---

- **상태**: Proposed (실 운영 착수 전 합의 필요)
- **관련 문서**
  - 설계: [Self-Improving Agent Loop](./self-improving-agent-loop.md)
  - 구현: [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md)
  - 운영: [Cascade Routing Tuning](../../model-serving/inference-routing/cascade-routing-tuning.md)

---

## Architecture Decision Record 개요

Architecture Decision Record(ADR)는 아키텍처 수준의 중요한 의사결정을 **맥락(Context)·결정(Decision)·결과(Consequences)** 3요소로 고정하는 경량 기록 형식입니다. Michael Nygard가 2011년 블로그 포스트 "Documenting Architecture Decisions"에서 제안한 템플릿을 원형으로 하며, 이후 [MADR](https://adr.github.io/madr/), [adr-tools](https://github.com/npryce/adr-tools), [arc42](https://docs.arc42.org/) 등 다양한 변종이 업계 표준으로 정착했습니다.

### 작성 목적

- **결정 이력 보존** — "왜 그 시점에 이 구조를 택했는가"를 코드 리포지토리와 함께 버전 관리합니다. 위키·Slack 메모 대비 장기 보존성이 높고, 코드 변경과 결정 변경이 함께 추적됩니다.
- **이해관계자 합의 통로** — `Proposed` 상태의 ADR은 플랫폼·보안·FinOps·컴플라이언스 팀이 공통 문서를 놓고 회람·리뷰하는 경량 RFC 역할을 합니다.
- **재검토·롤백 근거** — 결정 당시 전제가 무너졌을 때, 해당 ADR의 Context 섹션이 "무엇을 재평가해야 하는가"의 기준점이 됩니다.

### 일반 구조 (Nygard 원형)

| 섹션 | 역할 |
|------|------|
| Title | 한 줄 결정 요약 (예: "Self-Improving Loop 도입 원칙") |
| Status | `Proposed` / `Accepted` / `Deprecated` / `Superseded by <새 ADR>` |
| Context | 결정이 필요해진 배경·제약·관련 사실 |
| Decision | 합의된 선택 — 단일 결정 또는 Decision Points 다건 |
| Consequences | 결정의 긍정적·부정적 영향, trade-off, 후속 액션 |

### 본 플랫폼의 ADR 규약

1. **위치** — `design-architecture/advanced-patterns/` 또는 도메인별 서브카테고리 하위에 배치합니다.
2. **파일명** — `adr-<주제>.md` 형식을 사용합니다 (예: `adr-self-improving-loop.md`, `adr-knowledge-feature-store.md`).
3. **frontmatter 태그** — `adr`, `scope:design` 필수 포함. 그 외 기술 스택·도메인 태그 보강.
4. **Status 전이** — `Proposed → Accepted → (Deprecated 또는 Superseded)`. 전이 시 `last_update.date` 갱신.
5. **불변성** — Accepted 이후 결정 본문은 수정하지 않습니다. 반대 결정은 **새 ADR을 작성**해 기존 ADR을 `Superseded by <새 ADR 경로>` 로 표시합니다.
6. **리뷰 절차** — Proposed 단계에서 최소 DRI 1인 + 관련 팀 리드 1인의 회람 승인 기록을 PR 코멘트로 남깁니다.

### 본 ADR의 위치

본 문서는 [Self-Improving Agent Loop 설계](./self-improving-agent-loop.md) 의 **운영 원칙**을 고정하기 위한 ADR입니다. 설계 문서가 "기술적으로 무엇이 가능한가(autoresearch 루프의 기술 구조)"를 서술한다면, 본 ADR은 그 중 "**무엇을 어떤 경계로** 도입할 것인가(자동화 범위·책임·롤백 기준)"를 합의합니다. 구현 스펙은 [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md) 에서 다룹니다.

---

## Context

Phase 3 문서 개편에서 Andrej Karpathy의 autoresearch 담론을 엔터프라이즈 환경에 매핑한 두 편의 문서가 추가되었습니다. 설계(`self-improving-agent-loop.md`)와 구현(`continuous-training/`)은 draft 상태이며, 내부 리뷰 전에 다음과 같은 **운영 원칙 합의**가 선행되어야 합니다.

자동화된 학습 루프는 기술적으로 매력적이지만, 엔터프라이즈 환경에서 Reward hacking·데이터 유출·거버넌스 공백으로 인한 손실이 이득을 초과할 위험이 큽니다. 본 ADR은 "무엇을 자동화하고 어디를 끊을지"를 합의하기 위한 회의 자료입니다.

---

## Decision Points (합의 대상)

### 1. 스코프 고정 — self-hosted 오픈웨이트 모델 전용 (초기 소형 모델 파일럿) {#1-스코프-고정--self-hosted-slm-전용}

- 본 루프는 **Qwen3 / Llama 4 / GLM-5** 등 self-hosted 오픈웨이트 모델 전용입니다. 이들은 "소형 모델(SLM)"이 아닙니다. 예를 들어 Llama 4 Scout는 활성 17B·전체 109B, Maverick는 활성 17B·전체 400B 파라미터의 MoE 모델입니다([Llama 4 model card](https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md), 2026-10-13 확인). 따라서 본 루프의 적용 **대상**은 오픈웨이트 전반이지만, 운영 **초기 파일럿**은 Qwen3-4B 같은 소형 모델부터 시작합니다(Decision Point 7 참조).
- 관리형 폐쇄 모델(OpenAI GPT-4.1, Google Gemini 2.5, Anthropic Claude 등)은 스코프에서 제외합니다. 다만 **Amazon Bedrock AgentCore는 모델이 아니라 모델에 무관한 에이전트 런타임(호스팅 환경)**이므로([Bedrock AgentCore Runtime 문서](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html), 2026-10-13 확인), "AgentCore Claude/Nova"처럼 런타임과 모델 엔드포인트를 하나로 묶어 부르지 않습니다. 제외 기준은 "weight에 접근할 수 없는 관리형 모델 공급자"입니다.
- Ragas/LLM-judge 평가는 공유 자원을 사용하더라도, **weight 업데이트가 일어나는 대상 모델**은 self-hosted 오픈웨이트 모델로 한정합니다.

**근거**: 폐쇄 모델은 weight 접근이 불가능하고 공급자 ToS 위반 가능성이 있습니다. 따라서 루프를 적용하지 않고 프롬프트/라우팅 튜닝으로 대체합니다. 반대로 오픈웨이트 모델은 weight에 접근할 수 있으나, 뒤의 Decision Point 5·6에서 서술하듯 모델 라이선스·데이터 권리 검토 의무는 그대로 남습니다.

### 2. 루프 자동화 경계 — 5 stage 중 3 stage만 자동화

| Stage | 자동화 여부 | 사람 개입 |
|-------|-----|----------|
| 1. Rollout (trace 수집) | ✅ 자동 | — |
| 2. Score (Reward labeling) | ✅ 자동 | 주간 1–2% 샘플 수동 검증 |
| 3. Filter (데이터 큐레이션) | ✅ 자동 | PII 스캐너 통과 강제 |
| 4. Train (GRPO/DPO/RLAIF) | ⚠ **수동 트리거** | 배포 엔지니어 승인 필수 |
| 5. Deploy (Canary) | ⚠ **수동 승인 + Canary** | 10% → 50% → 100% 단계별 게이트 |

**근거**: Train/Deploy까지 무인 자동화할 경우 reward hacking 가능성과 롤백 비용이 급증합니다. Train은 최소 주간 cadence의 수동 Job trigger로 시작합니다.

### 3. Reward 모델 책임자 지정

- Reward 모델 정책(LLM-judge 프롬프트, Ragas 가중치, 유저 피드백 weight) 변경은 **단일 책임자(DRI)** 를 지정합니다.
- 변경 시 PR 리뷰 + 과거 30일 trace에 대한 backtest 결과 첨부가 필수입니다.
- **Decision owner**: 플랫폼 MLOps 리드 (TBD)

**근거**: Reward signal이 학습 전체 방향을 결정합니다. 무분별한 weight 조정은 silent drift의 근원입니다.

### 4. 데이터 거버넌스 — 4-gate 통과 의무화

학습 데이터로 승격되는 trace는 다음 4개 게이트를 순서대로 통과해야 합니다.

1. **PII 게이트** — Presidio/Comprehend로 개인정보를 탐지·마스킹하고, 탐지에 실패한 trace는 폐기합니다. 단, 스캐너 통과는 "탐지 재현율이 검증된 범위 안에서만" 비식별화 근거가 됩니다. **Amazon Comprehend의 PII 탐지는 영어·스페인어 텍스트만 지원하므로**([Comprehend PII 문서](https://docs.aws.amazon.com/comprehend/latest/dg/how-pii.html), 2026-10-13 확인), 한국어 등 그 외 언어의 PII 탐지를 Comprehend만으로 보장한다고 간주하지 않습니다. 대상 언어·엔터티별 탐지 재현율을 별도로 측정한 뒤 적용 범위를 명시합니다.
2. **Consent 게이트** — 수집 동의 없는 trace는 학습 데이터에서 제외합니다 (`consent=true` 태그 필수). 다만 수집 동의 태그만으로는 **학습(2차 이용) 권한**이 자동으로 성립하지 않습니다. 각 trace에는 "어떤 목적으로 어떤 처리에 사용할 수 있는지"를 나타내는 목적 한정 권한 출처(provenance)를 함께 기록하고, 학습 이용이 그 범위에 포함되는지 확인합니다.
3. **지역 게이트** — 본 게이트는 "규제 지역(EU GDPR, KR PIPA 등)에서 수집한 trace는 해당 지역 데이터 경계 내 학습 Job만 사용한다"는 **본 조직이 제안하는 데이터 레지던시 정책**입니다. GDPR·PIPA가 모든 학습을 지역 내에 가둘 것을 그 자체로 요구하는 것은 아닙니다. 역외 이전이 필요한 경우 적정성 결정·표준계약조항(SCC) 등 적용 가능한 적법 이전 근거를 법무 검토로 확인한 뒤 예외를 허용합니다([EDPB 국제 데이터 이전 가이드](https://www.edpb.europa.eu/sme-data-protection-guide/international-data-transfers_en), 2026-10-13 확인).
4. **기밀 분류 게이트** — 고객 기밀/내부 전용 trace는 사내 전용 모델에만 반영합니다.

**근거**: 컴플라이언스 팀 사전 검토 없이 trace를 학습에 사용하면 재학습 레벨의 데이터 삭제 요청 시 비용이 폭증합니다.

### 5. 비용 가드레일

- **월간 GPU-hour 상한**: 환경별로 사전 승인한 **예산 상한(approved budget)**으로 지정합니다. 이는 미래 가격을 보장하는 수치가 아니라 "이 한도를 넘기면 자동 승인 없이 Train Job을 띄우지 못한다"는 운영 한도입니다. 기본 제안값은 **1,000 GPU-hour/월**이며, 금액 환산은 다음 전제에서만 유효합니다.
  - 단위 환산: 1,000 GPU-hour × (해당 리전·시점의 p5en.48xlarge Spot GPU당 단가). p5en.48xlarge는 1 인스턴스에 GPU 8개이므로 인스턴스-시간 단가를 쓸 경우 8로 나누어 GPU-hour 단가로 환산합니다.
  - Spot 가격은 리전·날짜·수요에 따라 변동하므로, 금액 상한을 명시할 때는 **조회 리전·조회 날짜·구매 옵션(Spot/On-Demand)·인스턴스 타입**을 반드시 함께 기록합니다. 조직은 배포 리전의 현재 [EC2 Spot 가격](https://aws.amazon.com/ec2/spot/pricing/)을 조회해 상한 금액을 확정합니다.
  - 위 수치와 영어 문서의 금액 상한(≈$15K)은 산출 전제가 달라 서로 다릅니다. 금액 상한은 **각 조직이 자신의 리전·시점 가격으로 재계산해 확정**해야 하며, 본 문서는 특정 달러 금액을 보장하지 않습니다. (KO/EN 금액 불일치는 작성자가 확정 가격을 결정한 뒤 양쪽 문서를 함께 갱신해야 하는 미해결 항목입니다.)
- **품질 하락 시 자동 중단**: Canary 배포 후 Ragas faithfulness 5%p 하락 또는 misroute rate 10%p 상승 시 자동 롤백합니다.
- 상한 초과 예정 시 FinOps 리뷰 없이 Train Job 스케줄링이 불가능합니다.

**근거**: GRPO 한 iteration의 소요 시간은 모델 크기·batch size·generation 수·시퀀스 길이에 따라 달라집니다([TRL GRPOTrainer 문서](https://huggingface.co/docs/trl/grpo_trainer), 2026-10-13 확인). "수 시간"이라는 수치는 특정 모델·배치 설정을 명시한 측정값이 아니라 운영 가정이므로, 실제 상한은 대상 모델에서 측정한 iteration 소요 시간으로 재조정합니다. 상한을 두는 취지는 무제한 자동화 시 예산 통제가 불가능해지는 것을 막는 것입니다.

### 6. 롤백 경계 — 어느 버전까지 즉시 복귀 가능해야 하는가

- **모델 버전**: 롤백을 위해 최근 3세대 weight을 registry에 보관하는 것을 **기본 롤백 정책으로 제안**합니다. 다만 "삭제 금지"는 무조건이 아닙니다. 모델이 침해(compromise)되었거나, 라이선스가 해지·변경되었거나(예: [Llama 4 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama4/LICENSE)의 이용 조건·Acceptable Use Policy 위반 소지), 보안상 폐기(revocation)가 필요한 경우에는 **승인된 대체 버전을 확보한 뒤** 해당 weight을 삭제·격리할 수 있습니다.
- **Reward 모델 버전**: 최근 5회분을 유지하는 것을 제안합니다.
- **라우터 classifier 버전**: 최근 10회분을 유지하는 것을 제안합니다.
- Canary 실패 시 이전 세대로의 복귀 시간을 Game day로 주기적으로 측정합니다. 복귀 시간은 registry에 버전이 존재한다는 사실만으로 보장되지 않으며, **weight 로드·워밍업(모델 적재, KV 캐시·컴파일 워밍업)까지 포함한 실제 서비스 복구 시점**으로 측정합니다. **5분 내 자동 복귀**는 측정으로 검증·조정해야 할 목표값이며, 측정 전까지는 확정 보장값으로 서술하지 않습니다.

**근거**: 자가 학습 루프에서 가장 흔한 실패 모드는 "어제는 좋았는데 오늘은 나빠졌다" 패턴입니다. 빠른 복귀 경로가 없으면 운영 리스크가 과도합니다.

### 7. 조직 경계 — 단일 팀 pilot → 플랫폼 확대

- Phase 1 (0–3개월): **Classifier v7 / 라우터**만 자가학습 대상입니다. 단일 팀 pilot.
- Phase 2 (3–6개월): 특정 self-hosted SLM 하나(Qwen3-4B)로 확장합니다.
- Phase 3 (6개월+): GLM-5 등 대형 모델로 확장 여부를 재검토합니다. **별도 ADR 필요**.

**근거**: 기술적으로 가능한 것과 조직이 운영 가능한 것은 다릅니다. 초기 스코프를 작게 잡고 게임 데이터를 쌓은 후 확장합니다.

---

## Consequences

### 긍정적
- 루프 도입 범위·속도·책임이 명시되어 예측 가능성이 올라갑니다.
- 폐쇄 모델을 제외하므로 weight에 접근할 수 없는 공급자 API 의존에서 벗어납니다. 다만 이것이 공급자 계약 리스크를 전부 없앤다는 뜻은 아닙니다. 오픈웨이트 모델도 모델 라이선스(예: Llama 4 Community License의 이용 조건·Acceptable Use Policy)와 학습 데이터 권리 검토 의무는 그대로 남으므로, 이 검토는 계속 수행합니다.
- 3-stage 자동화로 돌발 사고 시 피해 반경이 축소됩니다.

### 부정적 / Trade-off
- Train/Deploy 수동 승인으로 "완전 자동 autoresearch"의 속도 이점 일부를 희생합니다.
- 4-gate 데이터 게이트가 초기 데이터 수집량을 크게 줄여 학습 속도가 저하될 수 있습니다.
- 단일 DRI 모델은 담당자 이탈 시 운영 단절 위험이 있어 백업 DRI 지정이 필요합니다.

### 다음 액션

- [ ] 본 ADR Draft를 관련 리드들에게 회람합니다 (MLOps / Security / FinOps / 컴플라이언스).
- [ ] Reward 모델 DRI를 지정합니다 (플랫폼 팀 내부 논의).
- [ ] 4-gate 데이터 파이프라인 설계 작업을 생성합니다 → `continuous-training/trace-to-dataset.md` § Stage 3 보강.
- [ ] Game day 롤백 시나리오를 작성합니다 → `cascade-routing-tuning.md` § Canary 롤아웃 보강.
- [ ] 합의 후 상태를 **Proposed → Accepted** 로 갱신합니다.

---

## 참고 자료

### 공식 문서
- [Kubernetes Canary Deployment](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#canary-deployment) — 점진적 롤아웃 표준
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry.html) — 모델 버전 관리 레퍼런스
- [MADR (Markdown ADR)](https://adr.github.io/madr/) — ADR 템플릿 최신 스펙
- [adr-tools](https://github.com/npryce/adr-tools) — ADR 생성·관리 CLI

### 논문 / 기술 블로그
- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — ADR 원형 제안 (2011)
- [Andrej Karpathy — autoresearch (2026년 3월)](https://github.com/karpathy/autoresearch) — 자율 ML 연구 루프 프로젝트. AI 에이전트가 단일 GPU nanochat 훈련 설정에서 train.py를 수정하며 5분 훈련 실험을 반복해 검증 지표를 개선하는 자가 학습 루프 시스템
- [LMSYS RouteLLM](https://lmsys.org/blog/2024-07-01-routellm/) — Cascade routing classifier 설계
- [Langfuse OTel](https://langfuse.com/docs/opentelemetry) — Production trace standard
- [ThoughtWorks Technology Radar — Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records) — ADR 업계 도입 사례

### 관련 문서 (내부)
- [Self-Improving Agent Loop 설계](./self-improving-agent-loop.md) — 5-Stage Loop 상세 아키텍처
- [Continuous Training Pipeline 구현](../../reference-architecture/model-lifecycle/continuous-training/index.md) — 실제 파이프라인 스펙
- [Cascade Routing Tuning 운영](../../model-serving/inference-routing/cascade-routing-tuning.md) — Canary 운영 가이드
