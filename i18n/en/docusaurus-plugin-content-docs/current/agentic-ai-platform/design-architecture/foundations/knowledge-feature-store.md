---
title: "Knowledge Feature Store Expansion"
sidebar_label: "Knowledge Feature Store"
description: "3-plane design integrating ontology and Knowledge Graph into traditional Feature Store to reduce hallucinations, enable provenance tracking, and enhance domain entity utilization"
created: 2026-04-18
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 20
tags:
  - feature-store
  - knowledge-graph
  - ontology
  - rag
  - scope:design
sidebar_position: 7
---

:::info Forward-looking Design
To be refined in separate ontology session (2026-Q2). This document proposes conceptual design and pilot scope.
:::

# Knowledge Feature Store Expansion

## Problem Definition: Why Feature Store Alone Is Insufficient

Traditional Feature Stores (Feast, SageMaker Feature Store, Tecton) are optimized for efficiently providing **scalar values and embedding vectors**. However, in Agentic AI environments, the following limitations emerge:

### Traditional Feature Store Limitations

```mermaid
flowchart LR
    subgraph Traditional["Traditional Feature Store"]
        FS[Feast/Tecton]
        SC[Scalar Features]
        VEC[Embedding Vectors]
    end
    
    subgraph Missing["Missing Capabilities"]
        REL[Entity Relations]
        ONT[Ontology]
        PROV[Provenance Tracking]
        CTX[Context Reasoning]
    end
    
    FS --> SC
    FS --> VEC
    
    SC -.->|Cannot provide| REL
    VEC -.->|Cannot provide| ONT
    REL -.->|When absent| PROV
    ONT -.->|When absent| CTX
    
    style Missing fill:#ffe1e1
    style Traditional fill:#e1f5ff
```

**Specific Problem Cases:**

1. **Absence of Entity Relations** → Hallucinations
   - Question: "What devices are connected to customer A's recent contracts?"
   - Traditional FS: Returns customer embedding and contract embedding separately
   - Result: LLM connects unrelated devices causing hallucination
   - Required: `(Customer)-[:HAS_CONTRACT]->(Contract)-[:USES]->(Device)` relationship

2. **Absence of Ontology** → Domain Term Misunderstanding
   - Question: "Usage patterns of Premium grade users"
   - Traditional FS: Treats 'Premium' as simple string
   - Result: Cannot understand relationships with 'VIP', 'Gold', 'Platinum'
   - Required: `Premium subClassOf HighValueCustomer`, `VIP equivalentTo Premium` definition

3. **Absence of Provenance** → Audit Failure
   - Requirement: "What is the data source for this answer?"
   - Traditional FS: Only provides vector similarity, cannot track source data
   - Result: Compliance (SOC2, GDPR) failure
   - Required: Feature → Raw Data → Source System → Timestamp chain

4. **Absence of Temporal Relationships** → Context Errors
   - Question: "Prior usage patterns of customers who churned in 2025 Q4"
   - Traditional FS: Only supports point-in-time queries
   - Result: Cannot connect relationships before and after churn
   - Required: Temporal edge `BEFORE`, `AFTER` relationship

---

## Knowledge Feature Store Conceptual Model

Knowledge Feature Store (KFS) extends the traditional Feature Store with a 3-plane architecture, adding **relationships and semantics** to scalar/vector data.

### 3-Plane Architecture

