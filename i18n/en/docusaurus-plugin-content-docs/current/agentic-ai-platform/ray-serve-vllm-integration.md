---
title: "Ray Serve and vLLM Integration Architecture"
sidebar_label: "Ray Serve + vLLM"
description: "Distributed inference architecture based on Ray Serve, vLLM integration strategy, autoscaling, and production deployment patterns"
sidebar_position: 6
---

# Ray Serve and vLLM Integration Architecture

In large-scale LLM serving environments, a single vLLM instance alone is insufficient to meet enterprise-grade requirements. Production environments requiring multi-model management, dynamic scaling, complex preprocessing/postprocessing pipelines, and disaster recovery necessitate a distributed serving framework. Ray Serve is a distributed model serving library that addresses these requirements, and when combined with vLLM, it maximizes the strengths of each component.

This document covers understanding Ray Serve's core architecture, identifying scenarios requiring vLLM integration, and practical deployment patterns in Amazon EKS environments.

## Ray Serve Core Architecture

### The Need for Distributed Serving

A single vLLM instance deployment reaches its limits in the following situations.

First, multi-model serving. When simultaneously servicing models of different sizes and characteristics, managing individual endpoints per model, version control, and traffic routing becomes complex.

Second, complex inference pipelines. Beyond simple text generation, workflows connecting multiple models with preprocessing/postprocessing logic are required, such as embedding generation, re-ranking, RAG pipelines, and multimodal processing.

Third, fine-grained autoscaling. While Kubernetes HPA operates only at the Pod level, scaling based on inference-specific metrics such as GPU utilization, request queue length, and batch size is necessary.

Fourth, fault isolation and recovery. Mechanisms must be in place to isolate failures in specific models so they don't affect the entire service and to enable automatic recovery.

### Ray Serve Components

Ray Serve is a model serving library built on top of Ray, the distributed computing framework.

**Deployment**: A scalable service unit. Each Deployment has independent replicas, and autoscaling policies can be configured independently.

**Replica**: The actual instance of a Deployment. It is a worker processing requests and the basic unit of horizontal scaling.

**Ingress Deployment**: The entry point that receives HTTP requests and routes them to appropriate Deployments. It orchestrates complex request pipelines.

**ServeHandle**: An interface for internal communication between Deployments. It supports asynchronous calls and batch processing.

```python
from ray import serve
from ray.serve.handle import DeploymentHandle

@serve.deployment(num_replicas=2, ray_actor_options={"num_gpus": 1})
class VLLMDeployment:
    def __init__(self, model_id: str):
        from vllm import LLM
        self.llm = LLM(model=model_id)

    async def generate(self, prompt: str, **kwargs):
        outputs = self.llm.generate([prompt], **kwargs)
        return outputs[0].outputs[0].text

@serve.deployment
class Router:
    def __init__(self, model_7b: DeploymentHandle, model_70b: DeploymentHandle):
        self.model_7b = model_7b
        self.model_70b = model_70b

    async def __call__(self, request):
        data = await request.json()
        model_size = data.get("model_size", "7b")
        prompt = data["prompt"]

        if model_size == "70b":
            return await self.model_70b.generate.remote(prompt)
        return await self.model_7b.generate.remote(prompt)
```

## When Ray Serve + vLLM Integration is Needed

### When Standalone vLLM is Appropriate

Ray Serve is not necessary in all situations. If all of the following conditions are met, standalone vLLM deployment is more efficient.

- Serving only a single model
- Only simple text generation API needed
- Kubernetes HPA scaling is sufficient
- No complex preprocessing/postprocessing
- Operational simplicity is the priority

In this case, deploying vLLM's OpenAI-compatible server directly and managing it with Kubernetes Service/Ingress and HPA is simpler.

### When Ray Serve Integration is Required

Consider Ray Serve integration if any of the following requirements apply.

**Multi-model gateway**: Unified management of multiple models of different sizes/types through a single endpoint. When model versioning, A/B testing, and canary deployments are required.

