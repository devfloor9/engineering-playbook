# Engineering Playbook

> Cloud Native Architecture & Agentic AI — Battle-tested engineering know-how from production environments

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

## About

**Engineering Playbook** is a hands-on technical guide for application modernization and Agentic AI platform engineering.

This knowledge base is built from real-world experience — working alongside customers to build cloud-native platforms, debugging production issues firsthand, and continuously refining best practices. It captures architecture patterns, performance optimization strategies, troubleshooting guides, and benchmark results that come from actual operations, not theory.

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
CNI performance comparisons, AI/ML workload benchmarks, hybrid infrastructure performance tests, security operations metrics — data-driven reports from real measurements.

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
