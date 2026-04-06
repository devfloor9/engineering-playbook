---
title: "安全与认证"
sidebar_label: "安全与认证"
description: "EKS API Server 认证/授权、IAM 集成、Pod Identity 等安全相关最佳实践"
tags: [eks, security, authentication, authorization, iam]
sidebar_position: 3
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 安全与认证

涵盖 EKS 集群的认证/授权体系与安全最佳实践。

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/security-authn/eks-api-server-authn-authz"
    icon="🔐"
    title="EKS API Server AuthN/AuthZ"
    description="Non-Standard Caller（CI/CD、监控、自动化）访问 EKS API Server 的认证/授权指南。涵盖 Access Entry、Pod Identity、OIDC、TokenRequest API 的使用方法。"
    color="#e63946"
  />
</DocCardGrid>
