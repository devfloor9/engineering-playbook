---
title: "Continuous Training Pipeline on EKS"
sidebar_label: "Continuous Training Pipeline"
description: "Langfuse traceë¥¼ charactersëcharacters¼ë¡ ícharactersµ ë°characters´í°ë¡ characters¹ê²©í´ GRPO/DPO preference tuningcharacters charactersííê³  Canaryë¡ ë°°í¬íë EKS based characters¤characters  ícharacters´íë¼characters¸"
tags: [continuous-training, grpo, dpo, eks, karpenter, 'scope:impl']
sidebar_position: 9
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Continuous Training Pipeline on EKS

## itemscharacters

Continuous Training Pipelinecharacters íë¡ëcharacters characters¶ë¡  í¸ë characters´characters¤ë¥¼ charactersëcharacters¼ë¡ ícharactersµ ë°characters´í°ë¡ characters íícharacters¬ ëª¨ë¸characters characters§characterscharacters characters¼ë¡ itemscharacters íë **Self-Improving Agent Loop**characters êµ¬í charactersí¤ícharacters²charactersëë¤. Langfuse OTel í¸ë characters´characters¤ë¥¼ S3 Data Lakeë¡ characterscharacters§íê³ , Reward Labelerë¡ ícharacters§characters íitemsí ë¤, GRPO/DPOë¡ preference tuningcharacters charactersíí©ëë¤. íitems íµê³¼ í Canary ë°°í¬ë¡ íë¡ëcharacterscharacters characters characters§ ë¡¤characterscharactersí©ëë¤.

### characters Continuous Trainingcharacters¸items

ê¸°characters¡´ ícharactersµ ë°©characterscharacters **characters characters  ë°characters´í°characters**characters characterscharacters¡´í©ëë¤. ícharacters§ë§ íë¡ëcharacters characters¬characters©characters í¼ëë°±characters ëcharacterscharacterscharacters´ ë°charactersíë©°, characters´ë¥¼ ë°charactersícharacters§ ëª»íë©´ ëª¨ë¸characters charactersitemscharacters´ characters§ë charactersë¡ **characters¤characters  characters¬characters© í¨í´ê³¼ ê´´ë¦¬**ë©ëë¤.

| ë¬¸characters  | ê¸°characters¡´ ë°©characters | Continuous Training |
|------|----------|---------------------|
| **ë°characters´í° characterscharacters§** | charactersë ë¼ë²¨ë§ (characters 1í) | charactersë trace characterscharacters§ (characters¤charactersitems) |
| **í¼ëë°± ë°characters** | 3-6itemscharacters | 1characters£¼characters¼ |
| **ícharacters§ itemscharacters ** | characters ê· ë°characters´í°characters ëê¸° | characters¬characters©characters í¼ëë°± characters¦characters ë°characters |
| **ë¹characters©** | ë¼ë²¨ë§ $10K/characters | Reward Model charactersëí |

:::tip characters¤ê³ ë¬¸characters characters°ê³
characters´ ë¬¸charactersë [Self-Improving Agent Loop](../design-architecture/self-improving-agent-loop.md)characters 5ë¨ê³ charactersí¤ícharacters²ë¥¼ EKScharacterscharacters êµ¬ííë ë°©ë²characters ë¤ë£¹ëë¤. characters¤ê³ ë°°ê²½ê³¼ characters ëµcharacters  characterscharacters¬ê²°characters characters characters¤ê³ ë¬¸charactersë¥¼ characters°¸characters¡°ícharacters¸characters.
:::

### 5ë¨ê³ ícharacters´íë¼characters¸ íë¦

```mermaid
flowchart LR
    subgraph Stage1["1. Trace Capture"]
        LF[Langfuse<br/>OTel Traces]
        S3[S3 Data Lake<br/>Iceberg Tables]
    end
    
    subgraph Stage2["2. Reward Labeling"]
        RAGAS[Ragas<br/>Batch Eval]
        JUDGE[LLM Judge<br/>Qwen3-4B Fleet]
        SCORE[Score<br/>Aggregation]
    end
    
    subgraph Stage3["3. Preference Tuning"]
        GRPO[GRPO/DPO<br/>NeMo-RL Job]
        CKPT[Checkpoint<br/>S3]
    end
    
    subgraph Stage4["4. Eval Gate"]
        EVAL[Ragas<br/>Threshold Check]
        CANARY[Canary Deploy<br/>kgateway 5%]
    end
    
    subgraph Stage5["5. Rollout/Rollback"]
        REGISTRY[MLflow<br/>Registry]
        PROD[Production<br/>100%]
    end
    
    LF -->|Parquet| S3
    S3 --> RAGAS
    S3 --> JUDGE
    RAGAS --> SCORE
    JUDGE --> SCORE
    SCORE --> GRPO
    GRPO --> CKPT
    CKPT --> EVAL
    EVAL -->|Pass| CANARY
    EVAL -->|Fail| GRPO
    CANARY -->|7d OK| PROD
    CANARY -->|Regression| REGISTRY
    PROD --> REGISTRY
    
    style Stage1 fill:#4285f4
    style Stage2 fill:#34a853
    style Stage3 fill:#fbbc04
    style Stage4 fill:#ea4335
    style Stage5 fill:#9c27b0
```

**íµcharacters¬ itemsë:**

1. **Trace â Dataset**: Langfuse íë¡ëcharacters characters¶ë¡  ë¡ê·¸ë¥¼ ícharactersµ ë°characters´í°ë¡ characters í
2. **Reward Labeling**: Ragas + LLM Judgeë¡ trace ícharacters§characters 0-1characters characters¼ë¡ characters¤characters½characters´ë§
3. **GRPO/DPO**: ê³ ëcharacters  traceë characters í¸(preference), characters ëcharacters characters ë¹characters í¸ë¡ ícharactersµ
4. **Eval Gate**: ícharactersµ í ícharacters§ Threshold ê²characters¦
5. **Canary â 100%**: characters characters§characters  í¸ëí½ characters¦items, íê· characters characters¦characters ë¡¤ë°±

---

## 1. Trace â Dataset Materializer

### 1-1. Langfuse OTel â S3 Parquet

Langfuseë OpenTelemetry íë¡í characters½ë¡ characters¶ë¡  í¸ë characters´characters¤ë¥¼ characterscharacters§í©ëë¤. characters´ë¥¼ S3characters Parquet ícharacterscharacters¼ë¡ characters characters¥ícharacters¬ ëê·ëª¨ ë°°characters¹ ë¶characterscharacters´ itemsë¥íëë¡ í©ëë¤.

```mermaid
flowchart LR
    VLLM[vLLM<br/>Inference]
    OTEL[OTel<br/>Collector]
    LF[Langfuse<br/>Postgres]
    AIRFLOW[Airflow<br/>DAG]
    S3[S3 Bucket<br/>Parquet]
    
    VLLM -->|OTLP gRPC| OTEL
    OTEL --> LF
    LF -->|SQL Export| AIRFLOW
    AIRFLOW -->|Partition by<br/>date/model/consent| S3
    
    style OTEL fill:#4285f4
    style AIRFLOW fill:#34a853
```

#### Langfuse Trace Schema

```sql
-- Langfuse traces ícharacters´ë¸ êµ¬characters¡° (PostgreSQL)
CREATE TABLE traces (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP,
    user_id TEXT,
    session_id TEXT,
    input TEXT,
    output TEXT,
    model TEXT,
    latency_ms INT,
    token_count INT,
    metadata JSONB,
    user_consent BOOLEAN  -- GDPR ëcharacters characters¬ë¶
);

-- characterscharacters ë°characters´í°
{
  "id": "trace-12345",
  "timestamp": "2026-04-18T03:15:00Z",
  "user_id": "user-abc",
  "input": "EKS Auto Modecharacters Karpentercharacters characters°¨characters´characters characters?",
  "output": "EKS Auto Modeë AWS characterscharacters  ê´ë¦¬í ë¸ë ê·¸ë£¹characters´ë©°...",
  "model": "glm-5-32b",
  "latency_ms": 850,
  "token_count": 512,
  "metadata": {
    "domain": "eks-documentation",
    "feedback_score": 4.5
  },
  "user_consent": true
}
```

