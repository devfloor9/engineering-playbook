---
title: Upgrades and Lifecycle Management
description: "Kubernetes version upgrade strategy for EKS Hybrid Nodes — covers how nodeadm upgrade works, the mandatory manual cordon/drain, handling SSM signing key expiration (nodeadm 1.0.19+), private mirror configuration for air-gapped networks, and the upgrade runbook."
created: "2026-08-25"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 19
tags:
  - eks
  - hybrid-node
  - operations
  - upgrade
  - scope:ops
keywords:
  - nodeadm upgrade
  - cordon
  - drain
  - yum mirror
sidebar_label: Upgrades & Lifecycle
category: hybrid-multicloud
---

## Overview

Unlike managed node groups, the entire Kubernetes version upgrade process for hybrid nodes is the customer's responsibility ([shared responsibility model](../overview-architecture/hybrid-nodes-fundamentals#shared-responsibility-model)). AWS provides the upgrade tool (`nodeadm upgrade`), but workload evacuation (drain), sequencing, and verification are performed by the operator. This document covers upgrade strategy selection (in-place vs node replacement), how `nodeadm upgrade` works, prerequisites (drain, nodeadm version), private mirror configuration for air-gapped environments, and the per-node upgrade runbook.

## Upgrade Strategy: Node Replacement vs In-Place

| Strategy | Method | Suitable environment |
|----------|--------|---------------------|
| Node replacement (cutover, blue-green) — **officially recommended** | Join new nodes initialized at the target version, migrate workloads, then remove old-version nodes with `nodeadm uninstall` and `kubectl delete node` | Environments with spare hardware or virtualization-based node provisioning |
| In-place (`nodeadm upgrade`) | Replace artifacts such as kubelet on the existing node with the target version — the node incurs downtime during the replacement | Environments without spare capacity that must upgrade on the same host |

The official guide recommends node replacement (cutover) when spare capacity is available, and positions in-place as the alternative for environments without it. Both strategies share the same prerequisites: **upgrade the control plane first**, then follow with the nodes; node versions must be equal to or lower than the control plane and within the Kubernetes version skew policy (kubelet at most 3 minor versions behind the API server). During an in-place upgrade, the credential provider (SSM ↔ IAM RA) cannot be changed, and the node name is preserved after the upgrade.

## How nodeadm upgrade Works: The 4-Phase Process

`nodeadm upgrade` is an in-place replacement operation executed on the node, proceeding internally in four phases.

```mermaid
flowchart LR
    A["① Shutdown<br/>Stop node processes<br/>including kubelet"] --> B["② Uninstall<br/>Remove old-version<br/>artifacts"]
    B --> C["③ Install<br/>Download and install<br/>target-version artifacts"]
    C --> D["④ Restart<br/>Re-initialize and rejoin<br/>based on NodeConfig"]
```

1. **Shutdown**: Stops node components including kubelet. From this point, no new Pods are scheduled to the node.
2. **Uninstall**: Removes artifacts of the existing Kubernetes version (kubelet, kubectl binaries, etc.).
3. **Install**: Downloads and installs the target version's artifacts. In air-gapped networks, this phase must resolve over the [private path](#air-gapped-upgrades-private-mirror-configuration).
4. **Restart**: Re-initializes the node based on the NodeConfig and rejoins the cluster.

```bash
# Run with the target version and NodeConfig
sudo nodeadm upgrade 1.34 --config-source file://nodeConfig.yaml
```

An in-place upgrade causes node downtime. `nodeadm upgrade` upgrades not only EKS artifacts such as kubelet and kubectl but also **containerd**, via the OS package manager (depending on the target Kubernetes version this can include a containerd major-version upgrade), and running containers may be restarted during this process. Between the kubelet stop and restart the node becomes `NotReady` and is excluded from health checks and scheduling, so you must evacuate workloads with a manual drain before upgrading. Do not assume running containers are preserved as-is — plan the upgrade as a disruptive operation.

## Mandatory Manual Drain: nodeadm Does Not Evacuate Pods

:::warning Skipping drain risks workload loss
`nodeadm upgrade` does **not perform Pod evacuation (drain).** The cordon → drain → replace flow that a managed node group upgrade performs automatically must be executed manually by the administrator for hybrid nodes. Upgrading without a drain means Pods running at the moment kubelet stops can be terminated without a graceful shutdown (preStop hooks, terminationGracePeriod).
:::

```bash
# 1. Block new scheduling
kubectl cordon mi-0f1c2d3e4a5b6c7d8

# 2. Evacuate workloads (respects PodDisruptionBudgets)
# Caution: --delete-emptydir-data deletes the emptyDir volume data of Pods on this node.
#          Confirm there is no unrecoverable buffer/cache/scratch data first, and back up
#          or move required data to a persistent volume before running.
# Caution: --grace-period=300 "overrides" each Pod's configured terminationGracePeriodSeconds
#          with 300s. If you do not know a workload's termination time, omit this flag to use
#          each Pod's default grace period, and tune the value only for workloads that need it.
kubectl drain mi-0f1c2d3e4a5b6c7d8 \
  --ignore-daemonsets \
  --delete-emptydir-data \
  --grace-period=300 \
  --timeout=15m
# If the drain reaches its timeout, do not treat it as success — investigate why Pods are
# not being evicted (PDB waiting, slow termination, etc.) and then proceed again.

# 3. Run the upgrade (on the node)
sudo nodeadm upgrade 1.34 --config-source file://nodeConfig.yaml

# 4. Confirm the node is Ready at the new version, then resume scheduling
kubectl get node mi-0f1c2d3e4a5b6c7d8 -o wide   # check the VERSION column
kubectl uncordon mi-0f1c2d3e4a5b6c7d8
```

