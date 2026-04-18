---
title: "Ontology Writing Guide"
sidebar_label: "Ontology Guide"
sidebar_position: 1
description: "Ontology depth and writing guidelines by MSA complexity level"
tags: [ontology, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Ontology Writing Guide

Recommended ontology levels and writing guidelines organized by complexity.

## Ontology Levels by Complexity

| Complexity | Ontology Level | Included Elements | Example File |
|--------|--------------|-----------|----------|
| **L1** | Lightweight Schema | - Entity definitions<br/>- Attributes<br/>- Basic invariants | `ontology/user-schema.yaml` |
| **L2** | Standard Ontology | - Entities + relationships<br/>- Service contracts<br/>- Bounded Context | `ontology/order-service.yaml` |
| **L3** | Full Ontology | - Event schemas<br/>- Event ordering<br/>- Idempotency keys | `ontology/order-events.yaml` |
| **L4** | Full Ontology + Saga | - Saga steps<br/>- Compensation logic<br/>- Failure scenarios | `ontology/booking-saga.yaml` |
| **L5** | Knowledge Graph | - Event store<br/>- Projections<br/>- Event version management | `ontology/banking-kg.yaml` |

## Level 1-2: Lightweight to Standard Ontology

### Focus
Entity and relationship definitions

### Writing Principles
- Clear entity boundaries
- Explicit required attributes
- Define basic invariants

### Example

```yaml
# Entity definitions
entities:
  Order:
    attributes:
      - orderId: string
      - customerId: string
      - items: list<OrderItem>
    invariants:
      - orderId must be unique
      - items must not be empty

# Relationship definitions
relationships:
  - Customer hasMany Order
  - Order hasMany OrderItem
```

## Level 3-4: Full Ontology + Saga

### Focus
Event schemas + compensation logic

### Writing Principles
- Explicit event contracts
- Define compensation logic
- Timeout/retry policies

### Example

```yaml
# Event contracts
events:
  OrderCreated:
    schema: {...}
    producers: [OrderService]
    consumers: [InventoryService, NotificationService]
    idempotencyKey: orderId

# Saga definitions
saga:
  steps:
    - action: reserveInventory
      compensation: releaseInventory
      timeout: 5s
```

## Level 5: Knowledge Graph

### Focus
Event sourcing + projections

### Writing Principles
- Event version management
- Explicit projection logic
- Event replay strategy

### Example

```yaml
# Event store
eventStore:
  aggregateRoot: BankAccount
  snapshotStrategy: every 100 events

# Projections
projections:
  AccountBalanceView:
    source: [AccountOpened, MoneyDeposited]
    target: read_db.account_balance
```

## SemanticForge Pattern (L5 Only)

Level 5 projects apply the SemanticForge pattern from [Ontology Engineering](../../../methodology/ontology-engineering.md).

**Key Features:**
- Event = atomic unit of domain knowledge
- Express event relationships as Knowledge Graph
- Projection = Knowledge Graph query

**Reference:** See [Ontology Engineering](../../../methodology/ontology-engineering.md) for detailed guide

## Next Steps

- [Harness Checklist](./harness-checklist.md): Required harnesses by pattern
- [Verification Methodology](./verification.md): Ontology verification methods
