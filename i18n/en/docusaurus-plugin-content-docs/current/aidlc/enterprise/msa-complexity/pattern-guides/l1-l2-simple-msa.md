---
title: "Level 1-2: Simple CRUD & Synchronous MSA"
sidebar_label: "L1-L2: Simple MSA"
sidebar_position: 1
description: "Application guide for Level 1 simple CRUD services and Level 2 synchronous MSA orchestration patterns"
tags: [msa, aidlc, crud, synchronous, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Level 1-2: Simple CRUD & Synchronous MSA

AIDLC application guide for simple services through synchronous MSA with relatively low complexity.

## Level 1: Simple Service CRUD

**Characteristics:**
- Single service, single database
- REST API (CRUD endpoints)
- Clear transaction boundaries
- Simple rollback (DB transactions)

**AIDLC Application:**

```mermaid
graph LR
    A[Requirements] --> B[Lightweight Ontology]
    B --> C[Entity Schema]
    C --> D[Basic Harness]
    D --> E[Quality Gate]
    E --> F[Deploy]
    
    style B fill:#E8F5E9
    style D fill:#E3F2FD
```

### Ontology Level

**Lightweight Schema:** Entity definitions, attributes, basic relationships only
- YAML/JSON schema files
- No complex domain modeling required

**Example Ontology:**

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

### Harness Checklist

- ✅ API contract verification
- ✅ Data validation (input/output)
- ✅ Basic unit tests
- ✅ Integration tests (with DB)
- ⬜ Distributed transaction verification (not needed)

### Application Strategy

- Full AIDLC can be applied immediately
- Leverage agent-based code generation
- Ontology at schema definition level is sufficient
- Start with basic Quality Gate harness

## Level 2: Synchronous MSA Orchestration

**Characteristics:**
- Multiple independent services
- REST/gRPC synchronous calls
- Orchestrator pattern (order service calls inventory/payment)
- Distributed DB, but synchronous transactions

**AIDLC Application:**

```mermaid
graph LR
    A[Requirements] --> B[DDD Integration]
    B --> C[Define Bounded Context]
    C --> D[Service Contract Ontology]
    D --> E[Service Contract Harness]
    E --> F[Integration Tests]
    F --> G[Deploy]
    
    style B fill:#FFF9C4
    style D fill:#E8F5E9
    style E fill:#E3F2FD
```

### Ontology Level

**Standard Ontology:** Entities + relationships + invariants
- Separate ontology per Bounded Context
- Explicit service contracts (API specs)

**Example Ontology (Service Contract):**

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

### Harness Checklist

- ✅ Service contract verification (OpenAPI/gRPC)
- ✅ Inter-service integration tests
- ✅ Timeout + retry policies
- ✅ Circuit breaker verification
- ⬜ Compensating transactions (not yet needed)

### Application Strategy

- DDD integration required (define Bounded Contexts)
- Explicit service contract ontology
- Add timeout/retry/circuit breaker to harness
- Introduce Contract Testing (Pact, Spring Cloud Contract)

## Next Steps

Guides covering more complex async patterns and Saga patterns:

- [Level 3-4: Async Events & Saga](./l3-l4-async-saga.md)
- [Level 5: Event Sourcing](./l5-event-sourcing.md)
