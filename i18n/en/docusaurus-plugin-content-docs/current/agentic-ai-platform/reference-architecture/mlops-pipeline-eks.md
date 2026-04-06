---
title: "MLOps Pipeline on EKS"
sidebar_label: "MLOps Pipeline"
description: "End-to-end ML lifecycle management with Kubeflow + MLflow + vLLM + ArgoCD GitOps"
sidebar_position: 3
category: "genai-aiml"
tags: [mlops, kubeflow, mlflow, vllm, argocd, gitops, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-04-06
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, GitOpsDeployment } from '@site/src/components/MlOpsTables';

# MLOps Pipeline on EKS

> 📅 **Created**: 2026-02-13 | **Updated**: 2026-04-06 | ⏱️ **Read time**: ~12 min

## Overview

MLOps is a set of practices for automating and standardizing the development, deployment, and operation of machine learning models. This document covers building an end-to-end ML lifecycle -- from data preparation to model serving -- using Kubeflow Pipelines, MLflow, vLLM model serving, and ArgoCD GitOps deployment on Amazon EKS.

### Key Objectives

- **Full Automation**: Build automated pipelines from data ingestion to model deployment
- **Experiment Tracking**: Systematic experiment management and model versioning with MLflow
- **Scalable Serving**: High-performance model serving with vLLM + ArgoCD GitOps deployment
- **GPU Optimization**: Dynamic GPU resource management with Karpenter

---

## MLOps Architecture Overview

### End-to-End ML Lifecycle

```mermaid
flowchart LR
    subgraph Data["Data Layer"]
        S3[S3<br/>Data Lake]
        RDS[(RDS/Aurora<br/>Feature Store)]
    end

    subgraph Dev["Development Environment"]
        NOTEBOOK[Jupyter<br/>Notebooks]
        EXPERIMENT[MLflow<br/>Tracking]
    end

    subgraph Training["Training Pipeline"]
        DATA_PREP[Data<br/>Preparation]
        FEATURE_ENG[Feature<br/>Engineering]
        TRAIN[Model<br/>Training]
        EVAL[Model<br/>Evaluation]
        REGISTER[Model<br/>Registry]
    end

    subgraph Serving["Serving Layer"]
        VLLM[vLLM<br/>Model Server]
        ARGOCD[ArgoCD<br/>GitOps Deploy]
        LB[Load Balancer<br/>Ingress]
    end

    subgraph Monitor["Monitoring"]
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        DRIFT[Drift<br/>Detection]
    end

    S3 -->|Raw data| DATA_PREP
    RDS -->|Feature data| FEATURE_ENG
    NOTEBOOK --> EXPERIMENT
    EXPERIMENT -->|Experiment tracking| TRAIN

    DATA_PREP --> FEATURE_ENG
    FEATURE_ENG --> TRAIN
    TRAIN --> EVAL
    EVAL -->|Validation passed| REGISTER

    REGISTER -->|Model registered| ARGOCD
    ARGOCD -->|GitOps deploy| VLLM
    VLLM --> LB

    VLLM -->|Metrics| PROMETHEUS
    PROMETHEUS --> GRAFANA
    VLLM -->|Prediction data| DRIFT

    style Data fill:#569a31
    style Dev fill:#ffd93d
    style Training fill:#ff9900
    style Serving fill:#326ce5
    style Monitor fill:#9c27b0
```

### Core Components

<PipelineComponents />

---

## Kubeflow Pipelines Architecture

### Kubeflow Installation (AWS Distribution)

AWS provides the Kubeflow on AWS distribution, which offers an EKS-integrated configuration.

