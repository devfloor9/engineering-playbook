---
title: "Security & Authentication"
sidebar_label: "Security & AuthN"
description: "Best practices for EKS API Server authentication/authorization, IAM integration, and Pod Identity"
tags: [eks, security, authentication, authorization, iam]
sidebar_position: 3
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Security & Authentication

Covers EKS cluster authentication/authorization systems and security best practices.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/security-authn/eks-api-server-authn-authz"
    icon="🔐"
    title="EKS API Server AuthN/AuthZ"
    description="Authentication/authorization guide for Non-Standard Callers (CI/CD, monitoring, automation) accessing EKS API Server. How to use Access Entry, Pod Identity, OIDC, and TokenRequest API."
    color="#e63946"
  />
</DocCardGrid>
