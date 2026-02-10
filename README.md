# Engineering Playbook

> Cloud Native Architecture & Agentic AI — Battle-tested engineering know-how from production environments

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

## About

**Engineering Playbook** is a hands-on technical guide for application modernization and Agentic AI platform engineering.

This knowledge base is built from real-world experience — working alongside customers to build cloud-native platforms, debugging production issues firsthand, and continuously refining best practices. It captures architecture patterns, performance optimization strategies, troubleshooting guides, and benchmark results that come from actual operations, not theory.

📖 **Live Documentation**: [https://devfloor9.github.io/engineering-playbook/](https://devfloor9.github.io/engineering-playbook/)

## What's Inside

### Infrastructure Optimization
Cilium ENI, Gateway API, CoreDNS tuning, Karpenter autoscaling, East-West traffic optimization — practical guides to maximize EKS infrastructure performance.

### Operations & Observability
GitOps-based cluster operations, node monitoring agent deployment, and methodologies for reliably operating large-scale Kubernetes clusters.

### Agentic AI Platform
End-to-end guides for building generative AI platforms on EKS — covering vLLM, Ray Serve, MoE model serving, Inference Gateway, Milvus vector DB, Kagent, and more. From GPU resource management to agent monitoring across the full stack.

### Hybrid Infrastructure
EKS Hybrid Nodes, SR-IOV with DGX H200, Harbor registry integration — bridging on-premises and cloud infrastructure.

### Security & Governance
Identity-First Security, GuardDuty Extended Threat Detection, Kyverno policy management, supply chain security — enterprise-grade security governance.

### ROSA (OpenShift on AWS)
Red Hat OpenShift on AWS installation, security, and compliance guides.

### Benchmark Reports
CNI performance comparisons, AI/ML workload benchmarks, hybrid infrastructure performance tests — data-driven reports from real measurements.

## Tech Stack

- **Container Orchestration**: Amazon EKS, EKS Auto Mode, Karpenter
- **Networking**: Cilium, Gateway API, CoreDNS
- **AI/ML Serving**: vLLM, Ray Serve, llm-d, NeMo
- **Observability**: Prometheus, Grafana, Langfuse, Hubble
- **GitOps**: ArgoCD
- **Security**: Kyverno, GuardDuty, Pod Identity

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Production build
npm run build
```

> Requires Node.js 20+

## Documentation Structure

```
docs/
├── intro.md                          # Introduction
├── infrastructure-optimization/      # Infrastructure Optimization
├── operations-observability/         # Operations & Observability
├── agentic-ai-platform/             # Agentic AI Platform
├── hybrid-infrastructure/            # Hybrid Infrastructure
├── security-governance/              # Security & Governance
├── rosa/                             # ROSA
└── benchmarks/                       # Benchmark Reports
```

## Contributing

Issues, PRs, and feedback are all welcome. See [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues) for details.

## License

Content in this project is available under the [MIT License](LICENSE).
