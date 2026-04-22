---
title: "Custom Model Pipeline Guide"
sidebar_label: "Custom Model Pipeline"
description: "Building a domain-optimized model serving pipeline with LoRA Fine-tuning, Multi-LoRA Hot-swap, and SLM Cascade Routing"
created: 2026-04-06
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags: [lora, fine-tuning, cascade-routing, multi-lora, slm, pipeline, vllm, bifrost, 'scope:impl']
---

## Overview

### Why You Need a Custom Model Pipeline

SaaS-based AI coding tools (e.g., Kiro, GitHub Copilot) offer a quick start, but they hit fundamental limitations in enterprise environments.

| Constraint | SaaS (Kiro, etc.) | Self-hosted Pipeline |
|-----------|-------------------|---------------------|
| **LoRA Fine-tuning** | Not possible | Domain-specific adapter training |
| **Data Sovereignty** | Code sent externally | Stays within VPC |
| **Model Selection** | Limited to provided models | Free choice of open-source models |
| **Cost Control** | Fixed per-token pricing | 66% savings possible with SLM Cascade |
| **Per-customer Optimization** | Shared general-purpose model | Multi-LoRA for customer-specific specialization |

:::info Core Strategy
The **Base Model + LoRA adapter** pattern serves multiple domain-specialized models simultaneously on a single GPU. Since base model weights are shared, GPU memory efficiency is maximized.
:::

### End-to-End Pipeline Flow

```mermaid
graph LR
    subgraph "Training Pipeline"
        D[Domain Data] --> P[Data Preprocessing]
        P --> T[QLoRA Fine-tuning]
        T --> E[Evaluation RAGAS + SWE-bench]
        E -->|Pass| R[Adapter Registry S3/ECR]
        E -->|Fail| P
    end
    
    subgraph "Serving Pipeline"
        R --> V[vLLM Multi-LoRA]
        SLM[SLM 8B] --> BF[Bifrost Cascade]
        V --> BF
        BF --> KGW[kgateway]
        KGW --> C[Aider/Cline/Client]
    end
    
    subgraph "Monitoring"
        BF -->|OTel| LF[Langfuse]
        V -->|metrics| AMP[AMP/AMG]
    end
```

The training pipeline trains domain data with QLoRA, and only adapters that pass evaluation are registered in the registry. The serving pipeline loads multiple adapters simultaneously with vLLM Multi-LoRA and performs cost-optimized routing between SLM/LLM through Bifrost Cascade.

:::tip Related Documentation
- [Operations & MLOps](../../operations-mlops/index.md) - Full operations architecture
- [Custom Model Deployment Guide](./custom-model-deployment.md) - Includes Kiro vs. self-hosted comparison
:::

---

## LoRA Training & Deployment Pipeline (Domain Specialization)

This section covers how to implement LoRA Fine-tuning and Multi-LoRA hot-swap deployment in the domain specialization strategy. For strategic background and decision criteria for domain specialization, see [Domain Customization (LoRA + RAG)](../../operations-mlops/governance/domain-customization.md).

---

### LoRA Fine-tuning Pipeline

#### QLoRA GPU Savings

**QLoRA** (Quantized LoRA) trains only the LoRA adapter while keeping the base model quantized to INT4. This dramatically reduces GPU requirements compared to full fine-tuning.

| Model | Full Fine-tuning | LoRA | QLoRA |
|-------|-----------------|------|-------|
| **Llama-3.3-70B** | H100×32 (impractical) | H100×8 | **H100×4** |
| **VRAM** | 280 GB | 80 GB | **40 GB** |
| **Training Time** | - | 5 days | **2-3 days** |
| **Cost** | - | $8,000 | **$2,000** |

:::warning INT4 Quantization Precision
QLoRA keeps base model weights in INT4 during training, so tasks requiring extremely precise numerical computations (e.g., financial calculations) may show slight accuracy differences compared to LoRA (FP16). Always validate in the domain evaluation stage.
:::

#### Training Data Format

Prepare training data as input-output pairs in JSONL format.

```json
{
  "input": "COBOL: PERFORM CALC-INTEREST USING WS-PRINCIPAL WS-RATE.",
  "output": "Java: @Transactional public BigDecimal calcInterest(BigDecimal principal, BigDecimal rate) { return principal.multiply(rate).setScale(2, RoundingMode.HALF_UP); }"
}
```

**Data Collection Strategy:**

| Source | Transformation Method | Expected Data Volume |
|--------|----------------------|---------------------|
| Legacy COBOL code | Generate COBOL → Java translation pairs | 10,000+ modules |
| Internal frameworks | Framework pattern → code pairs | 5,000+ patterns |
| Code review history | Pre-fix → post-fix pairs | 20,000+ commits |
| Technical docs | Documentation → implementation code pairs | 3,000+ pages |

