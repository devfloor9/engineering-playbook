---
title: "Milvus 向量数据库集成"
sidebar_label: "10. Milvus Vector DB"
description: "在 Amazon EKS 上部署和集成 Milvus 向量数据库与 RAG 管道的指南"
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

> 📅 **撰写日期**: 2026-02-13 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 2 分钟

# Milvus 向量数据库集成

Milvus 是一个用于大规模向量相似性搜索的开源向量数据库。它是 Agentic AI 平台中 RAG（检索增强生成）管道的核心组件。

## 概述

### 为什么需要 Milvus

向量数据库在 Agentic AI 系统中发挥以下作用：

- **知识存储**：将文档、FAQ、产品信息存储为嵌入向量
- **语义搜索**：基于语义相似性而非关键词进行搜索
- **上下文提供**：为 LLM 提供相关信息以减少幻觉
- **长期记忆**：存储 Agent 对话历史和学习内容

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

## Milvus 集群架构

### 分布式架构组件

Milvus 在 Kubernetes 上以**云原生分布式架构**运行，将关注点分离到多个层次：

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

### 组件角色

<ComponentRolesTable />

## EKS 部署指南

### 通过 Milvus Operator 安装

对于生产部署，Milvus Operator 提供声明式管理：

```bash
# 安装 Milvus Operator
helm repo add milvus https://milvus-io.github.io/milvus-helm/
helm install milvus-operator milvus/milvus-operator -n milvus-operator --create-namespace

# 部署 Milvus 集群
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
          nvidia.com/gpu: 1  # GPU 加速索引
EOF
```

### 通过 Helm Chart 安装

也可以直接通过 Helm 安装：

```bash
# 添加 Milvus Helm 仓库
helm repo add milvus https://zilliztech.github.io/milvus-helm/
helm repo update

# 创建命名空间
kubectl create namespace milvus

# 使用生产设置安装
helm install milvus milvus/milvus \
  --namespace milvus \
  --set cluster.enabled=true \
  --set etcd.replicaCount=3 \
  --set minio.mode=distributed \
  --set pulsar.enabled=true \
  -f milvus-values.yaml
```

### 生产环境 values.yaml 配置

```yaml
# milvus-values.yaml
cluster:
  enabled: true

# Proxy 配置
proxy:
  replicas: 2
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

# Query Node 配置 - 直接影响搜索性能
queryNode:
  replicas: 3
  resources:
    requests:
      cpu: "2"
      memory: "8Gi"
    limits:
      cpu: "4"
      memory: "16Gi"
  # 启用 GPU 加速（可选）
  # gpu:
  #   enabled: true

# Data Node 配置
dataNode:
  replicas: 2
  resources:
    requests:
      cpu: "1"
      memory: "4Gi"
    limits:
      cpu: "2"
      memory: "8Gi"

# Index Node 配置
indexNode:
  replicas: 2
  resources:
    requests:
      cpu: "2"
      memory: "8Gi"
    limits:
      cpu: "4"
      memory: "16Gi"

# etcd 集群配置
etcd:
  replicaCount: 3
  persistence:
    enabled: true
    storageClass: "gp3"
    size: 20Gi

# MinIO 分布式模式配置
minio:
  mode: distributed
  replicas: 4
  persistence:
    enabled: true
    storageClass: "gp3"
    size: 100Gi

# Pulsar 消息队列配置
pulsar:
  enabled: true
  components:
    autorecovery: true
  bookkeeper:
    replicaCount: 3
  broker:
    replicaCount: 2
```

### 使用 Amazon S3 作为存储

直接使用 Amazon S3 替代 MinIO 可以减少运维负担：

```yaml
# milvus-s3-values.yaml
externalS3:
  enabled: true
  host: "s3.ap-northeast-2.amazonaws.com"
  port: "443"
  useSSL: true
  bucketName: "milvus-data-bucket"
  useIAM: true  # 使用 IRSA
  cloudProvider: "aws"

minio:
  enabled: false  # 禁用 MinIO

# IRSA 的 ServiceAccount 配置
serviceAccount:
  create: true
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::XXXXXXXXXXXX:role/MilvusS3Role"
```

:::tip S3 IAM 策略

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

## 索引类型选择指南

### 主要索引类型对比

<IndexComparisonTable />

### 索引创建示例

```python
from pymilvus import Collection, CollectionSchema, FieldSchema, DataType

# 定义 Collection Schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="metadata", dtype=DataType.JSON),
]

schema = CollectionSchema(fields=fields, description="Document embeddings")
collection = Collection(name="documents", schema=schema)

# 创建 HNSW 索引（高性能搜索）
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {
        "M": 16,           # 图连通性（越高越准确，内存越大）
        "efConstruction": 256  # 索引构建质量（越高越准确，构建时间越长）
    }
}

collection.create_index(field_name="embedding", index_params=index_params)
collection.load()
```

