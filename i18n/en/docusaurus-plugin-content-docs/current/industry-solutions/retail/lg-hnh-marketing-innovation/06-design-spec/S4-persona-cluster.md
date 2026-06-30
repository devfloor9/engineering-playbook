---
title: S4. Persona Matching + Clustering
description: Auto-classified lifestyle personas + RFM × Category affinity KMeans integrated
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

> Unify persona matching and RFM clustering into a single screen. **Strengthened by combining social personas (Instagram · Olive Young).**

## 1. URL Path
- `/personas`

## 2. User Stories
> P2 (Insights) — Wants to automatically classify 50K members into 5 lifestyle personas and group them into 6~8 meaningful clusters.

## 3. Input UI
- **Persona matching tab**: Single-member / bulk matching
- **Clustering tab**: KMeans cluster analysis
- Persona definition cards (5 types): Kids mom · Gold miss · Single household · Senior · Trendsetter

## 4. Data Mix
| Data | Source | Use |
|---|---|---|
| RFM features | Neptune | KMeans input |
| Category affinity | Neptune (Customer × Category frequency) | KMeans input |
| Channel share | Neptune | KMeans input |
| **Social personas** | Instagram · Olive Young keywords → SocialSignal | LLM labeling reinforcement |

## 5. Processing Pipeline (Persona Matching)
```
1. Member 1-hop data (openCypher)
2. Feature vector: category share · price band · time-of-day · channel share
3. Per-persona weighted score
4. 1st/2nd rank + confidence (entropy)
```

## 6. Processing Pipeline (Clustering)
```
1. Feature extraction: RFM + category affinity + channel share + social activity
2. Standardization (z-score)
3. KMeans 6 (or elbow)
4. Per-cluster mean + social keywords → Sonnet 4.6 labeling
5. Label examples: "Premium Beauty loyalists", "Discount-sensitive single household", "Weekend family shoppers"
```

## 7. Output UI
- Persona card (masked ID + 1st/2nd rank + confidence bar)
- Cluster card (label, member count, key traits, top 5 representative SKUs)
- 2D scatter plot (PCA)
- Persona → Cluster Sankey

## 8. Guardrails
- Persona labels not exposed to the members themselves (internal analysis only)
- "Sensitive inference" (pregnancy · illness) forbidden
- Clusters with very small samples (&lt;30 members) shown separately
- LLM labels must avoid discriminatory · biased terms

## 9. Demo Scenarios
1. Single-member matching → "Rank 1 Kids mom 0.62 / Rank 2 Single household 0.18"
2. 50K-member bulk clustering → 6 clusters auto-labeled
3. "Simulate a campaign send to this cluster" → S5 linkage
