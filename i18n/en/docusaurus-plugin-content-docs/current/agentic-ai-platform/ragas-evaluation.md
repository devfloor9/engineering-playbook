---
title: "Ragas RAG Evaluation Framework"
sidebar_label: "Ragas Evaluation"
description: "Evaluate and continuously improve RAG pipeline quality using Ragas"
sidebar_position: 9
tags:
  - ragas
  - rag
  - evaluation
  - llm
  - quality
  - genai
  - testing
---

# Ragas RAG Evaluation Framework

Ragas (RAG Assessment) is an open-source framework for objectively evaluating the quality of RAG (Retrieval-Augmented Generation) pipelines. It is essential for measuring performance of RAG systems in the Agentic AI platform and continuously improving them.

## Overview

### Why RAG Evaluation is Needed

RAG systems consist of multiple components (retrieval, generation, context processing), making it difficult to measure overall quality:

```mermaid
graph LR
    subgraph "RAG Pipeline"
        Q["Question"]
        R["Retrieval"]
        C["Context"]
        G["Generation"]
        A["Answer"]
    end

    subgraph "Evaluation Points"
        E1["Retrieval Quality"]
        E2["Context Relevancy"]
        E3["Answer Accuracy"]
        E4["Answer Faithfulness"]
    end

    Q --> R
    R --> C
    C --> G
    G --> A

    R -.-> E1
    C -.-> E2
    A -.-> E3
    A -.-> E4

    style E1 fill:#4285f4,stroke:#333
    style E2 fill:#34a853,stroke:#333
    style E3 fill:#fbbc04,stroke:#333
    style E4 fill:#ea4335,stroke:#333
```

### Ragas Core Metrics

| Metric | Measures | Description |
| --- | --- | --- |
| Faithfulness | Generation Quality | Whether answer is faithful to context |
| Answer Relevancy | Generation Quality | Whether answer is relevant to question |
| Context Precision | Retrieval Quality | Precision of retrieved context |
| Context Recall | Retrieval Quality | Whether required information is retrieved |
| Context Relevancy | Retrieval Quality | Whether context is relevant to question |
| Answer Correctness | Overall Quality | Answer accuracy |

## Installation and Basic Setup

### Python Environment Setup

```bash
# Install Ragas
pip install ragas langchain-openai datasets

# Additional dependencies
pip install pandas numpy
```

### Basic Evaluation Code

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

# Prepare evaluation dataset
eval_data = {
    "question": [
        "How do you perform GPU scheduling in Kubernetes?",
        "What are the key features of Karpenter?",
    ],
    "answer": [
        "GPU scheduling in Kubernetes is performed through NVIDIA Device Plugin...",
        "Karpenter provides automatic node provisioning, consolidation, and drift detection...",
    ],
    "contexts": [
        ["GPU scheduling is through Device Plugin...", "NVIDIA GPU Operator is..."],
        ["Karpenter is a Kubernetes node auto-scaler...", "NodePool CRD is used..."],
    ],
    "ground_truth": [
        "GPU resources are scheduled using NVIDIA Device Plugin and GPU Operator.",
        "Karpenter provides automatic node provisioning, consolidation, drift detection, and disruption handling.",
    ],
}

dataset = Dataset.from_dict(eval_data)

# Run evaluation
results = evaluate(
    dataset,
    metrics=[
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
    ],
)

print(results)
```

## Detailed Explanation of Core Metrics

### 1. Faithfulness

Measures how faithfully the answer adheres to the provided context. This metric is key to detecting hallucinations.

```python
from ragas.metrics import faithfulness

# Faithfulness calculation process:
# 1. Decompose answer into individual claims
# 2. Verify if each claim can be inferred from context
# 3. Faithfulness score = verified claims / total claims

# Score interpretation:
# 1.0: All claims supported by context
# 0.5: Half of claims supported by context
# 0.0: No claims supported by context (severe hallucination)
```

### 2. Answer Relevancy

Measures how relevant the answer is to the question.

```python
from ragas.metrics import answer_relevancy

# Answer Relevancy calculation process:
# 1. Generate questions from answer (reverse engineering)
# 2. Calculate similarity between generated and original questions
# 3. Repeat multiple times and average

# Score interpretation:
# High score: Answer directly relevant to question
# Low score: Answer contains unrelated content
```

### 3. Context Precision

Measures the proportion of actually useful information in retrieved context.

```python
from ragas.metrics import context_precision

