---
title: "AgentCore Hybrid Strategy"
sidebar_label: "AgentCore Hybrid Strategy"
description: "Decision framework and pattern catalog for combining Bedrock AgentCore managed service with EKS-based self-hosted agents in hybrid deployment"
created: 2026-04-18
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 15
tags:
  - agentcore
  - bedrock
  - hybrid
  - eks
  - scope:design
sidebar_position: 5
---

:::info Verification Status
The implementation samples in this document (IAM OAuth propagation, Lambda Trace Forwarder, Dual-write Memory, Cost-arbitrage Router) are **for design reference** and have no E2E integration test history for AgentCore·EKS combinations in us-east-2 after teardown (2026-04-18). E2E verification for IAM boundaries, Trace correlation, and 3 PrivateLink endpoint types will be performed before Phase 3 deployment.
:::

:::caution Verification Pending
Decision Matrix 8-axis weights, Hand-off pattern catalog, IAM session sharing flow, and migration roadmap are in pre-review state awaiting MLOps lead review and real-deployment E2E verification. Value footnotes and banner will be updated upon validation.

Deployment verification tracking: [Issue #6](https://github.com/devfloor9/engineering-playbook/issues/6)
:::

## Overview

Bedrock AgentCore is a powerful managed Agent platform, but enterprise environments often require combination with self-hosted infrastructure. This document provides a decision framework and validated pattern catalog for designing optimal hybrid architecture that **combines AgentCore's serverless advantages with EKS-based Self-hosted infrastructure flexibility**.

:::info Prerequisite Documents
Before reading this document, refer to:
- [AWS Native Platform](./aws-native-agentic-platform.md) — AgentCore 7-service overview (avoid duplication)
- [EKS-based Open Architecture](./agentic-ai-solutions-eks.md) — Self-hosted stack composition
- [AI Platform Selection Guide](./ai-platform-decision-framework.md) — Managed vs open-source decision
- [SageMaker-EKS Integration](../../reference-architecture/integrations/sagemaker-eks-integration.md) — Hybrid VPC/IAM reference
:::

---

## Hybrid Deployment Motivation

### Single Approach Limitations

**Constraints of AgentCore Only**:
- Bedrock GA 100+ model-centric (cannot host self fine-tuned SLMs)
- Token-based pricing (cost increase for high-frequency simple tasks)
- Latency with on-premises data sources
- Complex PrivateLink setup when MCP servers are inside VPC

**Constraints of EKS Self-hosted Only**:
- Agent Runtime infrastructure operational burden (Kagent Pod + Redis State Store)
- Complex autoscaling vs serverless scaling (KEDA Queue-based)
- Lack of managed memory management (direct implementation required)
- Direct multi-agent orchestration framework construction

### Core Value of Hybrid

```mermaid
graph TB
    subgraph "AgentCore Managed"
        AC_RUNTIME["Serverless Runtime<br/>0→N auto-scaling"]
        AC_MEMORY["Managed Memory<br/>Short/long-term memory"]
        AC_GATEWAY["Gateway<br/>Semantic tool discovery"]
        AC_POLICY["Policy<br/>Natural language policy"]
    end
    
    subgraph "EKS Self-hosted"
        EKS_SLM["Custom SLM<br/>Qwen3-4B Fine-tuned"]
        EKS_MCP["MCP Server<br/>VPC internal tools"]
        EKS_RAG["Private RAG<br/>Milvus + Langfuse"]
        EKS_INFRA["GPU Infrastructure<br/>Spot + Karpenter"]
    end
    
    subgraph "Best of Both"
        COST["Cost Optimization<br/>40-60% reduction"]
        LATENCY["Minimize Latency<br/>Leverage data gravity"]
        CONTROL["Fine-grained Control<br/>Custom models + tools"]
        SIMPLE["Simplified Operations<br/>Managed + Self-hosted"]
    end
    
    AC_RUNTIME --> SIMPLE
    AC_MEMORY --> SIMPLE
    EKS_SLM --> COST
    EKS_SLM --> CONTROL
    EKS_MCP --> LATENCY
    EKS_RAG --> CONTROL
    EKS_INFRA --> COST
    
    style AC_RUNTIME fill:#ff9900,color:#fff
    style EKS_SLM fill:#10b981,color:#fff
    style COST fill:#f59e0b,color:#232f3e
```

### Cost Break-even Calculation

| Monthly Inference Volume | AgentCore Only | EKS Self-hosted Only | Hybrid (Cascade) | Optimal Approach |
|-------------|---------------|---------------------|------------------|----------|
| ~100K requests | **$300-500** | $800-1,200 | $400-700 | AgentCore Only |
| ~500K requests | $1,500-2,000 | $1,200-1,800 | **$800-1,200** | Hybrid starting point |
| ~1.5M requests | $4,500-6,000 | $2,500-3,500 | **$2,000-2,800** | Hybrid required |
| ~5M+ requests | $15,000+ | **$3,500-5,000** | **$4,000-6,000** | EKS-centric Hybrid |

:::tip Break-even Point
Hybrid approach becomes cost-effective at 500K+ monthly inference volumes. See [Coding Tools Cost Analysis](../../reference-architecture/integrations/coding-tools-cost-analysis.md) for detailed calculation formulas.
:::

---

## Decision Matrix: Where to Place Agents

Evaluate agent placement using 8 core dimensions.

| Evaluation Axis | AgentCore | EKS Kagent | Hybrid | Decision Criteria |
|--------|-----------|------------|--------|----------|
| **Inference Latency** | Medium (50-200ms) | Low (10-50ms) | **Low** | VPC internal tool calls → EKS |
| **Cost** | High for high-frequency | Low for high-frequency | **Optimal** | Simple=EKS, Complex=AgentCore |
| **PII Handling** | VPC external (constraints) | VPC internal (advantageous) | **Flexible** | Sensitive data → EKS MCP |
| **Model Customization** | Bedrock models only | Free (Qwen3, custom) | **Free** | Fine-tuned models → EKS |
| **Tool Chain** | REST→MCP conversion | K8s native | **Both** | External SaaS → AgentCore Gateway |
| **Session Length** | Max 8 hours | Unlimited | **Unlimited** | Long conversations → EKS State |
| **Audit Requirements** | CloudTrail automatic | Direct implementation required | **CloudTrail + Custom** | Regulatory → AgentCore priority |
| **Team Capability** | Kubernetes unnecessary | Kubernetes required | **Optional** | K8s beginner → AgentCore-centric |

### Decision Flowchart

```mermaid
flowchart TD
    START["Agent Placement Decision"]
    
    Q1{"Monthly Inference Volume<br/>500K+ requests?"}
    Q2{"PII/Sensitive Data<br/>VPC internal processing required?"}
    Q3{"Custom Fine-tuned<br/>Model usage?"}
    Q4{"VPC internal tools<br/>Frequent calls?"}
    Q5{"Kubernetes<br/>Operational capability?"}
    
    AGENTCORE["✅ AgentCore Only<br/>Serverless + Quick start"]
    EKS_ONLY["✅ EKS Kagent Only<br/>Maximum control + Cost optimal"]
    HYBRID_AC["✅ Hybrid (AgentCore-centric)<br/>Complex reasoning with AgentCore<br/>Simple tasks with EKS SLM"]
    HYBRID_EKS["✅ Hybrid (EKS-centric)<br/>Most processing on EKS<br/>AgentCore for Escalation"]
    
    START --> Q1
    Q1 -->|"No"| Q2
    Q1 -->|"Yes"| Q3
    
    Q2 -->|"No"| AGENTCORE
    Q2 -->|"Yes"| Q5
    
    Q3 -->|"Yes"| Q4
    Q3 -->|"No"| Q4
    
    Q4 -->|"Yes"| HYBRID_EKS
    Q4 -->|"No"| HYBRID_AC
    
    Q5 -->|"Yes"| EKS_ONLY
    Q5 -->|"No"| HYBRID_AC
    
    style AGENTCORE fill:#ff9900,color:#fff
    style EKS_ONLY fill:#10b981,color:#fff
    style HYBRID_AC fill:#8b5cf6,color:#fff
    style HYBRID_EKS fill:#3b82f6,color:#fff
```

---

## Data Gravity and Tool Colocation Patterns

### What is Data Gravity?

Placing computing where data resides minimizes network latency and cost.

**Typical Scenario**:
- Milvus vector DB inside EKS VPC (GB~TB scale)
- AgentCore Runtime outside VPC (Bedrock service account)
- When Agent queries Milvus for RAG search **PrivateLink traversal required** → Increased latency + complexity

### Reverse Call Pattern

Architecture where AgentCore Runtime calls MCP servers inside EKS VPC.

```mermaid
sequenceDiagram
    participant User
    participant AC_RT as AgentCore Runtime
    participant AC_GW as AgentCore Gateway
    participant PL as PrivateLink Endpoint
    participant MCP as EKS MCP Server
    participant Milvus as Milvus (VPC internal)
    
    User->>AC_RT: "Find violation clauses in customer contract"
    AC_RT->>AC_GW: Semantic tool discovery
    AC_GW-->>AC_RT: contract-search-tool (MCP)
    
    AC_RT->>PL: MCP call (PrivateLink)
    PL->>MCP: mcp://contract-search
    MCP->>Milvus: Vector search (VPC internal — low latency)
    Milvus-->>MCP: Related document chunks
    MCP-->>PL: MCP response
    PL-->>AC_RT: Search results
    
    AC_RT->>User: "Article 3 potential violation found"
    
    Note over MCP,Milvus: VPC internal communication — 1-5ms
    Note over AC_RT,PL: PrivateLink — 10-30ms
```

### PrivateLink Setup

```yaml
# privatelink-mcp-endpoint.yaml
apiVersion: v1
kind: Service
metadata:
  name: mcp-server-nlb
  namespace: mcp-system
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-internal: "true"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
spec:
  type: LoadBalancer
  selector:
    app: mcp-server
  ports:
    - port: 443
      targetPort: 8080
      protocol: TCP
---
# Create VPC Endpoint Service (AWS Console or Terraform)
# 1. Confirm NLB ARN
# 2. Create VPC Endpoint Service (Acceptance required: No)
# 3. Add Endpoint access permission to AgentCore IAM Role
```

### S3+KMS Boundary Setup

Securely share sensitive data between AgentCore and EKS via S3 + KMS encryption.

```python
# secure_artifact_manager.py
import boto3
import json

class SecureArtifactManager:
    def __init__(self, bucket: str, kms_key_id: str):
        self.s3 = boto3.client('s3')
        self.kms = boto3.client('kms')
        self.bucket = bucket
        self.kms_key_id = kms_key_id
    
    def store_sensitive_result(self, agent_id: str, session_id: str, data: dict) -> str:
        """Store sensitive results encrypted in S3"""
        key = f"agentcore/{agent_id}/{session_id}/result.json"
        
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(data),
            ServerSideEncryption='aws:kms',
            SSEKMSKeyId=self.kms_key_id,
            Metadata={'pii': 'true', 'agent-session': session_id}
        )
        return f"s3://{self.bucket}/{key}"
    
    def load_from_eks(self, s3_uri: str) -> dict:
        """Load S3 object from EKS Pod (KMS decryption with Pod Identity)"""
        bucket, key = s3_uri.replace('s3://', '').split('/', 1)
        response = self.s3.get_object(Bucket=bucket, Key=key)
        return json.loads(response['Body'].read())
```

**IAM Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/AgentCoreExecutionRole"
      },
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::my-secure-artifacts/agentcore/*",
      "Condition": {
        "StringEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
      }
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/EKSPodRole"
      },
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::my-secure-artifacts/agentcore/*"
    }
  ]
}
```

---

## Hand-off Pattern Catalog

### Pattern (a): Router-front (AgentCore Gateway→Self-hosted)

AgentCore Gateway analyzes requests and routes to either AgentCore Agent or EKS Self-hosted Agent.

```mermaid
sequenceDiagram
    participant User
    participant AC_GW as AgentCore Gateway
    participant Classifier as LLM Classifier
    participant AC_Agent as AgentCore Agent
    participant EKS_Agent as EKS Kagent
    
    User->>AC_GW: "Code completion: def merge_sort"
    AC_GW->>Classifier: Classify complexity
    Classifier-->>AC_GW: "Simple task (0.2 complexity)"
    AC_GW->>EKS_Agent: Qwen3-4B Self-hosted
    EKS_Agent-->>User: Code completion result
    
    User->>AC_GW: "Review distributed transaction design"
    AC_GW->>Classifier: Classify complexity
    Classifier-->>AC_GW: "Complex task (0.9 complexity)"
    AC_GW->>AC_Agent: Claude Sonnet (Bedrock)
    AC_Agent-->>User: Architecture review
```

**Classification Criteria**:

| Complexity Score | Routing Target | Example Tasks |
|-----------|-----------|----------|
| 0.0-0.3 | EKS Qwen3-4B | Code completion, translation, summarization |
| 0.3-0.7 | AgentCore Claude Haiku | Basic analysis, simple reasoning |
| 0.7-1.0 | AgentCore Claude Sonnet | Architecture review, complex reasoning |

**Implementation**:

```python
# classifier_router.py
from strands import Agent
from strands.models import BedrockModel
import boto3

bedrock_runtime = boto3.client('bedrock-agent-runtime')

class HybridRouter:
    def __init__(self):
        self.classifier = Agent(
            model=BedrockModel(model_id="anthropic.claude-haiku-20250320"),
            system_prompt="""You are a request complexity classifier.
Evaluate complexity on a 0.0-1.0 scale and respond with JSON.
{"complexity": 0.0-1.0, "reason": "explanation"}"""
        )
    
    def route(self, user_request: str) -> dict:
        classification = self.classifier(f"Request: {user_request}")
        complexity = classification['complexity']
        
        if complexity < 0.3:
            return self._route_to_eks(user_request)
        elif complexity < 0.7:
            return self._route_to_agentcore(user_request, model='haiku')
        else:
            return self._route_to_agentcore(user_request, model='sonnet')
    
    def _route_to_eks(self, request: str) -> dict:
        """Route to EKS Kagent"""
        import requests
        response = requests.post(
            "http://kagent-service.agents.svc.cluster.local/invoke",
            json={"prompt": request, "model": "qwen3-4b"}
        )
        return {"response": response.json(), "routed_to": "eks-kagent"}
    
    def _route_to_agentcore(self, request: str, model: str) -> dict:
        """Route to AgentCore"""
        response = bedrock_runtime.invoke_agent(
            agentId='AGENT123',
            agentAliasId='ALIAS456',
            sessionId='session-' + str(hash(request)),
            inputText=request
        )
        return {"response": response, "routed_to": f"agentcore-{model}"}
```

---

### Pattern (b): Escalation (Qwen3 Self→AgentCore Reasoning)

EKS Self-hosted Agent processes first, escalates to AgentCore when complexity exceeds threshold.

```mermaid
flowchart LR
    User["User"] --> EKS["EKS Kagent<br/>Qwen3-4B"]
    EKS -->|"Confidence &lt; 0.7"| AC["AgentCore<br/>Claude Sonnet"]
    EKS -->|"Confidence ≥ 0.7"| User
    AC --> User
    
    style EKS fill:#10b981,color:#fff
    style AC fill:#ff9900,color:#fff
```

**Escalation Triggers**:
- LLM response confidence score < 0.7
- Tool call failure 2+ times
- User explicit request ("need more accurate answer")

**Implementation**:

```python
# escalation_agent.py
from strands import Agent
import boto3

class EscalatingAgent:
    def __init__(self):
        self.primary_agent = Agent(
            model=LocalModel("http://vllm-qwen3.vllm.svc.cluster.local"),
            tools=["code_completion", "translation"]
        )
        self.bedrock_runtime = boto3.client('bedrock-agent-runtime')
    
    def process(self, user_request: str) -> dict:
        # 1st attempt: EKS Self-hosted Agent
        response = self.primary_agent(user_request)
        confidence = response.metadata.get('confidence', 0.0)
        
        if confidence >= 0.7:
            return {"response": response, "agent": "eks-qwen3", "confidence": confidence}
        
        # Escalation: AgentCore Claude Sonnet
        print(f"⚠️ Low confidence ({confidence}) → AgentCore escalation")
        agentcore_response = self.bedrock_runtime.invoke_agent(
            agentId='EXPERT_AGENT_ID',
            agentAliasId='PROD_ALIAS',
            sessionId='escalation-session',
            inputText=f"Original request: {user_request}\n\nInitial attempt failed (Confidence: {confidence}). Accurate answer required."
        )
        return {"response": agentcore_response, "agent": "agentcore-sonnet", "escalated": True}
```

---

### Pattern (c): Dual-write Memory (AgentCore Memory↔EKS Langfuse)

Synchronize conversation history between AgentCore and EKS Agents to maintain consistent context.

```mermaid
sequenceDiagram
    participant User
    participant AC as AgentCore Agent
    participant AC_MEM as AgentCore Memory
    participant S3 as S3 (relay)
    participant LANGFUSE as Langfuse (EKS)
    participant EKS as EKS Kagent
    
    User->>AC: "Store customer A preferences"
    AC->>AC_MEM: Save short-term memory
    AC->>S3: Export session data
    S3->>LANGFUSE: EventBridge → Lambda → Langfuse Trace
    
    User->>EKS: "Recommend products for customer A"
    EKS->>LANGFUSE: Query context
    LANGFUSE-->>EKS: "Customer A preference: eco-friendly products"
    EKS-->>User: "Recommend eco-friendly lineup"
```

**Synchronization Strategy**:

| Event | AgentCore → EKS | EKS → AgentCore |
|--------|----------------|----------------|
| Session start | Memory Session ID → S3 | Langfuse Trace ID → DynamoDB |
| Tool invocation | Action Group execution log → CloudWatch → Langfuse | Langfuse Span → CloudWatch Logs Insights |
| Session end | Memory summarization → S3 → Langfuse | Langfuse session statistics → AgentCore Analytics |

**Implementation**:

```python
# dual_memory_sync.py
import boto3
from langfuse import Langfuse
from datetime import datetime

class DualMemoryManager:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.langfuse = Langfuse(
            public_key="lf_pk_...",
            secret_key="lf_sk_...",
            host="https://langfuse.eks.internal"
        )
        self.agentcore_memory_bucket = "agentcore-memory-export"
    
    def sync_agentcore_to_langfuse(self, agent_id: str, session_id: str):
        """AgentCore Memory → Langfuse synchronization"""
        # Export AgentCore Memory (S3)
        memory_key = f"{agent_id}/{session_id}/memory.json"
        memory_obj = self.s3.get_object(Bucket=self.agentcore_memory_bucket, Key=memory_key)
        memory_data = json.loads(memory_obj['Body'].read())
        
        # Create Langfuse Trace
        trace = self.langfuse.trace(
            id=session_id,
            name=f"AgentCore Session {agent_id}",
            metadata={"source": "agentcore", "agent_id": agent_id}
        )
        
        for turn in memory_data['conversation']:
            trace.span(
                name=f"Turn {turn['turn_id']}",
                input=turn['user_input'],
                output=turn['agent_response'],
                metadata={"timestamp": turn['timestamp']}
            )
        
        trace.update(output=memory_data.get('summary'))
        print(f"✅ AgentCore Memory → Langfuse sync complete: {session_id}")
    
    def sync_langfuse_to_agentcore(self, trace_id: str, agent_id: str):
        """Langfuse → AgentCore Memory synchronization"""
        trace = self.langfuse.get_trace(trace_id)
        
        # Convert to AgentCore Memory format
        memory_data = {
            "agent_id": agent_id,
            "session_id": trace_id,
            "conversation": [
                {"turn_id": i, "user_input": span.input, "agent_response": span.output}
                for i, span in enumerate(trace.spans)
            ],
            "synced_at": datetime.utcnow().isoformat()
        }
        
        # Upload to S3 (AgentCore imports)
        self.s3.put_object(
            Bucket=self.agentcore_memory_bucket,
            Key=f"{agent_id}/{trace_id}/imported-memory.json",
            Body=json.dumps(memory_data)
        )
        print(f"✅ Langfuse → AgentCore Memory sync complete: {trace_id}")
```

---

### Pattern (d): Cost-arbitrage (High-freq=EKS, Low-freq Complex=AgentCore)

Select cost-optimal Agent based on request frequency and complexity.

**Cost Model**:

| Scenario | Monthly Requests | Avg Tokens | AgentCore Cost | EKS Cost | Optimal Choice |
|---------|-----------|---------|--------------|----------|----------|
| Code completion | 5M requests | 300 tokens | ~$15,000 | ~$3,500 | **EKS** |
| Architecture review | 50K requests | 5,000 tokens | ~$2,500 | $3,500 (GPU idle) | **AgentCore** |
| Translation | 2M requests | 500 tokens | ~$10,000 | ~$2,000 | **EKS** |
| Complex reasoning | 100K requests | 8,000 tokens | ~$8,000 | $4,000 (dedicated GPU) | **AgentCore** |

**Routing Logic**:

```python
# cost_arbitrage_router.py
class CostArbitrageRouter:
    def __init__(self):
        self.request_counts = {}  # Track request frequency
        
        # Cost coefficients (example)
        self.agentcore_cost_per_1k_tokens = 0.003  # Claude Haiku
        self.eks_fixed_monthly = 500  # GPU instance fixed cost
        self.eks_break_even_requests = 200000  # Break-even point
    
    def should_use_eks(self, task_type: str, estimated_tokens: int) -> bool:
        """Cost-based routing decision"""
        monthly_requests = self.request_counts.get(task_type, 0)
        
        # High-frequency tasks → EKS
        if monthly_requests > self.eks_break_even_requests:
            return True
        
        # Low-frequency + complex → AgentCore
        if estimated_tokens > 5000 and monthly_requests < 50000:
            return False
        
        # Simple task → EKS (amortize fixed cost)
        if estimated_tokens < 1000:
            return True
        
        return False  # Default: AgentCore
```

---

## IAM, Session, and Observability Integration Boundaries

### AgentCore Identity OAuth Token Propagation

Safely propagate OAuth tokens issued by AgentCore Identity to EKS MCP servers.

```mermaid
sequenceDiagram
    participant User as User (Okta)
    participant AC_ID as AgentCore Identity
    participant AC_RT as AgentCore Runtime
    participant MCP as EKS MCP Server
    participant Backend as Backend API
    
    User->>AC_ID: Okta login
    AC_ID-->>User: JWT Access Token
    
    User->>AC_RT: Agent invocation (Authorization: Bearer JWT)
    AC_RT->>AC_ID: Verify token
    AC_ID-->>AC_RT: Valid (user_id, scopes)
    
    AC_RT->>MCP: MCP tool invocation (X-Forwarded-Authorization: Bearer JWT)
    MCP->>Backend: Backend API call (Authorization: Bearer JWT)
    Backend-->>MCP: Result
    MCP-->>AC_RT: MCP response
    AC_RT-->>User: Agent response
```

**EKS MCP Server Authentication Verification**:

```python
# mcp_auth_middleware.py
import jwt
from functools import wraps
from flask import request, jsonify

def validate_agentcore_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Forwarded-Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({"error": "Missing authorization token"}), 401
        
        try:
            # Verify with AgentCore Identity public key
            payload = jwt.decode(
                token,
                audience="mcp-server",
                issuer="https://bedrock.amazonaws.com/agentcore/identity",
                algorithms=["RS256"],
                options={"verify_signature": True}
            )
            request.user_id = payload['sub']
            request.scopes = payload['scope']
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
    
    return decorated

@app.route('/mcp/customer-lookup', methods=['POST'])
@validate_agentcore_token
def customer_lookup():
    """Only authenticated users can query customers"""
    customer_id = request.json.get('customer_id')
    # Record audit log with request.user_id
    return {"customer": fetch_customer(customer_id)}
```

### CloudWatch GenAI Observability ↔ Langfuse OTel Bridge

Integrate AgentCore traces and EKS Langfuse traces to track complete Agent flows.

```mermaid
flowchart LR
    subgraph AgentCore
        AC_RT["Agent Runtime"]
        CW_GENAI["CloudWatch<br/>GenAI Observability"]
    end
    
    subgraph Bridge
        OTEL_COL["OTEL Collector"]
        LAMBDA["Lambda<br/>Trace Forwarder"]
    end
    
    subgraph EKS
        LANGFUSE["Langfuse"]
        KAGENT["Kagent Pod"]
    end
    
    AC_RT --> CW_GENAI
    CW_GENAI -->|"EventBridge"| LAMBDA
    LAMBDA -->|"HTTP"| OTEL_COL
    OTEL_COL --> LANGFUSE
    
    KAGENT -->|"OTEL gRPC"| OTEL_COL
    
    style CW_GENAI fill:#ff9900,color:#fff
    style LANGFUSE fill:#10b981,color:#fff
```

**Trace Correlation ID Rules**:

| Source | Trace ID Format | Parent Span ID |
|------|--------------|----------------|
| AgentCore | `ac-{session_id}-{timestamp}` | `ac-root` |
| EKS Kagent | `eks-{pod_name}-{trace_id}` | `ac-{session_id}` (when calling AgentCore) |
| Hybrid Trace | `hybrid-{session_id}` | Shared by both sides |

**Lambda Trace Forwarder**:

```python
# trace_forwarder_lambda.py
import boto3
import json
import requests
from datetime import datetime

cloudwatch = boto3.client('logs')
langfuse_endpoint = "https://langfuse.eks.internal/api/public/ingestion"

def lambda_handler(event, context):
    """CloudWatch GenAI Observability → Langfuse forwarding"""
    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        
        if message['source'] == 'aws.bedrock.agentcore':
            trace_data = message['detail']
            
            # Convert to Langfuse format
            langfuse_trace = {
                "id": f"hybrid-{trace_data['sessionId']}",
                "name": f"AgentCore {trace_data['agentId']}",
                "metadata": {
                    "source": "agentcore",
                    "agent_id": trace_data['agentId'],
                    "aws_region": message['region']
                },
                "spans": [
                    {
                        "name": step['actionGroupName'],
                        "input": step['input'],
                        "output": step['output'],
                        "start_time": step['startTime'],
                        "end_time": step['endTime']
                    }
                    for step in trace_data.get('actionGroupInvocations', [])
                ]
            }
            
            # Send to Langfuse
            response = requests.post(
                langfuse_endpoint,
                json=langfuse_trace,
                headers={"Authorization": f"Bearer {os.environ['LANGFUSE_API_KEY']}"}
            )
            print(f"✅ Trace forwarding complete: {trace_data['sessionId']} → Langfuse")
    
    return {"statusCode": 200}
```

---

## Gradual Migration Roadmap

### Phase 1: AgentCore Only (0-3 months)

**Goal**: Fast production deployment, zero infrastructure operational burden

```mermaid
flowchart LR
    User["User"] --> AC["AgentCore<br/>Bedrock Claude"]
    AC --> KB["Knowledge Bases<br/>RAG"]
    AC --> TOOLS["External Tools<br/>REST API"]
    
    style AC fill:#ff9900,color:#fff
```

**Checklist**:
- [ ] Select Bedrock model (Claude Sonnet/Haiku)
- [ ] Agent implementation with Strands SDK
- [ ] Deploy to AgentCore (`agentcore deploy`)
- [ ] Configure Knowledge Bases RAG
- [ ] Enable CloudWatch GenAI Observability

**Exit Criteria (Phase 2 transition triggers)**:
- Monthly inference volume exceeds 500K requests
- Bedrock token cost exceeds $1,500/month
- High VPC internal tool call frequency (p95 latency > 100ms)

---

### Phase 2: Bedrock + Self-hosted SLM (3-6 months)

**Goal**: Cost optimization, offload simple tasks to EKS Qwen3-4B

```mermaid
flowchart LR
    User["User"] --> GW["kgateway"]
    GW --> Classifier["LLM Classifier"]
    Classifier -->|"Complex"| AC["AgentCore<br/>Claude"]
    Classifier -->|"Simple"| EKS["EKS<br/>Qwen3-4B"]
    
    style AC fill:#ff9900,color:#fff
    style EKS fill:#10b981,color:#fff
```

**Checklist**:
- [ ] Configure EKS cluster (Auto Mode or Karpenter)
- [ ] Deploy Qwen3-4B with vLLM
- [ ] Implement LLM Classifier (Cascade Routing)
- [ ] Configure kgateway + Bifrost 2-Tier Gateway
- [ ] Build cost dashboard (track AgentCore vs EKS cost)

**Exit Criteria (Phase 3 transition triggers)**:
- Context sharing required between EKS Agent and AgentCore Agent
- Require maintaining same session on both sides
- Fine-tuned custom models needed

---

### Phase 3: Full Hybrid Cross-routing (6-12 months)

**Goal**: Bidirectional routing, unified context, optimal cost

```mermaid
flowchart TD
    User["User"]
    
    subgraph Routing
        GW["Gateway"]
        Router["Cost-Aware Router"]
    end
    
    subgraph AgentCore
        AC_Agent["Agent Runtime"]
        AC_MEM["Memory"]
    end
    
    subgraph EKS
        EKS_Agent["Kagent"]
        LANGFUSE["Langfuse"]
        MCP["MCP Server"]
    end
    
    subgraph Sync
        S3["S3 Memory Sync"]
        BRIDGE["OTEL Bridge"]
    end
    
    User --> GW
    GW --> Router
    Router -->|"Complex/Low-freq"| AC_Agent
    Router -->|"Simple/High-freq"| EKS_Agent
    
    AC_Agent --> AC_MEM
    AC_MEM <-.->|"Sync"| S3
    S3 <-.-> LANGFUSE
    
    AC_Agent -->|"PrivateLink"| MCP
    EKS_Agent --> MCP
    
    AC_Agent -->|"Trace"| BRIDGE
    EKS_Agent -->|"Trace"| BRIDGE
    BRIDGE --> LANGFUSE
    
    style AC_Agent fill:#ff9900,color:#fff
    style EKS_Agent fill:#10b981,color:#fff
```

**Checklist**:
- [ ] Implement dual-write Memory synchronization (pattern c)
- [ ] Integrate Trace Correlation ID
- [ ] PrivateLink Endpoint for MCP
- [ ] Implement cost-arbitrage Router (pattern d)
- [ ] Implement escalation logic (pattern b)
- [ ] Unified dashboard (AgentCore + EKS integrated observability)

**Success Metrics**:
- Cost reduction rate: 40-60% (vs Bedrock Only)
- p95 latency: 20% improvement vs AgentCore standalone
- Session context consistency: 95%+
- Agent availability: 99.9% (both-side Failover)

---

## Transition Trigger Metrics

Quantitative metrics to determine each Phase transition.

| Metric | Phase 1 → 2 Threshold | Phase 2 → 3 Threshold |
|------|-------------------|-------------------|
| **Monthly Inference Volume** | > 500K requests | > 1.5M requests |
| **Monthly Cost** | > $1,500 | > $3,000 |
| **Average Latency (p95)** | > 100ms | > 200ms |
| **Session Context Loss Rate** | N/A | > 5% |
| **Custom Model Requirement** | Fine-tuning needed | Domain-specific SLM needed |
| **Team K8s Capability** | Beginner | Intermediate+ |

---

## References

### Official Documentation

- [Amazon Bedrock AgentCore](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html) — AgentCore official documentation
- [AgentCore Identity & Policy](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-identity.html) — Authentication & policy guide
- [EKS PrivateLink](https://docs.aws.amazon.com/eks/latest/userguide/private-clusters.html) — VPC internal connection
- [AWS PrivateLink for Services](https://docs.aws.amazon.com/vpc/latest/privatelink/) — Service endpoints

### Papers / Technical Blogs

- [CloudWatch Generative AI Observability](https://aws.amazon.com/blogs/mt/launching-amazon-cloudwatch-generative-ai-observability-preview/) — Observability integration
- [Hybrid AI Architecture Patterns](https://aws.amazon.com/blogs/machine-learning/) — Hybrid patterns
- [Langfuse Self-Hosting Guide](https://langfuse.com/docs/deployment/self-host) — Self-hosting guide
- [Building Cost-Effective AI Systems](https://huyenchip.com/2023/04/11/llm-engineering.html) — Cost optimization

### Related Documents (Internal)

- [AWS Native Platform](./aws-native-agentic-platform.md) — AgentCore 7-service overview
- [EKS-based Open Architecture](./agentic-ai-solutions-eks.md) — Self-hosted stack
- [SageMaker-EKS Integration](../../reference-architecture/integrations/sagemaker-eks-integration.md) — VPC/IAM reference
- [Coding Tools Cost Analysis](../../reference-architecture/integrations/coding-tools-cost-analysis.md) — Break-even calculation
