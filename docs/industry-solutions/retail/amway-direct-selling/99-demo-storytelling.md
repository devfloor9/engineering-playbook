---
created: 2026-05-14
title: "30분 시연 스크립트 (AMWAY)"
sidebar_label: "99. Demo Storytelling"
description: "AMWAY 글로벌 임원·ABO 미팅용 30분 시연 — Top-5 (S1·S9-A·S10-A·S2·S11-A)"
last_update:
  date: 2026-05-14
reading_time: 6
---
# 30분 시연 스크립트 (AMWAY)

> **목표**: 30분 안에 PoC가 동작 시연임을 입증 + AMWAY 차별점 (ABO Tree·Subscription·Compliance) 3종 강조.

---

## 0. 시연 전 준비 (5분, 시간 외)

| 체크 | 내용 |
|---|---|
| ✅ | Top-5 모두 1분 내 응답 |
| ✅ | 페르소나 5개 확인 |
| ✅ | cohort_tag 배지 |
| ✅ | 다국어 (영·한 동시) 챗봇 응답 |
| ✅ | RegulatorySignal 라이브 |

---

## 1. 오프닝 (3분)

> "오늘 보여드릴 데모는 AMWAY의 **ABO 다단계 조직·정기구독·다국가 규제** 3종 핵심 자산을 단일 KG로 통합해 5 부서가 각자 시각으로 활용하는 동작 시연입니다. **컨셉이 아닌** N=1K ABO + 5K Customer + 49.5K 합성 ABO Tree + 외부 4종 시그널 라이브가 모두 작동합니다."

핵심 메시지 4개:
1. **ABO Tree 시각화** — 5단 Downline + PV/BV + Sponsor 성과 한 화면
2. **정기구독 라이프타임** — 해지 시그너처 자동 탐지 + 회복 캠페인
3. **다국가 규제 자동 검수** — FTC·방판법·식약처·EU 동시
4. **부서 페르소나 스위처** — 동일 데이터 5 부서 시각

---

## 2. Top-5 시연 (20분)

### Step 1 — S1 자연어 시맨틱 검색 (4분)
- 페르소나: P1 (ABO Field)
- 입력: "비건 프로틴 + 30대 신규 ABO + 인스타 +20%"
- 결과: SKU(Nutrilite Plant Protein) + ABO + 외부 후기 (Reddit·인스타)

### Step 2 — S9-A ABO 조직 시각화 ⭐ (5분)
- 페르소나: P1
- 입력: "Diamond 등급 ABO 1명의 5단 Downline"
- 결과: cytoscape 트리 + PV/BV·등급 색상 + Sponsor 성과
- 강조: **"AMWAY만의 핵심 자산 — 다른 회사에서 못 보는 화면"**

### Step 3 — S10-A 정기구독 라이프타임 ⭐ (5분)
- 페르소나: P4 (CX)
- 입력: "Nutrilite 정기구독 12개월 retention + 해지 위험 TOP 100"
- 결과: state machine Sankey + retention curve + 회복 캠페인 시뮬
- 강조: "해지 시그너처 3종 자동 탐지 + 회복 캠페인 ROAS 예상"

### Step 4 — S2 페르소나 챗봇 (5분, 스위처 시연)
- P1 → "정기구독 해지 위험 ABO TOP 10 + 회복 액션"
- P5 → 같은 질의 → "규제 위반 위험 동시 검수 + 가드 제안"
- 강조: "동일 데이터, 다른 시각, 다른 액션"

### Step 5 — S11-A 컴플라이언스 ⭐ (3분)
- 페르소나: P5
- 입력: "Nutrilite로 면역력 강화 — 의사들이 추천!" (위험 광고)
- 결과: 식약처·FDA 위반 강조 + 권장 수정안 (한·영 동시)
- 미성년 ABO 가입 24시간 차단 카운트

---

## 3. 거버넌스·데이터 신뢰성 (3분)

### 3.1 cohort_tag 분리 (30초)
- 🟢 real (N=1K ABO + 5K Customer) / 🟡 synth (49.5K Tree) / 🔵 external (4종)

### 3.2 가드레일 (1분)
- 동의 미수신 자동 차단
- PII 마스킹
- 미성년 + 건기식 광고 가드

### 3.3 AWS Stack 1장 (1분 30초)
- Bedrock + Neptune (~700K edges) + OpenSearch (다국어) + AgentCore + Cohere multilingual

---

## 4. 클로징 (4분)

### 4.1 정리 (2분)
> "오늘 보신 5개는 11 시나리오 중 일부. S3 인사이트 카드, S4 페르소나 클러스터링, S5 ROAS, S6 외부 시그널, S7 옴니채널 여정도 동일 패턴으로 동작."

### 4.2 다음 단계 제안 (2분)

| 단계 | 기간 | 산출물 |
|---|---|---|
| Discovery | 2주 | ABO 데이터 인벤토리 + 다국가 규제 매핑 |
| PoC 8주 | 8주 | Top-5 시연 (실 ABO N=1K) |
| 확장 | +4주 | 11 풀세트 + 다국어 강화 |
| 운영 전환 | +8주 | LLMOps + 다국가 출시 |

---

## 5. Q&A 자주 나오는 질문

| 질문 | 답변 |
|---|---|
| ABO Tree 깊이 5단 충분? | 옵션 7단까지 확장 가능, Neptune r6g.xlarge 권장 |
| 다국가 규제 동시 검수? | RegulatorySignal 룰셋 등록 후 자동 |
| 정기구독 해지 시그너처 정확도? | PoC 단계 검증 (실데이터 시그너처 cross-validation) |
| 비용? | 약 $5K~$7K/월 (다국어 임베딩 포함) |

---

## 6. 백업 시 대응

| 실패 | 대응 |
|---|---|
| ABO Tree 쿼리 지연 | 캐시된 트리 fallback |
| 다국어 챗봇 실패 | 한국어 단독 답변으로 전환 |
| 외부 API(SNS) 끊김 | 캐시 fallback |