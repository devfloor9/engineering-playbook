---
title: "Building EKS-based MLOps Pipeline"
sidebar_label: "MLOps Pipeline"
description: "End-to-end ML lifecycle management with Kubeflow + MLflow + vLLM + ArgoCD GitOps"
sidebar_position: 3
category: "genai-aiml"
tags: [mlops, kubeflow, mlflow, vllm, argocd, gitops, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-03-17
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, GitOpsDeployment } from '@site/src/components/MlOpsTables';

# Building EKS-based MLOps Pipeline

> 📅 **Created**: 2026-02-13 | **Updated**: 2026-03-17 | ⏱️ **Reading Time**: ~15 minutes

## Overview

MLOps is a practice methodology for automating and standardizing the development, deployment, and operation of machine learning models. This document covers how to build an end-to-end ML lifecycle from data preparation to model serving in Amazon EKS environment using Kubeflow Pipelines, MLflow, vLLM model serving, and ArgoCD GitOps deployment.

### Key Objectives

- **Complete Automation**: Build automated pipelines from data collection to model deployment
- **Experiment Tracking**: Systematic experiment management and model version control through MLflow
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
    EXPERIMENT -->|Track experiments| TRAIN

    DATA_PREP --> FEATURE_ENG
    FEATURE_ENG --> TRAIN
    TRAIN --> EVAL
    EVAL -->|Validation passed| REGISTER

    REGISTER -->|Register model| ARGOCD
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

AWS provides the Kubeflow on AWS distribution with EKS-integrated configuration.

```bash
# Install Kubeflow on AWS (v1.9+)
export KUBEFLOW_RELEASE_VERSION=v1.9.0
export AWS_CLUSTER_NAME=ml-cluster
export AWS_REGION=us-west-2

# Download Kubeflow manifests
git clone https://github.com/awslabs/kubeflow-manifests.git
cd kubeflow-manifests
git checkout ${KUBEFLOW_RELEASE_VERSION}

# Deploy with Kustomize
while ! kustomize build deployments/vanilla | kubectl apply -f -; do echo "Retrying to apply resources"; sleep 10; done
```

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
    df = df.dropna()
    df = df.drop_duplicates()

    # Train/Test split
    train_df, test_df = train_test_split(df, train_size=train_split, random_state=42)

    # Save output
    output_path = output_dataset.path
    train_df.to_csv(f"{output_path}/train.csv", index=False)
    test_df.to_csv(f"{output_path}/test.csv", index=False)

    print(f"Train samples: {len(train_df)}, Test samples: {len(test_df)}")


