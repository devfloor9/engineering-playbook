---
title: "NVIDIA Dynamo 推理基准测试"
sidebar_label: "报告 5. Dynamo 推理 [新增]"
sidebar_position: 5
description: "使用 NVIDIA Dynamo 对比聚合式与分离式 LLM 推理性能的基准测试 — 在 EKS 环境中运行 AIPerf 4 种模式"
tags: [benchmark, nvidia, dynamo, vllm, inference, gpu, disaggregated-serving, eks, kv-cache, nixl]
category: "benchmark"
last_update:
  date: 2026-03-20
  author: devfloor9
---

# 报告 5. NVIDIA Dynamo 推理基准测试

> 📅 **创建日期**：2026-03-20 | **状态**：新增

## 概述

对比 NVIDIA Dynamo 基础 LLM 推理中**聚合式**和**分离式**模式性能的基准测试。通过在 EKS 环境中运行 AIPerf 基准测试工具的 4 种测量模式，量化验证分离式推理的 KV Router + NIXL Transfer 在实际工作负载中带来的性能差异。

:::info 部署指南
本基准测试的 EKS 部署请参见 [NVIDIA GPU 栈指南](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)。
:::

## 测试环境

### EKS 集群规格

| 项目 | 配置 |
|------|------|
| **EKS 版本** | v1.32（Auto Mode） |
| **GPU 节点（Prefill）** | p4d.24xlarge x 2（A100 80GB x 8/节点） |
| **GPU 节点（Decode）** | g6e.12xlarge x 4（L40S 48GB x 4/节点） |
| **存储** | EFS（模型存储）、gp3（etcd/Prometheus） |
| **网络** | VPC CNI、EFA 已启用（p4d 节点） |

### 软件栈

| 组件 | 版本 |
|----------|------|
| **NVIDIA Dynamo** | v0.9.1 |
| **vLLM Runtime** | v0.7.x |
| **GPU Operator** | v24.9.0 |
| **AIPerf** | v0.9.1 |
| **Prometheus + Grafana** | kube-prometheus-stack 65.x |

### 测试模型

| 模型 | 参数量 | 活跃参数量 | 精度 | 架构 |
|------|---------|-------------|--------|---------|
| **Qwen3-30B-A3B-FP8** | 30B | 3B | FP8 | MoE |

选择 MoE（Mixture-of-Experts）模型的原因：
- 可以清晰对比分离式推理中专家路由和 KV 缓存策略的效果
- FP8 量化最大化 GPU 显存效率
- 较小的活跃参数量（3B）使得 Decode Worker 可以使用 L40S 级别的 GPU

---

## 架构对比

### 聚合式推理

```
Client → Router → [Worker (Prefill + Decode)]
                   └── GPU: A100 × 4 (TP=4)
```

单个 Worker 同时处理 Prefill 和 Decode。实现简单但 GPU 利用率不均衡。

### 分离式推理

```
Client → KV Router → Prefill Worker (A100 × 4, TP=4)
                  ↓ NIXL Transfer
              → Decode Worker (L40S × 2, TP=2)
                  └── KV Cache Offload: GPU → CPU → SSD
```

将 Prefill 和 Decode 分离，为每个阶段分配优化的 GPU：

- **KV Router**：缓存感知路由，最大化 KV 命中率
- **NIXL Transfer**：GPU 到 GPU 直接传输，最小化 KV 缓存迁移延迟
- **KV Cache Offloading**：3 层缓存（GPU → CPU → SSD）突破内存限制

---

## 基准测试模式

AIPerf 基准测试工具提供 4 种测量模式：

### 1. 并发扫描

逐步增加并发请求，测量 TTFT、TPS 和吞吐量。

| 参数 | 值 |
|---------|---|
| 并发数 | 1、2、4、8、16、32、64 |
| ISL（输入序列长度） | 1024 |
| OSL（输出序列长度） | 512 |
| 持续时间 | 120s/步 |

**测量指标**：TTFT p50/p99、ITL p50/p99、吞吐量（tokens/s）、请求延迟

### 2. 多轮对话

测量多轮对话场景中的 KV 缓存复用效果。

| 参数 | 值 |
|---------|---|
| 对话轮数 | 5 |
| 并发对话数 | 8 |
| ISL/OSL | 512/256 |
| 持续时间 | 300s |

**测量指标**：每轮 TTFT 变化、缓存命中率、总对话响应时间

### 3. 序列分布

测量不同序列长度分布下的性能稳定性。

