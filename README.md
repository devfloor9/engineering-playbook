---
created: 2025-09-09
last_update:
  date: 2026-06-29
reading_time: 14
---
# Engineering Playbook

> Cloud Native Architecture Engineering Playbook & Benchmark Reports — Battle-tested engineering know-how from production environments

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

## About

**Engineering Playbook** is a comprehensive collection of cloud native architecture engineering practices accumulated from production environments. It covers Amazon EKS infrastructure optimization, Agentic AI platform engineering, AIDLC/AgenticOps methodology, hybrid infrastructure, security governance, industry-specific solution patterns, and quantitative benchmark results.

Each technical domain provides implementation guides alongside measurable performance data to support data-driven architecture decisions.

**Live Documentation**: [https://devfloor9.github.io/engineering-playbook/](https://devfloor9.github.io/engineering-playbook/)

### Machine-Readable Endpoints (for AI agents & MCP servers)

| Endpoint | Purpose |
|----------|---------|
| [llms.txt](https://devfloor9.github.io/engineering-playbook/llms.txt) | llmstxt.org index — all technical docs with links and summaries |
| [llms-full.txt](https://devfloor9.github.io/engineering-playbook/llms-full.txt) | Full-text merge of all technical docs (single file) |
| [llm-wiki/manifest.json](https://devfloor9.github.io/engineering-playbook/llm-wiki/manifest.json) | LLM Wiki manifest — per-doc metadata (slug, domain, tags, related docs, markdown URL) |
| [llm-wiki/index.md](https://devfloor9.github.io/engineering-playbook/llm-wiki/index.md) | LLM Wiki index — per-page clean markdown files grouped by domain |

The LLM Wiki mirrors the 7 technical domains (industry demos excluded) as clean per-page markdown — MDX/JSX stripped, links normalized — so agents can fetch exactly the pages they need without HTML parsing. Each doc page also exposes `<link rel="alternate" type="text/markdown">` pointing to its markdown source.

## What's Inside

### Agentic AI Platform

End-to-end guide for building enterprise Agentic AI platforms on EKS.

- **Design & Architecture**: Platform foundations (architecture, challenges), platform selection (SageMaker / AgentCore / EKS decision framework, AWS-native, EKS open architecture), advanced patterns (self-improving agent loop, knowledge feature store, semantic caching)
- **Model Serving & Inference**: GPU infrastructure (EKS GPU node strategy, GPU resource management, NVIDIA GPU stack, AWS Neuron stack), inference frameworks (vLLM, llm-d, MoE serving, NeMo, HyperPod inference operator), inference optimization (KV Cache-aware routing, disaggregated serving, LMCache, cache-hit strategy), inference routing
- **Operations & MLOps**: Agent monitoring & observability (Langfuse, LLMOps tooling), RAGAS evaluation, Kagent Kubernetes agents, AI Gateway guardrails, compliance framework, domain customization, Milvus vector database
- **Reference Architecture**: Inference Gateway setup & routing (kgateway + agentgateway + Bifrost), custom model deployment & pipeline, model lifecycle (continuous training), SageMaker-EKS integration, open-weight model deployment, OpenClaw AI Gateway

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

### Industry Solutions

Industry-validated PoC patterns and runnable demo assets — focused on *what value to show customers and why*, complementing the *how-to* engineering guides in other sections.

- **Retail**: Five reference PoCs built on a common stack (Knowledge Graph on Neptune, hybrid search with OpenSearch + Cohere, persona switcher, Agentic AI on Bedrock + AgentCore, Bedrock Guardrails)
  - **LG H&H Marketing Innovation** — 3-BU (Beauty + HDB + Refreshment) integrated marketing, 8 scenarios with 4 external signal sources
  - **AMWAY Direct Selling** — ABO/IBO multi-level org visualization, subscription lifetime, direct-selling compliance (11 scenarios)
  - **Shinkong Mitsukoshi Luxury** — department-store VIP membership, foreign-tourist tax-free recommendation, luxury brand SOV (11 scenarios)
  - **Momo eCommerce** — live-commerce attribution, 24h delivery SLA, recommendation diversity (11 scenarios)
  - **Uni-President BU Integration** — cross-BU OPENPOINT journey, own-SKU sell-through, cold-chain SLA (11 scenarios)

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
│   ├── design-architecture/        #   Foundations, platform selection, advanced patterns
│   ├── model-serving/              #   GPU infra, inference frameworks, optimization, routing
│   ├── operations-mlops/           #   Observability, governance, data infrastructure
│   └── reference-architecture/     #   Inference gateway, model lifecycle, integrations
├── eks-best-practices/             # EKS Best Practices
│   ├── networking-performance/     #   Networking (Cilium, Gateway API, CoreDNS)
│   ├── control-plane-scaling/      #   Control Plane Scaling
│   ├── resource-cost/              #   Resource & Cost Optimization
│   ├── operations-reliability/     #   Operations & Reliability
│   └── security-authn/             #   Security & Authentication
├── aidlc/                          # AIDLC Framework
│   ├── methodology/                #   Methodology (DDD integration, ontology × harness)
│   ├── toolchain/                  #   Tools & implementation
│   ├── enterprise/                 #   Enterprise adoption
│   └── operations/                 #   AgenticOps
├── hybrid-infrastructure/          # Hybrid Infrastructure
├── security-governance/            # Security & Governance
├── rosa/                           # ROSA (OpenShift on AWS)
├── industry-solutions/             # Industry Solutions
│   └── retail/                     #   Retail PoCs (LG H&H, AMWAY, Shinkong, Momo, Uni-President)
└── benchmarks/                     # Benchmark Reports
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
