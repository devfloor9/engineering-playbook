---
title: Node Authentication Methods — SSM vs IAM Roles Anywhere
description: "IAM credential provider selection guide for EKS Hybrid Nodes — SSM hybrid activation vs IAM Roles Anywhere comparison, the Vault PKI integration pattern, Hybrid Nodes IAM role minimum permissions, and credential lifecycle management."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 5
tags:
  - eks
  - hybrid-node
  - security
  - iam
  - scope:design
keywords:
  - SSM hybrid activation
  - IAM Roles Anywhere
  - nodeadm
  - X.509
sidebar_label: Node Authentication Methods
category: hybrid-multicloud
---

## Overview

Hybrid nodes have no EC2 instance profile, so an IAM credential provider for on-premises is required. The two options are SSM hybrid activation and IAM Roles Anywhere, specified with the `--credential-provider` option of `nodeadm install`. This document covers the operational differences between the two methods, selection criteria by organization type, and recommendations from a credential lifecycle management perspective.

## How They Work: Comparison

| Item | SSM hybrid activation | IAM Roles Anywhere |
|------|----------------------|--------------------|
| Authentication basis | SSM managed instance registered with an activation code/ID | X.509 certificates (private CA trust anchor) |
| Prerequisite infrastructure | None | PKI (private CA) and certificate distribution system required |
| Credential renewal | Automatically renewed by the SSM agent (5-minute heartbeat) | Certificate-based session renewal — certificate lifecycle management required |
| nodeadm option | `--credential-provider ssm` | `--credential-provider iam-ra` |
| Firewall targets | `ssm.<region>`, `amazon-ssm-<region>.s3.<region>` | `rolesanywhere.<region>`, `rolesanywhere.amazonaws.com` |
| Side benefits | Node is registered as an SSM managed instance — enables Session Manager access and patch management integration | Integrates with existing PKI governance — certificate revocation immediately blocks node credentials |
| Operational burden | Managing activation expiration and quantity | CA operations; automating certificate issuance, renewal, and revocation |

## Selection Criteria

- **Organizations that do not operate a PKI**: SSM is the default choice. It can start with just an activation issuance, without additional infrastructure, and the official quickstart path is also based on SSM.
- **Organizations that already have private CA and certificate governance** (security-team-managed regimes in finance and telecom): IAM Roles Anywhere integrates naturally with the existing control framework. It suits security organizations that prefer the operating model where certificate revocation equals blocking node credentials.
- **Organizations already operating HashiCorp Vault**: Vault is not supported as an independent credential provider; instead, an integration pattern documented in an official AWS blog uses Vault's PKI Secrets Engine as the private CA registered as the IAM Roles Anywhere trust anchor. This connects hybrid node authentication to an existing Vault-based secrets and certificate management regime.
- Either way, the per-node IAM role converges to a single Hybrid Nodes IAM role, and the firewall registration endpoints differ ([Zone C domain list](../networking/firewall-connectivity.md#zone-c-aws-service-endpoints-outbound-domains)), which must be reflected in the request form.

:::note nodeadm version caution (SSM)
When using SSM as the credential provider, `nodeadm` 1.0.19 or later is required. Earlier versions include an expired SSM signing key, causing `nodeadm install`/`upgrade` to fail with a signature verification error.
:::

## Hybrid Nodes IAM Role Minimum Permissions

The Hybrid Nodes IAM role requires the following permissions. This is the minimum configuration stated in the official documentation; do not add workload permissions to this role.

| Permission | Purpose | Alternative if not granted |
|------------|---------|---------------------------|
| `eks:DescribeCluster` | `nodeadm` retrieves cluster information such as the API endpoint, CA bundle, and Service CIDR | Provide those values directly in the NodeConfig |
| `eks:ListAccessEntries` | `nodeadm` pre-validates cluster access entries | Pass `--skip cluster-access-validation` to `nodeadm init` |
| `AmazonEC2ContainerRegistryPullOnly` (managed policy) | kubelet pulls container images from ECR | None (required) |
| `AmazonSSMManagedInstanceCore` (managed policy, when using SSM) | Hybrid activation registration and credential renewal | None (required for SSM) |
| `ssm:DeregisterManagedInstance` + `ssm:DescribeInstanceInformation` (when using SSM) | Managed instance deregistration by `nodeadm uninstall` | Manually clean up SSM entries when removing nodes |
| `eks-auth:AssumeRoleForPodIdentity` (optional) | Pod credential issuance by the EKS Pod Identity Agent | Not needed if Pod Identity is unused |

For `ssm:DeregisterManagedInstance`, it is recommended to scope the resource condition down to instances associated with the corresponding hybrid activation, as in the official CloudFormation example.

## Credential Lifecycle Management

After the authentication method is decided, the issuance, renewal, and revocation flow of credentials must be established as an operational procedure.

- **SSM**: An activation has an expiration date and a registration quantity limit. Issue and manage activations in line with node expansion plans, and reflect in the expansion runbook that new nodes cannot be registered with an expired activation. SSM managed instance entries for deregistered nodes are cleanup targets.
- **IAM Roles Anywhere**: Certificate expiration means node authentication failure. Configure certificate renewal automation (replacement before expiration) and expiration-approaching alerts, and include the procedure of certificate revocation (CRL) → immediate blocking of node credentials in the security response playbook for suspected compromise. The temporary credential session validity defaults to one hour and can be configured up to twelve hours.
- **Least privilege**: Grant the Hybrid Nodes IAM role only the permissions required for node operations, and separate workload permissions per Pod with IRSA or EKS Pod Identity. Avoid configurations that pile broad workload permissions onto the node role.

## Summary of Recommendations

- Organizations without a PKI choose SSM; organizations with private CA governance choose IAM Roles Anywhere.
- When using SSM, use nodeadm 1.0.19 or later.
- Reflect the credential endpoints of the chosen method in the firewall request form (Zones A and C).
- Document credential renewal and revocation procedures in the expansion runbook and the security response playbook.
- Separate workload permissions with IRSA/Pod Identity rather than the node role.

## References

### Official Documentation
- [Prepare credentials for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-creds.html) — SSM and IAM Roles Anywhere credential configuration
- [Amazon EKS Hybrid Nodes overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Hybrid Nodes prerequisites
- [IAM Roles Anywhere User Guide](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) — Trust anchor and profile configuration

### Technical Blogs
- [Extending EKS with Hybrid Nodes: IAM Roles Anywhere and HashiCorp Vault — AWS Containers Blog](https://aws.amazon.com/blogs/containers/extending-eks-with-hybrid-nodes-iam-roles-anywhere-and-hashicorp-vault/) — Integration pattern using Vault PKI as the trust anchor

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How It Works](../overview-architecture/hybrid-nodes-fundamentals.md) — nodeadm registration flow
- [Firewall and DNS Pre-registration Guide](../networking/firewall-connectivity.md) — Endpoint registration per authentication method
