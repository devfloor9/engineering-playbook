---
title: Node Authentication Methods — SSM vs IAM Roles Anywhere
description: "IAM credential provider selection guide for EKS Hybrid Nodes — SSM hybrid activation vs IAM Roles Anywhere comparison, the Vault PKI integration pattern, Hybrid Nodes IAM role minimum permissions, and credential lifecycle management."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 26
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

**Table 1. SSM hybrid activation versus IAM Roles Anywhere behavior**

| Item | SSM hybrid activation | IAM Roles Anywhere |
|------|----------------------|--------------------|
| Authentication basis | SSM managed instance registered with an activation code/ID | X.509 certificates (private CA trust anchor) |
| Prerequisite infrastructure | None | PKI (private CA) and certificate distribution system required |
| Credential renewal | Automatically renewed by the SSM agent (5-minute heartbeat) | Certificate-based session renewal — certificate lifecycle management required |
| nodeadm option | `--credential-provider ssm` | `--credential-provider iam-ra` |
| Firewall targets (credential refresh) | `ssm.<region>.amazonaws.com`, plus `amazon-ssm-<region>.s3.<region>.amazonaws.com` for install artifacts | `rolesanywhere.<region>.amazonaws.com` (session issuance), `rolesanywhere.amazonaws.com` (binary endpoint) |
| Side benefits | Node is registered as an SSM managed instance — you can integrate Session Manager access and patch management, but that requires allowing `ssmmessages.<region>.amazonaws.com` (and, in Regions launched before 2024, `ec2messages.<region>.amazonaws.com`) through the firewall in addition to the `ssm.<region>` credential-refresh endpoint | Integrates with existing PKI governance — but certificate revocation (CRL) only blocks issuance of new sessions; it does not immediately invalidate already-issued temporary credentials (see "Credential revocation" below) |
| Operational burden | Managing activation expiration and quantity | CA operations; automating certificate issuance, renewal, and revocation |

## Selection Criteria