#### S3 Partitioning characters ëµ

```bash
s3://training-data-lake/
âââ langfuse-traces/
    âââ date=2026-04-18/
    â   âââ model=glm-5-32b/
    â   â   âââ consent=true/
    â   â   â   âââ traces-000001.parquet  (10k rows)
    â   â   âââ consent=false/
    â   â       âââ traces-000002.parquet
    â   âââ model=qwen3-coder/
    â       âââ consent=true/
    â           âââ traces-000003.parquet
    âââ date=2026-04-19/
        âââ ...
```

**Partitioning characters´characters :**

- **ë characters§**: charactersitems ë²characters characters¿¼ë¦¬ charactersµcharacters í (characters: charactersµê·¼ 7characters¼ ë°characters´í°)
- **ëª¨ë¸**: ëª¨ë¸ë³ characters±ë¥ characters¶characters , A/B ícharacters¤í¸ ë¶ë¦¬
- **ëcharacters**: GDPR/CCPA ê·characters  characters¤characters, ëcharacters charactersë ë°characters´í° ícharactersµ characters characters¸

#### Apache Iceberg vs Hudi

| í¹characters§ | Apache Iceberg | Apache Hudi |
|------|---------------|-------------|
| **characters¤ëcharacters· ê²©ë¦¬** | charactersë²½í ACID í¸ëcharacters­characters | ícharactersë¼characters¸ based characters¼ê´characters± |
| **Schema characters§í** | charactersë characters»¬ë¼ characters¶items/characters­characters  | charactersë ë§characters´ê·¸ë characters´characters ícharacters |
| **characters¿¼ë¦¬ characters±ë¥** | íí°characters itemscharacters§characters¹ê¸° charactersµcharacters í | COW/MOR ëª¨ë characters í |
| **AWS íµí©** | Glue Catalog ë¤characters´í°ë¸ | EMR charactersµcharacters í |
| **ê¶characters¥ characters©ë** | ëê·ëª¨ ë¶characters characters¿¼ë¦¬ | characters¤charactersitems upsert characters¤characters¬ |

:::tip Iceberg ê¶characters¥
Continuous Trainingcharacters **characters½ê¸° characters¤characters¬ charactersí¬ë¡ë**(ë°°characters¹ ícharactersµ)characters´ë¯ë¡ Icebergë¥¼ ê¶characters¥í©ëë¤. Schema ë³ê²½(characters ê· ë©íë°characters´í° íë characters¶items)characters´ ë¹ë²íë¯ë¡ charactersë Schema Evolutioncharacters´ characters ë¦¬í©ëë¤.
:::

#### Airflow DAG characterscharacters

```python
# dags/langfuse_to_s3.py
from airflow import DAG
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

def export_langfuse_traces(**context):
    """Langfuse Postgres â S3 Parquet ë³í"""
    
    # Langfuse DB characters°ê²°
    pg_hook = PostgresHook(postgres_conn_id='langfuse_db')
    
    # characters´characters  ë characters§ ë°characters´í° characters¶characters¶ (user_consent=trueë§)
    yesterday = context['ds']
    query = f"""
        SELECT 
            id, timestamp, user_id, session_id,
            input, output, model, latency_ms, token_count,
            metadata
        FROM traces
        WHERE DATE(timestamp) = '{yesterday}'
          AND user_consent = true
          AND output IS NOT NULL
        ORDER BY timestamp
    """
    
    df = pg_hook.get_pandas_df(query)
    
    # ëª¨ë¸ë³ë¡ ê·¸ë£¹íícharacters¬ Parquet characters characters¥
    for model, group in df.groupby('model'):
        table = pa.Table.from_pandas(group)
        
        # S3 ê²½ë¡: s3://bucket/date=2026-04-18/model=glm-5-32b/consent=true/
        s3_key = f"langfuse-traces/date={yesterday}/model={model}/consent=true/traces-{context['ti'].xcom_pull()}.parquet"
        
        # S3 charactersë¡ë
        s3_hook = S3Hook(aws_conn_id='aws_default')
        with s3_hook.get_conn().open(f"s3://training-data-lake/{s3_key}", 'wb') as f:
            pq.write_table(table, f, compression='snappy')
    
    return len(df)

with DAG(
    dag_id='langfuse_to_s3_daily',
    schedule_interval='0 6 * * *',  # ë§¤characters¼ characters¤characters  6characters
    start_date=datetime(2026, 4, 1),
    catchup=False,
    default_args={
        'retries': 3,
        'retry_delay': timedelta(minutes=5),
    }
) as dag:
    
    export_task = PythonOperator(
        task_id='export_traces',
        python_callable=export_langfuse_traces,
    )
```

#### AWS Glue Catalog ë±ë¡

```python
# glue_iceberg_table.py
import boto3

glue = boto3.client('glue')

# Iceberg ícharacters´ë¸ characters characters
glue.create_table(
    DatabaseName='training_data',
    TableInput={
        'Name': 'langfuse_traces',
        'StorageDescriptor': {
            'Columns': [
                {'Name': 'id', 'Type': 'string'},
                {'Name': 'timestamp', 'Type': 'timestamp'},
                {'Name': 'user_id', 'Type': 'string'},
                {'Name': 'input', 'Type': 'string'},
                {'Name': 'output', 'Type': 'string'},
                {'Name': 'model', 'Type': 'string'},
                {'Name': 'latency_ms', 'Type': 'int'},
                {'Name': 'metadata', 'Type': 'struct<feedback_score:double,domain:string>'},
            ],
            'Location': 's3://training-data-lake/langfuse-traces/',
            'InputFormat': 'org.apache.iceberg.mr.hive.HiveIcebergInputFormat',
            'OutputFormat': 'org.apache.iceberg.mr.hive.HiveIcebergOutputFormat',
            'SerdeInfo': {
                'SerializationLibrary': 'org.apache.iceberg.mr.hive.HiveIcebergSerDe'
            }
        },
        'PartitionKeys': [
            {'Name': 'date', 'Type': 'date'},
            {'Name': 'model', 'Type': 'string'},
            {'Name': 'consent', 'Type': 'boolean'},
        ],
        'Parameters': {
            'table_type': 'ICEBERG',
            'format': 'parquet',
            'write.parquet.compression-codec': 'snappy',
        }
    }
)
```

---

## 2. Reward Labeler Fleet

### 2-1. Reward Labeling itemsë

**Reward Labeling**characters items tracecharacters ícharacters§characters 0-1characters  characters¬characters´ characters charactersë¡ íitemsíë íë¡characters¸characters¤charactersëë¤. characters´ characters charactersë GRPO/DPO ícharactersµcharacterscharacters **characters í¸ë(preference) characters í¸**ë¡ characters¬characters©ë©ëë¤.

```
ê³ ëcharacters  trace (0.8-1.0) â characters í¸ characterscharacters  (ícharactersµ characters itemscharacters¤characters¹ â)
characters ëcharacters  trace (0.0-0.3) â ë¹characters í¸ characterscharacters  (ícharactersµ characters itemscharacters¤characters¹ â)
```

### 2-2. íitems characters§í characters¡°í©

#### Ragas ë©í¸ë¦­

