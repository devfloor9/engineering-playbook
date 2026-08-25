---
title: Storage & Registry
description: Covers shared file storage (EFS, FSx, NFS) solutions for EKS Hybrid Nodes environments and Harbor private container registry integration.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - storage
  - scope:nav
sidebar_label: Storage & Registry
sidebar_position: 4
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

This section covers the data layer of hybrid clusters. It guides the selection of shared file storage solutions for on-premises nodes, and Harbor private registry integration that internalizes the image supply path in air-gapped and FQDN-restricted environments.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/storage-registry/file-storage"
    icon="💾"
    title="Shared File Storage"
    description="AWS managed (EFS, FSx) vs enterprise storage CSI integration vs traditional NFS clusters — AL2023 constraints and solution selection"
    color="#34a853"
  />
  <DocCard
    to="/docs/eks-hybrid-nodes/storage-registry/harbor-registry"
    icon="📦"
    title="Harbor Registry Integration"
    description="Step-by-step integration guide, from Harbor 2.15 installation, SSL/TLS, and Robot Accounts to containerd authentication, CoreDNS, and imagePullSecret"
    color="#4a90d9"
  />
</DocCardGrid>
