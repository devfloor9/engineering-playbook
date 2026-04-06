---
title: "EKS Hybrid Nodes Shared File Storage Solutions"
sidebar_label: "File Storage"
description: "A comprehensive guide for implementing shared file storage in EKS Hybrid Nodes environments, covering AWS managed services, enterprise storage integration, and Amazon Linux 2023 alternative approaches."
tags: [eks, hybrid-nodes, storage, efs, fsx, nfs, amazon-linux-2023]
category: "hybrid-multicloud"
last_update:
  date: 2026-02-14
  author: devfloor9
---

# EKS Hybrid Nodes Shared File Storage Solutions

> **Created**: 2025-09-15 | **Updated**: 2026-02-14 | **Reading time**: ~11 min


## Overview

In hybrid environments, shared file storage is a critical component for sharing data across multiple nodes, operating stateful applications, and maintaining data consistency between cloud and on-premises. With the removal of traditional high-availability clustering packages (pacemaker, corosync) in Amazon Linux 2023, changes to existing NFS cluster configuration approaches are required.

This document addresses these changes by presenting effective shared file storage solutions for EKS Hybrid Nodes environments, reflecting the latest information as of 2025.

## Technical Background and Current State Analysis

### Amazon Linux 2023 Package Policy Changes

The transition from Amazon Linux 2 to Amazon Linux 2023 resulted in the removal of the following clustering-related packages:

- `corosync` and related libraries (`corosynclib`, `corosync-qdevice`, `corosync-qnetd`)
- The entire `pacemaker` package set (`pacemaker-cli`, `pacemaker-cluster-libs`, `pacemaker-remote`, etc.)

These changes reflect AWS's strategic direction: providing higher stability and operational efficiency through proven managed services instead of complex infrastructure-level clustering.

### EKS Hybrid Nodes Supported Operating Systems (2025 Update)

The following operating systems were announced as supported when EKS Hybrid Nodes reached General Availability (GA) in December 2024.

**Officially Supported Operating Systems (as of 2025):**

- **Amazon Linux 2023**: AWS-optimized operating system, available only in virtualized environments for on-premises use
- **Ubuntu**: 20.04, 22.04, 24.04 LTS versions supported
- **Red Hat Enterprise Linux (RHEL)**: Versions 8 and 9 supported

**Important Changes:**

- **Bottlerocket support discontinued**: Removed from the official support list as of 2025
- **Rocky Linux**: Still not included in the official support list and is outside the scope of AWS Support

**Support Scope:**

- AWS only supports EKS Hybrid integration features; operating system support itself is the responsibility of each vendor
- AWS Support is provided only for hybrid node connectivity and management features

## Shared File Storage Solution Architecture

### 1. AWS Managed Service-Based Solutions

### Amazon EFS (Elastic File System)

Amazon EFS is the most recommended shared file storage solution for EKS Hybrid Nodes environments.

**Key Features:**