[Ragas íitems íë characterscharactersí¬](../operations-mlops/ragas-evaluation.md)ë RAG characterscharacters¤ícharacters ícharacters§characters itemsê´characters characters¼ë¡ characters¸¡characters í©ëë¤.

```python
from ragas.metrics import faithfulness, answer_relevancy, context_precision

# Ragas ë°°characters¹ íitems
scores = {
    'faithfulness': 0.92,      # ëµë³characters´ characters»¨ícharacters¤í¸characters characters¶©characters¤íitems
    'answer_relevancy': 0.88,  # ëµë³characters´ characters§ë¬¸ê³¼ ê´ë ¨charactersëitems
    'context_precision': 0.85  # ê²charactersë characters»¨ícharacters¤í¸items characters ííitems
}

# itemscharacters¤ íê· characters¼ë¡ charactersµcharacters¢ Reward ê³characters°
reward = (
    0.5 * scores['faithfulness'] +
    0.3 * scores['answer_relevancy'] +
    0.2 * scores['context_precision']
)
# â reward = 0.896
```

#### LLM-as-a-Judge

characterscharacters ëª¨ë¸(Qwen3-4B)characters judgeë¡ ícharacters©ícharacters¬ ëµë³ ícharacters§characters íitemsí©ëë¤.

```python
# LLM Judge íë¡¬íí¸
JUDGE_PROMPT = """
ë¤characters characters§ë¬¸ê³¼ ëµë³characters íitemsícharacters¸characters.

**characters§ë¬¸**: {question}
**ëµë³**: {answer}

**íitems criteria**:
1. characters ícharacters±: ê¸°characters characters  characters¤ë¥items charactersëitems?
2. charactersê²°characters±: characters§ë¬¸characters ëª¨ë  characters¸¡ë©´characters ë¤ë£¨ëitems?
3. ëªícharacters±: characters´í´íê¸° characters¬characters´items?

characters charactersë¥¼ 0.0-1.0 characters¬characters´ë¡ characters¶ë ¥ícharacters¸characters. JSON ícharacterscharacters¼ë¡ë§ charactersëµícharacters¸characters:
{{"score": 0.85, "reasoning": "..."}}
"""

# Qwen3-4Bë¡ íitems (vLLM ë°°characters¹ characters¶ë¡ )
judge_response = vllm_client.chat.completions.create(
    model="qwen3-coder-4b",
    messages=[{"role": "user", "content": JUDGE_PROMPT.format(question=q, answer=a)}],
    temperature=0.1,
    max_tokens=200,
)

judge_score = json.loads(judge_response.choices[0].message.content)['score']
# â judge_score = 0.85
```

#### charactersµcharacters¢ Reward í©characters°

```python
# Ragas + LLM Judge characters¡°í©
final_reward = (
    0.6 * ragas_reward +      # Ragas itemscharacters¤characters¹ 60%
    0.4 * judge_score         # Judge itemscharacters¤characters¹ 40%
)
```

### 2-3. KServe InferenceService ë°°í¬

Qwen3-4B Judge ëª¨ë¸characters KServeë¡ ë°°í¬ícharacters¬ ê³ itemscharacters©characters± fleetcharacters êµ¬characters±í©ëë¤.

```yaml
# reward-labeler-inference.yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: reward-labeler-qwen3
  namespace: training-pipeline
spec:
  predictor:
    minReplicas: 3
    maxReplicas: 10
    containers:
    - name: kserve-container
      image: vllm/vllm-openai:v0.18.2
      args:
      - --model=Qwen/Qwen3-Coder-4B-Instruct
      - --served-model-name=qwen3-judge
      - --tensor-parallel-size=1
      - --max-model-len=8192
      - --gpu-memory-utilization=0.9
      resources:
        requests:
          nvidia.com/gpu: 1
          memory: 16Gi
        limits:
          nvidia.com/gpu: 1
          memory: 24Gi
      env:
      - name: SERVED_MODEL_NAME
        value: "qwen3-judge"
---
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: reward-labeler-scaler
  namespace: training-pipeline
spec:
  scaleTargetRef:
    name: reward-labeler-qwen3
  minReplicaCount: 3
  maxReplicaCount: 10
  triggers:
  - type: prometheus
    metadata:
      serverAddress: http://prometheus:9090
      metricName: vllm_requests_running
      threshold: "10"
      query: |
        avg(vllm_requests_running{model="qwen3-judge"})
```

**characters¤í characters¤characters¼characters¼ë§ characters ëµ:**

- **charactersµcharacters 3 replica**: ê¸°ë³¸ characters²ë¦¬ë ë³´characters¥
- **charactersµë 10 replica**: ë°°characters¹ íitems characters characters¤ícharacters´í¬ ëcharacters
- **í¸ë¦¬ê±°**: vLLM ëê¸° characterscharacters²­ characters > 10 characters characters¤characters¼characters¼characterscharacters

### 2-4. ë°°characters¹ íitems Job

```python
# batch_reward_labeling.py
import pandas as pd
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision
import openai
import json
from concurrent.futures import ThreadPoolExecutor

# S3characterscharacters charactersµê·¼ 7characters¼ trace ë¡ë
df = pd.read_parquet(
    's3://training-data-lake/langfuse-traces/',
    filters=[
        ('date', '>=', '2026-04-11'),
        ('date', '<=', '2026-04-18'),
        ('model', '=', 'glm-5-32b'),
        ('consent', '=', True),
    ]
)

# Ragas íitems
ragas_results = evaluate(
    df,
    metrics=[faithfulness, answer_relevancy, context_precision]
)

# LLM Judge íitems (ë³ë ¬ characters²ë¦¬)
def judge_single_trace(row):
    response = openai.ChatCompletion.create(
        model="qwen3-judge",
        messages=[{
            "role": "user",
            "content": JUDGE_PROMPT.format(
                question=row['input'],
                answer=row['output']
            )
        }],
        temperature=0.1,
        max_tokens=200,
        # KServe InferenceService charactersëí¬characters¸í¸
        api_base="http://reward-labeler-qwen3.training-pipeline.svc.cluster.local:8000/v1"
    )
    return json.loads(response.choices[0].message.content)['score']

with ThreadPoolExecutor(max_workers=50) as executor:
    judge_scores = list(executor.map(judge_single_trace, df.to_dict('records')))

# charactersµcharacters¢ Reward ê³characters°
df['ragas_reward'] = (
    0.5 * ragas_results['faithfulness'] +
    0.3 * ragas_results['answer_relevancy'] +
    0.2 * ragas_results['context_precision']
)
df['judge_score'] = judge_scores
df['final_reward'] = 0.6 * df['ragas_reward'] + 0.4 * df['judge_score']

# S3characters ë characters´ë¸ë§ë ë°characters´í°characters characters characters¥
df.to_parquet('s3://training-data-lake/labeled-dataset/2026-04-18.parquet')
```

### 2-5. ë¹characters© characterscharacters

| ë¦¬characterscharacters¤ | characters¤í | charactersitemsë¹ ë¹characters© | characters¼characters¼ ë¹characters© (10charactersitems itemsë) |
|--------|------|-----------|----------------------|
| **Qwen3-4B Judge Fleet** | g6.xlarge Ã 3 | $0.93 | $9.30 |
| **Ragas íitems (Bedrock Claude)** | - | API í¸characters¶ë¹ | $5-10 (1ë§ trace criteria) |
| **Airflow/Kubernetes** | ê¸°characters¡´ characters¸íë¼ | - | - |
| **characters´ ë¹characters©** | - | - | **$15-20/characters¼** |

characters°items $5,000-7,000 characterscharacters¤characters¼ë¡ charactersë ë¼ë²¨ë§($10K/characters) ëë¹ **95% characters items** í¨ê³¼.

---

## 3. GRPO/DPO ícharactersµ Job

### 3-1. GRPO vs DPO itemsë

