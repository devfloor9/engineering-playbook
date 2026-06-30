---
title: S4. Persona Matching + Clustering (AMWAY)
description: 5 lifestyle personas + KMeans over RFM × category affinity, enriched with social personas
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

## 1. URL & Personas
- `/personas` · P2 (Consumer Insights)

## 2. Five Lifestyle Personas

| Persona | Core Signals |
|---|---|
| Health Influencer | Nutrilite subscription · Instagram posts · share of Diamond ABOs |
| Mom-of-kids | Home · kids' vitamins · weekday daytime activity |
| Single Household | Small portions · convenience · late-night activity |
| Senior | Nutritional supplements · phone orders |
| Trendsetter | Artistry new arrivals · SNS campaign responsiveness |

## 3. Data Mix
- RFM features (combined Customer + ABO)
- Category affinity (Nutrition / Beauty / Home)
- Channel share (store / ABO direct / catalog)
- **Social personas** (Instagram · Reddit · X keywords)

## 4. Processing Pipeline (KMeans)
1. Feature extraction + standardization
2. KMeans 6 (or elbow)
3. Per-cluster averages + social enrichment → Sonnet labeling
4. Labels: "Health Influencer," "Vegan Single Household," "Weekend Family Shopper," etc.

## 5. Output UI
- 5 persona cards (distribution bars)
- 6 cluster cards (label, member count, top 5 representative SKUs)
- PCA scatter plot

## 6. Guardrails
- Do not expose persona labels to the labeled members themselves
- Prohibit pregnancy / illness inference
- Flag samples with fewer than 30 members

## 7. Demo Scenarios
1. Single-item match → "First-rank Health Influencer 0.62"
2. Batch of 50,000 members → six clusters auto-labeled
3. "Campaign to this cluster" → handoff to S5
