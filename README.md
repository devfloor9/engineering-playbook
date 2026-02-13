# Engineering Playbook

> 클라우드 네이티브 아키텍처 엔지니어링 플레이북 & 벤치마크 리포트 — Battle-tested engineering know-how from production environments

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

## About

**Engineering Playbook** is a comprehensive cloud-native architecture engineering playbook and benchmark report collection. It covers Amazon EKS infrastructure optimization, Agentic AI platform engineering, AIOps/AIDLC methodologies, and performance benchmarks — all built from real production experience.

This knowledge base captures architecture patterns, performance optimization strategies, troubleshooting guides, and quantitative benchmark results from actual operations. Each technical domain includes both implementation guides and measurable performance data to support data-driven architecture decisions.

**Live Documentation**: [https://devfloor9.github.io/engineering-playbook/](https://devfloor9.github.io/engineering-playbook/)

## What's Inside

### Infrastructure Optimization
Cilium ENI, Gateway API migration, CoreDNS tuning, Karpenter autoscaling, East-West traffic optimization, and cost management — practical guides to maximize EKS infrastructure performance and efficiency.

### Operations & Observability
GitOps-based cluster operations with Argo CD, node monitoring agent deployment, EKS debugging and resiliency guides — methodologies for reliably operating large-scale Kubernetes clusters.

### Agentic AI Platform
End-to-end guides for building generative AI platforms on EKS — covering vLLM, llm-d, MoE model serving, NeMo Framework, Inference Gateway, Milvus vector DB, Kagent, Amazon Bedrock AgentCore with MCP, RAGAS evaluation, and Langfuse monitoring. From GPU resource management to agent observability across the full stack.

### AIops & AIDLC
AI-powered operations and AI Development Lifecycle — OpenTelemetry observability, CloudWatch AI integration, DevOps Guru predictive operations, MLOps pipelines with Kubeflow and MLflow, SageMaker-EKS integration, and comprehensive AIDLC framework for production AI systems.

### Hybrid Infrastructure
EKS Hybrid Nodes adoption, SR-IOV with DGX H200, file storage strategies, Harbor registry integration — bridging on-premises GPU infrastructure and cloud-native platforms.

### Security & Governance
Identity-First Security with EKS Pod Identity, GuardDuty Extended Threat Detection, Kyverno policy management, supply chain security — enterprise-grade security governance for modern platforms.

### ROSA (OpenShift on AWS)
Red Hat OpenShift on AWS installation, security, and compliance guides for enterprise Kubernetes adoption.

### Benchmark Reports
Comprehensive performance benchmarks across infrastructure, AI/ML, and hybrid domains — including CNI comparisons (VPC CNI vs Cilium), Gateway API implementation benchmarks, AI/ML workload analysis, and security operations metrics. All reports follow reproducible methodology with statistical rigor.

## Tech Stack

- **Container Orchestration**: Amazon EKS, EKS Auto Mode, Karpenter
- **Networking**: Cilium, Gateway API, CoreDNS
- **AI/ML Serving**: vLLM, llm-d, NeMo Framework, Amazon Bedrock AgentCore
- **MLOps**: Kubeflow, MLflow, KServe, SageMaker
- **Vector Databases**: Milvus
- **Observability**: Prometheus, Grafana, Langfuse, Hubble, OpenTelemetry, CloudWatch AI
- **GitOps**: Argo CD
- **Security**: Kyverno, GuardDuty, EKS Pod Identity
- **AI Agents**: Kagent, MCP (Model Context Protocol)
- **Evaluation**: RAGAS

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Production build
npm run build
```

> Requires Node.js >=20.0 and Docusaurus 3.9.2

## Documentation Structure

```
docs/
├── intro.md                          # Introduction
├── infrastructure-optimization/      # Infrastructure Optimization
├── operations-observability/         # Operations & Observability
├── agentic-ai-platform/             # Agentic AI Platform
├── aiops-aidlc/                     # AIops & AIDLC
├── hybrid-infrastructure/            # Hybrid Infrastructure
├── security-governance/              # Security & Governance
├── rosa/                             # ROSA
└── benchmarks/                       # Benchmark Reports
```

## Contributing

Issues, PRs, and feedback are all welcome. See [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues) for details.

## License

Content in this project is available under the [MIT License](LICENSE).