# Context Precision calculation:
# - Identify context needed to generate ground truth answer
# - Check if useful information is in top-ranked context
# - Higher scores when relevant context ranks higher
```

### 4. Context Recall

Measures whether information needed to generate the correct answer is included in retrieved context.

```python
from ragas.metrics import context_recall

# Context Recall calculation:
# 1. Decompose ground truth into individual sentences
# 2. Check if each sentence can be inferred from retrieved context
# 3. Recall score = inferable sentences / total sentences
```

## Comprehensive Evaluation Pipeline

### Complete RAG System Evaluation

```python
import os
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
    context_relevancy,
    answer_correctness,
)
from datasets import Dataset
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# LLM configuration (for evaluation)
os.environ["OPENAI_API_KEY"] = "your-api-key"

def evaluate_rag_pipeline(questions, rag_chain, ground_truths):
    """Comprehensive RAG pipeline evaluation"""

    answers = []
    contexts = []

    for question in questions:
        # Run RAG chain
        result = rag_chain.invoke({"query": question})
        answers.append(result["result"])
        contexts.append([doc.page_content for doc in result["source_documents"]])

    # Construct evaluation dataset
    eval_dataset = Dataset.from_dict({
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths,
    })

    # Evaluate with all metrics
    results = evaluate(
        eval_dataset,
        metrics=[
            faithfulness,
            answer_relevancy,
            context_precision,
            context_recall,
            context_relevancy,
            answer_correctness,
        ],
    )

    return results

# Usage example
questions = [
    "How do you set up Karpenter in EKS?",
    "How do you configure GPU node auto-scaling?",
    "How do you set up dynamic routing in Inference Gateway?",
]

ground_truths = [
    "Karpenter is installed via Helm chart and configured with NodePool CRD.",
    "Configure GPU-based scaling by integrating DCGM Exporter metrics with KEDA.",
    "Set up weighted traffic distribution using Gateway API HTTPRoute.",
]

# Run evaluation
results = evaluate_rag_pipeline(questions, rag_chain, ground_truths)
print(results.to_pandas())
```

### Analyze Evaluation Results

```python
import pandas as pd
import matplotlib.pyplot as plt

def analyze_evaluation_results(results):
    """Analyze and visualize evaluation results"""

    df = results.to_pandas()

    # Average score by metric
    metrics_summary = df.mean(numeric_only=True)
    print("=== Average Scores by Metric ===")
    print(metrics_summary)

    # Identify areas for improvement
    print("\n=== Areas Requiring Improvement ===")
    for metric, score in metrics_summary.items():
        if score < 0.7:
            print(f"⚠️ {metric}: {score:.2f} - Improvement needed")
        elif score < 0.85:
            print(f"📊 {metric}: {score:.2f} - Satisfactory")
        else:
            print(f"✅ {metric}: {score:.2f} - Excellent")

    # Visualization
    fig, ax = plt.subplots(figsize=(10, 6))
    metrics_summary.plot(kind='bar', ax=ax, color=['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#9c27b0', '#00bcd4'])
    ax.set_ylabel('Score')
    ax.set_title('RAG Pipeline Evaluation Results')
    ax.set_ylim(0, 1)
    ax.axhline(y=0.7, color='r', linestyle='--', label='Minimum Threshold')
    ax.legend()
    plt.tight_layout()
    plt.savefig('rag_evaluation_results.png')

    return metrics_summary

# Run analysis
summary = analyze_evaluation_results(results)
```

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/rag-evaluation.yml
name: RAG Pipeline Evaluation

on:
  push:
    paths:
      - 'src/rag/**'
      - 'data/knowledge_base/**'
  pull_request:
    paths:
      - 'src/rag/**'
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  evaluate:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install ragas langchain-openai datasets pandas

    - name: Run RAG Evaluation
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      run: |
        python scripts/evaluate_rag.py --output results/evaluation.json

    - name: Check Quality Gates
      run: |
        python scripts/check_quality_gates.py results/evaluation.json

    - name: Upload Results
      uses: actions/upload-artifact@v4
      with:
        name: evaluation-results
        path: results/

    - name: Comment PR with Results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const results = JSON.parse(fs.readFileSync('results/evaluation.json'));

          let comment = '## RAG Evaluation Results\n\n';
          comment += '| Metric | Score | Status |\n';
          comment += '|--------|-------|--------|\n';

          for (const [metric, score] of Object.entries(results.metrics)) {
            const status = score >= 0.7 ? '✅' : '⚠️';
            comment += `| ${metric} | ${score.toFixed(2)} | ${status} |\n`;
          }

          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

### Quality Gate Script

```python
# scripts/check_quality_gates.py
import json
import sys

