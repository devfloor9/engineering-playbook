---
title: S8. 가드레일 (Uni-President)
description: Bedrock Guardrails + PDPA + BU 영업 정보 분리
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - uni-president
  - design-spec
  - agent
  - scope:design
sidebar_label: S8. Guardrails
---

# S8. 가드레일 (Uni-President)

## 활성 정책

| 정책 | 액션 |
|---|---|
| 폭력·혐오·성·오정보 | Block |
| 의료·법률 추정 | Block + 안내 |
| 마케팅 동의 미수신 | 도구 차단 |
| **PDPA (대만 個資法)** | PII 자동 마스킹 + 국외 이전 동의 검증 |
| 미성년 + 알코올/담배 SKU | 컨텍스트 차단 |
| **BU 영업 정보 분리** | 7ELE 가격을 까르푸 페르소나에 노출 금지 |
| 콜드체인 단가 | 외부 노출 차단 |

## 데모 시나리오
1. PII 마스킹
2. 미성년 + 알코올 SKU 차단
3. BU 분리 — P5(7ELE)가 까르푸 매장 단가 조회 시도 → 차단