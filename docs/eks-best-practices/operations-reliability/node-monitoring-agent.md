---
title: EKS Node Monitoring Agent
description: Architecture, deployment strategies, limitations, and best practices for the AWS EKS Node Monitoring Agent that automatically detects and reports node health issues
created: "2025-08-26"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 31
tags:
  - eks
  - monitoring
  - node-monitoring
  - aws
  - observability
  - cloudwatch
  - scope:ops
sidebar_label: Node Monitoring Agent
category: observability-monitoring
---

## Overview

The EKS Node Monitoring Agent (NMA) is an AWS-provided node health monitoring tool. It automatically detects and reports hardware and system-level issues that occur on EKS cluster nodes. Generally available since 2024, it works alongside Node Auto Repair to improve cluster stability.

### Problems Addressed

Traditional EKS cluster operations faced the following problems:

- Insufficient early detection of hardware failures
- Manual monitoring required for system-level issues
- Delayed response to node state changes
- Lack of integration between problem detection and automatic recovery

NMA was designed to address these problems.

### Key Features

- **Log-based problem detection**: Real-time analysis of system logs with pattern matching
- **Automatic event generation**: Creates Kubernetes Events and Node Conditions upon detection
- **CloudWatch linkage**: NMA itself surfaces issues as Node Conditions and Kubernetes Events; forwarding them to CloudWatch requires a separate collector such as the CloudWatch Observability add-on (see section 3)
- **EKS Add-on support**: Simple installation and management

:::warning Important

NMA is a useful tool for automatically detecting node health issues, but on its own it cannot serve as a complete monitoring solution. It requires appropriate expectation-setting that accounts for the limitations below, along with complementary tooling.

:::

:::tip Key Recommendations

**✅ Recommended usage**

- Use NMA as a node-state detection layer
- Complement with Container Insights or Prometheus for metric collection
- Use together with Node Auto Repair to implement automatic recovery
- Tune thresholds to each environment's characteristics

**❌ Usage to avoid**

- Relying on NMA alone for full monitoring
- Expecting it to handle sudden hardware failures

:::

## 1. Design Goals

### 1.1 Comprehensive Node Health Monitoring

NMA monitors various system components on EKS nodes:

- **Container Runtime**: Health of Docker/containerd
- **Storage System**: Disk space and I/O performance monitoring
- **Networking**: Network connectivity and configuration validation
- **Kernel**: Kernel modules and system state checks
- **Accelerated Hardware**: GPU (NVIDIA) and Neuron chip health (when such hardware is detected)

### 1.2 Kubernetes-Native Integration

NMA integrates tightly with Kubernetes using controller-runtime:

```go
mgr, err := controllerruntime.NewManager(controllerruntime.GetConfigOrDie(), controllerruntime.Options{
    Logger:                 log.FromContext(ctx),
    Scheme:                 scheme.Scheme,
    HealthProbeBindAddress: controllerHealthProbeAddress,
    BaseContext:            func() context.Context { return ctx },
    Metrics:                server.Options{BindAddress: controllerMetricsAddress},
})
```

### 1.3 Support for Diverse EKS Environments

As seen in the REST configuration logic, NMA supports diverse EKS environments:

- **EKS Auto**: Uses a special user impersonation flow
- **Legacy RBAC**: Supports the legacy permission model
- **Standard**: Standard Pod-based authentication

## 2. Architecture and Operating Principles

### 2.1 Agent Startup and Initialization Flow

The following diagram shows NMA's startup process and the overall flow of its monitoring loop.

