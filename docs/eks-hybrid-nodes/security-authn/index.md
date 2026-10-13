---
title: Security & Authentication
description: Covers EKS Hybrid Nodes node authentication methods (SSM hybrid activation vs IAM Roles Anywhere) and credential lifecycle management.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - security
  - scope:nav
sidebar_label: Security & Authentication
sidebar_position: 3
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

Hybrid nodes have no EC2 instance profile, so a separate IAM credential provider must be selected for on-premises use. This section covers authentication method selection and credential lifecycle management.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/security-authn/node-authentication"
    icon="🔐"
    title="Node Authentication Methods"
    description="SSM hybrid activation vs IAM Roles Anywhere — comparison of how they work, selection criteria, credential lifecycle management"
    color="#e63946"
  />
</DocCardGrid>
