---
title: "ADR — Self-Improving Agent Loop 도입 의사결정"
sidebar_label: "ADR: Self-Improving Loop"
description: "Self-Improving Agent Loop(자가학습 강화 파이프라인)를 실 운영에 도입하기 전 합의해야 할 원칙·스코프·책임·롤백 경계를 정리한 Architecture Decision Record"
created: 2026-04-19
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 18
tags:
  - adr
  - self-improving
  - autosearch
  - governance
  - agentic-ai
  - scope:design
sidebar_position: 99
---

- **상태**: Proposed (실 운영 착수 전 합의 필요)
- **작성일**: 2026-04-19
- **관련 문서**
  - 설계: [Self-Improving Agent Loop](./self-improving-agent-loop.md)
  - 구현: [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md)
  - 운영: [Cascade Routing Tuning](../../reference-architecture/inference-gateway/cascade-routing-tuning.md)

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

본 문서는 [Self-Improving Agent Loop 설계](./self-improving-agent-loop.md) 의 **운영 원칙**을 고정하기 위한 ADR입니다. 설계 문서가 "기술적으로 무엇이 가능한가(autosearch 루프의 기술 구조)"를 서술한다면, 본 ADR은 그 중 "**무엇을 어떤 경계로** 도입할 것인가(자동화 범위·책임·롤백 기준)"를 합의합니다. 구현 스펙은 [Continuous Training Pipeline](../../reference-architecture/model-lifecycle/continuous-training/index.md) 에서 다룹니다.

---

## Context

Phase 3 문서 개편에서 Andrej Karpathy의 autosearch 담론을 엔터프라이즈 환경에 매핑한 두 편의 문서가 추가되었다. 설계(`self-improving-agent-loop.md`)와 구현(`continuous-training/`)은 draft 상태이며, 내부 리뷰 전에 다음과 같은 **운영 원칙 합의**가 선행되어야 한다.

자동화된 학습 루프는 기술적으로 매력적이지만, 엔터프라이즈 환경에서 Reward hacking·데이터 유출·거버넌스 공백으로 인한 손실이 이득을 초과할 위험이 크다. 본 ADR은 "무엇을 자동화하고 어디를 끊을지"를 합의하기 위한 회의 자료이다.

---

## Decision Points (합의 대상)

### 1. 스코프 고정 — self-hosted SLM 전용

- 본 루프는 **Qwen3 / Llama 4 / GLM-5** 등 self-hosted 오픈웨이트 모델 전용이다.
- Bedrock AgentCore Claude/Nova 등 관리형 폐쇄 모델, OpenAI GPT-4.1, Gemini 2.5는 스코프 제외.
- Ragas/LLM-judge 평가는 공유 자원을 사용하더라도, **weight 업데이트가 일어나는 대상 모델**은 self-hosted로 한정한다.

**근거**: 폐쇄 모델은 weight 접근 불가 + 공급자 ToS 위반 가능성이 있다. 루프 적용이 아니라 프롬프트/라우팅 튜닝으로 대체한다.

### 2. 루프 자동화 경계 — 5 stage 중 3 stage만 자동화

| Stage | 자동화 여부 | 사람 개입 |
|-------|-----|----------|
| 1. Rollout (trace 수집) | ✅ 자동 | — |
| 2. Score (Reward labeling) | ✅ 자동 | 주간 1–2% 샘플 수동 검증 |
| 3. Filter (데이터 큐레이션) | ✅ 자동 | PII 스캐너 통과 강제 |
| 4. Train (GRPO/DPO/RLAIF) | ⚠ **수동 트리거** | 배포 엔지니어 승인 필수 |
| 5. Deploy (Canary) | ⚠ **수동 승인 + Canary** | 10% → 50% → 100% 단계별 게이트 |

**근거**: Train/Deploy까지 무인 자동화할 경우 reward hacking 가능성과 롤백 비용이 급증한다. Train은 최소 주간 cadence의 수동 Job trigger로 시작한다.

### 3. Reward 모델 책임자 지정

- Reward 모델 정책(LLM-judge 프롬프트, Ragas 가중치, 유저 피드백 weight) 변경은 **단일 책임자(DRI)** 를 지정한다.
- 변경 시 PR 리뷰 + 과거 30일 trace에 대한 backtest 결과 첨부가 필수이다.
- **Decision owner**: 플랫폼 MLOps 리드 (TBD)

**근거**: Reward signal이 학습 전체 방향을 결정한다. 무분별한 weight 조정은 silent drift의 근원이다.

### 4. 데이터 거버넌스 — 4-gate 통과 의무화

학습 데이터로 승격되는 trace는 다음 4개 게이트를 순서대로 통과해야 한다.

1. **PII 게이트** — Presidio/Comprehend로 개인정보 마스킹. 실패 trace는 폐기한다.
2. **Consent 게이트** — 수집 동의 없는 trace는 학습 데이터에서 제외한다 (`consent=true` 태그 필수).
3. **지역 게이트** — 규제 지역(EU GDPR, KR PIPA) trace는 해당 지역 데이터 경계 내 학습 Job만 사용한다.
4. **기밀 분류 게이트** — 고객 기밀/내부 전용 trace는 사내 전용 모델에만 반영한다.

