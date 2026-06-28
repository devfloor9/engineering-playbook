---
title: S11-Mo. 모바일 앱 추천·검색 다양성 (Momo 특화)
description: 추천 다양성·신상 노출·롱테일 SKU 발견 — 탐색-구매 균형 모니터
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S11-Mo. Recommendation Diversity
---

# S11-Mo. 모바일 앱 추천·검색 다양성

> **Momo 차별 포인트** ⭐ — 방대한 SKU 자산이 모바일 앱에서 발견되도록 추천 다양성 + 롱테일 노출을 모니터.

## 1. URL · 페르소나
- `/recommendation-diversity` · P3 (검색·추천·MarTech)

## 2. 사용자 스토리
> P3 — 추천 결과의 다양성 점수, 신상 노출 비율, 롱테일 SKU 노출률을 카테고리·세그먼트·시간대별로 추적.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| Product (LongTailSKU 플래그) | Neptune |
| 추천·검색 노출 로그 | OpenSearch |
| OrderTransaction | Neptune |
| 사용자 행동 (탐색 vs 구매) | CartEvent + SearchEvent |

## 4. 메트릭

| 메트릭 | 정의 |
|---|---|
| **다양성 점수 (intra-list)** | 추천 결과 내 카테고리·브랜드 분포 entropy |
| **신상 노출 비율** | 출시 30일 내 SKU 노출 비중 |
| **롱테일 노출률** | 월 거래 < 평균 SKU 노출 비중 |
| **탐색-구매 균형** | 클릭 / 구매 ratio 정상 범위 |

## 5. 처리 파이프라인
```
1. 추천 노출 로그 dataframe
2. 카테고리·브랜드 entropy 계산
3. 신상·롱테일 비율 계산
4. 카테고리별 다양성 점수 → 임계 미달 자동 알람
5. A/B 비교 (다양성 ↑ vs CTR ↑ tradeoff)
```

## 6. 출력 UI
- 좌: 카테고리별 다양성 점수 막대
- 중앙: 신상·롱테일 노출 시계열
- 우: 탐색-구매 균형 점수
- 하단: 다양성 ↑ A/B 결과

## 7. 가드레일
- 추천 알고리즘 영업 정보 보호
- A/B 테스트 결과 통계 신뢰구간 표시

## 8. 데모 시나리오
1. **카테고리별 다양성 점수** → "여름텐트" 0.31 (낮음 — 1~2 인기 SKU 집중)
2. **롱테일 노출 비율** → 8% → 다양성 보정 추천 시뮬 결과 12%
3. **A/B 결과** → 다양성 ↑ 후 CTR -2%, GMV +6% (긴 시각 효율 ↑)