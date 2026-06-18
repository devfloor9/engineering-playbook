---
created: 2026-05-14
title: "S8. 가드레일 (Mitsukoshi)"
sidebar_label: "S8. Guardrails"
description: "Bedrock Guardrails 4 토픽 + 면세 규정 + 미성년 럭셔리 가드"
last_update:
  date: 2026-05-14
reading_time: 1
---
# S8. 가드레일 (Mitsukoshi)

## 1. URL · 페르소나
- `/compliance` · P4

## 2. 활성 정책

| 정책 | 액션 |
|---|---|
| 폭력·혐오·성·오정보 | Block |
| 의료·법률 추정 | Block + 안내 |
| 마케팅 동의 미수신 | 도구 차단 |
| PII | 자동 마스킹 |
| 미성년 + 럭셔리 마케팅 | 컨텍스트 차단 |
| 면세 자격 미달 | 컨텍스트 차단 |
| 가격 표시 (대만 소비자보호법) | 검수 |

## 3. 데모 시나리오
1. PII 마스킹
2. 면세 자격 미달 시뮬
3. 미성년 럭셔리 캠페인 차단