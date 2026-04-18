---
title: "Verification Methodology"
sidebar_label: "Verification Methodology"
sidebar_position: 3
description: "Verification methods to ensure quality when applying AIDLC in complex MSA"
tags: [verification, testing, quality, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Verification Methodology

Methods to ensure quality when applying AIDLC in complex MSA environments.

## Verification Checklist

### Ontology Verification

- [ ] **Completeness:** Are all entities/events defined in the ontology?
- [ ] **Consistency:** Is the ontology consistent across Bounded Contexts?
- [ ] **Accuracy:** Do invariants match business rules?
- [ ] **Traceability:** Are ontology and code synchronized?

### Harness Verification

- [ ] **Coverage:** Are all required harnesses implemented?
- [ ] **Automation:** Are harnesses integrated into CI/CD?
- [ ] **Failure Scenarios:** Are all failure scenarios tested?
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

**Complexity L4-5 requires expert review**

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

| Item | Minimum Requirement | Recommended Target |
|------|-------------|----------|
| **Ontology Coverage** | 90% | 100% |
| **Harness Success Rate** | 95% | 100% |
| **Required Harness Implementation** | 100% | - |
| **Code Review Approval** | Required | - |
| **Expert Review (L4-5)** | Required | - |

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
