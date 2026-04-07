---
title: "推理网关配置指南"
sidebar_label: "网关配置"
description: "kgateway + Bifrost 安装、HTTPRoute 设置、OTel 联动实战指南"
tags: [kgateway, bifrost, gateway-api, httproute, otel, deployment]
last_update:
  date: 2026-04-06
  author: YoungJoon Jeong
---

# 推理网关配置指南

本文档涵盖基于 kgateway + Bifrost 的推理网关**实战部署步骤**。架构概念和设计原则请参阅 [推理网关路由](../design-architecture/inference-gateway-routing.md)。

## 生产推理管道架构

基于 EKS Auto Mode 的生产推理管道完整请求流程。kgateway ExtProc 分析提示词确定 LLM 路由，经过 Bifrost 治理层和 llm-d KV Cache 感知路由，将请求发送到最优模型。

<iframe
  src="/engineering-playbook/agentic-platform-architecture-zh.html"
  style={{width: '100%', height: '1600px', border: 'none', borderRadius: '12px'}}
  title="Agentic AI Platform 推理管道架构"
  loading="lazy"
/>

---

## 1. kgateway 安装和基本资源配置

### 1.1 Gateway API CRD 安装

```bash
# 安装 Gateway API 标准 CRD（v1.2.0+）
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# 含实验性功能安装（HTTPRoute 过滤器等）
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/experimental-install.yaml
```

### 1.2 kgateway v2.2.2 Helm 安装

```bash
# 添加 Helm 仓库
helm repo add kgateway oci://ghcr.io/kgateway-dev/charts
helm repo update

# 创建命名空间
kubectl create namespace kgateway-system

# 安装 kgateway v2.2.2
helm install kgateway kgateway/kgateway \
  --namespace kgateway-system \
  --version v2.2.2 \
  --set controller.replicaCount=2 \
  --set controller.resources.requests.cpu=500m \
  --set controller.resources.requests.memory=512Mi \
  --set controller.resources.limits.cpu=1000m \
  --set controller.resources.limits.memory=1Gi \
  --set metrics.enabled=true \
  --set metrics.port=9091
```

### 1.3 GatewayClass 定义

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: kgateway
spec:
  controllerName: kgateway.dev/kgateway-controller
  description: "Kgateway for AI inference routing"
  parametersRef:
    group: kgateway.dev
    kind: GatewayClassConfig
    name: kgateway-config
---
apiVersion: kgateway.dev/v1alpha1
kind: GatewayClassConfig
metadata:
  name: kgateway-config
spec:
  proxy:
    replicas: 3
    resources:
      requests:
        cpu: "1"
        memory: "2Gi"
      limits:
        cpu: "2"
        memory: "4Gi"
  connectionSettings:
    maxConnections: 10000
    connectTimeout: 10s
    idleTimeout: 60s
```

### 1.4 Gateway 资源（单一 NLB 集成）

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: unified-gateway
  namespace: ai-gateway
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  gatewayClassName: kgateway
```

本文档的详细内容（Bifrost 安装、LLM Classifier 部署、HTTPRoute 配置、OTel 联动等）由于篇幅原因请参阅[韩文原文](/docs/agentic-ai-platform/reference-architecture/inference-gateway-setup)。

---

## 参考资料

- [kgateway 官方文档](https://kgateway.dev/docs/)
- [Gateway API 标准](https://gateway-api.sigs.k8s.io/)
- [Bifrost 官方文档](https://www.getmaxim.ai/bifrost/docs)
