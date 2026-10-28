---
title: MSA Complexity Guide (Enterprise)
description: Diagnose MSA difficulty as Level 1-5 in enterprise environments and provide integrated pattern-specific guides, harnesses, and verification
created: "2026-04-18"
last_update:
  date: 2026-10-28
  author: devfloor9
reading_time: 14
tags:
  - msa
  - aidlc
  - enterprise
  - patterns
  - scope:enterprise
sidebar_label: MSA Complexity
sidebar_position: 3
---

A guide to evaluate project suitability for AIDLC (AI-Driven Development Life Cycle) and determine ontology and harness strategies based on MSA difficulty levels.

## Why MSA Complexity Matters

### Simple CRUD vs Complex MSA

AIDLC is not uniformly applicable to all projects. The application approach must vary based on technical complexity and organizational readiness.

**Simple CRUD Project Characteristics:**
- Single service, single database
- Synchronous request-response patterns
- Clear transaction boundaries
- Simple rollback (DB transactions sufficient)

**Complex MSA Project Characteristics:**
- Multiple independent services, distributed data
- Asynchronous event-driven communication
- Distributed transactions (Saga, compensating transactions)
- Eventually Consistent data models
- Complex inter-service dependencies

### AIDLC Application Differences

The complexity-to-application mappings in the table below, and the Go/No-Go and readiness rules that follow, are team-level heuristics (illustrative starting points) that this guide proposes, not universal thresholds. Each organization should adjust them to its own domain risk and capability.

**Table 1. AIDLC application, ontology, and harness level by complexity**

| Complexity | AIDLC Application | Ontology Level | Harness Level |
|--------|----------------|--------------|------------|
| **Simple CRUD** | Full immediate adoption | Lightweight schema | Basic Quality Gate |
| **Synchronous MSA** | DDD integration required | Standard ontology | Service contract verification |
| **Async Events** | Event schema ontology required | Full ontology | Event schema + idempotency |
| **Saga/CQRS** | Full AIDLC + expert required | Knowledge Graph | Compensating transaction verification |

**Core Principles:**
- Higher complexity requires more sophisticated ontology and harnesses
- Lower organizational readiness requires phased adoption
- Imbalance between technical complexity and organizational readiness risks project failure

## AIDLC Difficulty Matrix

Evaluate **Technical Complexity** and **Organizational Readiness** on two axes to determine AIDLC application strategy.

### Axis 1: Technical Complexity

**Table 2. Technical complexity levels (L1-L5): description, characteristics, examples**

| Level | Description | Characteristics | Examples |
|-------|------|------|------|
| **L1** | Single Service CRUD | - Single DB<br/>- Synchronous API<br/>- Simple transactions | User management service |
| **L2** | Synchronous MSA | - Multiple services<br/>- REST/gRPC orchestration<br/>- Distributed DB | Order-Inventory-Payment MSA |
| **L3** | Async Event-Driven | - Event bus<br/>- Eventually Consistent<br/>- Domain events | Event-sourced order system |
| **L4** | Saga + Compensating Transactions | - Distributed transactions<br/>- Compensation logic<br/>- Orchestration/Choreography | Travel booking Saga |
| **L5** | Distributed Tx + CQRS + Event Sourcing | - Read/Write separation<br/>- Event store<br/>- Complex projections | Financial trading platform |

CQRS, event sourcing, and distributed transactions are independent design choices that need not appear together. For example, you can apply CQRS without event sourcing, or use Saga-based distributed transactions without CQRS. The L1-L5 ordinal above is a rough proxy for overall complexity, not a dependency chain in which each level builds on the previous one.

### Axis 2: Organizational Readiness

**Table 3. Organizational readiness levels (A-D): description, characteristics, checklist**