- By default, `nodeadm upgrade` pre-validates **that the node is cordoned (node-validation) and that no Pods other than DaemonSets and static Pods remain (pod-validation)**, and refuses to proceed otherwise. These validations are safety checks only — they do not perform the drain for you.
- For workloads with a **PodDisruptionBudget (PDB)**, drain evicts Pods through the eviction API and respects the PDB, so a drain waits or stalls when an eviction would violate the PDB. Proceeding one node at a time reduces the concurrent disruption scope, but even a single eviction is rejected when `minAvailable` equals the current replica count or available replicas are already insufficient — so sequential processing alone does not prevent a PDB stall. Before draining, preflight each workload's available replica count, spare capacity (whether Pods can reschedule onto other nodes), and PDB settings; if a drain is blocked, remediate at the workload level (scale up replicas, adjust the PDB) before proceeding.
- For workloads that take time to terminate, such as GPU inference, adjust `--grace-period` to match model unload time.
- Even after the node returns to Ready, confirm that the CNI (Cilium) DaemonSet Pod has started properly before uncordoning.

## SSM Signing Key Expiration: nodeadm 1.0.19 or Later Required

The SSM signing key embedded in older `nodeadm` binaries has expired, causing `nodeadm install`/`upgrade` to fail in environments using the SSM credential provider with the following signature verification error.

```text
"msg":"Command failed","error":"failed to install ssm installer:
validating ssm-setup-cli signature: Signature Verification Error: No matching signature"
```

Fix **updating `nodeadm` itself to 1.0.19 or later before running the upgrade** as step 0 of the upgrade runbook.

```bash
# Check the current nodeadm version
nodeadm version

# Replace with the latest nodeadm (x86_64)
curl -OL 'https://hybrid-assets.eks.amazonaws.com/releases/latest/bin/linux/amd64/nodeadm'
chmod +x nodeadm && sudo mv nodeadm /usr/local/bin/nodeadm
```

For air-gapped deployment systems that require version pinning, use a versioned path instead of `releases/latest`, and mirror the binary together with its checksum in the internal artifact repository.

## Air-gapped Upgrades: Private Mirror Configuration

`nodeadm upgrade` fetches EKS artifacts (kubelet, etc.), but **OS-layer dependencies such as containerd, ca-certificates, and kernel modules are handled by the OS package manager (yum/dnf, apt)**. For an upgrade not to fail midway in an internet-blocked environment, both paths must resolve inside the internal network.

| Download target | Default source | Air-gapped handling |
|-----------------|---------------|---------------------|
| EKS node artifacts (kubelet, etc.) | `hybrid-assets.eks.amazonaws.com` | Internal artifact repository mirror, or proxy allowance limited to this domain |
| OS packages (containerd, ca-certificates, runc, etc.) | Official OS repositories (yum/apt) | Replace repository source paths with a **private mirror server** |
| Container images (CNI, add-ons) | ECR, `public.ecr.aws` | ECR PrivateLink or Harbor mirror ([registry integration](../storage-registry/harbor-registry)) |

Separate mirrors per OS, version, and architecture (do not mix RHEL and AL2023 packages in one repository), and include every repository and GPG signing key you need. Back up existing public sources, then explicitly replace or disable them, and verify the enabled source list afterward. The following shows the per-distribution approach; replace the mirror paths, release versions, and keys with values for your environment.

