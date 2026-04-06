# AgentCon Berlin 2026 — CFP Submissions

> **Event**: May 19, 2026 | CODE University, Berlin, Germany
> **CFP Deadline**: April 6, 2026
> **Submit at**: https://sessionize.com/agentcon-berlin
> **Formats**: Technical Session (25-45 min) / Hands-on Workshop (60-90 min)

---

## Submission 1 (Priority: Highest)

### Session Information

- **Format**: Technical Session (30 minutes)
- **Speaker**: YoungJoon Jeong (AWS)

### Title

Cascade Routing for AI Agents: Cost-Optimized Multi-LLM Orchestration in Production

### Description

When AI agents call LLMs, routing matters. A single agent may need a fast, cheap SLM for classification, a mid-tier model for summarization, and a premium LLM for complex reasoning — all within one workflow. Sending every request to GPT-4 class models wastes budget; sending everything to small models degrades quality.

This session presents a production cascade routing pattern from a Korean telecom's agentic AI platform serving call agents, network diagnostics, and workflow automation. The 2-Tier Gateway architecture separates concerns: Tier 1 handles authentication, rate limiting, and topology-aware routing. Tier 2 implements intelligent model selection — Bifrost routes across 100+ external providers with cascade SLM→LLM fallback and semantic caching, while llm-d schedules self-hosted vLLM instances with KV cache-aware prefix matching, reducing time-to-first-token by 40-50%.

Key patterns covered:
- **Cascade routing**: Route to cheapest-capable model first, escalate on confidence thresholds
- **Semantic caching**: Deduplicate similar agent queries, cutting redundant LLM calls by 30%+
- **KV cache scheduling**: Route repeat-context requests to pods holding relevant caches
- **Cost tracking**: Per-agent, per-model token metering with budget alerts

Attendees leave with routing rule examples, cost comparison data, and the decision framework for when to self-host vs. use external providers.

### Why This Talk

Most agent tutorials show a single LLM call. Production agents make dozens of LLM calls per session across different models and providers. This session fills the gap between "hello world" agent demos and real multi-model orchestration — with operational data, not theory.

---

## Submission 2 (Priority: High)

### Session Information

- **Format**: Technical Session (30 minutes)
- **Speaker**: YoungJoon Jeong (AWS)

### Title

MCP and A2A in the Real World: Agent Interoperability Beyond the Demo

### Description

Model Context Protocol (MCP) and Agent-to-Agent (A2A) communication promise a world where AI agents seamlessly share tools and collaborate. But how does this work in production, where you need authentication, tool validation, stateful sessions, and failure handling?

This session shares practical lessons from implementing MCP/A2A on a telecom's agentic AI platform where multiple specialized agents — call handling, network diagnostics, billing inquiry, workflow automation — must interoperate.

We cover three layers of agent interoperability:

**1. Tool Integration via MCP**
Agents declare tool dependencies as structured schemas. A centralized tool registry validates capabilities, enforces allowed-tool lists to prevent tool poisoning, and limits response sizes. Each agent session gets JWT-scoped tool access — a billing agent cannot invoke network diagnostic tools.

**2. Agent-to-Agent Communication via A2A**
When a call agent needs network diagnostic results, it delegates via A2A protocol rather than duplicating logic. We show the handoff pattern: task delegation, async result retrieval, timeout handling, and graceful degradation when a downstream agent is unavailable.

**3. Declarative Agent Lifecycle**
Agents, tools, and workflows are defined as Kubernetes custom resources. An operator reconciles desired state — scaling, health checks, rollback — so agent deployments are as reliable as any microservice.

The session includes live architecture diagrams, failure scenario walkthroughs, and the security model that makes multi-agent communication safe for enterprise use.

### Why This Talk

MCP and A2A are emerging standards with growing adoption but limited production case studies. This session provides concrete implementation patterns, security considerations, and failure modes that framework documentation doesn't cover.

---

## Submission 3 (Priority: High)

### Session Information

- **Format**: Technical Session (25 minutes)
- **Speaker**: YoungJoon Jeong (AWS)

### Title

