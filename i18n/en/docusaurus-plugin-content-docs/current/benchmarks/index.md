---
title: EKS Performance Benchmark Reports
description: Collection of EKS environment performance benchmark reports — Networking, AI/ML Inference, Infrastructure & Operations
created: "2026-02-11"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 4
tags:
  - benchmark
  - performance
  - testing
  - report
  - eks
  - scope:nav
sidebar_position: 7
category: benchmarks
---

# EKS Performance Benchmark Reports

Performance reports and measurement plans for EKS. Check each report's evidence boundary and distinguish live measurements, published-source analysis, and local tool validation before using its conclusions.

## Networking

| # | Report | Status |
|---|--------|--------|
| 1 | [VPC CNI vs Cilium Network Performance Comparison](./cni-performance-comparison.md) | ✅ Complete |
| 2 | [Gateway API Architecture, Feature Comparison, and Test Report](./gateway-api-benchmark.md) | Source/kit validation complete; EKS measurements pending |

## AI/ML Inference

| # | Report | Status |
|---|--------|--------|
| 3 | [Llama 4 FM Serving: GPU vs Custom Silicon](./ai-ml-workload.md) | ✅ Complete |
| 4 | [Inference Platform: AgentCore vs EKS Self-Built](./agentcore-vs-eks-inference.md) | 📋 Planned |
| 5 | [NVIDIA Dynamo Inference Benchmark](./dynamo-inference-benchmark.md) | 🆕 New |

## Infrastructure & Operations

| # | Report | Status |
|---|--------|--------|
| 6 | [Infrastructure Performance](./infrastructure-performance.md) | 🔜 Upcoming |
| 7 | [Hybrid Infrastructure](./hybrid-infrastructure.md) | 🔜 Upcoming |
| 8 | [Security & Operations](./security-operations.md) | 🔜 Upcoming |

## Benchmark Methodology

All benchmarks follow these principles:

1. **Reproducibility**: Test environment, tools, and configuration are specified
2. **Statistical Significance**: Reliable results through sufficient repeated runs
3. **Fair Comparison**: Measurements taken under identical conditions across comparison targets
4. **Real Workloads**: Tests that closely resemble actual patterns are prioritized over synthetic benchmarks

## Report Structure

Each benchmark report follows a consistent structure:

- **Test Environment**: Cluster specs, node types, network configuration
- **Test Tools**: Benchmark tools and versions used
- **Test Scenarios**: Specific test case descriptions
- **Results**: Data, charts, analysis
- **Recommendations**: Optimization suggestions based on results
