---
title: "ADR — Self-Improving Agent Loop 도입 의사결정"
sidebar_label: "ADR: Self-Improving Loop"
description: "Self-Improving Agent Loop(자가학습 강화 파이프라인)를 실 운영에 도입하기 전 합의해야 할 원칙·스코프·책임·롤백 경계를 정리한 Architecture Decision Record"
tags: [adr, self-improving, autosearch, governance, 'scope:design']
sidebar_position: 99
last_update:
  date: 2026-04-19
  author: devfloor9
---

# ADR — Self-Improving Agent Loop 도입 의사결정

- **상태**: Proposed (실 운영 착수 전 합의 필요)
- **작성일**: 2026-04-19
- **관련 문서**
  - 설계: [design-architecture/self-improving-agent-loop](../design-architecture/self-improving-agent-loop.md)
  - 구현: [reference-architecture/continuous-training-pipeline](../reference-architecture/continuous-training-pipeline.md)
  - 운영: [reference-architecture/cascade-routing-tuning](../reference-architecture/cascade-routing-tuning.md)
- **관련 메모리**: Phase 3 한국어 문서 개편 완료 (2026-04-19)

---

## Context

Phase 3 문서 개편에서 Andrej Karpathy의 autosearch 담론을 엔터프라이즈 환경에 매핑한 두 편의 문서를 추가했다. 설계(`self-improving-agent-loop.md`)와 구현(`continuous-training-pipeline.md`)은 draft 상태이며, 내부 리뷰 전에 다음과 같은 **운영 원칙 합의**가 선행돼야 한다.

자동화된 학습 루프는 기술적으로 매력적이지만, 엔터프라이즈 환경에서 Reward hacking·데이터 유출·거버넌스 공백으로 인한 손실이 이득을 초과할 위험이 크다. 본 ADR은 "무엇을 자동화하고 어디를 끊을지"를 합의하기 위한 회의 자료이다.

---

## Decision Points (합의 대상)

### 1. 스코프 고정 — self-hosted SLM 전용

- 본 루프는 **Qwen3 / Llama 4 / GLM-5** 등 self-hosted 오픈웨이트 모델 전용이다.
- Bedrock AgentCore Claude/Nova 등 관리형 폐쇄 모델, OpenAI GPT-4.1, Gemini 2.5는 스코프 제외.
- Ragas/LLM-judge 평가는 공유 자원을 사용하더라도, **weight 업데이트가 일어나는 대상 모델**은 self-hosted로 한정.

**근거**: 폐쇄 모델은 weight 접근 불가 + 공급자 ToS 위반 가능. 루프 적용이 아니라 프롬프트/라우팅 튜닝으로 대체.

### 2. 루프 자동화 경계 — 5 stage 중 3 stage만 자동화

| Stage | 자동화 여부 | 사람 개입 |
|-------|-----|----------|
| 1. Rollout (trace 수집) | ✅ 자동 | — |
| 2. Score (Reward labeling) | ✅ 자동 | 주간 1–2% 샘플 수동 검증 |
| 3. Filter (데이터 큐레이션) | ✅ 자동 | PII 스캐너 통과 강제 |
| 4. Train (GRPO/DPO/RLAIF) | ⚠ **수동 트리거** | 배포 엔지니어 승인 필수 |
| 5. Deploy (Canary) | ⚠ **수동 승인 + Canary** | 10% → 50% → 100% 단계별 게이트 |

**근거**: Train/Deploy까지 무인 자동화할 경우 reward hacking 가능성과 롤백 비용이 급증. Train은 최소 주간 cadence의 수동 Job trigger로 시작.

### 3. Reward 모델 책임자 지정

- Reward 모델 정책(LLM-judge 프롬프트, Ragas 가중치, 유저 피드백 weight) 변경은 **단일 책임자(DRI)** 를 지정한다.
- 변경 시 PR 리뷰 + 과거 30일 trace에 대한 backtest 결과 첨부 필수.
- **Decision owner**: 플랫폼 MLOps 리드 (TBD)

**근거**: Reward signal이 학습 전체 방향을 결정. 무분별한 weight 조정은 silent drift의 근원.

### 4. 데이터 거버넌스 — 4-gate 통과 의무화

학습 데이터로 승격되는 trace는 다음 4개 게이트를 순서대로 통과해야 한다.

