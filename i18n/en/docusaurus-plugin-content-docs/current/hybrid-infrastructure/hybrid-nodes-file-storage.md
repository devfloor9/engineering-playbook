---
title: "EKS Hybrid Nodes Shared File Storage Solution"
sidebar_label: "3. File Storage"
description: "Comprehensive guide for implementing shared file storage in EKS Hybrid Nodes environments, covering AWS managed services, enterprise storage integration, and Amazon Linux 2023 alternative approaches"
tags: [eks, hybrid-nodes, storage, efs, fsx, nfs, amazon-linux-2023]
category: "hybrid-multicloud"
sidebar_position: 3
last_update:
  date: 2026-02-14
  author: devfloor9
---

# EKS Hybrid Nodes Shared File Storage Solution

> 📅 **Written**: 2025-09-15 | **Last Modified**: 2026-02-14 | ⏱️ **Reading Time**: ~9 min


## Overview

Shared file storage in hybrid environments is a critical component for data sharing across multiple nodes, operating stateful applications, and maintaining data consistency between cloud and on-premises. With the removal of traditional high-availability clustering packages (pacemaker, corosync) from Amazon Linux 2023, the traditional NFS cluster configuration approach has become obsolete.

This document addresses these changes and presents effective shared file storage solutions for EKS Hybrid Nodes environments, reflecting the latest information as of 2025.

## Technical Background and Current Status

### Amazon Linux 2023 Package Policy Changes

With the transition from Amazon Linux 2 to Amazon Linux 2023, the following clustering-related packages have been removed:

- `corosync` and related libraries (`corosynclib`, `corosync-qdevice`, `corosync-qnetd`)
- `pacemaker` complete package set (`pacemaker-cli`, `pacemaker-cluster-libs`, `pacemaker-remote`, etc.)

This change reflects AWS's strategic direction. Rather than complex infrastructure-level clustering, the goal is to provide higher reliability and operational efficiency through validated managed services.

### EKS Hybrid Nodes Supported Operating Systems (2025 Update)

When EKS Hybrid Nodes was officially released (GA) in December 2024, the supported operating systems mentioned were:

**Officially Supported Operating Systems (2025):**

- **Amazon Linux 2023**: AWS-optimized OS, available on-premises only in virtualized environments
- **Ubuntu**: 20.04, 22.04, 24.04 LTS versions supported
- **Red Hat Enterprise Linux (RHEL)**: Versions 8, 9 supported

**Important Changes:**

- **Bottlerocket Support Discontinued**: As of 2025, removed from official support list
- **Rocky Linux**: Still not in official support list, outside AWS Support scope

**Support Scope:**

- AWS supports only EKS Hybrid integration features; OS support is the vendor's responsibility
- AWS Support provided only for hybrid node connection and management features

## Shared File Storage Solution Architecture

### 1. AWS Managed Services-Based Solutions

### Amazon EFS (Elastic File System)

Amazon EFS is the most recommended shared file storage solution for EKS Hybrid Nodes environments.

**Core Features:**