| 参数 | 值 |
|---------|---|
| 分布类型 | 均匀分布、Zipf 分布、对数正态分布 |
| ISL 范围 | 128-4096 |
| OSL 范围 | 64-2048 |
| 并发数 | 16 |

**测量指标**：按分布的 TTFT/TPS 方差、长序列处理稳定性

### 4. Prefix 缓存

测量相同 Prefix 命中率变化时的 TTFT 改善效果。

| 参数 | 值 |
|---------|---|
| Prefix 命中率 | 0%、25%、50%、75%、100% |
| ISL/OSL | 2048/512 |
| 并发数 | 16 |

**测量指标**：按命中率的 TTFT 降低、缓存内存使用、驱逐率

---

## 基准测试结果

:::note 数据采集待完成
结果数据将在基准测试执行后更新。
:::

### 预期结果结构

#### 并发扫描结果

| 并发数 | 聚合式 TTFT p50 | 分离式 TTFT p50 | 聚合式 TPS | 分离式 TPS |
|--------|--------------------:|----------------:|---------------:|-----------:|
| 1 | - | - | - | - |
| 4 | - | - | - | - |
| 16 | - | - | - | - |
| 32 | - | - | - | - |
| 64 | - | - | - | - |

#### Prefix 缓存效果

| 命中率 | 聚合式 TTFT | 分离式 TTFT | 改善幅度 |
|-----------|----------------:|------------:|-------:|
| 0% | - | - | - |
| 50% | - | - | - |
| 100% | - | - | - |

#### 成本效率

| 配置 | GPU 成本（$/hr） | 吞吐量（tok/s） | $/1M tokens |
|------|---------------:|------------------:|-----------:|
| 聚合式（p4d x 2） | - | - | - |
| 分离式（p4d x 2 + g6e x 4） | - | - | - |

### Grafana 仪表板

基准测试结果通过 Grafana 仪表板可视化：

- **Pareto 仪表板**：TTFT vs 吞吐量 Pareto 分析
- **DCGM 指标**：GPU 利用率、内存、温度、功耗
- **Dynamo 平台**：Worker 状态、请求速率、KV 缓存命中率
- **KV Block Manager**：Block 分配、驱逐、Offload 状态

仪表板配置请参见 [Agent 监控指南](/docs/agentic-ai-platform/operations-mlops/observability/agent-monitoring)。

---

## 部署指南

### 前置条件

- EKS v1.32+（推荐 Auto Mode）
- GPU 节点组：p4d.24xlarge（Prefill）、g6e.12xlarge（Decode）
- EFS CSI Driver、AWS Load Balancer Controller
- Helm v3.14+

### 安装顺序

1. 基础资源：Namespace、StorageClass、HF Token Secret
2. GPU Operator：NVIDIA 驱动和设备插件
3. 监控：Prometheus + Grafana + Pushgateway
4. Dynamo 平台：CRDs + Operator + etcd + NATS
5. 模型下载：将模型权重存储到 EFS
6. 推理部署：选择聚合式或分离式模式
7. 基准测试执行：按顺序运行 4 种模式

详细部署指南请参见 [NVIDIA GPU 栈指南](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)。

---

## 核心验证要点

本基准测试旨在验证的核心问题：

1. **分离式推理相比聚合式能改善多少 TTFT？**
   - 尤其是高并发（32+）时的差异

2. **KV Cache Offloading（GPU→CPU→SSD）是否带来实际的成本节省？**
   - 使用 L40S（48GB）运行 Decode Worker 的性价比

3. **Prefix 缓存命中率与 TTFT 改善是否呈线性关系？**
   - 多轮对话中缓存复用的实际效果

4. **NIXL Transfer 的开销是否会抵消分离式架构的优势？**
   - 短序列场景下分离式是否仍然有益

---

## 建议

:::note 基准测试完成后更新
建议将基于实际测量结果撰写。
:::

### 预期建议场景

| 场景 | 推荐模式 | 原因 |
|---------|----------|------|
| 单模型、低并发（少于 8） | 聚合式 | 实现简单，开销最小 |
| 多轮对话、高缓存命中率 | 分离式 | 最大化 KV Router + Prefix 缓存效果 |
| 高并发（32+）、严格 SLA | 分离式 | 通过 Prefill/Decode 分离稳定 TTFT |
| 成本优化优先 | 分离式 | 利用低成本 GPU（L40S）处理 Decode |

## 参考资料

- [NVIDIA Dynamo 文档](https://docs.nvidia.com/dynamo/)
- [vLLM 项目](https://docs.vllm.ai/)
- [AIPerf 基准测试工具](https://github.com/NVIDIA/dynamo)
- [NVIDIA GPU 栈指南](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)
