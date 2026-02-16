---
title: "EKS资源优化"
sidebar_label: "EKS资源优化"
description: "Amazon EKS集群资源优化的综合指南 - 从计算、存储到网络的全方位优化"
tags: [eks, kubernetes, aws, optimization, performance]
---

# EKS资源优化综合指南

本指南提供Amazon EKS集群资源优化的完整策略，涵盖计算、存储、网络和成本优化的各个方面。

## 计算资源优化

### 1. 节点组优化策略

#### 混合实例策略

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: optimized-cluster
  region: us-west-2

nodeGroups:
  - name: spot-mixed
    desiredCapacity: 5
    minSize: 2
    maxSize: 20
    instancesDistribution:
      instanceTypes:
        - m5.large
        - m5a.large
        - m5n.large
        - m6i.large
      onDemandPercentageAboveBaseCapacity: 0
      spotInstancePools: 4
    labels:
      workload-type: stateless
      cost-optimization: spot
    taints:
      - key: spot
        value: "true"
        effect: NoSchedule

  - name: on-demand-critical
    desiredCapacity: 3
    minSize: 2
    maxSize: 10
    instanceTypes:
      - m5.xlarge
    labels:
      workload-type: critical
      cost-optimization: on-demand
```

#### Karpenter高级配置

```yaml
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: optimized-nodepool
spec:
  template:
    metadata:
      labels:
        karpenter.sh/nodepool: optimized
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64", "arm64"]  # 支持Graviton
        - key: node.kubernetes.io/instance-type
          operator: In
          values:
            # 计算优化
            - c5.large
            - c5a.large
            - c6i.large
            # 内存优化
            - r5.large
            - r5a.large
            - r6i.large
            # 通用型
            - m5.large
            - m5a.large
            - m6i.large
            # ARM实例(成本更低)
            - m6g.large
            - c6g.large

      nodeClassRef:
        name: optimized-nodeclass

      # 启动模板配置
      userData: |
        #!/bin/bash
        /etc/eks/bootstrap.sh ${CLUSTER_NAME}

        # 优化内核参数
        echo "net.ipv4.ip_local_port_range = 1024 65535" >> /etc/sysctl.conf
        echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
        sysctl -p

        # 配置容器运行时
        mkdir -p /etc/containerd
        cat <<EOF > /etc/containerd/config.toml
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
          SystemdCgroup = true
        EOF
        systemctl restart containerd

  # 中断处理
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s
    expireAfter: 2m

  # 资源限制
  limits:
    cpu: "1000"
    memory: "1000Gi"

  # 权重策略
  weight: 100
```

### 2. Pod资源管理

#### VPA配置

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: application

  updatePolicy:
    updateMode: "Auto"

  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 4Gi
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits
```

#### HPA高级配置

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: application

  minReplicas: 3
  maxReplicas: 100

  metrics:
  # CPU指标
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  # 内存指标
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  # 自定义指标
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"

  # 外部指标(如SQS队列深度)
  - type: External
    external:
      metric:
        name: sqs_queue_depth
        selector:
          matchLabels:
            queue: "processing-queue"
      target:
        type: Value
        value: "30"

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 5
        periodSeconds: 60
      selectPolicy: Min

    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 10
        periodSeconds: 15
      selectPolicy: Max
```

## 存储优化

### 1. EBS优化

#### GP3存储类

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3-optimized
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
  fstype: ext4
  # 启用卷快照
  csi.storage.k8s.io/snapshotter-secret-name: ebs-snapshot-secret
  csi.storage.k8s.io/snapshotter-secret-namespace: kube-system
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
mountOptions:
  - noatime
  - nodiratime
```

#### 智能存储管理

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: storage-optimizer
data:
  optimize.sh: |
    #!/bin/bash

    # 清理未使用的PV
    for pv in $(kubectl get pv -o json | jq -r '.items[] | select(.status.phase=="Released") | .metadata.name'); do
      echo "删除未使用的PV: $pv"
      kubectl delete pv $pv
    done

    # 识别过度配置的PVC
    kubectl get pvc -A -o custom-columns=\
      NAMESPACE:.metadata.namespace,\
      NAME:.metadata.name,\
      SIZE:.spec.resources.requests.storage,\
      USED:.status.capacity.storage \
      --no-headers | while read ns name requested used; do

      req_bytes=$(numfmt --from=iec $requested)
      used_bytes=$(numfmt --from=iec $used)

      if [ $((used_bytes * 2)) -lt $req_bytes ]; then
        echo "PVC $ns/$name 可能过度配置: 请求=$requested, 使用=$used"
      fi
    done