```mermaid
flowchart TB
    subgraph App["Application Layer"]
        AGENT[Agent/LLM]
        RAG[RAG Pipeline]
    end
    
    subgraph KFS["Knowledge Feature Store"]
        direction TB
        
        subgraph FP["Feature Plane"]
            FEAST[Feast/SageMaker FS]
            SCALAR[Scalar Features]
            EMBED[Embeddings]
        end
        
        subgraph KP["Knowledge Plane"]
            ONT[Ontology]
            KG[(Knowledge Graph)]
            ENTITY[Entity Relations]
        end
        
        subgraph RP["Retrieval Plane"]
            MILVUS[(Milvus Vector DB)]
            GRAPH[Graph Traversal]
            HYBRID[Hybrid Search]
        end
    end
    
    subgraph Storage["Storage"]
        S3[(S3 Parquet)]
        NEPTUNE[(Neptune Analytics)]
        CACHE[(Redis Cache)]
    end
    
    AGENT --> FP
    AGENT --> RP
    RAG --> RP
    
    FP --> SCALAR
    FP --> EMBED
    
    KP --> ONT
    KP --> KG
    KP --> ENTITY
    
    RP --> MILVUS
    RP --> GRAPH
    RP --> HYBRID
    
    FP -.->|Read| S3
    KP -.->|Read| NEPTUNE
    RP -.->|Read| MILVUS
    
    style FP fill:#e1f5ff
    style KP fill:#fff4e1
    style RP fill:#e1ffe1
```

### Role of Each Plane

| Plane | Responsibility | Data Format | Read Latency | Example Query |
|-------|------|------------|---------|----------|
| **Feature Plane** | Provide Scalar/Vector features | Parquet, Protobuf | &lt;10ms | `get_features(entity_id, feature_names)` |
| **Knowledge Plane** | Entity Relations·Ontology | RDF, Property Graph | &lt;50ms | `traverse(Customer, depth=2, relation='HAS_CONTRACT')` |
| **Retrieval Plane** | Vector search + graph expansion | HNSW Index, Cypher | &lt;100ms | `hybrid_search(query_embedding, kg_expand=True)` |

### Unified Read API

```python
from kfs import KnowledgeFeatureStore

kfs = KnowledgeFeatureStore(
    feature_store="feast://cluster.local",
    knowledge_graph="neptune://cluster.amazonaws.com",
    vector_store="milvus://milvus.svc.cluster.local:19530"
)

# Unified query: Vector search + graph expansion + feature loading
result = kfs.retrieve(
    query="Recent usage patterns of Premium grade users",
    retrieval_config={
        "vector_top_k": 10,
        "graph_expand": {
            "depth": 2,
            "relations": ["HAS_CONTRACT", "USES_DEVICE"]
        },
        "features": ["usage_last_30d", "churn_risk_score"]
    }
)

# Result:
# - contexts: 10 documents found by vector search
# - entities: Entity nodes connected by graph expansion
# - features: Scalar/vector features of each entity
# - provenance: Source and timestamp of each data point
```

---

## Ontology Schema and Entity Interpretation

### Domain Ontology Definition

Defines domain entities in Agentic AI Platform (Customer, Contract, Device, Usage) using SKOS/OWL-lite subset.

```turtle
@prefix kfs: <http://platform.ai/ontology/kfs#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .

# Core Entities
kfs:Customer a owl:Class ;
    skos:prefLabel "Customer"@en, "고객"@ko ;
    skos:definition "Individual or organization using the service" .

kfs:Contract a owl:Class ;
    skos:prefLabel "Contract"@en, "계약"@ko ;
    skos:definition "Service contract with customer" .

kfs:Device a owl:Class ;
    skos:prefLabel "Device"@en, "디바이스"@ko ;
    skos:definition "Device for service delivery" .

kfs:Usage a owl:Class ;
    skos:prefLabel "Usage"@en, "이용"@ko ;
    skos:definition "Service usage event" .

# Relationship definition
kfs:hasContract a owl:ObjectProperty ;
    rdfs:domain kfs:Customer ;
    rdfs:range kfs:Contract ;
    skos:prefLabel "Has contract"@en .

kfs:usesDevice a owl:ObjectProperty ;
    rdfs:domain kfs:Contract ;
    rdfs:range kfs:Device ;
    skos:prefLabel "Uses device"@en .

kfs:recordedUsage a owl:ObjectProperty ;
    rdfs:domain kfs:Device ;
    rdfs:range kfs:Usage ;
    skos:prefLabel "Usage record"@en .

# Attributes definition
kfs:customerGrade a owl:DatatypeProperty ;
    rdfs:domain kfs:Customer ;
    rdfs:range xsd:string ;
    skos:prefLabel "Customer grade"@en .

kfs:churnRisk a owl:DatatypeProperty ;
    rdfs:domain kfs:Customer ;
    rdfs:range xsd:float ;
    skos:prefLabel "Churn risk"@en .

# Grade Hierarchy (SKOS Concept Scheme)
kfs:CustomerGradeScheme a skos:ConceptScheme ;
    skos:prefLabel "Customer grade system"@en .

kfs:Premium a skos:Concept ;
    skos:inScheme kfs:CustomerGradeScheme ;
    skos:prefLabel "Premium"@en, "Premium"@ko ;
    skos:broader kfs:HighValue .

kfs:VIP a skos:Concept ;
    skos:inScheme kfs:CustomerGradeScheme ;
    skos:exactMatch kfs:Premium ;
    skos:prefLabel "VIP"@en .

kfs:HighValue a skos:Concept ;
    skos:inScheme kfs:CustomerGradeScheme ;
    skos:prefLabel "High-value customer"@ko .
```

