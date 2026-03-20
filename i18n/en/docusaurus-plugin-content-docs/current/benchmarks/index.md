---
title: "EKS Performance Benchmark Reports"
sidebar_position: 7
description: "Collection of EKS environment performance benchmark reports — Networking, AI/ML Inference, Infrastructure & Operations"
category: "benchmarks"
tags: [benchmark, performance, testing, report, eks]
last_update:
  date: 2026-03-20
  author: devfloor9
---

# EKS Performance Benchmark Reports

Performance benchmark reports measured with actual workloads in EKS environments. Validates architecture decisions and optimization directions with data.

## Networking

| # | Report | Status |
|---|--------|--------|
| 1 | [VPC CNI vs Cilium Network Performance Comparison](./cni-performance-comparison.md) | ✅ Complete |
| 2 | [Gateway API Implementation Performance Comparison](./gateway-api-benchmark.md) | 📋 Planned |

## AI/ML Inference

| # | Report | Status |
|---|--------|--------|
| 3 | [Llama 4 FM Serving: GPU vs Custom Silicon](./ai-ml-workload.md) | ✅ Complete |
| 4 | [Inference Platform: AgentCore vs EKS Self-Hosted](./agentcore-vs-eks-inference.md) | 📋 Planned |
| 5 | [NVIDIA Dynamo Inference Benchmark](./dynamo-inference-benchmark.md) | 🆕 New |

## Infrastructure & Operations

| # | Report | Status |
|---|--------|--------|
| 6 | [Infrastructure Performance](./infrastructure-performance.md) | 🔜 Upcoming |
| 7 | [Hybrid Infrastructure](./hybrid-infrastructure.md) | 🔜 Upcoming |
| 8 | [Security and Operations](./security-operations.md) | 🔜 Upcoming |

## Benchmark Methodology

All benchmarks follow these principles:

1. **Reproducibility**: Document test environment, tools, and configurations
2. **Statistical Significance**: Derive reliable results through sufficient repeated runs
3. **Fair Comparison**: Measure comparison targets under identical conditions
4. **Real Workloads**: Prioritize tests closer to actual patterns over synthetic benchmarks

## Report Structure

Each benchmark report follows a consistent structure:

- **Test Environment**: Cluster specs, node types, network configuration
- **Test Tools**: Benchmark tools and versions used
- **Test Scenarios**: Specific test case descriptions
- **Results**: Data, charts, analysis
- **Recommendations**: Optimization suggestions based on results