QUALITY_GATES = {
    "faithfulness": 0.8,
    "answer_relevancy": 0.75,
    "context_precision": 0.7,
    "context_recall": 0.7,
}

def check_quality_gates(results_file):
    with open(results_file) as f:
        results = json.load(f)

    failed_gates = []

    for metric, threshold in QUALITY_GATES.items():
        score = results["metrics"].get(metric, 0)
        if score < threshold:
            failed_gates.append({
                "metric": metric,
                "score": score,
                "threshold": threshold,
            })

    if failed_gates:
        print("❌ Quality gates failed:")
        for gate in failed_gates:
            print(f"  - {gate['metric']}: {gate['score']:.2f} < {gate['threshold']}")
        sys.exit(1)
    else:
        print("✅ All quality gates passed!")
        sys.exit(0)

if __name__ == "__main__":
    check_quality_gates(sys.argv[1])
```

## Kubernetes Job for Periodic Evaluation

### Evaluation Job Definition

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: rag-evaluation
  namespace: genai-platform
spec:
  schedule: "0 6 * * *"  # Daily at 6 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: evaluator
            image: your-registry/rag-evaluator:latest
            env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: openai-credentials
                  key: api-key
            - name: MILVUS_HOST
              value: "milvus-proxy.milvus.svc.cluster.local"
            - name: RESULTS_BUCKET
              value: "s3://rag-evaluation-results"
            command:
            - python
            - /app/evaluate.py
            - --config=/app/config/evaluation.yaml
            - --output=s3
            resources:
              requests:
                cpu: "1"
                memory: "2Gi"
              limits:
                cpu: "2"
                memory: "4Gi"
          restartPolicy: OnFailure
          serviceAccountName: rag-evaluator
```

### Evaluation Configuration ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rag-evaluation-config
  namespace: genai-platform
data:
  evaluation.yaml: |
    evaluation:
      metrics:
        - faithfulness
        - answer_relevancy
        - context_precision
        - context_recall

      test_sets:
        - name: "general_knowledge"
          path: "s3://test-data/general.json"
          weight: 0.4
        - name: "technical_docs"
          path: "s3://test-data/technical.json"
          weight: 0.6

      quality_gates:
        faithfulness: 0.8
        answer_relevancy: 0.75
        context_precision: 0.7
        context_recall: 0.7

      alerts:
        slack_webhook: "https://hooks.slack.com/..."
        threshold_drop: 0.1  # Alert on 10%+ drop
```

## Interpreting Evaluation Results and Improvement Guide

### Per-Metric Improvement Directions

```mermaid
graph TD
    subgraph "Low Faithfulness"
        F1["Add context emphasis to prompt"]
        F2["Lower temperature"]
        F3["Use stronger LLM"]
    end

    subgraph "Low Context Precision"
        CP1["Improve embedding model"]
        CP2["Adjust chunking strategy"]
        CP3["Add re-ranking model"]
    end

    subgraph "Low Context Recall"
        CR1["Increase k for retrieval"]
        CR2["Apply hybrid search"]
        CR3["Expand knowledge base"]
    end

    subgraph "Low Answer Relevancy"
        AR1["Clarify prompt"]
        AR2["Add few-shot examples"]
        AR3["Specify output format"]
    end
```

### Improvement Checklist

| Problem | Possible Cause | Solution |
| --- | --- | --- |
| Faithfulness < 0.7 | LLM ignores context | Emphasize "use context only" in prompt |
| Context Precision < 0.6 | Poor retrieval quality | Upgrade embedding model, add re-ranking |
| Context Recall < 0.6 | Missing relevant docs | Increase k, use hybrid search |
| Answer Relevancy < 0.7 | Rambling answers | Structure prompt, specify output format |

## Related Documentation

- [Milvus Vector Database](./milvus-vector-database.md)
- [Agent Monitoring](./agent-monitoring.md)
- [Agentic AI Platform Architecture](./agentic-platform-architecture.md)

:::tip Recommendations
- Include at least 50 diverse questions in evaluation dataset
- Use domain expert-validated answers as ground truth
- Track quality changes over time through regular evaluations
:::

:::warning Cautions
- Ragas evaluation requires LLM API calls, incurring costs
- For large-scale evaluations, use batch processing and caching
- Evaluation results may vary depending on the LLM used
:::
