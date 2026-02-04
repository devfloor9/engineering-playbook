---
title: "SR-IOV Networking for DGX H200 with EKS Hybrid Nodes"
description: "Solving SR-IOV VF naming inconsistencies on NVIDIA DGX H200 systems running Amazon EKS Hybrid Nodes through driver compatibility, persistent naming, and systemd orchestration."
tags: [eks, hybrid-nodes, dgx-h200, sriov, infiniband, networking, mlnx-ofed]
category: "hybrid-multicloud"
date: 2025-02-04
authors: [devfloor9]
sidebar_position: 3
---

# SR-IOV Networking for DGX H200 with EKS Hybrid Nodes

## Introduction

When running high-performance computing workloads on NVIDIA DGX H200 systems with Amazon EKS Hybrid Nodes, network performance is critical. Our team recently encountered a challenging issue where SR-IOV Virtual Function (VF) interfaces were experiencing naming inconsistencies that broke our entire CNI stack. This post shares our journey to root cause analysis and the comprehensive solution we developed.

## Architecture Overview

*Figure 1: High-level architecture showing the integration between Amazon EKS Hybrid Nodes and on-premises DGX H200 cluster with SR-IOV networking. The diagram illustrates the complex interaction between AWS control plane, DGX hardware components (8x H200 GPUs, 8x 400G InfiniBand HCAs, BlueField-3 DPU), and the Kubernetes CNI stack including Cilium, Multus, and SR-IOV CNI plugins.*

The architecture above shows our deployment topology where Amazon EKS control plane manages on-premises DGX H200 nodes through the Hybrid Nodes feature. Each DGX node contains eight H200 GPUs and eight 400G InfiniBand HCAs (ConnectX-7), with SR-IOV configured to create 8 VFs per Physical Function. The challenge emerged in the interaction between the SR-IOV VFs and the Kubernetes CNI stack, particularly during pod scheduling and deployment.

## The Challenge: When VF Names Won't Stay Put

Picture this: You've deployed a cutting-edge DGX H200 cluster with 8x 400G InfiniBand HCAs, integrated it with Amazon EKS Hybrid Nodes, and everything seems ready for your ML workloads. Then, pods start failing to deploy. The culprit? SR-IOV VF interfaces that change names unpredictably during pod deployment.

Our environment consisted of:

- **Hardware**: NVIDIA DGX H200 (8-GPU system) with 8x 400G InfiniBand HCAs + 1x 200G BlueField-3
- **Software Stack**: Ubuntu 24.04, Kernel 6.8.0-55-generic, Amazon EKS Hybrid Nodes
- **Networking**: Cilium v1.17.x (primary CNI) with Multus + SR-IOV CNI for secondary networks

The symptoms were frustrating:

- VF interface names changed randomly after pod deployment
- CNI and Device Plugin bindings failed consistently
- Some ports mysteriously fell back to Ethernet mode
- SR-IOV VFs occasionally showed PORT_DOWN status

## Discovery: The Hidden Driver Incompatibility

After days of debugging, we discovered the root cause: **MLNX_OFED 25.01 was fundamentally incompatible with kernel 6.8.0**. This wasn't immediately obvious because the driver appeared to load, but critical kernel API changes had broken its functionality:

```bash
# What we were seeing in dmesg (truncated for clarity)
[  123.456789] mlx5_core: Unknown symbol strlcpy (err -2)
[  123.456790] mlx5_core: probe of 0000:18:00.2 failed with error -2
```

The kernel 6.8.0 had removed several functions that MLNX_OFED 25.01 depended on, including `strlcpy` and `xdp_do_flush_map`. This incompatibility cascaded into unpredictable VF probe sequences and naming assignments.

## The Three-Layer Solution

We developed a comprehensive three-layer approach to solve this challenge:

### Layer 1: Fixing the Foundation - Driver Upgrade

First, we needed to address the driver incompatibility:

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
The `--add-kernel-support` flag is crucial for custom kernels. It rebuilds the driver modules specifically for your kernel version.
:::

### Layer 2: Implementing Persistent Naming with systemd.link

Next, we created systemd.link files to ensure consistent VF naming based on PCI addresses:

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

These files ensure that VFs get predictable names based on their physical attributes rather than probe order.

### Layer 3: Orchestrating VF Creation with systemd

Finally, we created a systemd service to handle VF creation with proper timing and GUID assignment:

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