```mermaid
graph TD
    A[Agent Startup] --> B[Parse CLI Flags]
    B --> C[Initialize Logger]
    C --> D[Setup Signal Context]
    D --> E[Enable Console Diagnostics?]
    E -->|Yes| F[Start Console Logger]
    E -->|No| G[Get Runtime Context]
    F --> G

    G --> H[Configure DBUS Address]
    H --> I[Initialize Controller Manager]
    I --> J[Setup REST Config]

    J --> K{Runtime Context Check}
    K -->|EKS Auto| L[Auto REST Config Provider]
    K -->|Legacy| M[Pod REST Config Provider]
    K -->|Standard| N[Use Default Config]

    L --> O[Bootstrap Hybrid Nodes]
    M --> O
    N --> O

    O --> P[Initialize Node Exporter]
    P --> Q[Initialize Monitor Manager]
    Q --> R[Register Monitors]

    R --> S[Container Runtime Monitor]
    R --> T[Storage Monitor]
    R --> U[Networking Monitor]
    R --> V[Kernel Monitor]
    R --> W{Accelerated Hardware?}

    W -->|NVIDIA| X[NVIDIA Monitor]
    W -->|Neuron| Y[Neuron Monitor]
    W -->|None| Z[Continue]

    X --> Z
    Y --> Z
    S --> Z
    T --> Z
    U --> Z
    V --> Z

    Z --> AA[Initialize Node Diagnostic Controller]
    AA --> BB[Add Health Checks]
    BB --> CC{Debug Endpoints Enabled?}
    CC -->|Yes| DD[Add Debug Handlers]
    CC -->|No| EE[Start Manager]
    DD --> EE

    EE --> FF[Controller Runtime Loop]

    subgraph "Monitoring Loop"
        FF --> GG[Node Exporter Runs]
        GG --> HH[Monitor Manager Executes]
        HH --> II[Each Monitor Checks System]
        II --> JJ[Update Node Conditions]
        JJ --> KK[Record Events]
        KK --> LL[Export Metrics]
        LL --> GG
    end

    subgraph "Diagnostic Controller"
        FF --> MM[Watch NodeDiagnostic CRDs]
        MM --> NN[Process Diagnostic Requests]
        NN --> OO[Execute Diagnostics]
        OO --> PP[Update Status]
        PP --> MM
    end

    subgraph "Health & Metrics"
        FF --> QQ[Health Probe Endpoint :8081]
        FF --> RR[Metrics Endpoint :8080]
        FF --> SS[PProf Endpoint :8082]
    end

    subgraph "Console Diagnostics"
        F --> TT[Periodic System Info]
        TT --> UU[Write to /dev/console]
        UU --> TT
    end

    style A fill:#e1f5fe
    style FF fill:#f3e5f5
    style GG fill:#e8f5e8
    style MM fill:#fff3e0
    style QQ fill:#fce4ec
```

### 2.2 Monitor Registration and Management

NMA manages each subsystem through monitor configuration. The following shows the structure of monitor registration.

```go
var monitorConfigs = []monitorConfig{
    {
        Monitor:       &runtime.RuntimeMonitor{},
        ConditionType: rules.ContainerRuntimeReady,
    },
    {
        Monitor:       storage.NewStorageMonitor(),
        ConditionType: rules.StorageReady,
    },
    // ... additional monitors
}
```

Each monitor is linked to a corresponding Node Condition and reports its status.

### 2.3 Node Condition-Based Status Reporting

NMA leverages the Kubernetes Node Condition mechanism to report the status of each subsystem:

- `ContainerRuntimeReady`: container runtime status
- `StorageReady`: storage subsystem status
- `NetworkingReady`: networking status
- `KernelReady`: kernel status
- `AcceleratedHardwareReady`: GPU/Neuron hardware status (conditional)

### 2.4 Real-Time Diagnostics

On-demand diagnostics execution via the NodeDiagnostic CRD:

```go
diagnosticController := controllers.NewNodeDiagnosticController(mgr.GetClient(), hostname, runtimeContext)
```

This lets operators run diagnostic commands in real time on a specific node.

### 2.5 Observability

NMA provides observability through various endpoints:

The following are binary CLI defaults (`main.go`); the add-on/Helm chart `values.yaml` deployment values may differ.

- **Health Probe** (`:8081`): Kubernetes health checks
- **Metrics** (`:8080`): Prometheus metrics exposure
- **PProf** (`:8082`): Go profiling (optional)

### 2.6 Console Diagnostic Logging

When the `-console-diagnostics` flag is enabled, system information is periodically written to `/dev/console`:

```go
if enableConsoleDiagnostics {
    startConsoleDiagnostics(ctx)
}
```

This provides instance-level visibility.

### 2.7 Deployment and Operational Characteristics

#### 2.7.1 DaemonSet-Based Deployment

As seen in `agent.tpl.yaml`, NMA is deployed as a DaemonSet and runs on all worker nodes:

```yaml
kind: DaemonSet
apiVersion: apps/v1
metadata:
  name: eks-node-monitoring-agent
  namespace: kube-system
```

#### 2.7.2 Node Selection and Constraints

The affinity settings in `values.yaml` restrict execution to specific node types:

- Excludes Fargate nodes
- Excludes EKS Auto compute types
- Excludes HyperPod nodes
- Supports AMD64/ARM64 architectures only
- Linux nodes only (no Windows support)

#### 2.7.3 Permission Management

The RBAC settings in `agent.tpl.yaml` apply the principle of least privilege:

