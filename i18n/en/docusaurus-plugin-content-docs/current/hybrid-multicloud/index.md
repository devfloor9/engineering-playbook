---
title: "Hybrid Infrastructure"
sidebar_label: "Hybrid Infrastructure"
description: "Advanced technical documentation for building hybrid and multi-cloud environments using Amazon EKS"
sidebar_position: 4
---

# Hybrid Infrastructure

Modern enterprise infrastructure environments are transcending the boundaries between cloud and on-premises. Through Amazon EKS Hybrid Nodes, enterprises can now extend the power of cloud-native platforms into their own data centers. This approach goes beyond simply connecting two environments, enabling organizations to operate on-premises and cloud resources as a single Kubernetes cluster under a unified management plane.

The core value of hybrid infrastructure lies in flexibility and choice. Even when data sovereignty or regulatory requirements mandate keeping certain data on-premises, the rest of the application can leverage cloud elasticity and scalability. Organizations can also continue utilizing their existing on-premises hardware investments, particularly expensive GPU servers or special-purpose hardware, while simultaneously benefiting from cloud-based modern management tools and automation capabilities.

EKS Hybrid Nodes deploy lightweight agents on each on-premises server to communicate securely with the AWS EKS control plane. These agents receive management commands through encrypted channels via VPN or AWS Direct Connect, while actual workloads execute on-premises. This architecture proves especially valuable for applications where network latency is critical or when large volumes of data must be processed locally.

From a storage management perspective, hybrid environments offer new possibilities. Using Harbor registry allows managing container images on-premises while synchronizing with the cloud, and traditional storage protocols like NFS or iSCSI can be integrated with Kubernetes persistent volumes. Through Dynamic Resource Allocation (DRA) technology, Kubernetes can natively recognize and allocate specialized hardware such as GPUs or FPGAs, making high-performance computing workload placement more sophisticated.

Cloud bursting represents one of the most attractive usage patterns of hybrid infrastructure. Organizations can utilize on-premises resources during normal operations, then automatically expand workloads to the cloud when traffic surges or special events occur. When combined with auto-scaling tools like Karpenter, this approach maintains cost efficiency while securing nearly unlimited computing power when needed.

## Document List

**Hybrid Workload Management**

[EKS Hybrid Nodes Adoption Guide](./hybrid-nodes-adoption-guide.md) - Basic methods for connecting on-premises nodes to EKS clusters, hybrid networking configuration and security setup, migration strategies to hybrid environments, workload selection and placement criteria, phase-by-phase adoption planning and best practices, managing complex resource requirements through DRA technology, GPU and specialized hardware utilization

**Advanced Hybrid Features**

[SR-IOV and DGX H200 Integration](./sriov-dgx-h200-hybrid.md) - High-performance networking through SR-IOV, NVIDIA DGX H200 system integration and optimization

**Hybrid Storage**

[Harbor Registry and Hybrid Storage Integration](./harbor-hybrid-integration.md) - Operating container image registries through Harbor, image synchronization between on-premises and cloud

[File Storage for Hybrid Nodes](./hybrid-nodes-file-storage.md) - File storage configuration for on-premises nodes, NFS/iSCSI utilization and data synchronization
