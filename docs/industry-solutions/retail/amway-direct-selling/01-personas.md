---
created: 2026-05-14
title: "5 부서 페르소나 (AMWAY)"
sidebar_label: "01. Personas"
description: "AMWAY 글로벌 직접판매 컨텍스트 — ABO Field / Insights / D&A·MarTech / CX / Compliance"
last_update:
  date: 2026-05-14
reading_time: 6
---
# 5 부서 페르소나 (AMWAY)

> 동일 데이터를 5개 부서가 각자의 KPI·언어로 활용. 페르소나 스위처가 사이드바·카드·챗봇 어조를 모두 변경.

---

## 한눈에 보기

| 코드 | 부서 | 미션 | 핵심 KPI | 주 활용 시나리오 |
|---|---|---|---|---|
| **P1** | ABO Field Marketing | ABO 모집·Upline 성과·정기구독 확대 | ABO 신규 / Upline ROI / 구독 재가동률 | S1·S2·S5·**S9-A** |
| **P2** | Consumer Insights | 페르소나·트렌드·LTV 분석 | LTV / Retention / 페르소나 점유 / SOV | S2·S4·S6 |
| **P3** | Data & MarTech | 모델·데이터 품질·다국어 운영 | 모델 정확도 / Drift / 파이프라인 SLA | S2·S3·S6 |
| **P4** | Customer Experience (CRM) | ABO 활성도·정기구독 retention | NPS / 활성 ABO / 구독 해지율 | S2·S7·**S10-A** |
| **P5** | Compliance & Regulatory | 직접판매 규제·광고·미성년 | 규제 준수율 / 차단 카운트 | S2·**S11-A** |

---

## P1. ABO Field Marketing
- **언어 톤**: ABO·Sponsor·Downline·Upline·Pyramid·정기구독·PV/BV
- **의사결정 단위**: 주간 ABO 모집 캠페인, 월간 구독 재가동
- **챗봇 어조**: "이번 달 Diamond 등급 진입한 ABO와 Downline 활동", "Sponsor 재방문 추천"
- **주 도구**: campaign_simulator · attribution_calc · abo_tree_query

## P2. Consumer Insights
- **언어 톤**: 코호트·LTV·페르소나·SOV·트렌드
- **의사결정 단위**: 분기 라이프스타일 페르소나 정의, 월간 트렌드 보고
- **챗봇 어조**: "Nutrilite 신규 정기구독 진입 코호트의 행동 패턴", "올영·Dcard에서 Artistry 트렌드"
- **주 도구**: cluster_run · social_trend_join · lookalike_expand

## P3. Data & MarTech
- **언어 톤**: 정확도·Drift·Pipeline·다국어·RMSE
- **의사결정 단위**: 모델 배포 주기·다국어 임베딩 품질
- **챗봇 어조**: "동남아 마켓 추천 모델 CTR drift", "다국어 임베딩 품질 모니터"
- **주 도구**: behavior_change_detect · neptune_query

## P4. Customer Experience (CRM)
- **언어 톤**: 등급·NPS·정기구독·해지·동의
- **의사결정 단위**: 월간 ABO 활성화·정기구독 회복 캠페인
- **챗봇 어조**: "정기구독 해지 위험 ABO TOP 100", "NPS 떨어진 채널 원인"
- **주 도구**: subscription_lifecycle · semantic_search (회원)

## P5. Compliance & Regulatory
- **언어 톤**: 직접판매·방판법·FTC·건기식 광고·미성년
- **의사결정 단위**: 광고 검수·등급 검증·매월 정책 업데이트
- **챗봇 어조**: "프로틴 캠페인 광고 표현 가드 적용 결과", "미성년 ABO 가입 시도 차단 카운트"
- **주 도구**: compliance_check · pii_mask

---

## 페르소나 스위처가 UI에 미치는 영향

| UI 요소 | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| 사이드바 강조 | S1·S2·S5·S9-A | S4·S6 | S3·S6 | S7·S10-A | S11-A |
| 인사이트 카드 정렬 | ABO 모집/PV·BV | LTV/Churn/SOV | Drift/품질 | 등급/NPS/구독 | 차단 카운트/정책 |
| 챗봇 system prompt | ABO 마케터 톤 | 트렌드 분석가 | 데이터 사이언티스트 | 운영 매니저 | Compliance Officer |
| 가드레일 강도 | 마케팅 동의 필수 | PII 마스킹 | 모델 신뢰도 | 동의·등급 | **모든 가드 활성** |

---

## 시연 시 활용 팁

1. **S2 챗봇** 단계에서 "정기구독 해지 위험 ABO TOP 100" 같은 동일 질의를 P4(CRM) ↔ P5(Compliance)에서 시연하면 답변 톤이 극명히 달라짐
2. **S9-A** ABO 트리 시연은 P1(ABO Field) 페르소나에서
3. **S11-A** 가드레일은 P5 페르소나에서 "프로틴 광고 표현 검증" 시연