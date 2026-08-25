---
title: EKS Hybrid Nodes Shared File Storage Solutions
description: A comprehensive guide to implementing shared file storage in EKS Hybrid Nodes environments, covering AWS managed services, enterprise storage integration, and Amazon Linux 2023 alternative approaches.
created: "2025-09-15"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 10
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

In hybrid environments, shared file storage is a core component for sharing data across multiple nodes, operating stateful applications, and maintaining data consistency between the cloud and on-premises. With traditional high-availability clustering packages (pacemaker, corosync) removed from Amazon Linux 2023, the conventional approach to NFS cluster configuration requires change.

This document responds to these changes by presenting effective shared file storage solutions for EKS Hybrid Nodes environments, reflecting the latest information as of 2025.

## Technical Background and Current State Analysis

### Amazon Linux 2023 Package Policy Changes

With the transition from Amazon Linux 2 to Amazon Linux 2023, the following clustering-related packages were removed:

- `corosync` and related libraries (`corosynclib`, `corosync-qdevice`, `corosync-qnetd`)
- The entire `pacemaker` package set (`pacemaker-cli`, `pacemaker-cluster-libs`, `pacemaker-remote`, etc.)

These changes reflect AWS's strategic direction: providing higher reliability and operational efficiency through proven managed services instead of complex infrastructure-level clustering.

### Supported Operating Systems

EKS Hybrid Nodes officially supports Amazon Linux 2023, Ubuntu (20.04/22.04/24.04 LTS), and RHEL (8/9). Bottlerocket is supported in preview on VMware vSphere environments (v1.37+), and Rocky Linux is not included in the official support list, placing it outside the scope of AWS Support. For full system requirements, see [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md).

## Shared File Storage Solution Architecture

### 1. AWS Managed Service-Based Solutions

#### Amazon EFS (Elastic File System)

Amazon EFS is the most recommended shared file storage solution for EKS Hybrid Nodes environments.

**Key characteristics:**

- NFSv4.1 protocol support, compatible with existing NFS clients
- Automatic scaling up/down eliminates capacity management
- Automatic replication across multiple Availability Zones provides 99.999999999% (11 9's) durability
- Encryption in transit and at rest

**Hybrid connectivity methods:**

- Private connectivity via AWS Direct Connect or VPN
- Optimized mount performance via the EFS Mount Helper
- Kubernetes-native integration via the EFS CSI Driver

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

**Performance results:**

- Achieved 238,804 read IOPS
- Average response latency of 0.638ms
- Validated scalability of concurrent session counts

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

Requesting the addition of specific packages (e.g., pacemaker, corosync) to the Amazon Linux 2023 repository is technically possible, but realistically limited.

### Official Request Procedure

**Requesting through AWS Support:**

- Create a "Feature Request" or "Technical Support" case in the AWS Support Console
- A package addition request must include the following information:
  - A specific business case and use case
  - Estimated user count and market demand analysis
  - Review results and limitations of existing alternative solutions
  - Security impact assessment and vulnerability analysis
  - Long-term maintenance and support plan

### Realistic Expectations and Constraints

**Review process:**

- Initial review: 2-4 weeks (basic feasibility review)
- Detailed evaluation: 3-6 months (security, compatibility, and dependency analysis)
- Implementation and testing: 6-12 months (if approved)
- Overall process: takes at least 1 year or more

**Approval likelihood:**

- Must align with AWS's strategic direction
- Requires proof of substantial customer demand and business value
- Must meet security and stability standards
- Must validate the benefit relative to long-term maintenance costs

**AWS's priorities:**

- Recommends solving problems through managed services first
- Encourages adoption of cloud-native approaches
- Presents solutions that let teams focus on business logic rather than complex infrastructure management

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

### Considerations When Requesting Packages

**Factors that increase the probability of success:**

- The same request from multiple enterprise customers
- Clear proof of technical necessity and absence of alternatives
- Alignment with the AWS partner ecosystem
- Broad support from the open source community

**Factors with a high probability of failure:**

- Requirements from only a single customer or a small number of customers
- Problems solvable with existing AWS services
- Packages with security or stability concerns
- Legacy software with a heavy maintenance burden

## Cost Optimization Strategy

### Cost Optimization Recommendations

**Short-term strategies:**

- Select the appropriate performance mode for workload characteristics
- Apply lifecycle policies to unused data
- Reduce data transfer costs through network traffic optimization

**Long-term strategies:**

- Optimize storage costs through data tiering
- Use Reserved Instances or Savings Plans
- Consider vendor lock-in when establishing a multi-cloud strategy

## Security and Compliance

### Data Protection

**Encryption:**

- Encryption in transit: Protect NFS traffic with TLS 1.2
- Encryption at rest: Encrypt data using AWS KMS keys
- Key management: Regular key rotation and access control

**Access control:**

- Fine-grained permission management through IAM policies
- Integration of POSIX permissions with AWS access control
- Network-level access control (security groups, NACLs)

### Compliance Considerations

**Data sovereignty:**

- Comply with regional data residency requirements
- Address cross-border data transfer regulations
- Meet local data processing requirements

**Audit and logging:**

- API call logging via CloudTrail
- Network traffic monitoring via VPC Flow Logs
- Collection and analysis of file access logs

## Conclusion and Recommendations

Configuring shared file storage in EKS Hybrid Nodes environments represents a transition from traditional clustering approaches to cloud-native ones. The removal of the pacemaker and corosync packages from Amazon Linux 2023 signals this shift, and at the same time offers an opportunity to move toward more stable and easier-to-manage solutions.

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
- Dell PowerFlex EKS Hybrid Nodes reference — PostgreSQL performance validation reference architecture
- Kubernetes CSI driver development guide — Official Container Storage Interface specification

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How They Work](../overview-architecture/hybrid-nodes-fundamentals.md) — Hybrid Nodes definition, requirements, and how they work
- [Harbor Private Registry EKS Integration](./harbor-registry.md) — Container registry configuration for hybrid environments
