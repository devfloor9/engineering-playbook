---
title: Probe patterns by workload
description: Review examples for REST, gRPC, batch, JVM, and AI workloads.
created: "2026-02-12"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 12
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Probe patterns by workload
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md) · [Checklist and references](./checklist-references.md)

## Probe Patterns by Workload {#24-워크로드별-probe-패턴}

Image names and health endpoints are examples. Replace them with images and configurations validated by the organization, and measure probe and shutdown timing on actual workloads.

### Pattern 1: Web Service (REST API) {#패턴-1-웹-서비스-rest-api}

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rest-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rest-api
  template:
    metadata:
      labels:
        app: rest-api
    spec:
      containers:
      - name: api
        image: myapp/rest-api:v1.2.3
        ports:
        - containerPort: 8080
          protocol: TCP
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        # Startup Probe: Verify startup completes within 30 seconds
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          failureThreshold: 6
          periodSeconds: 5
        # Liveness Probe: Internal health checks only (exclude external dependencies)
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 0  # Set to 0 when using a Startup Probe
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness Probe: Can include external dependencies
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
          successThreshold: 1
        lifecycle:
          preStop:
            exec:
              command:
              - /bin/sh
              - -c
              - sleep 5
      terminationGracePeriodSeconds: 60
```

:::tip Why kill -TERM 1 Is Unnecessary in preStop
Kubernetes automatically sends SIGTERM to PID 1 in the container after the preStop hook completes. Running `kill -TERM 1` separately in preStop sends a duplicate SIGTERM and can produce unexpected behavior when PID 1 is an init process (tini or dumb-init). Leave SIGTERM delivery to kubelet. The `sleep 5` above is an example that assumes traffic propagation delay; measure actual EndpointSlice and load balancer propagation times to determine whether a delay is needed and how long it should be. The preStop execution time is also included in the total termination grace period.
:::

**Health check endpoint implementation (Node.js/Express):**

This partial example is intended to be added to an existing Express application. The application must configure initialization of `app`, `db`, and `redis`, along with timeouts for dependency calls. Before including the database and Redis in readiness checks, determine whether they are essential for request processing and whether a shared failure would remove all replicas from service simultaneously.

```javascript
// /healthz - Liveness: Check only the application's own health
app.get('/healthz', (req, res) => {
  // This minimal example checks whether the event loop responds.
  // Do not use momentary memory utilization or external service failures as restart conditions.
  res.status(200).json({ status: 'ok' });
});

// /ready - Readiness: Include external dependency checks
app.get('/ready', async (req, res) => {
  try {
    // Check the database connection
    await db.ping();
    // Check the Redis connection
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', reason: err.message });
  }
});
```

### Pattern 2: gRPC Service {#패턴-2-grpc-서비스}

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grpc-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: grpc-service
  template:
    metadata:
      labels:
        app: grpc-service
    spec:
      containers:
      - name: grpc-server
        image: myapp/grpc-service:v2.1.0
        ports:
        - containerPort: 9090
          name: grpc
        resources:
          requests:
            cpu: 300m
            memory: 512Mi
          limits:
            cpu: 1
            memory: 1Gi
        # gRPC native probe (K8s 1.27+)
        startupProbe:
          grpc:
            port: 9090
            service: myapp.HealthService  # Optional
          failureThreshold: 30
          periodSeconds: 10
        livenessProbe:
          grpc:
            port: 9090
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          grpc:
            port: 9090
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
      terminationGracePeriodSeconds: 45
```

**gRPC health check implementation (Go):**

```go
package main

import (
    "log"
    "net"
    "google.golang.org/grpc"
    "google.golang.org/grpc/health"
    "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
    server := grpc.NewServer()

    // Register the health service
    healthServer := health.NewServer()
    grpc_health_v1.RegisterHealthServer(server, healthServer)

    // Set the service status to SERVING
    healthServer.SetServingStatus("myapp.HealthService", grpc_health_v1.HealthCheckResponse_SERVING)

    // The status can be changed to NOT_SERVING after checking dependencies
    // healthServer.SetServingStatus("myapp.HealthService", grpc_health_v1.HealthCheckResponse_NOT_SERVING)

    // Start the gRPC server
    lis, err := net.Listen("tcp", ":9090")
    if err != nil {
        log.Fatal(err)
    }
    if err := server.Serve(lis); err != nil {
        log.Fatal(err)
    }
}
```

