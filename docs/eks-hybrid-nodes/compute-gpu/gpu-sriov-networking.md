---
title: Hybrid GPU Workloads and SR-IOV Networking
description: A hands-on guide to using on-premises GPU nodes as the primary inference tier on EKS Hybrid Nodes, and resolving DGX H200 SR-IOV VF name inconsistency through driver compatibility, persistent naming, and systemd orchestration
created: "2025-09-01"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 32
tags:
  - eks
  - hybrid-node
  - dgx-h200
  - sriov
  - infiniband
  - networking
  - mlnx-ofed
  - gpu
  - scope:impl
sidebar_label: GPU & SR-IOV
category: hybrid-multicloud
---

## Overview

This document covers GPU workload architecture and high-performance networking configuration for EKS Hybrid Nodes. The first half describes a 3-tier architecture that uses existing GPU assets as the primary inference tier. The second half provides a root cause analysis and resolution, based on a real-world case, for the problem where SR-IOV VF (Virtual Function) interface names change on every reboot on NVIDIA DGX H200 systems, breaking the CNI stack.

## Hybrid GPU Workload Architecture

Registering existing GPU servers (such as DGX systems) as hybrid nodes allows fixed-cost assets to serve as the primary inference tier, combined with cloud GPUs (Spot) and Amazon Bedrock as burst and fallback tiers.

**Table 1. Infrastructure, cost, and role by three-tier hybrid inference tier**

| Tier | Infrastructure | Cost Structure | Role |
|------|--------|---------|------|
| 1 | On-Prem Hybrid Node (DGX) | Fixed cost (already owned) | Baseline traffic (always active) |
| 2 | Cloud GPU (EKS Spot/OD) | Hourly variable cost | Peak burst |
| 3 | Amazon Bedrock | Pay-per-token | Failure/overload fallback |

GPU nodes are registered with `--node-labels=node-type=hybrid,gpu=h100` and the `nvidia.com/gpu` taint, and resources are exposed via the NVIDIA device plugin or GPU Operator. Workloads are placed separately on-premises (baseline inference) and in the cloud (burst) using nodeSelector, and cross-tier fallback is configured with cascade routing at the gateway level (Bifrost, etc.).

:::warning Hybrid Inference Network Considerations
- **Latency**: Traffic traversing VPN/DX adds round-trip latency compared to cloud nodes — this must be reflected in gateway routing policies
- **Distributed inference constraints**: Multi-node NCCL communication requires high bandwidth — Pipeline Parallelism within on-premises is feasible, but PP across on-premises and cloud is not recommended
- **Recommended pattern**: On-premises nodes serve independent models, connected to the cloud only through gateway-level cascade routing
:::

For gateway-level fallback and observability, see [Agent Monitoring & Operations](../../agentic-ai-platform/operations-mlops/observability/agent-monitoring). For GPU resource management (including DRA), see [GPU Resource Management](../../agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management).

The remainder of this document covers InfiniBand and SR-IOV based high-performance GPU networking configuration through a real-world DGX H200 case.

## Architecture Overview

The Amazon EKS control plane manages on-premises DGX H200 nodes through the Hybrid Nodes feature. Per the NVIDIA DGX H100/H200 User Guide, each DGX node contains 8 H200 GPUs, **8 single-port ConnectX-7 InfiniBand cards** for the cluster fabric (exposed through 4 OSFP ports), and **2 dual-port ConnectX-7 Ethernet cards** for storage and in-band management. This guide covers using SR-IOV on the 8 InfiniBand cluster-fabric ports, configured to create 8 VFs per Physical Function. The actual adapter layout and PCI addresses vary by environment, so verify them up front with `lspci`, `ibstat`, and `mlxfwmanager --query`. The problem arises from the interaction between SR-IOV VFs and the Kubernetes CNI stack (Cilium, Multus, SR-IOV CNI plugin).

## Problem: VF Name Inconsistency

When the DGX H200 cluster (8 single-port ConnectX-7 400G InfiniBand ports on the cluster fabric) was integrated with Amazon EKS Hybrid Nodes and ready to run ML workloads, pods began failing to deploy. The cause was SR-IOV VF interfaces changing names unpredictably during pod deployment.

Environment configuration:

- **Hardware**: NVIDIA DGX H200 (8-GPU system). Per the NVIDIA DGX H100/H200 User Guide, the network adapters consist of 8 single-port ConnectX-7 InfiniBand cards for the cluster fabric (4 OSFP ports) and 2 dual-port ConnectX-7 Ethernet cards for storage and in-band management. The SR-IOV configuration in this case targets the InfiniBand cluster-fabric ports. BlueField-3 DPUs are not part of this base DGX configuration; they are a separate option used mainly in SuperPOD environments and have their own DOCA/firmware requirements.
- **Software stack**: Ubuntu 24.04, Kernel 6.8.0-55-generic, Amazon EKS Hybrid Nodes
- **Networking**: Cilium v1.17.x (primary CNI), Multus + SR-IOV CNI (secondary networks)

Symptoms:

- VF interface names changed randomly after pod deployment
- CNI and Device Plugin binding failed consistently
- Some ports fell back to Ethernet mode
- SR-IOV VFs intermittently displayed PORT_DOWN state

## Root Cause Analysis: Driver Compatibility Issue

After several days of debugging, the root cause was identified. **MLNX_OFED 25.01 was fundamentally incompatible with kernel 6.8.0.** It was not immediately obvious because the driver appeared to load, but critical kernel API changes had broken its functionality.

```bash
# Observed in dmesg (abbreviated)
[  123.456789] mlx5_core: Unknown symbol strlcpy (err -2)
[  123.456790] mlx5_core: probe of 0000:18:00.2 failed with error -2
```

Kernel 6.8.0 removed several functions that MLNX_OFED 25.01 depends on (`strlcpy`, `xdp_do_flush_map`, etc.). This incompatibility led to unpredictable VF probe sequences and naming assignments.

## Three-Layer Solution

A comprehensive three-layer approach was developed to resolve this problem.

### Layer 1: Foundation Fix - Driver Upgrade

First, resolve the driver incompatibility. Because this procedure removes and replaces the active InfiniBand driver, run it as a controlled maintenance operation in the order **drain the node → secure console (BMC/IPMI) access → back up the existing driver and configuration → apply → verify**. If you proceed over SSH alone, you can lose network access to the node at the moment the driver is removed and be unable to reach it again. The OFED/kernel versions, PCI addresses, and filenames below are examples; replace them with the target node's actual values and a supported combination from the MLNX_OFED release notes OS/kernel matrix.

:::danger Risk of service disruption and unrecoverable access loss
`ofed_uninstall.sh --force` removes the currently loaded network driver without dependency checks, which can cut off remote access. Before running it: (1) drain workloads with `kubectl drain`, (2) secure out-of-band console access such as BMC/IPMI, (3) back up the current driver version, `/etc/opensm`, systemd configuration, and firmware settings, and (4) prepare a rollback plan you can fall back to on failure (keep the previous OFED package and a reinstall procedure).
:::

```bash
# 0) Preparation (controlled maintenance)
#   - kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
#   - Confirm BMC/IPMI console access
#   - Back up current state: ofed_info -s, uname -r, cp -a /etc/opensm /root/opensm.bak, etc.

# 1) First confirm a supported combination for the node's OS/kernel in the MLNX_OFED release notes
#    (the versions and filename below are examples; replace with the real support matrix)

# 2) (Destructive) Remove the incompatible driver — only after console access is secured
sudo ofed_uninstall.sh --force

# 3) Install an MLNX_OFED release that supports the target kernel (example version)
wget https://content.mellanox.com/ofed/MLNX_OFED-24.10-0.7.0.0/MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
tar -xzf MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
cd MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64
sudo ./mlnxofedinstall --without-fw-update

# 4) Update initramfs, reboot, then verify the driver and link state with ofed_info -s / ibstat
sudo update-initramfs -u
```

:::tip Note on kernel-support builds
`--add-kernel-support` rebuilds the modules against a specific kernel when no prebuilt package matches the distribution's default kernel. On Ubuntu, a DKMS-based install is sometimes recommended, so before adding the flag, check the MLNX_OFED installation documentation for your target OS (DKMS vs `--add-kernel-support`) and follow that guidance.
:::

### Layer 2: Persistent Naming with systemd.link

