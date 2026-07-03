---
title: Security & Authentication
description: Best practices for EKS cluster authentication/authorization and security
created: "2026-03-24"
last_update:
  date: "2026-06-26"
  author: devfloor9
reading_time: 2
tags:
  - eks
  - security
  - authentication
  - authorization
  - iam
  - scope:nav
sidebar_label: Security & Authentication
sidebar_position: 3
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# Security & Authentication

Best practices for EKS cluster authentication/authorization and security.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/security-authn/eks-api-server-authn-authz"
    icon="🔐"
    title="EKS API Server AuthN/AuthZ"
    description="Authentication/authorization guide for Non-Standard Callers (CI/CD, monitoring, automation) accessing the EKS API Server. Covers Access Entry, Pod Identity, OIDC, and TokenRequest API."
    color="#e63946"
  />
</DocCardGrid>
