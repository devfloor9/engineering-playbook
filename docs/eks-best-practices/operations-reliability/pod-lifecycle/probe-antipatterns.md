---
title: Probe antipatterns
description: Examine unnecessary restarts and incorrect health check configurations.
created: "2026-02-12"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 3
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Probe antipatterns
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md) · [Checklist and references](./checklist-references.md)

## Probe Antipatterns and Pitfalls {#25-probe-안티패턴과-함정}

### ❌ Antipattern 1: Including External Dependencies in a Liveness Probe {#-안티패턴-1-liveness-probe에-외부-의존성-포함}

**Problem:**

```yaml
livenessProbe:
  httpGet:
    path: /health  # Includes database and Redis connection checks
    port: 8080
```

**Consequences:**
- A database failure causes all Pods to restart simultaneously → Cascading Failure
- Even transient network delays cause Pods to restart.

**Correct configuration:**

```yaml
# Liveness: Application health only
livenessProbe:
  httpGet:
    path: /healthz  # Check internal health only
    port: 8080

# Readiness: Include external dependencies
readinessProbe:
  httpGet:
    path: /ready  # Check the database, Redis, and other dependencies
    port: 8080
```

### ❌ Antipattern 2: A High initialDelaySeconds Without a Startup Probe {#-안티패턴-2-startup-probe-없이-높은-initialdelayseconds}

**Problem:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 120  # Wait 2 minutes
  periodSeconds: 10
```

**Consequences:**
- Even if the application starts in 30 seconds, it has no health checks for another 90 seconds.
- A crash during startup can remain undetected for up to 2 minutes.

**Correct configuration:**

```yaml
# Protect startup with a Startup Probe
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 12  # Wait up to 120 seconds
  periodSeconds: 10

# Liveness activates immediately after Startup succeeds
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 0  # Start immediately after Startup succeeds
  periodSeconds: 10
```

### ❌ Antipattern 3: Using the Same Endpoint for Liveness and Readiness {#-안티패턴-3-liveness와-readiness에-같은-엔드포인트}

**Problem:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080

readinessProbe:
  httpGet:
    path: /health  # Same endpoint
    port: 8080
```

**Consequences:**
- If `/health` checks external dependencies, Liveness failures cause unnecessary restarts.
- Unclear separation of responsibilities makes debugging difficult.

**Correct configuration:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz  # Internal health only
    port: 8080

readinessProbe:
  httpGet:
    path: /ready  # Include external dependencies
    port: 8080
```

### ❌ Antipattern 4: An Overly Aggressive failureThreshold {#-안티패턴-4-너무-공격적인-failurethreshold}

**Problem:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 5
  failureThreshold: 1  # Restart after just 1 failure
```

**Consequences:**
- Transient network delays, GC pauses, and similar events cause unnecessary restarts.
- Restart loops can occur.

**Correct configuration:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10
  failureThreshold: 3  # Restart after 30 seconds (3 x 10s)
  timeoutSeconds: 5
```

### ❌ Antipattern 5: An Excessively Long timeoutSeconds {#-안티패턴-5-과도하게-긴-timeoutseconds}

**Problem:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 30  # Wait 30 seconds
  periodSeconds: 10
```

**Consequences:**
- The probe blocks for 30 seconds, delaying the next probe execution.
- Failure detection becomes slower.

**Correct configuration:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 5  # A response is required within 5 seconds
  periodSeconds: 10
  failureThreshold: 3
```