```python
@serve.deployment
class ModelGateway:
    def __init__(self):
        self.models = {
            "llama-7b": VLLMDeployment.bind("meta-llama/Llama-3.2-7B"),
            "llama-70b": VLLMDeployment.bind("meta-llama/Llama-3.3-70B-Instruct"),
            "qwen-32b": VLLMDeployment.bind("Qwen/Qwen3-32B"),
        }

    async def route(self, model_name: str, prompt: str):
        if model_name not in self.models:
            raise ValueError(f"Unknown model: {model_name}")
        return await self.models[model_name].generate.remote(prompt)
```

**RAG pipeline**: Integration of embedding generation, vector search, context construction, and LLM generation into a single service.

```python
@serve.deployment
class RAGPipeline:
    def __init__(self, embedder: DeploymentHandle, llm: DeploymentHandle):
        self.embedder = embedder
        self.llm = llm
        self.vector_db = MilvusClient()

    async def query(self, question: str):
        # 1. Generate question embedding
        embedding = await self.embedder.embed.remote(question)

        # 2. Search for similar documents
        docs = self.vector_db.search(embedding, top_k=5)

        # 3. Construct context and generate with LLM
        context = "\n".join([doc.text for doc in docs])
        prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"

        return await self.llm.generate.remote(prompt)
```

**Fine-grained autoscaling**: Scaling policies based on GPU utilization, queue length, and latency.

```python
@serve.deployment(
    autoscaling_config={
        "min_replicas": 1,
        "max_replicas": 10,
        "target_ongoing_requests": 5,  # Target concurrent requests per replica
        "upscale_delay_s": 30,
        "downscale_delay_s": 300,
    },
    ray_actor_options={"num_gpus": 1}
)
class AutoScaledLLM:
    ...
```

**Complex agent workflows**: Agentic workflows involving multiple LLM calls, tool usage, and conditional branching.

## Ray Serve Deployment on Kubernetes

### KubeRay Operator

KubeRay is an operator that manages Ray clusters on Kubernetes. It declaratively deploys Ray Serve applications through the RayService CRD.

```yaml
apiVersion: ray.io/v1
kind: RayService
metadata:
  name: llm-serving
  namespace: ray-system
spec:
  serviceUnhealthySecondThreshold: 900
  deploymentUnhealthySecondThreshold: 300
  serveConfigV2: |
    applications:
      - name: llm-app
        route_prefix: /
        import_path: serve_app:deployment
        deployments:
          - name: VLLMDeployment
            num_replicas: 2
            ray_actor_options:
              num_gpus: 1
            user_config:
              model_id: "meta-llama/Llama-3.2-7B-Instruct"
  rayClusterConfig:
    rayVersion: '2.44.0'
    headGroupSpec:
      rayStartParams:
        dashboard-host: '0.0.0.0'
      template:
        spec:
          containers:
            - name: ray-head
              image: rayproject/ray-ml:2.44.0-py311-gpu
              resources:
                limits:
                  cpu: "4"
                  memory: "16Gi"
              ports:
                - containerPort: 6379
                  name: gcs-server
                - containerPort: 8265
                  name: dashboard
                - containerPort: 8000
                  name: serve
    workerGroupSpecs:
      - replicas: 2
        minReplicas: 1
        maxReplicas: 10
        groupName: gpu-worker
        rayStartParams: {}
        template:
          spec:
            nodeSelector:
              karpenter.sh/instance-family: g6e
            containers:
              - name: ray-worker
                image: rayproject/ray-ml:2.44.0-py311-gpu
                resources:
                  limits:
                    cpu: "8"
                    memory: "32Gi"
                    nvidia.com/gpu: "1"
            tolerations:
              - key: nvidia.com/gpu
                operator: Exists
                effect: NoSchedule
```

### vLLM Ray Serve Integration Deployment

The [Scalable Model Inference and Agentic AI on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks) architecture implements distributed inference through Ray Serve.

