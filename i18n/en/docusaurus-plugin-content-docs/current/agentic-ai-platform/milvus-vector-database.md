---
title: "Milvus Vector Database Integration"
sidebar_label: "10. Milvus Vector DB"
description: "Guide to deploying and integrating Milvus vector database on Amazon EKS with RAG pipelines"
sidebar_position: 10
tags:
  - milvus
  - vector-database
  - rag
  - kubernetes
  - eks
  - genai
  - embedding
last_update:
  date: 2026-02-14
  author: devfloor9
category: "genai-aiml"
---

import {
  ComponentRolesTable,
  IndexComparisonTable,
  MonitoringMetricsTable,
  GPUInstanceTable,
  GPUIndexingPerformanceTable,
  StorageCostComparisonTable
} from '@site/src/components/MilvusTables';

> 📅 **Written**: 2026-02-13 | **Last Modified**: 2026-02-14 | ⏱️ **Reading Time**: ~2 min

# Milvus Vector Database Integration

Milvus is an open-source vector database for large-scale vector similarity search. It serves as a core component in RAG (Retrieval-Augmented Generation) pipelines for Agentic AI platforms.

## Overview

### Why Milvus is Needed

Vector databases play the following roles in Agentic AI systems:

- **Knowledge Storage**: Store documents, FAQs, product information as embedding vectors
- **Semantic Search**: Search based on semantic similarity rather than keywords
- **Context Provision**: Provide relevant information to LLM to reduce hallucination
- **Long-term Memory**: Store agent conversation history and learned content

```mermaid
graph LR
    subgraph "RAG Pipeline"
        Query["User Query"]
        Embed["Embedding Model"]
        Search["Vector Search"]
        Milvus[(Milvus)]
        Context["Build Context"]
        LLM["LLM Inference"]
        Response["Generate Response"]
    end

    Query --> Embed
    Embed --> Search
    Search --> Milvus
    Milvus --> Context
    Context --> LLM
    LLM --> Response

    style Milvus fill:#00d4aa,stroke:#333,stroke-width:2px
```

## Milvus Cluster Architecture

### Distributed Architecture Components

Milvus operates with a **cloud-native distributed architecture** on Kubernetes, separating concerns across multiple layers:

```mermaid
graph TB
    subgraph "Milvus Distributed Architecture"
        subgraph "Access Layer"
            PROXY["Milvus Proxy<br/>(Deployment)"]
        end

        subgraph "Coordinator Layer"
            ROOT["Root Coord"]
            QUERY["Query Coord"]
            DATA["Data Coord"]
            INDEX["Index Coord"]
        end

        subgraph "Worker Layer"
            QN["Query Nodes<br/>(StatefulSet)"]
            DN["Data Nodes<br/>(StatefulSet)"]
            IN["Index Nodes<br/>(StatefulSet)"]
        end

        subgraph "Storage Layer"
            ETCD["etcd<br/>(Metadata)"]
            MINIO["MinIO/S3<br/>(Object Storage)"]
            PULSAR["Pulsar<br/>(Message Queue)"]
        end
    end

    PROXY --> ROOT & QUERY & DATA & INDEX
    QUERY --> QN
    DATA --> DN
    INDEX --> IN
    QN & DN & IN --> ETCD & MINIO & PULSAR

    style PROXY fill:#00d4aa
    style QN fill:#00d4aa
    style DN fill:#00d4aa
    style IN fill:#00d4aa
```

### Component Roles

<ComponentRolesTable />

## EKS Deployment Guide

### Installation via Milvus Operator

For production deployments, the Milvus Operator provides declarative management:

```bash
# Install Milvus Operator
helm repo add milvus https://milvus-io.github.io/milvus-helm/
helm install milvus-operator milvus/milvus-operator -n milvus-operator --create-namespace

# Deploy Milvus Cluster
kubectl apply -f - <<EOF
apiVersion: milvus.io/v1beta1
kind: Milvus
metadata:
  name: milvus-cluster
  namespace: ai-vectordb
spec:
  mode: cluster
  dependencies:
    etcd:
      inCluster:
        values:
          replicaCount: 3
    storage:
      inCluster:
        values:
          mode: distributed
    pulsar:
      inCluster:
        values:
          components:
            autorecovery: false
  components:
    proxy:
      replicas: 2
      resources:
        requests:
          cpu: "1"
          memory: "2Gi"
    queryNode:
      replicas: 3
      resources:
        requests:
          cpu: "2"
          memory: "8Gi"
    dataNode:
      replicas: 2
    indexNode:
      replicas: 2
      resources:
        requests:
          nvidia.com/gpu: 1  # GPU-accelerated indexing
EOF
```

