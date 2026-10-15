---
title: "Level 1-2: 단순 CRUD & 동기 MSA"
description: Level 1 단순 CRUD 서비스와 Level 2 동기 MSA 오케스트레이션 패턴 적용 가이드
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 3
tags:
  - msa
  - aidlc
  - crud
  - synchronous
  - scope:enterprise
sidebar_label: "L1-L2: 단순 MSA"
sidebar_position: 1
---

단순 서비스부터 동기 MSA까지, 상대적으로 낮은 복잡도의 AIDLC 적용 가이드입니다.

## Level 1: 단순 서비스 CRUD

**특징:**
- 단일 서비스, 단일 데이터베이스
- REST API (CRUD 엔드포인트)
- 명확한 트랜잭션 경계
- 롤백이 단순 (DB 트랜잭션)

**AIDLC 적용 방법:**

**그림 1. Level 1 단순 CRUD의 AIDLC 적용 흐름**

```mermaid
graph LR
    A[요구사항] --> B[경량 온톨로지]
    B --> C[엔티티 스키마]
    C --> D[기본 하네스]
    D --> E[Quality Gate]
    E --> F[배포]

    style B fill:#E8F5E9
    style D fill:#E3F2FD
```

### 온톨로지 수준

**경량 스키마:** 엔티티 정의, 속성, 기본 관계만
- YAML/JSON 스키마 파일
- 복잡한 도메인 모델링 불필요

**예시 온톨로지:**

아래 `invariants` 항목은 실행 가능한 제약 구문이 아니라 도메인 맥락을 사람이 읽도록 적은 예시 표기입니다. 실제 검증 규칙은 서비스의 스키마·검증 코드로 구현합니다.

```yaml
# ontology/user-service.yaml
entities:
  User:
    attributes:
      - id: string (UUID)
      - name: string
      - email: string (unique)
      - createdAt: timestamp
    invariants:
      - email must be valid format
      - name length 2-50 characters

  Role:
    attributes:
      - id: string
      - name: string
      - permissions: list<string>

relationships:
  - User hasMany Role
```

### 하네스 체크리스트

- 적용: API 계약 검증
- 적용: 데이터 검증 (입력/출력)
- 적용: 기본 단위 테스트
- 적용: 통합 테스트 (DB 포함)
- 제외: 분산 트랜잭션 검증 (불필요)

### 적용 전략

- 도메인·데이터 위험이 낮은 경우 Full AIDLC 즉시 적용 가능 (단, 금융·의료·개인정보 등 규제·민감 도메인의 단순 CRUD 서비스는 더 무거운 하네스와 리뷰 경로가 필요)
- Agent 기반 코드 생성 활용
- 온톨로지는 스키마 정의 수준으로 충분
- 하네스는 기본 Quality Gate로 시작

## Level 2: 동기 MSA 오케스트레이션

**특징:**
- 다수의 독립 서비스
- REST/gRPC 동기 호출
- 오케스트레이터 패턴 (주문 서비스가 재고/결제 호출)
- 분산 DB를 쓰며, 동기 호출로 오케스트레이션하지만 서비스 간 원자적(ACID) 트랜잭션은 제공하지 않음 (서비스 간 일관성은 L2에서도 Saga/아웃박스가 필요)

**AIDLC 적용 방법:**

**그림 2. Level 2 동기 MSA 오케스트레이션의 AIDLC 적용 흐름**

```mermaid
graph LR
    A[요구사항] --> B[DDD 통합]
    B --> C[Bounded Context 정의]
    C --> D[서비스 계약 온톨로지]
    D --> E[서비스 계약 하네스]
    E --> F[통합 테스트]
    F --> G[배포]

    style B fill:#FFF9C4
    style D fill:#E8F5E9
    style E fill:#E3F2FD
```

### 온톨로지 수준

**표준 온톨로지:** 엔티티 + 관계 + 불변조건
- Bounded Context별 온톨로지 분리
- 서비스 간 계약 (API 스펙) 명시

**예시 온톨로지 (서비스 계약):**

```yaml
# ontology/order-service.yaml
boundedContext: OrderManagement

entities:
  Order:
    attributes:
      - orderId: string
      - userId: string
      - items: list<OrderItem>
      - status: OrderStatus (PENDING, CONFIRMED, CANCELLED)
    invariants:
      - total amount must match sum of item prices
      - order must have at least 1 item

serviceContracts:
  - name: CreateOrder
    input: CreateOrderRequest
    output: OrderResponse
    dependencies:
      - InventoryService.checkStock
      - PaymentService.processPayment
    timeout: 5s
    retryPolicy: exponentialBackoff(3)
```

`PaymentService.processPayment`처럼 돈이 움직이는 호출을 재시도할 때는 멱등성 키를 함께 전달해, 멱등하거나 명확히 실패한 결과에 대해서만 재시도합니다. 타임아웃처럼 성공 여부가 불확실한(unknown) 결과는 맹목적으로 재시도하지 말고, 결제 상태를 조회해 확정(reconcile)한 뒤 처리해야 합니다.

### 하네스 체크리스트

- 적용: 서비스 계약 검증 (OpenAPI/gRPC)
- 적용: 서비스 간 통합 테스트
- 적용: 타임아웃 + 재시도 정책
- 적용: 서킷 브레이커 검증
- 제외: 보상 트랜잭션 (아직 불필요)

### 적용 전략

- DDD 통합 필수 (Bounded Context 정의)
- 서비스 계약 온톨로지 명시
- 하네스에 타임아웃/재시도/서킷브레이커 추가
- Contract Testing 도입 (Pact, Spring Cloud Contract)

## 다음 단계

더 복잡한 비동기 패턴과 Saga 패턴을 다루는 가이드:

- [Level 3-4: 비동기 이벤트 & Saga](./l3-l4-async-saga.md)
- [Level 5: Event Sourcing](./l5-event-sourcing.md)