> See the [Kubeflow on AWS official documentation](https://awslabs.github.io/kubeflow-manifests/) for deployment guide.

### Kubeflow Architecture

```mermaid
flowchart TB
    UI[Central Dashboard<br/>Web UI]

    subgraph Pipelines["Pipelines"]
        KFP_API[API Server]
        KFP_ENGINE[Argo<br/>Workflows]
        KFP_DB[(MySQL<br/>Metadata)]
    end

    subgraph Notebooks["Notebooks"]
        JUPYTER[Jupyter<br/>Notebooks]
    end

    subgraph Training["Training"]
        TRAINING_OP[Training Op<br/>TFJob/PyTorch]
    end

    subgraph Serving["Serving & Deployment"]
        VLLM_SERVE[vLLM]
        ARGOCD_DEPLOY[ArgoCD]
    end

    subgraph Metadata["Metadata"]
        MLMD[ML Metadata]
    end

    UI --> KFP_API
    UI --> JUPYTER
    KFP_API --> KFP_ENGINE
    KFP_ENGINE --> KFP_DB
    KFP_ENGINE --> TRAINING_OP
    TRAINING_OP --> ARGOCD_DEPLOY
    ARGOCD_DEPLOY --> VLLM_SERVE
    KFP_ENGINE --> MLMD

    style Pipelines fill:#4285f4
    style Notebooks fill:#ffd93d
    style Training fill:#ff9900
    style Serving fill:#326ce5
    style Metadata fill:#9c27b0
```

### Writing Kubeflow Pipelines Components

Kubeflow Pipelines defines reusable components via the Python SDK.

```python
# pipeline_components.py
from kfp import dsl
from kfp.dsl import Input, Output, Dataset, Model, Metrics

@dsl.component(
    base_image="python:3.10",
    packages_to_install=["pandas", "scikit-learn", "boto3"]
)
def data_preparation(
    s3_input_path: str,
    output_dataset: Output[Dataset],
    train_split: float = 0.8
):
    """Data preparation and preprocessing component"""
    import pandas as pd
    import boto3
    from sklearn.model_selection import train_test_split
    
    # Load data from S3
    s3 = boto3.client('s3')
    bucket, key = s3_input_path.replace("s3://", "").split("/", 1)
    obj = s3.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(obj['Body'])
    
    # Data preprocessing
    df = df.dropna().drop_duplicates()
    
    # Train/Test split
    train_df, test_df = train_test_split(df, train_size=train_split, random_state=42)
    
    # Save output
    output_path = output_dataset.path
    train_df.to_csv(f"{output_path}/train.csv", index=False)
    test_df.to_csv(f"{output_path}/test.csv", index=False)
    print(f"Train: {len(train_df)}, Test: {len(test_df)}")


@dsl.component(
    base_image="pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime",
    packages_to_install=["mlflow", "scikit-learn", "boto3"]
)
def model_training(
    input_features: Input[Dataset],
    output_model: Output[Model],
    mlflow_tracking_uri: str,
    experiment_name: str,
    learning_rate: float = 0.001,
    epochs: int = 10
):
    """Model training component (PyTorch)"""
    import pandas as pd
    import torch
    import torch.nn as nn
    import mlflow
    import mlflow.pytorch
    
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    mlflow.set_experiment(experiment_name)
    
    # Load data
    X_train = pd.read_csv(f"{input_features.path}/X_train.csv").values
    y_train = pd.read_csv(f"{input_features.path}/y_train.csv").values.ravel()
    
    # Model definition (simple example)
    class SimpleNN(nn.Module):
        def __init__(self, input_dim):
            super().__init__()
            self.fc = nn.Sequential(
                nn.Linear(input_dim, 64),
                nn.ReLU(),
                nn.Linear(64, 1)
            )
        def forward(self, x):
            return self.fc(x)
    
    model = SimpleNN(X_train.shape[1])
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    
    # Start MLflow experiment
    with mlflow.start_run():
        mlflow.log_params({"learning_rate": learning_rate, "epochs": epochs})
        
        # Training loop
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(torch.FloatTensor(X_train))
            loss = criterion(outputs.squeeze(), torch.FloatTensor(y_train))
            loss.backward()
            optimizer.step()
            mlflow.log_metric("train_loss", loss.item(), step=epoch)
        
        # Save model
        torch.save(model.state_dict(), f"{output_model.path}/model.pth")
        mlflow.pytorch.log_model(model, "model")
```

### Pipeline Definition

```python
# ml_pipeline.py
from kfp import dsl

@dsl.pipeline(
    name="End-to-End ML Pipeline",
    description="Complete ML pipeline from data prep to model evaluation"
)
def ml_pipeline(
    s3_input_path: str = "s3://my-bucket/data/input.csv",
    mlflow_tracking_uri: str = "http://mlflow-server.mlflow.svc.cluster.local:5000",
    experiment_name: str = "eks-ml-experiment"
):
    # 1. Data preparation
    data_prep_task = data_preparation(s3_input_path=s3_input_path)
    
    # 2. Model training (run on GPU node)
    train_task = model_training(
        input_features=data_prep_task.outputs["output_dataset"],
        mlflow_tracking_uri=mlflow_tracking_uri,
        experiment_name=experiment_name
    )
    train_task.set_gpu_limit(1)
    train_task.add_node_selector_constraint("node.kubernetes.io/instance-type", "g5.xlarge")
    
    return train_task.outputs["output_model"]
```

---

## MLflow Integration

### MLflow Architecture

MLflow is an open-source platform for ML experiment tracking, model registry, and model deployment.

```mermaid
flowchart TB
    subgraph Clients["Clients"]
        NOTEBOOK[Jupyter<br/>Notebooks]
        PIPELINE[Kubeflow<br/>Pipelines]
        CICD[CI/CD<br/>Workflows]
    end

    subgraph MLflow["MLflow Platform"]
        UI[MLflow UI<br/>Web Interface]
        API[REST API<br/>Tracking]
        BACKEND[(PostgreSQL<br/>Metadata)]
        S3[S3 Bucket<br/>Model Artifacts]
        REGISTRY[Model Registry<br/>Versioning]
    end

    NOTEBOOK & PIPELINE & CICD -->|Experiment logging| API
    API --> BACKEND
    API --> S3
    API --> REGISTRY
    UI -->|Query| API

    style Clients fill:#ffd93d
    style MLflow fill:#ff9900
```

### MLflow Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mlflow-server
  namespace: mlflow
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mlflow-server
  template:
    metadata:
      labels:
        app: mlflow-server
    spec:
      serviceAccountName: mlflow-sa
      containers:
        - name: mlflow
          image: ghcr.io/mlflow/mlflow:v2.10.2
          ports:
            - name: http
              containerPort: 5000
          env:
            - name: MLFLOW_DB_USER
              valueFrom:
                secretKeyRef:
                  name: mlflow-db-credentials
                  key: username
            - name: MLFLOW_DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mlflow-db-credentials
                  key: password
          command:
            - mlflow
            - server
            - --host
            - "0.0.0.0"
            - --port
            - "5000"
            - --backend-store-uri
            - "postgresql://$(MLFLOW_DB_USER):$(MLFLOW_DB_PASSWORD)@postgres-service.mlflow.svc.cluster.local:5432/mlflow"
            - --default-artifact-root
            - "s3://my-mlflow-artifacts/"
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "2"
---
apiVersion: v1
kind: Service
metadata:
  name: mlflow-server
  namespace: mlflow
spec:
  type: ClusterIP
  ports:
    - port: 5000
      targetPort: 5000
  selector:
    app: mlflow-server
```

---

## GitOps Deployment Pattern Comparison

### ArgoCD vs Flux vs Manual Deployment

<GitOpsDeployment />

### ArgoCD GitOps Deployment Architecture

```mermaid
flowchart LR
    GIT[Git Repository<br/>Manifest Store]

    subgraph ArgoCD["ArgoCD Control Plane"]
        REPO_SERVER[Repo Server<br/>Manifest Rendering]
        APP_CONTROLLER[Application<br/>Controller]
        API_SERVER[API Server<br/>+ Web UI]
    end

    subgraph Target["EKS Cluster"]
        VLLM_DEPLOY[vLLM<br/>Deployment]
        HPA[HPA<br/>Autoscaling]
        SVC[Service<br/>Ingress]
    end

    GIT -->|Poll/Webhook| REPO_SERVER
    REPO_SERVER --> APP_CONTROLLER
    APP_CONTROLLER -->|Sync| VLLM_DEPLOY
    APP_CONTROLLER -->|Sync| HPA
    APP_CONTROLLER -->|Sync| SVC
    API_SERVER -->|Manage| APP_CONTROLLER

    style ArgoCD fill:#326ce5
    style Target fill:#9c27b0
    style GIT fill:#ff9900
```

### ArgoCD Installation and Configuration

> See the [ArgoCD official documentation](https://argo-cd.readthedocs.io/en/stable/getting_started/) for deployment guide.

### ArgoCD Application Example (vLLM Model Serving Deployment)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: vllm-model-serving
  namespace: argocd
spec:
  project: ml-platform
  source:
    repoURL: https://github.com/myorg/ml-manifests.git
    targetRevision: main
    path: deployments/vllm-serving
  destination:
    server: https://kubernetes.default.svc
    namespace: model-serving
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
---
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: vllm-multi-model
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - model: llama-3-70b
            gpu: "4"
          - model: mistral-7b
            gpu: "1"
  template:
    metadata:
      name: 'vllm-{{model}}'
    spec:
      project: ml-platform
      source:
        repoURL: https://github.com/myorg/ml-manifests.git
        targetRevision: main
        path: 'deployments/vllm/{{model}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: model-serving
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### vLLM Model Serving Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-llama3-70b
  namespace: model-serving
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vllm-serving
      model: llama-3-70b
  template:
    metadata:
      labels:
        app: vllm-serving
        model: llama-3-70b
    spec:
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.18.2
          ports:
            - name: http
              containerPort: 8000
          args:
            - --model
            - meta-llama/Llama-3-70B-Instruct
            - --tensor-parallel-size
            - "4"
            - --max-model-len
            - "8192"
            - --gpu-memory-utilization
            - "0.90"
            - --enable-prefix-caching
          resources:
            requests:
              nvidia.com/gpu: 4
              memory: "128Gi"
            limits:
              nvidia.com/gpu: 4
              memory: "160Gi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-llama3-70b
  namespace: model-serving
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vllm-llama3-70b
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Pods
      pods:
        metric:
          name: vllm_requests_running
        target:
          type: AverageValue
          averageValue: "10"
```

---

## Argo Workflows CI/CD Integration

### Argo Workflows Architecture

```mermaid
flowchart LR
    GIT[Git Repository<br/>Model Code]
    TRIGGER[Webhook<br/>Trigger]

    subgraph Argo["Argo Workflows"]
        WORKFLOW[Workflow<br/>Controller]
        BUILD[Build<br/>Container]
        TRAIN[Model<br/>Training]
        VALIDATE[Model<br/>Validation]
        DEPLOY[ArgoCD<br/>GitOps Deploy]
    end

    VLLM_PROD[vLLM<br/>Production]

    GIT -->|Code push| TRIGGER
    TRIGGER --> WORKFLOW
    WORKFLOW --> BUILD --> TRAIN --> VALIDATE --> DEPLOY
    DEPLOY -->|Start serving| VLLM_PROD

    style Argo fill:#4285f4
    style VLLM_PROD fill:#326ce5
```

### Argo Workflow Example

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: ml-cicd-pipeline-
  namespace: argo
spec:
  entrypoint: ml-pipeline
  serviceAccountName: argo-workflow-sa
  
  arguments:
    parameters:
      - name: git-repo
        value: "https://github.com/myorg/ml-model.git"
      - name: model-name
        value: "fraud-detection-v2"
  
  templates:
    - name: ml-pipeline
      steps:
        - - name: clone-repo
            template: git-clone
        - - name: build-image
            template: docker-build
        - - name: train-model
            template: kubeflow-training
        - - name: validate-model
            template: model-validation
        - - name: deploy-model
            template: argocd-deployment
            when: "{{steps.validate-model.outputs.result}} == passed"
    
    - name: git-clone
      container:
        image: alpine/git:latest
        command: [sh, -c]
        args:
          - git clone {{workflow.parameters.git-repo}} /workspace
    
    - name: docker-build
      container:
        image: gcr.io/kaniko-project/executor:latest
        args:
          - --dockerfile=/workspace/Dockerfile
          - --context=/workspace
          - --destination=my-registry/{{workflow.parameters.model-name}}:{{workflow.uid}}
    
    - name: kubeflow-training
      resource:
        action: create
        manifest: |
          apiVersion: kubeflow.org/v1
          kind: PyTorchJob
          metadata:
            name: {{workflow.parameters.model-name}}-{{workflow.uid}}
          spec:
            pytorchReplicaSpecs:
              Master:
                replicas: 1
                template:
                  spec:
                    containers:
                      - name: pytorch
                        image: my-registry/{{workflow.parameters.model-name}}:{{workflow.uid}}
                        command: [python, train.py]
                        resources:
                          limits:
                            nvidia.com/gpu: 1
    
    - name: model-validation
      script:
        image: python:3.10
        command: [python]
        source: |
          # Validation logic (simplified)
          accuracy = 0.95
          print("passed" if accuracy >= 0.90 else "failed")
    
    - name: argocd-deployment
      script:
        image: argoproj/argocd:v2.13
        command: [sh]
        source: |
          argocd app sync vllm-{{workflow.parameters.model-name}} --force
          argocd app wait vllm-{{workflow.parameters.model-name}} --health
```

---

## GPU Resource Scheduling (Karpenter)

### Karpenter Architecture

```mermaid
flowchart TB
    PENDING[Pending Pods<br/>GPU Required]
    CONTROLLER[Karpenter<br/>Controller]

    subgraph Provisioning["Node Provisioning"]
        PROVISION[Instance<br/>Selection]
        EC2[EC2 Launch<br/>g5/p4/p5]
        SPOT[Spot<br/>70% Savings]
    end

    PENDING -->|Scale request| CONTROLLER
    CONTROLLER --> PROVISION
    PROVISION --> EC2
    PROVISION --> SPOT

    style PENDING fill:#ea4335
    style CONTROLLER fill:#4285f4
    style Provisioning fill:#76b900
```

### Karpenter NodePool Configuration

```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-training
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["g5.xlarge", "g5.2xlarge", "g5.4xlarge"]
        - key: karpenter.k8s.aws/instance-gpu-count
          operator: Gt
          values: ["0"]
      
      nodeClassRef:
        name: gpu-node-class
      
      taints:
        - key: nvidia.com/gpu
          value: "true"
          effect: NoSchedule
  
  limits:
    nvidia.com/gpu: "50"
  
  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-node-class
spec:
  amiFamily: AL2023
  role: KarpenterNodeRole-ml-cluster
  
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: ml-cluster
  
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: ml-cluster
  
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 100Gi
        volumeType: gp3
        encrypted: true
```

---

## End-to-End Pipeline Example

### Complete Workflow

```python
# complete_ml_workflow.py
from kfp import dsl, compiler

@dsl.pipeline(
    name="Production ML Pipeline",
    description="Complete production-ready ML pipeline"
)
def production_ml_pipeline(
    data_source: str = "s3://prod-data/transactions.parquet",
    model_name: str = "fraud-detection",
    experiment_name: str = "fraud-detection-prod"
):
    # 1. Data preparation
    data_prep = data_preparation(s3_input_path=data_source)
    
    # 2. Model training (GPU)
    training = model_training(
        input_features=data_prep.outputs["output_dataset"],
        mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000",
        experiment_name=experiment_name
    )
    training.set_gpu_limit(1)
    training.add_node_selector_constraint("karpenter.sh/capacity-type", "spot")
    
    # 3. ArgoCD GitOps deployment
    deployment = deploy_via_argocd(
        model_name=model_name,
        model_uri=training.outputs["output_model"].uri
    )
```

---

## Summary

The EKS-based MLOps pipeline provides a fully automated ML lifecycle by integrating Kubeflow, MLflow, vLLM, and ArgoCD.

### Key Takeaways

1. **Kubeflow Pipelines**: Reusable component-based ML workflows
2. **MLflow**: Strengthen governance with experiment tracking and model registry
3. **vLLM**: High-performance LLM serving (PagedAttention, Prefix Caching)
4. **ArgoCD GitOps**: Declarative deployment, auto-sync, one-click rollback
5. **Karpenter**: Cost optimization through dynamic GPU resource provisioning
6. **Argo Workflows**: Shorten deployment cycles with CI/CD automation

### Next Steps

- [SageMaker-EKS Integration](./sagemaker-eks-integration.md) - Hybrid ML architecture
- [GPU Resource Management](../model-serving/gpu-resource-management.md) - GPU cluster optimization
- [Model Monitoring](../operations-mlops/agent-monitoring.md) - Production model observability

---

## References

- [Kubeflow Official Documentation](https://www.kubeflow.org/docs/)
- [MLflow Official Documentation](https://mlflow.org/docs/latest/index.html)
- [vLLM Official Documentation](https://docs.vllm.ai/)
- [ArgoCD Official Documentation](https://argo-cd.readthedocs.io/)
- [Karpenter Official Documentation](https://karpenter.sh/)
- [Argo Workflows Official Documentation](https://argoproj.github.io/workflows/)