@dsl.component(
    base_image="python:3.10",
    packages_to_install=["pandas", "scikit-learn", "mlflow", "boto3"]
)
def feature_engineering(
    input_dataset: Input[Dataset],
    output_features: Output[Dataset],
    feature_columns: list
):
    """Feature engineering component"""
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    import pickle

    # Load data
    train_df = pd.read_csv(f"{input_dataset.path}/train.csv")
    test_df = pd.read_csv(f"{input_dataset.path}/test.csv")

    # Select features
    X_train = train_df[feature_columns]
    X_test = test_df[feature_columns]

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save scaler
    with open(f"{output_features.path}/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    # Save transformed data
    pd.DataFrame(X_train_scaled, columns=feature_columns).to_csv(
        f"{output_features.path}/X_train.csv", index=False
    )
    pd.DataFrame(X_test_scaled, columns=feature_columns).to_csv(
        f"{output_features.path}/X_test.csv", index=False
    )

    train_df['target'].to_csv(f"{output_features.path}/y_train.csv", index=False)
    test_df['target'].to_csv(f"{output_features.path}/y_test.csv", index=False)


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
    epochs: int = 10,
    batch_size: int = 32
):
    """Model training component (PyTorch)"""
    import pandas as pd
    import torch
    import torch.nn as nn
    import mlflow
    import mlflow.pytorch

    # MLflow configuration
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    mlflow.set_experiment(experiment_name)

    # Load data
    X_train = pd.read_csv(f"{input_features.path}/X_train.csv").values
    y_train = pd.read_csv(f"{input_features.path}/y_train.csv").values.ravel()

    # PyTorch dataset
    X_tensor = torch.FloatTensor(X_train)
    y_tensor = torch.FloatTensor(y_train)
    dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # Model definition
    class SimpleNN(nn.Module):
        def __init__(self, input_dim):
            super().__init__()
            self.fc1 = nn.Linear(input_dim, 64)
            self.fc2 = nn.Linear(64, 32)
            self.fc3 = nn.Linear(32, 1)
            self.relu = nn.ReLU()

        def forward(self, x):
            x = self.relu(self.fc1(x))
            x = self.relu(self.fc2(x))
            return self.fc3(x)

    model = SimpleNN(X_train.shape[1])
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    # Start MLflow experiment
    with mlflow.start_run():
        mlflow.log_params({
            "learning_rate": learning_rate,
            "epochs": epochs,
            "batch_size": batch_size
        })

        # Training
        for epoch in range(epochs):
            total_loss = 0
            for batch_X, batch_y in dataloader:
                optimizer.zero_grad()
                outputs = model(batch_X).squeeze()
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            avg_loss = total_loss / len(dataloader)
            mlflow.log_metric("train_loss", avg_loss, step=epoch)
            print(f"Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}")

        # Save model
        model_path = f"{output_model.path}/model.pth"
        torch.save(model.state_dict(), model_path)
        mlflow.pytorch.log_model(model, "model")

        # Save model URI
        run_id = mlflow.active_run().info.run_id
        model_uri = f"runs:/{run_id}/model"

        with open(f"{output_model.path}/model_uri.txt", "w") as f:
            f.write(model_uri)


@dsl.component(
    base_image="python:3.10",
    packages_to_install=["pandas", "torch", "scikit-learn", "mlflow"]
)
def model_evaluation(
    input_features: Input[Dataset],
    input_model: Input[Model],
    output_metrics: Output[Metrics],
    mlflow_tracking_uri: str
):
    """Model evaluation component"""
    import pandas as pd
    import torch
    import mlflow
    from sklearn.metrics import mean_squared_error, r2_score
    import json

    mlflow.set_tracking_uri(mlflow_tracking_uri)

    # Load test data
    X_test = pd.read_csv(f"{input_features.path}/X_test.csv").values
    y_test = pd.read_csv(f"{input_features.path}/y_test.csv").values.ravel()

    # Load model
    with open(f"{input_model.path}/model_uri.txt", "r") as f:
        model_uri = f.read().strip()

    model = mlflow.pytorch.load_model(model_uri)
    model.eval()

    # Prediction
    with torch.no_grad():
        X_tensor = torch.FloatTensor(X_test)
        predictions = model(X_tensor).squeeze().numpy()

    # Calculate evaluation metrics
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    # Log metrics
    with mlflow.start_run():
        mlflow.log_metrics({
            "test_mse": mse,
            "test_rmse": rmse,
            "test_r2": r2
        })

    # Save output metrics
    metrics = {
        "mse": mse,
        "rmse": rmse,
        "r2": r2
    }

    with open(output_metrics.path, "w") as f:
        json.dump(metrics, f)

    print(f"Evaluation Metrics - MSE: {mse:.4f}, RMSE: {rmse:.4f}, R2: {r2:.4f}")
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
    experiment_name: str = "eks-ml-experiment",
    feature_columns: list = ["feature1", "feature2", "feature3"],
    learning_rate: float = 0.001,
    epochs: int = 10,
    batch_size: int = 32
):
    # 1. Data preparation
    data_prep_task = data_preparation(
        s3_input_path=s3_input_path,
        train_split=0.8
    )

    # 2. Feature engineering
    feature_eng_task = feature_engineering(
        input_dataset=data_prep_task.outputs["output_dataset"],
        feature_columns=feature_columns
    )

    # 3. Model training (run on GPU nodes)
    train_task = model_training(
        input_features=feature_eng_task.outputs["output_features"],
        mlflow_tracking_uri=mlflow_tracking_uri,
        experiment_name=experiment_name,
        learning_rate=learning_rate,
        epochs=epochs,
        batch_size=batch_size
    )
    train_task.set_gpu_limit(1)
    train_task.add_node_selector_constraint("node.kubernetes.io/instance-type", "g5.xlarge")

    # 4. Model evaluation
    eval_task = model_evaluation(
        input_features=feature_eng_task.outputs["output_features"],
        input_model=train_task.outputs["output_model"],
        mlflow_tracking_uri=mlflow_tracking_uri
    )

    return eval_task.outputs["output_metrics"]