### Installation via Helm Chart

Alternatively, install directly via Helm:

```bash
# Add Milvus Helm repository
helm repo add milvus https://zilliztech.github.io/milvus-helm/
helm repo update

# Create namespace
kubectl create namespace milvus

# Install with production settings
helm install milvus milvus/milvus \
  --namespace milvus \
  --set cluster.enabled=true \
  --set etcd.replicaCount=3 \
  --set minio.mode=distributed \
  --set pulsar.enabled=true \
  -f milvus-values.yaml
```

### Production values.yaml Configuration

```yaml
# milvus-values.yaml
cluster:
  enabled: true

# Proxy configuration
proxy:
  replicas: 2
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

# Query Node configuration - directly impacts search performance
queryNode:
  replicas: 3
  resources:
    requests:
      cpu: "2"
      memory: "8Gi"
    limits:
      cpu: "4"
      memory: "16Gi"
  # Enable GPU acceleration (optional)
  # gpu:
  #   enabled: true

# Data Node configuration
dataNode:
  replicas: 2
  resources:
    requests:
      cpu: "1"
      memory: "4Gi"
    limits:
      cpu: "2"
      memory: "8Gi"

# Index Node configuration
indexNode:
  replicas: 2
  resources:
    requests:
      cpu: "2"
      memory: "8Gi"
    limits:
      cpu: "4"
      memory: "16Gi"

# etcd cluster configuration
etcd:
  replicaCount: 3
  persistence:
    enabled: true
    storageClass: "gp3"
    size: 20Gi

# MinIO distributed mode configuration
minio:
  mode: distributed
  replicas: 4
  persistence:
    enabled: true
    storageClass: "gp3"
    size: 100Gi

# Pulsar message queue configuration
pulsar:
  enabled: true
  components:
    autorecovery: true
  bookkeeper:
    replicaCount: 3
  broker:
    replicaCount: 2
```

### Using Amazon S3 as Storage

Using Amazon S3 directly instead of MinIO reduces operational burden:

```yaml
# milvus-s3-values.yaml
externalS3:
  enabled: true
  host: "s3.ap-northeast-2.amazonaws.com"
  port: "443"
  useSSL: true
  bucketName: "milvus-data-bucket"
  useIAM: true  # Use IRSA
  cloudProvider: "aws"

minio:
  enabled: false  # Disable MinIO

# ServiceAccount configuration for IRSA
serviceAccount:
  create: true
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::XXXXXXXXXXXX:role/MilvusS3Role"
```

:::tip S3 IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::milvus-data-bucket",
        "arn:aws:s3:::milvus-data-bucket/*"
      ]
    }
  ]
}
```

:::

## Index Type Selection Guide

### Main Index Type Comparison

<IndexComparisonTable />

### Index Creation Example

```python
from pymilvus import Collection, CollectionSchema, FieldSchema, DataType

# Define collection schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="metadata", dtype=DataType.JSON),
]

schema = CollectionSchema(fields=fields, description="Document embeddings")
collection = Collection(name="documents", schema=schema)

# Create HNSW index (high-performance search)
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {
        "M": 16,           # Graph connectivity (higher = more accurate, more memory)
        "efConstruction": 256  # Index build quality (higher = more accurate, longer build time)
    }
}

collection.create_index(field_name="embedding", index_params=index_params)
collection.load()
```

## LangChain/LlamaIndex Integration

### LangChain Integration Example

```python
from langchain_community.vectorstores import Milvus
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader

# Load and split documents
loader = DirectoryLoader("./documents", glob="**/*.md")
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)
splits = text_splitter.split_documents(documents)

# Configure embedding model
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Create Milvus vector store
vectorstore = Milvus.from_documents(
    documents=splits,
    embedding=embeddings,
    connection_args={
        "host": "milvus-proxy.milvus.svc.cluster.local",
        "port": "19530",
    },
    collection_name="langchain_docs",
    drop_old=True,
)

# Similarity search
query = "How to schedule GPU in Kubernetes"
docs = vectorstore.similarity_search(query, k=5)

for doc in docs:
    print(f"Content: {doc.page_content[:200]}...")
    print(f"Metadata: {doc.metadata}")
    print("---")