#### GRPO (Group Relative Policy Optimization)

**GRPO**ë ëcharacters¼ íë¡¬íí¸characters ëí characters¬ë¬ charactersëµcharacters reward criteriacharacters¼ë¡ characterscharactersíícharacters¬ ícharactersµíë ë°©ë²charactersëë¤.

```
íë¡¬íí¸: "EKS Auto Modecharacters characters¥characters characters?"

charactersëµ A (reward=0.9): "AWSitems ë¸ëë¥¼ characterscharacters  ê´ë¦¬ícharacters¬ characters´characters ë¶ë´characters´ itemscharactersí©ëë¤..."
charactersëµ B (reward=0.6): "Auto Modeë í¸ë¦¬í©ëë¤..."
charactersëµ C (reward=0.3): "characters ëª¨ë¥´ê² charactersµëë¤."

ícharactersµ: A > B > C characterscharactersë¡ characters characters± charactersµcharacters í
```

**characters¥characters :**

- characters ë characters characters ëcharacters  **charactersë characterscharacters** ícharactersµ â ë¼ë²¨ë§ ë¸characters´characters¦characters itemsê±´
- í íë¡¬íí¸ë¹ characters¬ë¬ charactersëµ characterscharacters± â ë°characters´í° í¨characters¨characters 
- RLHF ëë¹ itemsë¨ (Reward Model ë³ë ícharactersµ ë¶ícharacters)

#### DPO (Direct Preference Optimization)

**DPO**ë characters í¸/ë¹characters í¸ characterscharacters characters§characters  ícharactersµíë ë°©ë²charactersëë¤.

```
íë¡¬íí¸: "Karpentercharacters characters£¼characters ê¸°ë¥characters?"

characters í¸ (reward >= 0.7):
"Karpenterë charactersë ë¸ë íë¡ë¹characters ë, bin-packing charactersµcharacters í..."

ë¹characters í¸ (reward < 0.5):
"Karpenterë characters¤characters¼characters¼ë§ ëêµ¬charactersëë¤." (ëë¬´ characters§§characters)

ícharactersµ: characters í¸ charactersëµcharacters íë¥  â, ë¹characters í¸ charactersëµcharacters íë¥  â
```

**characters¥characters :**

- RLHFcharacters²ë¼ ë³ë Value Function characterscharacters´ **ë¨characters¼ Lossë¡ ícharactersµ**
- characterscharacters characters characters¸ ícharactersµ (PPO ëë¹ ícharacters´í¼íë¼ë¯¸í° íë itemsë¨)
- íë¡ëcharacters characters characters© characters¬ë¡ ë§characters (Llama 3.1, Claude 3 ë±)

#### characters í criteria

| charactersí© | ê¶characters¥ ë°©ë² | characters´characters  |
|------|----------|------|
| **ë¤charactersí charactersëµ characterscharacters± itemsë¥** | GRPO | characterscharacters ícharactersµcharacters¼ë¡ ë°characters´í° í¨characters¨ â |
| **ëªíí characters í¸/ë¹characters í¸ êµ¬ë¶** | DPO | ë¨charactersíê³  characterscharacters characters  |
| **ë¼ë²¨ë§ ë¸characters´characters¦ ë§characters** | GRPO | charactersë characterscharactersë characters ë characters charactersë³´ë¤ itemsê±´ |
| **ë¹ ë¥¸ íë¡í ícharacters´í** | DPO | ícharacters´í¼íë¼ë¯¸í° íë itemsë¨ |

### 3-2. NeMo-RL based GRPO ícharactersµ

[NeMo Framework](../model-serving/inference-frameworks/nemo-framework.md)ë NVIDIAcharacters ëê·ëª¨ ëª¨ë¸ ícharactersµ íë characterscharactersí¬charactersëë¤.

```python
# nemo_grpo_training.py
from nemo.collections.llm import GRPO, GPTModel
from nemo.collections.nlp.data import PreferenceDataset

# ícharactersµ ë°characters´í° ë¡ë
dataset = PreferenceDataset(
    data_path='s3://training-data-lake/labeled-dataset/',
    reward_column='final_reward',
    min_reward_threshold=0.5,  # 0.5 characters´íë characters characters¸
)

# ê¸°ë³¸ ëª¨ë¸ ë¡ë
model = GPTModel.from_pretrained('glm-5-32b')

# GRPO characters¤characters 
grpo_config = GRPO(
    num_iterations=1000,
    batch_size=32,
    learning_rate=1e-5,
    kl_coeff=0.1,  # KL divergence íëí° (charactersë³¸ ëª¨ë¸ê³¼ ëë¬´ ë©characters´characters§characters§ charactersëë¡)
    cliprange=0.2,
    vf_coeff=0.5,
)

# ë¶characters° ícharactersµ characters¤í
trainer = Trainer(
    devices=8,  # H100 8items
    num_nodes=3,  # 3 ë¸ë = 24 GPU
    precision='bf16',
    strategy='fsdp',  # Fully Sharded Data Parallel
)

trainer.fit(model, grpo_config, dataset)
```

### 3-3. TRL based DPO ícharactersµ

