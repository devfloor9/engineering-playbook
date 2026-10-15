---
title: Pod termination sequence
description: Review the flow from a termination request to container shutdown.
created: "2026-02-12"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 4
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Pod termination sequence
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md) · [Checklist and references](./checklist-references.md)

## Complete guide to graceful shutdown {#3-graceful-shutdown-완벽-가이드}

Graceful shutdown is a pattern that safely completes in-flight requests and stops accepting new requests when a Pod terminates. It is essential for zero-downtime deployments and data integrity.

### Pod termination sequence in detail {#31-pod-종료-시퀀스-상세}

Pod termination in Kubernetes follows this sequence.

**Figure 1. Sequence from Pod termination request to container termination**

```mermaid
sequenceDiagram
    participant User as User/System
    participant API as API Server
    participant EP as Endpoint Controller
    participant Kubelet as kubelet
    participant Container as Container
    participant App as Application

    User->>API: kubectl delete pod
    API->>API: Pod status → Terminating

    par Endpoint removal (asynchronous)
        API->>EP: Pod deletion event
        EP->>EP: Remove Pod IP from<br/>Service Endpoints
        Note over EP: kube-proxy updates iptables<br/>(may take a few seconds)
    and preStop hook execution (asynchronous)
        API->>Kubelet: Pod termination request
        Kubelet->>Container: Execute preStop hook
        Note over Container: sleep 5<br/>(wait for Endpoints removal)
    end

    Container->>App: Send SIGTERM
    App->>App: Stop accepting new requests
    App->>App: Complete in-flight requests
    Note over App: Graceful Shutdown<br/>(up to terminationGracePeriodSeconds - preStop duration)

    alt Graceful termination succeeds
        App->>Kubelet: exit 0
        Kubelet->>API: Pod termination complete
    else Timeout exceeded
        Kubelet->>Container: SIGKILL (forced termination)
        Container->>API: Pod forcibly terminated
    end

    API->>API: Delete Pod
```

**Timing details:**

These timings assume `terminationGracePeriodSeconds: 60` and a preStop `sleep 5`; the actual times scale with the configured grace period and preStop wait.

1. **T+0 seconds**: Pod deletion is requested through `kubectl delete pod` or a rolling update
2. **T+0 seconds**: The API Server sets the Pod's `deletionTimestamp` (shown by `kubectl` as `Terminating`)
3. **T+0 seconds**: Two operations start concurrently and **asynchronously**:
   - The Endpoint Controller removes the Pod IP from Service Endpoints
   - kubelet executes the preStop hook
4. **T+0~5 seconds**: The preStop hook runs `sleep 5` (waiting for Endpoints removal)
5. **T+5 seconds**: After preStop completes, kubelet requests the container runtime to send SIGTERM to PID 1
6. **T+5 seconds**: The application receives SIGTERM and starts graceful shutdown
7. **T+5~60 seconds**: The application completes in-flight requests and performs cleanup
8. **T+60 seconds**: SIGKILL (forced termination) is sent when `terminationGracePeriodSeconds` is reached

:::tip Why preStop sleep is necessary
Endpoint removal and preStop hook execution occur **asynchronously**. Adding a sleep to preStop (e.g. 5 seconds) buys time for the Endpoint Controller and kube-proxy to update iptables, which reduces the chance that new traffic reaches the terminating Pod. A fixed 5 seconds does not guarantee that propagation has completed, though: the delay actually needed depends on EndpointSlice and kube-proxy update latency and may be larger or smaller, so tune it to your environment. Without this pattern, traffic may continue to reach the terminating Pod and cause 502/503 errors.
:::
