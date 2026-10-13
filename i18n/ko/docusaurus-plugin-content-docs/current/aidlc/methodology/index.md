---
title: AIDLC 방법론
description: AIDLC의 핵심 방법론 — 10대 원칙, 온톨로지, 하네스 엔지니어링, DDD 통합, Common Rules, Adaptive Execution
created: "2026-04-07"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 2
tags:
  - aidlc
  - methodology
  - scope:nav
sidebar_label: 방법론
---

# AIDLC 방법론

:::info 공식 AIDLC 레퍼런스
본 섹션은 [AWS Labs AIDLC Workflows](https://github.com/awslabs/aidlc-workflows) (v0.1.7, 2026-04-02) 를 기반으로 DDD·Ontology·Harness 확장을 덧붙였습니다. 공식 5대 원칙·11개 Common Rules·7 stage Adaptive Execution 은 그대로 준수하되, engineering-playbook 은 **엔터프라이즈 신뢰성** 을 위한 온톨로지·하네스 축을 독자 확장했습니다.
:::

이 트랙은 개발 과정에서 사람과 AI의 협업을 구성하는 방법을 설명합니다. Intent → Unit → Bolt 실행 모델을 먼저 소개하고, 업무 스키마, 검증 제어, 도메인 주도 설계가 이 작업 흐름을 어떻게 뒷받침하는지 다룹니다.

**AIDLC 정의 & SDLC 비교**: [10대 원칙과 실행 모델](./principles-and-model.md#11-sdlc-vs-aidlc-비교) 참조

## 구성

방법론 트랙은 4개의 핵심 문서로 구성되며, 순서대로 읽으면 AIDLC의 전체 이론 체계를 이해할 수 있습니다.

```mermaid
flowchart LR
    P["10대 원칙<br/>Intent · Unit · Bolt"] --> O["온톨로지<br/>WHAT + WHEN"]
    P --> H["하네스<br/>HOW"]
    O --> D["DDD 통합<br/>도메인 설계"]
    H --> D

    style P fill:#326ce5,color:#fff
    style O fill:#2ecc71,color:#fff
    style H fill:#e74c3c,color:#fff
    style D fill:#9b59b6,color:#fff
```

| 순서 | 문서 | 핵심 질문 |
|------|------|----------|
| 1 | [10대 원칙과 실행 모델](./principles-and-model.md) | AIDLC는 무엇이고, 어떻게 동작하는가? (공식 5대 원칙 + Intent/Unit/Bolt 매핑) |
| 2 | [온톨로지 엔지니어링](./ontology-engineering.md) 🧩 | AI가 생성하는 코드의 **정확성**을 어떻게 보장하는가? (확장) |
| 3 | [하네스 엔지니어링](./harness-engineering.md) 🧩 | AI 실행의 **안전성**을 어떻게 아키텍처로 강제하는가? (확장) |
| 4 | [DDD 통합](./ddd-integration.md) | 비즈니스 도메인을 AI가 이해하는 설계로 어떻게 변환하는가? |
| 5 | [Common Rules](./common-rules.md) ⭐ | 공식 AIDLC 11개 공통 규칙은 무엇이며 어떻게 적용하는가? |
| 6 | [Adaptive Execution](./adaptive-execution.md) ⭐ | 공식 Inception 7 stage 와 Construction per-Unit 루프는 언제·어떻게 실행되는가? |

> ⭐ AWS Labs 공식 AIDLC 정합성 문서  
> 🧩 engineering-playbook 독자 확장 (엔터프라이즈 신뢰성)

## 다른 트랙과의 관계

- **[엔터프라이즈 도입](/docs/aidlc/enterprise)**: 방법론의 개념(온톨로지, 하네스)을 조직 변환과 비용 효과로 해석합니다.
- **[도구 & 구현](/docs/aidlc/toolchain)**: 방법론을 실현하는 구체적 도구(Kiro, Q Developer, EKS)를 다룹니다.
- **[AgenticOps](/docs/aidlc/operations)**: 운영 데이터가 온톨로지 Outer Loop로 피드백되는 순환 구조를 구축합니다.
