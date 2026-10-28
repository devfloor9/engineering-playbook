---
title: "Level 3-4: 비동기 이벤트 & Saga"
description: Level 3 비동기 이벤트 기반 MSA와 Level 4 Saga + 보상 트랜잭션 패턴 적용 가이드
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 3
tags:
  - msa
  - aidlc
  - async
  - saga
  - event-driven
  - scope:enterprise
sidebar_label: "L3-L4: 비동기 & Saga"
sidebar_position: 2
---

이벤트 기반 아키텍처와 분산 트랜잭션을 다루는 중급~고급 복잡도 패턴입니다.

## Level 3: 비동기 이벤트 기반 MSA

**특징:**
- 이벤트 버스 (Kafka, RabbitMQ, EventBridge)
- Eventually Consistent 데이터 모델
- 도메인 이벤트 발행/구독
- 비동기 통신, 느슨한 결합

**AIDLC 적용 방법:**

**그림 1. Level 3 비동기 이벤트 기반 MSA의 AIDLC 적용 흐름**

```mermaid
graph LR
    A[요구사항] --> B[이벤트 스토밍]
    B --> C[이벤트 스키마 온톨로지]
    C --> D[멱등성 하네스]
    D --> E[이벤트 스키마 검증]
    E --> F[Eventually Consistent 테스트]
    F --> G[배포]

    style B fill:#FFF9C4
    style C fill:#E8F5E9
    style D fill:#E3F2FD
```

### 온톨로지 수준

**풀 온톨로지:** 엔티티 + 관계 + 이벤트 스키마 + 불변조건
- 이벤트 계약 명시 (스키마 레지스트리)
- 이벤트 순서/의존성 정의

**예시 온톨로지 (이벤트 스키마):**

```yaml
# ontology/order-events.yaml
events:
  OrderCreated:
    schema:
      eventId: string
      orderId: string
      sequence: long
      userId: string
      items: list<OrderItem>
      createdAt: timestamp
    producers:
      - OrderService
    consumers:
      - InventoryService (재고 차감)
      - NotificationService (알림 발송)
    idempotencyKey: eventId
    partitionKey: orderId
    ordering: 파티션(orderId)별 sequence 단조 증가

  OrderConfirmed:
    schema:
      eventId: string
      orderId: string
      sequence: long
      confirmedAt: timestamp
    producers:
      - PaymentService
    consumers:
      - ShippingService
    idempotencyKey: eventId
    partitionKey: orderId

invariants:
  - OrderCreated must precede OrderConfirmed
  - OrderCancelled cannot follow OrderShipped
```

### 하네스 체크리스트

- 적용: 이벤트 스키마 검증 (Avro, Protobuf)
- 적용: 멱등성 하네스 (중복 이벤트 처리)
- 적용: 이벤트 순서 검증
- 적용: Eventually Consistent 테스트 (Eventual 상태 검증)
- 적용: Dead Letter Queue 처리

### 적용 전략

- 이벤트 스토밍으로 이벤트 정의
- 이벤트 스키마 온톨로지 필수
- 멱등성 하네스 (중복 이벤트 대응)
- 이벤트 스키마 레지스트리 (Schema Registry) 연동
- Eventual Consistency 테스트 자동화

## Level 4: Saga + 보상 트랜잭션

**특징:**
- 분산 트랜잭션 (Saga 패턴)
- 보상 트랜잭션 (Compensating Transaction)
- 오케스트레이션 Saga 또는 코레오그래피 Saga
- 복잡한 실패 시나리오

**AIDLC 적용 방법:**

**그림 2. Level 4 Saga + 보상 트랜잭션의 AIDLC 적용 흐름**

```mermaid
graph TB
    A[요구사항] --> B[Saga 설계]
    B --> C[풀 온톨로지 + 보상 로직]
    C --> D[Saga 하네스]
    D --> E[보상 트랜잭션 검증]
    E --> F[실패 시나리오 테스트]
    F --> G{모든 시나리오 통과?}
    G -->|Yes| H[배포]
    G -->|No| C

    style B fill:#FFF9C4
    style C fill:#E8F5E9
    style D fill:#E3F2FD
    style E fill:#FFCCBC
```

