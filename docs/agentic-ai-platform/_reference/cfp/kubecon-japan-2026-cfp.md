# KubeCon + CloudNativeCon Japan 2026 — CFP Submissions

> **Event**: July 29-30, 2026 | Yokohama, Japan
> **CFP Deadline**: March 29, 2026 at 23:59 JST
> **Submit at**: https://sessionize.com/kubecon-cloudnativecon-japan-2026/
> **Limits**: Title ≤ 100 chars, Description ≤ 1000 chars
> **Session Presentation**: 1-2 speakers, 30 minutes

---

## Submission 1 (Priority: Highest)

### Session Information

- **Track**: AI + ML
- **Submission Type**: Session Presentation (30 minutes)
- **Is Case Study**: Yes
- **Speakers**: YoungJoon Jeong (AWS) + Seol Heo (LG U+)

### Title

From RAG to Agentic AI: 2-Tier Inference Gateway with KV-Cache Routing on Kubernetes

### Description

A Korean telecom evolved from a RAG pipeline to a production agentic AI platform serving a dozen services — call agents, network diagnostics, workflow automation — on Amazon EKS.

The core is a 2-Tier Inference Gateway on Gateway API. Tier 1 (Kgateway) handles mTLS, rate limiting, and topology-aware routing. Tier 2 splits into Bifrost for multi-provider LLM routing with cascade SLM/LLM selection and semantic caching, and llm-d for self-hosted vLLM with KV cache-aware scheduling — reducing TTFT by 40-50% on cache hits.

Behind the gateway: LoRA fine-tuning, Ragas evaluation (faithfulness, relevancy, context precision), MLflow canary promotion. DCGM Exporter and DRA provide MIG-level GPU partitioning on H100, Karpenter autoscaling on GPU metrics.

The session shares Gateway API CRD configs, Bifrost routing rules, and DCGM thresholds from production.

### Benefits to the Ecosystem

This session addresses the gap between single-model vLLM demos and production multi-model platforms. Each component — LoRA+Ragas model pipeline, DCGM/DRA GPU partitioning, llm-d KV cache-aware routing — is independently adoptable. As a telecom end-user, the metrics and operational lessons shared reflect real production experience, not synthetic benchmarks.

### CNCF Hosted Projects

- Kubernetes (Graduated)
- Envoy Proxy (Graduated)
- Prometheus (Graduated)
- OpenTelemetry (Incubating)
- Cilium (Graduated)
- Kgateway (Sandbox)
- Gateway API (Kubernetes SIG)
- llm-d (Sandbox)

### Other Open-Source Projects

- Bifrost (Apache 2.0) — Multi-provider LLM gateway
- Karpenter (Apache 2.0) — GPU-aware node autoscaling
- Ragas (Apache 2.0) — LLM evaluation framework
- vLLM (Apache 2.0) — High-throughput LLM serving
- MLflow (Apache 2.0) — Model registry and experiment tracking

---

## Submission 2 (Priority: High)

### Session Information

- **Track**: Operations + Performance
- **Submission Type**: Session Presentation (30 minutes)
- **Is Case Study**: Yes
- **Speakers**: YoungJoon Jeong (AWS) + Sumin Kim (LG U+)

### Title

KV Cache-Aware Routing and GPU Scheduling for LLM Inference on Kubernetes

### Description

Standard Kubernetes load balancing treats LLM pods as interchangeable, but each vLLM pod holds different KV caches. Round-robin routing forces redundant prefill computation, increasing time-to-first-token (TTFT).

This session presents how a Korean telecom solved this with a 2-Tier Gateway on EKS. Tier 1 (Kgateway) manages traffic via Gateway API with topology-aware routing. Tier 2: Bifrost for external provider cascade routing, llm-d for self-hosted vLLM with prefix-based KV cache scheduling via InferenceModel/InferencePool CRDs, and disaggregated prefill/decode serving.

DCGM Exporter tracks GPU utilization and feeds Karpenter autoscaling. DRA provides MIG-level partitioning for multi-model co-location on H100s. Measured results: 40-50% TTFT reduction on cache hits, GPU utilization above 70%. The session covers CRD configs, DCGM thresholds, and Karpenter NodePool tuning.

### Benefits to the Ecosystem

llm-d with Gateway API Inference Extension reached v1.0 in early 2026, but production operational data is scarce. This session contributes measured latency and GPU utilization results from real telecom workloads. The CRD configurations, DCGM integration, and Karpenter GPU scaling patterns are directly reproducible on any Kubernetes cluster running vLLM.

### CNCF Hosted Projects

- Kubernetes (Graduated)
- Envoy Proxy (Graduated)
- Prometheus (Graduated)
- OpenTelemetry (Incubating)
- Kgateway (Sandbox)
- Gateway API (Kubernetes SIG)
- llm-d (Sandbox)

