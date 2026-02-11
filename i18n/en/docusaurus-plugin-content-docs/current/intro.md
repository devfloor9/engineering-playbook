---
title: Introduction
description: Welcome to the Engineering Playbook - your comprehensive guide to cloud native architecture and best practices
tags: [cloud-native, kubernetes, introduction, getting-started]
---

# Engineering Playbook

Welcome to the **Engineering Playbook** - a comprehensive collection of technical guides, best practices, and architectural patterns for cloud native infrastructure, Agentic AI platform engineering, and AIOps/AIDLC on AWS.

## What You'll Find Here

This playbook is organized into eight technical domains, each containing detailed implementation guides, troubleshooting resources, and real-world examples:

### [Infrastructure Optimization](./infrastructure-optimization/)

- Cilium ENI mode with Gateway API integration
- NGINX to Gateway API migration strategies
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

- AIOps concepts and EKS application
- Intelligent observability stack (OpenTelemetry, CloudWatch AI, DevOps Guru)
- Predictive operations automation
- MLOps pipelines (Kubeflow, MLflow, KServe)
- SageMaker-EKS integration
- AI Development Lifecycle (AIDLC) framework

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
