---
title: Hybrid GPU Workloads and SR-IOV Networking
description: A hands-on guide to using on-premises GPU nodes as the primary inference tier on EKS Hybrid Nodes, and resolving DGX H200 SR-IOV VF name inconsistency through driver compatibility, persistent naming, and systemd orchestration
created: "2025-09-01"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 7
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

The Amazon EKS control plane manages on-premises DGX H200 nodes through the Hybrid Nodes feature. Each DGX node contains 8 H200 GPUs and 8 400G InfiniBand HCAs (ConnectX-7), and SR-IOV is configured to create 8 VFs per Physical Function. The problem arises from the interaction between SR-IOV VFs and the Kubernetes CNI stack (Cilium, Multus, SR-IOV CNI plugin).

## Problem: VF Name Inconsistency

When the DGX H200 cluster (8x 400G InfiniBand HCA) was integrated with Amazon EKS Hybrid Nodes and ready to run ML workloads, pods began failing to deploy. The cause was SR-IOV VF interfaces changing names unpredictably during pod deployment.

Environment configuration:

- **Hardware**: NVIDIA DGX H200 (8-GPU system), 2x dual-port ConnectX-7 (400G InfiniBand HCA). BlueField-3 DPUs are an optional configuration, primarily used in SuperPOD environments.
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

First, resolve the driver incompatibility.

```bash
# Remove the incompatible driver
sudo ofed_uninstall.sh --force

# Install MLNX_OFED 24.10 with kernel 6.8.0 support
wget https://content.mellanox.com/ofed/MLNX_OFED-24.10-0.7.0.0/MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
tar -xzf MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
cd MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64
sudo ./mlnxofedinstall --add-kernel-support --without-fw-update
```

:::tip Pro tip
The `--add-kernel-support` flag is required for custom kernels. It rebuilds the driver modules against the specific kernel version.
:::

### Layer 2: Persistent Naming with systemd.link

Create systemd.link files that guarantee consistent VF names based on PCI addresses.

```bash
# Create the main VF naming policy
cat > /etc/systemd/network/70-dgx-sriov-vf.link << 'EOF'
[Match]
Driver=mlx5_core
Property=DEVTYPE=vf

[Link]
Name=mlx-{attr/phys_port_name}
AlternativeName=k8s-vf-{attr/dev_port}
MACAddressPolicy=persistent
EOF

# Add PCI-based fallback naming
cat > /etc/systemd/network/71-dgx-pci-vf.link << 'EOF'
[Match]
Path=pci-0000:*:*.*
Driver=mlx5_core
Property=ID_NET_NAME_SLOT=*v*

[Link]
NamePolicy=keep
Name=sriov-{phys_port_name}
EOF
```

These files ensure that VFs receive predictable names based on physical attributes rather than probe order.

### Layer 3: VF Creation Orchestration with systemd

Create a systemd service that handles VF creation with proper timing and GUID assignment.

```bash
cat > /etc/systemd/system/dgx-sriov-setup.service << 'EOF'
[Unit]
Description=DGX H200 SR-IOV VF Setup
After=network-pre.target
Before=kubelet.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/bash -c 'for i in 0 3 4 5 6 9 10 11; do \
  echo 8 > /sys/class/infiniband/mlx5_${i}/device/sriov_numvfs; \
  sleep 0.5; \
done'
ExecStart=/usr/bin/udevadm settle --timeout=30
ExecStart=/bin/bash -c 'for i in {0..63}; do \
  vf=$((i/8)); port=$((i%8)); \
  echo "00:11:22:33:44:${vf}${vf}:1:${port}" > \
    /sys/class/infiniband/mlx5_${vf}/device/sriov/${port}/node_guid; \
  echo "00:11:22:33:44:${vf}${vf}:2:${port}" > \
    /sys/class/infiniband/mlx5_${vf}/device/sriov/${port}/port_guid; \
done'
TimeoutSec=60

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable dgx-sriov-setup.service
```

This service ensures VFs are created before kubelet starts and assigns unique GUIDs to prevent the `0x000000` GUID problem.

## Amazon EKS Hybrid Nodes Integration