| Level | Description | Characteristics | Checklist |
|-------|------|------|-----------|
| **A** | No Champion | - No AIDLC experience<br/>- No DDD experience<br/>- No ontology understanding | ☐ AIDLC training required<br/>☐ POC project needed |
| **B** | Single Champion | - 1 AIDLC expert<br/>- Team training required<br/>- Guide-dependent | ☐ Verify champion capability<br/>☐ Team onboarding plan |
| **C** | Team Experience | - Multiple AIDLC practitioners<br/>- Practical DDD experience<br/>- Ontology design capable | ☐ Team review process<br/>☐ Best practice sharing |
| **D** | Org Standard | - Organization-wide AIDLC standard<br/>- Ontology reuse library<br/>- Harness templates | ☐ Org standard docs<br/>☐ Reusable assets |

### Difficulty Matrix (Recommended Application Strategy)

**Figure 1. Recommended application strategy matrix by technical complexity and organizational readiness**

```mermaid
graph TB
    subgraph "Difficulty Matrix"
        style L1A fill:#90EE90
        style L1B fill:#90EE90
        style L1C fill:#90EE90
        style L1D fill:#90EE90

        style L2A fill:#FFD700
        style L2B fill:#90EE90
        style L2C fill:#90EE90
        style L2D fill:#90EE90

        style L3A fill:#FF6347
        style L3B fill:#FFD700
        style L3C fill:#90EE90
        style L3D fill:#90EE90

        style L4A fill:#FF0000
        style L4B fill:#FF6347
        style L4C fill:#FFD700
        style L4D fill:#90EE90

        style L5A fill:#FF0000
        style L5B fill:#FF0000
        style L5C fill:#FF6347
        style L5D fill:#FFD700

        L1A["L1-A<br/>🟢 Ready"]
        L1B["L1-B<br/>🟢 Ready"]
        L1C["L1-C<br/>🟢 Ready"]
        L1D["L1-D<br/>🟢 Ready"]

        L2A["L2-A<br/>🟡 POC Required"]
        L2B["L2-B<br/>🟢 After Training"]
        L2C["L2-C<br/>🟢 Ready"]
        L2D["L2-D<br/>🟢 Ready"]

        L3A["L3-A<br/>🔴 High Risk"]
        L3B["L3-B<br/>🟡 Expert Needed"]
        L3C["L3-C<br/>🟢 Team Review"]
        L3D["L3-D<br/>🟢 Ready"]

        L4A["L4-A<br/>⛔ Not Recommended"]
        L4B["L4-B<br/>🔴 High Risk"]
        L4C["L4-C<br/>🟡 Proceed Carefully"]
        L4D["L4-D<br/>🟢 Feasible"]

        L5A["L5-A<br/>⛔ Not Recommended"]
        L5B["L5-B<br/>⛔ Not Recommended"]
        L5C["L5-C<br/>🔴 Expert Required"]
        L5D["L5-D<br/>🟡 Proceed Carefully"]
    end
```

**Color Legend:**
- **Green (Ready):** Full AIDLC application recommended
- **Yellow (Caution):** Phased adoption or expert support required
- **Red (High Risk):** High risk, proceed after sufficient preparation
- **Red (Not Recommended):** Improve organizational readiness first

## Go/No-Go Decision Tree

Flowchart for deciding whether to apply AIDLC to a project.

**Figure 2. Go/No-Go decision tree for whether to apply AIDLC**

