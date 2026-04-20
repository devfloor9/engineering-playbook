---
title: "Inference Gateway 部署指南"
sidebar_label: "Inference Gateway 部署"
description: "基于 kgateway 的 Inference Gateway 分步部署指南（基础/高级/故障排除）"
tags: [inference-gateway, kgateway, deployment, 'scope:impl']
sidebar_position: 4
last_update:
  date: 2026-04-18
  author: devfloor9
---

import { useColorMode } from '@docusaurus/theme-common';
import { useEffect, useRef } from 'react';

export const InferencePipelineDiagram = () => {
  const { colorMode } = useColorMode();
  const iframeRef = useRef(null);
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'theme-change', theme: colorMode },
        '*'
      );
    }
  }, [colorMode]);
  return (
    <iframe
      ref={iframeRef}
      src={`/engineering-playbook/agentic-platform-architecture.html?theme=${colorMode}`}
      style={{width: '100%', height: '1600px', border: 'none', borderRadius: '12px'}}
      title="生产推理管道架构"
      loading="lazy"
    />
  );
};

# Inference Gateway 部署指南

本文档涵盖基于 kgateway + Bifrost 的推理网关**实战部署流程**。架构概念和路由策略（Cascade、Semantic Router、2-Tier 结构）请参阅 [推理网关路由](../inference-gateway-routing.md)。

:::info 指南组成
本指南由 3 个文档组成。您可以按顺序学习，也可以选择需要的部分参考。
:::

## 生产推理管道参考架构

基于 EKS Auto Mode 的生产推理管道完整请求流程。CloudFront（WAF/Shield）→ NLB → kgateway ExtProc 分析提示词决定 LLM 路由，经过 Bifrost 治理层和 llm-d KV Cache-aware 路由，将请求传递到最优模型。

<InferencePipelineDiagram />

---

## 部署步骤概览

### 1. [基础部署](./basic-deployment.md)（必需）

在单个 NLB 端点后配置 kgateway + HTTPRoute + Bifrost，完成基础推理管道。

**包含内容：**
- kgateway 安装及 Gateway API CRD 配置
- GatewayClass、Gateway、HTTPRoute 资源定义
- 通过 ReferenceGrant 实现跨命名空间访问
- Bifrost Gateway Mode 配置（config.json + PVC）
- provider/model 格式及 IDE 兼容性（Aider、Cline、Continue.dev）
- SQLite 初始化流程（config.json 变更时）

**学习时间：** 30分钟 | **部署时间：** 45分钟

---

### 2. [高级功能](./advanced-features.md)（可选）

添加基于提示词的自动路由、生产安全层、Semantic Caching，强化成本优化和安全性。

**包含内容：**
- LLM Classifier 部署（基于提示词的 SLM/LLM 自动分支）
- CloudFront + WAF/Shield 安全层
- Semantic Caching 实现选项（GPTCache、RedisVL、Portkey、Helicone）

**学习时间：** 45分钟 | **部署时间：** 60-90分钟

---

### 3. [故障排除](./troubleshooting-guide.md)（参考）

涵盖部署和运营中发生的常见问题及解决方法。

**包含内容：**
- 404 Not Found（HTTPRoute/Gateway 配置错误）
- Bifrost provider/model 错误
- Bifrost 模型名标准化问题
- Langfuse Sub-path 404
- OTel Trace 未送达

**参考频率：** 部署时或问题发生时

---

## 学习路径

### 快速启动（开发/测试环境）

```mermaid
graph LR
    A[基础部署] --> B[故障排除]
    style A fill:#326ce5,stroke:#333,color:#fff
    style B fill:#ffd93d,stroke:#333,color:#000
```

1. 通过 [基础部署](./basic-deployment.md) 配置 kgateway + Bifrost
2. 问题发生时参考 [故障排除](./troubleshooting-guide.md)

**所需时间：** 1-2小时

---

### 生产配置（完整管道）

```mermaid
graph LR
    A[基础部署] --> B[高级功能]
    B --> C[故障排除]
    style A fill:#326ce5,stroke:#333,color:#fff
    style B fill:#76b900,stroke:#333,color:#000
    style C fill:#ffd93d,stroke:#333,color:#000
```

1. 通过 [基础部署](./basic-deployment.md) 配置基础架构
2. 在 [高级功能](./advanced-features.md) 中添加 LLM Classifier + CloudFront/WAF + Semantic Caching
3. 运营中参考 [故障排除](./troubleshooting-guide.md)

**所需时间：** 3-4小时

---

## 前提条件

在进行所有部署步骤之前，请确认以下内容。

### 必需要求

- [x] EKS 集群（K8s 1.32+、DRA 1.35 GA）
- [x] kubectl 安装及集群访问权限
- [x] Helm 3.x 安装
- [x] vLLM 或 llm-d 基础模型服务 Pod 部署完成

### 建议事项

- AWS Load Balancer Controller 安装（NLB 自动创建）
- Langfuse 部署完成（参考 [Langfuse 部署指南](../monitoring-observability-setup.md)）
- 生产环境：ACM 证书颁发（用于 CloudFront + TLS）

---

## 下一步

- **开始：** 前往 [基础部署](./basic-deployment.md) 开始 kgateway 安装。
- **理解架构：** 部署前阅读 [推理网关路由](../inference-gateway-routing.md) 了解整体结构。
- **准备监控：** 参考 [Langfuse 部署指南](../monitoring-observability-setup.md) 配置可观测性栈。

---

## 参考资料

- [推理网关路由](../inference-gateway-routing.md) - kgateway 架构及路由策略详解
- [Langfuse 部署指南](../monitoring-observability-setup.md) - Helm 安装、OTel 集成、Redis/ClickHouse 配置
- [Agent 监控](../../operations-mlops/observability/agent-monitoring.md) - Langfuse 架构及组件
- [Kubernetes Gateway API 官方文档](https://gateway-api.sigs.k8s.io/)
- [kgateway 官方文档](https://kgateway.dev/docs/)
- [Bifrost 官方文档](https://bifrost.dev/docs)
