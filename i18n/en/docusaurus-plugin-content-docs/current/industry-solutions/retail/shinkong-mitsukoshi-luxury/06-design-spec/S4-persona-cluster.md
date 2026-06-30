---
title: S4. Persona Matching + Clustering (Mitsukoshi)
description: 5 lifestyle personas + RFM × luxury affinity + social personas
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - shinkong-mitsukoshi
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

## 1. URL · Personas
- `/personas` · P2

## 2. 5 Lifestyle Personas

| Persona | Signals |
|---|---|
| Luxury collector | Regular purchases of LV/Hermes/Chanel · Black tier |
| Seasonal trendsetter | Immediate purchase of SS/FW new releases · Instagram |
| Foreign tourist | TaxRefund · FX-sensitive · single-visit purchases |
| Family shopper | Food / weekends · average basket size |
| Accessory beginner | Low-price SKUs · first purchase |

## 3. Data Mix
- RFM (Customer + Foreigner)
- Luxury affinity (purchase share of LV/Hermes/Chanel)
- Xiaohongshu / Dcard keywords (social personas)

## 4. Output UI
- Distribution of 5 persona cards
- KMeans 6 clusters (LLM labeled)
- PCA scatter plot

## 5. Demo Scenarios
1. Single-record matching → "Luxury collector 0.62 / Seasonal trendsetter 0.18"
2. Batch of 2,500 members → 6 clusters
3. Clusters → campaign simulator (S5)