### 온톨로지 수준

**풀 온톨로지 + Saga 명세:** 엔티티 + 이벤트 + Saga 단계 + 보상 로직
- Saga 단계별 상태 전이 정의
- 보상 로직 명시 (롤백 시나리오)

**예시 온톨로지 (Saga):**

```yaml
# ontology/travel-booking-saga.yaml
saga:
  name: TravelBookingSaga
  type: orchestration
  orchestrator: BookingService

  steps:
    - name: ReserveFlight
      service: FlightService
      action: reserveFlight
      compensation: cancelFlightReservation
      timeout: 10s
      retryPolicy: exponentialBackoff(3)

    - name: ReserveHotel
      service: HotelService
      action: reserveHotel
      compensation: cancelHotelReservation
      timeout: 10s
      retryPolicy: exponentialBackoff(3)

    - name: ChargePayment
      service: PaymentService
      action: chargeCard
      compensation: refundPayment
      timeout: 5s
      retryPolicy: none
      onUnknownOutcome: reconcile

  failureScenarios:
    - scenario: FlightReservationFailed
      compensations:
        - (none, 첫 단계 실패)

    - scenario: HotelReservationFailed
      compensations:
        - cancelFlightReservation

    - scenario: PaymentFailed
      compensations:
        - cancelHotelReservation
        - cancelFlightReservation

    - scenario: PaymentUnknown
      description: 타임아웃 등으로 결제 성공 여부가 불확실한 상태. 결제 상태를 조회(reconcile)해 확정한 뒤 보상 또는 완료를 결정합니다.
      action:
        - queryPaymentStatus
        - 성공으로 확정되면 완료, 실패로 확정되면 cancelHotelReservation + cancelFlightReservation

  invariants:
    - All compensations must be idempotent
    - Compensation order is reverse of execution order
    - Saga timeout = sum of (step timeout x max retries) + compensation time + buffer
```

### 하네스 체크리스트

- 적용: Saga 단계별 검증
- 적용: 보상 트랜잭션 검증 (롤백 시나리오)
- 적용: 타임아웃 하네스 (무한 대기 방지)
- 적용: 재시도 정책 검증
- 적용: 서킷 브레이커
- 적용: 분산 추적 (OpenTelemetry)

### 하네스 구현 예시

#### 보상 트랜잭션 하네스

```python
# harness/saga_compensation_test.py
def test_saga_compensation():
    """Saga 실패 시 보상 로직이 정확히 동작하는지 검증"""
    saga = TravelBookingSaga()

    # 1. Flight 예약 성공
    saga.execute_step("ReserveFlight")
    assert flight_service.is_reserved("flight123")

    # 2. Hotel 예약 성공
    saga.execute_step("ReserveHotel")
    assert hotel_service.is_reserved("hotel456")

    # 3. Payment 실패 시 Saga가 자동으로 보상을 트리거
    with pytest.raises(PaymentFailedException):
        saga.execute_step("ChargePayment")

    # 4. 오케스트레이터가 실패 시 실행한 보상 트랜잭션 검증
    assert saga.status == "compensated"
    assert not hotel_service.is_reserved("hotel456")  # 취소됨
    assert not flight_service.is_reserved("flight123")  # 취소됨
```

### 적용 전략

- Saga 설계 필수 (오케스트레이션 vs 코레오그래피)
- 보상 로직 온톨로지 명시
- 하네스에 보상 트랜잭션 검증 추가
- 실패 시나리오 전체 테스트 (Chaos Engineering)
- 전문가 리뷰 필수

## 다음 단계

최고 복잡도의 Event Sourcing 패턴:

- [Level 5: Event Sourcing](./l5-event-sourcing.md)
- [온톨로지 작성 가이드](../implementation/ontology-guide.md)
- [하네스 체크리스트](../implementation/harness-checklist.md)