```bash
# RHEL 9 — replace public BaseOS/AppStream with an internal mirror (RHEL only)
sudo cp /etc/yum.repos.d/redhat.repo /etc/yum.repos.d/redhat.repo.bak 2>/dev/null || true
sudo tee /etc/yum.repos.d/internal-mirror.repo << 'EOF'
[internal-rhel9-baseos]
name=Internal Mirror - RHEL9 BaseOS
baseurl=https://mirror.company.local/rhel9/baseos/
enabled=1
gpgcheck=1
gpgkey=https://mirror.company.local/keys/RPM-GPG-KEY-redhat-release
[internal-rhel9-appstream]
name=Internal Mirror - RHEL9 AppStream
baseurl=https://mirror.company.local/rhel9/appstream/
enabled=1
gpgcheck=1
gpgkey=https://mirror.company.local/keys/RPM-GPG-KEY-redhat-release
EOF
sudo dnf clean all && sudo dnf repolist   # verify enabled sources

# AL2023 — Amazon Linux uses version-locked repositories, so do not reuse RHEL repos.
# Pin the release version via /etc/dnf/vars/releasever and point the mirrorlist at the internal mirror.
sudo cp /etc/yum.repos.d/amazonlinux.repo /etc/yum.repos.d/amazonlinux.repo.bak
echo "2023.5.20240708" | sudo tee /etc/dnf/vars/releasever   # pin to a version your org validated
sudo sed -i 's#^mirrorlist=.*#baseurl=https://mirror.company.local/al2023/$releasever/$basearch/#' \
  /etc/yum.repos.d/amazonlinux.repo
sudo dnf clean all && sudo dnf repolist   # confirm the amazonlinux repo points at the internal mirror

# Ubuntu — the default sources live in ubuntu.sources, so adding only an extra file leaves the
# public repositories in use. For an air-gapped host, back up and disable the defaults, then replace.
sudo cp /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak 2>/dev/null || true
sudo tee /etc/apt/sources.list.d/internal-mirror.list << 'EOF'
deb https://mirror.company.local/ubuntu noble main universe
deb https://mirror.company.local/ubuntu noble-updates main universe
deb https://mirror.company.local/ubuntu noble-security main universe
EOF
# To avoid using public sources alongside the mirror, disable the defaults (e.g. move ubuntu.sources to .bak).
sudo apt-get update   # verify all enabled sources resolve to the internal mirror
```

The private mirror is not needed only at upgrade time — it is the permanent supply path for OS security patches. Establish mirror sync cadence, GPG key management, and the mirror's own availability as an operational practice before planning the upgrade.

## Upgrade Runbook (Per Node)

| Step | Task | Verification |
|------|------|--------------|
| 0 | Confirm/update `nodeadm` 1.0.19+, check private mirror reachability | `nodeadm version`, `yum repolist`/`apt-get update` succeed |
| 1 | Confirm the control plane upgrade is complete | `aws eks describe-cluster --name <cluster-name> --region <region> --query cluster.version` (add `--profile <profile>` if needed) |
| 1b | Confirm the CNI/add-ons support the target Kubernetes version; if not, upgrade the CNI **before** upgrading nodes | Check the add-on version matrix, CNI supports the target version |
| 2 | Check Cluster Insights for upgrade-blocking issues | [Configuration validation](./operations-cost-optimization#configuration-validation-automation) |
| 3 | `kubectl cordon` + `kubectl drain` (one node at a time) | Pod relocation complete, no PDB violations |
| 4 | `sudo nodeadm upgrade <version> --config-source file://nodeConfig.yaml` | Exit code 0 |
| 5 | Confirm node Ready, version, and CNI Pod startup | `kubectl get node -o wide`, `kubectl get pods -n kube-system -o wide --field-selector spec.nodeName=<node>` |
| 6 | `kubectl uncordon`, then proceed to the next node | Workloads placed normally |
| 7 | After all nodes complete, verify add-ons (CoreDNS, kube-proxy, Cilium) are aligned with the target version (compatibility was already checked in step 1b) | Add-on version matrix matches the deployed versions |

- On upgrade failure, `nodeadm` can be retried by re-running the same command. For repeated failures, re-validate networking and credential requirements with `nodeadm debug`, and collect `journalctl -u kubelet` and the nodeadm logs under `/var/log/`.
- CNI versions such as Cilium follow the Kubernetes version compatibility matrix. Per the official prerequisites, the CNI **must support the target Kubernetes version, and if it does not you must upgrade the CNI before upgrading the hybrid nodes**. CNI compatibility checking and upgrade is therefore a prerequisite of the node upgrade (runbook step 1b), while the post-completion add-on alignment is a final verification step.

## Summary of Recommendations

- The upgrade order is control plane → nodes; proceed one node at a time through cordon → drain → upgrade → verify → uncordon.
- `nodeadm` does not perform drains — skipping the drain leads directly to workload loss, so fix it as a mandatory runbook step.
- For SSM environments, perform the `nodeadm` 1.0.19+ update as step 0 before upgrading.
- For air-gapped networks, pre-configure private mirrors/PrivateLink for all three paths: EKS artifacts, OS packages, and container images.
- Tune PDBs and grace periods to workload characteristics (GPU model unloading, etc.), and schedule the upgrade window during off-peak hours.

## References

### Official Documentation
- [Upgrade hybrid nodes for your cluster](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-upgrade.html) — nodeadm upgrade procedure and cordon/drain guidance
- [Update existing cluster to new Kubernetes version](https://docs.aws.amazon.com/eks/latest/userguide/update-cluster.html) — Control plane upgrade
- [aws/eks-hybrid Releases](https://github.com/aws/eks-hybrid/releases) — nodeadm release notes and per-version fixes

### Related Documents (Internal)
- [Node Authentication Methods](../security-authn/node-authentication) — The SSM signing key issue and nodeadm version requirement
- [Operations and Cost Optimization](./operations-cost-optimization) — Cluster Insights and nodeadm debug validation tools
- [Harbor Registry Integration](../storage-registry/harbor-registry) — Air-gapped container image mirror
- [Private Air-gapped VPC Endpoint Design](../networking/private-vpc-endpoints) — AWS service access without internet transit