:::tip Data Quality Determines Model Quality
**Quality** matters more than quantity. 1,000 high-quality pairs reviewed by senior developers are more effective than 10,000 auto-generated ones. Start with at least 500 reviewed pairs.
:::

#### Training Frameworks

#### NeMo Framework (NVIDIA)

NVIDIA's official framework optimized for large-scale model training. Natively supports multi-GPU and multi-node distributed training.

```bash
python train_lora.py \
  --config-path=conf \
  --config-name=llama3_70b_lora \
  model.data.train_ds.file_path=cobol_to_java.jsonl \
  model.peft.lora_tuning.adapter_dim=16
```

:::info Key NeMo Configuration Parameters
- `adapter_dim` (rank): 16 is typical. Can increase to 32-64 for complex domains
- `adapter_dropout`: 0.05 recommended (prevents overfitting)
- `target_modules`: attention layers (`q_proj`, `k_proj`, `v_proj`, `o_proj`)
:::

#### Unsloth (2× Faster Training)

An open-source library that doubles LoRA/QLoRA training speed on a single node while reducing memory usage by up to 50%.

```python
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="meta-llama/Llama-3.3-70B-Instruct",
    max_seq_length=4096,
    load_in_4bit=True,  # QLoRA: INT4 quantization
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,                # LoRA rank
    lora_alpha=32,       # LoRA scaling factor
    target_modules=["q_proj", "k_proj", "v_proj"],
)

trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    max_seq_length=4096,
)
trainer.train()
```

| Framework | Strengths | Best For |
|-----------|----------|---------|
| **NeMo** | Multi-node distributed training, official NVIDIA support | H100 cluster available, large-scale training |
| **Unsloth** | 2× faster training, memory savings, simple API | Single node, rapid prototyping |

#### Checkpoint Management

Trained LoRA adapters are stored in S3 with version management via MLflow.

```bash
# Adapter storage structure
s3://model-registry/
  └── lora-adapters/
      ├── bank-ledger/
      │   ├── v1.0/adapter_model.safetensors
      │   ├── v1.1/adapter_model.safetensors
      │   └── latest -> v1.1
      ├── stock-order/
      │   └── v1.0/adapter_model.safetensors
      └── insurance-contract/
          └── v1.0/adapter_model.safetensors
```

:::tip MLflow Integration
Recording training metrics (loss, accuracy) alongside adapter paths in MLflow lets you track which dataset and hyperparameter combinations are optimal.
:::

- Reference: [NeMo Framework Checkpoint Management](../../model-serving/inference-frameworks/nemo-framework.md)

---

### Multi-LoRA Hot-swap Deployment

#### Architecture

Leveraging vLLM's Multi-LoRA feature, you can load multiple LoRA adapters simultaneously on top of a single base model to serve customized responses per customer.

```mermaid
graph TD
    G[Bifrost Gateway] --> V[vLLM Server]
    V --> B[Base Model: GLM-5]
    B --> L1[LoRA: Bank Ledger]
    B --> L2[LoRA: Stock Order]
    B --> L3[LoRA: Insurance Contract]
    L1 -->|Customer A| R1[Response]
    L2 -->|Customer B| R2[Response]
    L3 -->|Customer C| R3[Response]
```

:::info Multi-LoRA Memory Efficiency
The base model (e.g., 70B) is loaded into GPU memory only once. Each LoRA adapter at rank 16 is approximately **100-200MB**, so even loading 10 adapters simultaneously adds less than 2GB of additional memory.
:::

#### vLLM Multi-LoRA Configuration

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --enable-lora \
  --lora-modules \
    bank-ledger=/models/lora/bank \
    stock-order=/models/lora/stock \
    insurance-contract=/models/lora/insurance \
  --max-lora-rank 16
```

**Key Options:**

| Option | Description | Default |
|--------|------------|---------|
| `--enable-lora` | Enable Multi-LoRA | `false` |
| `--lora-modules` | Register adapters as `name=path` | - |
| `--max-lora-rank` | Maximum LoRA rank | 16 |
| `--max-loras` | Maximum adapters loaded simultaneously | 1 |
| `--max-cpu-loras` | Number of adapters cached in CPU memory | - |

:::caution Hot-swap Considerations
vLLM loads adapters into GPU memory at request time. Using more adapters than `--max-loras` causes **swap latency** (hundreds of ms). Set `--max-loras` to match the number of frequently used adapters.
:::

#### Specifying Adapters in Requests

Make requests via the OpenAI-compatible API and specify the LoRA name in `extra_body`.

```python
response = client.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct",
    messages=[{"role": "user", "content": "Convert this COBOL ledger code to Java"}],
    extra_body={"lora_name": "bank-ledger"}
)
```

#### Per-customer Routing (Bifrost + X-Customer-Domain Header)

Use kgateway's HTTPRoute for HTTP header-based per-customer LoRA adapter routing.

```yaml
# kgateway HTTPRoute - Per-customer LoRA routing
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: lora-routing
spec:
  rules:
  - matches:
    - headers:
      - name: X-Customer-Domain
        value: bank
    backendRefs:
    - name: vllm-svc
      port: 8000
