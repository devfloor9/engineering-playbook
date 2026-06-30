---
title: Industry Solutions
description: 산업별로 검증된 PoC 패턴과 동작 시연 데모 자산. Retail, Energy, Financial Services, Manufacturing 등.
created: "2026-05-14"
last_update:
  date: "2026-05-14"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - scope:nav
sidebar_label: Industry Solutions
---

> 산업별로 실증된 PoC 패턴과 시연 데모 자산. Engineering Playbook의 다른 섹션이 "어떻게 만드는가(How)"를 다룬다면, 여기는 **"고객에게 어떤 가치를 어떻게 보여주는가(What/Why)"**에 집중합니다.

---

## 카테고리

### Retail
종합 이커머스 / 오프라인 대형 리테일 / 생활용품·뷰티·음료 제조-유통 등 리테일 산업 도메인.

- **[LG H&H Marketing Innovation PoC](./retail/lg-hnh-marketing-innovation/)** — Beauty + HDB + Refreshment 3 BU 통합 마케팅 혁신 PoC. 자사 데이터 + 외부 4종 시그널 × Ontology + Agentic AI 8 시나리오 데모

### Energy (예정)
정유·주유 네트워크 멤버십·캠페인.

### Financial Services (예정)
은행·카드·증권 데이터 통합 PoC 패턴.

### Manufacturing (예정)
제조 OEE·SCM·고객 통합.

---

## 공통 PoC 패턴

모든 Industry Solutions는 다음 공통 자산을 활용합니다:

1. **Knowledge Graph (Neptune, openCypher)** — 25 클래스 도메인 모델
2. **Hybrid Search (OpenSearch + Cohere embed/rerank + Bedrock)** — BM25 + KNN + RRF + Rerank
3. **Persona Switcher** — 동일 데이터, 부서별 시각 재구성
4. **Agentic AI (Bedrock Sonnet 4.6 + AgentCore)** — 도구 자율 호출 + Memory + Code Interpreter
5. **Cohort 분리** — 실데이터 + 합성 데이터 + 외부 신호를 `cohort_tag`로 분리
6. **Bedrock Guardrails** — 4 토픽 + 마케팅 동의 + PII + 산업별 가드

---

## 활용 시나리오

- 고객사 미팅 시연 자산 (30분 데모 패스)
- PoC 제안서 작성 시 산업별 레퍼런스
- 솔루션 아키텍처 (SA) 영업 지원 자료
- 신규 산업 진입 시 패턴 재사용

---

## 설계 원칙

| 원칙 | 의미 |
|---|---|
| **공개 정보 기반** | 고객사 비공개 자료 의존 X — 누구나 검증 가능 |
| **컨셉이 아닌 동작 시연** | 실데이터 + 합성 + 외부 라이브 결합 |
| **시나리오 7~10개** | 너무 많지 않게, 각 시나리오마다 데이터 믹스 명시 |
| **부서 페르소나 5개** | 동일 데이터를 다른 시각으로 재구성하는 핵심 차별점 |
| **8주 PoC 가능 단일 아키텍처** | 의사결정 트레이드오프는 별도, PoC는 단순하게 |