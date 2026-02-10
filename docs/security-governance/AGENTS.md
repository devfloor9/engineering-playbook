<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# Security & Governance

## Purpose
Technical documentation for implementing defense-in-depth security architectures and compliance frameworks in Amazon EKS. Covers multi-layer security controls, incident response procedures, and continuous security posture assessment for regulated industries.

## Key Files
| File | Description |
|------|-------------|
| `index.md` | Section landing page with security philosophy and multi-layer defense |
| `default-namespace-incident.md` | Case study: default namespace security threat analysis and remediation |

## For AI Agents

### Working In This Directory
- Documents are in Korean
- Follow frontmatter standard: `sidebar_position`, `title`, `description`, `date`, `authors`
- Organized by security domains rather than implementation phases
- Strong emphasis on compliance frameworks (SOC 2, PCI-DSS, HIPAA, GDPR, ISO 27001)
- Zero Trust principles as foundation

### Content Organization
Documentation structured by security layers:
- **Cluster Security**: IAM, RBAC, IRSA (IAM Roles for Service Accounts), OIDC
- **Network Security**: Network Policies, Service Mesh (mTLS), VPC isolation, Security Groups
- **Workload Security**: Pod Security Standards, Security Context, container image scanning
- **Data Security**: Encryption at rest (KMS), encryption in transit (TLS/mTLS), secrets management
- **Runtime Security**: Falco (syscall monitoring), anomaly detection, threat response
- **Compliance**: Automated policy enforcement (OPA Gatekeeper), audit logging, continuous assessment

### Key Technologies
- **Authentication/Authorization**: AWS IAM, Kubernetes RBAC, IRSA, OIDC providers
- **Network Security**: Cilium Network Policies, Istio/Linkerd (service mesh), VPC Flow Logs
- **Secrets Management**: AWS Secrets Manager, External Secrets Operator, KMS envelope encryption
- **Container Security**: Trivy (vulnerability scanning), Pod Security Standards (restricted mode)
- **Runtime Security**: Falco (threat detection), OPA Gatekeeper (policy enforcement)
- **Audit/Compliance**: AWS CloudTrail (API logging), AWS Config (resource compliance), GuardDuty (threat intel)
- **Monitoring**: AWS Security Hub (centralized findings), Inspector (vulnerability assessment)

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run build` must succeed
- Mermaid diagrams must render correctly (security architecture visualizations)

### Common Patterns
- **Defense in Depth**: Multiple overlapping security layers
- **Zero Trust**: Explicit verification for all access, default deny
- **Least Privilege**: Minimum necessary permissions (RBAC + IAM)
- **Immutable Infrastructure**: Read-only filesystems, signed images only
- **Automated Compliance**: Policy as Code (OPA), continuous scanning
- **Incident Response Lifecycle**: Detect → Analyze → Contain → Eradicate → Recover → Post-mortem
- **Secrets Rotation**: Automated rotation via External Secrets Operator
- **Network Segmentation**: Namespace isolation via Network Policies
- **mTLS Everywhere**: Service mesh for encrypted service-to-service communication

### Compliance Frameworks Mapping
- **SOC 2**: High availability, data encryption, access controls → EKS HA, KMS, RBAC
- **PCI-DSS**: Network isolation, encryption, logging → Network Policies, TLS, CloudTrail
- **HIPAA**: Data encryption, audit trails → KMS, CloudTrail, application logs
- **GDPR**: Data minimization, user rights, transparency → Data policies, access logs
- **ISO 27001**: Comprehensive ISMS → All controls integrated

### Incident Response Process
1. **Detection**: Automated alerts (GuardDuty, Falco, CloudWatch)
2. **Analysis**: Severity assessment, impact scope, attack vector identification
3. **Containment**: Network isolation, affected pod termination
4. **Eradication**: Remove threat, patch vulnerabilities
5. **Recovery**: Restore services, validate integrity
6. **Post-Mortem**: Root cause analysis, lessons learned
7. **Improvement**: Update policies, automate preventions

## Dependencies

### Internal
- Referenced by `sidebars.js` at project root (sidebar_position: 5)
- English translations at `i18n/en/docusaurus-plugin-content-docs/current/security-governance/`
- Cross-references to:
  - `/docs/hybrid-infrastructure` (hybrid environment security)
  - `/docs/operations-observability` (security monitoring)
  - `/docs/infrastructure-optimization` (network security)

### External
- AWS EKS cluster
- AWS Security Services (GuardDuty, Security Hub, CloudTrail, Config, Inspector)
- AWS Secrets Manager + KMS
- Container image scanning tools (Trivy, Snyk, Aqua)
- Runtime security tools (Falco, Sysdig)
- Policy enforcement (OPA Gatekeeper)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