# Compile and run pipeline
if __name__ == "__main__":
    from kfp import compiler

    compiler.Compiler().compile(
        pipeline_func=ml_pipeline,
        package_path="ml_pipeline.yaml"
    )

    # Run with Kubeflow Pipelines client
    import kfp
    client = kfp.Client(host="http://kubeflow-pipelines.kubeflow.svc.cluster.local:8888")

    run = client.create_run_from_pipeline_func(
        ml_pipeline,
        arguments={
            "s3_input_path": "s3://my-ml-bucket/data/training_data.csv",
            "experiment_name": "production-model-v1",
            "epochs": 20,
            "learning_rate": 0.0005
        }
    )

    print(f"Pipeline run created: {run.run_id}")
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
        REGISTRY[Model Registry<br/>Version Control]
        STAGES[Stage Management<br/>Staging/Production]
    end

    NOTEBOOK -->|Log experiments| API
    PIPELINE -->|Pipeline execution| API
    CICD -->|Deployment trigger| API

    API --> BACKEND
    API --> S3
    API --> REGISTRY
    REGISTRY --> STAGES
    UI -->|Query| API

    style Clients fill:#ffd93d
    style MLflow fill:#ff9900
    style BACKEND fill:#326ce5
    style S3 fill:#569a31
    style REGISTRY fill:#9c27b0
```

### MLflow Deployment YAML

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mlflow
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: mlflow-config
  namespace: mlflow
data:
  MLFLOW_S3_ENDPOINT_URL: "https://s3.us-west-2.amazonaws.com"
  AWS_DEFAULT_REGION: "us-west-2"
---
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
            - name: MLFLOW_S3_ENDPOINT_URL
              valueFrom:
                configMapKeyRef:
                  name: mlflow-config
                  key: MLFLOW_S3_ENDPOINT_URL
            - name: AWS_DEFAULT_REGION
              valueFrom:
                configMapKeyRef:
                  name: mlflow-config
                  key: AWS_DEFAULT_REGION
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
            - --serve-artifacts
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "2"
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 10
            periodSeconds: 5
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
      protocol: TCP
  selector:
    app: mlflow-server
```

### PostgreSQL Backend Deployment

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: mlflow
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_DB
              value: "mlflow"
            - name: POSTGRES_USER
              value: "mlflow"
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "2Gi"
              cpu: "1"
            limits:
              memory: "4Gi"
              cpu: "2"
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: gp3
        resources:
          requests:
            storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: mlflow
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: postgres
```

---

## GitOps Deployment Pattern Comparison

### ArgoCD vs Flux vs Manual Deployment Comparison

<GitOpsDeployment />

### ArgoCD GitOps Deployment Architecture

```mermaid
flowchart LR
    GIT[Git Repository<br/>Manifest Repository]

    subgraph ArgoCD["ArgoCD Control Plane"]
        REPO_SERVER[Repo Server<br/>Manifest Rendering]
        APP_CONTROLLER[Application<br/>Controller]
        API_SERVER[API Server<br/>+ Web UI]
    end

    subgraph Target["EKS Cluster"]
        VLLM_DEPLOY[vLLM<br/>Deployment]
        HPA[HPA<br/>Auto-scaling]
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

