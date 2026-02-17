---
title: "DGX H200 SR-IOV 网络配置"
sidebar_label: "2. SR-IOV Networking"
description: "通过驱动兼容性修复、持久化命名和 systemd 编排，解决运行 Amazon EKS Hybrid Nodes 的 NVIDIA DGX H200 系统上的 SR-IOV VF 命名不匹配问题"
tags: [eks, hybrid-nodes, dgx-h200, sriov, infiniband, networking, mlnx-ofed]
category: "hybrid-multicloud"
sidebar_position: 2
last_update:
  date: 2026-02-14
  author: devfloor9
---

# DGX H200 SR-IOV 网络配置

> 📅 **撰写日期**: 2025-09-01 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 5 分钟


## 简介

在使用 Amazon EKS Hybrid Nodes 的 NVIDIA DGX H200 系统上运行高性能计算工作负载时，网络性能至关重要。我们团队最近遇到了一个棘手的问题：SR-IOV 虚拟功能 (VF) 接口出现不可预测的名称变化，导致整个 CNI 堆栈故障。本文档分享了根因分析的过程以及我们开发的综合解决方案。

## 架构概览

*图 1：高层架构图展示了 Amazon EKS Hybrid Nodes 与本地 DGX H200 集群之间使用 SR-IOV 网络的集成方式。该图说明了 AWS 控制平面、DGX 硬件组件（8x H200 GPU、8x 400G InfiniBand HCA、BlueField-3 DPU）以及 Kubernetes CNI 堆栈（包括 Cilium、Multus 和 SR-IOV CNI 插件）之间的复杂交互。*

上述架构展示了我们的部署拓扑，其中 Amazon EKS 控制平面通过 Hybrid Nodes 功能管理本地 DGX H200 节点。每个 DGX 节点包含 8 个 H200 GPU 和 8 个 400G InfiniBand HCA (ConnectX-7)，SR-IOV 配置为每个物理功能 (PF) 创建 8 个 VF。问题出现在 SR-IOV VF 与 Kubernetes CNI 堆栈之间的交互中，特别是在 Pod 调度和部署期间。

## 挑战：VF 名称不稳定问题

设想这样的场景：您部署了一个配备 8x 400G InfiniBand HCA 的尖端 DGX H200 集群，将其与 Amazon EKS Hybrid Nodes 集成，一切似乎准备就绪可以运行 ML 工作负载了。然而，Pod 开始部署失败。罪魁祸首是什么？SR-IOV VF 接口在 Pod 部署期间名称发生不可预测的变化。

我们的环境包括：

- **硬件**：NVIDIA DGX H200（8-GPU 系统），配备 8x 400G InfiniBand HCA + 1x 200G BlueField-3
- **软件栈**：Ubuntu 24.04、Kernel 6.8.0-55-generic、Amazon EKS Hybrid Nodes
- **网络**：Cilium v1.17.x（主 CNI），配合 Multus + SR-IOV CNI 用于辅助网络

症状令人困扰：

- VF 接口名称在 Pod 部署后随机变化
- CNI 和 Device Plugin 绑定持续失败
- 部分端口神秘地回退到 Ethernet 模式
- SR-IOV VF 偶尔显示 PORT_DOWN 状态

## 发现：隐藏的驱动不兼容性

经过数天的调试，我们发现了根本原因：**MLNX_OFED 25.01 与内核 6.8.0 存在根本性不兼容**。这并不是立即显现的，因为驱动似乎能正常加载，但关键的内核 API 变更破坏了其功能：

```bash
# 我们在 dmesg 中看到的信息（已截断）
[  123.456789] mlx5_core: Unknown symbol strlcpy (err -2)
[  123.456790] mlx5_core: probe of 0000:18:00.2 failed with error -2
```

内核 6.8.0 移除了 MLNX_OFED 25.01 所依赖的多个函数，包括 `strlcpy` 和 `xdp_do_flush_map`。这种不兼容性导致了不可预测的 VF 探测顺序和命名分配。

## 三层解决方案

我们开发了一个全面的三层方法来解决这个问题：

### 第一层：修复基础 - 驱动升级

首先，我们需要解决驱动不兼容性：

```bash
# 移除不兼容的驱动
sudo ofed_uninstall.sh --force

# 安装支持内核 6.8.0 的 MLNX_OFED 24.10
wget https://content.mellanox.com/ofed/MLNX_OFED-24.10-0.7.0.0/MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
tar -xzf MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64.tgz
cd MLNX_OFED_LINUX-24.10-0.7.0.0-ubuntu24.04-x86_64
sudo ./mlnxofedinstall --add-kernel-support --without-fw-update
```

:::tip 专业提示
`--add-kernel-support` 标志对自定义内核至关重要。它会专门为您的内核版本重新构建驱动模块。
:::

### 第二层：使用 systemd.link 实现持久化命名

接下来，我们创建了 systemd.link 文件，以确保基于 PCI 地址的一致 VF 命名：