- NFSv4.1 protocol support for compatibility with existing NFS clients
- Automatic expansion/reduction requiring no capacity management
- Automatic replication across multiple availability zones providing 99.999999999% (11 9's) durability
- Encryption in transit and at rest

**Hybrid Connectivity Methods:**

- Private connection through AWS Direct Connect or VPN
- Optimized mount performance through EFS Mount Helper
- Kubernetes-native integration through EFS CSI Driver

**Implementation Considerations:**

- Network latency considerations when accessing EFS from on-premises
- Network cost calculation based on bandwidth usage
- Backup and lifecycle policy configuration

### Amazon FSx

For workloads requiring high performance, Amazon FSx can be considered.

**FSx for Lustre:**

- Optimized for high-performance computing (HPC) and AI/ML workloads
- Native S3 integration supporting data tiering
- Support for hundreds of GB/s throughput and millions of IOPS
- Increased usage cases in GenAI inference workloads as of 2025

**FSx for NetApp ONTAP:**

- Compatibility with existing NetApp environments
- Multi-protocol support (NFS, SMB, iSCSI)
- Advanced data management features (snapshots, clones, replication)

**FSx for OpenZFS:**

- High-performance NFS workload support
- Storage efficiency through compression and deduplication
- Built-in snapshot and backup features

### 2. Enterprise Storage Integration Solutions

Utilizing existing on-premises storage investments while integrating with Kubernetes environments.

### CSI Driver-Based Integration

**NetApp Trident:**

- Support for ONTAP, Cloud Volumes ONTAP, Azure NetApp Files
- Dynamic volume provisioning and snapshot management
- Built-in data protection and disaster recovery features

**Dell PowerScale CSI:**

- OneFS-based scale-out NAS integration
- Meeting high-performance and high-capacity storage requirements
- Multi-tenancy and QoS support

**Pure Storage CSI:**

- FlashBlade and FlashArray integration
- All-flash performance with data compression/deduplication
- Cloud-native data services

### Implementation Architecture

When integrating enterprise storage, the following architecture is recommended:

1. **Storage Backend Configuration**: Configure NFS exports or iSCSI targets on on-premises storage systems
2. **CSI Driver Deployment**: Install the vendor's CSI Driver on Kubernetes cluster
3. **StorageClass Definition**: Configure storage classes for dynamic provisioning
4. **Network Optimization**: Configure dedicated network segment for storage traffic

### 3. Hybrid Operating System-Based Solutions

Alternative approaches for specific requirements or leveraging existing operational expertise.

### Ubuntu/RHEL-Based Traditional NFS Cluster

**Ubuntu 22.04 LTS Utilization:**

- Support for `pacemaker`, `corosync`, `nfs-kernel-server` packages
- 5-year long-term support providing stable operational environment
- Extensive community support and documentation

**RHEL 9 Utilization:**

- Enterprise-class support and security updates
- Red Hat high-availability add-on availability
- Leveraging existing RHEL operational experience

**Implementation Considerations:**

- Handling network partition scenarios between cluster nodes
- High-availability configuration of storage backend
- Regular cluster health monitoring and maintenance

## Actual Implementation Cases and References

### Dell PowerFlex + EKS Hybrid Nodes

Official reference implementation from Dell Technologies, operating PostgreSQL database in EKS Hybrid Nodes environment integrated with PowerFlex storage.

**Performance Results:**

- Achieved 238,804 read IOPS
- Average response latency of 0.638ms
- Concurrent session count scalability verified

**Architecture Characteristics:**

- Dynamic volume provisioning through PowerFlex CSI Driver
- Flexibility of software-defined storage combined with Kubernetes-native integration
- Consistent storage management experience in hybrid environments

### Superbet (Happening) Distributed Edge Case

Case of Superbet, a gaming and sports betting platform, utilizing EKS Hybrid Nodes to manage distributed edge environments.

**Implementation Purpose:**

- Data localization to comply with regional regulatory requirements
- Improved operational efficiency through centralized Kubernetes management
- Low-latency service delivery at edge locations

**Storage Strategy:**

- High-performance storage for local caching
- Network storage for central data synchronization
- Data protection meeting compliance requirements

## Amazon Repository Package Addition Request Process

### Package Addition Request Possibility

Amazon Linux 2023 repository package addition requests (e.g., pacemaker, corosync) are technically possible, but practically very limited.

### Official Request Procedure

**Through AWS Support:**

- Create "Feature Request" or "Technical Support" case via AWS Support Console
- Include the following information when requesting package addition:
  - Specific business case and use cases
  - Estimated user count and market demand analysis
  - Review of existing alternative solutions and limitations
  - Security impact assessment and vulnerability analysis
  - Long-term maintenance and support plan

### Realistic Expectations and Constraints

**Review Process:**

- Initial review: 2-4 weeks (basic feasibility check)
- Detailed evaluation: 3-6 months (security, compatibility, dependency analysis)
- Implementation and testing: 6-12 months (if approved)
- Overall process: Minimum 1+ year

**Approval Likelihood:**

- Must align with AWS strategic direction
- Significant customer demand and business value must be demonstrated
- Security and stability standards must be met
- Cost-benefit analysis for long-term maintenance must be verified

**AWS Priorities:**

- Recommended to solve problems through managed service adoption
- Cloud-native approach adoption encouragement
- Emphasis on business logic rather than complex infrastructure management

### Alternative Approach Methods

**Source Compilation Method (Not Recommended):**

Direct source compilation and package installation in Amazon Linux 2023 is technically possible but has serious drawbacks:

- **Complex Dependency Management**: Dozens of dependent libraries and development tools needed
- **Missing Security Updates**: Manual tracking and application of security patches required
- **System Stability Risks**: Potential system instability from unvalidated binaries
- **Operational Complexity**: Increased complexity in upgrades, backups, recovery processes
- **Support Exclusion**: AWS Support unable to provide troubleshooting assistance

**Recommended Alternatives:**

1. **Use Supported OS**: Leverage Ubuntu 22.04 LTS or RHEL 9 for required packages
2. **Managed Services**: Adopt AWS-native solutions like Amazon EFS, FSx
3. **Enterprise Solutions**: Integrate validated 3rd-party storage solutions with CSI Driver

### Package Request Considerations

**Factors Increasing Success Probability:**

- Identical requests from multiple enterprise customers
- Clear technical necessity and absence of alternatives
- AWS partner ecosystem connection
- Broad open-source community support

**Factors Indicating High Failure Probability:**

- Requests from single or few customers only
- Problems solvable by existing AWS services
- Security or stability concerns with packages
- Legacy software with high maintenance burden

## Cost Optimization Strategy

### Solution-Specific Cost Structure Analysis

### Cost Optimization Recommendations

**Short-term Strategies:**

- Select appropriate performance mode matching workload characteristics
- Apply lifecycle policies to unused data
- Optimize network traffic to reduce data transfer costs

**Long-term Strategies:**

- Data tiering optimization for storage costs
- Utilize reserved instances or Savings Plans
- Consider vendor independence when developing multi-cloud strategy

## Security and Compliance

### Data Protection

**Encryption:**

- In-transit encryption: Protect NFS traffic through TLS 1.2
- At-rest encryption: Protect data using AWS KMS keys
- Key management: Regular key rotation and access control

**Access Control:**

- Fine-grained permission management through IAM policies
- Integration of POSIX permissions with AWS access control
- Network-level access control (security groups, NACL)

### Compliance Considerations

**Data Sovereignty:**

- Regional data retention requirements compliance
- Cross-border data transfer regulation compliance
- Local data processing requirements fulfillment

**Audit and Logging:**

- API call logging through CloudTrail
- Network traffic monitoring through VPC Flow Logs
- File access log collection and analysis

## Conclusion and Recommendations

Shared file storage configuration in EKS Hybrid Nodes environments represents a transition from traditional clustering approaches to cloud-native solutions. The removal of pacemaker and corosync packages from Amazon Linux 2023 signals this shift, presenting an opportunity to move toward more stable and easier-to-manage solutions.

**Core Recommendations:**

1. **Prioritize Amazon EFS**: Optimal choice for most use cases, providing enterprise-class features without complex setup
2. **Protect Existing Investments**: For on-premises enterprise storage, integrate through CSI Driver to protect investment and gain cloud benefits
3. **Phased Approach**: Start small and gradually expand to minimize risk
4. **Operations Automation**: Minimize manual management and establish automated monitoring and recovery systems
5. **Security First**: Consider data protection and compliance requirements during initial design phase

Through this approach, you can build a stable, scalable, and cost-efficient shared file storage solution in EKS Hybrid Nodes environments.

---

### Reference Materials

- Amazon EKS Hybrid Nodes official documentation
- Amazon EFS user guide
- EKS Hybrid Nodes networking best practices
- Dell PowerFlex EKS Hybrid Nodes reference
- Amazon Linux 2023 release notes
- Kubernetes CSI driver development guide