### Managed vs Open Source Options

| Implementation | Managed Option | Open Source Option | Selection Criteria |
|------|-----------|-------------|----------|
| **Knowledge Graph** | Amazon Neptune Analytics | Neo4j, JanusGraph | Scale, operational capability, cost |
| **Ontology Store** | AWS RDF Store (Neptune) | Oxigraph, Apache Jena | Ontology complexity, inference requirements |
| **Vector DB** | - | Milvus, Weaviate | Already built on EKS |

**Neptune Analytics Advantages:**
- Serverless graph analytics (no provisioning required)
- Millisecond query latency
- Gremlin, openCypher support
- Direct S3 data loading
- Cost: $1.08/vCPU/hr (on-demand), $0.10/Compute Unit per query

**Neo4j Advantages:**
- Mature ecosystem, rich plugins
- Complete control of EKS deployment
- Cypher query language standard
- APOC for advanced algorithms

---

## KG-aware RAG Pattern

### Vector Search + Graph Expansion

Traditional RAG selects context only by vector similarity, but KG-aware RAG **leverages graph relationships to expand context**.

```mermaid
flowchart LR
    Q[Question]
    E[Embedding]
    V[Vector Search]
    T[Top-K documents]
    G[Graph Expansion]
    N[Related Nodes]
    R[Re-rank]
    F[Final Context]
    L[LLM Generation]
    
    Q --> E
    E --> V
    V --> T
    T --> G
    G --> N
    T --> R
    N --> R
    R --> F
    F --> L
    
    style V fill:#4285f4
    style G fill:#f39c12
    style R fill:#34a853
    style L fill:#9c27b0
```

### Implementation Example

