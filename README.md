# Engineering Playbook

> Cloud Native Architecture Engineering Playbook & Benchmark Reports — Battle-tested engineering know-how from production environments

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

## About

**Engineering Playbook** is a comprehensive collection of cloud native architecture engineering practices accumulated from production environments. It covers Amazon EKS infrastructure optimization, Agentic AI platform engineering, AIDLC/AgenticOps methodology, hybrid infrastructure, security governance, and quantitative benchmark results.

Each technical domain provides implementation guides alongside measurable performance data to support data-driven architecture decisions.

**Live Documentation**: [https://devfloor9.github.io/engineering-playbook/](https://devfloor9.github.io/engineering-playbook/)

## What's Inside

### Agentic AI Platform

End-to-end guide for building enterprise Agentic AI platforms on EKS.

- **Design & Architecture**: Technical challenges, EKS-based solutions, platform architecture, AWS-native patterns
- **Model Serving & Inference**: EKS GPU node strategy (Auto Mode / Karpenter / MNG / DRA), GPU resource management, vLLM, llm-d distributed inference, MoE model serving, NVIDIA GPU stack (Dynamo / GPU Operator / DCGM / KAI Scheduler), NeMo Framework
- **Inference Gateway & Routing**: LLM Gateway 2-tier architecture (kgateway + agentgateway + Bifrost), inference gateway routing, OpenClaw AI Gateway
- **Agent & Data**: Kagent Kubernetes agents, Milvus vector database
- **Operations & MLOps**: Agent monitoring, RAGAS evaluation, LLMOps observability, MLOps pipeline, SageMaker-EKS integration
- **Enterprise Ops**: Agentic playbook, compliance framework, domain customization
- **Inference Optimization**: EKS architecture for inference & model performance optimization — vLLM, KV Cache-aware routing, disaggregated serving, LWS multi-node, Bifrost→Bedrock fallback, Hybrid Node integration

### EKS Best Practices

Production-grade guides for Amazon EKS infrastructure optimization.

- **Networking & Performance**: Cilium ENI, Gateway API migration, CoreDNS tuning, East-West traffic optimization
- **Control Plane & Scaling**: Large-scale cluster scaling strategies, cross-cluster object replication
- **Resource & Cost**: Karpenter autoscaling, resource optimization, cost management
- **Operations & Reliability**: GitOps (Argo CD), node monitoring, EKS debugging & resiliency, Pod health lifecycle
- **Security & Authentication**: EKS API server authentication/authorization, Pod Identity, IRSA

### AIDLC & AgenticOps

AI Development Lifecycle framework and Agentic AI operational feedback loops.

- **AIDLC Framework**: Reliability dual-axis (Ontology × Harness) based AI development lifecycle
- **AgenticOps**: OpenTelemetry observability, CloudWatch AI integration, DevOps Guru predictive operations

### Hybrid Infrastructure

On-premises GPU infrastructure and cloud native platform integration.

- EKS Hybrid Nodes adoption guide
- SR-IOV with DGX H200
- File storage strategies
- Harbor registry integration

### Security & Governance

Enterprise security governance practices.

- Identity-First Security (EKS Pod Identity)
- GuardDuty Extended Threat Detection
- Kyverno policy management
- Supply Chain Security
- Default namespace incident analysis

### ROSA

Red Hat OpenShift on AWS installation, security, and compliance guide.

### Benchmark Reports

Quantitative benchmarks for infrastructure, AI/ML, and hybrid environments.

- **Networking**: CNI performance comparison (VPC CNI vs Cilium), Gateway API implementation benchmarks
- **AI/ML Inference**: AI/ML workload analysis, AgentCore vs EKS self-hosted inference, Dynamo inference benchmark
- **Infrastructure & Operations**: Infrastructure performance, hybrid infrastructure, security operations metrics

## Tech Stack

| Area | Technologies |
|------|-------------|
| **Container Orchestration** | Amazon EKS, EKS Auto Mode, Karpenter, MNG + DRA |
| **Networking** | Cilium, Gateway API, CoreDNS, kgateway |
| **AI/ML Serving** | vLLM, SGLang, llm-d, NVIDIA Dynamo, NeMo Framework, Amazon Bedrock |
| **AI Gateway** | kgateway + agentgateway, Bifrost, LiteLLM, OpenClaw |
| **GPU Management** | NVIDIA GPU Operator, DCGM, DRA, MIG, KAI Scheduler, NIXL |
| **MLOps** | Kubeflow, MLflow, KServe, SageMaker |
| **Vector DB** | Milvus |
| **Observability** | Prometheus, Grafana, Langfuse, Hubble, OpenTelemetry |
| **Cost Tracking** | Bifrost (infra-level), Langfuse (app-level) |
| **GitOps** | Argo CD |
| **Security** | Kyverno, GuardDuty, EKS Pod Identity |
| **AI Agent** | Kagent, MCP (Model Context Protocol) |
| **Evaluation** | RAGAS |

## Documentation Structure

```
docs/
├── agentic-ai-platform/           # Agentic AI Platform
│   ├── design-architecture/        #   Design & Architecture
│   ├── model-serving/              #   Model Serving (GPU strategy, vLLM, llm-d, MoE, NeMo)
│   ├── gateway-agents/             #   Gateway & Agents (LLM Gateway, Inference GW, OpenClaw)
│   ├── agent-data/                 #   Agent & Data (Kagent, Milvus)
│   ├── operations-mlops/           #   Operations & MLOps (monitoring, RAGAS, LLMOps)
│   └── enterprise-ops/             #   Enterprise Ops (playbook, compliance, customization)
├── eks-best-practices/             # EKS Best Practices
│   ├── networking-performance/     #   Networking (Cilium, Gateway API, CoreDNS)
│   ├── control-plane-scaling/      #   Control Plane Scaling
│   ├── resource-cost/              #   Resource & Cost Optimization
│   ├── operations-reliability/     #   Operations & Reliability
│   └── security-authn/             #   Security & Authentication
├── aidlc/                          # AIDLC Framework
│   └── agentic-ops/                #   AgenticOps
├── hybrid-infrastructure/          # Hybrid Infrastructure
├── security-governance/            # Security & Governance
├── benchmarks/                     # Benchmark Reports
└── rosa/                           # ROSA (OpenShift on AWS)
```

## Slides

Presentation materials are available at [/slides](https://devfloor9.github.io/engineering-playbook/slides):

- **Agentic AI Platform** — Full platform overview (86 slides)
- **Inference & Model Performance Optimization** — EKS architecture for LLM inference optimization

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

## Contributing

Issues, PRs, and feedback are all welcome. See [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues) for details.

## License

Content in this project is available under the [MIT License](LICENSE).