```python
# serve_app.py
import os
from typing import Dict, List, Optional
from ray import serve
from vllm import LLM, SamplingParams

@serve.deployment(
    ray_actor_options={"num_gpus": 1},
    autoscaling_config={
        "min_replicas": 1,
        "max_replicas": 8,
        "target_ongoing_requests": 3,
    }
)
class VLLMDeployment:
    def __init__(self, model_id: str, **vllm_kwargs):
        self.model_id = model_id
        self.llm = LLM(
            model=model_id,
            trust_remote_code=True,
            **vllm_kwargs
        )

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.95,
    ) -> str:
        sampling_params = SamplingParams(
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
        outputs = self.llm.generate([prompt], sampling_params)
        return outputs[0].outputs[0].text

    async def batch_generate(
        self,
        prompts: List[str],
        **kwargs
    ) -> List[str]:
        sampling_params = SamplingParams(**kwargs)
        outputs = self.llm.generate(prompts, sampling_params)
        return [o.outputs[0].text for o in outputs]

    def reconfigure(self, config: Dict):
        """Method for dynamic configuration updates"""
        pass

# Deployment configuration
deployment = VLLMDeployment.bind(
    model_id=os.environ.get("MODEL_ID", "meta-llama/Llama-3.2-7B-Instruct"),
    gpu_memory_utilization=0.9,
    max_model_len=4096,
)
```

### Multi-GPU Tensor Parallel Deployment

For large-scale models, Ray's placement group is utilized to configure multi-GPU tensor parallelization.

```python
from ray import serve
from ray.util.placement_group import placement_group
from ray.util.scheduling_strategies import PlacementGroupSchedulingStrategy

@serve.deployment(
    ray_actor_options={
        "num_gpus": 4,
        "scheduling_strategy": PlacementGroupSchedulingStrategy(
            placement_group=placement_group([{"GPU": 4}]),
            placement_group_capture_child_tasks=True,
        )
    }
)
class LargeModelDeployment:
    def __init__(self):
        from vllm import LLM
        self.llm = LLM(
            model="meta-llama/Llama-3.3-70B-Instruct",
            tensor_parallel_size=4,
            gpu_memory_utilization=0.9,
        )

    async def generate(self, prompt: str, **kwargs):
        outputs = self.llm.generate([prompt], **kwargs)
        return outputs[0].outputs[0].text
```

## Autoscaling Strategies

### Ray Serve Autoscaling

Ray Serve's autoscaling operates on a request-based model. Unlike Kubernetes HPA, it uses metrics specialized for inference workloads.

```python
autoscaling_config = {
    # Replica count range
    "min_replicas": 1,
    "max_replicas": 20,

    # Scaling trigger
    "target_ongoing_requests": 5,  # Target concurrent requests per replica

    # Scaling delays (stability)
    "upscale_delay_s": 30,    # Wait before scaling up
    "downscale_delay_s": 300,  # Wait before scaling down

    # Scaling speed
    "upscaling_factor": 1.0,   # Scale up to 100% at once
    "downscaling_factor": 0.5, # Scale down to 50% at once
}
```

### Karpenter Integration

