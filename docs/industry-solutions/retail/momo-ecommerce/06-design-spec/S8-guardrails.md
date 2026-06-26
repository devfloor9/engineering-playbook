---
title: S8. 가드레일 (Momo)
description: Bedrock Guardrails + 라이브 광고 표현 + 미성년 + 환불 규정
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 1
tags: []
sidebar_label: S8. Guardrails
---

# S8. 가드레일 (Momo)

## 활성 정책
| 정책 | 액션 |
|---|---|
| 폭력·혐오·성·오정보 | Block |
| 의료·법률 추정 | Block + 안내 |
| 마케팅 동의 미수신 | 도구 차단 |
| PII | 자동 마스킹 |
| **라이브 방송 광고 표현** | LLM 가드 (효능·과장 검수) |
| 미성년 + 18+ SKU | 컨텍스트 차단 |
| 환불 7일 내 (대만 소비자보호법) | 표시 의무 |

## 데모 시나리오
1. PII 마스킹
2. "라이브 진행자가 '이 화장품 효능 100%'" → 가드 자동 수정
3. 미성년 + 알코올 SKU → 차단