---
title: EKS Hybrid Nodes Best Practices
description: Best practices reference guide for adopting and operating Amazon EKS Hybrid Nodes. Covers six areas, from concepts and architecture to networking, security and authentication, storage and registry, GPU, and operations and cost.
created: "2025-02-05"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - eks
  - hybrid-node
  - best-practices
  - scope:nav
sidebar_label: EKS Hybrid Nodes
sidebar_position: 4
category: hybrid
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

Amazon EKS Hybrid Nodes connects servers in on-premises and edge infrastructure as worker nodes of the AWS-managed EKS control plane. This guide is a reference that organizes, as per-area best practices, the technical issues that repeatedly arise when designing, building, and operating hybrid clusters — CIDR design, architecture decisions, Hybrid Nodes Gateway, firewall pre-registration, node authentication, storage and registry, and GPU workloads. The intended audience is infrastructure architects, platform engineers, and security staff preparing firewall and network registration requests.

---

## Document Structure

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/overview-architecture"
    icon="🧭"
    title="Overview & Architecture"
    description="Hybrid Nodes concepts, how it works, key technical characteristics, and a guide to the six design decisions — connectivity, topology, Pod CIDR exposure, and more"
    color="#667eea"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/networking"
    icon="🌐"
    title="Networking"
    description="CIDR design and address-range minimization, CNI configuration and Pod CIDR routing, Hybrid Nodes Gateway, load balancing, firewall pre-registration and TGW topology, air-gapped VPC endpoints"
    color="#4a90d9"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/security-authn"
    icon="🔐"
    title="Security & Authentication"
    description="Choosing a node authentication method — SSM hybrid activation vs IAM Roles Anywhere, credential lifecycle management"
    color="#e63946"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/storage-registry"
    icon="💾"
    title="Storage & Registry"
    description="Shared file storage (EFS, FSx, NFS) solutions and Harbor private container registry integration"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/compute-gpu"
    icon="⚡"
    title="Compute & GPU"
    description="3-tier architecture for hybrid GPU workloads, GPU taint isolation, Device Plugin, cloud fallback, DGX H200 SR-IOV and InfiniBand high-performance networking"
    color="#f4a261"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/operations-cost"
    icon="📊"
    title="Operations & Cost"
    description="Mixed Mode operational patterns, Cluster Insights configuration validation, observability integration (eBPF, Container Insights), upgrades and lifecycle, and cost optimization based on vCPU-hour billing"
    color="#9b59b6"
  />
</DocCardGrid>