```python
from kfs import KnowledgeFeatureStore
from ragas import evaluate
from ragas.metrics import faithfulness, context_recall

kfs = KnowledgeFeatureStore(...)

def kg_aware_rag(query: str) -> dict:
    # 1. Question Embedding
    query_embedding = embedding_model.encode(query)
    
    # 2. Milvus top-k Vector Search
    vector_results = kfs.vector_search(
        embedding=query_embedding,
        collection="documents",
        top_k=20,
        metric="COSINE"
    )
    
    # 3. Extract connected entities from each document
    entities = []
    for doc in vector_results:
        # Identify entities mentioned in documents
        doc_entities = kfs.extract_entities(doc.text)
        entities.extend(doc_entities)
    
    # 4. 1-hop expansion in Knowledge Graph
    expanded_entities = kfs.graph_expand(
        entities=entities,
        depth=1,
        relations=["HAS_CONTRACT", "USES_DEVICE", "RECORDED_USAGE"]
    )
    
    # 5. Re-rank by distance between expanded entities and question
    scored_contexts = []
    for doc in vector_results:
        # Document score = vector similarity + graph distance weight
        vector_score = doc.score
        entity_distance = kfs.min_distance(
            doc.entities, 
            query_entities
        )
        graph_score = 1 / (1 + entity_distance)  # Inverse distance
        
        final_score = 0.7 * vector_score + 0.3 * graph_score
        scored_contexts.append((doc, final_score))
    
    # 6. Select top-5 contexts
    final_contexts = sorted(
        scored_contexts, 
        key=lambda x: x[1], 
        reverse=True
    )[:5]
    
    return {
        "contexts": [doc.text for doc, score in final_contexts],
        "entities": expanded_entities,
        "provenance": [doc.metadata for doc, score in final_contexts]
    }

# 7. Evaluation with Ragas
result = kg_aware_rag("Recent usage patterns of Premium grade users")

eval_dataset = {
    "question": ["Recent usage patterns of Premium grade users"],
    "contexts": [result["contexts"]],
    "answer": [llm.generate(result["contexts"])],
    "ground_truth": ["Premium customers average 150GB monthly..."]
}

ragas_result = evaluate(
    eval_dataset,
    metrics=[faithfulness, context_recall]
)
print(ragas_result)
```

### Expected Improvements

| Metric | Vector-only RAG | KG-aware RAG | Improvement |
|--------|----------------|-------------|--------|
| **Faithfulness** | 0.72 | 0.89 | +24% |
| **Context Recall** | 0.68 | 0.85 | +25% |
| **Answer Relevancy** | 0.81 | 0.87 | +7% |
| **Hallucination Rate** | 18% | 7% | -61% |

**Improvement Mechanism:**
1. Remove irrelevant contexts via graph relationships → Increase Precision
2. Supplement missing entities with 1-hop expansion → Increase Recall
3. Clarify provenance with tracking → Increase Faithfulness

---

## Write Path and Consistency Model

### CDC-based Event Flow

Knowledge Feature Store **detects changes in source database in real-time** and propagates them to Feature Plane, Knowledge Plane, and Retrieval Plane.

```mermaid
flowchart LR
    subgraph Source["Source Systems"]
        DB[(App DB)]
        DW[(Data Warehouse)]
    end
    
    subgraph CDC["Change Data Capture"]
        DEBEZIUM[Debezium]
        KAFKA[Kafka]
    end
    
    subgraph Materializer["KFS Materializer"]
        direction TB
        STREAM[Stream Processor]
        FW[Feature Writer]
        KW[Knowledge Writer]
        VW[Vector Writer]
    end
    
    subgraph KFS["Knowledge Feature Store"]
        FEAST[Feast Online]
        KG[(Knowledge Graph)]
        MILVUS[(Milvus)]
    end
    
    DB --> DEBEZIUM
    DW --> KAFKA
    DEBEZIUM --> KAFKA
    KAFKA --> STREAM
    
    STREAM --> FW
    STREAM --> KW
    STREAM --> VW
    
    FW --> FEAST
    KW --> KG
    VW --> MILVUS
    
    style CDC fill:#4285f4
    style Materializer fill:#f39c12
    style KFS fill:#34a853
```

### Offline Batch vs Online Stream

| Characteristic | Offline Batch | Online Stream | Hybrid |
|------|--------------|--------------|-----------|
| **Latency** | Hourly (Glue/EMR) | Seconds (Kinesis) | Batch → Online |
| **Accuracy** | 100% (Full recomputation) | 99%+ (Incremental update) | Periodic accuracy calibration |
| **Cost** | Low | High | Medium |
| **Use Case** | Historical data loading | Real-time recommendation | Production standard |

### Eventual Consistency Model

Knowledge Feature Store adopts **Eventual Consistency**. The 3 planes may not update simultaneously but eventually reach a consistent state.

