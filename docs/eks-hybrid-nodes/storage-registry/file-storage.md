---
title: EKS Hybrid Nodes Shared File Storage Solutions
description: A comprehensive guide to implementing shared file storage in EKS Hybrid Nodes environments, covering AWS managed services, enterprise storage integration, and Amazon Linux 2023 alternative approaches.
created: "2025-09-15"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 35
tags:
  - eks
  - hybrid-node
  - storage
  - efs
  - fsx
  - nfs
  - amazon-linux-2023
  - scope:impl
sidebar_label: File Storage
category: hybrid-multicloud
---

## Overview

In hybrid environments, shared file storage is a core component for sharing data across multiple nodes, operating stateful applications, and maintaining data consistency between the cloud and on-premises. Early Amazon Linux 2023 releases did not ship the traditional high-availability clustering packages (pacemaker, corosync), which made it hard to carry over an Amazon Linux 2–based NFS cluster configuration unchanged.

This document summarizes the solutions and constraints to consider when choosing shared file storage for EKS Hybrid Nodes environments. The package availability stated below is tied to the specific Amazon Linux 2023 releases named, and you should re-verify it against the actual release of the AMI you use before relying on it.

## Technical Background and Current State Analysis

### Amazon Linux 2023 Clustering Package Availability {#amazon-linux-2023-package-policy-changes}

In early releases following the transition from Amazon Linux 2 to Amazon Linux 2023, the following clustering-related packages were not included in the default repository:

- `corosync` and related libraries (`corosynclib`, `corosync-qdevice`, `corosync-qnetd`)
- The `pacemaker` package set (`pacemaker-cli`, `pacemaker-cluster-libs`, `pacemaker-remote`, etc.)

This state varies by release, however. According to AWS's published release notes, AL2023.10 (version 2023.10.20260105) re-added the `corosync` 3.1.9 and `pacemaker` 3.0.1 packages to the repository. The statement "AL2023 has no pacemaker/corosync" therefore applies only to specific early releases, and you should confirm actual availability in the release of the AMI you use (for example with `dnf list corosync pacemaker`).

Whether a package can be installed is a separate question from whether a pacemaker/corosync-based HA topology on on-premises AL2023 falls within AWS's tested and supported scope. A package being present in the repository does not imply that a particular HA configuration is validated or supported on EKS Hybrid Nodes, so confirm support scope separately in the EKS Hybrid Nodes and Amazon Linux official documentation.

### Supported Operating Systems

EKS Hybrid Nodes officially supports Amazon Linux 2023, Ubuntu (20.04/22.04/24.04 LTS), and RHEL (8/9). Bottlerocket is supported in preview on VMware vSphere environments (v1.37+), and Rocky Linux is not included in the official support list, placing it outside the scope of AWS Support. For full system requirements, see [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md).

## Shared File Storage Solution Architecture

### 1. AWS Managed Service-Based Solutions

#### Amazon EFS (Elastic File System)

Amazon EFS is the most recommended shared file storage solution for EKS Hybrid Nodes environments.

**Key characteristics:**