```

:::tip Routing Flow
Client (Aider/Cline) → Sets `X-Customer-Domain: bank` header → kgateway → Bifrost → vLLM (auto-maps to `lora_name=bank-ledger`)
:::

#### Per-customer Inference Tracking and Cost Billing

Track each customer's inference requests with an LLM tracing system to monitor per-adapter performance and bill monthly costs.

```python
from langfuse import Langfuse

langfuse = Langfuse()

trace = langfuse.trace(
    name="inference",
    user_id="customer-bank-A",
    metadata={
        "lora": "bank-ledger",
        "model": "glm-5-32b",
        "domain": "ledger"
    }
)
```

**Monthly Cost Billing Example:**

| Customer | Requests | Tokens | GPU Time | Cost |
|----------|---------|---------|----------|------|
| **Bank A** | 100,000 | 500M | 50 hours | $2,500 |
| **Securities B** | 50,000 | 250M | 25 hours | $1,250 |
| **Insurance C** | 30,000 | 150M | 15 hours | $750 |

For implementation details, see [Agent Monitoring](../../operations-mlops/observability/agent-monitoring.md) and [LLM Tracing Deployment](../integrations/monitoring-observability-setup.md).

---

## SLM Cascade Routing (Cost Optimization)

### Cascade Architecture

Sending every request to a large model (LLM) is wasteful. 70% of requests can be handled adequately by a small model (SLM).

```mermaid
graph LR
    Req[Request] --> BF[Bifrost]
    BF -->|Low complexity| SLM[SLM Llama-3.3-8B<br/>g6.xlarge $0.3/hr]
    BF -->|High complexity| LLM[GLM-5 744B<br/>p5en.48xlarge $12/hr]
    SLM --> Resp[Response]
    LLM --> Resp
    
    style SLM fill:#2ecc71
    style LLM fill:#e74c3c
```

### Cost Analysis

| | SLM Only | LLM Only | **Cascade (70:30)** |
|---|---|---|---|
| **Monthly Cost** | $500 | $8,900 | **$3,020** |
| **Accuracy** | 70% | 95% | **92%** |
| **Cost Savings** | - | - | **66%** |

:::tip ROI Calculation
Adopting Cascade saves $5,880/month ($70,560/year). Setup takes only 1-2 days, making it **immediately worthwhile**.
:::

### Bifrost Cascade Config

```json
{
  "providers": {
    "openai": {
      "keys": [
        {
          "name": "slm",
          "value": "dummy",
          "weight": 0.7,
          "models": ["llama-8b"]
        },
        {
          "name": "llm",
          "value": "dummy",
          "weight": 0.3,
          "models": ["glm5"]
        }
      ],
      "network_config": {
        "base_url": "http://glm5-serving:8000"
      }
    }
  }
}
```

:::caution Bifrost Cascade Limitations
Bifrost's current cascade routing operates at the **provider level** and does not support automatic routing based on request complexity. It works with simple weight-based distribution or fallback conditions (5xx, latency exceeded). Complexity-based routing must be implemented with llm-d or custom logic.
:::

### SLM Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-slm
  namespace: agentic-serving
spec:
  replicas: 1
  selector:
    matchLabels:
      app: vllm-slm
  template:
    metadata:
      labels:
        app: vllm-slm
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: g6.xlarge
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        command: ["vllm", "serve"]
        args:
          - "meta-llama/Llama-3.3-8B-Instruct"
          - "--served-model-name=llama-8b"
          - "--tensor-parallel-size=1"
          - "--max-model-len=32768"
          - "--host=0.0.0.0"
          - "--port=8000"
        resources:
          limits:
            nvidia.com/gpu: 1
        ports:
        - containerPort: 8000
          name: http
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
---
apiVersion: v1
kind: Service
metadata:
  name: vllm-slm-svc
  namespace: agentic-serving
spec:
  selector:
    app: vllm-slm
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
```

:::info g6.xlarge Instance Specs
- GPU: 1× NVIDIA L4 (24GB VRAM)
- Cost: ~$0.31/hr (On-Demand), ~$0.09/hr (Spot)
- Sufficient for serving 8B models
:::