```bash
# Create ArgoCD namespace and install
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Install ArgoCD CLI
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin/

# Check initial admin password
argocd admin initial-password -n argocd

# Login to ArgoCD server
argocd login argocd-server.argocd.svc.cluster.local --username admin --password <password>
```

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
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
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
            memory: "128Gi"
          - model: mistral-7b
            gpu: "1"
            memory: "32Gi"
          - model: codellama-34b
            gpu: "2"
            memory: "64Gi"
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
  labels:
    app: vllm-serving
    model: llama-3-70b
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
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.7.3
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
          env:
            - name: HUGGING_FACE_HUB_TOKEN
              valueFrom:
                secretKeyRef:
                  name: hf-secret
                  key: token
          resources:
            requests:
              nvidia.com/gpu: 4
              memory: "128Gi"
              cpu: "16"
            limits:
              nvidia.com/gpu: 4
              memory: "160Gi"
              cpu: "32"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 120
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 60
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: vllm-llama3-70b
  namespace: model-serving
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
      protocol: TCP
  selector:
    app: vllm-serving
    model: llama-3-70b
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
        TEST[Test<br/>Execution]
        TRAIN[Model<br/>Training]
        VALIDATE[Model<br/>Validation]
        DEPLOY[ArgoCD<br/>GitOps Deploy]
    end

    REGISTRY[Container<br/>Registry]
    VLLM_PROD[vLLM<br/>Production]

    GIT -->|Code push| TRIGGER
    TRIGGER --> WORKFLOW
    WORKFLOW --> BUILD
    BUILD --> TEST
    TEST --> TRAIN
    TRAIN --> VALIDATE
    VALIDATE --> DEPLOY

    BUILD -->|Push image| REGISTRY
    DEPLOY -->|Start serving| VLLM_PROD

    style GIT fill:#f5f5f5
    style Argo fill:#4285f4
    style REGISTRY fill:#ff9900
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
      - name: git-branch
        value: "main"
      - name: model-name
        value: "fraud-detection-v2"
      - name: s3-model-path
        value: "s3://my-models/fraud-detection/v2"

  templates:
    - name: ml-pipeline
      steps:
        - - name: clone-repo
            template: git-clone

        - - name: build-image
            template: docker-build

        - - name: run-tests
            template: pytest-tests

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
          - |
            git clone {{workflow.parameters.git-repo}} /workspace
            cd /workspace && git checkout {{workflow.parameters.git-branch}}
        volumeMounts:
          - name: workspace
            mountPath: /workspace

    - name: docker-build
      container:
        image: gcr.io/kaniko-project/executor:latest
        args:
          - --dockerfile=/workspace/Dockerfile
          - --context=/workspace
          - --destination=my-registry/{{workflow.parameters.model-name}}:{{workflow.uid}}
          - --cache=true
        volumeMounts:
          - name: workspace
            mountPath: /workspace
          - name: docker-config
            mountPath: /kaniko/.docker

    - name: pytest-tests
      container:
        image: python:3.10
        command: [sh, -c]
        args:
          - |
            cd /workspace
            pip install -r requirements.txt
            pytest tests/ --junitxml=test-results.xml
        volumeMounts:
          - name: workspace
            mountPath: /workspace

    - name: kubeflow-training
      resource:
        action: create
        manifest: |
          apiVersion: kubeflow.org/v1
          kind: PyTorchJob
          metadata:
            name: {{workflow.parameters.model-name}}-{{workflow.uid}}
            namespace: kubeflow
          spec:
            pytorchReplicaSpecs:
              Master:
                replicas: 1
                template:
                  spec:
                    containers:
                      - name: pytorch
                        image: my-registry/{{workflow.parameters.model-name}}:{{workflow.uid}}
                        command:
                          - python
                          - train.py
                          - --output-path
                          - {{workflow.parameters.s3-model-path}}
                        resources:
                          requests:
                            nvidia.com/gpu: 1
                          limits:
                            nvidia.com/gpu: 1

    - name: model-validation
      script:
        image: python:3.10
        command: [python]
        source: |
          import mlflow
          import json

          mlflow.set_tracking_uri("http://mlflow-server.mlflow.svc.cluster.local:5000")

          # Load latest model
          model_uri = "{{workflow.parameters.s3-model-path}}"

          # Check validation metrics
          # (In practice, evaluate with test dataset)
          metrics = {
              "accuracy": 0.95,
              "precision": 0.93,
              "recall": 0.94
          }

          # Validate threshold
          if metrics["accuracy"] >= 0.90:
              print("passed")
          else:
              print("failed")

    - name: argocd-deployment
      script:
        image: argoproj/argocd:v2.13
        command: [sh]
        source: |
          # Update manifest in Git repository to trigger ArgoCD auto-deployment
          argocd login $ARGOCD_SERVER --username admin --password $ARGOCD_PASSWORD --insecure

          # Update vLLM model serving manifest image/model path
          argocd app set vllm-{{workflow.parameters.model-name}} \
            --parameter model.storageUri={{workflow.parameters.s3-model-path}} \
            --parameter model.image=my-registry/{{workflow.parameters.model-name}}:{{workflow.uid}}

          # Trigger ArgoCD Sync
          argocd app sync vllm-{{workflow.parameters.model-name}} --force --prune

          # Wait for deployment completion
          argocd app wait vllm-{{workflow.parameters.model-name}} --health --timeout 600
        env:
          - name: ARGOCD_SERVER
            value: "argocd-server.argocd.svc.cluster.local"
          - name: ARGOCD_PASSWORD
            valueFrom:
              secretKeyRef:
                name: argocd-secret
                key: admin.password

  volumeClaimTemplates:
    - metadata:
        name: workspace
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

