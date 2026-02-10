<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# Agentic AI Platform

## Purpose
Technical documentation for building and operating production-grade Agentic AI platforms on Amazon EKS. Covers the complete stack from GPU infrastructure and model serving to intelligent routing, RAG systems, agent orchestration, and evaluation frameworks.

## Key Files
| File | Description |
|------|-------------|
| `index.md` | Section landing page with architecture overview and learning paths |
| `agentic-ai-challenges.md` | Four core technical challenges requiring Kubernetes |
| `agentic-platform-architecture.md` | Complete platform architecture design |
| `gpu-resource-management.md` | MIG, Time-Slicing, and GPU optimization strategies |
| `vllm-model-serving.md` | High-performance model serving with vLLM and PagedAttention |
| `ray-serve-vllm-integration.md` | Distributed inference with Ray Serve |
| `moe-model-serving.md` | Mixture of Experts model deployment |
| `nemo-framework.md` | NVIDIA NeMo for training and serving |
| `inference-gateway-routing.md` | Intelligent request routing and load balancing |
| `milvus-vector-database.md` | Vector database for RAG pipelines |
| `kagent-kubernetes-agents.md` | CRD-based agent lifecycle management |
| `agent-monitoring.md` | Agent performance and health monitoring |
| `ragas-evaluation.md` | RAG pipeline quality evaluation |
| `agentic-ai-solutions-eks.md` | AWS sample repositories and patterns |

## For AI Agents

### Working In This Directory
- Documents are in Korean
- Follow frontmatter standard: `sidebar_position`, `title`, `description`, `tags`, `date`, `authors`, `last_update`
- Extensive use of Mermaid diagrams for architecture visualization
- Implementation phases clearly defined (Phase 1-8)
- Strong emphasis on AWS EKS integration and Kubernetes-native approaches
- References two key AWS sample repositories: GenAI on EKS Starter Kit and Scalable Model Inference Guidance

### Content Organization
Documents are organized by implementation phase:
- **Phase 1**: Understanding challenges and architecture design
- **Phase 2**: GPU infrastructure setup (MIG, Time-Slicing, NVIDIA GPU Operator)
- **Phase 3**: Model serving (vLLM → Ray Serve → MoE → NeMo)
- **Phase 4**: Inference gateway and dynamic routing (LiteLLM)
- **Phase 5**: RAG data layer (Milvus vector database)
- **Phase 6**: Agent deployment (Kagent CRD)
- **Phase 7**: Monitoring (Langfuse, Prometheus)
- **Phase 8**: Evaluation (Ragas)

### Key Technologies
- **Model Serving**: vLLM, Ray Serve, NeMo, SGLang
- **Routing**: LiteLLM (multi-provider abstraction)
- **Orchestration**: LangGraph (workflow engine)
- **Monitoring**: Langfuse (GenAI observability), Prometheus
- **Vector DB**: Milvus
- **Agent Management**: Kagent (Kubernetes CRD)
- **GPU**: NVIDIA GPU Operator, MIG, Time-Slicing
- **Autoscaling**: Karpenter (node-level), HPA/VPA (pod-level)
- **Evaluation**: Ragas (RAG quality metrics)

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run build` must succeed
- Mermaid diagram syntax must be valid

### Common Patterns
- Cost optimization strategies prominently featured
- Emphasis on GPU resource efficiency (MIG vs Time-Slicing trade-offs)
- Multi-LLM provider integration patterns (fallback, load balancing)
- Zero Trust security principles
- Cloud bursting architectures (on-premises + cloud hybrid)
- Spot instance usage for cost reduction

## Dependencies

### Internal
- Referenced by `sidebars.js` at project root (sidebar_position: 3)
- English translations at `i18n/en/docusaurus-plugin-content-docs/current/agentic-ai-platform/`
- Cross-references to:
  - `/docs/operations-observability` (AI/ML workload monitoring)
  - `/docs/infrastructure-optimization` (GPU performance)
  - `/docs/hybrid-infrastructure` (hybrid AI deployment)

### External
- AWS EKS (Amazon Elastic Kubernetes Service)
- NVIDIA GPU Operator and drivers
- OpenAI, Anthropic, Google Gemini APIs
- Hugging Face model hub

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