```

### 2. EFS优化

```yaml
apiVersion: v1
kind: StorageClass
metadata:
  name: efs-optimized
provisioner: efs.csi.aws.com
parameters:
  provisioningMode: efs-ap
  fileSystemId: fs-12345678
  directoryPerms: "700"
  gidRangeStart: "1000"
  gidRangeEnd: "2000"
  basePath: "/dynamic_provisioning"
  # 性能模式
  performanceMode: generalPurpose  # 或 maxIO
  throughputMode: bursting  # 或 provisioned
mountOptions:
  - tls
  - iam
  - rsize=1048576
  - wsize=1048576
  - hard
  - timeo=600
  - retrans=2
  - noresvport
```

## 网络优化

### 1. CNI优化

#### AWS VPC CNI配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: amazon-vpc-cni
  namespace: kube-system
data:
  # 启用前缀委派(提高IP利用率)
  ENABLE_PREFIX_DELEGATION: "true"

  # 预热ENI和IP
  WARM_ENI_TARGET: "1"
  WARM_IP_TARGET: "5"
  MINIMUM_IP_TARGET: "2"

  # 启用网络策略
  ENABLE_NETWORK_POLICY: "true"

  # 外部SNAT
  AWS_VPC_K8S_CNI_EXTERNALSNAT: "false"

  # 自定义网络
  AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG: "true"

  # 日志级别
  AWS_VPC_K8S_CNI_LOGLEVEL: "INFO"
```

#### Cilium ENI模式

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cilium-config
  namespace: kube-system
data:
  # ENI模式
  ipam: "eni"
  enable-ipv4: "true"
  enable-ipv6: "false"

  # eBPF加速
  enable-bpf-masquerade: "true"
  enable-host-legacy-routing: "false"
  kube-proxy-replacement: "strict"

  # 性能优化
  bpf-map-dynamic-size-ratio: "0.0025"
  bpf-policy-map-max: "16384"
  bpf-lb-map-max: "65536"

  # 监控
  enable-hubble: "true"
  hubble-metrics-enabled: "true"
  hubble-metrics: "dns,drop,tcp,flow,icmp,http"
```

### 2. 负载均衡优化

#### AWS Load Balancer Controller

```yaml
apiVersion: v1
kind: Service
metadata:
  name: optimized-nlb
  annotations:
    # NLB配置
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"

    # 跨区负载均衡
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"

    # 保留源IP
    service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: |
      preserve_client_ip.enabled=true,
      deregistration_delay.timeout_seconds=30,
      stickiness.enabled=true,
      stickiness.type=source_ip

    # 健康检查
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-timeout: "6"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "2"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "2"
spec:
  type: LoadBalancer
  selector:
    app: application
  ports:
    - protocol: TCP
      port: 443
      targetPort: 8443
```

## 监控和可观测性

### 1. Prometheus配置

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 30s
      evaluation_interval: 30s
      external_labels:
        cluster: 'production-eks'
        region: 'us-west-2'

    scrape_configs:
    # Kubernetes指标
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

    # 节点指标
    - job_name: 'kubernetes-nodes'
      kubernetes_sd_configs:
      - role: node
      relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)

    # Pod指标
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
```

### 2. Grafana仪表板

```json
{
  "dashboard": {
    "title": "EKS资源优化",
    "panels": [
      {
        "title": "集群资源利用率",
        "targets": [
          {
            "expr": "100 * (1 - sum(rate(container_cpu_usage_seconds_total{container!=\"\"}[5m])) / sum(kube_node_status_allocatable{resource=\"cpu\"}))"
          }
        ]
      },
      {
        "title": "节点内存压力",
        "targets": [
          {
            "expr": "100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))"
          }
        ]
      },
      {
        "title": "Pod调度延迟",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(scheduler_scheduling_duration_seconds_bucket[5m])) by (le))"
          }
        ]
      }
    ]
  }
}
```

## 成本优化

### 1. Spot实例最佳实践

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spot-tolerant-app
spec:
  replicas: 10
  selector:
    matchLabels:
      app: spot-app
  template:
    metadata:
      labels:
        app: spot-app
    spec:
      # Spot容忍
      tolerations:
      - key: spot
        operator: Equal
        value: "true"
        effect: NoSchedule

      # 节点亲和性
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: karpenter.sh/capacity-type
                operator: In
                values: ["spot"]

      # 中断处理
      terminationGracePeriodSeconds: 90

      containers:
      - name: app
        image: myapp:latest

        # 优雅关闭
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15 && /app/graceful-shutdown.sh"]

        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "1000m"
            memory: "2Gi"
