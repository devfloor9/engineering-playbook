---
title: "在 EKS 上构建 MLOps 流水线"
sidebar_label: "15. MLOps Pipeline"
description: "基于 Kubeflow + MLflow + KServe 的端到端 ML 生命周期管理"
sidebar_position: 15
category: "genai-aiml"
tags: [mlops, kubeflow, mlflow, kserve, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-02-14
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, KServeVsSeldon } from '@site/src/components/MlOpsTables';

# 在 EKS 上构建 MLOps 流水线

> 📅 **撰写日期**: 2025-02-05 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 23 分钟

## 概述

MLOps 是一套将机器学习模型的开发、部署和运维进行自动化与标准化的实践方法论。本文档介绍如何在 Amazon EKS 环境中利用 Kubeflow Pipelines、MLflow 和 KServe，构建从数据准备到模型服务的端到端 ML 生命周期。

### 主要目标

- **完全自动化**：构建从数据采集到模型部署的全自动流水线
- **实验追踪**：通过 MLflow 实现系统化的实验管理和模型版本管理
- **可扩展的服务**：基于 KServe 的高性能模型服务基础设施
- **GPU 优化**：利用 Karpenter 实现动态 GPU 资源管理

---

## MLOps 架构概览

### 端到端 ML 生命周期

```mermaid
flowchart TB
    subgraph "Data Layer"
        S3[S3 Data Lake]
        RDS[(RDS/Aurora<br/>Feature Store)]
    end

    subgraph "Development"
        NOTEBOOK[Jupyter Notebooks<br/>SageMaker Studio]
        EXPERIMENT[MLflow Tracking<br/>Experiment Management]
    end

    subgraph "Training Pipeline - Kubeflow"
        DATA_PREP[Data Preparation<br/>Component]
        FEATURE_ENG[Feature Engineering<br/>Component]
        TRAIN[Model Training<br/>GPU Jobs]
        EVAL[Model Evaluation<br/>Component]
        REGISTER[Model Registry<br/>MLflow]
    end

    subgraph "Serving Layer - KServe"
        PREDICTOR[Predictor<br/>Model Server]
        TRANSFORMER[Transformer<br/>Pre/Post Processing]
        EXPLAINER[Explainer<br/>Model Interpretability]
    end

    subgraph "Monitoring"
        PROMETHEUS[Prometheus<br/>Metrics]
        GRAFANA[Grafana<br/>Dashboards]
        DRIFT[Drift Detection<br/>Evidently AI]
    end

    S3 --> DATA_PREP
    RDS --> FEATURE_ENG
    NOTEBOOK --> EXPERIMENT
    EXPERIMENT --> TRAIN

    DATA_PREP --> FEATURE_ENG
    FEATURE_ENG --> TRAIN
    TRAIN --> EVAL
    EVAL --> REGISTER

    REGISTER --> PREDICTOR
    PREDICTOR --> TRANSFORMER
    TRANSFORMER --> EXPLAINER

    PREDICTOR --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    PREDICTOR --> DRIFT
```

### 核心组件

<PipelineComponents />

---

## Kubeflow Pipelines 架构

### Kubeflow 安装（AWS 发行版）

AWS 提供了 Kubeflow on AWS 发行版，提供与 EKS 集成的配置。

```bash
# 安装 Kubeflow on AWS（v1.9+）
export KUBEFLOW_RELEASE_VERSION=v1.9.0
export AWS_CLUSTER_NAME=ml-cluster
export AWS_REGION=us-west-2

# 下载 Kubeflow 清单
git clone https://github.com/awslabs/kubeflow-manifests.git
cd kubeflow-manifests
git checkout ${KUBEFLOW_RELEASE_VERSION}

# 使用 Kustomize 部署
while ! kustomize build deployments/vanilla | kubectl apply -f -; do echo "Retrying to apply resources"; sleep 10; done
```

### Kubeflow 架构