Ray worker nodes are dynamically provisioned by Karpenter. When the Ray cluster scales, required GPU nodes are created automatically.

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: ray-gpu-workers
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/instance-family
          operator: In
          values: ["g6e", "g5", "p4d"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
  limits:
    nvidia.com/gpu: 100
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 5m
```

### Hierarchical Scaling Architecture

1. **Ray Serve level**: Replica autoscaling (request-based)
2. **Ray cluster level**: Worker node autoscaling (resource-based)
3. **Kubernetes level**: Karpenter node provisioning (Pod scheduling-based)

```
Request increase → Ray Serve replica expansion → Ray worker shortage →
Ray Autoscaler requests workers → Pending Pod appears → Karpenter provisions nodes
```

## Performance Comparison and Selection Guide

### Architecture Characteristics Comparison

| Characteristic | Standalone vLLM | Ray Serve + vLLM |
|---|---|---|
| Operational complexity | Low | High |
| Initial setup cost | Minimal | Substantial |
| Multi-model support | Separate deployment per model | Unified management |
| Scaling granularity | Pod level | Replica level |
| Complex pipelines | External orchestration required | Native support |
| Fault isolation | Pod-level | Deployment-level |
| Resource overhead | Minimal | Ray cluster overhead |
| Latency | Minimal | Slight overhead |

### Decision Flowchart

```
Start
  │
  ├─ Serving single model only? ──Yes──→ Complex pipeline? ──No──→ Standalone vLLM
  │       │                            │
  │      No                           Yes
  │       │                            │
  │       ▼                            ▼
  │   Ray Serve + vLLM          Ray Serve + vLLM
  │
  ├─ Fine-grained autoscaling needed? ──Yes──→ Ray Serve + vLLM
  │       │
  │      No
  │       │
  ├─ Prioritize operational simplicity? ──Yes──→ Standalone vLLM
  │       │
  │      No
  │       │
  └──────→ Ray Serve + vLLM
```

### Workload-Specific Architecture Recommendations

| Workload | Recommended Architecture | Reason |
|---|---|---|
| Chatbot API | Standalone vLLM | Simple request-response, low complexity |
| Multi-model gateway | Ray Serve + vLLM | Unified routing, version management |
| RAG system | Ray Serve + vLLM | Embedding-search-generation pipeline |
| Agent workflow | Ray Serve + vLLM | Complex inference, tool calling |
| Batch processing | Ray Serve + vLLM | Large-scale parallel processing |
| Real-time low-latency | Standalone vLLM | Minimal overhead |

## Monitoring and Observability

### Ray Dashboard

Ray provides a dashboard showing cluster state, resource usage, and Serve application metrics.

```yaml
# Ray Dashboard Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ray-dashboard
  namespace: ray-system
  annotations:
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
spec:
  rules:
    - host: ray-dashboard.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: llm-serving-head-svc
                port:
                  number: 8265
```

### Prometheus Metrics Integration

Ray Serve exposes metrics in Prometheus format.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ray-serve-monitor
  namespace: ray-system
spec:
  selector:
    matchLabels:
      ray.io/serve: "true"
  endpoints:
    - port: metrics
      interval: 15s
      path: /metrics
```

Key metrics:
- `ray_serve_deployment_replica_starts`: Number of replica starts
- `ray_serve_deployment_queued_queries`: Number of queued queries
- `ray_serve_deployment_request_counter`: Total request count
- `ray_serve_deployment_error_counter`: Error count
- `ray_serve_deployment_processing_latency_ms`: Processing latency

### Grafana Dashboard Example

```json
{
  "panels": [
    {
      "title": "Request Rate by Deployment",
      "expr": "sum(rate(ray_serve_deployment_request_counter[5m])) by (deployment)"
    },
    {
      "title": "P99 Latency",
      "expr": "histogram_quantile(0.99, rate(ray_serve_deployment_processing_latency_ms_bucket[5m]))"
    },
    {
      "title": "Queue Depth",
      "expr": "sum(ray_serve_deployment_queued_queries) by (deployment)"
    },
    {
      "title": "GPU Utilization",
      "expr": "avg(DCGM_FI_DEV_GPU_UTIL) by (pod)"
    }
  ]
}
```

## Production Deployment Checklist

### Ray Serve + vLLM Integration Deployment Verification

1. **Cluster Configuration**
   - KubeRay Operator installation and CRD registration
   - Ray version and vLLM version compatibility verification
   - GPU driver and CUDA version validation

2. **Resource Planning**
   - Head node: CPU-only, cluster coordination
   - Worker nodes: GPU-equipped, actual inference execution
   - Memory requirement estimation (including Ray overhead)

3. **Networking**
   - Ray GCS port (6379) internal communication allowed
   - Serve port (8000) exposed externally
   - Dashboard port (8265) access control

4. **Autoscaling**
   - Ray Serve autoscaling_config tuning
   - Karpenter NodePool GPU limit configuration
   - Scaling delay optimization

5. **Monitoring**
   - Ray Dashboard access configuration
   - Prometheus metrics collection
   - Alert rule setup

6. **Disaster Recovery**
   - Head node failure cluster restart strategy
   - Worker node preemption response
   - Model checkpoint recovery

## References

- [Ray Serve Official Documentation](https://docs.ray.io/en/latest/serve/index.html)
- [KubeRay GitHub](https://github.com/ray-project/kuberay)
- [vLLM Documentation](https://docs.vllm.ai/en/latest/)
- [Scalable Model Inference on Amazon EKS](https://github.com/aws-solutions-library-samples/guidance-for-scalable-model-inference-and-agentic-ai-on-amazon-eks)
- [GenAI on EKS Starter Kit](https://github.com/aws-samples/sample-genai-on-eks-starter-kit)