```python
# Ensure point-in-time consistency
result = kfs.retrieve(
    query="...",
    consistency_mode="point_in_time",
    timestamp="2026-04-18T10:30:00Z"
)

# This query:
# 1. Feature Plane: Returns only features before timestamp
# 2. Knowledge Plane: Traverses only relationships before timestamp
# 3. Retrieval Plane: Searches only documents indexed before timestamp
# → All 3 planes aligned to same point in time
```

### Write Pipeline Example

```python
from kafka import KafkaConsumer
import json

def kfs_materializer():
    consumer = KafkaConsumer(
        'customer-events',
        bootstrap_servers=['kafka.svc.cluster.local:9092'],
        value_deserializer=lambda m: json.loads(m.decode('utf-8'))
    )
    
    for message in consumer:
        event = message.value
        
        # 1. Update Feature Plane
        feast_client.push(
            feature_view="customer_features",
            entity_rows=[{
                "customer_id": event["customer_id"],
                "churn_risk_score": event["churn_risk"],
                "event_timestamp": event["timestamp"]
            }]
        )
        
        # 2. Update Knowledge Graph
        if event["type"] == "CONTRACT_CREATED":
            neptune_client.execute(f"""
                MATCH (c:Customer {{id: '{event["customer_id"]}'}})
                CREATE (c)-[:HAS_CONTRACT]->
                    (contract:Contract {{
                        id: '{event["contract_id"]}',
                        start_date: '{event["start_date"]}'
                    }})
            """)
        
        # 3. Update Vector DB (when documents change)
        if event["type"] == "DOCUMENT_UPDATED":
            embedding = embedding_model.encode(event["content"])
            milvus_client.insert(
                collection_name="documents",
                data={
                    "id": event["doc_id"],
                    "embedding": embedding.tolist(),
                    "metadata": event["metadata"],
                    "timestamp": event["timestamp"]
                }
            )
        
        # 4. Record provenance
        provenance_store.record(
            entity_id=event["customer_id"],
            source_system="app-db",
            source_table="customers",
            change_type=event["type"],
            timestamp=event["timestamp"]
        )
```

---

## Governance, Security, and Roadmap

### Row/Attribute-level Authorization

Knowledge Feature Store performs access control at both **entity level** and **attribute level**.

```python
# Role-based Access Control
kfs_config = {
    "access_control": {
        "roles": {
            "data_scientist": {
                "entities": ["Customer", "Usage"],
                "attributes": {
                    "Customer": ["id", "grade", "churn_risk"],
                    "Usage": ["*"]  # All attributes
                },
                "relations": ["HAS_CONTRACT", "RECORDED_USAGE"]
            },
            "compliance_officer": {
                "entities": ["Customer", "Contract"],
                "attributes": {
                    "Customer": ["*"],
                    "Contract": ["*"]
                },
                "relations": ["*"],
                "provenance": True  # Provenance read permission
            },
            "external_analyst": {
                "entities": ["Usage"],
                "attributes": {
                    "Usage": ["device_type", "usage_gb"]  # Exclude PII
                },
                "pii_masking": True
            }
        }
    }
}

# Verify role on query execution
result = kfs.retrieve(
    query="...",
    role="external_analyst"
)
# → Customer.name, Customer.ssn etc. automatically masked
```

### PII Masking On-Read

Sensitive information is masked **at read time**, minimizing data copies.

```python
# Attribute-level Masking
masking_rules = {
    "Customer": {
        "ssn": lambda x: f"{x[:3]}-**-****",
        "phone": lambda x: f"{x[:3]}-****-{x[-4:]}",
        "email": lambda x: f"{x.split('@')[0][:2]}***@{x.split('@')[1]}"
    }
}

# Automatically applied to query results
masked_result = kfs.retrieve(
    query="...",
    masking_rules=masking_rules,
    audit_log=True  # Audit log for masking application
)
```

### Lineage (OpenLineage)

Knowledge Feature Store follows the **OpenLineage** standard to track data lineage.

