---
title: "온톨로지 작성 가이드"
sidebar_label: "온톨로지 가이드"
sidebar_position: 1
description: "MSA 복잡도별 온톨로지 깊이와 작성 가이드라인"
tags: [ontology, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 온톨로지 작성 가이드

복잡도별 권장 온톨로지 수준과 작성 가이드라인을 정리합니다.

## 레벨별 온톨로지 수준

| 복잡도 | 온톨로지 수준 | 포함 요소 | 예시 파일 |
|--------|--------------|-----------|----------|
| **L1** | 경량 스키마 | - 엔티티 정의<br/>- 속성<br/>- 기본 불변조건 | `ontology/user-schema.yaml` |
| **L2** | 표준 온톨로지 | - 엔티티 + 관계<br/>- 서비스 계약<br/>- Bounded Context | `ontology/order-service.yaml` |
| **L3** | 풀 온톨로지 | - 이벤트 스키마<br/>- 이벤트 순서<br/>- 멱등성 키 | `ontology/order-events.yaml` |
| **L4** | 풀 온톨로지 + Saga | - Saga 단계<br/>- 보상 로직<br/>- 실패 시나리오 | `ontology/booking-saga.yaml` |
| **L5** | Knowledge Graph | - 이벤트 저장소<br/>- 프로젝션<br/>- 이벤트 버전 관리 | `ontology/banking-kg.yaml` |

## Level 1-2: 경량~표준 온톨로지

### 포커스
엔티티와 관계 정의

### 작성 원칙
- 명확한 엔티티 경계
- 필수 속성 명시
- 기본 불변조건 정의

### 예시

```yaml
# 엔티티 정의
entities:
  Order:
    attributes:
      - orderId: string
      - customerId: string
      - items: list<OrderItem>
    invariants:
      - orderId must be unique
      - items must not be empty

# 관계 정의
relationships:
  - Customer hasMany Order
  - Order hasMany OrderItem
```

## Level 3-4: 풀 온톨로지 + Saga

### 포커스
이벤트 스키마 + 보상 로직

### 작성 원칙
- 이벤트 계약 명시
- 보상 로직 정의
- 타임아웃/재시도 정책

### 예시

```yaml
# 이벤트 계약
events:
  OrderCreated:
    schema: {...}
    producers: [OrderService]
    consumers: [InventoryService, NotificationService]
    idempotencyKey: orderId

# Saga 정의
saga:
  steps:
    - action: reserveInventory
      compensation: releaseInventory
      timeout: 5s
```

## Level 5: Knowledge Graph

### 포커스
이벤트 소싱 + 프로젝션

### 작성 원칙
- 이벤트 버전 관리
- 프로젝션 로직 명시
- 이벤트 리플레이 전략

### 예시

```yaml
# 이벤트 저장소
eventStore:
  aggregateRoot: BankAccount
  snapshotStrategy: every 100 events

# 프로젝션
projections:
  AccountBalanceView:
    source: [AccountOpened, MoneyDeposited]
    target: read_db.account_balance
```

## SemanticForge 패턴 (L5 전용)

Level 5 프로젝트는 [온톨로지 엔지니어링](../../../methodology/ontology-engineering.md)의 SemanticForge 패턴을 적용합니다.

**핵심 특징:**
- 이벤트 = 도메인 지식의 원자 단위
- Knowledge Graph로 이벤트 간 관계 표현
- 프로젝션 = Knowledge Graph 쿼리

**참고:** [온톨로지 엔지니어링](../../../methodology/ontology-engineering.md)에서 세부 가이드 확인

## 다음 단계

- [하네스 체크리스트](./harness-checklist.md): 패턴별 필수 하네스
- [검증 방법론](./verification.md): 온톨로지 검증 방법