---

## GPU Resource Scheduling (Karpenter)

### Karpenter Architecture

```mermaid
flowchart TB
    PENDING[Pending Pods<br/>Require GPU]
    CONTROLLER[Karpenter<br/>Controller]

    subgraph Provisioning["Node Provisioning"]
        PROVISION[Instance<br/>Selection]
        EC2[EC2 Launch<br/>g5/p4/p5]
        SPOT[Spot<br/>70% savings]
    end

    subgraph Optimization["Cost Optimization"]
        CONSOLIDATION[Node<br/>Consolidation]
        TERMINATION[Graceful<br/>Termination]
    end

    PENDING -->|Scaling request| CONTROLLER
    CONTROLLER --> PROVISION
    PROVISION --> EC2
    PROVISION --> SPOT

    CONTROLLER -->|Run optimization| CONSOLIDATION
    CONSOLIDATION --> TERMINATION

    style PENDING fill:#ea4335
    style CONTROLLER fill:#4285f4
    style Provisioning fill:#76b900
    style Optimization fill:#9c27b0
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
          values: ["g5.xlarge", "g5.2xlarge", "g5.4xlarge", "g5.8xlarge"]
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
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
    cpu: "1000"
    memory: "4000Gi"
    nvidia.com/gpu: "50"

  disruption:
    consolidationPolicy: WhenUnderutilized
    expireAfter: 720h  # 30 days

  weight: 10
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

  userData: |
    #!/bin/bash
    # Install NVIDIA Driver
    /etc/eks/bootstrap.sh ml-cluster \
      --kubelet-extra-args '--max-pods=110'

    # NVIDIA Container Toolkit
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.repo | \
      sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo

    sudo yum install -y nvidia-container-toolkit
    sudo nvidia-ctk runtime configure --runtime=containerd
    sudo systemctl restart containerd

  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 100Gi
        volumeType: gp3
        iops: 3000
        throughput: 125
        encrypted: true

  metadataOptions:
    httpEndpoint: enabled
    httpProtocolIPv6: disabled
    httpPutResponseHopLimit: 2
    httpTokens: required

  tags:
    Environment: production
    Team: ml-platform
    ManagedBy: karpenter
```

### GPU Workload Scheduling Example

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: gpu-training-job
  namespace: ml-training
spec:
  template:
    metadata:
      labels:
        app: gpu-training
    spec:
      nodeSelector:
        karpenter.sh/capacity-type: spot
        node.kubernetes.io/instance-type: g5.2xlarge

      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule

      containers:
        - name: trainer
          image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
          command:
            - python
            - train.py
          resources:
            requests:
              nvidia.com/gpu: 1
              memory: "16Gi"
              cpu: "8"
            limits:
              nvidia.com/gpu: 1
              memory: "32Gi"
              cpu: "16"

          env:
            - name: CUDA_VISIBLE_DEVICES
              value: "0"

      restartPolicy: OnFailure
  backoffLimit: 3
