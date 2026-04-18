---
title: "Harness Checklist"
sidebar_label: "Harness Checklist"
sidebar_position: 2
description: "Required harnesses and implementation guide by MSA pattern"
tags: [harness, testing, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Harness Checklist

Required and optional harnesses organized by pattern.

## Required Harnesses by Pattern

| Pattern | Required Harnesses | Optional Harnesses | Priority |
|------|-----------|-----------|---------|
| **L1: CRUD** | - API contract verification<br/>- Basic unit tests<br/>- Integration tests | - Performance tests<br/>- Security scans | P0 |
| **L2: Sync MSA** | - Service contract verification<br/>- Timeout/retry<br/>- Circuit breaker<br/>- Contract Testing | - Chaos engineering<br/>- Load tests | P1 |
| **L3: Async Events** | - Event schema verification<br/>- Idempotency harness<br/>- Event ordering verification<br/>- Eventually Consistent tests | - Event replay<br/>- Dead Letter Queue | P1 |
| **L4: Saga** | - Saga step verification<br/>- Compensating transaction verification<br/>- Failure scenario tests<br/>- Timeout harness | - Distributed tracing<br/>- Chaos engineering | P0 |
| **L5: Event Sourcing** | - Event schema verification<br/>- Projection verification<br/>- Event replay<br/>- Event migration | - Snapshot strategy<br/>- Performance tests | P0 |

## Harness Implementation Examples

### Idempotency Harness (L3+)

```python
# harness/idempotency_test.py
def test_duplicate_event_handling():
    """Verify identical results when receiving same event multiple times"""
    event = OrderCreatedEvent(orderId="123", ...)
    
    # First processing
    result1 = event_handler.handle(event)
    state1 = get_order_state("123")
    
    # Second processing (duplicate)
    result2 = event_handler.handle(event)
    state2 = get_order_state("123")
    
    # Results must be identical
    assert result1 == result2
    assert state1 == state2
```

### Compensating Transaction Harness (L4+)

```python
# harness/saga_compensation_test.py
def test_saga_compensation():
    """Verify that compensation logic works correctly on Saga failure"""
    saga = TravelBookingSaga()
    
    # 1. Flight reservation success
    saga.execute_step("ReserveFlight")
    assert flight_service.is_reserved("flight123")
    
    # 2. Hotel reservation success
    saga.execute_step("ReserveHotel")
    assert hotel_service.is_reserved("hotel456")
    
    # 3. Payment failure simulation
    with pytest.raises(PaymentFailedException):
        saga.execute_step("ChargePayment")
    
    # 4. Compensating transaction verification
    saga.compensate()
    assert not hotel_service.is_reserved("hotel456")  # cancelled
    assert not flight_service.is_reserved("flight123")  # cancelled
```

### Projection Verification Harness (L5)

```python
# harness/projection_test.py
def test_projection_consistency():
    """Verify event sourcing projection accuracy"""
    # 1. Create events
    events = [
        AccountOpenedEvent(accountId="A1", balance=1000),
        MoneyDepositedEvent(accountId="A1", amount=500),
        MoneyWithdrawnEvent(accountId="A1", amount=200),
    ]
    
    # 2. Store events
    for event in events:
        event_store.append(event)
    
    # 3. Update projection
    projection_service.rebuild("AccountBalanceView")
    
    # 4. Verify Read Model
    balance_view = read_db.get_account_balance("A1")
    assert balance_view.balance == 1300  # 1000 + 500 - 200
    assert balance_view.version == 3
```

## Harness Priority Guide

### P0 (Required)
Project failure results in data loss or serious business impact
- Example: Compensating transaction verification, event schema verification

### P1 (Strongly Recommended)
Project failure results in service outage or user experience degradation
- Example: Timeout/retry, idempotency verification

### P2 (Optional)
Quality improvement or operational convenience
- Example: Performance tests, chaos engineering

## CI/CD Integration

### Automation Pipeline

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

## Next Steps

- [Verification Methodology](./verification.md): Harness verification and quality assurance
- [Ontology Guide](./ontology-guide.md): Ontology writing methods