This service ensures VFs are created before kubelet starts and assigns unique GUIDs to prevent the dreaded `0x000000` GUID issue.

## Integrating with Amazon EKS Hybrid Nodes

Amazon EKS Hybrid Nodes requires special consideration for SR-IOV workloads. Here's our working NVIDIA Network Operator configuration:

```yaml
# values.yaml for Network Operator Helm chart
deployCR: true
deployGPUOperator: false

nfd:
  enabled: true
  deployNodeFeatureRules: true

sriovNetworkOperator:
  enabled: true

ofedDriver:
  deploy: false  # Use system MLNX_OFED instead

rdmaSharedDevicePlugin:
  deploy: true
  resources:
    - name: dgx_h200_ib
      vendors: [15b3]
      deviceIDs: [1017,1018,101b,101c]
      ifNames: [mlx-*]

multus:
  deploy: false  # Already deployed with Cilium

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

For Amazon EKS Hybrid Nodes, we also created a specific NetworkNodePolicy:

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

## Preventing the InfiniBand to Ethernet Fallback

One particularly puzzling issue was ports randomly falling back to Ethernet mode. This occurred due to firmware mismatches between the ConnectX-7 adapters and the driver expectations.

### The Fix: Firmware Update and Configuration

```bash
# Check current firmware versions
sudo mlxfwmanager --query

# Update firmware for ConnectX-7 (adjust PCI addresses as needed)
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

1. **Always verify driver-kernel compatibility**: Even if a driver loads successfully, API incompatibilities can cause subtle, hard-to-debug issues.
2. **Layer your solutions**: A single approach rarely solves complex networking issues. Our three-layer solution addresses different aspects of the problem.
3. **GUID assignment matters**: Zero GUIDs (`0x000000`) will cause VF identification failures. Always assign unique GUIDs programmatically.
4. **Timing is everything**: The order of operations (driver load → VF creation → GUID assignment → udev processing → kubelet start) is critical.
5. **Test firmware updates in staging**: Firmware mismatches can cause protocol fallbacks that are difficult to diagnose.

## Monitoring and Validation

After implementation, monitor these key metrics:

```bash
# Verify VF naming consistency
ip link show | grep -E "mlx-|sriov-" | wc -l

# Check for PORT_DOWN issues
ibstat | grep -c "State: Active"

# Validate GUID assignments
for i in {0..7}; do
  cat /sys/class/infiniband/mlx5_${i}/ports/1/gids/0
done | grep -c "0000:0000:0000:0000"  # Should be 0

# Monitor SR-IOV resource allocation in Kubernetes
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## Conclusion

Solving SR-IOV VF naming inconsistencies on DGX H200 systems running Amazon EKS Hybrid Nodes required deep investigation into driver compatibility, systemd networking, and Kubernetes CNI interactions. The key insight was recognizing that seemingly unrelated symptoms (naming changes, protocol fallbacks, PORT_DOWN states) all stemmed from a fundamental driver-kernel incompatibility.

Our three-layer solution—fixing the driver, implementing persistent naming, and orchestrating VF creation—has proven stable across multiple DGX H200 deployments. While the journey was challenging, the result is a robust, production-ready configuration for high-performance networking in hybrid cloud environments.

### Architecture Diagram Note

*The architecture diagram in this post was created using AWS diagram standards. To use the diagram in your documentation, you can export the HTML/SVG visualization as a PNG image or recreate it in draw.io using AWS Architecture Icons. The diagram is also available in the companion GitHub repository for this article.*

## References

1. NVIDIA Developer Forums - 6.8 Kernel Breaking Changes on Mellanox OFED 5.8
2. NVIDIA Linux InfiniBand Drivers Documentation
3. systemd Predictable Network Interface Names
4. Amazon EKS Hybrid Nodes Overview
5. AWS Blog - A Deep Dive into Amazon EKS Hybrid Nodes
6. Red Hat Enterprise Linux - Consistent Network Interface Device Naming
7. NVIDIA Mellanox OFED Installation Guide
8. NVIDIA Firmware Support and Downloads
9. systemd.link Manual Page
10. Kubernetes SR-IOV Network Device Plugin
11. SR-IOV CNI Plugin Documentation
12. NVIDIA SR-IOV Configuration Guide
13. systemd Network Naming Scheme
14. NVIDIA InfiniBand Troubleshooting Guide
15. Medium - SRIOV on Mellanox ConnectX-6 InfiniBand: Struggles & Learnings
