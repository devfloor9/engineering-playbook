---
title: "网络与性能优化"
sidebar_label: "网络与性能"
description: "EKS 环境中的 DNS 优化、East-West 流量、Gateway API 引入等网络及性能相关最佳实践"
tags: [eks, networking, performance, dns, gateway-api]
sidebar_position: 1
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 网络与性能优化

EKS 集群网络性能最大化的实战指南。涵盖 DNS 调优、服务间流量优化以及下一代流量路由 Gateway API 引入策略。

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/networking-performance/gateway-api-adoption-guide"
    icon="🌐"
    title="Gateway API 引入指南"
    description="NGINX Ingress Controller EOL 应对、Gateway API 架构及 GAMMA Initiative、Cilium ENI + Gateway API 深入、迁移策略"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/coredns-monitoring-optimization"
    icon="🔍"
    title="CoreDNS 监控与性能优化"
    description="DNS 查询性能分析、CoreDNS 缓存策略、NodeLocal DNSCache 使用、监控体系构建"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-best-practices/networking-performance/east-west-traffic-best-practice"
    icon="↔️"
    title="East-West 流量优化"
    description="服务间通信优化、Topology Aware Routing、多集群流量管理"
    color="#34a853"
  />
</DocCardGrid>