```yaml
rules:
  # monitoring permissions
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "patch"]
  # nodediagnostic permissions
  - apiGroups: ["eks.amazonaws.com"]
    resources: ["nodediagnostics"]
    verbs: ["get", "watch", "list"]
```

#### 2.7.4 Resource Efficiency

The resource limits defined in `values.yaml` keep operation lightweight:

```yaml
resources:
  requests:
    cpu: 10m
    memory: 30Mi
  limits:
    cpu: 250m
    memory: 100Mi
```

### 2.8 Types of Detectable Issues

The node health issues that NMA detects are divided into two categories by **severity**. This distinction must be understood precisely because it determines whether Node Auto Repair acts.

- **Condition**: a terminal issue warranting node Replace or Reboot. When Auto Repair is enabled, a repair action is generally taken, except where the repair action is None (e.g. the DCGM rows in section 2.8.3) and subject to repair wait periods, runaway-prevention thresholds, and NoAction overrides (sections 3.2, 3.3, 3.4).
- **Event**: a temporary or non-critical issue, or a sub-optimal node configuration. It **does not trigger an Auto Repair action** and is recorded for investigation/alerting only.

Multiple detailed issues are mapped under each monitoring condition type (`ContainerRuntimeReady`, `KernelReady`, `NetworkingReady`, `StorageReady`, `AcceleratedHardwareReady`). Even within the same condition type, the severity (Condition vs. Event) differs per detailed issue.

#### 2.8.1 Container Runtime Issues (`ContainerRuntimeReady`)

Directly relevant to scenarios where containerd load/failure causes node problems.

| Name | Severity | Description | Repair Action |
|------|----------|-------------|---------------|
| `PodStuckTerminating` | **Condition** | A pod is excessively delayed in terminating (e.g., due to CRI errors), unable to progress state | **Replace** |
| `ContainerRuntimeFailed` | Event | The runtime failed to create a container (a failure signal if recurring) | None |
| `KubeletFailed` | Event | The kubelet entered a failed state | None |
| `DeprecatedContainerdConfiguration` | Event | A deprecated image manifest (v2 schema 1) pull occurred | None |
| `Liveness/ReadinessProbeFailures` | Event | Probe failure detected (possible app code issue or insufficient timeout) | None |
| `[Name]RepeatedRestart` / `ServiceFailedToStart` | Event | Frequent restarts / startup failure of a systemd unit | None |

→ **Key point**: Only the level where a pod cannot complete termination (`PodStuckTerminating`, e.g. CRI errors preventing pod state progression) is classified as a Condition and leads to node replacement. A plain container-create failure (`ContainerRuntimeFailed`) is recorded as an Event only and is not auto-remediated.

#### 2.8.2 Major Kernel / Networking / Storage Issues

Only the representative items classified as Condition (auto-repair targets) are listed. Most other items are Events.

| Condition type | Condition issues (Replace) | Representative Event issues |
|------|------|------|
| `KernelReady` | `ForkFailedOutOfPIDs` (PID/memory exhaustion) | `SoftLockup`, `KernelBug`, `ApproachingKernelPidMax`, `ConntrackExceededKernel` |
| `NetworkingReady` | `IPAMDNotRunning`, `IPAMDNotReady`, `InterfaceNotUp/Running`, `MissingLoopbackInterface` | `ConntrackExceeded`, `BandwidthIn/OutExceeded`, `PPSExceeded`, `NetworkSysctl` |
| `StorageReady` | (all items in that table are Events) | `EBSVolumeIOPS/ThroughputExceeded`, `IODelays`, `KubeletDiskUsageSlow` |

:::warning DiskPressure / MemoryPressure / PIDPressure are NOT auto-repair targets

`DiskPressure`, `MemoryPressure`, and `PIDPressure` are standard Kubernetes conditions, and **Node Auto Repair intentionally does not react to them.** These are more likely to indicate application behavior, workload configuration, or resource-limit issues than node-level faults, making it hard to define an appropriate default repair action. In these cases, handling is delegated to the Kubernetes [node-pressure eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/) behavior.

→ However, when PID/memory exhaustion is caught as `ForkFailedOutOfPIDs` (a failed fork/exec call), that is a `KernelReady` Condition and **does** trigger automatic replacement (Replace). By contrast, when it surfaces only as the standard Kubernetes `DiskPressure`/`MemoryPressure`/`PIDPressure` conditions, Auto Repair does not react and the node is not automatically replaced.

:::

#### 2.8.3 Accelerated Hardware Issues (`AcceleratedHardwareReady`)