Create systemd.link files that guarantee consistent VF names based on stable physical attributes such as the PCI path. Before writing them, note the systemd.link constraints. Interface names must be **1–15 characters** and may not contain control characters or `:`, `/`, `%`. Brace substitutions like `{attr/...}` are **not** systemd.link syntax; they are treated as a **literal string** (and the `/` makes the name invalid), so do not use them. Also, `Name=` has lower precedence than `NamePolicy=`: if a `NamePolicy=` succeeds (for example, `keep` preserves an already-assigned userspace name), `Name=` does not take effect.

The example below matches on udev properties observed on the node and then assigns an explicit, fixed name. Adjust the match properties (such as `ID_NET_NAME_SLOT`) and the name prefix/digits using the real properties from `udevadm info /sys/class/net/<iface>`, and design the names so they stay within the 15-character limit given the number of VFs.

```bash
# Match each VF on observed udev properties and assign a fixed name (one .link file per device recommended)
# Always derive the match conditions and names from actual 'udevadm info' output
cat > /etc/systemd/network/10-dgx-ib-vf0.link << 'EOF'
[Match]
# Example: replace with a unique property from the node's udevadm info output
Path=pci-0000:18:00.0
Driver=mlx5_core

[Link]
# 1-15 chars; '/', ':', '%' and control chars are not allowed. No NamePolicy so that Name= applies
Name=ibvf0
AlternativeName=k8s-ib-vf0
MACAddressPolicy=persistent
EOF
```

After applying, run `udevadm control --reload` and `udevadm test-builtin net_setup_link /sys/class/net/<iface>` to confirm the naming policy is evaluated as intended, and verify that **the names remain identical before and after a reboot**.

### Layer 3: VF Creation Orchestration with systemd

Create a systemd service that handles VF creation with proper timing and GUID assignment. The unit below reflects several important design principles.

- **Treat the target PF set and the VF index separately.** Define the list of PFs on which VFs are created (`PFS`) apart from the loop that iterates VFs under each PF. Flattening with `for i in {0..63}; vf=$((i/8))` (as in the earlier example) references only `mlx5_0..7` and diverges from the actual PF set.
- **Write GUID files per PF and per VF.** VF GUIDs are written to `/sys/class/infiniband/<PF>/device/sriov/<vf>/node` and `.../<vf>/port` (the exact path can differ by device/driver, so confirm the real sysfs tree before applying). Do not conflate the port index with the VF index.
- **Fail immediately on any write error.** Use `set -e` and explicit checks so that a failed write is not silently ignored.
- **GUIDs must be unique fabric-wide.** Applying the simple arithmetic formula below unchanged across multiple DGX hosts duplicates GUIDs between hosts. Include a host identifier (such as a chassis serial or node index) in the prefix, or allocate centrally, to guarantee **fabric-wide uniqueness**.
- **A kubelet dependency needs more than ordering.** `Before=kubelet.service` only orders startup; it does not prevent kubelet from starting if this service fails. Add `After=` and `Requires=` (or `BindsTo=`) on the kubelet unit so that kubelet does not start when VF setup fails.
- **`enable` does not initialize the current session.** `systemctl enable` only activates the unit at boot, so to apply it now, run `systemctl start`, check the result (`systemctl status`, the journal), and then verify the boot path with a reboot.

The PF list, GUID formula, and sysfs paths below are examples; replace them with the real values on the target node.

```bash
cat > /etc/systemd/system/dgx-sriov-setup.service << 'EOF'
[Unit]
Description=DGX H200 SR-IOV VF Setup
After=network-pre.target
# Add 'After=dgx-sriov-setup.service' and 'Requires=dgx-sriov-setup.service' to the kubelet unit
# (as a drop-in) so kubelet does not start if this service fails; ordering-only Before= is insufficient.

[Service]
Type=oneshot
RemainAfterExit=yes
# Replace the PF set with the real values confirmed via 'ibstat' / 'ls /sys/class/infiniband' on the node
Environment=PFS="mlx5_0 mlx5_1 mlx5_2 mlx5_3 mlx5_4 mlx5_5 mlx5_6 mlx5_7"
Environment=HOSTID=00  # host identifier for fabric-wide uniqueness (replace with a real value)
ExecStart=/bin/bash -euo pipefail -c '\
  for pf in $PFS; do \
    echo 8 > /sys/class/infiniband/$pf/device/sriov_numvfs; \
    sleep 0.5; \
  done'
ExecStart=/usr/bin/udevadm settle --timeout=30
ExecStart=/bin/bash -euo pipefail -c '\
  idx=0; \
  for pf in $PFS; do \
    for vf in 0 1 2 3 4 5 6 7; do \
      base=/sys/class/infiniband/$pf/device/sriov/$vf; \
      [ -e "$base/node" ] || { echo "missing $base/node" >&2; exit 1; }; \
      printf "00:11:22:%s:%02x:1\n" "$HOSTID" "$idx" > "$base/node"; \
      printf "00:11:22:%s:%02x:2\n" "$HOSTID" "$idx" > "$base/port"; \
      idx=$((idx+1)); \
    done; \
  done'
TimeoutSec=60

[Install]
WantedBy=multi-user.target
EOF

# Apply now and check the result (enable alone does not configure the current session)
sudo systemctl enable --now dgx-sriov-setup.service
systemctl status dgx-sriov-setup.service
```

