---
title: S4. Persona Matching + Clustering (Momo)
description: 5 lifestyle personas + RFM × Live-viewing affinity
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - momo
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

## 1. Five Lifestyle Personas

| Persona | Signals |
|---|---|
| Live impulse buyer | High LiveStreamPurchase share · High viewing time |
| Search explorer | Many SearchEvents · High cart abandonment |
| 24-hour delivery dependent | Immediate OrderTransaction checkout · SLA-sensitive |
| Family shopper | Many household SKUs · Weekend purchases |
| TV home-shopping loyalist | High TVPurchase share · 50+ age group |

## 2. Data Mix
- RFM (Customer)
- Live-viewing affinity (LiveStream × Viewer)
- Channel share (App / Web / TV / Live)
- Social personas (Dcard · Instagram keywords)

## 3. Output UI
- 5-persona card distribution
- KMeans 6-cluster (LLM labels)
- PCA scatter plot

## 4. Demo Scenarios
1. Single match → "Live impulse buyer 0.58"
2. 5K batch → 6 clusters
3. Cluster → live campaign (S5)
