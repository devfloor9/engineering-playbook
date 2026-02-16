# Kubernetes Observability and Monitoring Debugging Practices for EKS

## Executive Summary

This document provides a comprehensive guide to observability and monitoring debugging practices for Amazon Elastic Kubernetes Service (EKS). It covers metrics, logs, traces, and event-based debugging approaches using industry-standard tools from the CNCF ecosystem and AWS-native services.

---

## Table of Contents

1. [Observability Stack Architecture](#observability-stack-architecture)
2. [Metrics-Based Debugging](#metrics-based-debugging)
3. [Log-Based Debugging](#log-based-debugging)
4. [Tracing-Based Debugging](#tracing-based-debugging)
5. [Dashboard and Alerting](#dashboard-and-alerting)
6. [Events and Auditing](#events-and-auditing)
7. [Tool Comparison Matrix](#tool-comparison-matrix)
8. [References](#references)

---

## Observability Stack Architecture

### Recommended Architecture for EKS

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Pods                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ App + SDK│  │ App + SDK│  │ App + SDK│                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       │ OTLP        │ OTLP        │ OTLP                    │
└───────┼─────────────┼─────────────┼─────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│           OpenTelemetry Collector (DaemonSet)                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Receivers  │→ │ Processors  │→ │  Exporters  │        │
│  │ OTLP, k8s   │  │k8sattributes│  │AWS X-Ray    │        │
│  │  metrics    │  │memory_limiter│ │CloudWatch   │        │
│  └─────────────┘  └─────────────┘  │AMP          │        │
│                                     └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
        │                   │                    │
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐   ┌──────────────┐    ┌──────────────┐
│  AWS X-Ray   │   │  CloudWatch  │    │   Amazon     │
│  (Traces)    │   │  Logs/Metrics│    │   Managed    │
└──────────────┘   └──────────────┘    │  Prometheus  │
                                        └──────────────┘
                            │
                            ▼
                   ┌──────────────┐
                   │   Grafana    │
                   │ (Dashboards) │
                   └──────────────┘

Additional Components (Node Level):
┌─────────────────────────────────────────────────────────────┐
│ Node Exporters & Metrics Sources                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │kube-state-   │  │ node-exporter│  │   cAdvisor   │     │
│  │  metrics     │  │ (host metrics)│ │(container     │     │
│  │(k8s objects) │  └──────────────┘  │  metrics)    │     │
│  └──────────────┘                    └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Deployment Mode |
|-----------|---------|-----------------|
| **OpenTelemetry Collector** | Unified telemetry collection, processing, and routing | DaemonSet (logs/traces) + Deployment (cluster metrics) |
| **kube-state-metrics** | Kubernetes object state metrics (pods, deployments, nodes) | Deployment |
| **Prometheus node-exporter** | Host-level metrics (CPU, memory, disk, network) | DaemonSet |
| **cAdvisor** | Container resource usage metrics | Built into kubelet |
| **AWS CloudWatch Container Insights** | AWS-native container monitoring with automatic dashboards | CloudWatch Agent DaemonSet |
| **AWS Distro for OpenTelemetry (ADOT)** | AWS-optimized OpenTelemetry distribution | Collector deployment |
| **Amazon Managed Prometheus (AMP)** | Serverless Prometheus-compatible metrics storage | Managed service |
| **AWS X-Ray** | Distributed tracing and service maps | Managed service |
| **Grafana** | Visualization and dashboards | Deployment or Amazon Managed Grafana |

---

## Metrics-Based Debugging

### 1. Prometheus Metrics Architecture

#### Key Metrics Sources

**kube-state-metrics** - Kubernetes object state:
```promql
# Pod status phases
kube_pod_status_phase{namespace="production"}

# Deployment replica status
kube_deployment_status_replicas_available
kube_deployment_status_replicas_unavailable

# Node conditions
kube_node_status_condition{condition="Ready",status="true"}

# Container restart counts
kube_pod_container_status_restarts_total
```

**node-exporter** - Host-level metrics:
```promql
# CPU usage by mode
node_cpu_seconds_total

# Memory usage
node_memory_MemAvailable_bytes
node_memory_MemTotal_bytes

# Disk I/O
rate(node_disk_read_bytes_total[5m])
rate(node_disk_written_bytes_total[5m])

# Network traffic
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
```

**cAdvisor** (via kubelet) - Container metrics:
```promql
# Container CPU usage
rate(container_cpu_usage_seconds_total{namespace="production"}[5m])

# Container memory usage
container_memory_usage_bytes{namespace="production"}

# Container network bytes
rate(container_network_transmit_bytes_total[5m])
rate(container_network_receive_bytes_total[5m])
```

### 2. Essential PromQL Queries for Debugging

#### CPU Debugging

```promql
# High CPU usage by pod
topk(10,
  sum by (namespace, pod) (
    rate(container_cpu_usage_seconds_total{container!=""}[5m])
  )
)

# CPU throttling detection
sum by (namespace, pod, container) (
  rate(container_cpu_cfs_throttled_seconds_total[5m])
) > 0.1
```

#### Memory Debugging

```promql
# Memory usage percentage by pod
100 * sum by (namespace, pod) (
  container_memory_working_set_bytes{container!=""}
) / sum by (namespace, pod) (
  container_spec_memory_limit_bytes{container!=""}
)

# OOMKilled containers
kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}
```

#### Pod Health

```promql
# Pods not in Running state
count by (namespace, pod) (
  kube_pod_status_phase{phase!="Running"}
)

# Pods with high restart counts
kube_pod_container_status_restarts_total > 5

# CrashLoopBackOff detection
kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff"}
```

#### Network Performance

```promql
# Network receive errors
rate(node_network_receive_errs_total[5m]) > 0

# Pod network throughput
sum by (namespace, pod) (
  rate(container_network_receive_bytes_total[5m])
)
```

#### Latency Analysis (Application Metrics)

```promql
# 90th percentile latency (native histograms)
histogram_quantile(0.9,
  sum by (job) (
    rate(http_request_duration_seconds[10m])
  )
)

# 99th percentile latency (classic histograms)
histogram_quantile(0.99,
  sum by (job, le) (
    rate(http_request_duration_seconds_bucket[10m])
  )
)
```

### 3. Amazon Managed Prometheus Setup

**Configuration for EKS scraping:**

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Kubernetes API server
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

  # Kubelet metrics (cAdvisor)
  - job_name: 'kubernetes-nodes-cadvisor'
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
      - target_label: __metrics_path__
        replacement: /metrics/cadvisor

  # kube-state-metrics
  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics.kube-system.svc.cluster.local:8080']

  # node-exporter
  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_endpoints_name]
        regex: 'node-exporter'
        action: keep

  # Pod metrics
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

remote_write:
  - url: https://aps-workspaces.us-east-1.amazonaws.com/workspaces/ws-xxxxx/api/v1/remote_write
    queue_config:
      max_samples_per_send: 1000
      max_shards: 200
      capacity: 2500
    sigv4:
      region: us-east-1
```

### 4. CloudWatch Container Insights

**Automatic Metrics Collected:**

| Metric Category | Key Metrics | Use Case |
|----------------|-------------|----------|
| **Cluster** | `cluster_failed_node_count`, `cluster_node_count` | Cluster health |
| **Node** | `node_cpu_utilization`, `node_memory_utilization`, `node_network_total_bytes` | Node capacity planning |
| **Pod** | `pod_cpu_utilization`, `pod_memory_utilization`, `pod_network_rx_bytes` | Pod resource usage |
| **Container** | `container_cpu_utilization`, `container_memory_utilization` | Container debugging |

**Embedded Metric Format (EMF) for Custom Metrics:**

```json
{
  "_aws": {
    "Timestamp": 1574109732004,
    "CloudWatchMetrics": [
      {
        "Namespace": "MyApp/Kubernetes",
        "Dimensions": [["PodName", "Namespace"]],
        "Metrics": [
          {"Name": "custom_latency_ms", "Unit": "Milliseconds"},
          {"Name": "custom_error_count", "Unit": "Count"}
        ]
      }
    ]
  },
  "PodName": "my-pod-abc123",
  "Namespace": "production",
  "custom_latency_ms": 142,
  "custom_error_count": 3
}
```

---

## Log-Based Debugging

### 1. Centralized Logging Architecture

#### Log Flow

```
Container stdout/stderr
    ↓
kubelet → /var/log/pods/
    ↓
Log Aggregator (Fluent Bit / Fluentd)
    ↓
Centralized Storage (CloudWatch Logs / S3 / Elasticsearch)
    ↓
Query & Analysis (CloudWatch Logs Insights / Kibana)
```

#### Log Rotation Configuration

```yaml
# kubelet configuration
containerLogMaxSize: 10Mi
containerLogMaxFiles: 5
containerLogMaxWorkers: 1
containerLogMonitorInterval: 10s
```

### 2. Fluent Bit Configuration for EKS

**DaemonSet deployment with CloudWatch output:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: kube-system
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush                     5
        Grace                     30
        Log_Level                 info
        Daemon                    off
        Parsers_File              parsers.conf

    [INPUT]
        Name                      tail
        Path                      /var/log/containers/*.log
        Parser                    cri
        Tag                       kube.*
        Refresh_Interval          5
        Mem_Buf_Limit             50MB
        Skip_Long_Lines           On

    [FILTER]
        Name                      kubernetes
        Match                     kube.*
        Kube_URL                  https://kubernetes.default.svc:443
        Kube_CA_File              /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File           /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix           kube.var.log.containers.
        Merge_Log                 On
        Keep_Log                  Off
        K8S-Logging.Parser        On
        K8S-Logging.Exclude       On

    [FILTER]
        Name                      nest
        Match                     kube.*
        Operation                 lift
        Nested_under              kubernetes
        Add_prefix                k8s_

    [OUTPUT]
        Name                      cloudwatch_logs
        Match                     kube.*
        region                    us-east-1
        log_group_name            /aws/containerinsights/my-cluster/application
        log_stream_prefix         ${k8s_namespace_name}-
        auto_create_group         true

  parsers.conf: |
    [PARSER]
        Name                      cri
        Format                    regex
        Regex                     ^(?<time>[^ ]+) (?<stream>stdout|stderr) (?<logtag>[^ ]*) (?<log>.*)$
        Time_Key                  time
        Time_Format               %Y-%m-%dT%H:%M:%S.%L%z
```

**Comparison: Fluent Bit vs Fluentd**

| Feature | Fluent Bit | Fluentd |
|---------|-----------|---------|
| **Memory footprint** | ~450KB, minimal dependencies | ~40MB, Ruby-based |
| **Performance** | High throughput, low latency | Moderate, plugin-dependent |
| **Plugins** | 80+ built-in | 1000+ community plugins |
| **Use case** | Edge/embedded, DaemonSet collectors | Aggregation layer, complex transformations |
| **Configuration** | Simple, declarative | Flexible, Ruby DSL available |

### 3. Structured Logging Best Practices

#### OpenTelemetry Log Correlation

**Automatic trace context injection:**

```python
import logging
from opentelemetry import trace
from opentelemetry.instrumentation.logging import LoggingInstrumentor

# Initialize OpenTelemetry logging instrumentation
LoggingInstrumentor().instrument()

logger = logging.getLogger(__name__)

# Logs will automatically include trace_id and span_id
logger.info("Processing recommendation request", extra={"product_ids": prod_list})
```

**Output with trace context:**

```json
{
  "timestamp": "2024-02-10T15:30:42.631195Z",
  "severity": "INFO",
  "body": "Processing recommendation request",
  "attributes": {
    "product_ids": ["abc123", "def456"],
    "otelTraceID": "db1fc322141e64eb84f5bd8a8b1c6d1f",
    "otelSpanID": "5c2b0f851030d17d",
    "otelServiceName": "recommendation-service"
  },
  "trace_id": "0xdb1fc322141e64eb84f5bd8a8b1c6d1f",
  "span_id": "0x5c2b0f851030d17d",
  "trace_flags": 1
}
```

#### JSON Logging Format

```json
{
  "timestamp": "2024-02-10T15:30:42Z",
  "level": "ERROR",
  "message": "Failed to process payment",
  "service": "payment-service",
  "trace_id": "db1fc322141e64eb84f5bd8a8b1c6d1f",
  "span_id": "5c2b0f851030d17d",
  "namespace": "production",
  "pod": "payment-service-7b8c9d-xkz89",
  "node": "ip-10-0-1-45.ec2.internal",
  "error": {
    "type": "PaymentGatewayTimeout",
    "message": "Timeout after 5000ms",
    "stack": "..."
  },
  "context": {
    "user_id": "user-12345",
    "order_id": "order-67890",
    "amount": 99.99
  }
}
```

### 4. CloudWatch Logs Insights Queries

#### Common Debugging Queries

**Find errors by pod:**
```sql
fields @timestamp, @message, @logStream
| filter @message like /ERROR|Exception/
| stats count() as error_count by @logStream
| sort error_count desc
| limit 20
```

**Latency analysis:**
```sql
fields @timestamp, @message, latency_ms
| filter ispresent(latency_ms)
| stats avg(latency_ms) as avg_latency,
        pct(latency_ms, 50) as p50,
        pct(latency_ms, 95) as p95,
        pct(latency_ms, 99) as p99
        by service_name
```

**Trace correlation (find logs by trace ID):**
```sql
fields @timestamp, @message, span_id, service_name
| filter trace_id = "db1fc322141e64eb84f5bd8a8b1c6d1f"
| sort @timestamp asc
```

**Pod crash investigation:**
```sql
fields @timestamp, @message, kubernetes.pod_name, kubernetes.container_name
| filter @message like /OOMKilled|CrashLoopBackOff|Error/
| stats count() as crash_count by kubernetes.pod_name
| sort crash_count desc
```

**Request rate by endpoint:**
```sql
fields @timestamp, http_method, http_path, status_code
| filter ispresent(http_method)
| stats count() as request_count by http_method, http_path, status_code
| sort request_count desc
```

---

## Tracing-Based Debugging

### 1. OpenTelemetry Collector Configuration for EKS

**Deployment mode: DaemonSet for traces**

```yaml
apiVersion: opentelemetry.io/v1beta1
kind: OpenTelemetryCollector
metadata:
  name: otel-collector
  namespace: observability
spec:
  mode: daemonset
  image: otel/opentelemetry-collector-k8s:latest
  config:
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
        timeout: 10s
        send_batch_size: 1024
        send_batch_max_size: 2048

      memory_limiter:
        check_interval: 1s
        limit_percentage: 75
        spike_limit_percentage: 15

      k8sattributes:
        auth_type: "serviceAccount"
        passthrough: false
        extract:
          metadata:
            - k8s.namespace.name
            - k8s.deployment.name
            - k8s.statefulset.name
            - k8s.daemonset.name
            - k8s.cronjob.name
            - k8s.job.name
            - k8s.node.name
            - k8s.pod.name
            - k8s.pod.uid
            - k8s.pod.start_time
          labels:
            - tag_name: app.label.component
              key: app.kubernetes.io/component
              from: pod
        pod_association:
          - sources:
              - from: resource_attribute
                name: k8s.pod.ip
          - sources:
              - from: resource_attribute
                name: k8s.pod.uid
          - sources:
              - from: connection

    exporters:
      awsxray:
        region: us-east-1
        indexed_attributes:
          - kubernetes.namespace
          - kubernetes.pod
          - http.status_code
          - error

      awsemf:
        region: us-east-1
        namespace: EKS/ContainerInsights
        log_group_name: /aws/containerinsights/my-cluster/performance
        dimension_rollup_option: NoDimensionRollup
        metric_declarations:
          - dimensions: [[service.name, kubernetes.namespace]]
            metric_name_selectors:
              - request.duration
              - request.count

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [awsxray]
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [awsemf]
```

### 2. AWS X-Ray Integration

**ADOT Collector with X-Ray:**

```yaml
# Application instrumentation (Python example)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware

app = Flask(__name__)
XRayMiddleware(app, xray_recorder)

@app.route('/api/orders')
@xray_recorder.capture('process_order')
def process_order():
    # Add custom metadata
    xray_recorder.put_metadata('order_id', order_id)
    xray_recorder.put_annotation('user_type', 'premium')

    # Trace downstream calls
    response = requests.get('http://inventory-service/check')
    return response
```

**X-Ray Service Map Benefits:**
- Visualize service dependencies
- Identify bottlenecks and latency hotspots
- Detect error propagation patterns
- Analyze request traces end-to-end

### 3. Trace-Based Debugging Workflow

#### Step 1: Identify High-Latency Traces

**X-Ray Console Filter:**
```
service("api-gateway") AND duration > 1000
```

#### Step 2: Drill Down to Span Details

**Trace structure example:**
```
api-gateway [200ms]
  ├─ authentication-service [50ms]
  ├─ order-service [120ms]
  │   ├─ inventory-service [80ms] ← BOTTLENECK
  │   └─ pricing-service [30ms]
  └─ notification-service [20ms]
```

#### Step 3: Correlate with Logs

**Using trace_id from X-Ray:**
```bash
kubectl logs deployment/inventory-service | grep "trace_id=abc123def456"
```

**CloudWatch Logs Insights:**
```sql
fields @timestamp, @message, service, span_id
| filter trace_id = "abc123def456"
| sort @timestamp asc
```

#### Step 4: Correlate with Metrics

**PromQL query for service latency:**
```promql
histogram_quantile(0.99,
  sum by (service, le) (
    rate(http_request_duration_seconds_bucket{
      service="inventory-service"
    }[5m])
  )
)
```

### 4. Distributed Context Propagation

**W3C Trace Context headers:**
```
traceparent: 00-db1fc322141e64eb84f5bd8a8b1c6d1f-5c2b0f851030d17d-01
tracestate: congo=t61rcWkgMzE
```

**Baggage propagation (OpenTelemetry):**
```python
from opentelemetry import baggage

# Set baggage
baggage.set_baggage("user.id", "12345")
baggage.set_baggage("tenant.id", "org-abc")

# Baggage propagates across service boundaries automatically
# Retrieve in downstream service
user_id = baggage.get_baggage("user.id")
```

---

## Dashboard and Alerting

### 1. Essential Grafana Dashboards for Kubernetes

#### Cluster Overview Dashboard

**Key panels:**
- Cluster CPU usage: `sum(rate(container_cpu_usage_seconds_total[5m]))`
- Cluster memory usage: `sum(container_memory_working_set_bytes)`
- Node status: `kube_node_status_condition{condition="Ready"}`
- Pod count by phase: `count by (phase) (kube_pod_status_phase)`

#### Node Dashboard

**Key panels:**
```promql
# CPU utilization per node
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory utilization per node
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))

# Disk utilization per node
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)

# Network throughput per node
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
```

#### Pod Dashboard

**Key panels:**
```promql
# Pod CPU usage
sum by (namespace, pod) (rate(container_cpu_usage_seconds_total{container!=""}[5m]))

# Pod memory usage
sum by (namespace, pod) (container_memory_working_set_bytes{container!=""})

# Pod restart count
kube_pod_container_status_restarts_total

# Pod network I/O
sum by (namespace, pod) (rate(container_network_receive_bytes_total[5m]))
sum by (namespace, pod) (rate(container_network_transmit_bytes_total[5m]))
```

#### Application Performance Dashboard

**RED method (Rate, Errors, Duration):**
```promql
# Request rate
sum(rate(http_requests_total[5m])) by (service, method, status)

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)

# Duration (latency)
histogram_quantile(0.99, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))
```

### 2. Alert Rules for Common Kubernetes Failures

#### Pod Alerts

```yaml
groups:
  - name: pod_alerts
    interval: 30s
    rules:
      # Pod CrashLoopBackOff
      - alert: PodCrashLooping
        expr: |
          rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
          component: kubernetes
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash looping"
          description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has restarted {{ $value }} times in the last 15 minutes"
          runbook_url: "https://runbooks.example.com/PodCrashLooping"

      # Pod OOMKilled
      - alert: PodOOMKilled
        expr: |
          kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} > 0
        for: 1m
        labels:
          severity: warning
          component: kubernetes
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} was OOMKilled"
          description: "Container {{ $labels.container }} in pod {{ $labels.namespace }}/{{ $labels.pod }} was terminated due to out of memory"
          runbook_url: "https://runbooks.example.com/PodOOMKilled"

      # Pod Not Ready
      - alert: PodNotReady
        expr: |
          sum by (namespace, pod) (
            kube_pod_status_phase{phase=~"Pending|Unknown|Failed"}
          ) > 0
        for: 15m
        labels:
          severity: warning
          component: kubernetes
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} not ready"
          description: "Pod has been in a non-ready state for more than 15 minutes"
```

#### Node Alerts

```yaml
  - name: node_alerts
    interval: 30s
    rules:
      # Node high CPU
      - alert: NodeHighCPU
        expr: |
          100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          component: infrastructure
        annotations:
          summary: "Node {{ $labels.instance }} high CPU usage"
          description: "CPU usage is above 80% (current: {{ $value | humanize }}%)"

      # Node high memory
      - alert: NodeHighMemory
        expr: |
          100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 85
        for: 10m
        labels:
          severity: warning
          component: infrastructure
        annotations:
          summary: "Node {{ $labels.instance }} high memory usage"
          description: "Memory usage is above 85% (current: {{ $value | humanize }}%)"

      # Node disk pressure
      - alert: NodeDiskPressure
        expr: |
          kube_node_status_condition{condition="DiskPressure",status="true"} == 1
        for: 5m
        labels:
          severity: critical
          component: infrastructure
        annotations:
          summary: "Node {{ $labels.node }} has disk pressure"
          description: "Node is experiencing disk pressure"

      # Node not ready
      - alert: NodeNotReady
        expr: |
          kube_node_status_condition{condition="Ready",status="true"} == 0
        for: 5m
        labels:
          severity: critical
          component: infrastructure
        annotations:
          summary: "Node {{ $labels.node }} not ready"
          description: "Node has been in NotReady state for more than 5 minutes"
```

#### Deployment Alerts

```yaml
  - name: deployment_alerts
    interval: 30s
    rules:
      # Deployment replica mismatch
      - alert: DeploymentReplicasMismatch
        expr: |
          kube_deployment_spec_replicas != kube_deployment_status_replicas_available
        for: 15m
        labels:
          severity: warning
          component: kubernetes
        annotations:
          summary: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} replica mismatch"
          description: "Desired replicas ({{ $labels.spec_replicas }}) does not match available replicas"

      # Deployment rollout stuck
      - alert: DeploymentRolloutStuck
        expr: |
          kube_deployment_status_condition{condition="Progressing",status="false"} == 1
        for: 10m
        labels:
          severity: critical
          component: kubernetes
        annotations:
          summary: "Deployment {{ $labels.namespace }}/{{ $labels.deployment }} rollout stuck"
          description: "Deployment rollout has been stuck for more than 10 minutes"
```

### 3. SLI/SLO-Based Debugging Approach

#### Define SLIs

**Availability SLI:**
```promql
# Good events / Total events
sum(rate(http_requests_total{status!~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

**Latency SLI:**
```promql
# Proportion of requests < 500ms
sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
/
sum(rate(http_request_duration_seconds_count[5m]))
```

#### Set SLOs

| Service | SLI | SLO Target | Error Budget (monthly) |
|---------|-----|-----------|----------------------|
| API Gateway | Availability | 99.9% | 43.2 minutes |
| Order Service | Latency (p99 < 500ms) | 99.5% | 3.6 hours |
| Payment Service | Availability | 99.95% | 21.6 minutes |

#### Error Budget Alert

```yaml
  - name: slo_alerts
    interval: 1m
    rules:
      - alert: ErrorBudgetBurn
        expr: |
          (
            1 - (
              sum(rate(http_requests_total{job="api-gateway",status!~"5.."}[1h]))
              /
              sum(rate(http_requests_total{job="api-gateway"}[1h]))
            )
          ) > (1 - 0.999) * 14.4  # 14.4x burn rate for 1-hour window
        labels:
          severity: critical
          slo: availability
        annotations:
          summary: "Fast error budget burn for api-gateway"
          description: "At current rate, monthly error budget will be exhausted in {{ $value | humanize }} hours"
          runbook_url: "https://runbooks.example.com/ErrorBudgetBurn"
```

### 4. Runbook Automation

#### Structured Runbook Example

```yaml
# runbooks/PodCrashLooping.yaml
name: PodCrashLooping
severity: critical
description: |
  Pod is repeatedly crashing and restarting

investigation_steps:
  - name: Check pod status
    command: |
      kubectl get pod {{ .PodName }} -n {{ .Namespace }} -o yaml

  - name: Check recent logs
    command: |
      kubectl logs {{ .PodName }} -n {{ .Namespace }} --tail=100

  - name: Check previous container logs
    command: |
      kubectl logs {{ .PodName }} -n {{ .Namespace }} --previous

  - name: Describe pod for events
    command: |
      kubectl describe pod {{ .PodName }} -n {{ .Namespace }}

  - name: Check resource limits
    command: |
      kubectl get pod {{ .PodName }} -n {{ .Namespace }} -o jsonpath='{.spec.containers[*].resources}'

common_causes:
  - Application crash on startup
  - Missing environment variables or config
  - Liveness probe failure
  - OOMKilled due to memory limits
  - Dependency service unavailable

remediation_actions:
  - Increase resource limits if OOMKilled
  - Fix application code if crashing
  - Verify configmaps and secrets exist
  - Adjust liveness probe settings
  - Check dependency service availability

escalation:
  team: platform-engineering
  slack_channel: "#incidents"
  pagerduty_service: "kubernetes-platform"
```

---

## Events and Auditing

### 1. Kubernetes Events Analysis

#### Event Types

| Type | Examples | Debugging Use |
|------|---------|---------------|
| **Normal** | Scheduled, Pulled, Created, Started | Lifecycle tracking |
| **Warning** | FailedScheduling, BackOff, Unhealthy, Failed | Error detection |

#### Essential Event Queries

```bash
# Watch all events in real-time
kubectl get events --watch

# Events for specific pod
kubectl get events --field-selector involvedObject.name=my-pod

# Warning events only
kubectl get events --field-selector type=Warning

# Events in last hour
kubectl get events --field-selector involvedObject.kind=Pod \
  --sort-by='.lastTimestamp' \
  | awk -v d="$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" '$1 > d'

# Failed scheduling events
kubectl get events --field-selector reason=FailedScheduling

# Image pull errors
kubectl get events --field-selector reason=Failed,involvedObject.kind=Pod \
  | grep -i "image"
```

#### Common Event Patterns

**FailedScheduling:**
```
Warning  FailedScheduling  pod/my-app-xyz
  0/3 nodes are available: 1 node(s) had taint {node-role.kubernetes.io/master: },
  that the pod didn't tolerate, 2 Insufficient cpu.
```
**Diagnosis:** Insufficient cluster resources or taints/tolerations mismatch

**BackOff/CrashLoopBackOff:**
```
Warning  BackOff  pod/my-app-xyz
  Back-off restarting failed container
```
**Diagnosis:** Application crash on startup, check logs with `kubectl logs --previous`

**FailedMount:**
```
Warning  FailedMount  pod/my-app-xyz
  Unable to attach or mount volumes: unmounted volumes=[config],
  unattached volumes=[config kube-api-access]: timed out waiting for the condition
```
**Diagnosis:** ConfigMap/Secret missing or PVC not available

### 2. Audit Log Analysis

#### Enable Audit Logging (EKS)

**Audit policy example:**
```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  # Log all requests at Metadata level
  - level: Metadata
    omitStages:
      - "RequestReceived"

  # Log pod changes at Request level
  - level: Request
    resources:
      - group: ""
        resources: ["pods"]
    verbs: ["create", "delete", "update", "patch"]

  # Log secret access at Metadata level (avoid logging secret data)
  - level: Metadata
    resources:
      - group: ""
        resources: ["secrets"]

  # Don't log read-only requests to certain resources
  - level: None
    resources:
      - group: ""
        resources: ["events", "nodes/status", "pods/status"]
    verbs: ["get", "list", "watch"]
```

#### Audit Log Query Examples (CloudWatch Logs Insights)

**Who deleted the pod?**
```sql
fields @timestamp, user.username, verb, objectRef.name
| filter verb = "delete" and objectRef.resource = "pods"
| sort @timestamp desc
```

**Failed authentication attempts:**
```sql
fields @timestamp, user.username, sourceIPs, responseStatus.code
| filter responseStatus.code >= 400
| stats count() by user.username, sourceIPs
| sort count desc
```

**Unauthorized API access attempts:**
```sql
fields @timestamp, user.username, verb, objectRef.resource, responseStatus.reason
| filter responseStatus.reason = "Forbidden"
| sort @timestamp desc
```

### 3. Event-Driven Debugging Workflow

#### Workflow: Investigate Pod Failure

```bash
# Step 1: Identify failing pods
kubectl get pods -A | grep -v Running

# Step 2: Get events for the pod
kubectl describe pod <pod-name> -n <namespace> | grep -A 20 Events:

# Step 3: If FailedScheduling, check node capacity
kubectl describe nodes | grep -A 5 "Allocated resources"

# Step 4: If ImagePullBackOff, verify image
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.containers[*].image}'

# Step 5: If CrashLoopBackOff, check logs
kubectl logs <pod-name> -n <namespace> --previous --tail=50

# Step 6: Correlate with metrics
# Check if OOMKilled in Prometheus:
# kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}
```

---

## Tool Comparison Matrix

### Metrics Collection Tools

| Tool | Strengths | Weaknesses | Best For | EKS Integration |
|------|-----------|------------|----------|-----------------|
| **Prometheus** | Industry standard, rich ecosystem, powerful PromQL | Self-managed, storage scaling | Time-series metrics, alerting | Helm chart, Prometheus Operator |
| **Amazon Managed Prometheus** | Fully managed, auto-scaling, HA out-of-box | AWS-specific, limited customization | Production EKS without ops overhead | Native AWS integration, remote_write |
| **CloudWatch Container Insights** | Zero setup, integrated with AWS console | Limited query flexibility, higher cost | Quick setup, AWS-native workflows | Automatic via CloudWatch agent |
| **kube-state-metrics** | Kubernetes-specific metrics, lightweight | Requires Prometheus to consume | K8s object state monitoring | Deploy as Deployment |
| **node-exporter** | Comprehensive host metrics | Requires Prometheus to consume | Infrastructure monitoring | Deploy as DaemonSet |

### Log Aggregation Tools

| Tool | Strengths | Weaknesses | Best For | EKS Integration |
|------|-----------|------------|----------|-----------------|
| **Fluent Bit** | Lightweight (450KB), high performance, low memory | Fewer plugins than Fluentd | DaemonSet log collection | Official CloudWatch output |
| **Fluentd** | 1000+ plugins, mature ecosystem, flexible | Higher resource usage (~40MB) | Complex log transformations | CloudWatch/S3/Elasticsearch outputs |
| **CloudWatch Logs** | Fully managed, Logs Insights queries, AWS-native | Cost at scale, limited retention options | AWS-centric architectures | Container Insights integration |
| **Amazon OpenSearch** | Powerful search, Kibana dashboards, analytics | Complex setup, cost management | Log search and analytics | Fluent Bit/Fluentd output |

### Tracing Tools

| Tool | Strengths | Weaknesses | Best For | EKS Integration |
|------|-----------|------------|----------|-----------------|
| **AWS X-Ray** | Service maps, AWS integration, low overhead | AWS-specific, limited sampling control | AWS microservices | ADOT Collector, X-Ray SDK |
| **Jaeger** | Open source, flexible backends, detailed traces | Self-managed, storage complexity | Multi-cloud, open standards | Deploy via Helm, OTLP input |
| **OpenTelemetry Collector** | Vendor-neutral, flexible pipelines, future-proof | Configuration complexity | Standardized instrumentation | ADOT for AWS, native Helm chart |

### Visualization & Dashboarding

| Tool | Strengths | Weaknesses | Best For | EKS Integration |
|------|-----------|------------|----------|-----------------|
| **Grafana** | Rich visualization, plugin ecosystem, multi-source | Dashboard maintenance overhead | Unified observability UI | Amazon Managed Grafana or self-hosted |
| **CloudWatch Dashboards** | AWS-native, automatic Container Insights dashboards | Limited customization, basic visuals | AWS-only metrics | Built-in Container Insights |
| **Kibana** | Log search UI, built for Elasticsearch | Tied to Elasticsearch | Log analysis and search | With Amazon OpenSearch |

### Complete Stack Recommendations

#### Option 1: AWS-Native Stack (Least Ops Overhead)
```
Metrics:   CloudWatch Container Insights + Amazon Managed Prometheus
Logs:      Fluent Bit → CloudWatch Logs
Traces:    ADOT Collector → AWS X-Ray
Dashboards: Amazon Managed Grafana + CloudWatch Dashboards
```
**Pros:** Fully managed, minimal operations, AWS support
**Cons:** Higher cost, AWS vendor lock-in

#### Option 2: Open Source Stack (Most Flexible)
```
Metrics:   Prometheus + kube-state-metrics + node-exporter
Logs:      Fluent Bit → Elasticsearch
Traces:    Jaeger + OpenTelemetry Collector
Dashboards: Grafana
```
**Pros:** Full control, portable, cost-effective at scale
**Cons:** Operational overhead, requires expertise

#### Option 3: Hybrid Stack (Balanced)
```
Metrics:   Prometheus (remote_write) → Amazon Managed Prometheus
Logs:      Fluent Bit → CloudWatch Logs
Traces:    OpenTelemetry Collector → AWS X-Ray
Dashboards: Amazon Managed Grafana
```
**Pros:** Leverage managed services, maintain open standards
**Cons:** Multi-tool complexity

---

## Key Takeaways

### Critical Success Factors

1. **Unified Context:** Always correlate logs, metrics, and traces using trace_id and Kubernetes attributes
2. **Structured Logging:** Use JSON format with consistent field names across services
3. **Kubernetes Attributes:** Enrich all telemetry with namespace, pod, node metadata via k8sattributes processor
4. **SLI/SLO-Based Alerting:** Focus alerts on user-impacting issues, not just resource thresholds
5. **Runbook Automation:** Document investigation steps and automate common remediation tasks

### Essential Metrics to Monitor

- **Pod:** CPU, memory, restart count, OOMKilled events, network I/O
- **Node:** CPU, memory, disk pressure, network saturation, ready status
- **Cluster:** Total pod count, failed pods, node count, resource quotas
- **Application:** Request rate, error rate, latency (RED method)

### Essential Log Patterns

- **Structured JSON** with trace_id, span_id, service, namespace, pod
- **Error tracking** with stack traces and context
- **Request/response logging** with duration, status code, endpoint
- **Audit events** for security and compliance

### Essential Traces

- **End-to-end transaction traces** across microservices
- **Span annotations** with business context (user_id, order_id)
- **Error traces** with exception details
- **Performance bottleneck identification** via span durations

---

## References

### Official Documentation

1. **OpenTelemetry**
   - Documentation: https://opentelemetry.io/docs/
   - Kubernetes Integration: https://opentelemetry.io/docs/platforms/kubernetes/
   - Collector Configuration: https://opentelemetry.io/docs/collector/configuration/

2. **Prometheus**
   - Documentation: https://prometheus.io/docs/
   - PromQL: https://prometheus.io/docs/prometheus/latest/querying/basics/
   - Alerting Rules: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/

3. **Grafana**
   - Documentation: https://grafana.com/docs/grafana/latest/
   - Dashboards: https://grafana.com/grafana/dashboards/

4. **AWS CloudWatch Container Insights**
   - Documentation: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html
   - Logs Insights: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html

5. **AWS Distro for OpenTelemetry (ADOT)**
   - Homepage: https://aws.amazon.com/otel/
   - Documentation: https://aws-otel.github.io/docs/

6. **Amazon Managed Prometheus**
   - Documentation: https://docs.aws.amazon.com/prometheus/

7. **AWS X-Ray**
   - Documentation: https://docs.aws.amazon.com/xray/
   - Service Graph: https://docs.aws.amazon.com/xray/latest/devguide/xray-console.html

8. **Kubernetes**
   - Metrics Pipeline: https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/
   - Logging Architecture: https://kubernetes.io/docs/concepts/cluster-administration/logging/
   - Debugging Pods: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/
   - Events: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_events/

### CNCF Projects

- **Prometheus** (Graduated): https://prometheus.io/
- **Jaeger** (Graduated): https://www.jaegertracing.io/
- **OpenTelemetry** (Incubating): https://opentelemetry.io/
- **Fluentd** (Incubating): https://www.fluentd.org/
- **CNCF Landscape**: https://landscape.cncf.io/

### GitHub Repositories

- **kube-prometheus**: https://github.com/prometheus-operator/kube-prometheus
- **kube-state-metrics**: https://github.com/kubernetes/kube-state-metrics
- **Fluent Bit**: https://fluentbit.io/

### Books & Resources

- **SRE Workbook - Implementing SLOs**: https://sre.google/workbook/implementing-slos/

---

## Appendix: Quick Reference Commands

### kubectl Debugging Commands

```bash
# Pod status and events
kubectl get pods -A --field-selector=status.phase!=Running
kubectl describe pod <pod> -n <namespace>
kubectl get events --field-selector involvedObject.name=<pod>

# Logs
kubectl logs <pod> -n <namespace> --tail=100
kubectl logs <pod> -n <namespace> --previous
kubectl logs <pod> -n <namespace> -c <container> --follow

# Resource usage
kubectl top nodes
kubectl top pods -A --sort-by=cpu
kubectl top pods -A --sort-by=memory

# Debugging
kubectl exec -it <pod> -n <namespace> -- /bin/sh
kubectl port-forward <pod> -n <namespace> 8080:8080
kubectl debug <pod> -n <namespace> -it --image=busybox

# Configuration
kubectl get pod <pod> -n <namespace> -o yaml
kubectl get pod <pod> -n <namespace> -o jsonpath='{.spec.containers[*].resources}'
```

### PromQL Quick Reference

```promql
# Instant vector (current value)
container_memory_usage_bytes{pod="my-pod"}

# Range vector (time series)
container_memory_usage_bytes{pod="my-pod"}[5m]

# Rate (per-second average)
rate(http_requests_total[5m])

# Aggregation
sum by (namespace) (container_memory_usage_bytes)

# Percentile
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Comparison
container_memory_usage_bytes > 1e9
```

### CloudWatch Logs Insights Quick Reference

```sql
-- Basic query
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- Aggregation
stats count() by service_name

-- Percentiles
stats pct(latency_ms, 99) as p99 by service_name

-- Parse JSON
parse @message /"level":"(?<level>[^"]+)"/
| filter level = "error"
```

---

**Document Version:** 1.0
**Last Updated:** 2024-02-10
**Author:** Research Synthesis
**Target Audience:** Platform Engineers, SREs, DevOps Teams