### Pattern 3: Worker/Batch Processing {#패턴-3-워커배치-처리}

Batch workers use an `exec` probe because they do not have an HTTP server.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: batch-worker
  template:
    metadata:
      labels:
        app: batch-worker
    spec:
      containers:
      - name: worker
        image: myapp/batch-worker:v3.0.1
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2
            memory: 4Gi
        # Startup Probe: Verify worker initialization
        startupProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - test -f /tmp/worker-ready
          failureThreshold: 12
          periodSeconds: 5
        # Liveness Probe: Check the heartbeat file
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - find /tmp/heartbeat -mmin -2 | grep -q heartbeat
          initialDelaySeconds: 10
          periodSeconds: 30
          failureThreshold: 3
        # Readiness Probe: Check the job queue connection
        readinessProbe:
          exec:
            command:
            - /app/check-queue-connection.sh
          periodSeconds: 10
          failureThreshold: 3
      terminationGracePeriodSeconds: 120
```

**Worker application (Python):**

```python
import os
import time
from pathlib import Path

HEARTBEAT_FILE = Path("/tmp/heartbeat")
READY_FILE = Path("/tmp/worker-ready")

def worker_loop():
    # Signal that initialization is complete
    READY_FILE.touch()

    while True:
        # Update the heartbeat periodically
        HEARTBEAT_FILE.touch()

        # Process jobs
        process_jobs()
        time.sleep(5)

def process_jobs():
    # Actual job logic
    pass

if __name__ == "__main__":
    worker_loop()
```

### Pattern 4: Applications with Slow Startup (Spring Boot, JVM) {#패턴-4-느린-시작-앱-spring-boot-jvm}

JVM applications can take 30 seconds or longer to start. Protect startup with a Startup Probe.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 4
  selector:
    matchLabels:
      app: spring-boot
  template:
    metadata:
      labels:
        app: spring-boot
    spec:
      containers:
      - name: app
        image: myapp/spring-boot:v2.7.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 1
            memory: 2Gi
          limits:
            cpu: 2
            memory: 4Gi
        env:
        - name: JAVA_OPTS
          value: "-Xms1g -Xmx3g"
        # Startup Probe: Wait up to 5 minutes (30 x 10s)
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          failureThreshold: 30
          periodSeconds: 10
        # Liveness Probe: Activate after Startup succeeds
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness Probe: Include external dependencies
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
      terminationGracePeriodSeconds: 60
```

**Spring Boot Actuator configuration:**

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health
  health:
    livenessState:
      enabled: true
    readinessState:
      enabled: true
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
```

### Pattern 5: Sidecar Pattern (Istio Proxy + Application) {#패턴-5-사이드카-패턴-istio-proxy--앱}

In the sidecar pattern, configure probes for both the main container and the sidecar.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-sidecar
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      # Main application container
      - name: app
        image: myapp/app:v1.0.0
        ports:
        - containerPort: 8080
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          failureThreshold: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
      # Istio sidecar (Istio adds probes during automatic injection)
      # Manual configuration example:
      - name: istio-proxy
        image: istio/proxyv2:1.22.0
        ports:
        - containerPort: 15090
          name: http-envoy-prom
        startupProbe:
          httpGet:
            path: /healthz/ready
            port: 15021
          failureThreshold: 30
          periodSeconds: 1
        livenessProbe:
          httpGet:
            path: /healthz/ready
            port: 15021
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthz/ready
            port: 15021
          periodSeconds: 2
      terminationGracePeriodSeconds: 90
```

:::tip Istio Sidecar Injection
When Istio uses automatic injection (the `istio-injection=enabled` label), it automatically adds appropriate probes to the sidecar. Manual configuration is unnecessary.
:::

### Native Sidecar Containers (K8s 1.33 Stable) {#native-sidecar-containers-k8s-128-ga}

[Native Sidecar Containers](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/) were first introduced in Kubernetes 1.28, enabled by default in 1.29, and became Stable in 1.33. This official feature allows an Init Container to operate as a sidecar by setting `restartPolicy: Always`. It resolves the **termination ordering issue** in the conventional sidecar pattern.

**Conventional issue**: A regular sidecar receives SIGTERM at the same time as the main container. If the Istio proxy terminates first, the main application loses network connectivity.