```mermaid
flowchart TB
    subgraph "Kubeflow Platform"
        UI[Central Dashboard<br/>Web UI]

        subgraph "Pipelines"
            KFP_API[Pipelines API Server]
            KFP_ENGINE[Argo Workflows<br/>Execution Engine]
            KFP_DB[(MySQL<br/>Metadata Store)]
        end

        subgraph "Notebooks"
            JUPYTER[Jupyter Notebooks<br/>Development Environment]
        end

        subgraph "Training"
            TRAINING_OP[Training Operator<br/>TFJob, PyTorchJob]
        end

        subgraph "Serving"
            KSERVE[KServe<br/>InferenceService]
        end

        subgraph "Metadata"
            MLMD[ML Metadata<br/>Artifact Tracking]
        end
    end

    UI --> KFP_API
    UI --> JUPYTER
    KFP_API --> KFP_ENGINE
    KFP_ENGINE --> KFP_DB
    KFP_ENGINE --> TRAINING_OP
    TRAINING_OP --> KSERVE
    KFP_ENGINE --> MLMD
```

### 编写 Kubeflow Pipelines 组件

Kubeflow Pipelines 通过 Python SDK 定义可复用的组件。

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
    """数据准备与预处理组件"""
    import pandas as pd
    import boto3
    from sklearn.model_selection import train_test_split

    # 从 S3 加载数据
    s3 = boto3.client('s3')
    bucket, key = s3_input_path.replace("s3://", "").split("/", 1)

    obj = s3.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(obj['Body'])

    # 数据预处理
    df = df.dropna()
    df = df.drop_duplicates()

    # Train/Test 拆分
    train_df, test_df = train_test_split(df, train_size=train_split, random_state=42)

    # 保存输出
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
    """特征工程组件"""
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    import pickle

    # 加载数据
    train_df = pd.read_csv(f"{input_dataset.path}/train.csv")
    test_df = pd.read_csv(f"{input_dataset.path}/test.csv")

    # 特征选择
    X_train = train_df[feature_columns]
    X_test = test_df[feature_columns]

    # 缩放
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 保存缩放器
    with open(f"{output_features.path}/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)

    # 保存转换后的数据
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
    """模型训练组件（PyTorch）"""
    import pandas as pd
    import torch
    import torch.nn as nn
    import mlflow
    import mlflow.pytorch

    # MLflow 配置
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    mlflow.set_experiment(experiment_name)

    # 加载数据
    X_train = pd.read_csv(f"{input_features.path}/X_train.csv").values
    y_train = pd.read_csv(f"{input_features.path}/y_train.csv").values.ravel()

    # PyTorch 数据集
    X_tensor = torch.FloatTensor(X_train)
    y_tensor = torch.FloatTensor(y_train)
    dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # 定义模型
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

    # 开始 MLflow 实验
    with mlflow.start_run():
        mlflow.log_params({
            "learning_rate": learning_rate,
            "epochs": epochs,
            "batch_size": batch_size
        })

        # 训练
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

        # 保存模型
        model_path = f"{output_model.path}/model.pth"
        torch.save(model.state_dict(), model_path)
        mlflow.pytorch.log_model(model, "model")

        # 保存模型 URI
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
    """模型评估组件"""
    import pandas as pd
    import torch
    import mlflow
    from sklearn.metrics import mean_squared_error, r2_score
    import json

    mlflow.set_tracking_uri(mlflow_tracking_uri)

    # 加载测试数据
    X_test = pd.read_csv(f"{input_features.path}/X_test.csv").values
    y_test = pd.read_csv(f"{input_features.path}/y_test.csv").values.ravel()

    # 加载模型
    with open(f"{input_model.path}/model_uri.txt", "r") as f:
        model_uri = f.read().strip()

    model = mlflow.pytorch.load_model(model_uri)
    model.eval()

    # 预测
    with torch.no_grad():
        X_tensor = torch.FloatTensor(X_test)
        predictions = model(X_tensor).squeeze().numpy()

    # 计算评估指标
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    # 记录指标
    with mlflow.start_run():
        mlflow.log_metrics({
            "test_mse": mse,
            "test_rmse": rmse,
            "test_r2": r2
        })

    # 保存输出指标
    metrics = {
        "mse": mse,
        "rmse": rmse,
        "r2": r2
    }

    with open(output_metrics.path, "w") as f:
        json.dump(metrics, f)

    print(f"Evaluation Metrics - MSE: {mse:.4f}, RMSE: {rmse:.4f}, R2: {r2:.4f}")
```

### 流水线定义

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
    # 1. 数据准备
    data_prep_task = data_preparation(
        s3_input_path=s3_input_path,
        train_split=0.8
    )

    # 2. 特征工程
    feature_eng_task = feature_engineering(
        input_dataset=data_prep_task.outputs["output_dataset"],
        feature_columns=feature_columns
    )

    # 3. 模型训练（在 GPU 节点上运行）
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

    # 4. 模型评估
    eval_task = model_evaluation(
        input_features=feature_eng_task.outputs["output_features"],
        input_model=train_task.outputs["output_model"],
        mlflow_tracking_uri=mlflow_tracking_uri
    )

    return eval_task.outputs["output_metrics"]


# 编译并运行流水线
if __name__ == "__main__":
    from kfp import compiler

    compiler.Compiler().compile(
        pipeline_func=ml_pipeline,
        package_path="ml_pipeline.yaml"
    )

    # 使用 Kubeflow Pipelines 客户端运行
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

## MLflow 集成

### MLflow 架构

MLflow 是一个用于 ML 实验追踪、模型注册中心和模型部署的开源平台。

```mermaid
flowchart TB
    subgraph "MLflow Platform"
        UI[MLflow UI<br/>Web Interface]

        subgraph "Tracking Server"
            API[REST API<br/>Tracking API]
            BACKEND[(PostgreSQL<br/>Metadata Store)]
        end

        subgraph "Artifact Store"
            S3[S3 Bucket<br/>Models & Artifacts]
        end

        subgraph "Model Registry"
            REGISTRY[Model Registry<br/>Version Management]
            STAGES[Staging → Production<br/>Lifecycle Management]
        end
    end

    subgraph "Clients"
        NOTEBOOK[Jupyter Notebooks]
        PIPELINE[Kubeflow Pipelines]
        CICD[CI/CD Workflows]
    end

    NOTEBOOK --> API
    PIPELINE --> API
    CICD --> API

    API --> BACKEND
    API --> S3
    API --> REGISTRY
    REGISTRY --> STAGES
    UI --> API
```

### MLflow 部署 YAML

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
          command:
            - mlflow
            - server
            - --host
            - "0.0.0.0"
            - --port
            - "5000"
            - --backend-store-uri
            - "postgresql://mlflow:password@postgres-service.mlflow.svc.cluster.local:5432/mlflow"
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

### PostgreSQL 后端部署

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

## KServe vs Seldon Core 比较

### 功能比较

<KServeVsSeldon />

### KServe 架构

```mermaid
flowchart TB
    subgraph "KServe InferenceService"
        INGRESS[Istio Ingress<br/>Gateway]

        subgraph "Data Plane"
            PREDICTOR[Predictor<br/>Model Server]
            TRANSFORMER[Transformer<br/>Pre/Post Processing]
            EXPLAINER[Explainer<br/>Model Interpretability]
        end

        subgraph "Control Plane"
            CONTROLLER[KServe Controller<br/>Reconciliation]
            KNATIVE[Knative Serving<br/>Serverless Runtime]
        end
    end

    INGRESS --> TRANSFORMER
    TRANSFORMER --> PREDICTOR
    PREDICTOR --> EXPLAINER

    CONTROLLER --> KNATIVE
    KNATIVE --> PREDICTOR
```

### KServe 安装

```bash
# 安装 Knative Serving（KServe 依赖项）
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.12.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.12.0/serving-core.yaml

# Istio 网络层
kubectl apply -f https://github.com/knative/net-istio/releases/download/knative-v1.12.0/net-istio.yaml

# 安装 KServe
kubectl apply -f https://github.com/kserve/kserve/releases/download/v0.12.0/kserve.yaml
kubectl apply -f https://github.com/kserve/kserve/releases/download/v0.12.0/kserve-runtimes.yaml
```

### KServe InferenceService 示例

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: sklearn-iris
  namespace: kserve-inference
spec:
  predictor:
    model:
      modelFormat:
        name: sklearn
      storageUri: s3://my-models/sklearn/iris
      resources:
        requests:
          cpu: "1"
          memory: "2Gi"
        limits:
          cpu: "2"
          memory: "4Gi"
  transformer:
    containers:
      - name: transformer
        image: my-registry/iris-transformer:v1
        env:
          - name: STORAGE_URI
            value: s3://my-models/sklearn/iris
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
---
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: pytorch-bert
  namespace: kserve-inference
spec:
  predictor:
    pytorch:
      storageUri: s3://my-models/pytorch/bert
      resources:
        requests:
          nvidia.com/gpu: 1
          memory: "8Gi"
        limits:
          nvidia.com/gpu: 1
          memory: "16Gi"
      env:
        - name: TORCH_SERVE_WORKERS
          value: "2"
  minReplicas: 1
  maxReplicas: 10
  scaleTarget: 80
  scaleMetric: concurrency
```

### Seldon Core 部署示例

```yaml
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: sklearn-iris-seldon
  namespace: seldon-system
spec:
  name: iris-model
  predictors:
    - name: default
      replicas: 2
      graph:
        name: classifier
        implementation: SKLEARN_SERVER
        modelUri: s3://my-models/sklearn/iris
        parameters:
          - name: method
            value: predict_proba
            type: STRING
      componentSpecs:
        - spec:
            containers:
              - name: classifier
                resources:
                  requests:
                    cpu: "1"
                    memory: "2Gi"
                  limits:
                    cpu: "2"
                    memory: "4Gi"
      svcOrchSpec:
        env:
          - name: SELDON_LOG_LEVEL
            value: INFO
---
apiVersion: machinelearning.seldon.io/v1
kind: SeldonDeployment
metadata:
  name: pytorch-transformer
  namespace: seldon-system
spec:
  name: bert-model
  predictors:
    - name: default
      replicas: 1
      graph:
        name: transformer
        type: TRANSFORMER
        endpoint:
          type: REST
        children:
          - name: model
            implementation: PYTORCH_SERVER
            modelUri: s3://my-models/pytorch/bert
            parameters:
              - name: model_name
                value: bert-base-uncased
                type: STRING
      componentSpecs:
        - spec:
            containers:
              - name: model
                resources:
                  requests:
                    nvidia.com/gpu: 1
                    memory: "8Gi"
                  limits:
                    nvidia.com/gpu: 1
                    memory: "16Gi"
```

---

## Argo Workflows CI/CD 集成

### Argo Workflows 架构

```mermaid
flowchart TB
    subgraph "CI/CD Pipeline"
        GIT[Git Repository<br/>Model Code]
        TRIGGER[Webhook Trigger<br/>GitHub/GitLab]

        subgraph "Argo Workflows"
            WORKFLOW[Workflow Controller]

            subgraph "Pipeline Steps"
                BUILD[Build Container<br/>Docker Image]
                TEST[Run Tests<br/>Unit + Integration]
                TRAIN[Train Model<br/>Kubeflow Pipeline]
                VALIDATE[Validate Model<br/>Performance Checks]
                DEPLOY[Deploy to KServe<br/>InferenceService]
            end
        end

        REGISTRY[Container Registry<br/>ECR/Docker Hub]
        KSERVE[KServe<br/>Production Serving]
    end

    GIT --> TRIGGER
    TRIGGER --> WORKFLOW
    WORKFLOW --> BUILD
    BUILD --> TEST
    TEST --> TRAIN
    TRAIN --> VALIDATE
    VALIDATE --> DEPLOY

    BUILD --> REGISTRY
    DEPLOY --> KSERVE
```

### Argo Workflow 示例

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
            template: kserve-deployment
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

          # 加载最新模型
          model_uri = "{{workflow.parameters.s3-model-path}}"

          # 检查验证指标
          # （实际上使用测试数据集进行评估）
          metrics = {
              "accuracy": 0.95,
              "precision": 0.93,
              "recall": 0.94
          }

          # 阈值验证
          if metrics["accuracy"] >= 0.90:
              print("passed")
          else:
              print("failed")

    - name: kserve-deployment
      resource:
        action: apply
        manifest: |
          apiVersion: serving.kserve.io/v1beta1
          kind: InferenceService
          metadata:
            name: {{workflow.parameters.model-name}}
            namespace: kserve-inference
          spec:
            predictor:
              pytorch:
                storageUri: {{workflow.parameters.s3-model-path}}
                resources:
                  requests:
                    nvidia.com/gpu: 1
                    memory: "8Gi"
                  limits:
                    nvidia.com/gpu: 1
                    memory: "16Gi"
            minReplicas: 2
            maxReplicas: 10

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

## GPU 资源调度（Karpenter）

### Karpenter 架构

```mermaid
flowchart TB
    subgraph "Karpenter Autoscaling"
        CONTROLLER[Karpenter Controller<br/>Node Provisioner]

        subgraph "Node Provisioning"
            PENDING[Pending Pods<br/>GPU Required]
            PROVISION[Provision Decision<br/>Instance Selection]
            EC2[EC2 Launch<br/>g5/p4/p5 Instances]
        end

        subgraph "Cost Optimization"
            SPOT[Spot Instances<br/>70% Cost Savings]
            CONSOLIDATION[Node Consolidation<br/>Bin Packing]
            TERMINATION[Graceful Termination<br/>Workload Migration]
        end
    end

    PENDING --> CONTROLLER
    CONTROLLER --> PROVISION
    PROVISION --> EC2
    PROVISION --> SPOT

    CONTROLLER --> CONSOLIDATION
    CONSOLIDATION --> TERMINATION
```

### Karpenter NodePool 配置

```yaml
apiVersion: karpenter.sh/v1beta1
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
    expireAfter: 720h  # 30 天

  weight: 10
---
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: gpu-node-class
spec:
  amiFamily: AL2
  role: KarpenterNodeRole-ml-cluster

  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: ml-cluster

  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: ml-cluster

  userData: |
    #!/bin/bash
    # 安装 NVIDIA 驱动
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

### GPU 工作负载调度示例

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

## 端到端流水线示例

### 完整工作流

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
    # 1. 数据验证
    data_validation = data_quality_check(
        data_source=data_source
    )

    # 2. 数据准备
    data_prep = data_preparation(
        s3_input_path=data_source,
        train_split=0.8
    ).after(data_validation)

    # 3. 特征工程
    feature_eng = feature_engineering(
        input_dataset=data_prep.outputs["output_dataset"],
        feature_columns=["amount", "merchant_id", "user_age", "transaction_hour"]
    )

    # 4. 模型训练（GPU）
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

    # 5. 模型评估
    evaluation = model_evaluation(
        input_features=feature_eng.outputs["output_features"],
        input_model=training.outputs["output_model"],
        mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000"
    )

    # 6. 模型注册（条件性）
    with dsl.Condition(evaluation.outputs["output_metrics"].outputs["accuracy"] >= deploy_threshold):
        registration = register_model(
            model_uri=training.outputs["output_model"].uri,
            model_name=model_name,
            mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000"
        )

        # 7. KServe 部署
        deployment = deploy_to_kserve(
            model_name=model_name,
            model_uri=registration.outputs["registered_model_uri"],
            namespace="kserve-inference"
        )

if __name__ == "__main__":
    compiler.Compiler().compile(
        pipeline_func=production_ml_pipeline,
        package_path="production_ml_pipeline.yaml"
    )
```

---

## 监控与告警

### MLflow 指标监控

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
            summary: "MLflow 服务器宕机"
            description: "MLflow 追踪服务器已停机超过 5 分钟"

        - alert: ModelDriftDetected
          expr: model_drift_score > 0.3
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "检测到模型漂移"
            description: "模型 {{ $labels.model_name }} 出现显著漂移"
```

---

## 总结

基于 EKS 的 MLOps 流水线通过集成 Kubeflow、MLflow 和 KServe，提供完全自动化的 ML 生命周期。

### 核心要点

1. **Kubeflow Pipelines**：基于可复用组件的 ML 工作流
2. **MLflow**：通过实验追踪和模型注册中心增强治理能力
3. **KServe**：支持自动扩缩容的生产级模型服务
4. **Karpenter**：通过 GPU 资源动态配置实现成本优化
5. **Argo Workflows**：通过 CI/CD 自动化缩短部署周期

### 下一步

- [SageMaker-EKS 集成](./sagemaker-eks-integration.md) - 混合 ML 架构
- [GPU 资源管理](./gpu-resource-management.md) - GPU 集群优化
- [模型监控](./agent-monitoring.md) - 生产模型可观测性

---

## 参考资料

- [Kubeflow 官方文档](https://www.kubeflow.org/docs/)
- [MLflow 官方文档](https://mlflow.org/docs/latest/index.html)
- [KServe 官方文档](https://kserve.github.io/website/)
- [Karpenter 官方文档](https://karpenter.sh/)
- [Argo Workflows 官方文档](https://argoproj.github.io/workflows/)