```

### 2. 资源标签和成本分配

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    team: platform
    cost-center: engineering
    project: main-app
  annotations:
    "iam.amazonaws.com/permitted": "arn:aws:iam::123456789012:role/production-*"
```

## 性能调优

### 1. 集群级别调优

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-tuning
data:
  kubelet-config.yaml: |
    apiVersion: kubelet.config.k8s.io/v1beta1
    kind: KubeletConfiguration
    # 提高Pod密度
    maxPods: 110
    podsPerCore: 10

    # 资源预留
    kubeReserved:
      cpu: "500m"
      memory: "1Gi"
    systemReserved:
      cpu: "500m"
      memory: "1Gi"

    # 垃圾回收
    imageGCHighThresholdPercent: 85
    imageGCLowThresholdPercent: 80
    evictionHard:
      memory.available: "100Mi"
      nodefs.available: "10%"
      nodefs.inodesFree: "5%"
      imagefs.available: "15%"

    # 性能优化
    cpuManagerPolicy: "static"
    topologyManagerPolicy: "best-effort"

    # 健康检查
    nodeStatusUpdateFrequency: "10s"
    nodeStatusReportFrequency: "5m"
```

### 2. 应用级别调优

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: optimized-pod
spec:
  # 使用Init容器预热
  initContainers:
  - name: cache-warmer
    image: busybox
    command: ['sh', '-c', 'echo "Warming up cache..."']

  containers:
  - name: app
    image: myapp:latest

    # JVM优化示例
    env:
    - name: JAVA_OPTS
      value: "-XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseG1GC -XX:+ParallelRefProcEnabled"

    # 资源限制
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
        ephemeral-storage: "10Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
        ephemeral-storage: "20Gi"

    # 安全上下文
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
      capabilities:
        drop:
          - ALL
        add:
          - NET_BIND_SERVICE

    # 健康检查
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10

    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5

    startupProbe:
      httpGet:
        path: /startup
        port: 8080
      initialDelaySeconds: 0
      periodSeconds: 10
      failureThreshold: 30
```

## 故障排除和优化检查清单

### 诊断命令

```bash
# 集群资源使用情况
kubectl top nodes
kubectl top pods -A --sort-by=cpu
kubectl top pods -A --sort-by=memory

# 节点问题诊断
kubectl describe nodes | grep -A5 "Conditions:"
kubectl get events -A --sort-by='.lastTimestamp'

# Pod调度问题
kubectl get pods -A -o wide | grep -v Running
kubectl describe pod <pod-name> | grep -A10 Events

# 存储问题
kubectl get pv,pvc -A
kubectl describe pvc -A | grep -E "Events:|Status:"

# 网络诊断
kubectl get svc,ep,ing -A
kubectl run tmp-shell --rm -i --tty --image nicolaka/netshoot -- /bin/bash

# 资源配额检查
kubectl describe resourcequota -A
kubectl describe limitrange -A
```

### 优化检查清单

- [ ] **计算资源**
  - [ ] 启用Karpenter自动扩缩容
  - [ ] 配置混合实例类型
  - [ ] 使用Spot实例
  - [ ] 配置VPA/HPA
  - [ ] 设置资源请求和限制

- [ ] **存储优化**
  - [ ] 迁移到GP3卷
  - [ ] 配置卷快照策略
  - [ ] 清理未使用的PV/PVC
  - [ ] 使用合适的存储类

- [ ] **网络优化**
  - [ ] 优化CNI配置
  - [ ] 配置服务网格
  - [ ] 优化负载均衡器
  - [ ] 减少跨区流量

- [ ] **监控和可观测性**
  - [ ] 部署Prometheus/Grafana
  - [ ] 配置日志聚合
  - [ ] 设置告警规则
  - [ ] 实施分布式追踪

- [ ] **成本管理**
  - [ ] 实施标签策略
  - [ ] 配置成本告警
  - [ ] 定期审查资源使用
  - [ ] 优化预留实例

## 总结

通过实施这些EKS资源优化策略，您可以实现：

- **性能提升**: 响应时间降低50-70%
- **成本降低**: 基础设施成本降低40-60%
- **可靠性提高**: 故障恢复时间减少80%
- **运维效率**: 自动化程度提高90%

定期审查和调整这些配置，确保您的EKS集群始终保持最佳性能和成本效益。