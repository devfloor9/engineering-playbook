---
title: "Harness 检查清单"
sidebar_label: "Harness 检查清单"
sidebar_position: 2
description: "按 MSA 模式划分的必需 Harness 和实现指南"
tags: [harness, testing, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Harness 检查清单

整理按模式划分的必需 Harness 和可选 Harness。

## 按模式划分的必需 Harness

| 模式 | 必需 Harness | 可选 Harness | 优先级 |
|------|------------|------------|--------|
| **L1: CRUD** | - API 契约验证<br/>- 基本单元测试<br/>- 集成测试 | - 性能测试<br/>- 安全扫描 | P0 |
| **L2: 同步 MSA** | - 服务契约验证<br/>- 超时/重试<br/>- 断路器<br/>- Contract Testing | - 混沌工程<br/>- 负载测试 | P1 |
| **L3: 异步事件** | - 事件 Schema 验证<br/>- 幂等性 Harness<br/>- 事件顺序验证<br/>- Eventually Consistent 测试 | - 事件重放<br/>- Dead Letter Queue | P1 |
| **L4: Saga** | - Saga 步骤验证<br/>- 补偿事务验证<br/>- 失败场景测试<br/>- 超时 Harness | - 分布式追踪<br/>- 混沌工程 | P0 |
| **L5: Event Sourcing** | - 事件 Schema 验证<br/>- 投影验证<br/>- 事件重放<br/>- 事件迁移 | - Snapshot 策略<br/>- 性能测试 | P0 |

## Harness 实现示例

### 幂等性 Harness (L3+)

```python
# harness/idempotency_test.py
def test_duplicate_event_handling():
    """验证多次接收相同事件时结果是否一致"""
    event = OrderCreatedEvent(orderId="123", ...)
    
    # 第一次处理
    result1 = event_handler.handle(event)
    state1 = get_order_state("123")
    
    # 第二次处理（重复）
    result2 = event_handler.handle(event)
    state2 = get_order_state("123")
    
    # 结果应该一致
    assert result1 == result2
    assert state1 == state2
```

### 补偿事务 Harness (L4+)

```python
# harness/saga_compensation_test.py
def test_saga_compensation():
    """验证 Saga 失败时补偿逻辑是否正确工作"""
    saga = TravelBookingSaga()
    
    # 1. Flight 预订成功
    saga.execute_step("ReserveFlight")
    assert flight_service.is_reserved("flight123")
    
    # 2. Hotel 预订成功
    saga.execute_step("ReserveHotel")
    assert hotel_service.is_reserved("hotel456")
    
    # 3. Payment 失败模拟
    with pytest.raises(PaymentFailedException):
        saga.execute_step("ChargePayment")
    
    # 4. 补偿事务验证
    saga.compensate()
    assert not hotel_service.is_reserved("hotel456")  # 已取消
    assert not flight_service.is_reserved("flight123")  # 已取消
```

### 投影验证 Harness (L5)

```python
# harness/projection_test.py
def test_projection_consistency():
    """验证事件溯源投影是否准确"""
    # 1. 创建事件
    events = [
        AccountOpenedEvent(accountId="A1", balance=1000),
        MoneyDepositedEvent(accountId="A1", amount=500),
        MoneyWithdrawnEvent(accountId="A1", amount=200),
    ]
    
    # 2. 保存事件
    for event in events:
        event_store.append(event)
    
    # 3. 更新投影
    projection_service.rebuild("AccountBalanceView")
    
    # 4. 验证 Read Model
    balance_view = read_db.get_account_balance("A1")
    assert balance_view.balance == 1300  # 1000 + 500 - 200
    assert balance_view.version == 3
```

## Harness 优先级指南

### P0（必需）
项目失败时会导致数据丢失或严重业务影响
- 示例: 补偿事务验证、事件 Schema 验证

### P1（强烈推荐）
项目失败时会导致服务故障或用户体验下降
- 示例: 超时/重试、幂等性验证

### P2（可选）
提高质量或运营便利性
- 示例: 性能测试、混沌工程

## CI/CD 集成

### 自动化流水线

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

## 下一步

- [验证方法论](./verification.md): Harness 验证和质量保证
- [本体指南](./ontology-guide.md): 本体编写方法
