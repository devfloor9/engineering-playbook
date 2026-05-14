---
title: "S10-M. 럭셔리 브랜드 SOV + 매대 점유 (Mitsukoshi 특화)"
sidebar_label: "S10-M. Brand SOV"
description: "입점 700+ 브랜드 × 19점포 × 시즌 매대 점유 분석"
---

# S10-M. 럭셔리 브랜드 SOV + 백화점 매대 점유

> **Mitsukoshi 차별 포인트** ⭐ — 700+ 입점 브랜드의 매대 점유와 SOV(Share of Voice)를 19점포·층·시즌 단위로 분석.

## 1. URL · 페르소나
- `/brand-sov` · P5 (MD·매장 운영)

## 2. 사용자 스토리
> P5 — 信義점 1F의 LV vs Hermes 매대 GMV·회전율을 비교 + SS 시즌 신상 진열 후 4주 영향 분석.

## 3. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| Boutique × Brand × Store | Neptune (~3K Boutique) |
| POSTransaction | Neptune (~200K) |
| 매대 면적·임대 | Boutique 속성 |
| 시즌 (週年慶/SS/FW) | Campaign 노드 |
| 경쟁사 SOV | CompetitorSignal (소셜 + 등장 빈도) |

## 4. 처리 파이프라인
```
1. (점포, 층, 브랜드) 그룹별 GMV·회전 집계
2. 매대 면적 대비 GMV 효율 계산
3. 시즌 비교 (SS 신상 출시 후 4주 영향)
4. 경쟁사 SOV 결합 (소홍서·인스타 언급)
5. 매대 재배치 추천 (Sonnet 4.6)
```

## 5. 출력 UI
- 좌: 19 점포 × 층 매트릭스 (heatmap)
- 중앙: 브랜드 SOV 막대 (자사 vs 경쟁사)
- 우: 매대 효율 산점도 (면적 vs GMV)
- 하단: 추천 매대 재배치 카드 (Sonnet)

## 6. 가드레일
- 입점 브랜드 영업 정보 보호 (외부 노출 X)
- 매대 임대 가격 비공개

## 7. 데모 시나리오
1. **信義점 1F LV vs Hermes** → GMV 비교 + 회전율
2. **SS 신상 출시 후 4주** → 자사 LV +12%, 경쟁사 SOV +18%
3. **매대 재배치 추천** → "B1 식품 → 1F 신상 캐비넷으로 이동 시 +8% 예상"
