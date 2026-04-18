---
title: "하네스 체크리스트"
sidebar_label: "하네스 체크리스트"
sidebar_position: 2
description: "MSA 패턴별 필수 하네스와 구현 가이드"
tags: [harness, testing, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 하네스 체크리스트

패턴별 필수 하네스와 선택 하네스를 정리합니다.

## 패턴별 필수 하네스

| 패턴 | 필수 하네스 | 선택 하네스 | 우선순위 |
|------|-----------|-----------|---------|
| **L1: CRUD** | - API 계약 검증<br/>- 기본 단위 테스트<br/>- 통합 테스트 | - 성능 테스트<br/>- 보안 스캔 | P0 |
| **L2: 동기 MSA** | - 서비스 계약 검증<br/>- 타임아웃/재시도<br/>- 서킷 브레이커<br/>- Contract Testing | - 카오스 엔지니어링<br/>- 부하 테스트 | P1 |
| **L3: 비동기 이벤트** | - 이벤트 스키마 검증<br/>- 멱등성 하네스<br/>- 이벤트 순서 검증<br/>- Eventually Consistent 테스트 | - 이벤트 리플레이<br/>- Dead Letter Queue | P1 |
| **L4: Saga** | - Saga 단계 검증<br/>- 보상 트랜잭션 검증<br/>- 실패 시나리오 테스트<br/>- 타임아웃 하네스 | - 분산 추적<br/>- 카오스 엔지니어링 | P0 |
| **L5: Event Sourcing** | - 이벤트 스키마 검증<br/>- 프로젝션 검증<br/>- 이벤트 리플레이<br/>- 이벤트 마이그레이션 | - Snapshot 전략<br/>- 성능 테스트 | P0 |

## 하네스 구현 예시

### 멱등성 하네스 (L3+)

```python
# harness/idempotency_test.py
def test_duplicate_event_handling():
    """동일 이벤트를 여러 번 받아도 결과가 동일한지 검증"""
    event = OrderCreatedEvent(orderId="123", ...)
    
    # 첫 번째 처리
    result1 = event_handler.handle(event)
    state1 = get_order_state("123")
    
    # 두 번째 처리 (중복)
    result2 = event_handler.handle(event)
    state2 = get_order_state("123")
    
    # 결과가 동일해야 함
    assert result1 == result2
    assert state1 == state2
```

### 보상 트랜잭션 하네스 (L4+)

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
    
    # 3. Payment 실패 시뮬레이션
    with pytest.raises(PaymentFailedException):
        saga.execute_step("ChargePayment")
    
    # 4. 보상 트랜잭션 검증
    saga.compensate()
    assert not hotel_service.is_reserved("hotel456")  # 취소됨
    assert not flight_service.is_reserved("flight123")  # 취소됨
```

### 프로젝션 검증 하네스 (L5)

```python
# harness/projection_test.py
def test_projection_consistency():
    """이벤트 소싱 프로젝션이 정확한지 검증"""
    # 1. 이벤트 생성
    events = [
        AccountOpenedEvent(accountId="A1", balance=1000),
        MoneyDepositedEvent(accountId="A1", amount=500),
        MoneyWithdrawnEvent(accountId="A1", amount=200),
    ]
    
    # 2. 이벤트 저장
    for event in events:
        event_store.append(event)
    
    # 3. 프로젝션 업데이트
    projection_service.rebuild("AccountBalanceView")
    
    # 4. Read Model 검증
    balance_view = read_db.get_account_balance("A1")
    assert balance_view.balance == 1300  # 1000 + 500 - 200
    assert balance_view.version == 3
```

## 하네스 우선순위 가이드

### P0 (필수)
프로젝트 실패 시 데이터 손실 또는 심각한 비즈니스 영향
- 예: 보상 트랜잭션 검증, 이벤트 스키마 검증

### P1 (강력 권장)
프로젝트 실패 시 서비스 장애 또는 사용자 경험 저하
- 예: 타임아웃/재시도, 멱등성 검증

### P2 (선택)
품질 향상 또는 운영 편의성
- 예: 성능 테스트, 카오스 엔지니어링

## CI/CD 통합

### 자동화 파이프라인

```yaml
# .github/workflows/aidlc-validation.yml
name: AIDLC Validation

on: [push, pull_request]

jobs:
  validate-ontology:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Ontology
        run: |
          aidlc-cli validate-ontology --path ontology/
  
  run-harness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Harness Tests
        run: |
          aidlc-cli run-harness --suite saga
          aidlc-cli run-harness --suite idempotency
  
  quality-gate:
    runs-on: ubuntu-latest
    needs: [validate-ontology, run-harness]
    steps:
      - name: Check Quality Gate
        run: |
          aidlc-cli quality-gate --threshold 80
```

## 다음 단계

- [검증 방법론](./verification.md): 하네스 검증 및 품질 보증
- [온톨로지 가이드](./ontology-guide.md): 온톨로지 작성 방법