Detects NVIDIA GPU and AWS Neuron accelerator health. For NVIDIA XID errors, only well-known codes are classified as Conditions (`NvidiaXID[Code]Error`) and trigger repair; unregistered codes are recorded as Events only (`NvidiaXID[Code]Warning`). Refer to AWS official documentation for per-XID-code repair actions (Reboot/Replace).

| Representative issue | Severity | Repair Action |
|------|------|------|
| `NvidiaXID[Code]Error` (well-known) | Condition | Replace or Reboot (varies by code) |
| `NvidiaNVLinkError`, `NvidiaDoubleBitError` | Condition | Replace |
| `NeuronDMAError`, `NeuronHBMUncorrectableError` | Condition | Replace |
| `DCGMError`, `DCGMDiagnosticFailure` | Condition | None |
| `NvidiaThermalError`, `NvidiaPowerError`, `NvidiaPageRetirement` | Event | None |

## 3. Node Auto Repair Integration

On its own, NMA only provides visibility (exposing NodeConditions and events). Automatic replacement/reboot for detected Conditions happens only when used together with Node Auto Repair.

### 3.1 Auto Repair Reaction Targets With/Without NMA

| Configuration | What Auto Repair reacts to |
|------|------|
| Auto Repair alone (no NMA) | kubelet's `Ready` condition, manually deleted node objects, managed node group instances that fail to join the cluster |
| Auto Repair + NMA | The above, **plus** `AcceleratedHardwareReady`, `ContainerRuntimeReady`, `KernelReady`, `NetworkingReady`, `StorageReady` |

### 3.2 Per-Condition Repair Wait Time and Action

These are default behaviors, applied commonly across EKS Auto Mode, managed node groups, and Karpenter. `Reboot` is supported only on managed node groups; Auto Mode and Karpenter both act with `Replace`.

| Condition | Repair after | Action |
|------|------|------|
| `AcceleratedHardwareReady` | 10 min | Replace or Reboot |
| `ContainerRuntimeReady` | 30 min | Replace |
| `KernelReady` | 30 min | Replace |
| `NetworkingReady` | 30 min | Replace |
| `StorageReady` | 30 min | Replace |
| `Ready` | 30 min | Replace |
| `DiskPressure` / `MemoryPressure` | N/A | None |

### 3.3 Runaway-Prevention Guardrails

To prevent cascading node replacement during mass failures, new repair actions are halted by default in the following situations (in-progress repairs continue).

- **Managed node groups**: When there are more than 5 nodes and more than 20% of the group's nodes are unhealthy, or when an ARC (Application Recovery Controller) zonal shift occurs
- **Auto Mode / Karpenter**: When more than 20% of the NodePool's nodes are unhealthy (for standalone NodeClaims, 20% of the cluster)

### 3.4 Enablement

- **EKS Auto Mode**: Always enabled (not configurable)
- **Karpenter**: Set feature gate `NodeRepair=true`
- **Managed node groups**: Console "Enable node auto repair" checkbox / CLI `--node-repair-config enabled=true` / eksctl `nodeRepairConfig.enabled: true`

Managed node groups can customize detailed behavior with `maxUnhealthyNodeThresholdCount/Percentage`, `maxParallelNodesRepairedCount/Percentage`, and per-condition/reason `nodeRepairConfigOverrides` (e.g., immediate Replace for a specific NVIDIA XID error, NoAction for others).

## 4. Differences by Deployment Method

### 4.1 Manual Mode (DaemonSet)

**Pros:**

- Flexible version management
- ConfigMap-based configuration changes
- Custom configuration possible

**Cons:**

- High kubelet dependency
- Delay during node bootstrap
- Affected by kubelet failures

### 4.2 EKS Auto Mode

**Pros:**

- Built directly into the AMI
- Runs independently of kubelet
- Higher availability
- Faster problem detection

**Cons:**

- AMI replacement required for updates
- Limited customization

## 5. Technical Limitations

### 5.1 Metric Collection Limits

- **NMA is not a metric collection tool**: Cannot collect performance metrics (CPU, memory utilization, etc.)
- **Log-parsing approach**: Does not use cAdvisor metrics; primarily log/system-state analysis (also inspects non-log signals such as networking and runtime state)
- **Prometheus endpoint**: Exposes only limited health-status metrics (port 8080)

### 5.2 Constraints When Using Alternative Backends

:::warning When using a backend other than CloudWatch

- No native ADOT integration
- Very limited Prometheus metric coverage
- Limited configuration scope: resource requests/limits, tolerations, CLI arguments, and ConfigMap-based configuration can be tuned (sections 2.7.3, 2.7.4, 4.1, 7.1), but there is no option to change the output to a non-CloudWatch backend itself
- Limited official documentation and support