- Reference: [Cost Threshold Analysis](../integrations/coding-tools-cost-analysis.md#5-cost-threshold-analysis-bedrock-vs-kiro-vs-self-hosting)

---

## Evaluation Pipeline

### LoRA Adapter Evaluation Matrix

Trained adapters must pass multiple evaluations before deployment.

| Evaluation Method | Purpose | Tool | Automation |
|------------------|---------|------|-----------|
| **RAGAS** | RAG accuracy (faithfulness, relevancy) | ragas | CI/CD integration |
| **SWE-bench** | Coding quality (real issue resolution) | swe-bench | CI/CD integration |
| **Domain Expert Review** | Business correctness validation | Langfuse Annotation | Manual |
| **Red-teaming** | Security/safety (prompt injection, etc.) | Garak | CI/CD integration |

:::warning Evaluation Thresholds
Minimum criteria for adapter deployment:
- RAGAS Faithfulness: ≥ 0.85
- SWE-bench Resolved: ≥ 30%
- Domain expert approval: At least 2 out of 3
- Garak security test: 0 critical findings
:::

### LoRA A/B Testing

Before deploying a new adapter version, compare performance using LLM tracing system tags for A/B testing. Recording the `lora` version in request metadata as a tag allows per-adapter performance comparison in the dashboard.

For implementation examples, see [Agent Monitoring - A/B Testing](../../operations-mlops/observability/agent-monitoring.md).

**A/B Test Comparison Metrics:**

| Metric | Measurement | Meaning |
|--------|------------|---------|
| Accuracy | SWE-bench / domain tests | Code conversion correctness |
| Latency | LLM tracing p50/p95 | Response speed |
| Token Efficiency | output_tokens / input_tokens | Answer conciseness |
| User Satisfaction | Annotation Score | Real user evaluation |

- Reference: [RAGAS Evaluation Framework](../../operations-mlops/governance/ragas-evaluation.md)
- Reference: [LLMOps Observability Evaluation Pipeline](../../operations-mlops/observability/llmops-observability.md)

---

## Phased Implementation Roadmap

| Phase | Timeline | Components | Cost (USD) | Key Actions |
|-------|----------|-----------|-----------|------------|
| **1** | Immediate | Base Model + Steering | $8,900/mo (GPU) | vLLM deployment, Bifrost + Langfuse integration |
| **2** | 1-2 weeks | + VectorRAG | +infra | Milvus deployment, internal document embedding |
| **3** | 2-4 weeks | + SLM Cascade | +$500/mo | SLM deployment, Bifrost cascade configuration |
| **4** | 1-2 months | + LoRA Fine-tuning | +$2K (one-time) | Training data collection → QLoRA → Evaluation → Multi-LoRA deployment |

```mermaid
gantt
    title Custom Model Pipeline Implementation Roadmap
    dateFormat YYYY-MM-DD
    section Phase 1
        vLLM Deployment      :p1a, 2026-04-07, 3d
        Bifrost + Langfuse   :p1b, after p1a, 2d
    section Phase 2
        Milvus Deployment    :p2a, after p1b, 3d
        Document Embedding   :p2b, after p2a, 4d
    section Phase 3
        SLM Deployment       :p3a, after p2b, 2d
        Cascade Setup        :p3b, after p3a, 3d
    section Phase 4
        Data Collection      :p4a, after p3b, 14d
        QLoRA Training       :p4b, after p4a, 7d
        Evaluation + Deploy  :p4c, after p4b, 7d
```

:::tip Return on Investment (ROI)
Upon completing Phase 4:
- **COBOL→Java migration**: 10,000 modules × 1.5 hours saved = **15,000 hours saved** (~$750K)
- **LoRA training cost**: $2,000 (one-time)
- **Monthly operational savings**: $5,880 (Cascade effect)
- **ROI: 375×**
:::

---

## References

### Official Documentation

| Resource | Link |
|----------|------|
| LoRA Paper (Hu et al., 2021) | [arxiv.org/abs/2106.09685](https://arxiv.org/abs/2106.09685) |
| QLoRA Paper (Dettmers et al., 2023) | [arxiv.org/abs/2305.14314](https://arxiv.org/abs/2305.14314) |
| vLLM Multi-LoRA | [docs.vllm.ai/en/latest/models/lora.html](https://docs.vllm.ai/en/latest/models/lora.html) |
| Unsloth Fast Training | [github.com/unslothai/unsloth](https://github.com/unslothai/unsloth) |
| NeMo Framework | [docs.nvidia.com/nemo-framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/) |
| RAGAS Evaluation | [docs.ragas.io](https://docs.ragas.io/) |
| Bifrost AI Gateway | [docs.getbifrost.ai](https://docs.getbifrost.ai/) |
| Agent Monitoring | [agent-monitoring.md](../../operations-mlops/observability/agent-monitoring.md) |
| LLM Tracing Deployment | [monitoring-observability-setup.md](../integrations/monitoring-observability-setup.md) |
| Custom Model Deployment Guide | [custom-model-deployment.md](./custom-model-deployment.md) |