- Compatible with existing NFS clients through NFSv4.1 protocol support
- No capacity management needed with automatic scaling
- 99.999999999% (11 9's) durability through automatic replication across multiple Availability Zones
- Encryption in transit and at rest

**Hybrid Connectivity Methods:**

- Private connectivity via AWS Direct Connect or VPN
- Optimized mount performance through EFS Mount Helper
- Kubernetes-native integration via EFS CSI Driver

**Implementation Considerations:**

- Network latency must be considered when accessing EFS from on-premises
- Calculate network costs based on bandwidth usage
- Configure backup and lifecycle policies

### Amazon FSx

Amazon FSx can be considered for workloads requiring high performance.

**FSx for Lustre:**

- Optimized for high-performance computing (HPC) and AI/ML workloads
- Data tiering support through native S3 integration
- Support for hundreds of GB/s throughput and millions of IOPS
- Increasing adoption in GenAI inference workloads as of 2025

**FSx for NetApp ONTAP:**

- Compatibility with existing NetApp environments
- Multi-protocol support (NFS, SMB, iSCSI)
- Advanced data management features (snapshots, clones, replication)

**FSx for OpenZFS:**

- High-performance NFS workload support
- Storage efficiency through compression and deduplication
- Built-in snapshot and backup capabilities

### 2. Enterprise Storage Integration Solutions

Approaches for integrating existing on-premises storage investments with Kubernetes environments.

### CSI Driver-Based Integration

**NetApp Trident:**

- Supports ONTAP, Cloud Volumes ONTAP, Azure NetApp Files
- Dynamic volume provisioning and snapshot management
- Built-in data protection and disaster recovery features

**Dell PowerScale CSI:**

- Scale-out NAS integration based on OneFS
- Meets high-performance and high-capacity storage requirements
- Multi-tenancy and QoS support

**Pure Storage CSI:**

- FlashBlade and FlashArray integration
- All-flash performance with data compression/deduplication
- Cloud-native data services

### Implementation Architecture

The following architecture is recommended when integrating enterprise storage:

1. **Storage Backend Configuration**: Configure NFS exports or iSCSI targets on on-premises storage systems
2. **CSI Driver Deployment**: Install the vendor's CSI Driver on the Kubernetes cluster
3. **StorageClass Definition**: Configure storage classes for dynamic provisioning
4. **Network Optimization**: Configure dedicated network segments for storage traffic

### 3. Hybrid Operating System-Based Solutions

Alternatives for cases requiring specific requirements or leveraging existing operational expertise.

### Traditional NFS Cluster Based on Ubuntu/RHEL

**Using Ubuntu 22.04 LTS:**

- Supports `pacemaker`, `corosync`, `nfs-kernel-server` packages
- Stable operational environment with 5-year long-term support
- Extensive community support and documentation

**Using RHEL 9:**

- Enterprise-grade support and security updates
- Red Hat high-availability add-on available
- Leverages existing RHEL operational experience

**Implementation Considerations:**

- Handling network partition scenarios between cluster nodes
- High-availability configuration for storage backends
- Regular cluster health monitoring and maintenance

## Real-World Implementation Examples and References

### Dell PowerFlex + EKS Hybrid Nodes

An official reference implementation conducted by Dell Technologies, operating a PostgreSQL database with PowerFlex storage in an EKS Hybrid Nodes environment.

**Performance Results:**

- Achieved 238,804 read IOPS
- Average 0.638ms response latency
- Verified concurrent session scalability

**Architecture Highlights:**

- Dynamic volume provisioning through PowerFlex CSI Driver
- Flexibility of software-defined storage with Kubernetes-native integration
- Consistent storage management experience in hybrid environments

### Superbet (Happening) Distributed Edge Case

A case where the gaming and sports betting platform Superbet manages distributed edge environments using EKS Hybrid Nodes.

**Implementation Goals:**

- Data localization to comply with regional regulatory requirements
- Improved operational efficiency through centralized Kubernetes management
- Low-latency service delivery at edge locations

**Storage Strategy:**

- High-performance storage for local caching
- Network storage for central data synchronization
- Data protection meeting compliance requirements

## Amazon Repository Package Addition Request Process

### Package Addition Request Feasibility

Requesting specific package additions (e.g., pacemaker, corosync) to the Amazon Linux 2023 repository is technically possible but practically very limited.

### Official Request Procedure

**Requesting through AWS Support:**

- Create a "Feature Request" or "Technical Support" case in the AWS Support Console
- The following information is required when requesting package additions:
  - Specific business case and use cases
  - Expected user count and market demand analysis
  - Review results and limitations of existing alternative solutions
  - Security impact assessment and vulnerability analysis
  - Long-term maintenance and support plan

### Realistic Expectations and Constraints

**Review Process:**

- Initial review: 2-4 weeks (basic feasibility review)
- Detailed evaluation: 3-6 months (security, compatibility, dependency analysis)
- Implementation and testing: 6-12 months (if approved)
- Total process: Minimum 1 year or more

**Approval Likelihood:**

- Must align with AWS's strategic direction
- Requires significant customer demand and business value demonstration
- Must meet security and stability standards
- Cost-effectiveness versus long-term maintenance costs must be verified

**AWS's Priorities:**

- Recommends problem-solving through managed services first
- Encourages adoption of cloud-native approaches
- Presents solutions that allow focus on business logic rather than complex infrastructure management

### Alternative Approaches

**Source Compilation Method (Not Recommended):**

Installing packages through direct source compilation on Amazon Linux 2023 is technically possible but has the following serious issues:

- **Complex dependency management**: Requires dozens of dependent libraries and development tools
- **Missing security updates**: Must manually track and apply security patches
- **System stability risk**: Potential system instability from unverified binaries
- **Increased operational complexity**: Dramatically increased complexity in upgrades, backups, and recovery
- **Outside support scope**: AWS Support cannot assist with troubleshooting

**Recommended Alternatives:**

1. **Use supported OS**: Use required packages on Ubuntu 22.04 LTS or RHEL 9
2. **Managed services**: Adopt AWS-native solutions such as Amazon EFS and FSx
3. **Enterprise solutions**: Integrate with proven third-party storage solutions and CSI Drivers

### Considerations When Requesting Packages

**Factors that increase success probability:**

- Identical requests from multiple enterprise customers
- Clear technical necessity and proven absence of alternatives
- Alignment with AWS partner ecosystem
- Broad open-source community support

**Factors that indicate high failure probability:**

- Requirements from a single or few customers
- Problems solvable with existing AWS services
- Packages with security or stability concerns
- Legacy software with high maintenance burden

## Cost Optimization Strategies

### Cost Structure Analysis by Solution

### Cost Optimization Recommendations

**Short-term Strategy:**

- Select appropriate performance modes based on workload characteristics
- Apply lifecycle policies for unused data
- Reduce data transfer costs through network traffic optimization

**Long-term Strategy:**

- Optimize storage costs through data tiering
- Utilize Reserved Instances or Savings Plans
- Consider vendor lock-in when developing multi-cloud strategies

## Security and Compliance

### Data Protection

**Encryption:**

- In-transit encryption: NFS traffic protection via TLS 1.2
- At-rest encryption: Data encryption using AWS KMS keys
- Key management: Regular key rotation and access control

**Access Control:**

- Granular permission management through IAM policies
- Integration of POSIX permissions with AWS access controls
- Network-level access control (security groups, NACLs)

### Compliance Considerations

**Data Sovereignty:**

- Compliance with regional data retention requirements
- Response to cross-border data transfer regulations
- Meeting local data processing requirements

**Audit and Logging:**

- API call logging through CloudTrail
- Network traffic monitoring through VPC Flow Logs
- File access log collection and analysis

## Conclusion and Recommendations

Configuring shared file storage in EKS Hybrid Nodes environments represents a transition from traditional clustering approaches to cloud-native methods. The removal of pacemaker and corosync packages from Amazon Linux 2023 signals this change and simultaneously presents an opportunity to move toward more stable and easier-to-manage solutions.

**Key Recommendations:**

1. **Consider Amazon EFS first**: The optimal choice for most use cases, providing enterprise-grade features without complex setup
2. **Protect existing investments**: If on-premises enterprise storage exists, protect investments and gain cloud benefits through CSI Driver integration
3. **Phased approach**: Minimize risk by starting small and gradually expanding
4. **Operational automation**: Minimize manual management and build automated monitoring and recovery systems
5. **Security first**: Consider data protection and compliance requirements from the initial design stage

Through these approaches, you can build a stable, scalable, and cost-effective shared file storage solution in EKS Hybrid Nodes environments.

---

### References

- Amazon EKS Hybrid Nodes Official Documentation
- Amazon EFS User Guide
- EKS Hybrid Nodes Network Best Practices
- Dell PowerFlex EKS Hybrid Nodes Reference
- Amazon Linux 2023 Release Notes
- Kubernetes CSI Driver Development Guide