**Native Sidecar solution**: A sidecar defined as an Init Container terminates **after** all regular containers have terminated.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-native-sidecar
spec:
  selector:
    matchLabels:
      app: "app-with-native-sidecar"
  template:
    metadata:
      labels:
        app: "app-with-native-sidecar"
    spec:
      initContainers:
      # Native Sidecar: Start before the main container and terminate after it
      - name: log-collector
        image: ghcr.io/your-org/log-collector:replace-with-tested-tag
        restartPolicy: Always  # This setting enables Native Sidecar behavior
        ports:
        - containerPort: 2020
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
      containers:
      - name: app
        image: myapp:v1
        ports:
        - containerPort: 8080
```

**Guaranteed termination order:**
1. Send SIGTERM to the regular container (app).
2. Wait for the regular container to finish terminating.
3. Send SIGTERM to the Native Sidecar (log-collector).
4. Terminate the Native Sidecar.

This pattern is suitable for supporting containers that must outlive the main application, such as Istio sidecars, log collectors, and monitoring agents.

### Probe Considerations for Windows Containers {#246-windows-컨테이너-probe-고려사항}

EKS supports Windows nodes based on Windows Server 2019/2022. Probes behave differently in Windows containers than in Linux containers.

#### Differences in Probe Behavior Between Windows and Linux {#windows-vs-linux-probe-동작-차이}

| Item | Linux containers | Windows containers | Impact |
|------|---------------|-----------------|------|
| **Container runtime** | containerd | containerd (1.6+) | Same runtime, different OS layer |
| **exec probe execution** | `/bin/sh -c` | `cmd.exe /c` or `powershell.exe` | Different script syntax |
| **httpGet probe** | Same | Same | No difference |
| **tcpSocket probe** | Same | Same | No difference |
| **Cold start time** | Fast (a few seconds) | Slow (10-30 seconds) | Requires a higher Startup Probe failureThreshold |
| **Memory overhead** | Low (50-100MB) | High (200-500MB) | Requires increased resource requests |
| **Probe timeout** | Typically 1-5 seconds | 3-10 seconds recommended | Account for Windows I/O latency |

#### Probe Configuration Example for Windows Workloads {#windows-워크로드-probe-설정-예시}

**IIS/.NET Framework application:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iis-app
  namespace: windows-workloads
spec:
  replicas: 2
  selector:
    matchLabels:
      app: iis-app
  template:
    metadata:
      labels:
        app: iis-app
    spec:
      nodeSelector:
        kubernetes.io/os: windows
        kubernetes.io/arch: amd64
      containers:
      - name: iis
        image: mcr.microsoft.com/windows/servercore/iis:windowsservercore-ltsc2022
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
        # Startup Probe: Account for Windows cold starts
        startupProbe:
          httpGet:
            path: /
            port: 80
            scheme: HTTP
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 12  # 2 times the Linux value (up to 60 seconds)
          successThreshold: 1
        # Liveness Probe: IIS process health
        livenessProbe:
          httpGet:
            path: /healthz
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness Probe: ASP.NET application readiness
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 5
          timeoutSeconds: 5
          failureThreshold: 3
          successThreshold: 1
      terminationGracePeriodSeconds: 60
```

**ASP.NET Core health check endpoint implementation:**

```csharp
// Program.cs (ASP.NET Core 6+)
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Add health checks
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy())
    .AddSqlServer(
        connectionString: builder.Configuration.GetConnectionString("DefaultConnection"),
        name: "sqlserver",
        tags: new[] { "ready" }
    );

var app = builder.Build();

// /healthz - Liveness: Application only
app.MapHealthChecks("/healthz", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("self") || check.Tags.Count == 0
});

// /ready - Readiness: Include external dependencies
app.MapHealthChecks("/ready", new HealthCheckOptions
{
    Predicate = _ => true  // All health checks
});

app.Run();
```

#### Probe Timeout Considerations for Windows Workloads {#windows-워크로드-probe-타임아웃-주의사항}

Windows containers can require longer probe timeouts for the following reasons:

1. **Windows kernel overhead**: System call latency caused by the heavy Windows OS layer
2. **Disk I/O performance**: Metadata overhead in the NTFS filesystem
3. **.NET Framework warmup**: CLR JIT compilation and assembly loading time
4. **Windows Defender**: Process startup delays caused by real-time scanning

**Probe timing example (Windows):**

The following partial example is intended to be merged into a container configuration. Adjust the numbers after measurement; range strings such as `5-10` cannot be used in Kubernetes integer fields. Also update the health endpoints to match the application.

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 5
  periodSeconds: 5
  failureThreshold: 12

livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 5
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  timeoutSeconds: 5
  periodSeconds: 5
  failureThreshold: 3
```

#### CloudWatch Container Insights for Windows (2025-08) {#cloudwatch-container-insights-for-windows-2025-08}

AWS announced CloudWatch Container Insights support for Windows workloads in August 2025.

**Installing Container Insights on Windows nodes:**

```bash
# CloudWatch Agent ConfigMap (Windows)
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig-windows
  namespace: amazon-cloudwatch
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "cluster_name": "my-eks-cluster",
            "metrics_collection_interval": 60
          }
        }
      },
      "metrics": {
        "namespace": "ContainerInsights",
        "metrics_collected": {
          "statsd": {
            "service_address": ":8125"
          }
        }
      }
    }
EOF

# Deploy the Windows DaemonSet
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-daemonset-windows.yaml
```

**Checking Container Insights metrics:**

```bash
# Windows node metrics
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name node_memory_utilization \
  --dimensions Name=ClusterName,Value=my-eks-cluster Name=NodeName,Value=windows-node-1 \
  --start-time 2026-02-12T00:00:00Z \
  --end-time 2026-02-12T23:59:59Z \
  --period 300 \
  --statistics Average

# Windows Pod metrics
aws cloudwatch get-metric-statistics \
  --namespace ContainerInsights \
  --metric-name pod_cpu_utilization \
  --dimensions Name=ClusterName,Value=my-eks-cluster Name=Namespace,Value=windows-workloads \
  --start-time 2026-02-12T00:00:00Z \
  --end-time 2026-02-12T23:59:59Z \
  --period 60 \
  --statistics Average
```

#### Unified Monitoring Strategy for Mixed Clusters (Linux + Windows) {#혼합-클러스터-linux--windows-통합-모니터링-전략}

**1. Separation by node selector:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: unified-app
spec:
  selector:
    app: unified-app  # OS-independent
  ports:
  - port: 80
    targetPort: 8080
---
# Linux Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unified-app-linux
spec:
  replicas: 3
  selector:
    matchLabels:
      app: unified-app
      os: linux
  template:
    metadata:
      labels:
        app: unified-app
        os: linux
    spec:
      nodeSelector:
        kubernetes.io/os: linux
      containers:
      - name: app
        image: myapp:linux-v1
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
---
# Windows Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: unified-app-windows
spec:
  replicas: 2
  selector:
    matchLabels:
      app: unified-app
      os: windows
  template:
    metadata:
      labels:
        app: unified-app
        os: windows
    spec:
      nodeSelector:
        kubernetes.io/os: windows
      containers:
      - name: app
        image: myapp:windows-v1
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 10      # Windows: Longer interval
          timeoutSeconds: 10     # Windows: Longer timeout
```

**2. Unified CloudWatch Logs Insights query:**

```sql
-- Search Linux and Windows Pod logs together
fields @timestamp, kubernetes.namespace_name, kubernetes.pod_name, kubernetes.host, @message
| filter kubernetes.labels.app = "unified-app"
| sort @timestamp desc
| limit 100
```

**3. Grafana dashboard integration:**

```promql
# Prometheus Query (mixed cluster)
# Linux + Windows Pod CPU utilization
sum(rate(container_cpu_usage_seconds_total{namespace="default", pod=~"unified-app-.*"}[5m])) by (pod, node, os)

# Aggregate by OS
sum(rate(container_cpu_usage_seconds_total{namespace="default", pod=~"unified-app-.*"}[5m])) by (os)
```

:::warning Windows Container Limitations
- **Image size**: Windows images are several GB (Linux images are tens of MB).
- **Licensing costs**: Windows Server licensing costs apply (included in EC2 instance costs).
- **Node boot time**: Windows nodes boot slowly (5-10 minutes).
- **Privileged containers**: Windows does not support Linux's `privileged` mode.
- **HostProcess containers**: Supported starting with Windows Server 2022 (1.22+).
:::

:::info References
- [AWS Blog: CloudWatch Container Insights for Windows](https://aws.amazon.com/blogs/mt/announcing-amazon-cloudwatch-container-insights-for-amazon-eks-windows-workloads-monitoring)
- [EKS Windows Container Documentation](https://docs.aws.amazon.com/eks/latest/userguide/windows-support.html)
- [Kubernetes Windows Container Guide](https://kubernetes.io/docs/concepts/windows/)
:::