Evaluating and Monitoring AI Agents at Scale: From Vibes to Metrics

### Description

"It seems to work" is not a deployment strategy. When a telecom moves from a RAG chatbot to a multi-service agentic AI platform, the question shifts from "does the model generate text?" to "does the agent reliably complete tasks across thousands of daily sessions?"

This session presents the evaluation and monitoring stack built for a production agentic platform serving call center agents, network diagnostics, and automated workflows.

**Offline Evaluation — Before Deployment:**
Using the Ragas framework, every model update passes four quality gates: Faithfulness (hallucination rate), Answer Relevancy, Context Precision, and Context Recall. A CI/CD pipeline runs 50+ evaluation queries on each PR that touches the RAG pipeline. Domain-adapted SLMs fine-tuned with LoRA on telecom data are compared against general LLMs — the smaller models consistently outperform on domain tasks at 1/10th the cost.

**Online Monitoring — After Deployment:**
Langfuse traces every agent session end-to-end: LLM inference latency, tool execution time, token usage, cost per model. Prometheus metrics feed Grafana dashboards with alerts on error rate (>5%), P99 latency (>10s), and daily budget overruns. Per-agent, per-model cost attribution answers "which agent is burning budget and why?"

**The Feedback Loop:**
Low-scoring production traces feed back into the evaluation dataset. Weekly reviews identify pattern failures — wrong tool selection, hallucinated actions, timeout cascades — and generate targeted test cases. This closed loop has improved Faithfulness scores from 0.72 to 0.91 over six months.

### Why This Talk

Agent quality is every builder's unsolved problem. This session provides a copy-paste-ready evaluation pipeline (Ragas + CI/CD), a monitoring stack (Langfuse + Prometheus), and the operational playbook for continuous agent improvement.

---

## Speaker Profile

### YoungJoon Jeong

- **Title**: Senior Specialist Solutions Architect, Containers
- **Company**: Amazon Web Services (AWS)
- **GitHub**: https://github.com/devfloor9
- **LinkedIn**: https://www.linkedin.com/in/youngjoonjeong/

### Bio (English, 3rd person)

YoungJoon Jeong is a Specialist Solutions Architect at AWS, focusing on Kubernetes platform engineering and AI/ML infrastructure. He works with enterprises across APJC on production agentic AI platforms, including inference gateway design, GPU scheduling, and agent lifecycle management. He maintains an open-source engineering playbook covering AI platform architecture, model serving patterns, and cloud-native operations.

---

## Anonymization Guide

| Internal | CFP Expression |
|----------|---------------|
| Violet (initial platform) | "RAG-based chatbot" / "initial RAG pipeline" |
| ixi Simflow (next-gen) | "agentic AI platform" / "multi-agent platform" |
| ixi-Gen, EXAONE | "domain-adapted SLMs" / "fine-tuned models" |
| ixi-O | "AI call agent" / "voice-based AI agent" |
| LG U+ | "a Korean telecom" (커뮤니티 행사이므로 고객사명 비공개 권장) |

## KubeCon CFP와의 차별화

| 관점 | KubeCon Japan | AgentCon Berlin |
|------|--------------|-----------------|
| 프레이밍 | K8s 인프라 중심 (CRD, DCGM, Karpenter) | Agent 패턴 중심 (라우팅, 통신, 품질) |
| 청중 | 플랫폼 엔지니어, SRE | Agent 빌더, AI 개발자 |
| 기술 용어 | Gateway API, InferencePool, DRA | Cascade routing, MCP/A2A, Ragas |
| 차별점 | CNCF 프로젝트 기여 강조 | 프로덕션 경험/패턴 공유 강조 |

## Submission Checklist

- [ ] Submission 1: "Cascade Routing for AI Agents" — YoungJoon
- [ ] Submission 2: "MCP and A2A in the Real World" — YoungJoon
- [ ] Submission 3: "Evaluating and Monitoring AI Agents at Scale" — YoungJoon
- [ ] Speaker profile completed on Sessionize
- [ ] Bio written in third person (English)
- [ ] Photo uploaded
