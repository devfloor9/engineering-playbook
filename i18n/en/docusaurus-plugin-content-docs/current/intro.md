---
title: Introduction
description: Cloud Native Architecture Engineering Playbook & Benchmark Reports — Amazon EKS infrastructure optimization, Agentic AI platform, AIOps/AIDLC, performance benchmarks
tags: [cloud-native, kubernetes, introduction, getting-started]
---

# Engineering Playbook

Welcome to the **Cloud Native Architecture Engineering Playbook & Benchmark Reports**. This playbook provides comprehensive, hands-on guides and architecture patterns for Amazon EKS-based cloud-native infrastructure optimization, Agentic AI platform engineering, and AIOps/AIDLC methodologies. Each technical domain includes **quantitative performance benchmark reports** to support data-driven architecture decisions.

## What You'll Find Here

This playbook is organized into seven core technical domains plus an independent benchmark reports section. Each domain includes detailed implementation guides, troubleshooting resources, real-world case studies, and quantitative performance data:

### [Infrastructure Optimization](./infrastructure-optimization/)

- Gateway API adoption guide (NGINX Ingress EOL response, 5 solution comparison)
- CoreDNS monitoring and optimization
- Karpenter autoscaling configuration
- East-West traffic optimization
- Cost management and optimization

### [Operations & Observability](./operations-observability/)

- GitOps-based cluster operations
- Node monitoring agent deployment
- EKS debugging and incident response guide
- EKS high availability and resiliency architecture

### [Agentic AI Platform](./agentic-ai-platform/)

- Production GenAI platform architecture
- GPU resource management and optimization
- vLLM and Mixture-of-Experts (MoE) model serving
- llm-d distributed inference on EKS Auto Mode
- Inference Gateway routing patterns
- Milvus vector database and RAG implementations
- Kagent Kubernetes AI agents
- Langfuse agent monitoring
- NeMo Framework integration
- Amazon Bedrock AgentCore with Model Context Protocol (MCP)
- RAGAS evaluation framework

### [AIops & AIDLC](./aiops-aidlc/)

- AIOps introduction and EKS application strategies
- EKS intelligent observability stack (ADOT + AMP/AMG + CloudWatch AI)
- AIDLC framework (Kiro + MCP + DevOps Agent)
- Predictive scaling and auto-recovery patterns

### [Hybrid Infrastructure](./hybrid-infrastructure/)

- Hybrid nodes adoption guide
- SR-IOV with DGX H200 high-performance networking
- Hybrid nodes file storage configurations
- Harbor container registry integration

### [Security & Governance](./security-governance/)

- Identity-First Security architecture
- GuardDuty Extended Threat Detection
- Kyverno policy management
- Default namespace incident analysis
- Software supply chain security

### [ROSA (OpenShift on AWS)](./rosa/)

- ROSA demo installation guide
- ROSA security and compliance

### [Benchmark Reports](./benchmarks/)

- Infrastructure performance benchmarks
- CNI performance comparison (Cilium vs VPC CNI)
- AI/ML workload benchmarks
- Hybrid infrastructure benchmarks
- Security operations benchmarks

## Getting Started

1. **New to cloud native?** Start with the fundamentals in each domain's introduction
2. **Specific use case?** Use the search functionality to find relevant guides
3. **Implementation ready?** Follow the step-by-step guides with code examples

## How to Use This Playbook

Each guide follows a consistent structure:

- **Overview**: Context and objectives
- **Prerequisites**: Required knowledge and tools
- **Architecture**: System design and components
- **Implementation**: Step-by-step instructions
- **Monitoring**: Verification and observability
- **Troubleshooting**: Common issues and solutions

## Contributing

This playbook is continuously updated with the latest cloud native patterns and best practices. For contributions, issues, or suggestions, visit our [GitHub repository](https://github.com/devfloor9/engineering-playbook).

## Support

- **Documentation Issues**: [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues)
- **Technical Questions**: Use the search functionality or browse by tags
