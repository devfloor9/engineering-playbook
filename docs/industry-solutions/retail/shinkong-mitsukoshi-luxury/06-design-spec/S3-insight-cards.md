---
title: "S3. 카테고리·BU 인사이트 카드 (Mitsukoshi)"
sidebar_label: "S3. Insight Cards"
description: "점포·층·브랜드 GMV + 환율·관광·경쟁사 결합 자동 보고서"
---

# S3. 카테고리·BU 인사이트 카드 (Mitsukoshi)

## 1. URL · 페르소나
- `/insights` · P3

## 2. 카드 프리셋

| 카드 | 데이터 |
|---|---|
| 월별 점포 GMV | POSTransaction × Store |
| 층별 카테고리 매출 (1F=럭셔리/B1=식품 등) | POSTransaction × Boutique |
| **외국인 점유율 시계열** | TaxRefundTransaction × Foreigner.country |
| **환율(JPY/USD/HKD) vs 면세 GMV** | EconomicSignal + TaxRefundTransaction |
| **대만 입국 외국인 vs Mitsukoshi 외국인 매출** | TourismSignal annotation |
| 週年慶 캠페인 효과 | Campaign × Touchpoint × Order |

## 3. 페르소나별 코멘트

| P | 동일 카드 (점포 GMV) |
|---|---|
| P1 | "信義점 +12%, 週年慶 효과. 다음 캠페인은 외국인 유치" |
| P2 | "외국인 비중 28% 상승, 일본 관광객 회복" |
| P3 | "분포 +1.5σ, 환율 변수 결합 분석 필요" |
| P4 | "VIP Black 적립 +3pt, 라운지 활용 증가" |
| P5 | "1F LV·Hermes 회전 +0.3, 매대 확장 제안" |

## 4. 데모 시나리오
1. "월별 점포 GMV" → 5 페르소나 코멘트
2. "환율 vs 면세 GMV" → R² 0.74 (엔저로 일본인 대신 동남아 ↑)
3. 카드 → 챗봇 (S2) 자연 전환