```

### LlamaIndex Integration Example

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.vector_stores.milvus import MilvusVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding

# Configure embedding model
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

# Configure Milvus vector store
vector_store = MilvusVectorStore(
    uri="http://milvus-proxy.milvus.svc.cluster.local:19530",
    collection_name="llamaindex_docs",
    dim=1536,
    overwrite=True,
)

# Load documents and build index
documents = SimpleDirectoryLoader("./documents").load_data()
index = VectorStoreIndex.from_documents(
    documents,
    vector_store=vector_store,
)

# Create query engine
query_engine = index.as_query_engine(similarity_top_k=5)

# Execute query
response = query_engine.query("Explain Agentic AI platform architecture")
print(response)
```

### Complete RAG Pipeline Configuration

```python
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# Configure LLM
llm = ChatOpenAI(
    model="gpt-4-turbo-preview",
    temperature=0,
)

# Define prompt template
prompt_template = """Use the following context to answer the question.
If the answer is not in the context, say "I don't have that information".

Context:
{context}

Question: {question}

Answer:"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

# Build RAG chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(
        search_type="mmr",  # Maximum Marginal Relevance
        search_kwargs={"k": 5, "fetch_k": 10}
    ),
    chain_type_kwargs={"prompt": PROMPT},
    return_source_documents=True,
)

# Execute query
result = qa_chain.invoke({"query": "How to manage GPU resources?"})
print(f"Answer: {result['result']}")
print(f"Sources: {[doc.metadata for doc in result['source_documents']]}")
```

## Query Optimization

### Search Parameter Tuning

```python
# Configure search parameters
search_params = {
    "metric_type": "COSINE",
    "params": {
        "ef": 128,  # HNSW search range (higher = more accurate, slower)
    }
}

# Search with metadata filtering
results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr='metadata["category"] == "kubernetes"',  # Metadata filter
    output_fields=["text", "metadata"],
)
```

### Hybrid Search (Vector + Keyword)

```python
from pymilvus import AnnSearchRequest, RRFRanker

# Vector search request
vector_search = AnnSearchRequest(
    data=[query_embedding],
    anns_field="embedding",
    param={"metric_type": "COSINE", "params": {"ef": 64}},
    limit=20
)

# Keyword search via BM25 score (requires separate field)
# Supported in Milvus 2.4+

# Merge results using RRF (Reciprocal Rank Fusion)
results = collection.hybrid_search(
    reqs=[vector_search],
    ranker=RRFRanker(k=60),
    limit=10,
    output_fields=["text", "metadata"]
)
```

## High Availability and Backup

### Data Backup Strategy

```bash
# Install Milvus backup tool
pip install milvus-backup

# Create backup configuration file
cat > backup_config.yaml << EOF
milvus:
  address: milvus-proxy.milvus.svc.cluster.local
  port: 19530

minio:
  address: minio.milvus.svc.cluster.local
  port: 9000
  accessKeyID: minioadmin
  secretAccessKey: minioadmin
  bucketName: milvus-backup
  useSSL: false

backup:
  maxSegmentGroupSize: 2G
EOF

# Execute backup
milvus-backup create -n daily_backup -c backup_config.yaml
```

### Disaster Recovery Configuration

```yaml
# Cross-region replication setup
apiVersion: batch/v1
kind: CronJob
metadata:
  name: milvus-backup-sync
  namespace: milvus
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup-sync
            image: amazon/aws-cli:latest
            command:
            - /bin/sh
            - -c
            - |
              # Replicate backup to another region's S3
              aws s3 sync s3://milvus-backup-primary s3://milvus-backup-dr \
                --source-region ap-northeast-2 \
                --region us-west-2
          restartPolicy: OnFailure
          serviceAccountName: milvus-backup-sa
```

## Monitoring and Metrics

### Prometheus Metrics Collection

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: milvus-monitor
  namespace: milvus
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: milvus
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### Key Monitoring Metrics

<MonitoringMetricsTable />

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Milvus Performance",
    "panels": [
      {
        "title": "Search Latency P99",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, rate(milvus_proxy_search_latency_bucket[5m]))",
            "legendFormat": "P99 Latency"
          }
        ]
      },
      {
        "title": "Query Throughput",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(milvus_proxy_search_vectors_count[5m]))",
            "legendFormat": "Vectors/sec"
          }
        ]
      }
    ]
  }
}
```

## Related Documentation

- [Agentic AI Platform Architecture](./agentic-platform-architecture.md)
- [Ragas RAG Evaluation Framework](./ragas-evaluation.md)
- [Agent Monitoring](./agent-monitoring.md)

:::info Recommendations

- Run minimum 3 Query Nodes in production environments
- Consider DISKANN index for ultra-large datasets (100M+ vectors)
- Using S3 as storage significantly reduces operational complexity
:::

:::warning Caution

- Index building consumes significant CPU/memory; schedule during off-peak hours
- Collection deletion is permanent; verify backups before deletion
:::