### Other Open-Source Projects

- Bifrost (Apache 2.0) — Multi-provider LLM gateway
- Karpenter (Apache 2.0) — GPU-aware node autoscaling
- vLLM (Apache 2.0) — High-throughput LLM serving
- NVIDIA DCGM (Apache 2.0) — GPU telemetry

---

## Submission 3 (Priority: Medium)

### Session Information

- **Track**: Platform Engineering
- **Submission Type**: Session Presentation (30 minutes)
- **Is Case Study**: Yes
- **Speakers**: YoungJoon Jeong (AWS) + Sumin Kim (LG U+)

### Title

A Telecom's Agentic AI Platform: 2-Tier Gateway, LoRA Pipelines, and GPU Scheduling

### Description

A Korean telecom evolved from a RAG chatbot to shared agentic AI infrastructure powering call agents, network diagnostics, code review, and workflow automation on Amazon EKS.

Inference routing uses a 2-Tier Gateway on Gateway API. Tier 1 (Kgateway): mTLS, rate limiting, topology-aware routing. Tier 2: Bifrost for multi-provider orchestration with cascade SLM/LLM routing and semantic caching, llm-d for self-hosted vLLM with KV cache-aware scheduling and disaggregated prefill/decode serving. MCP/A2A agent sessions use stateful connection affinity.

Model pipeline: LoRA fine-tuning on telecom data, Ragas evaluation, MLflow canary promotion. Domain-adapted SLMs outperform general LLMs on telecom tasks. GPU management: DCGM Exporter + DRA MIG partitioning run multiple LoRA models per H100, Karpenter autoscales on GPU metrics.

Attendees receive CRD configs, Bifrost routing rules, DCGM dashboards, and Ragas pipeline setup.

### Benefits to the Ecosystem

This maps the complete path from RAG chatbot to agentic AI platform on Kubernetes. Each inflection point — model pipeline, GPU multi-tenancy, intelligent routing — includes specific open-source tooling and operational data. The bill of materials represents a validated stack that platform engineering teams can evaluate. As an end-user telecom, the data reflects production constraints — cost, reliability, compliance.

### CNCF Hosted Projects

- Kubernetes (Graduated)
- Envoy Proxy (Graduated)
- Prometheus (Graduated)
- OpenTelemetry (Incubating)
- Cilium (Graduated)
- Kgateway (Sandbox)
- Gateway API (Kubernetes SIG)
- llm-d (Sandbox)

### Other Open-Source Projects

- Bifrost (Apache 2.0) — Multi-provider LLM gateway
- Karpenter (Apache 2.0) — GPU-aware node autoscaling
- Ragas (Apache 2.0) — LLM evaluation framework
- vLLM (Apache 2.0) — High-throughput LLM serving
- MLflow (Apache 2.0) — Model registry and experiment tracking
- Milvus (LF AI & Data, Graduated) — Vector database
- LangGraph (MIT) — Agent workflow orchestration

---

## Speaker Assignments

| Submission | Track | Speaker 1 | Speaker 2 |
|------------|-------|-----------|-----------|
| 1 | AI + ML | YoungJoon Jeong (AWS) | Seol Heo (LG U+) |
| 2 | Operations + Performance | YoungJoon Jeong (AWS) | Sumin Kim (LG U+) |
| 3 | Platform Engineering | YoungJoon Jeong (AWS) | Sumin Kim (LG U+) |

> Note: 각 발표자는 최대 3개 제안에 등록 가능. 채택은 1인당 최대 2개 (패널1 + 비패널1).
> Submission 3은 LG U+ 엔드유저 2명 구성으로 CNCF 심사에서 높은 평가 기대.

## Anonymization Guide

| Internal | CFP Expression |
|----------|---------------|
| Violet (initial platform) | "RAG-based chatbot" / "initial RAG pipeline" |
| ixi Simflow (next-gen platform) | "agentic AI platform" / "multi-model infrastructure" |
| ixi-Gen, EXAONE | "proprietary foundation models" / "in-house FMs" |
| ixi-O | "AI call agent" / "voice-based AI agent" |
| LG U+ | LG U+ (public, end-user company) |

## Submission Checklist

- [ ] Submission 1: Session — "From RAG to Agentic AI" (AI + ML) — YoungJoon + Seol
- [ ] Submission 2: Session — "KV Cache-Aware Routing and GPU Scheduling" (Ops + Perf) — YoungJoon + Sumin
- [ ] Submission 3: Session — "A Telecom's Agentic AI Platform" (Platform Eng) — YoungJoon + Sumin
- [ ] All speaker profiles completed on Sessionize
- [ ] Bios written in third person (English)
- [ ] Photos uploaded (optional at submission, required if accepted)