1. **PII 게이트** — Presidio/Comprehend로 개인정보 마스킹. 실패 trace는 폐기.
2. **Consent 게이트** — 수집 동의 없는 trace는 학습 데이터 제외 (`consent=true` 태그 필수).
3. **지역 게이트** — 규제 지역(EU GDPR, KR PIPA) trace는 해당 지역 데이터 경계 내 학습 Job만 사용.
4. **기밀 분류 게이트** — 고객 기밀/내부 전용 trace는 사내 전용 모델에만 반영.

**근거**: 컴플라이언스 팀 사전 검토 없이 trace를 학습에 사용하면 재학습 레벨의 데이터 삭제 요청 시 비용 폭증.

### 5. 비용 가드레일

- **월간 GPU-hour 상한**: 환경별로 사전 지정 (기본 제안: 1,000 GPU-hour/월 on p5en Spot, 약 $15K 상한).
- **퀄리티 하락 시 자동 중단**: Canary 배포 후 Ragas faithfulness 5%p 하락 또는 misroute rate 10%p 상승 시 자동 롤백.
- 상한 초과 예정 시 FinOps 리뷰 없이 Train Job 스케줄링 불가.

**근거**: GRPO 한 iteration이 수 시간 단위 GPU를 요구. 무제한 자동화는 예산 관리 불가.

### 6. 롤백 경계 — 어느 버전까지 즉시 복귀 가능해야 하는가

- **모델 버전**: 최근 3세대 weight을 registry에 보관 (삭제 금지).
- **Reward 모델 버전**: 최근 5회분 유지.
- **라우터 classifier 버전**: 최근 10회분 유지.
- Canary 실패 시 이전 세대로 **5분 내 자동 복귀** 검증을 Game day로 주기적 실시.

**근거**: 자가 학습 루프에서 가장 흔한 실패 모드는 "어제는 좋았는데 오늘은 나빠졌다" 패턴. 빠른 복귀 경로가 없으면 운영 리스크가 과도하다.

### 7. 조직 경계 — 단일 팀 pilot → 플랫폼 확대

- Phase 1 (0–3개월): **Classifier v7 / 라우터**만 자가학습 대상. 단일 팀 pilot.
- Phase 2 (3–6개월): 특정 self-hosted SLM 하나(Qwen3-4B)로 확장.
- Phase 3 (6개월+): GLM-5 등 대형 모델로 확장 여부 재검토. **별도 ADR 필요**.

**근거**: 기술적으로 가능한 것과 조직이 운영 가능한 것은 다르다. 초기 스코프를 작게 잡고 게임 데이터를 쌓은 후 확장.

---

## Consequences

### 긍정적
- 루프 도입 범위·속도·책임이 명시돼 예측 가능성이 올라간다.
- 폐쇄 모델은 제외하므로 공급자 계약 리스크 회피.
- 3-stage 자동화로 돌발 사고 시 피해 반경 축소.

### 부정적 / Trade-off
- Train/Deploy 수동 승인으로 "완전 자동 autosearch"의 속도 이점 일부 희생.
- 4-gate 데이터 게이트가 초기 데이터 수집량을 크게 줄여 학습 속도 저하 가능.
- 단일 DRI 모델은 담당자 이탈 시 운영 단절 위험 → 백업 DRI 지정 필요.

### 다음 액션
- [ ] 본 ADR Draft를 관련 리드들에게 회람 (MLOps / Security / FinOps / 컴플라이언스)
- [ ] Reward 모델 DRI 지정 (플랫폼 팀 내부 논의)
- [ ] 4-gate 데이터 파이프라인 설계 작업 생성 → `continuous-training-pipeline.md` § Stage 3 보강
- [ ] Game day 롤백 시나리오 작성 → `cascade-routing-tuning.md` § Canary 롤아웃 보강
- [ ] 합의 후 상태를 **Proposed → Accepted** 로 갱신

---

## References

- Andrej Karpathy — "LLMs doing autosearch" (2026 Q1 담론)
- LMSYS RouteLLM — Cascade routing classifier 설계
- Langfuse OTel — Production trace standard
- GRPO / DPO / RLAIF 논문 링크는 설계 문서 참조
- 내부: Phase 3 완료 기록 (MEMORY.md)
