---
title: "本体编写指南"
sidebar_label: "本体指南"
sidebar_position: 1
description: "按 MSA 复杂度划分的本体深度和编写指南"
tags: [ontology, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 本体编写指南

整理按复杂度划分的推荐本体水平和编写指南。

## 按级别划分的本体水平

| 复杂度 | 本体水平 | 包含要素 | 示例文件 |
|--------|---------|---------|---------|
| **L1** | 轻量 Schema | - 实体定义<br/>- 属性<br/>- 基本不变条件 | `ontology/user-schema.yaml` |
| **L2** | 标准本体 | - 实体 + 关系<br/>- 服务契约<br/>- Bounded Context | `ontology/order-service.yaml` |
| **L3** | 完整本体 | - 事件 Schema<br/>- 事件顺序<br/>- 幂等性键 | `ontology/order-events.yaml` |
| **L4** | 完整本体 + Saga | - Saga 步骤<br/>- 补偿逻辑<br/>- 失败场景 | `ontology/booking-saga.yaml` |
| **L5** | Knowledge Graph | - 事件存储<br/>- 投影<br/>- 事件版本管理 | `ontology/banking-kg.yaml` |

## Level 1-2: 轻量~标准本体

### 重点
实体和关系定义

### 编写原则
- 明确的实体边界
- 明确必需属性
- 定义基本不变条件

### 示例

```yaml
# 实体定义
entities:
  Order:
    attributes:
      - orderId: string
      - customerId: string
      - items: list<OrderItem>
    invariants:
      - orderId must be unique
      - items must not be empty

# 关系定义
relationships:
  - Customer hasMany Order
  - Order hasMany OrderItem
```

## Level 3-4: 完整本体 + Saga

### 重点
事件 Schema + 补偿逻辑

### 编写原则
- 明确事件契约
- 定义补偿逻辑
- 超时/重试策略

### 示例

```yaml
# 事件契约
events:
  OrderCreated:
    schema: {...}
    producers: [OrderService]
    consumers: [InventoryService, NotificationService]
    idempotencyKey: orderId

# Saga 定义
saga:
  steps:
    - action: reserveInventory
      compensation: releaseInventory
      timeout: 5s
```

## Level 5: Knowledge Graph

### 重点
Event Sourcing + 投影

### 编写原则
- 事件版本管理
- 明确投影逻辑
- 事件重放策略

### 示例

```yaml
# 事件存储
eventStore:
  aggregateRoot: BankAccount
  snapshotStrategy: every 100 events

# 投影
projections:
  AccountBalanceView:
    source: [AccountOpened, MoneyDeposited]
    target: read_db.account_balance
```

## SemanticForge 模式（L5 专用）

Level 5 项目应用[本体工程](../../../methodology/ontology-engineering.md)的 SemanticForge 模式。

**核心特征:**
- 事件 = 领域知识的原子单位
- 用 Knowledge Graph 表示事件间关系
- 投影 = Knowledge Graph 查询

**参考:** 在[本体工程](../../../methodology/ontology-engineering.md)中查看详细指南

## 下一步

- [Harness 检查清单](./harness-checklist.md): 按模式划分的必需 Harness
- [验证方法论](./verification.md): 本体验证方法