- NFSv4.1 protocol support, compatible with existing NFS clients
- Automatic scaling up/down eliminates capacity management
- EFS Regional file systems store data redundantly across multiple Availability Zones and are designed to provide 99.999999999% (11 9's) durability over a given year. EFS One Zone file systems store data within a single AZ, so data can be lost during a disaster or fault in that AZ. The 11 9's figure is a design target, not a guarantee, so configure backup and recovery separately with AWS Backup or EFS Replication.
- Encryption in transit and at rest

**Hybrid connectivity methods:**

- Private connectivity via AWS Direct Connect or VPN (required to reach EFS from on-premises)
- Optimized mount performance and in-transit encryption via the EFS Mount Helper

**Kubernetes integration caveat:**

Reaching an EFS file system over NFSv4.1 from on-premises servers is a separate question from dynamic provisioning with the EFS CSI Driver on EKS Hybrid Nodes. The add-ons AWS has validated for compatibility with EKS Hybrid Nodes include the Amazon FSx CSI Driver but **do not include the Amazon EFS CSI Driver**. Recent EFS CSI Driver versions carry an anti-affinity rule for the `eks.amazonaws.com/compute-type: hybrid` label applied to hybrid nodes, so they are not scheduled onto hybrid nodes. To use EFS from hybrid nodes, follow one of these paths:

- Access the EFS file system from your application using an `nfs` volume or a direct NFSv4.1 mount (no CSI dynamic provisioning)
- Or choose a different path whose compatibility is validated on hybrid nodes, such as the Amazon FSx CSI Driver

The compatible add-on list can change, so confirm the current state in the [Configure add-ons for hybrid nodes documentation](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html) before relying on it.

**Implementation considerations:**

- Network latency must be considered when accessing EFS from on-premises
- Calculate network costs based on bandwidth usage
- Configure backup and lifecycle policies

#### Amazon FSx

For workloads requiring high performance, Amazon FSx can be considered.

**FSx for Lustre:**

- Optimized for high-performance computing (HPC) and AI/ML workloads
- Native integration with S3 supports data tiering
- Supports hundreds of GB/s throughput and millions of IOPS
- Increasing adoption in GenAI inference workloads as of 2025

**FSx for NetApp ONTAP:**

- Compatibility with existing NetApp environments
- Multi-protocol support (NFS, SMB, iSCSI)
- Advanced data management capabilities (snapshots, clones, replication)

**FSx for OpenZFS:**

- Supports high-performance NFS workloads
- Storage efficiency through compression and deduplication
- Built-in snapshot and backup capabilities

### 2. Enterprise Storage Integration Solutions

This approach leverages existing on-premises storage investments while integrating with the Kubernetes environment.

#### CSI Driver-Based Integration

**NetApp Trident:**

- Supports ONTAP, Cloud Volumes ONTAP, and Azure NetApp Files
- Dynamic volume provisioning and snapshot management
- Built-in data protection and disaster recovery capabilities

**Dell PowerScale CSI:**

- OneFS-based scale-out NAS integration
- Meets high-performance and large-capacity storage requirements
- Multi-tenancy and QoS support

**Pure Storage CSI:**

- FlashBlade and FlashArray integration
- All-flash performance with data compression/deduplication
- Cloud-native data services

#### Implementation Architecture

The following architecture is recommended for enterprise storage integration:

1. **Storage backend configuration**: Configure NFS exports or iSCSI targets on the on-premises storage system
2. **CSI Driver deployment**: Install the vendor's CSI Driver in the Kubernetes cluster
3. **StorageClass definition**: Configure storage classes for dynamic provisioning
4. **Network optimization**: Configure a dedicated network segment for storage traffic

### 3. Hybrid Operating System-Based Solutions

This is an alternative for cases with special requirements or where existing operational expertise must be leveraged.

#### Traditional NFS Clusters on Ubuntu/RHEL

**Using Ubuntu 22.04 LTS:**

- Supports the `pacemaker`, `corosync`, and `nfs-kernel-server` packages
- 5 years of long-term support provides a stable operating environment
- Broad community support and documentation

**Using RHEL 9:**

- Enterprise-grade support and security updates
- Availability of Red Hat's High Availability Add-On
- Leverages existing RHEL operational experience

**Implementation considerations:**

- Handling network partition scenarios between cluster nodes
- High-availability configuration of the storage backend
- Regular cluster health monitoring and maintenance

## Real-World Implementation Cases and References

### Dell PowerFlex + EKS Hybrid Nodes

An official reference implementation by Dell Technologies, operating a PostgreSQL database on EKS Hybrid Nodes integrated with PowerFlex storage.

**Performance results (as reported by Dell):**

Dell's published test uses pgbench's built-in `select-only` script (read-only transactions that issue only SELECTs). The run conditions published in Dell's white paper are initialization at scale factor 20000 (`pgbench -i -s 20000`) followed by a 600-second run with 180 clients and 80 threads (`-c 180 -j 80 -T 600 -b select-only`). The reported figures are:

- 238,804 read IOPS
- **Read latency** of 0.638ms

Both figures are as reported in the original blog post. The white paper reports the same 238,804 IOPS but describes latency only as "minimal latency", without a number. The white paper publishes this single run configuration only, so it does not support conclusions about scalability across concurrent session counts.

These figures are read-only results from Dell's specific test environment and configuration. The white paper publishes the pgbench run conditions but not the hardware specifications of the servers and PowerFlex cluster used for the test, nor the network configuration. They do not imply the same performance for write-inclusive mixed workloads or in other environments, so measure directly in your own environment. Source: [What If? Unleashing innovation with Amazon EKS Hybrid Nodes and Dell PowerFlex](https://infohub.delltechnologies.com/en-nz/p/what-if-unleashing-innovation-with-amazon-eks-hybrid-nodes-and-dell-powerflex/); white paper: [Amazon EKS Hybrid Nodes on Dell PowerFlex — PostgreSQL deployment](https://infohub.delltechnologies.com/en-us/l/amazon-eks-hybrid-nodes-on-dell-powerflex/postgresql-deployment-1/) (Dell H04475, April 2025).

**Architecture characteristics:**

- Dynamic volume provisioning via the PowerFlex CSI Driver
- Flexibility of software-defined storage with Kubernetes-native integration
- Consistent storage management experience in hybrid environments

### Superbet (Happening) Distributed Edge Case

A case where Superbet, a gaming and sports betting platform, uses EKS Hybrid Nodes to manage distributed edge environments.

**Implementation objectives:**

- Data localization to comply with regional regulatory requirements
- Improved operational efficiency through centralized Kubernetes management
- Low-latency service delivery at edge locations

**Storage strategy:**

- High-performance storage for local caching
- Network storage for central data synchronization
- Data protection that satisfies compliance requirements

## Amazon Repository Package Addition Request Process

### Feasibility of Package Addition Requests

If a specific package is not included in the Amazon Linux 2023 release you use, you can request its addition through public channels. Note, as covered above, that `corosync` and `pacemaker` were re-added to the repository in AL2023.10, so before filing a request confirm whether the package is already available in your current release.

### Official Request Channels {#official-request-procedure}

The Amazon Linux 2023 project collects feature requests, such as package additions, through public channels. The paths documented in the AL2023 repository README are:

- Submit feature requests/bug reports as [issues](https://github.com/amazonlinux/amazon-linux-2023/issues) in the GitHub `amazonlinux/amazon-linux-2023` repository (check existing issues first)
- Use GitHub [Discussions](https://github.com/amazonlinux/amazon-linux-2023/discussions) for questions and discussion
- Provide feedback through your designated AWS account team or [AWS re:Post](https://repost.aws/)
- Report security issues to the security team per the [security policy](https://github.com/amazonlinux/amazon-linux-2023/security/policy) rather than opening an issue

### Information Helpful to Include (author guidance) {#realistic-expectations-and-constraints}

The items below are not AWS-published mandatory requirements; they are author guidance to make a request clear to reviewers.

- A specific use case and the problem you are trying to solve
- Review results and limitations of existing alternatives (supported OSes, managed services, etc.)
- A reproducible example or references where possible

There is no published official standard for processing time, approval likelihood, or AWS's internal priorities, so this document does not assert them. Whether a request is accepted and on what schedule is at the Amazon Linux team's discretion.

### Alternative Approaches

**Source compilation approach (not recommended):**

Installing packages via direct source compilation on Amazon Linux 2023 is technically possible but has the following serious problems:

- **Complex dependency management**: Requires dozens of dependent libraries and development tools
- **Missed security updates**: Security patches must be tracked and applied manually
- **System stability risk**: Potential system instability due to unverified binaries
- **Increased operational complexity**: Sharply increased complexity in upgrade, backup, and recovery processes
- **Excluded from support scope**: AWS Support cannot assist with troubleshooting

**Recommended alternatives:**

1. **Use a supported OS**: Use the required packages on Ubuntu 22.04 LTS or RHEL 9
2. **Managed services**: Adopt AWS-native solutions such as Amazon EFS and FSx
3. **Enterprise solutions**: Integrate proven 3rd party storage solutions with CSI Drivers

### Notes to Make a Request Clear {#considerations-when-requesting-packages}

The following is not a prediction of approval likelihood but general drafting guidance to make a request easier for reviewers to understand.

- If other users or use cases share the same need, present them together
- Explain concretely why existing alternatives (supported OSes, managed services, etc.) are not sufficient
- Include information that affects operations, such as the package's maintainer, license, and security-update path

Decisions about actual adoption, security/stability judgments, and the maintenance burden rest with the Amazon Linux team; this document does not prejudge the outcome.

## Cost Optimization Strategy

### Cost Optimization Recommendations

**Short-term strategies:**

- Select the appropriate performance mode for workload characteristics
- Apply lifecycle policies to unused data
- Reduce data transfer costs through network traffic optimization

**Long-term strategies:**

- Optimize storage costs through data tiering (EFS IA/Archive, etc.)
- Reserved Instances and Savings Plans apply only to **compute** usage such as Amazon EC2, Fargate, Lambda, and SageMaker. They do not apply to EFS or FSx storage-capacity or throughput charges, so consider them only for the compute your hybrid nodes use (where applicable). Optimize file-storage costs through each service's own pricing options—storage classes, throughput modes, and lifecycle policies.
- Consider vendor lock-in when establishing a multi-cloud strategy

## Security and Compliance

### Data Protection

The security features below differ in support scope and configuration depending on the service, driver, and protocol you choose. Do not assume they apply identically to EFS, FSx (ONTAP/OpenZFS, etc.), and on-premises NFS; confirm support in each service's documentation.

**Encryption:**

- Encryption in transit: EFS encrypts NFS traffic with TLS 1.2 via the EFS Mount Helper. FSx variants and on-premises NFS support different encryption methods and settings per service/protocol, so verify each separately.
- Encryption at rest: EFS and FSx support encryption at rest using AWS KMS keys. On-premises NFS relies on the backend storage's own encryption capability.
- Key management: KMS key rotation and access-control policies (managed services only)

**Access control:**

- EFS: Combines IAM policies, EFS Access Points, and POSIX permissions to control access.
- FSx / on-premises NFS: Permission models differ by protocol (NFS/SMB) and directory-service integration.
- Common: Network-level access control (security groups, NACLs) and on-premises firewall rules

### Compliance Considerations

**Data sovereignty:**

- Comply with regional data residency requirements
- Address cross-border data transfer regulations
- Meet local data processing requirements

**Audit and logging:**

- CloudTrail records EFS/FSx **management API calls** (file system creation, configuration changes, etc.); it does not record the file-level read/write access itself. If you need file data-access auditing, configure service-specific features (for example, file-access auditing in FSx for Windows File Server, or the auditing capability in FSx for NetApp ONTAP) or application/client-side logging separately.
- Network traffic monitoring via VPC Flow Logs
- On-premises NFS relies on the audit logs provided by the backend storage.

## Conclusion and Recommendations

Early Amazon Linux 2023 releases did not ship pacemaker and corosync, making it hard to carry over NFS designs that depend on those packages. AL2023.10 later re-added both packages to the repository, but package availability must be confirmed in the release you use, and the support scope of any particular HA configuration is a separate matter. For EKS Hybrid Nodes, compare the alternatives in this guide—AWS-managed file services, existing enterprise storage through CSI drivers, and a separately managed NFS service—against the workload's availability, connectivity, and operating requirements.

**Key recommendations:**

1. **Consider Amazon EFS first**: The optimal choice for most use cases, providing enterprise-grade capabilities without complex configuration
2. **Protect existing investments**: If on-premises enterprise storage exists, integrate via CSI Drivers to protect the investment and gain cloud benefits
3. **Phased approach**: Minimize risk by starting small and expanding incrementally
4. **Operational automation**: Minimize manual management and establish automated monitoring and recovery systems
5. **Security first**: Consider data protection and compliance requirements from the initial design phase

Through these approaches, a stable, scalable, and cost-effective shared file storage solution can be built in EKS Hybrid Nodes environments.

---

## References

### Official Documentation
- [Amazon EKS Hybrid Nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Official EKS Hybrid Nodes user guide
- [Amazon EFS User Guide](https://docs.aws.amazon.com/efs/latest/ug/) — Amazon Elastic File System user guide
- [Amazon Linux 2023 Release Notes](https://docs.aws.amazon.com/linux/al2023/release-notes/) — Amazon Linux 2023 release notes and changes
- [Amazon EKS Hybrid Nodes on Dell PowerFlex](https://infohub.delltechnologies.com/en-us/l/amazon-eks-hybrid-nodes-on-dell-powerflex/overview-7117/) — Dell white paper (H04475, April 2025): installation and configuration steps, plus the PostgreSQL pgbench test conditions
- Kubernetes CSI driver development guide — Official Container Storage Interface specification

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md) — Hybrid Nodes definition, requirements, and how they work
- [Harbor Private Registry EKS Integration](./harbor-registry.md) — Container registry configuration for hybrid environments