```bash
# 创建主要 VF 命名策略
cat > /etc/systemd/network/70-dgx-sriov-vf.link << 'EOF'
[Match]
Driver=mlx5_core
Property=DEVTYPE=vf

[Link]
Name=mlx-{attr/phys_port_name}
AlternativeName=k8s-vf-{attr/dev_port}
MACAddressPolicy=persistent
EOF

# 添加基于 PCI 的回退命名
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

这些文件确保 VF 基于其物理属性而非探测顺序获取可预测的名称。

### 第三层：使用 systemd 编排 VF 创建

最后，我们创建了一个 systemd 服务来处理 VF 创建，确保正确的时序和 GUID 分配：

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

该服务确保 VF 在 kubelet 启动前创建，并分配唯一的 GUID 以防止出现令人头疼的 `0x000000` GUID 问题。

## 与 Amazon EKS Hybrid Nodes 集成

Amazon EKS Hybrid Nodes 对 SR-IOV 工作负载有特殊要求。以下是我们可用的 NVIDIA Network Operator 配置：

```yaml
# Network Operator Helm chart 的 values.yaml
deployCR: true
deployGPUOperator: false

nfd:
  enabled: true
  deployNodeFeatureRules: true

sriovNetworkOperator:
  enabled: true

ofedDriver:
  deploy: false  # 使用系统 MLNX_OFED

rdmaSharedDevicePlugin:
  deploy: true
  resources:
    - name: dgx_h200_ib
      vendors: [15b3]
      deviceIDs: [1017,1018,101b,101c]
      ifNames: [mlx-*]

multus:
  deploy: false  # 已随 Cilium 部署

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

针对 Amazon EKS Hybrid Nodes，我们还创建了一个特定的 NetworkNodePolicy：

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

## 防止 InfiniBand 回退到 Ethernet

一个特别令人困惑的问题是端口随机回退到 Ethernet 模式。这是由于 ConnectX-7 适配器的固件版本与驱动预期之间不匹配造成的。

### 修复方案：固件更新与配置

```bash
# 检查当前固件版本
sudo mlxfwmanager --query

# 更新 ConnectX-7 固件（根据需要调整 PCI 地址）
for dev in 18:00.0 9a:00.0 ce:00.0 c0:00.0; do
  # 强制 InfiniBand 模式
  sudo mlxconfig -d $dev set LINK_TYPE_P1=1 LINK_TYPE_P2=1
  # 启用 SR-IOV 并设置 8 个 VF
  sudo mlxconfig -d $dev set SRIOV_EN=1 NUM_OF_VFS=8
done

# 配置 OpenSM 的虚拟化支持
cat > /etc/opensm/opensm.conf << 'EOF'
# 启用虚拟化支持
virt_enabled 2
virt_max_ports_in_process 256
virt_default_hop_limit 64
EOF

sudo systemctl restart opensm
```

:::warning 重要提示
ConnectX-7 适配器需要固件版本 **28.43.1014 或更高版本**才能稳定运行 SR-IOV。BlueField-3 需要 **v32.43.1014**。
:::

## 经验教训

1. **始终验证驱动与内核的兼容性**：即使驱动能成功加载，API 不兼容性也会导致难以调试的微妙问题。
2. **分层解决方案**：单一方法很少能解决复杂的网络问题。我们的三层方案针对问题的不同方面进行了处理。
3. **GUID 分配至关重要**：零 GUID (`0x000000`) 会导致 VF 识别失败。务必以编程方式分配唯一的 GUID。
4. **时序是关键**：操作顺序（驱动加载 → VF 创建 → GUID 分配 → udev 处理 → kubelet 启动）至关重要。
5. **在预发布环境测试固件更新**：固件不匹配可能导致难以诊断的协议回退。

## 监控与验证

实施后，监控以下关键指标：

```bash
# 验证 VF 命名一致性
ip link show | grep -E "mlx-|sriov-" | wc -l

# 检查 PORT_DOWN 问题
ibstat | grep -c "State: Active"

# 验证 GUID 分配
for i in {0..7}; do
  cat /sys/class/infiniband/mlx5_${i}/ports/1/gids/0
done | grep -c "0000:0000:0000:0000"  # 应为 0

# 在 Kubernetes 中监控 SR-IOV 资源分配
kubectl get nodes -o json | jq '.items[].status.allocatable' | grep dgx_h200_vfs
```

## 结论

解决运行 Amazon EKS Hybrid Nodes 的 DGX H200 系统上的 SR-IOV VF 命名不一致问题，需要深入调查驱动兼容性、systemd 网络配置和 Kubernetes CNI 交互。关键洞察在于认识到看似无关的症状（命名变化、协议回退、PORT_DOWN 状态）都源于一个根本性的驱动与内核不兼容问题。

我们的三层解决方案——修复驱动、实现持久化命名和编排 VF 创建——已在多个 DGX H200 部署中证明了其稳定性。虽然这个过程充满挑战，但最终结果是一个强健的、可用于生产环境的高性能网络配置，适用于混合云环境。

### 架构图说明

*本文中的架构图采用 AWS 图表标准创建。如需在您的文档中使用该图，可以将 HTML/SVG 可视化导出为 PNG 图片，或在 draw.io 中使用 AWS Architecture Icons 重新创建。该图也可在本文的配套 GitHub 仓库中获取。*

## 参考资料

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