## LangChain/LlamaIndex 集成

### LangChain 集成示例

```python
from langchain_community.vectorstores import Milvus
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader

# 加载并分割文档
loader = DirectoryLoader("./documents", glob="**/*.md")
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)
splits = text_splitter.split_documents(documents)

# 配置 Embedding 模型
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 创建 Milvus 向量存储
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

# 相似性搜索
query = "How to schedule GPU in Kubernetes"
docs = vectorstore.similarity_search(query, k=5)

for doc in docs:
    print(f"Content: {doc.page_content[:200]}...")
    print(f"Metadata: {doc.metadata}")
    print("---")
```

### LlamaIndex 集成示例

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Settings
from llama_index.vector_stores.milvus import MilvusVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding

# 配置 Embedding 模型
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

# 配置 Milvus 向量存储
vector_store = MilvusVectorStore(
    uri="http://milvus-proxy.milvus.svc.cluster.local:19530",
    collection_name="llamaindex_docs",
    dim=1536,
    overwrite=True,
)

# 加载文档并构建索引
documents = SimpleDirectoryReader("./documents").load_data()
index = VectorStoreIndex.from_documents(
    documents,
    vector_store=vector_store,
)

# 创建查询引擎
query_engine = index.as_query_engine(similarity_top_k=5)

# 执行查询
response = query_engine.query("Explain Agentic AI platform architecture")
print(response)
```

### 完整 RAG 管道配置

```python
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# 配置 LLM
llm = ChatOpenAI(
    model="gpt-4-turbo-preview",
    temperature=0,
)

# 定义提示模板
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

# 构建 RAG 链
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

# 执行查询
result = qa_chain.invoke({"query": "How to manage GPU resources?"})
print(f"Answer: {result['result']}")
print(f"Sources: {[doc.metadata for doc in result['source_documents']]}")
```

## 查询优化

### 搜索参数调优

```python
# 配置搜索参数
search_params = {
    "metric_type": "COSINE",
    "params": {
        "ef": 128,  # HNSW 搜索范围（越高越准确，越慢）
    }
}

# 带元数据过滤的搜索
results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr='metadata["category"] == "kubernetes"',  # 元数据过滤
    output_fields=["text", "metadata"],
)
```

### 混合搜索（向量 + 关键词）

```python
from pymilvus import AnnSearchRequest, RRFRanker

# 向量搜索请求
vector_search = AnnSearchRequest(
    data=[query_embedding],
    anns_field="embedding",
    param={"metric_type": "COSINE", "params": {"ef": 64}},
    limit=20
)

# 通过 BM25 分数进行关键词搜索（需要单独的字段）
# Milvus 2.4+ 支持

# 使用 RRF（Reciprocal Rank Fusion）合并结果
results = collection.hybrid_search(
    reqs=[vector_search],
    ranker=RRFRanker(k=60),
    limit=10,
    output_fields=["text", "metadata"]
)
```

## 高可用性与备份

### 数据备份策略

```bash
# 安装 Milvus 备份工具
pip install milvus-backup

# 创建备份配置文件
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

# 执行备份
milvus-backup create -n daily_backup -c backup_config.yaml
```

### 灾难恢复配置

```yaml
# 跨区域复制设置
apiVersion: batch/v1
kind: CronJob
metadata:
  name: milvus-backup-sync
  namespace: milvus
spec:
  schedule: "0 */6 * * *"  # 每 6 小时
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
              # 将备份复制到另一个区域的 S3
              aws s3 sync s3://milvus-backup-primary s3://milvus-backup-dr \
                --source-region ap-northeast-2 \
                --region us-west-2
          restartPolicy: OnFailure
          serviceAccountName: milvus-backup-sa
```

## 监控与指标

### Prometheus 指标收集

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

### 关键监控指标

<MonitoringMetricsTable />

### Grafana 仪表板

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

## 相关文档

- [Agentic AI 平台架构](./agentic-platform-architecture.md)
- [Ragas RAG 评估框架](./ragas-evaluation.md)
- [Agent 监控](./agent-monitoring.md)

:::info 建议

- 在生产环境中至少运行 3 个 Query Node
- 对于超大数据集（1 亿+ 向量），考虑使用 DISKANN 索引
- 使用 S3 作为存储可显著降低运维复杂性
:::

:::warning 注意事项

- 索引构建消耗大量 CPU/内存；请在非高峰时段进行
- Collection 删除是永久性的；删除前请确认备份
:::