```

---

## End-to-End Pipeline Example

### Complete Workflow

```python
# complete_ml_workflow.py
from kfp import dsl, compiler
import kfp

@dsl.pipeline(
    name="Production ML Pipeline",
    description="Complete production-ready ML pipeline with monitoring"
)
def production_ml_pipeline(
    data_source: str = "s3://prod-data/transactions.parquet",
    model_name: str = "fraud-detection",
    experiment_name: str = "fraud-detection-prod",
    deploy_threshold: float = 0.92
):
    # 1. Data validation
    data_validation = data_quality_check(
        data_source=data_source
    )

    # 2. Data preparation
    data_prep = data_preparation(
        s3_input_path=data_source,
        train_split=0.8
    ).after(data_validation)

    # 3. Feature engineering
    feature_eng = feature_engineering(
        input_dataset=data_prep.outputs["output_dataset"],
        feature_columns=["amount", "merchant_id", "user_age", "transaction_hour"]
    )

    # 4. Model training (GPU)
    training = model_training(
        input_features=feature_eng.outputs["output_features"],
        mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000",
        experiment_name=experiment_name,
        learning_rate=0.0005,
        epochs=50,
        batch_size=64
    )
    training.set_gpu_limit(1)
    training.add_node_selector_constraint("karpenter.sh/capacity-type", "spot")

    # 5. Model evaluation
    evaluation = model_evaluation(
        input_features=feature_eng.outputs["output_features"],
        input_model=training.outputs["output_model"],
        mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000"
    )

    # 6. Model registration (conditional)
    with dsl.Condition(evaluation.outputs["output_metrics"].outputs["accuracy"] >= deploy_threshold):
        registration = register_model(
            model_uri=training.outputs["output_model"].uri,
            model_name=model_name,
            mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000"
        )

        # 7. ArgoCD GitOps deployment (vLLM serving)
        deployment = deploy_via_argocd(
            model_name=model_name,
            model_uri=registration.outputs["registered_model_uri"],
            namespace="model-serving"
        )

if __name__ == "__main__":
    compiler.Compiler().compile(
        pipeline_func=production_ml_pipeline,
        package_path="production_ml_pipeline.yaml"
    )
```

---

## Monitoring and Alerting

### MLflow Metrics Monitoring

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: mlflow-monitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: mlflow-server
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: mlflow-alerts
  namespace: monitoring
spec:
  groups:
    - name: mlflow-alerts
      rules:
        - alert: MLflowServerDown
          expr: up{job="mlflow-server"} == 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "MLflow server is down"
            description: "MLflow tracking server has been down for more than 5 minutes"

        - alert: ModelDriftDetected
          expr: model_drift_score > 0.3
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Model drift detected"
            description: "Model {{ $labels.model_name }} shows significant drift"
```

---

## Summary

EKS-based MLOps pipeline provides a fully automated ML lifecycle through the integration of Kubeflow, MLflow, vLLM, and ArgoCD.

### Key Points

1. **Kubeflow Pipelines**: Reusable component-based ML workflows
2. **MLflow**: Strengthen governance with experiment tracking and model registry
3. **vLLM**: High-performance LLM serving (PagedAttention, Prefix Caching)
4. **ArgoCD GitOps**: Declarative deployment, automatic sync, one-click rollback
5. **Karpenter**: Cost optimization through dynamic GPU resource provisioning
6. **Argo Workflows**: Shorten deployment cycles with CI/CD automation

### Next Steps

- [SageMaker-EKS Integration](./sagemaker-eks-integration.md) - Hybrid ML architecture
- [GPU Resource Management](../model-serving/gpu-resource-management.md) - GPU cluster optimization
- [Model Monitoring](./agent-monitoring.md) - Production model observability

---

## References

- [Kubeflow Official Documentation](https://www.kubeflow.org/docs/)
- [MLflow Official Documentation](https://mlflow.org/docs/latest/index.html)
- [vLLM Official Documentation](https://docs.vllm.ai/)
- [ArgoCD Official Documentation](https://argo-cd.readthedocs.io/)
- [Karpenter Official Documentation](https://karpenter.sh/)
- [Argo Workflows Official Documentation](https://argoproj.github.io/workflows/)
