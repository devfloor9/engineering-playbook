---
title: Pod lifecycle hooks
description: Review the execution flow and examples for PostStart and PreStop.
created: "2026-02-12"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 4
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Pod lifecycle hooks
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md) · [Deployment checklist and references](./checklist-references.md)

## Pod Lifecycle Hooks {#5-pod-lifecycle-hooks}

Lifecycle hooks execute custom logic at specific points in a container's lifecycle.

### PostStart Hook {#51-poststart-hook}

The PostStart hook runs immediately after a container is created.

**Characteristics:**
- Runs **asynchronously** with the container's ENTRYPOINT
- The container is terminated if the hook fails
- The container enters the `Running` state without waiting for the hook to complete

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: poststart-example
spec:
  containers:
  - name: app
    image: nginx
    lifecycle:
      postStart:
        exec:
          command:
          - /bin/sh
          - -c
          - |
            echo "Container started at $(date)" >> /var/log/lifecycle.log
            # Initial setup tasks
            mkdir -p /app/cache
            chown -R nginx:nginx /app/cache
```

**Use cases:**
- Send application startup notifications
- Perform initial cache warming
- Record metadata

:::warning PostStart Hook Considerations
The PostStart hook runs **asynchronously** with container startup, so the application may start before the hook completes. Use an init container if the application depends on the work performed by the hook.
:::

### PreStop Hook {#52-prestop-hook}

The PreStop hook runs before SIGTERM when container termination is requested.

**Characteristics:**
- Runs **synchronously** (SIGTERM delivery is delayed until it completes)
- Hook execution time is included in `terminationGracePeriodSeconds`
- SIGTERM is sent regardless of whether the hook fails

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: prestop-example
spec:
  containers:
  - name: app
    image: myapp/app:v1
    lifecycle:
      preStop:
        exec:
          command:
          - /bin/sh
          - -c
          - |
            # 1. Wait for endpoint removal
            sleep 5

            # 2. Save application state
            curl -X POST http://localhost:8080/admin/save-state

            # 3. Flush logs
            kill -USR1 1  # Send the USR1 signal to the application

            # 4. Send SIGTERM (PID 1)
            kill -TERM 1
  terminationGracePeriodSeconds: 60
```

**Use cases:**
- Wait for endpoint removal (zero-downtime deployment)
- Save the state of work in progress
- Notify external systems of shutdown
- Flush log buffers

### Hook Execution Mechanisms {#53-hook-실행-메커니즘}

Kubernetes executes hooks through two mechanisms.

| Mechanism | Description | Advantages | Disadvantages |
|----------|------|------|------|
| **exec** | Execute commands inside the container | Access to the container filesystem | High overhead |
| **httpGet** | Send an HTTP GET request | Network-based and lightweight | The application must support HTTP |

#### exec Hook Example {#exec-hook-예시}

```yaml
lifecycle:
  preStop:
    exec:
      command:
      - /bin/bash
      - -c
      - |
        echo "Shutting down" | tee /var/log/shutdown.log
        /app/cleanup.sh
```

#### httpGet Hook Example {#httpget-hook-예시}

```yaml
lifecycle:
  preStop:
    httpGet:
      path: /shutdown
      port: 8080
      scheme: HTTP
      httpHeaders:
      - name: X-Shutdown-Token
        value: "secret-token"
```

:::warning Hook Execution Is "At Least Once"
Kubernetes guarantees that a hook runs at least once, but it may run multiple times. Hook logic must be **idempotent**.
:::

---
