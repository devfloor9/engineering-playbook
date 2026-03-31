---
title: "보안 & 인증"
sidebar_label: "Security & AuthN"
description: "EKS API Server 인증/인가, IAM 통합, Pod Identity 등 보안 관련 베스트 프랙티스"
tags: [eks, security, authentication, authorization, iam]
sidebar_position: 3
last_update:
  date: 2026-03-24
  author: devfloor9
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

# 보안 & 인증

EKS 클러스터의 인증/인가 체계와 보안 베스트 프랙티스를 다룹니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-best-practices/security-authn/eks-api-server-authn-authz"
    icon="🔐"
    title="EKS API Server AuthN/AuthZ"
    description="Non-Standard Caller(CI/CD, 모니터링, 자동화)의 EKS API Server 접근을 위한 인증/인가 가이드. Access Entry, Pod Identity, OIDC, TokenRequest API 활용법."
    color="#e63946"
  />
</DocCardGrid>
