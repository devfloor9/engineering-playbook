---
title: S3. Category / BU Insight Cards (Mitsukoshi)
description: Automated reports combining store, floor, and brand GMV with FX, tourism, and competitor data
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S3. Insight Cards
---

## 1. URL · Personas
- `/insights` · P3

## 2. Card Presets

| Card | Data |
|---|---|
| Monthly store GMV | POSTransaction × Store |
| Category revenue by floor (1F = luxury, B1 = food, etc.) | POSTransaction × Boutique |
| **Foreigner share time series** | TaxRefundTransaction × Foreigner.country |
| **FX (JPY/USD/HKD) vs duty-free GMV** | EconomicSignal + TaxRefundTransaction |
| **Taiwan foreign arrivals vs Mitsukoshi foreigner revenue** | TourismSignal annotation |
| Anniversary Sale campaign impact | Campaign × Touchpoint × Order |

## 3. Persona Commentary

| P | Same card (store GMV) |
|---|---|
| P1 | "Xinyi store +12%, Anniversary Sale effect. Next campaign should target foreigner acquisition" |
| P2 | "Foreigner share up 28%, Japanese tourist recovery" |
| P3 | "Distribution +1.5σ, FX variable correlation analysis needed" |
| P4 | "VIP Black point accrual +3pt, lounge utilization increasing" |
| P5 | "1F LV/Hermes turnover +0.3, propose counter expansion" |

## 4. Demo Scenarios
1. "Monthly store GMV" → commentary from 5 personas
2. "FX vs duty-free GMV" → R² 0.74 (weak yen shifts Japanese to Southeast Asian visitors ↑)
3. Card → chatbot (S2) natural transition