**근거**: 컴플라이언스 팀 사전 검토 없이 trace를 학습에 사용하면 재학습 레벨의 데이터 삭제 요청 시 비용이 폭증한다.

### 5. 비용 가드레일

- **월간 GPU-hour 상한**: 환경별로 사전 지정한다 (기본 제안: 1,000 GPU-hour/월 on p5en Spot, 약 $15K 상한).
- **퀄리티 하락 시 자동 중단**: Canary 배포 후 Ragas faithfulness 5%p 하락 또는 misroute rate 10%p 상승 시 자동 롤백한다.
- 상한 초과 예정 시 FinOps 리뷰 없이 Train Job 스케줄링이 불가하다.

**근거**: GRPO 한 iteration이 수 시간 단위 GPU를 요구한다. 무제한 자동화는 예산 관리 불가하다.

### 6. 롤백 경계 — 어느 버전까지 즉시 복귀 가능해야 하는가

- **모델 버전**: 최근 3세대 weight을 registry에 보관한다 (삭제 금지).
- **Reward 모델 버전**: 최근 5회분을 유지한다.
- **라우터 classifier 버전**: 최근 10회분을 유지한다.
- Canary 실패 시 이전 세대로 **5분 내 자동 복귀** 검증을 Game day로 주기적으로 실시한다.

**근거**: 자가 학습 루프에서 가장 흔한 실패 모드는 "어제는 좋았는데 오늘은 나빠졌다" 패턴이다. 빠른 복귀 경로가 없으면 운영 리스크가 과도하다.

### 7. 조직 경계 — 단일 팀 pilot → 플랫폼 확대

- Phase 1 (0–3개월): **Classifier v7 / 라우터**만 자가학습 대상이다. 단일 팀 pilot.
- Phase 2 (3–6개월): 특정 self-hosted SLM 하나(Qwen3-4B)로 확장한다.
- Phase 3 (6개월+): GLM-5 등 대형 모델로 확장 여부를 재검토한다. **별도 ADR 필요**.

**근거**: 기술적으로 가능한 것과 조직이 운영 가능한 것은 다르다. 초기 스코프를 작게 잡고 게임 데이터를 쌓은 후 확장한다.

---

## Consequences

### 긍정적
- 루프 도입 범위·속도·책임이 명시되어 예측 가능성이 올라간다.
- 폐쇄 모델은 제외하므로 공급자 계약 리스크를 회피한다.
- 3-stage 자동화로 돌발 사고 시 피해 반경이 축소된다.

### 부정적 / Trade-off
- Train/Deploy 수동 승인으로 "완전 자동 autosearch"의 속도 이점 일부를 희생한다.
- 4-gate 데이터 게이트가 초기 데이터 수집량을 크게 줄여 학습 속도가 저하될 수 있다.
- 단일 DRI 모델은 담당자 이탈 시 운영 단절 위험이 있어 백업 DRI 지정이 필요하다.

### 다음 액션

- [ ] 본 ADR Draft를 관련 리드들에게 회람한다 (MLOps / Security / FinOps / 컴플라이언스).
- [ ] Reward 모델 DRI를 지정한다 (플랫폼 팀 내부 논의).
- [ ] 4-gate 데이터 파이프라인 설계 작업을 생성한다 → `continuous-training/trace-to-dataset.md` § Stage 3 보강.
- [ ] Game day 롤백 시나리오를 작성한다 → `cascade-routing-tuning.md` § Canary 롤아웃 보강.
- [ ] 합의 후 상태를 **Proposed → Accepted** 로 갱신한다.

---

## 참고 자료

### 공식 문서
- [Kubernetes Canary Deployment](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#canary-deployment) — 점진적 롤아웃 표준
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry.html) — 모델 버전 관리 레퍼런스
- [MADR (Markdown ADR)](https://adr.github.io/madr/) — ADR 템플릿 최신 스펙
- [adr-tools](https://github.com/npryce/adr-tools) — ADR 생성·관리 CLI

### 논문 / 기술 블로그
- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — ADR 원형 제안 (2011)
- Andrej Karpathy — "LLMs doing autosearch" (2026 Q1 담론)
- [LMSYS RouteLLM](https://lmsys.org/blog/2024-07-01-routellm/) — Cascade routing classifier 설계
- [Langfuse OTel](https://langfuse.com/docs/opentelemetry) — Production trace standard
- [ThoughtWorks Technology Radar — Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records) — ADR 업계 도입 사례

### 관련 문서 (내부)
- [Self-Improving Agent Loop 설계](./self-improving-agent-loop.md) — 5-Stage Loop 상세 아키텍처
- [Continuous Training Pipeline 구현](../../reference-architecture/model-lifecycle/continuous-training/index.md) — 실제 파이프라인 스펙
- [Cascade Routing Tuning 운영](../../reference-architecture/inference-gateway/cascade-routing-tuning.md) — Canary 운영 가이드
