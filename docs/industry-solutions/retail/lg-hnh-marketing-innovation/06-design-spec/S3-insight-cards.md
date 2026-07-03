---
title: S3. 카테고리·BU 인사이트 카드
description: 자사 GMV + 검색 트렌드 + 기상 + 경쟁사 결합 자동 보고서 카드
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S3. Insight Cards
---

## 1. URL 경로
- `/insights`

## 2. 사용자 스토리
> P3 (D&A) — 매주 같은 보고서를 만든다. 외부 4종 시그널 자동 결합 + LLM 코멘트로 시간 절약.

> P5 (MD) — 카테고리 매출 카드를 보고 곧장 "왜?"를 챗봇(S2)으로 이어 묻고 싶다.

## 3. 입력 UI
- 카드 종류 셀렉터 (8종 프리셋)
- 기간(주/월/분기), BU/카테고리/채널/브랜드 필터
- "Generate Insights" 버튼

## 4. 데이터 믹스
| 데이터 | 출처 | 활용 |
|---|---|---|
| 자사 GMV (BU × 카테고리 × 월) | Snowflake / Neptune | line/bar |
| **검색 트렌드** | 네이버·구글 → SocialSignal | 듀얼 축 |
| **기상** | KMA → WeatherSignal | 듀얼 축 |
| **경쟁사 신제품** | CompetitorSignal | annotation |

## 5. 처리 파이프라인
```
1. 카드 선택 → openCypher / Snowflake 집계
2. 외부 시그널 조인 (날짜/지역/카테고리 키)
3. 결과 dataframe → AgentCore Code Interpreter
4. matplotlib + NanumGothic PNG
5. PNG + dataframe → Sonnet 4.6
6. 페르소나 system prompt로 코멘트 생성
7. 카드 = PNG + 코멘트 + 데이터 표
```

## 6. 카드 프리셋 8종
| 카드명 | 데이터 |
|---|---|
| 월별 BU GMV 추이 | Beauty/HDB/Refreshment 비교 |
| 카테고리×채널 GMV | 자사몰·마트·H&B·편의점 |
| **자외선차단 GMV vs 기온·UV** | WeatherSignal 결합 |
| **음료 GMV vs 외기온·강수** | WeatherSignal 결합 |
| **검색 트렌드 vs 자사 GMV** | SocialSignal 결합 |
| **경쟁사 신제품 출시 후 자사 영향** | CompetitorSignal annotation |
| 멤버스 등급별 GMV | Membership × Order |
| 시간대별 거래 분포 | OrderTransaction.order_at |

## 7. 부서별 코멘트 차이
| 페르소나 | 동일 카드 (Beauty 월별 GMV) 코멘트 예시 |
|---|---|
| P1 브랜드 마케터 | "11월 후 +12% — 사전 SMS 캠페인 효과 추정. 다음 캠페인은..." |
| P2 인사이트 | "1인가구 페르소나가 Beauty 비중 25%로 상승 — 새 세그먼트 검토" |
| P3 D&A | "11월 분포가 평년 대비 +1.5σ — 기온 변수 결합 분석 필요" |
| P4 CRM·LG 멤버스 | "VIP 적립률 18%로 +3pt — 등급 유지 캠페인 효과" |
| P5 MD·채널 영업 | "Beauty 회전 +0.4 — 백화점·올영 매대 확장 제안" |

## 8. 가드레일
- 외부 데이터 출처 표기 의무
- 인과 추정 금지 (correlation only) — LLM 코멘트 가드
- 표본 작은 카테고리 신뢰구간 강조

## 9. 데모 시나리오
1. "월별 BU GMV 추이" 카드 → 5 페르소나 코멘트 시연
2. "자외선차단 vs 기온" 카드 → R² 0.62 산점도 + 발주 가이드
3. "이 카드를 챗봇으로" 버튼 → S2 자연 전환