- **Organizations that do not operate a PKI**: SSM is the default choice. It can start with just an activation issuance, without additional infrastructure, and the official quickstart path is also based on SSM.
- **Organizations that already have private CA and certificate governance** (security-team-managed regimes in finance and telecom): IAM Roles Anywhere integrates naturally with the existing control framework. It suits security organizations that want to manage the certificate lifecycle (issuance, renewal, revocation) through an existing PKI control regime. Note that certificate revocation (CRL) only causes subsequent new sessions to be refused — it does not immediately invalidate already-issued temporary credentials; for immediate containment, see the "Credential revocation" section.
- **Organizations already operating HashiCorp Vault**: Vault is not supported as an independent credential provider; instead, an integration pattern documented in an official AWS blog uses Vault's PKI Secrets Engine as the private CA registered as the IAM Roles Anywhere trust anchor. This connects hybrid node authentication to an existing Vault-based secrets and certificate management regime.
- Either way, the per-node IAM role converges to a single Hybrid Nodes IAM role, and the firewall registration endpoints differ ([Zone C domain list](../networking/firewall-connectivity.md#zone-c-aws-service-endpoints-outbound-domains)), which must be reflected in the request form.

:::note nodeadm version caution (SSM)
When using SSM as the credential provider, `nodeadm` 1.0.19 or later is required. Earlier versions include an expired SSM signing key, causing `nodeadm install`/`upgrade` to fail with a signature verification error. For upgrade-time considerations, see [Upgrades and Lifecycle Management](../operations-cost/upgrade-lifecycle).
:::

## Structural Characteristics of SSM Hybrid Activation

Choosing the SSM method brings the following structural characteristics that affect operational design.

- **The node name is fixed to the `mi-` managed instance ID.** A node registered via SSM hybrid activation gets the SSM-issued managed instance ID (with the `mi-` prefix, e.g. `mi-0f1c2d3e4a5b6c7d8`) as its Kubernetes node name, and an arbitrary node name cannot be specified. Organizations that run hostname-based node identification or automation scripts must supplement their identification scheme with node labels (`--node-labels`). If naming nodes directly is a requirement (internal CMDB integration, etc.), IAM Roles Anywhere is the alternative — the certificate CN becomes the node name.
- **Activations carry an expiration.** The default is 24 hours and the maximum is 30 days (with a registration limit of up to 1,000 nodes per activation), and expired activations cannot register new nodes (credential renewal for already-registered nodes continues via the SSM agent regardless of activation expiry). For large expansions, tie activation issuance to the expansion schedule so registration completes before expiry, and the recommended arrangement is one activation per cluster, tagged with the cluster ARN.
- **Account for delayed recovery after disconnections.** SSM temporary credentials are valid for one hour and renew automatically, but on a network disconnection the SSM agent's retry backoff grows to as long as 30 minutes, so node recovery after reconnection can take up to 30 minutes (force a renewal by restarting `amazon-ssm-agent`). IAM Roles Anywhere issues credentials at kubelet's request time, so re-authentication happens within seconds of connectivity recovery — in environments with frequent disconnections, this difference becomes a selection criterion.

```bash
# Example: issue an activation valid for 30 days with up to 10 registrations
# (set the expiration within issuance date +30 days)
aws ssm create-activation \
  --default-instance-name eks-hybrid-nodes \
  --iam-role AmazonEKSHybridNodesRole \
  --registration-limit 10 \
  --expiration-date "2026-09-25T00:00:00" \
  --region us-west-2
```

## IAM Roles Anywhere Configuration and Certificate Chain Verification

When configuring IAM Roles Anywhere with a private PKI (a self-managed CA or HashiCorp Vault PKI), the `nodeadm` NodeConfig follows this format.

```yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: us-west-2
  hybrid:
    iamRolesAnywhere:
      nodeName: hybrid-node-01            # used as the session name — binding it to the certificate CN requires a trust-policy condition (see below)
      trustAnchorArn: arn:aws:rolesanywhere:us-west-2:ACCOUNT_ID:trust-anchor/TA_ID
      profileArn: arn:aws:rolesanywhere:us-west-2:ACCOUNT_ID:profile/PROFILE_ID
      roleArn: arn:aws:iam::ACCOUNT_ID:role/AmazonEKSHybridNodesRole
      certificatePath: /etc/iam/pki/node.crt   # certificate (respect concatenation order if chained)
      privateKeyPath: /etc/iam/pki/node.key
```

The most frequent point of failure in configuration is **the concatenation order of the certificate chain file**. In a PKI using intermediate CAs (including Vault), the certificate file must be concatenated strictly in the following order.

```text
node.crt file layout (top → bottom, order is mandatory)
① Node (leaf) certificate
② Intermediate CA chain (ca_chain — starting from the issuing CA upward)
③ Root CA (up to the CA registered as the trust anchor)
```

```bash
# Narrow the umask first so the private key is owner-only from the moment it is created.
umask 077
install -d -m 700 /etc/iam/pki        # credential-only directory (owner access only)
cd /etc/iam/pki

# Vault PKI issuance — the output contains the private key, so split it directly
# without leaving an intermediate file on disk.
issued=$(vault write -format=json pki_int/issue/eks-hybrid \
  common_name="hybrid-node-01" ttl="8760h")

printf '%s' "$issued" | jq -r '.data.certificate' >  node.crt   # ① leaf
printf '%s' "$issued" | jq -r '.data.ca_chain[]'  >> node.crt   # ② intermediate CA chain
printf '%s' "$issued" | jq -r '.data.private_key' >  node.key
unset issued

# Pin the private key to owner read-only and the certificate to owner-writable.
chmod 600 node.key
chmod 644 node.crt
# If nodeadm/kubelet reads these as a different user, chown to that owner.

# Path validation — prints OK when a valid chain path can be built from the leaf
# up to the trust anchor (root-ca.crt). OK proves that a valid path exists; it does
# NOT verify the physical concatenation order of the input bundle. Verify the order
# and intermediate-CA inclusion separately (e.g. `-show_chain`).
openssl verify -CAfile root-ca.crt -untrusted node.crt node.crt
```

If the order is reversed or an intermediate CA is missing, the IAM Roles Anywhere `CreateSession` call is rejected on trust chain validation, and the node fails to join with an `AccessDeniedException` or a certificate validation error. Fix the following as validation gates in the deployment automation.

1. The condition for binding `nodeName` to the certificate CN — by default, IAM Roles Anywhere sets the session Name to the certificate's hex-encoded serial number and sets the certificate Subject CN as the source identity. Using `nodeName` as the CN is a deliberate design choice; to enforce it, you must ① enable custom role session names on the profile (`acceptRoleSessionName`) and ② add an `aws:PrincipalTag/x509Subject/CN` condition to the role trust policy (`nodeName` must be 64 characters or fewer)
2. Leaf → intermediate CA → root CA concatenation order and chain completeness (`openssl verify`)
3. The CA registered as the trust anchor matches the terminus of the chain
4. The IAM Roles Anywhere profile has **custom role session names enabled (`acceptRoleSessionName`)** — when disabled, specifying a nodeName-based session name is rejected

## EKS Access Entry: HYBRID_LINUX Mapping (Required)

Separately from the credential provider configuration, the Hybrid Nodes IAM role must be registered on the cluster side as an access entry of **type `HYBRID_LINUX`** for node joins to be authorized. Without this mapping, even if credential issuance succeeds, kubelet's API server authentication is rejected with `Unauthorized`.

```bash
aws eks create-access-entry \
  --cluster-name my-hybrid-cluster \
  --principal-arn arn:aws:iam::ACCOUNT_ID:role/AmazonEKSHybridNodesRole \
  --type HYBRID_LINUX

# Verify registration
aws eks list-access-entries --cluster-name my-hybrid-cluster
```

- No additional Kubernetes groups or access policies can be attached to a `HYBRID_LINUX` access entry; EKS automatically grants node permissions (equivalent to `system:nodes`).
- The cluster authentication mode must be `API` or `API_AND_CONFIG_MAP`. The official documentation states that the Hybrid Nodes IAM role can be mapped to Kubernetes RBAC with an access entry **or** an `aws-auth` ConfigMap entry, and the `aws-auth` mapping is usable when the authentication mode is `API_AND_CONFIG_MAP`. That said, because a `HYBRID_LINUX` access entry has EKS grant node permissions automatically, the access entry approach is recommended for hybrid nodes, and a `CONFIG_MAP`-only mode (which does not support access entries) should not be used.
- `nodeadm init` pre-validates the existence of this access entry (requires the `eks:ListAccessEntries` permission — see the minimum permissions table below).

## Hybrid Nodes IAM Role Minimum Permissions

The Hybrid Nodes IAM role requires the following permissions. This is the minimum configuration stated in the official documentation; do not add workload permissions to this role.

**Table 2. Hybrid Nodes IAM role minimum permissions and alternatives if not granted**

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
- **IAM Roles Anywhere**: Certificate expiration means failure to issue new sessions. Configure certificate renewal automation (replacement before expiration) and expiration-approaching alerts. The temporary credential session validity defaults to one hour and can be adjusted via profile settings.
  - **Credential revocation**: On suspected compromise, separate revocation into two steps. ① **Block new sessions** — CRLs are an optional feature of IAM Roles Anywhere, and an imported CRL is only checked on subsequent `CreateSession` calls (CDP/OCSP callbacks are not supported, so CA-side CRL publication alone is not honored; you must import the CRL into IAM Roles Anywhere). ② **Invalidate already-issued temporary credentials** — publishing a CRL or revoking the certificate does not immediately invalidate temporary credentials that have already been issued. To immediately block already-issued sessions, apply the `AWSRevokeOlderSessions` inline policy (or a Deny policy conditioned on `aws:TokenIssueTime`) to the role; this policy **denies the existing sessions of every node that uses that role** (the blast radius of a shared role). To isolate a single node, you need a design that uses a separate role per node.
- **Least privilege**: Grant the Hybrid Nodes IAM role only the permissions required for node operations, and separate workload permissions per Pod with IRSA or EKS Pod Identity. Avoid configurations that pile broad workload permissions onto the node role.

## Summary of Recommendations

- Organizations without a PKI choose SSM; organizations with private CA governance choose IAM Roles Anywhere.
- When using SSM, use nodeadm 1.0.19 or later, and reflect in the automation regime that node names are fixed to `mi-` IDs.
- For IAM Roles Anywhere, fix the certificate concatenation order (leaf → intermediate CA → root CA) as a deployment validation gate, and to bind `nodeName` to the certificate CN, configure the trust policy's CN condition together with `acceptRoleSessionName`.
- Include registering the Hybrid Nodes IAM role as a `HYBRID_LINUX` access entry in the step right after cluster creation.
- Reflect the credential endpoints of the chosen method in the firewall request form (Zones A and C).
- Document credential renewal and revocation procedures in the expansion runbook and the security response playbook.
- Separate workload permissions with IRSA/Pod Identity rather than the node role.

## References

### Official Documentation
- [Prepare credentials for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-creds.html) — SSM and IAM Roles Anywhere credential configuration
- [Amazon EKS Hybrid Nodes overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Hybrid Nodes prerequisites
- [IAM Roles Anywhere User Guide](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) — Trust anchor and profile configuration
- [Grant IAM users access to Kubernetes with EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html) — The HYBRID_LINUX access entry type
- [SSM CreateActivation API](https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_CreateActivation.html) — Activation expiration (default 24 hours, max 30 days) and registration quantity parameters

### Technical Blogs
- [Extending EKS with Hybrid Nodes: IAM Roles Anywhere and HashiCorp Vault — AWS Containers Blog](https://aws.amazon.com/blogs/containers/extending-eks-with-hybrid-nodes-iam-roles-anywhere-and-hashicorp-vault/) — Integration pattern using Vault PKI as the trust anchor

### Related Documents (Internal)
- [EKS Hybrid Nodes Concepts and How It Works](../overview-architecture/hybrid-nodes-fundamentals.md) — nodeadm registration flow
- [Firewall and DNS Pre-registration Guide](../networking/firewall-connectivity.md) — Endpoint registration per authentication method