Amazon EKS Hybrid Nodes requires special considerations for SR-IOV workloads. The working NVIDIA Network Operator configuration is as follows.

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

A specific NetworkNodePolicy is also created for Amazon EKS Hybrid Nodes.

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

### Resolution: Firmware Update and Configuration

```bash
# Check the current firmware version
sudo mlxfwmanager --query

# Firmware update for ConnectX-7 (adjust PCI addresses to your environment)
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  # Force InfiniBand mode
  sudo mlxconfig -d $dev set LINK_TYPE_P1=1 LINK_TYPE_P2=1
  # Enable SR-IOV with 8 VFs
  sudo mlxconfig -d $dev set SRIOV_EN=1 NUM_OF_VFS=8
done

# Configure OpenSM for virtualization support
cat > /etc/opensm/opensm.conf << 'EOF'
# Enable virtualization support
virt_enabled 2
virt_max_ports_in_process 256
virt_default_hop_limit 64
EOF

sudo systemctl restart opensm
```

:::warning Critical
ConnectX-7 adapters require firmware version **28.43.1014 or later** for stable SR-IOV operation. BlueField-3 requires **v32.43.1014**.
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
for i in {0..7}; do
  cat /sys/class/infiniband/mlx5_${i}/ports/1/gids/0
done | grep -c "0000:0000:0000:0000"  # Should be 0

# Monitor SR-IOV resource allocation in Kubernetes
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## Conclusion

Resolving SR-IOV VF naming inconsistency on DGX H200 systems running Amazon EKS Hybrid Nodes required a deep investigation into driver compatibility, systemd networking, and Kubernetes CNI interactions. The key insight was recognizing that seemingly unrelated symptoms (name changes, protocol fallback, PORT_DOWN state) all stemmed from an underlying driver-kernel incompatibility.

The three-layer solution (driver fix, persistent naming, VF creation orchestration) has been validated as stable across multiple DGX H200 deployments. The journey was challenging, but the result is a robust, production-ready configuration for high-performance networking in hybrid cloud environments.

## References

### Official Documentation
- [NVIDIA Linux InfiniBand Drivers Documentation](https://docs.nvidia.com/networking/display/MLNXOFEDv24100000) — Official MLNX_OFED documentation
- [systemd Predictable Network Interface Names](https://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames/) — systemd predictable network interface naming
- [Amazon EKS Hybrid Nodes Overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Official EKS Hybrid Nodes guide
- [systemd.link Manual Page](https://www.freedesktop.org/software/systemd/man/systemd.link.html) — systemd.link manual
- [Kubernetes SR-IOV Network Device Plugin](https://github.com/k8snetworkplumbingwg/sriov-network-device-plugin) — SR-IOV Device Plugin repository
- [SR-IOV CNI Plugin Documentation](https://github.com/k8snetworkplumbingwg/sriov-cni) — SR-IOV CNI plugin documentation
- [NVIDIA SR-IOV Configuration Guide](https://docs.nvidia.com/networking/display/MLNXOFEDv24100000/SR-IOV) — NVIDIA SR-IOV configuration guide
- [NVIDIA Firmware Support and Downloads](https://network.nvidia.com/support/firmware/firmware-downloads/) — NVIDIA firmware downloads

### Technical Blogs
- [AWS Blog: A Deep Dive into Amazon EKS Hybrid Nodes](https://aws.amazon.com/blogs/containers/a-deep-dive-into-amazon-eks-hybrid-nodes/) — In-depth EKS Hybrid Nodes guide
- Medium: SRIOV on Mellanox ConnectX-6 InfiniBand — Struggles & Learnings — Hands-on ConnectX SR-IOV experience
- NVIDIA Developer Forums: 6.8 Kernel Breaking Changes on Mellanox OFED 5.8 — Discussion of kernel 6.8 compatibility issues
- Red Hat Enterprise Linux: Consistent Network Interface Device Naming — RHEL network naming guide

### Related Documents (Internal)
- [Hybrid Nodes Overview](../overview-architecture/hybrid-nodes-fundamentals.md) — Concepts, operating principles, and registration workflow
- [Building a Hybrid Nodes Gateway](../networking/hybrid-nodes-gateway.md) — VPN, DX, and gateway configuration and operations