[TRL (Transformer Reinforcement Learning)](https://github.com/huggingface/trl)characters HuggingFacecharacters RLHF ë¼characters´ë¸ë¬ë¦¬charactersëë¤.

```python
# trl_dpo_training.py
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset

# ëª¨ë¸ ë¡ë
model = AutoModelForCausalLM.from_pretrained('glm-5-32b', torch_dtype='bfloat16')
tokenizer = AutoTokenizer.from_pretrained('glm-5-32b')

# characters í¸/ë¹characters í¸ ë°characters´í°characters characters¤ë¹
def format_dpo_dataset(example):
    """Reward criteriacharacters¼ë¡ characters í¸/ë¹characters í¸ êµ¬ë¶"""
    if example['final_reward'] >= 0.7:
        return {
            'prompt': example['input'],
            'chosen': example['output'],
            'rejected': None,  # ë¹characters í¸ characterscharacters ë ë³ë ë§¤characters¹­
        }
    else:
        return None

dataset = load_dataset('parquet', data_files='s3://training-data-lake/labeled-dataset/*.parquet')
dpo_dataset = dataset.map(format_dpo_dataset).filter(lambda x: x is not None)

# DPO ícharactersµ characters¤characters 
training_args = DPOConfig(
    output_dir='/output/glm-5-dpo',
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    learning_rate=5e-7,
    max_length=4096,
    beta=0.1,  # DPO temperature (ëcharacterscharactersë¡ characters í¸ë characters°¨characters´ itemscharacters¡°)
    num_train_epochs=1,
    bf16=True,
    logging_steps=10,
    save_strategy='steps',
    save_steps=100,
)

# ícharactersµ characters¤í
trainer = DPOTrainer(
    model=model,
    args=training_args,
    train_dataset=dpo_dataset,
    tokenizer=tokenizer,
)

trainer.train()
```

### 3-4. Kubernetes Job YAML

```yaml
# grpo-training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: grpo-training-glm5
  namespace: training-pipeline
spec:
  parallelism: 3  # 3 ë¸ë ë³ë ¬ characters¤í
  completions: 1
  template:
    metadata:
      labels:
        app: grpo-training
        karpenter.sh/capacity-type: spot  # Spot characters¸characters¤í´characters¤ ícharacters©
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: p5en.48xlarge  # H200 8items
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        operator: Equal
        value: spot
        effect: NoSchedule
      
      volumes:
      - name: checkpoint-storage
        persistentVolumeClaim:
          claimName: training-checkpoints
      
      containers:
      - name: nemo-trainer
        image: nvcr.io/nvidia/nemo:26.02
        command:
        - python
        - /workspace/nemo_grpo_training.py
        args:
        - --data-path=s3://training-data-lake/labeled-dataset/
        - --output-path=/checkpoints/grpo-run-001
        - --num-nodes=3
        - --devices=8
        volumeMounts:
        - name: checkpoint-storage
          mountPath: /checkpoints
        resources:
          requests:
            nvidia.com/gpu: 8
            memory: 1600Gi  # H200 141GB Ã 8 + characters¤ë²í¤ë
          limits:
            nvidia.com/gpu: 8
            memory: 1600Gi
        env:
        - name: NCCL_DEBUG
          value: "INFO"
        - name: NCCL_MIN_NCHANNELS
          value: "16"
        - name: FI_PROVIDER
          value: "efa"
        - name: FI_EFA_USE_DEVICE_RDMA
          value: "1"
      
      restartPolicy: OnFailure
---
# Karpenter NodePool - Spot characters¸characters¤í´characters¤
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: training-spot-pool
spec:
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 5m
  template:
    spec:
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["spot"]
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["p5en.48xlarge"]
      - key: topology.kubernetes.io/zone
        operator: In
        values: ["us-east-2a", "us-east-2b"]
      
      nodeClassRef:
        name: training-gpu-class
      
      taints:
      - key: nvidia.com/gpu
        effect: NoSchedule
      - key: karpenter.sh/capacity-type
        value: spot
        effect: NoSchedule
```

#### Volcano ë°°characters¹ characters¤characters¼characters¤ë§

[Volcano](https://volcano.sh/)ë AI/ML charactersí¬ë¡ëë¥¼ charactersí ë°°characters¹ characters¤characters¼characters¤ë¬charactersëë¤. Gang Schedulingcharacters¼ë¡ ëª¨ë  ë¸ëitems characters¤ë¹ë  ëê¹characters§ ëê¸°íë¤items ëcharacterscharacters characters¤íí©ëë¤.

```yaml
# volcano-job.yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: grpo-training-volcano
spec:
  minAvailable: 3  # 3items ë¸ë ëª¨ë characters¤ë¹ë  ëê¹characters§ ëê¸°
  schedulerName: volcano
  queue: training-queue
  tasks:
  - name: trainer
    replicas: 3
    template:
      spec:
        # (characterscharacters ëcharacters¼í characters»¨ícharacters´ë characters¤í)
```

**Gang Schedulingcharacters ícharacterscharacters±:**

```
characters¼ë° Kubernetes:
  ë¸ë1: characters¦characters characterscharacters â ë¤ë¥¸ ë¸ë ëê¸° characters¤ â GPU characters í´
  ë¸ë2: 5ë¶ í characterscharacters
  ë¸ë3: 10ë¶ í characterscharacters
  â ë¸ë1characters GPUë 10ë¶items ë­ë¹

Volcano Gang Scheduling:
  ë¸ë1, 2, 3: ëª¨ë characters¤ë¹ë  ëê¹characters§ ëê¸°
  â 10ë¶ í ëcharacters characterscharacters â ëª¨ë  GPU characters¦characters ícharacters©
```

### 3-5. ë¹characters© characterscharacters

| ë¦¬characterscharacters¤ | characters¤í | charactersitemsë¹ ë¹characters© | ícharactersµ charactersitems (1 epoch) | characters´ ë¹characters© |
|--------|------|-----------|-------------------|---------|
| **p5en.48xlarge Spot** | H200 8items Ã 3 ë¸ë | $10-15/GPU-hr | 4-6charactersitems | **$960-2,160** |
| **FSx Lustre (ícharactersµ ë°characters´í°)** | 1.2 MB/s/TiB | $0.14/GB-characters | - | ~$50 |
| **S3 characters²´í¬í¬characters¸í¸ characters characters¥** | - | $0.023/GB | - | ~$10 |
| **iterationë¹ characters´ ë¹characters©** | - | - | - | **$1,020-2,220** |

:::warning ë¹characters© ëcharacters¤í´ë characters´ë¨¸
p5en Spot itemsê²©characters characterscharacterscharacters ë°ë¼ ë³ëë©ëë¤. Spot characters¤ë¨(interruption) ëë¹ characters²´í¬í¬characters¸í¸ charactersë characters characters¥ ícharacters. characters°items 24í iteration itemscharacters  characters $24K-53K characterscharacters¤.
:::

---

## 4. Eval Gate

### 4-1. Threshold ê²characters¦

ícharactersµë ëª¨ë¸characters ë°°í¬ characters  ícharacters§ criteriacharacters (threshold)characters íµê³¼í´characters¼ í©ëë¤.

```python
# eval_gate.py
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# ícharacters¤í¸ ë°characters´í°characters (íë¡ëcharacters ëí charactersí 500items)
test_dataset = load_test_dataset('s3://training-data-lake/test-dataset.parquet')

# characters ê· ëª¨ë¸ íitems
new_model_results = evaluate(
    test_dataset,
    model='glm-5-dpo-checkpoint-1000',
    metrics=[faithfulness, answer_relevancy]
)

# criteriacharacters  ëª¨ë¸ íitems
baseline_results = evaluate(
    test_dataset,
    model='glm-5-baseline',
    metrics=[faithfulness, answer_relevancy]
)

# Threshold ê²characters¦
THRESHOLDS = {
    'faithfulness': 0.85,
    'answer_relevancy': 0.80,
}

REGRESSION_TOLERANCE = {
    'faithfulness': 0.03,  # 3%p characters´characters íë½ characters characters¤í¨
    'p99_latency_ms': 0.10,  # 10% characters´characters characters¦items characters characters¤í¨
}

def check_eval_gate(new, baseline, thresholds, regression):
    failures = []
    
    # characters ë Threshold ê²characters¦
    for metric, threshold in thresholds.items():
        if new[metric] < threshold:
            failures.append(f"{metric}: {new[metric]:.3f} < {threshold}")
    
    # íê· ê²characters¦
    if baseline['faithfulness'] - new['faithfulness'] > regression['faithfulness']:
        failures.append(f"Faithfulness regression: {baseline['faithfulness']:.3f} â {new['faithfulness']:.3f}")
    
    if (new['p99_latency_ms'] - baseline['p99_latency_ms']) / baseline['p99_latency_ms'] > regression['p99_latency_ms']:
        failures.append(f"Latency regression: {baseline['p99_latency_ms']:.0f}ms â {new['p99_latency_ms']:.0f}ms")
    
    if failures:
        print("â Eval Gate FAILED:")
        for f in failures:
            print(f"  - {f}")
        return False
    else:
        print("â Eval Gate PASSED")
        return True

passed = check_eval_gate(new_model_results, baseline_results, THRESHOLDS, REGRESSION_TOLERANCE)
```

### 4-2. Canary Deployment (kgateway)

[Gateway API](https://gateway-api.sigs.k8s.io/)characters HTTPRouteë¥¼ characters¬characters©ícharacters¬ í¸ëí½characters characters characters§characters characters¼ë¡ characters íí©ëë¤.

#### Stage 1: 5% Canary

```yaml
# canary-5-percent.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-serving-canary
  namespace: model-serving
spec:
  parentRefs:
  - name: inference-gateway
    namespace: kgateway-system
  
  hostnames:
  - "api.example.com"
  
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/chat/completions
    
    backendRefs:
    # ê¸°characters¡´ stable ë²characters  (95%)
    - name: vllm-glm5-stable
      port: 8000
      weight: 95
    
    # characters ê· canary ë²characters  (5%)
    - name: vllm-glm5-canary
      port: 8000
      weight: 5
```

#### Stage 2: 25% (24charactersitems í ë¬¸characters  characterscharacters¼ë©´)

```yaml
# canary-25-percent.yaml
backendRefs:
- name: vllm-glm5-stable
  port: 8000
  weight: 75
- name: vllm-glm5-canary
  port: 8000
  weight: 25
```

#### Stage 3: 100% (7characters¼ í charactersµcharacters¢ characters¹ê²©)

```yaml
# canary-100-percent.yaml
backendRefs:
- name: vllm-glm5-canary
  port: 8000
  weight: 100
```

### 4-3. Canary ëª¨ëí°ë§

```yaml
# canary-monitor-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-canary-rules
  namespace: monitoring
data:
  canary-alerts.yml: |
    groups:
    - name: canary-monitoring
      interval: 30s
      rules:
      # Faithfulness íê· itemscharacters§
      - alert: CanaryFaithfulnessDrop
        expr: |
          (
            avg_over_time(langfuse_trace_faithfulness{model="glm5-canary"}[1h])
            -
            avg_over_time(langfuse_trace_faithfulness{model="glm5-stable"}[1h])
          ) < -0.03
        for: 10m
        annotations:
          summary: "Canary ëª¨ë¸ faithfulness 3%p characters´characters íë½"
          description: "Canary: {{ $value | humanize }}pp drop"
      
      # P99 ë characters´í´characters íê·
      - alert: CanaryLatencyRegression
        expr: |
          (
            histogram_quantile(0.99, vllm_request_duration_seconds{model="glm5-canary"})
            /
            histogram_quantile(0.99, vllm_request_duration_seconds{model="glm5-stable"})
          ) > 1.10
        for: 5m
        annotations:
          summary: "Canary ëª¨ë¸ P99 ë characters´í´characters 10% characters´characters characters¦items"
      
      # charactersë¬characters¨ characters¦items
      - alert: CanaryErrorRateHigh
        expr: |
          rate(vllm_request_errors_total{model="glm5-canary"}[5m])
          >
          rate(vllm_request_errors_total{model="glm5-stable"}[5m]) * 2
        for: 5m
        annotations:
          summary: "Canary ëª¨ë¸ charactersë¬characters¨ 2ë°° characters´characters characters¦items"
```

### 4-4. CI íµí© (Argo Workflows)

```yaml
# canary-deployment-workflow.yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: canary-deployment-
  namespace: training-pipeline
spec:
  entrypoint: canary-pipeline
  
  templates:
  - name: canary-pipeline
    steps:
    # Step 1: Eval Gate
    - - name: eval-gate
        template: run-eval-gate
    
    # Step 2: Canary 5%
    - - name: deploy-canary-5
        template: apply-canary-weight
        arguments:
          parameters:
          - name: weight
            value: "5"
        when: "{{steps.eval-gate.outputs.result}} == passed"
    
    # Step 3: 24charactersitems ëê¸° + ëª¨ëí°ë§
    - - name: monitor-24h
        template: monitor-canary
        arguments:
          parameters:
          - name: duration
            value: "24h"
    
    # Step 4: Canary 25%
    - - name: deploy-canary-25
        template: apply-canary-weight
        arguments:
          parameters:
          - name: weight
            value: "25"
        when: "{{steps.monitor-24h.outputs.result}} == healthy"
    
    # Step 5: 7characters¼ ëê¸°
    - - name: monitor-7d
        template: monitor-canary
        arguments:
          parameters:
          - name: duration
            value: "168h"
    
    # Step 6: 100% characters¹ê²©
    - - name: promote-to-production
        template: apply-canary-weight
        arguments:
          parameters:
          - name: weight
            value: "100"
        when: "{{steps.monitor-7d.outputs.result}} == healthy"
  
  - name: run-eval-gate
    script:
      image: python:3.11
      command: [python]
      source: |
        # (characters eval_gate.py characters½ë)
        passed = check_eval_gate(...)
        print("passed" if passed else "failed")
  
  - name: apply-canary-weight
    inputs:
      parameters:
      - name: weight
    resource:
      action: apply
      manifest: |
        apiVersion: gateway.networking.k8s.io/v1
        kind: HTTPRoute
        metadata:
          name: model-serving-canary
        spec:
          rules:
          - backendRefs:
            - name: vllm-glm5-stable
              weight: {{100 - inputs.parameters.weight}}
            - name: vllm-glm5-canary
              weight: {{inputs.parameters.weight}}
  
  - name: monitor-canary
    inputs:
      parameters:
      - name: duration
    script:
      image: curlimages/curl:latest
      command: [sh]
      source: |
        # Prometheuscharacterscharacters canary ë©í¸ë¦­ characters¡°í
        sleep {{inputs.parameters.duration}}
        
        # Faithfulness ícharacters¸
        faithfulness_drop=$(curl -s 'http://prometheus:9090/api/v1/query?query=...')
        if [ "$faithfulness_drop" -lt "-0.03" ]; then
          echo "unhealthy"
          exit 1
        fi
        
        echo "healthy"
```

---

## 5. Registry & Rollback

### 5-1. MLflow Model Registry

[MLflow](https://mlflow.org/)ë ëª¨ë¸ ë²characters  ê´ë¦¬characters ë¼characters´ícharacters¬characters´í´characters characters¶characters í©ëë¤.

```python
# mlflow_registry.py
import mlflow
from mlflow.tracking import MlflowClient

mlflow.set_tracking_uri("http://mlflow-server.mlflow.svc.cluster.local:5000")
client = MlflowClient()

# characters ê· ëª¨ë¸ ë±ë¡
model_uri = "s3://training-checkpoints/grpo-run-001/checkpoint-1000"

with mlflow.start_run(run_name="grpo-iteration-001"):
    # ë©í¸ë¦­ ë¡ê¹
    mlflow.log_metrics({
        "faithfulness": 0.92,
        "answer_relevancy": 0.88,
        "p99_latency_ms": 850,
        "training_loss": 0.15,
    })
    
    # ëª¨ë¸ ë±ë¡
    mlflow.register_model(
        model_uri=model_uri,
        name="glm-5-grpo",
        tags={
            "iteration": "001",
            "training_date": "2026-04-18",
            "base_model": "glm-5-32b",
            "method": "GRPO",
            "eval_gate_status": "passed",
        }
    )

# Stage characters í (None â Staging â Production)
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=1,
    stage="Staging",  # Canary ë°°í¬ characters¤
)

# 7characters¼ í Production characters¹ê²©
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=1,
    stage="Production",
)

# characters´characters  ë²characters  Archive
client.transition_model_version_stage(
    name="glm-5-grpo",
    version=0,  # characters´characters  baseline ëª¨ë¸
    stage="Archived",
)
```

### 5-2. Agent Versioning characters°ê³

[Agent Versioning](../../aidlc/enterprise/agent-versioning/index.md)characters characterscharacters´characters í¸ characters½ëcharacters ëª¨ë¸ ë²characters characters ëê¸°íí©ëë¤.

```yaml
# agent-version-manifest.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-version-config
  namespace: agentic-platform
data:
  versions.yaml: |
    agents:
      - name: code-assistant
        version: v2.3.0
        model:
          name: glm-5-grpo
          version: 1
          registry: mlflow
          stage: Production
        tools:
          - mcp-github
          - mcp-jira
        prompt_version: v2.3.0
      
      - name: docs-writer
        version: v1.5.0
        model:
          name: glm-5-grpo
          version: 0  # characterscharacters§ characters´characters  ë²characters  characters¬characters©
          registry: mlflow
          stage: Production
```

### 5-3. Bedrock Agents ícharacters´ë¸ë¦¬ë ëê¸°

ícharacters´ë¸ë¦¬ë charactersí¤ícharacters²(EKS + Bedrock)characterscharactersë EKS ëª¨ë¸ charactersë°characters´í¸ë¥¼ Bedrock Agentcharactersë ë°charactersí´characters¼ í©ëë¤.

```python
# sync_to_bedrock.py
import boto3

bedrock = boto3.client('bedrock-agent')

# EKS characters ê· ëª¨ë¸ characters ë³´
eks_model_version = "glm-5-grpo-v1"
eks_endpoint = "http://vllm-glm5-canary.model-serving.svc.cluster.local:8000"

# Bedrock Agent charactersë°characters´í¸
bedrock.update_agent(
    agentId='AGENT123',
    agentName='code-assistant',
    foundationModel='anthropic.claude-3-sonnet-20240229-v1:0',  # fallback ëª¨ë¸
    instruction=f"""
    Use the custom EKS model for code generation tasks:
    - Model: {eks_model_version}
    - Endpoint: {eks_endpoint}
    
    Fallback to Claude Sonnet if EKS model is unavailable.
    """,
)
```

### 5-4. Rollback YAML

íê· ë°ê²¬ characters characters¦characters characters´characters  stable ë²characters characters¼ë¡ ë¡¤ë°±í©ëë¤.

```yaml
# rollback-to-stable.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-serving-rollback
  namespace: model-serving
spec:
  rules:
  - backendRefs:
    # Canary characters ê±°, 100% stableë¡ ë³µêµ¬
    - name: vllm-glm5-stable
      port: 8000
      weight: 100
---
# Canary Deployment characters characters§
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-glm5-canary
  namespace: model-serving
spec:
  replicas: 0  # characters¦characters characters¤characters¼characters¼ë¤characters´
```

**Rollback charactersëí (Argo Rollouts):**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: vllm-glm5
  namespace: model-serving
spec:
  replicas: 3
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 24h}
      - setWeight: 25
      - pause: {duration: 168h}
      - setWeight: 100
      
      # charactersë ë¡¤ë°± characters¡°ê±´
      analysis:
        templates:
        - templateName: canary-quality-check
        args:
        - name: service-name
          value: vllm-glm5-canary
  
  revisionHistoryLimit: 5  # charactersµê·¼ 5items ë²characters  characters characters§
```

### 5-5. Checkpoint ë³´characters¡´ characters characters±

S3 characters²´í¬í¬characters¸í¸ë lifecycle characters characters±characters¼ë¡ ë¹characters© charactersµcharacters íí©ëë¤.

```json
{
  "Rules": [
    {
      "Id": "archive-old-checkpoints",
      "Status": "Enabled",
      "Prefix": "training-checkpoints/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER_IR"
        },
        {
          "Days": 90,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    },
    {
      "Id": "keep-production-checkpoints",
      "Status": "Enabled",
      "Prefix": "training-checkpoints/production/",
      "Transitions": [],
      "Expiration": null
    }
  ]
}
```

**ë³´characters¡´ characters ëµ:**

- **charactersµê·¼ 30characters¼**: S3 Standard (characters¦characters characters ê·¼)
- **30-90characters¼**: Glacier Instant Retrieval (ëë¬¸ characters¡characters¸characters¤)
- **90-365characters¼**: Glacier Deep Archive (characters¥ê¸° ë³´ê´)
- **Production characters²´í¬í¬characters¸í¸**: charactersêµ¬ ë³´characters¡´

---

## 6. ê´characters¸¡Â·ë¹characters© KPI

### 6-1. GPU-hours per Quality Improvement

**KPI characters characters**: Faithfulness 0.01 characterscharacters¹ë¹ characterscharactersë GPU charactersitemsê³¼ ë¹characters©

```python
# kpi_calculation.py
import pandas as pd

# ícharactersµ characters´ë ¥
training_runs = pd.DataFrame([
    {'iteration': 1, 'gpu_hours': 96, 'cost_usd': 1200, 'faithfulness_delta': 0.02},
    {'iteration': 2, 'gpu_hours': 120, 'cost_usd': 1500, 'faithfulness_delta': 0.015},
    {'iteration': 3, 'gpu_hours': 144, 'cost_usd': 1800, 'faithfulness_delta': 0.01},
])

# KPI ê³characters°
training_runs['gpu_hours_per_0.01_improvement'] = training_runs['gpu_hours'] / (training_runs['faithfulness_delta'] * 100)
training_runs['cost_per_0.01_improvement'] = training_runs['cost_usd'] / (training_runs['faithfulness_delta'] * 100)

print(training_runs)
```

**ê²°ê³¼ characterscharacters:**

| iteration | gpu_hours | cost_usd | faithfulness_delta | gpu_hours_per_0.01 | cost_per_0.01 |
|-----------|-----------|----------|-------------------|-------------------|--------------|
| 1 | 96 | $1,200 | 0.020 | 48 | $600 |
| 2 | 120 | $1,500 | 0.015 | 80 | $1,000 |
| 3 | 144 | $1,800 | 0.010 | 144 | $1,800 |

**í´characters**: characters´ê¸°charactersë ë¹ ë¥¸ itemscharacters characters´ itemsë¥ícharacters§ë§, iterationcharacters´ characters§íë charactersë¡ **characterscharactersµcharacters²´items(diminishing returns)** ë°characters. ë¹characters© ëë¹ í¨characters¨characters´ ë¨characters´characters§ë©´ ícharactersµ characters¤ë¨ ê³ ë ¤.

### 6-2. AMP Recording Rule

Prometheus Recording Ruleë¡ KPIë¥¼ characters¬characters  ê³characters°ícharacters¬ ëcharactersë³´ë characters¿¼ë¦¬ characters±ë¥characters charactersµcharacters íí©ëë¤.

```yaml
# amp-recording-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: continuous-training-recording-rules
  namespace: monitoring
data:
  rules.yml: |
    groups:
    - name: continuous-training-kpi
      interval: 1m
      rules:
      # ëª¨ë¸ë³ íê·  Faithfulness (1charactersitems charactersëcharacters°)
      - record: model:faithfulness:avg1h
        expr: |
          avg_over_time(langfuse_trace_faithfulness[1h])
      
      # Canary vs Stable Faithfulness characters°¨characters´
      - record: canary:faithfulness:delta
        expr: |
          model:faithfulness:avg1h{model="glm5-canary"}
          -
          model:faithfulness:avg1h{model="glm5-stable"}
      
      # GPU characters¬characters© charactersitems (ëcharacters )
      - record: training:gpu_hours:total
        expr: |
          sum(
            rate(container_gpu_allocation{namespace="training-pipeline"}[5m])
          ) * 3600
      
      # ícharactersµ ë¹characters© characters¶characters  (GPU-hour Ã $12.5)
      - record: training:cost_usd:total
        expr: |
          training:gpu_hours:total * 12.5
      
      # Quality Improvement per Dollar
      - record: training:improvement_per_dollar
        expr: |
          increase(model:faithfulness:avg1h[7d])
          /
          increase(training:cost_usd:total[7d])
```

### 6-3. Grafana ëcharactersë³´ë

```json
{
  "dashboard": {
    "title": "Continuous Training KPI",
    "panels": [
      {
        "title": "Faithfulness Trend (7d)",
        "targets": [
          {
            "expr": "model:faithfulness:avg1h{model=\"glm5-canary\"}"
          },
          {
            "expr": "model:faithfulness:avg1h{model=\"glm5-stable\"}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Training Cost per Week",
        "targets": [
          {
            "expr": "increase(training:cost_usd:total[7d])"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Quality Improvement per $1000",
        "targets": [
          {
            "expr": "training:improvement_per_dollar * 1000"
          }
        ],
        "type": "gauge",
        "thresholds": [
          {"value": 0, "color": "red"},
          {"value": 0.005, "color": "yellow"},
          {"value": 0.01, "color": "green"}
        ]
      },
      {
        "title": "Canary Deployment Timeline",
        "targets": [
          {
            "expr": "sum(rate(vllm_request_success_total{model=\"glm5-canary\"}[5m])) / sum(rate(vllm_request_success_total[5m]))"
          }
        ],
        "type": "graph",
        "annotations": [
          {"text": "Canary 5%", "time": "2026-04-18T06:00:00Z"},
          {"text": "Canary 25%", "time": "2026-04-19T06:00:00Z"},
          {"text": "Production 100%", "time": "2026-04-25T06:00:00Z"}
        ]
      }
    ]
  }
}
```

### 6-4. characters£¼items/charactersitems Cadence ê¶characters¥

| cycle | characters¡characters | ëª©í |
|------|------|------|
| **characters£¼items** | Trace characterscharacters§ â Reward Labeling | charactersµcharacters 5,000items ê³ ícharacters§ trace íë³´ |
| **ê²©characters£¼** | GRPO/DPO ícharactersµ iteration | Faithfulness +0.01 itemscharacters  |
| **charactersitems** | characters characters²´ íitems + Canary ë°°í¬ | íë¡ëcharacters ícharacters§ 1% itemscharacters  |
| **ë¶ê¸°** | ë¹characters© ëë¹ ROI ë¶characters | ícharactersµ characters¤ë¨/characters§characters characterscharacters¬ê²°characters  |

**ê¶characters¥ characterscharacters cycle:**

- **characters´ê¸° 3itemscharacters**: ê²©characters£¼ iteration (ë¹ ë¥¸ itemscharacters )
- **characters±charactersê¸° (6itemscharacters+)**: charactersitems iteration (characterscharacters í)

### 6-5. characterscharactersµ ë¶ê¸° ë¶characters

```python
# roi_analysis.py
# itemscharacters : ëª¨ë¸ ícharacters§ 1% itemscharacters  â characters¬characters©characters ë§characters¡±ë 5% characters¦items â characters´íë¥  2% itemscharacters

# ícharacters¬ characters§í
monthly_revenue = 100_000  # $100K/characters
churn_rate = 0.10  # 10% charactersitems characters´íë¥ 
ltv_per_user = 5_000  # characters¬characters©characters characterscharacters  itemscharacters¹ $5K

# ícharactersµ ë¹characters©
training_cost_per_iteration = 2_000
iterations_per_month = 2
monthly_training_cost = training_cost_per_iteration * iterations_per_month  # $4K

# ícharacters§ itemscharacters  í¨ê³¼
quality_improvement_per_month = 0.01  # 1% faithfulness characters¦items
churn_reduction = quality_improvement_per_month * 2  # 2% characters´íë¥  itemscharacters

# ë§¤characters¶ characters¦ë
retained_users = (monthly_revenue / ltv_per_user) * churn_reduction
revenue_increase = retained_users * ltv_per_user

print(f"charactersitems ícharactersµ ë¹characters©: ${monthly_training_cost:,}")
print(f"charactersitems ë§¤characters¶ characters¦ë: ${revenue_increase:,.0f}")
print(f"characterscharactersµ: ${revenue_increase - monthly_training_cost:,.0f}")
print(f"ROI: {(revenue_increase / monthly_training_cost - 1) * 100:.1f}%")
```

**characters¶ë ¥ characterscharacters:**

```
charactersitems ícharactersµ ë¹characters©: $4,000
charactersitems ë§¤characters¶ characters¦ë: $20,000
characterscharactersµ: $16,000
ROI: 400%
```

---

## characterscharacters½

Continuous Training Pipelinecharacters 5ë¨ê³ charactersí¬íë¡characters°ë¡ íë¡ëcharacters í¼ëë°±characters charactersëcharacters¼ë¡ ëª¨ë¸ itemscharacters characters ë°charactersí©ëë¤:

1. **Trace â Dataset**: Langfuse OTel â S3 Iceberg (ë characters§/ëª¨ë¸/ëcharacters íí°charactersë)
2. **Reward Labeling**: Ragas + Qwen3-4B Judge Fleet (KServe + KEDA)
3. **GRPO/DPO ícharactersµ**: NeMo-RL ëë TRL (Karpenter Spot p5en.48xlarge Ã 3 ë¸ë)
4. **Eval Gate**: Threshold ê²characters¦ + Canary 5% â 25% â 100% (kgateway)
5. **Registry & Rollback**: MLflow + Agent Versioning + charactersë ë¡¤ë°±

**íµcharacters¬ í¬characters¸í¸:**

- **ë¹characters© í¨characters¨**: Spot characters¸characters¤í´characters¤ + ê²©characters£¼ iteration â $4K/characters characterscharacters¤
- **ícharacters§ itemscharacters **: characters 1% faithfulness characters¦items ëª©í
- **characterscharacters characters±**: Eval Gate + characters characters§ Canary + charactersë ë¡¤ë°±
- **ROI**: ícharactersµ ë¹characters© ëë¹ 400% ë§¤characters¶ characters¦ë itemsë¥

### ë¤characters ë¨ê³

- [Self-Improving Agent Loop](../design-architecture/self-improving-agent-loop.md) - characters¤ê³ charactersí¤ícharacters² ë° characters ëµ
- [characters»¤characters¤í ëª¨ë¸ ícharacters´íë¼characters¸](./custom-model-pipeline.md) - SFT ícharactersµ characters characters  characters¡°ê±´
- [Cascade Routing Tuning](./cascade-routing-tuning.md) - ë°°í¬ í ë¼characters°í charactersµcharacters í
- [Agent Versioning](../../aidlc/enterprise/agent-versioning/index.md) - ëª¨ë¸Â·characters½ëÂ·íë¡¬íí¸ ëê¸°í

---

## characters°¸ê³  charactersë£

| charactersë£ | ë§í¬ |
|------|------|
| **GRPO Paper** | [arxiv.org/abs/2402.03300](https://arxiv.org/abs/2402.03300) |
| **DPO Paper** | [arxiv.org/abs/2305.18290](https://arxiv.org/abs/2305.18290) |
| **NeMo Framework** | [docs.nvidia.com/nemo-framework](https://docs.nvidia.com/nemo-framework/user-guide/latest/) |
| **TRL Library** | [github.com/huggingface/trl](https://github.com/huggingface/trl) |
| **Apache Iceberg** | [iceberg.apache.org](https://iceberg.apache.org/) |
| **Karpenter** | [karpenter.sh](https://karpenter.sh/) |
| **Volcano Scheduler** | [volcano.sh](https://volcano.sh/) |
| **Gateway API** | [gateway-api.sigs.k8s.io](https://gateway-api.sigs.k8s.io/) |
| **MLflow** | [mlflow.org](https://mlflow.org/) |
| **Ragas** | [docs.ragas.io](https://docs.ragas.io/) |

:::tip íë¡ëcharacters characters²´í¬ë¦¬characters¤í¸

- [ ] Langfuse OTel trace characterscharacters§ ícharacters±í (user_consent íë characters¶items)
- [ ] S3 Data Lake + Glue Iceberg ícharacters´ë¸ êµ¬characters±
- [ ] Reward Labeler Fleet (Qwen3-4B KServe + KEDA) ë°°í¬
- [ ] NeMo-RL ëë TRL ícharactersµ íê²½ êµ¬characters± (Karpenter Spot ë¸ëí)
- [ ] Eval Gate Threshold characters characters (faithfulness >= 0.85)
- [ ] Canary Deployment HTTPRoute + ëª¨ëí°ë§ charactersë characters¤characters 
- [ ] MLflow Registry + Agent Versioning characters°ë
- [ ] Rollback charactersëí (Argo Rollouts)
- [ ] ë¹characters© KPI ëcharactersë³´ë (Grafana) êµ¬characters¶
- [ ] ê²©characters£¼/charactersitems iteration characters¼characters  charactersë¦½

:::
