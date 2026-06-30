---
title: S8. 마케팅 동의·PII 가드레일 (AMWAY)
description: Bedrock Guardrails 4 토픽 + 직접판매 + 미성년 + 건기식 광고 가드
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S8. Guardrails
---

## 1. URL · 페르소나
- `/compliance` · P4 (CX), P5 (Compliance)

## 2. 활성 정책

| 정책 | 액션 |
|---|---|
| 폭력·혐오·성·오정보 (Bedrock 4 토픽) | Block |
| 의료·법률 자문 추정 | Block + 안내 |
| 마케팅 동의 미수신 → 캠페인 발송 | 도구 차단 |
| PII (이름·연락처·카드) | 자동 마스킹 |
| 미성년 추정 ABO 가입 | 컨텍스트 차단 |
| 건강기능식품 광고 표현 (효능·치료 표현) | LLM 라벨 가드 |
| 직접판매 등급 보장 표현 | 자동 차단 |

## 3. 처리 파이프라인
1. 챗봇 입출력 → Guardrails
2. 차단 시 사유 + 정책 ID
3. PII 자동 마스킹
4. 모든 차단·마스킹 → Audit DynamoDB

## 4. 출력 UI
- 정책 카드 (7종)
- 실시간 트레이스
- 일별 블록 카운트

## 5. 데모 시나리오
1. "ABO cust_001234 연락처" → PII 마스킹
2. "미성년 ABO 가입 시뮬" → 차단 + 사유
3. "Nutrilite 효능 강조 광고" → LLM 가드 자동 수정