This service aims to create VFs and assign unique GUIDs to avoid the `0x000000` GUID problem. To actually guarantee that it "completes before kubelet," however, apply the kubelet-side `Requires=`/`After=` dependency and the write-failure handling described above, and after applying, verify the VF count and GUIDs on both `systemctl start` and a reboot.

## Amazon EKS Hybrid Nodes Integration

:::warning Support scope (read first)
This configuration is **not an AWS-supported combination.** Per AWS documentation, Multus is only supported when the Amazon VPC CNI is the primary CNI ([Attach multiple network interfaces to Pods with Multus](https://docs.aws.amazon.com/eks/latest/userguide/pod-multus.html)), and the VPC CNI is not compatible with EKS Hybrid Nodes (the VPC CNI is configured with anti-affinity for the `eks.amazonaws.com/compute-type: hybrid` label, and Cilium is the AWS-supported CNI for Hybrid Nodes — [Configure CNI for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-cni.html)). AWS also does not build or publish the SR-IOV or DPDK CNI plugins. The Cilium + Multus + SR-IOV combination below is therefore a **configuration you own and must validate and operate yourself**; it does not imply an AWS-validated deployment or AWS support.
:::

The following is a reference NVIDIA Network Operator configuration. These values are **a starting point, not a complete configuration validated against a specific chart version**, so before applying them, pin the Network Operator chart/CRD version you used and validate each value against that version's official `values.yaml` and the `sriov-network-device-plugin` documentation. In particular, confirm the following.

- Top-level keys such as `deployCR` and operand configuration keys exist and are named differently across chart versions. Confirm each key actually exists in the version you use.
- Do not mix string and numeric notation in `deviceIDs`/`vendors`; use the form the plugin documentation requires.
- `pfNames` is an **exact physical-interface selector**, not a wildcard pattern. Use the real PF names confirmed on the node (and a VF range suffix if needed), not an arbitrary `mlx-*` wildcard.
- Assign a single owner for the VF lifecycle (creation and GUID assignment). If the systemd service above creates the VFs, configure the Operator so it does not duplicate the same work.
- This example alone does not complete the SR-IOV attachment. Attaching a VF to a pod additionally requires a matching `NicClusterPolicy`/`NetworkAttachmentDefinition` and workload manifest.

```yaml
# values.yaml for the Network Operator Helm chart
deployCR: true
deployGPUOperator: false

nfd:
  enabled: true
  deployNodeFeatureRules: true

sriovNetworkOperator:
  enabled: true

ofedDriver:
  deploy: false  # Use the system MLNX_OFED

rdmaSharedDevicePlugin:
  deploy: true
  resources:
    - name: dgx_h200_ib
      vendors: [15b3]
      deviceIDs: [1017,1018,101b,101c]
      ifNames: [mlx-*]

multus:
  deploy: false  # Already deployed alongside Cilium

sriovDevicePlugin:
  deploy: true
  config: |
    {
      "resourceList": [{
        "resourceName": "dgx_h200_vfs",
        "selectors": {
          "vendors": ["15b3"],
          "devices": ["101c"],
          "pfNames": ["mlx-*"],
          "isRdma": true
        }
      }]
    }
```

The support-scope warning above applies equally to this manifest. The `SriovNetworkNodePolicy` below is an example: replace `pfNames` with the real PF names confirmed on the node (adding a `#` VF range if needed) rather than a wildcard, and make the `instance-type` label value match the node's actual label.

```yaml
apiVersion: sriovnetwork.openshift.io/v1
kind: SriovNetworkNodePolicy
metadata:
  name: dgx-h200-hybrid-policy
spec:
  nodeSelector:
    node.kubernetes.io/instance-type: "dgx-h200"
    eks.amazonaws.com/compute-type: "hybrid"
  resourceName: dgx_h200_vfs
  deviceType: netdevice
  mtu: 9000
  numVfs: 8
  nicSelector:
    vendor: "15b3"
    pfNames: ["mlx-pf0", "mlx-pf1", "mlx-pf2", "mlx-pf3"]
  linkType: ib
  isRdma: true
```

## Preventing InfiniBand-to-Ethernet Fallback

A particularly puzzling issue was ports randomly falling back to Ethernet mode. This was caused by a firmware mismatch between the ConnectX-7 adapters and driver expectations.

### Resolution: Review firmware and link settings {#resolution-firmware-update-and-configuration}

:::danger Fabric impact and recovery risk
The commands below change NIC firmware **settings (mlxconfig)** and the subnet manager (OpenSM) configuration. This is different from updating the firmware image itself. Setting changes generally take effect only after a reboot or power cycle, and overwriting the OpenSM configuration can wipe existing fabric-manager settings and affect the entire fabric. Before running them: (1) back up the current `mlxconfig -d <dev> q` output and `/etc/opensm/opensm.conf`, (2) confirm which entity owns the subnet manager for the fabric (this host, or an external management node), and (3) decide the apply/reboot timing and rollback procedure in advance. PCI addresses and port counts (single vs dual) vary per adapter, so inventory the real devices first with `lspci`/`mlxconfig`.
:::

```bash
# 1) Check the current firmware image version (to decide whether an image update is needed)
sudo mlxfwmanager --query

# 2) Back up current settings before changing anything
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  sudo mlxconfig -d $dev q > /root/mlxconfig-$dev.bak
done
sudo cp -a /etc/opensm/opensm.conf /root/opensm.conf.bak 2>/dev/null || true

# 3) (Settings change, not a firmware image update) Set InfiniBand mode and enable SR-IOV
#    - Single-port adapters may not have LINK_TYPE_P2, so adjust to the port count
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  sudo mlxconfig -d $dev set LINK_TYPE_P1=1
  sudo mlxconfig -d $dev set SRIOV_EN=1 NUM_OF_VFS=8
done
# mlxconfig changes take effect after a reboot/power cycle.

# 4) OpenSM virtualization support: only if this host owns the subnet manager, and add it
#    while preserving existing settings (merge only the needed keys via a drop-in; do not overwrite)
sudo install -m 0644 /dev/stdin /etc/opensm/opensm.conf.d/10-virt.conf << 'EOF'
# Virtualization support (added as a drop-in, not overwriting opensm.conf)
virt_enabled 2
virt_max_ports_in_process 256
virt_default_hop_limit 64
EOF

sudo systemctl restart opensm
```

:::warning Critical
The "General Support" section of the MLNX_OFED 24.10 release notes lists specific adapter firmware versions as **bundled/tested-with versions**, not an absolute minimum requirement that applies to every environment. The same document states that **BlueField-2 and ConnectX-7 are the last generation supported by MLNX_OFED**, so BlueField-3 is not within this MLNX_OFED generation's support scope (BlueField-3 follows a separate DOCA release and firmware track). Therefore, do not assert fixed values like "ConnectX-7 requires 28.43.1014 or later and BlueField-3 requires 32.43.1014"; instead, check the official firmware matrix that corresponds to your adapter's PSID and the driver release you run. The version numbers in the example are for reference and must be replaced with the actual supported combination for your environment.
:::

## Lessons Learned

1. **Always verify driver-kernel compatibility**: Even when a driver loads successfully, API incompatibilities can cause subtle problems that are difficult to debug.
2. **Layer the solution**: A single approach rarely solves complex networking problems. The three-layer solution addresses different aspects of the problem.
3. **GUID assignment matters**: Zero GUIDs (`0x000000`) cause VF identification failures. Always assign unique GUIDs programmatically.
4. **Timing is everything**: The order of operations (driver load → VF creation → GUID assignment → udev processing → kubelet start) is critical.
5. **Test firmware updates in a staging environment**: Firmware mismatches can cause protocol fallbacks that are difficult to diagnose.

## Monitoring and Validation

After implementation, monitor the following key metrics.

```bash
# Verify VF naming consistency
ip link show | grep -E "mlx-|sriov-" | wc -l

# Check for PORT_DOWN issues
ibstat | grep -c "State: Active"

# Validate GUID assignment
# Note: ports/1/gids/0 is the PF's GID (index 0), not a per-VF GUID. A GID is an IPv6-format
# 128-bit value whose prefix can legitimately contain "0000:0000:...", so grep -c on that
# substring cannot determine a "zero GUID". Instead, read each configured VF's node/port GUID
# file directly and check that it is (1) nonzero and (2) unique fabric-wide. Set PFS as above.
PFS="mlx5_0 mlx5_1 mlx5_2 mlx5_3 mlx5_4 mlx5_5 mlx5_6 mlx5_7"
for pf in $PFS; do
  for vf in 0 1 2 3 4 5 6 7; do
    base=/sys/class/infiniband/$pf/device/sriov/$vf
    node=$(cat "$base/node" 2>/dev/null)
    echo "$pf vf$vf node=$node"
    case "$node" in ""|00:00:00:00:00:00:00:00)
      echo "  !! zero/empty GUID on $pf vf$vf" >&2 ;;
    esac
  done
done
# Fabric-wide uniqueness: the node values above must have no duplicates
# (collect GUIDs from all hosts and confirm 'sort | uniq -d' is empty)

# Check port/link state separately from GUID validation
ibstat | grep -E "State:|Port GUID:"

# Monitor SR-IOV resource allocation in Kubernetes
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## Conclusion

Resolving SR-IOV VF naming inconsistency on DGX H200 systems running Amazon EKS Hybrid Nodes required a deep investigation into driver compatibility, systemd networking, and Kubernetes CNI interactions. The key insight was recognizing that seemingly unrelated symptoms (name changes, protocol fallback, PORT_DOWN state) all stemmed from an underlying driver-kernel incompatibility.

The configuration combines three actions: correcting the driver, assigning VF names that persist across reboots, and controlling VF creation. After applying it, check that the names remain consistent after a reboot and Pod redeployment, then inspect PORT_DOWN status and GUID assignment with the commands above.

## References

### Official Documentation
- [NVIDIA Linux InfiniBand Drivers Documentation](https://networking-docs.nvidia.com/mlnxofedswum/24.10-5.1.6.1lts) — Official MLNX_OFED documentation
- [systemd Predictable Network Interface Names](https://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames/) — systemd predictable network interface naming
- [Amazon EKS Hybrid Nodes Overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Official EKS Hybrid Nodes guide
- [systemd.link Manual Page](https://www.freedesktop.org/software/systemd/man/systemd.link.html) — systemd.link manual
- [Kubernetes SR-IOV Network Device Plugin](https://github.com/k8snetworkplumbingwg/sriov-network-device-plugin) — SR-IOV Device Plugin repository
- [SR-IOV CNI Plugin Documentation](https://github.com/k8snetworkplumbingwg/sriov-cni) — SR-IOV CNI plugin documentation
- [NVIDIA SR-IOV Configuration Guide](https://networking-docs.nvidia.com/mlnxofedswum/24.10-5.1.6.1lts/single-root-io-virtualization-sr-iov) — NVIDIA SR-IOV configuration guide
- [NVIDIA Firmware Support and Downloads](https://network.nvidia.com/support/firmware/firmware-downloads/) — NVIDIA firmware downloads

### Technical Blogs
- [AWS Blog: A Deep Dive into Amazon EKS Hybrid Nodes](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — In-depth EKS Hybrid Nodes guide
- Medium: SRIOV on Mellanox ConnectX-6 InfiniBand — Struggles & Learnings — Hands-on ConnectX SR-IOV experience
- NVIDIA Developer Forums: 6.8 Kernel Breaking Changes on Mellanox OFED 5.8 — Discussion of kernel 6.8 compatibility issues
- Red Hat Enterprise Linux: Consistent Network Interface Device Naming — RHEL network naming guide

### Related Documents (Internal)
- [Hybrid Nodes Overview](../overview-architecture/hybrid-nodes-fundamentals.md) — Concepts, operating principles, and registration workflow
- [Building a Hybrid Nodes Gateway](../networking/hybrid-nodes-gateway.md) — VPN, DX, and gateway configuration and operations
