<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# ROSA (Red Hat OpenShift on AWS)

## Purpose
Technical documentation for deploying and operating Red Hat OpenShift Service on AWS (ROSA). Covers cluster installation with STS-based security, compliance configurations for regulated industries, and hybrid cloud console integration.

## Key Files
| File | Description |
|------|-------------|
| `index.md` | Section landing page with ROSA architecture and comparison |
| `rosa-demo-installation.md` | Step-by-step STS-based cluster installation guide |
| `rosa-security-compliance.md` | Financial services security and Red Hat Hybrid Cloud Console access control |

## For AI Agents

### Working In This Directory
- Documents are in Korean
- Follow frontmatter standard: `sidebar_position`, `title`, `description`, `date`, `authors`
- Two-phase implementation: installation first, then security hardening
- Strong emphasis on financial sector compliance requirements
- ROSA positioned as fully-managed OpenShift with AWS/Red Hat co-management

### Content Organization
Documents follow deployment maturity sequence:
- **Phase 1**: Cluster installation (STS roles, networking, autoscaling, validation)
- **Phase 2**: Security and compliance (IdP integration, MFA, RBAC, audit logging)

### Key Technologies
- **ROSA CLI**: Command-line tool for cluster lifecycle management
- **STS (Security Token Service)**: Temporary credentials (no permanent access keys)
- **OIDC**: OpenID Connect for external identity provider integration
- **OVNKubernetes**: OpenShift network plugin (high-performance)
- **Cluster Autoscaler**: Automatic node scaling based on workload demand
- **Hybrid Cloud Console**: Red Hat central management portal for multi-cluster
- **Quay Registry**: Container image storage with build automation
- **IAM Roles**: Fine-grained AWS permissions per OpenShift component

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run build` must succeed
- Mermaid diagrams must render correctly (architecture visualizations)

### Common Patterns
- **Fully-managed control plane**: AWS + Red Hat operate control plane (zero ops burden)
- **STS security model**: Temporary tokens auto-rotated (superior to static keys)
- **Multi-cluster management**: Single console for AWS/Azure/GCP/on-premises OpenShift
- **Compliance focus**: Financial services, healthcare (HIPAA), PCI-DSS requirements
- **Hybrid cloud strategy**: Seamless workload movement between on-premises and cloud
- **Cloud bursting**: Scale to cloud during peak demand
- **Disaster recovery**: Multi-region active-passive patterns
- **Migration path**: From on-premises OpenShift to ROSA with minimal refactoring

### ROSA vs EKS Comparison
- **Control Plane**: ROSA (Red Hat/AWS managed) vs EKS (AWS managed)
- **Developer Experience**: ROSA (superior OpenShift tooling) vs EKS (Kubernetes-native)
- **Cost**: ROSA (higher, includes OpenShift licensing) vs EKS (lower)
- **Security**: ROSA (highest, built-in hardening) vs EKS (high, DIY security)
- **Hybrid Support**: ROSA (excellent, unified console) vs EKS (good, separate management)
- **Use Case**: ROSA (enterprise migrations, compliance) vs EKS (greenfield, cost-sensitive)

## Dependencies

### Internal
- Referenced by `sidebars.js` at project root (sidebar_position: 6)
- English translations at `i18n/en/docusaurus-plugin-content-docs/current/rosa/`
- Cross-references to:
  - `/docs/hybrid-infrastructure` (hybrid environment management)
  - `/docs/security-governance` (ROSA security architecture)
  - `/docs/infrastructure-optimization` (networking optimization)
  - `/docs/operations-observability` (cluster monitoring)

### External
- AWS account with appropriate IAM permissions
- Red Hat account (for OpenShift licensing)
- ROSA CLI tool
- Identity Provider (Okta, Azure AD, etc. for SSO)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
