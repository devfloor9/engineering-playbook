---
title: Verification Methodology
description: Verification methods to ensure quality when applying AIDLC in complex MSA
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 8
tags:
  - verification
  - testing
  - quality
  - aidlc
  - enterprise
  - scope:enterprise
sidebar_label: Verification Methodology
sidebar_position: 3
---

Methods to ensure quality when applying AIDLC in complex MSA environments.

## Verification Checklist

### Ontology Verification

- [ ] **Completeness:** Are all entities/events defined in the ontology?
- [ ] **Consistency:** Is the ontology consistent across Bounded Contexts?
- [ ] **Accuracy:** Do invariants match business rules?
- [ ] **Traceability:** Are ontology and code synchronized?

### Harness Verification

Here "failure scenarios" refers not to arbitrary faults but to the failure types explicitly enumerated in the target system's fault model (for example, service timeouts, duplicate or lost messages, partial commits, network partitions). Record that types absent from the fault model are out of verification scope.

- [ ] **Coverage:** Are all required harnesses implemented?
- [ ] **Automation:** Are harnesses integrated into CI/CD?
- [ ] **Failure Scenarios:** Are all failure types enumerated in the documented fault model tested?
- [ ] **Performance:** Is harness execution time reasonable?

### Deployment Verification

- [ ] **Canary Deployment:** Is there a progressive rollout strategy?
- [ ] **Rollback Plan:** Can you rollback if problems occur?
- [ ] **Monitoring:** Is real-time monitoring available post-deployment?
- [ ] **Alerting:** Are anomaly detection alerts configured?

## Verification Automation

### CI/CD Pipeline

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

## Expert Review

**For complexity L4-5, expert review is a deployment-blocking gate.** Deployment cannot proceed until a designated expert (L4-5) completes the review below and records approval; this is the same pass criterion as the "Expert Review (L4-5) Required" row in the Quality Gate table above.

### Review Checklist

- [ ] Is the Saga design appropriate?
- [ ] Does compensation logic cover all failure scenarios?
- [ ] Is there an event schema version management strategy?
- [ ] Is projection logic accurate?
- [ ] Are performance/scalability considerations reflected?

### Review Process

1. **Design Review:** Review Saga/Event Sourcing design
2. **Ontology Review:** Verify ontology completeness/accuracy
3. **Harness Review:** Verify test coverage and failure scenarios
4. **Performance Review:** Review bottlenecks and scalability
5. **Security Review:** Analyze data consistency and security vulnerabilities

## Quality Gate

### Pass Criteria

**Table 1. Quality gate minimum requirement and recommended target by item**

| Item | Minimum Requirement | Recommended Target |
|------|-------------|----------|
| **Ontology Coverage** | 90% | 100% |
| **Harness Success Rate** | 95% | 100% |
| **Required Harness Implementation** | 100% | - |
| **Code Review Approval** | Required | - |
| **Expert Review (L4-5)** | Required | - |

These thresholds relate to the `aidlc-cli quality-gate --threshold 80` call in the CI/CD example above as follows. `--threshold 80` is the lower bound for the gate's **composite score** (80%), while the table's "Ontology Coverage" and "Harness Success Rate" are the **lower bounds of the individual metrics** that make up that composite score. "Required Harness Implementation 100%" means every harness classified as P0/P1 in the [Harness Checklist](./harness-checklist.md) must be implemented; P2 and below map to the recommended target. The three values measure different things, so they are not merged into a single number.

### Action on Failure

1. **Incomplete Ontology:** Add missing items and re-verify
2. **Harness Failure:** Fix bugs and re-run
3. **Performance Issues:** Resolve bottlenecks and re-measure
4. **Expert Review Failure:** Improve design and re-review

## Continuous Improvement

### Metric Tracking

- Ontology change frequency
- Harness execution time trends
- Production issue occurrence rate
- Rollback frequency

### Feedback Loop

1. Add harness when production issues occur
2. Improve ontology for frequently failing patterns
3. Optimize slow harnesses
4. Document best practices

## Next Steps

- [Ontology Guide](./ontology-guide.md): Ontology writing methods
- [Harness Checklist](./harness-checklist.md): Required harnesses by pattern
- [MSA Complexity Overview](../index.md): Return to full guide
