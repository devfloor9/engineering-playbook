---
created: 2026-05-14
title: "S6. 외부 시그널 융합 (AMWAY)"
sidebar_label: "S6. External Signals"
description: "소셜·기상·환율(다국가)·규제 4종 융합"
last_update:
  date: 2026-05-14
reading_time: 1
---
# S6. 외부 시그널 융합 (AMWAY)

## 1. URL · 페르소나
- `/signals` · P2, P3

## 2. 외부 시그널 4종

| 종류 | 출처 |
|---|---|
| 소셜 | 글로벌 인스타·Reddit·X·韩 네이버·中 微博·小红書 |
| 기상 | KMA + open-meteo (글로벌) |
| 경제 | 한국은행·통계청 + Open Exchange Rates (다국가 환율) |
| **규제** | FTC·방판법·식약처·EU |

## 3. 처리 파이프라인
1. 일별·국가별 자사 GMV 집계
2. 외부 4종 시계열 조인
3. 상관·시차 분석
4. 시계열 + 상관 히트맵 + 규제 annotation

## 4. 출력 UI
- 시계열 듀얼 축 (외부 + 자사)
- 카테고리×시그널×국가 상관 히트맵
- 시차 분석 (lag 0~14일)
- 규제 발효 일자 annotation

## 5. 가드레일
- 출처 표기 (공개 데이터만)
- 인과 추정 금지

## 6. 데모 시나리오
1. 환율 +5% vs 미국 외 자사 매출 (시차 14일)
2. "비건뷰티" 글로벌 키워드 vs Artistry 비건 매출
3. FTC 규제 발효 후 8주 자사 직판 매출 변화