<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# Hybrid Infrastructure

## Purpose
Technical documentation for building hybrid cloud architectures with Amazon EKS Hybrid Nodes. Covers integrating on-premises infrastructure with AWS cloud, including high-performance networking (SR-IOV), shared storage, and container registry synchronization.

## Key Files
| File | Description |
|------|-------------|
| `index.md` | Section landing page with hybrid infrastructure overview |
| `hybrid-nodes-adoption-guide.md` | Complete guide to connecting on-premises nodes to EKS |
| `sriov-dgx-h200-hybrid.md` | High-performance SR-IOV networking for NVIDIA DGX H200 |
| `hybrid-nodes-file-storage.md` | Shared file storage solutions (NFS/iSCSI) |
| `harbor-hybrid-integration.md` | Harbor 2.13 container registry integration |

## For AI Agents

### Working In This Directory
- Documents are in Korean
- Follow frontmatter standard: `sidebar_position`, `title`, `description`, `date`, `authors`
- Four-phase implementation sequence clearly defined
- Emphasis on data sovereignty and regulatory compliance use cases
- Focus on leveraging existing on-premises hardware investments (especially GPUs)

### Content Organization
Documents follow sequential implementation order:
- **Phase 1**: Basic hybrid node setup and networking
- **Phase 2**: High-performance networking with SR-IOV for GPU workloads
- **Phase 3**: Shared storage configuration across cloud and on-premises
- **Phase 4**: Container registry integration and image synchronization

### Key Technologies
- **EKS Hybrid Nodes**: Lightweight agents connecting on-premises servers to AWS EKS control plane
- **Networking**: VPN, AWS Direct Connect, SR-IOV (Single Root I/O Virtualization)
- **GPU Systems**: NVIDIA DGX H200 with optimized networking
- **Storage**: NFS, iSCSI, persistent volumes
- **Registry**: Harbor 2.13 (container image management and replication)
- **Autoscaling**: Karpenter (cloud bursting patterns)
- **DRA**: Dynamic Resource Allocation for specialized hardware (GPU, FPGA)

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run build` must succeed

### Common Patterns
- **Cloud bursting**: On-premises baseline + cloud overflow capacity
- **Data locality**: Processing data where it resides (low latency)
- **Compliance**: Meeting data residency and regulatory requirements
- **Hardware reuse**: Maximizing ROI on existing on-premises investments
- **Unified management**: Single Kubernetes control plane for hybrid resources
- **Security**: Encrypted channels (VPN/Direct Connect) for control plane communication

## Dependencies

### Internal
- Referenced by `sidebars.js` at project root (sidebar_position: 4)
- English translations at `i18n/en/docusaurus-plugin-content-docs/current/hybrid-infrastructure/`
- Cross-references to:
  - `/docs/agentic-ai-platform` (hybrid AI deployment)
  - `/docs/operations-observability` (monitoring hybrid environments)
  - `/docs/infrastructure-optimization` (hybrid networking)

### External
- AWS EKS (control plane)
- AWS Direct Connect or VPN (connectivity)
- Harbor container registry
- NVIDIA DGX H200 systems (for SR-IOV docs)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
