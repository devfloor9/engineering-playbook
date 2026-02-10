<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# Infrastructure Optimization

## Purpose
Technical documentation for optimizing Amazon EKS cluster performance, networking, and cost efficiency. Covers DNS tuning, high-performance CNI, modern ingress patterns, autoscaling strategies, and cost management techniques for production environments.

## Key Files
| File | Description |
|------|-------------|
| `index.md` | Section landing page with optimization overview |
| `cilium-eni-gateway-api.md` | High-performance networking with Cilium ENI and Gateway API |
| `nginx-to-gateway-api-migration.md` | Strategic migration from NGINX Ingress to Gateway API |
| `coredns-monitoring-optimization.md` | CoreDNS performance tuning and monitoring |
| `east-west-traffic-best-practice.md` | Internal cluster traffic optimization |
| `karpenter-autoscaling.md` | Ultra-fast node autoscaling with Karpenter |
| `cost-management.md` | 30-90% cost reduction strategies |

## For AI Agents

### Working In This Directory
- Documents are in Korean
- Follow frontmatter standard: `sidebar_position`, `title`, `description`, `date`, `authors`
- Five-phase implementation sequence (network → DNS → traffic → autoscaling → cost)
- Strong emphasis on quantitative benchmarks and metrics
- Performance improvements validated with Prometheus/CloudWatch data

### Content Organization
Documents follow infrastructure layer implementation order:
- **Phase 1**: Network foundation (Cilium ENI + Gateway API, NGINX migration)
- **Phase 2**: DNS optimization (CoreDNS tuning)
- **Phase 3**: Internal traffic (east-west communication patterns)
- **Phase 4**: Autoscaling (Karpenter fast provisioning)
- **Phase 5**: Cost management (operational optimization)

### Key Technologies
- **CNI**: Cilium with eBPF-based ENI mode (superior throughput/latency)
- **Ingress**: Gateway API (Kubernetes-native successor to Ingress)
- **DNS**: CoreDNS with caching optimization and query tuning
- **Autoscaling**: Karpenter (fast node provisioning, Spot instances, multi-instance-type)
- **Monitoring**: Prometheus, Grafana, CloudWatch
- **Service Mesh**: Optional (traffic optimization without mesh complexity)
- **Load Balancing**: AWS NLB/ALB integration

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run build` must succeed
- Benchmark results should include before/after metrics

### Common Patterns
- **Metrics-driven optimization**: All changes validated with quantitative data
- **Cost-performance balance**: Spot instances + on-demand for reliability
- **DNS caching strategies**: Reduce CoreDNS query load in microservices
- **eBPF advantages**: Kernel bypass for network performance
- **Gateway API adoption**: Future-proof ingress architecture
- **Karpenter vs Cluster Autoscaler**: Faster scale-out, better instance selection
- **East-west optimization**: Service-to-service communication efficiency without mesh overhead

## Dependencies

### Internal
- Referenced by `sidebars.js` at project root (sidebar_position: 1)
- English translations at `i18n/en/docusaurus-plugin-content-docs/current/infrastructure-optimization/`
- Cross-references to:
  - `/docs/operations-observability` (performance metrics monitoring)
  - `/docs/security-governance` (network security policies)
  - `/docs/hybrid-infrastructure` (hybrid environment networking)

### External
- AWS EKS cluster
- Cilium CNI plugin
- Gateway API CRDs
- Karpenter autoscaler
- Prometheus/Grafana stack

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
