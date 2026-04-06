---
title: "Hybrid Infrastructure"
sidebar_label: "Hybrid Infrastructure"
description: "In-depth technical documentation on building hybrid cloud and multi-cloud environments with Amazon EKS"
category: "hybrid"
sidebar_position: 4
last_update:
  date: 2026-02-13
  author: devfloor9
---

# Hybrid Infrastructure

> 📅 **Created**: 2025-02-05 | **Updated**: 2026-02-13 | ⏱️ **Reading time**: ~3 min

Modern enterprise infrastructure extends beyond the boundaries of cloud and on-premises. With Amazon EKS Hybrid Nodes, organizations can extend the power of cloud-native platforms to their own data centers. This approach goes beyond simply connecting two environments — it enables operating on-premises and cloud resources as a single Kubernetes cluster under a unified management plane.

The core value of hybrid infrastructure lies in flexibility and choice. Even when data sovereignty or regulatory requirements mandate keeping certain data on-premises, the rest of the application can leverage the elasticity and scalability of the cloud. Additionally, existing on-premises hardware investments — especially expensive GPU servers and special-purpose hardware — can continue to be utilized alongside cloud-based management tools and automation capabilities.

EKS Hybrid Nodes deploy a lightweight agent on each on-premises server to securely communicate with the AWS EKS control plane. The agent receives management commands through encrypted channels via VPN or AWS Direct Connect, while actual workloads run on-premises. This architecture is particularly useful for applications where network latency matters or when large volumes of data need to be processed locally.

From a storage management perspective, hybrid environments offer new possibilities. Harbor registry enables managing container images on-premises while synchronizing with the cloud, and traditional storage protocols like NFS and iSCSI can be integrated with Kubernetes persistent volumes. Dynamic Resource Allocation (DRA) technology allows Kubernetes to natively recognize and allocate specialized hardware such as GPUs and FPGAs, enabling more sophisticated placement of high-performance computing workloads.

Cloud bursting is one of the most compelling use patterns for hybrid infrastructure. Resources run on-premises under normal conditions, and when traffic spikes or special events occur, workloads automatically scale to the cloud. Combined with autoscaling tools like Karpenter, you can maintain cost efficiency while securing nearly unlimited computing power when needed.

## Documentation (Implementation Order)

### Step 1: Hybrid Node Basics

**[1. Hybrid Nodes Complete Guide](./hybrid-nodes-adoption-guide.md)**
Connecting on-premises nodes to EKS clusters, hybrid networking configuration and security setup, migration strategies, workload selection and placement criteria

### Step 2: High-Performance Networking (SR-IOV)

**[2. SR-IOV Networking](./sriov-dgx-h200-hybrid.md)**
High-performance networking via SR-IOV, NVIDIA DGX H200 system integration and optimization

### Step 3: Shared Storage Configuration

**[3. File Storage](./hybrid-nodes-file-storage.md)**
File storage configuration for on-premises nodes, NFS/iSCSI usage and data synchronization

### Step 4: Container Registry Integration

**[4. Harbor Registry](./harbor-hybrid-integration.md)**
Container image registry management with Harbor, image synchronization between on-premises and cloud
