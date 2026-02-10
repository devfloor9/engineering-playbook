<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# Operations & Observability

## Purpose
Technical documentation for building comprehensive observability and operational excellence in Amazon EKS environments. Covers GitOps-based cluster operations, node monitoring, and network visibility through modern cloud-native tools.

## Key Files
| File | Description |
|------|-------------|
| `index.md` | Section landing page with observability philosophy |
| `gitops-cluster-operation.md` | Declarative cluster management with GitOps (Flux CD/ArgoCD) |
| `node-monitoring-agent.md` | Node health monitoring and Hubble network visibility |

## For AI Agents

### Working In This Directory
- Documents are in Korean
- Follow frontmatter standard: `sidebar_position`, `title`, `description`, `date`, `authors`
- Two-phase implementation: GitOps foundation first, then monitoring layer
- Strong emphasis on observability pillars: logs, metrics, traces
- Focus on GitOps for reproducibility and audit trails

### Content Organization
Documents follow operational maturity sequence:
- **Phase 1**: GitOps foundation (declarative infrastructure, change management)
- **Phase 2**: Monitoring agents (node metrics, network visibility with Hubble)

### Key Technologies
- **GitOps**: Flux CD, ArgoCD (declarative cluster state management)
- **Version Control**: Git (single source of truth for configurations)
- **Monitoring**: Prometheus (metrics), Grafana (visualization)
- **Distributed Tracing**: Jaeger (request flow analysis)
- **Network Visibility**: Hubble (Cilium-based network observability)
- **Logging**: Centralized log aggregation (CloudWatch, ELK stack)
- **Metrics**: Node exporter, kube-state-metrics, custom application metrics

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run build` must succeed

### Common Patterns
- **GitOps workflow**: All changes via Git commits (no manual kubectl apply)
- **Declarative state**: Infrastructure as Code for reproducibility
- **SLI/SLO definition**: Focus on meaningful metrics, avoid noise
- **Three pillars**: Logs + Metrics + Traces = complete observability
- **Network visibility**: Service-to-service communication patterns without service mesh
- **Proactive monitoring**: Alert on anomalies before user impact
- **Immutable infrastructure**: Git history provides complete audit trail
- **Change tracking**: Every configuration change is version-controlled

## Dependencies

### Internal
- Referenced by `sidebars.js` at project root (sidebar_position: 2)
- English translations at `i18n/en/docusaurus-plugin-content-docs/current/operations-observability/`
- Cross-references to:
  - `/docs/agentic-ai-platform` (AI/ML workload monitoring)
  - `/docs/infrastructure-optimization` (performance metrics)
  - `/docs/security-governance` (security monitoring)

### External
- AWS EKS cluster
- Flux CD or ArgoCD (GitOps operators)
- Git repository (configuration source of truth)
- Prometheus/Grafana stack
- Cilium + Hubble (for network visibility)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