```mermaid
graph TB
    Start([AIDLC Application Review]) --> Q1{Project Scale?}

    Q1 -->|Small<br/>Single Service| Q2A{Team AIDLC Experience?}
    Q1 -->|Medium<br/>Sync MSA| Q2B{Team AIDLC Experience?}
    Q1 -->|Large<br/>Async/Saga| Q2C{Team AIDLC Experience?}

    Q2A -->|Yes| Go1[✅ Go Immediately]
    Q2A -->|No| Q3A{Quick Learning Possible?}
    Q3A -->|Yes| Go2[✅ Go<br/>With Training]
    Q3A -->|No| Partial1[⚠️ Partial<br/>POC First]

    Q2B -->|Yes| Q3B{DDD Experience?}
    Q2B -->|No| Partial2[⚠️ Partial<br/>DDD Training First]
    Q3B -->|Yes| Go3[✅ Go]
    Q3B -->|No| Partial3[⚠️ Partial<br/>DDD Integration Required]

    Q2C -->|Yes| Q3C{Saga/Event Sourcing<br/>Experience?}
    Q2C -->|No| NoGo1[🛑 No-Go<br/>Insufficient Readiness]
    Q3C -->|Yes| Q4C{Expert Support Available?}
    Q3C -->|No| NoGo2[🛑 No-Go<br/>Expert Required]
    Q4C -->|Yes| Go4[✅ Go<br/>Expert Review Required]
    Q4C -->|No| Partial4[⚠️ Partial<br/>After Expert Secured]

    style Go1 fill:#90EE90
    style Go2 fill:#90EE90
    style Go3 fill:#90EE90
    style Go4 fill:#90EE90
    style Partial1 fill:#FFD700
    style Partial2 fill:#FFD700
    style Partial3 fill:#FFD700
    style Partial4 fill:#FFD700
    style NoGo1 fill:#FF6347
    style NoGo2 fill:#FF6347
```

### Decision Criteria

Every combination of technical complexity (L1-L5), organizational readiness (A-D), and whether expert support is available maps to exactly one outcome (Go/Partial/No-Go) in the table below. Every cell is covered exactly once with no overlap. Expert availability only disambiguates L4-C, L4-D, L5-C, and L5-D.

**Table 4. Go/Partial/No-Go decision by technical complexity, organizational readiness, and expert support**

| Technical Complexity | Readiness A | Readiness B | Readiness C | Readiness D |
|------------|---------|---------|---------|---------|
| **L1** | Partial | Go | Go | Go |
| **L2** | Partial | Go | Go | Go |
| **L3** | Partial | Partial | Go | Go |
| **L4** | No-Go | Partial | Go if expert, else Partial | Go if expert, else Partial |
| **L5** | No-Go | No-Go | Go if expert, else Partial | Go if expert, else Partial |

The action for each outcome is as follows.

#### Go (Proceed Immediately)

Apply full AIDLC, write the ontology and harnesses, and run agent-based code generation. Expert review is required for L4-5 Go cases.

#### Partial (Phased Approach)

Run a POC project first, complete the training program, secure expert support, then adopt AIDLC in phases.

#### No-Go (Do Not Proceed)

Improve organizational readiness through training and POC, hire an expert or engage consulting, then re-evaluate.

### Risk Assessment Matrix

**Table 5. High/Medium/Low criteria by risk factor**

| Risk Factor | High | Medium | Low |
|-----------|---------|---------|---------|
| **Technical Complexity** | L4-5 | L2-3 | L1 |
| **Organizational Readiness** | A (No experience) | B (Single champion) | C-D (Team/org experience) |
| **Data Sensitivity** | Financial, Healthcare | Personal data | Non-sensitive |
| **Project Scale** | 20+ services | 5-20 services | 1-5 services |
| **Timeline Pressure** | < 3 months | 3-6 months | 6+ months |

**Overall Risk Assessment:**
- 3+ High: No-Go
- 1-2 High: Partial (phased approach)
- 0 High: Go

## Detailed Guides

import DocCardList from '@theme/DocCardList';

<DocCardList />

## Next Steps

- [DDD Integration](../../methodology/ddd-integration.md): Integrating Domain-Driven Design with AIDLC
- [Ontology Engineering](../../methodology/ontology-engineering.md): Detailed ontology design guide
- [Harness Engineering](../../methodology/harness-engineering.md): Harness implementation best practices
- [Adoption Strategy](../adoption-strategy.md): Organization-wide AIDLC adoption roadmap

## References

- [MSA Pattern Catalog](https://microservices.io/patterns/)
- [Saga Pattern Guide](https://microservices.io/patterns/data/saga.html)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
