---
title: MLOps Pipeline on EKS
description: End-to-end ML lifecycle management with Kubeflow + MLflow + vLLM + ArgoCD GitOps
created: "2026-02-11"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 17
tags:
  - mlops
  - kubeflow
  - mlflow
  - vllm
  - argocd
  - gitops
  - argo-workflows
  - eks
  - ml-pipeline
  - scope:impl
sidebar_label: MLOps Pipeline
sidebar_position: 3
category: genai-aiml
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, GitOpsDeployment } from '@site/src/components/MlOpsTables';

## Overview

MLOps is a set of practices that automate and standardize the development, deployment, and operation of machine learning models. This document covers how to build an end-to-end ML lifecycle from data preparation to model serving in an Amazon EKS environment, utilizing Kubeflow Pipelines, MLflow, vLLM model serving, and ArgoCD GitOps deployment.

### Key Objectives

- **Full Automation**: Build automated pipelines from data collection to model deployment
- **Experiment Tracking**: Systematic experiment management and model version control via MLflow
- **Scalable Serving**: High-performance model serving with vLLM + ArgoCD GitOps deployment
- **GPU Optimization**: Dynamic GPU resource management using Karpenter

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

### Kubeflow Installation {#kubeflow-installation-aws-distribution}

:::caution awslabs/kubeflow-manifests is no longer maintained
awslabs/kubeflow-manifests has not been updated since 2023-09 (last release v1.7.0-aws-b1.0.3, no support for Kubeflow 1.8+). New installations do not work, and it has been removed from the official kubeflow.org distribution list. To use Kubeflow on EKS, deploy upstream [kubeflow/manifests](https://github.com/kubeflow/manifests) (currently 1.11) directly, or use another maintained distribution.
:::

> Refer to the [Kubeflow official installation documentation](https://www.kubeflow.org/docs/started/installing-kubeflow/) for deployment guides.

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

Kubeflow Pipelines defines reusable components through the Python SDK.

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
    
    # Load data (split features/labels from the train.csv saved by data_preparation)
    train_df = pd.read_csv(f"{input_features.path}/train.csv")
    X_train = train_df.drop(columns=["target"]).values
    y_train = train_df["target"].values.ravel()
    
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

    # Runs on a GPU node, so move the model and tensors to the device explicitly.
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    X_tensor = torch.FloatTensor(X_train).to(device)
    y_tensor = torch.FloatTensor(y_train).to(device)

    # Start MLflow experiment
    with mlflow.start_run():
        mlflow.log_params({"learning_rate": learning_rate, "epochs": epochs})
        mlflow.log_param("device", str(device))

        # Training loop
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs.squeeze(), y_tensor)
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
from kfp import kubernetes  # kfp-kubernetes extension (Kubernetes-specific features such as node selection)

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
    # KFP v2: declare accelerator type and count; set node selection via the kfp-kubernetes extension
    train_task.set_accelerator_type("nvidia.com/gpu")
    train_task.set_accelerator_limit(1)
    kubernetes.add_node_selector(
        train_task,
        label_key="node.kubernetes.io/instance-type",
        label_value="g5.xlarge",
    )
    
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
          image: ghcr.io/mlflow/mlflow:v3.14.0  # released 2026-06-17, latest stable
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

:::caution MLflow server prerequisites and authentication
The manifest above assumes these resources already exist: the PostgreSQL backend store (`postgres-service`) and its credentials secret (`mlflow-db-credentials`), an S3 bucket for artifacts (`s3://my-mlflow-artifacts/`), and an `mlflow-sa` service account (IRSA) granted narrowly scoped `s3:GetObject`/`s3:PutObject` on that bucket. The MLflow server itself has no built-in authentication, so place it behind a gateway or OIDC proxy to control access. Also decide whether clients write artifacts directly to S3 (clients need S3 permissions) or through the server as a proxy (`--serve-artifacts`, only the server needs S3 permissions), and grant only the matching permissions.
:::

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

> Refer to the [ArgoCD official documentation](https://argo-cd.readthedocs.io/en/stable/getting_started/) for deployment guides.

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

:::note The training pipeline and the serving example are different models
The Kubeflow pipeline example above is a small PyTorch example over tabular data (SimpleNN, `model.pth`) that illustrates the pipeline structure. The large language model (`Meta-Llama-3-70B-Instruct`) deployed by the vLLM serving example below is not its output; the two examples are separate. To actually produce the model that vLLM serves from the pipeline, train and export a compatible LLM, promote that artifact through Git, and wire the manifest below to reference that artifact.
:::

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-llama3-70b
  namespace: model-serving
spec:
  # replicas is owned by the HPA, so it is not set on the Deployment (see caution below).
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
          image: vllm/vllm-openai:v0.23.0
          ports:
            - name: http
              containerPort: 8000
          args:
            - --model
            - meta-llama/Meta-Llama-3-70B-Instruct  # actual HuggingFace repository ID (Llama-3-70B-Instruct does not exist)
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

:::caution replicas ownership and custom-metric prerequisites
The HPA (`minReplicas: 2`) owns the replica count, so the Deployment does not set `replicas`. If you both set `replicas` on the Deployment and manage this manifest with ArgoCD, ArgoCD reverts to the Git value while the HPA re-adjusts, causing a repeated conflict; in that case exclude `/spec/replicas` with `ignoreDifferences` on the ArgoCD Application. The custom metric `vllm_requests_running` used by the HPA is a Pods metric, so a Prometheus Adapter (or an equivalent custom.metrics.k8s.io adapter) must first be configured with a mapping rule that exposes it. A vLLM pod becomes ready only after the model weights are downloaded and loaded, so a readinessProbe that accounts for the download time and GPU memory matching `--max-model-len` are prerequisites. Because `meta-llama/Meta-Llama-3-70B-Instruct` is a gated repository, provide a HuggingFace token (for example via the `HF_TOKEN` environment variable from a secret) and have model access approved first.
:::

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

:::caution A design sketch, not an executable manifest
The Workflow below is a design sketch that shows the structure of the CI/CD stages; it does not run as-is. To use it in production you must add the following. First, `git-clone` and `docker-build` run in separate pods, so passing the cloned source requires a volume shared by both steps (a PVC created via the Workflow's `volumeClaimTemplates`, or an artifact store). Second, for kaniko to push to the registry it needs a namespace-scoped registry credential secret (mounted at `/kaniko/.docker/config.json`). Third, `model-validation` must decide deployment from evaluating the actual trained artifact; the fixed `accuracy = 0.95` below is only a placeholder and must not authorize a production deployment.
:::

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
        image: gcr.io/kaniko-project/executor:v1.24.0  # kaniko was archived in 2025-06 (unmaintained). Consider a maintained fork (chainguard-dev/kaniko) or Buildah/BuildKit
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
          # Load the actual model artifact that training saved and evaluate it on a held-out test set.
          # (This is a fragment showing only the evaluation call; accuracy must not be a constant.)
          from evaluate_model import load_and_evaluate  # load artifact + hold-out evaluation
          accuracy = load_and_evaluate()
          # Authorize deployment only from the measured accuracy.
          print("passed" if accuracy >= 0.90 else "failed")
    
    - name: argocd-deployment
      script:
        image: quay.io/argoproj/argocd:v3.4.4  # released 2026-06-18 (official registry, patch-level tag required)
        command: [sh]
        source: |
          # --force deletes and recreates resources, so use it only when intentionally required.
          # Log in with a least-privilege token, promote an immutable artifact tag in Git, then sync.
          argocd app sync vllm-{{workflow.parameters.model-name}}
          argocd app wait vllm-{{workflow.parameters.model-name}} --health
```

---

## GPU Resource Scheduling (Karpenter)

Karpenter provides dynamic node provisioning for GPU workloads. When it detects Pending Pods, it automatically selects and provisions appropriate GPU instances.

:::info Detailed Karpenter Configuration
For NodePool configuration, Spot strategies, Consolidation policies, and GPU instance comparisons, refer to [GPU Resource Management](../../model-serving/gpu-infrastructure/gpu-resource-management.md).
:::

---

## End-to-End Pipeline Example

### Complete Workflow

```python
# complete_ml_workflow.py
from kfp import dsl, compiler
from kfp import kubernetes
# Note: deploy_via_argocd and the model evaluation component must be defined with @dsl.component
# in separate files and imported. The pipeline below is a wiring example that assumes they exist.
from components import deploy_via_argocd, evaluate_model

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
    training.set_accelerator_type("nvidia.com/gpu")
    training.set_accelerator_limit(1)
    kubernetes.add_node_selector(
        training,
        label_key="karpenter.sh/capacity-type",
        label_value="spot",
    )

    # 3. Evaluation gate: proceed to deploy only when measured metrics pass the threshold
    evaluation = evaluate_model(
        input_model=training.outputs["output_model"],
        test_dataset=data_prep.outputs["output_dataset"],
    )

    # 4. Deploy via ArgoCD GitOps only if evaluation passes (promote an immutable artifact in Git)
    with dsl.If(evaluation.outputs["passed"] == True):
        deploy_via_argocd(
            model_name=model_name,
            model_uri=training.outputs["output_model"].uri,
        )
```

---

## Summary

The EKS-based MLOps pipeline integrates Kubeflow, MLflow, vLLM, and ArgoCD to provide a fully automated ML lifecycle.

### Key Points

1. **Kubeflow Pipelines**: Reusable component-based ML workflows
2. **MLflow**: Strengthened governance through experiment tracking and model registry
3. **vLLM**: High-performance LLM serving (PagedAttention, Prefix Caching)
4. **ArgoCD GitOps**: Declarative deployment and auto-sync. When auto-sync is enabled, ArgoCD continuously re-applies the Git state, so a rollback is not "one-click" but a Git revert to a previous commit, or an operation performed after deliberately disabling auto-sync.
5. **Karpenter**: Cost optimization through dynamic GPU resource provisioning
6. **Argo Workflows**: Shortened deployment cycles through CI/CD automation

### Next Steps

- [Custom Model Pipeline](./custom-model-pipeline.md) - LoRA fine-tuning training pipeline (details of the training stage in this document)
- [Custom Model Deployment](./custom-model-deployment.md) - Hands-on EKS deployment guide for large models such as GLM-5
- [Continuous Training Pipeline](./continuous-training/index.md) - Trace-based retraining and automated Canary rollout
- [SageMaker-EKS Integration](../integrations/sagemaker-eks-integration.md) - Hybrid ML architecture
- [GPU Resource Management](../../model-serving/gpu-infrastructure/gpu-resource-management.md) - GPU cluster optimization
- [Model Monitoring](../../operations-mlops/observability/agent-monitoring.md) - Production model observability

---

## References

- [Kubeflow Official Documentation](https://www.kubeflow.org/docs/)
- [MLflow Official Documentation](https://mlflow.org/docs/latest/index.html)
- [vLLM Official Documentation](https://docs.vllm.ai/)
- [ArgoCD Official Documentation](https://argo-cd.readthedocs.io/)
- [Karpenter Official Documentation](https://karpenter.sh/)
- [Argo Workflows Official Documentation](https://argoproj.github.io/workflows/)