:::

### 5.3 Hardware Failure Detection Limits

**Detectable:**

- ✅ Gradual performance degradation
- ✅ Increasing I/O errors
- ✅ Memory ECC errors

**Not detectable:**

- ❌ Sudden power loss
- ❌ Instantaneous hardware failure
- ❌ Complete network disconnection

## 6. Recommended Implementation Strategy

### 6.1 Multi-Layer Monitoring Architecture

```
Integrated monitoring stack:
├── L1: State detection (NMA)
│   └── Early detection of node problems
├── L2: Metric collection (Container Insights/Prometheus)
│   └── Detailed performance data
├── L3: Automatic response (Node Auto Repair)
│   └── Automatic replacement of problem nodes
└── L4: Unified dashboard (CloudWatch/Grafana)
    └── Comprehensive monitoring view
```

### 6.2 Recommended Configuration When Using Prometheus

When using NMA together with Node Exporter, deploy the following components with their respective roles and ports, and configure collection with a dedicated Service plus a Prometheus `ServiceMonitor`/`PodMonitor` per component.

- **nma** — node state events, port 8080
- **node-exporter** — detailed system metrics, port 9100
- **kube-state-metrics** — cluster state metrics, port 8080

## 7. Cost and Performance Considerations

### 7.1 Resource Usage

NMA is a very lightweight component. The following requests and limits are an example taken from the EKS add-on / Helm chart `values.yaml` defaults; they can change across chart/add-on versions, so confirm them against the `values.yaml` of the version you run.

| Resource | requests | limits |
|----------|----------|--------|
| CPU | 10m | 250m |
| Memory | 30Mi | 100Mi |

On NVIDIA GPU instances, a DCGM server component (`nv-hostengine`) also starts and can be tuned separately via `dcgmAgent.resources.*` values. Adjust resource requests/limits for your environment via the add-on configuration values (`monitoringAgent.resources.*`).

### 7.2 CloudWatch Cost

| Item | Cost |
|------|------|
| Custom metrics | $0.30/metric/month |
| Logs | $0.50/GB ingested |

The Node Conditions and Kubernetes Events that NMA surfaces are, when sent to CloudWatch, ingested as logs ($/GB) and follow the logs pricing. A "$1/million events" rate applies to EventBridge custom events and does not apply directly to NMA events.

## 8. Best Practices

### 8.1 Production Deployment

1. **Phased rollout**: Dev → Staging → Production
2. **Alert threshold tuning**: Account for each environment's characteristics
3. **Enable auto repair cautiously**: On managed node groups and Karpenter, start with monitoring only (EKS Auto Mode has auto repair always on and not configurable)
4. **Regular testing**: Monthly failure simulations

### 8.2 Integration With Other Tools

| Combination | Description |
|------|------|
| NMA + Container Insights | Fully AWS-native visibility |
| NMA + Prometheus + Grafana | Open-source monitoring stack |
| NMA + Datadog/New Relic | Enterprise-grade monitoring solution |

## References

### Official Documentation
- [Detect node health issues and enable automatic node repair](https://docs.aws.amazon.com/eks/latest/userguide/node-health.html) — NMA/Auto Repair overview and NodeCondition list
- [Detect node health issues with the EKS node monitoring agent](https://docs.aws.amazon.com/eks/latest/userguide/node-health-nma.html) — Full detected-issue tables (Condition/Event), XID codes, add-on config values
- [Automatically repair nodes in EKS clusters](https://docs.aws.amazon.com/eks/latest/userguide/node-repair.html) — Per-condition repair actions/timeouts, guardrails, customization
- [aws/eks-node-monitoring-agent](https://github.com/aws/eks-node-monitoring-agent) — NMA source code and Helm chart

### Technical Blogs
- [Amazon EKS introduces node monitoring and auto repair capabilities](https://aws.amazon.com/blogs/containers/amazon-eks-introduces-node-monitoring-and-auto-repair-capabilities/) — Launch announcement and architecture overview

### Related Documents (internal)
- [EKS Troubleshooting and Response](./eks-debugging/index.md) — Systematic diagnosis of node/workload issues
- [Pod Health Checks & Lifecycle](./eks-pod-health-lifecycle.md) — Probe configuration and graceful shutdown
- [AWS Nitro Architecture and Performance Tuning](../networking-performance/nitro-architecture-performance-tuning.md) — Per-generation node-hardware characteristics and kernel tuning