```json
{
  "eventType": "COMPLETE",
  "eventTime": "2026-04-18T10:30:00.000Z",
  "run": {
    "runId": "abc-123-def"
  },
  "job": {
    "namespace": "kfs",
    "name": "materialize_customer_features"
  },
  "inputs": [
    {
      "namespace": "postgres",
      "name": "app_db.customers",
      "facets": {
        "schema": {...},
        "dataSource": {
          "name": "postgres://prod-db:5432/app"
        }
      }
    }
  ],
  "outputs": [
    {
      "namespace": "feast",
      "name": "customer_features",
      "facets": {
        "schema": {...}
      }
    },
    {
      "namespace": "neptune",
      "name": "Customer",
      "facets": {
        "schema": {...}
      }
    }
  ]
}
```

### Audit Log

Records all read/write operations in audit log.

```python
# Automatically record audit log
kfs.retrieve(
    query="...",
    audit_context={
        "user": "data-scientist@company.com",
        "purpose": "churn prediction model",
        "ticket": "JIRA-1234"
    }
)

# Recorded in CloudWatch Logs:
# {
#   "timestamp": "2026-04-18T10:30:00Z",
#   "user": "data-scientist@company.com",
#   "action": "retrieve",
#   "entities": ["Customer", "Contract"],
#   "features": ["churn_risk_score", "usage_last_30d"],
#   "purpose": "churn prediction model",
#   "ticket": "JIRA-1234",
#   "pii_accessed": false,
#   "masking_applied": false
# }
```

### Pilot Roadmap

| Phase | Duration | Goal | Key Actions |
|-------|------|------|----------|
| **Phase 0** | 2 weeks | Schema Design | Draft domain ontology, define entities & relationships |
| **Phase 1** | 4 weeks | Read API | Integrate Milvus + Neptune, develop unified query API |
| **Phase 2** | 6 weeks | Write Pipeline | Build Debezium CDC → Kafka → Materializer |
| **Phase 3** | 4 weeks | Governance | RBAC, PII masking, OpenLineage integration |
| **Phase 4** | 2 weeks | Evaluation | Evaluate Ragas KG-aware RAG, establish metric baseline |

**Phase 0 Schema Draft Scope:**
- 4 Core Entities: Customer, Contract, Device, Usage
- 6 relationships: HAS_CONTRACT, USES_DEVICE, RECORDED_USAGE, BEFORE, AFTER, RELATED_TO
- 10 attributes: customer_grade, churn_risk, contract_type, device_model, usage_gb, ...
- 1 SKOS scheme: CustomerGradeScheme (Premium, VIP, Standard, ...)

---

## Conclusion

Knowledge Feature Store integrates **Ontology and Knowledge Graph** with the traditional Feature Store's **scalar/vector feature provisioning** capability to achieve the following:

1. **Reduced Hallucinations**: Explicitly models Entity Relations to prevent LLMs from connecting unrelated information
2. **Provenance Tracking**: Enables tracing answer sources through provenance chain to meet compliance requirements
3. **Domain Entity Utilization**: Defines domain terminology and hierarchy through Ontology to improve LLM domain understanding
4. **KG-aware RAG**: Combines vector search with graph expansion to improve Faithfulness +24%, Context Recall +25%

The Phase 0 schema draft will be reviewed in the 2026-Q2 Ontology session to finalize pilot scope.

---

## References

- [Feast Feature Store](https://feast.dev/)
- [SageMaker Feature Store](https://aws.amazon.com/sagemaker/feature-store/)
- [Amazon Neptune Analytics](https://aws.amazon.com/neptune/analytics/)
- [Neo4j Graph Database](https://neo4j.com/)
- [Milvus Vector Database](https://milvus.io/)
- [SKOS Simple Knowledge Organization System](https://www.w3.org/2004/02/skos/)
- [OWL Web Ontology Language](https://www.w3.org/OWL/)
- [OpenLineage](https://openlineage.io/)
- [Ragas RAG Evaluation](https://docs.ragas.io/)
