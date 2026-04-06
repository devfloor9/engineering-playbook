---
title: "EKS 性能基准测试报告"
sidebar_position: 7
description: "EKS 环境下的性能基准测试报告集合 — 网络、AI/ML 推理、基础设施与运维"
category: "benchmarks"
tags: [benchmark, performance, testing, report, eks]
last_update:
  date: 2026-03-20
  author: devfloor9
---

# EKS 性能基准测试报告

基于 EKS 环境中实际工作负载的性能基准测试报告。通过数据验证架构决策和优化方向。

## 网络

| # | 报告 | 状态 |
|---|--------|--------|
| 1 | [VPC CNI 与 Cilium 网络性能对比](./cni-performance-comparison.md) | ✅ 已完成 |
| 2 | [Gateway API 实现性能对比](./gateway-api-benchmark.md) | 📋 计划中 |

## AI/ML 推理

| # | 报告 | 状态 |
|---|--------|--------|
| 3 | [Llama 4 FM 推理服务：GPU vs 自研芯片](./ai-ml-workload.md) | ✅ 已完成 |
| 4 | [推理平台：AgentCore vs EKS 自建](./agentcore-vs-eks-inference.md) | 📋 计划中 |
| 5 | [NVIDIA Dynamo 推理基准测试](./dynamo-inference-benchmark.md) | 🆕 新增 |

## 基础设施与运维

| # | 报告 | 状态 |
|---|--------|--------|
| 6 | [基础设施性能](./infrastructure-performance.md) | 🔜 即将推出 |
| 7 | [混合基础设施](./hybrid-infrastructure.md) | 🔜 即将推出 |
| 8 | [安全与运维](./security-operations.md) | 🔜 即将推出 |

## 基准测试方法论

所有基准测试遵循以下原则：

1. **可复现性**：明确指定测试环境、工具和配置
2. **统计显著性**：通过充足的重复运行确保结果可靠
3. **公平对比**：在相同条件下对比各测试对象
4. **真实工作负载**：优先使用接近实际模式的测试，而非合成基准

## 报告结构

每份基准测试报告遵循统一结构：

- **测试环境**：集群规格、节点类型、网络配置
- **测试工具**：使用的基准测试工具及版本
- **测试场景**：具体测试用例描述
- **结果**：数据、图表、分析
- **建议**：基于结果的优化建议
