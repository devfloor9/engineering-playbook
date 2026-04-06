---
title: "EKS 기반 MLOps 파이프라인 구축"
sidebar_label: "MLOps 파이프라인"
description: "Kubeflow + MLflow + vLLM + ArgoCD GitOps 기반 엔드투엔드 ML 라이프사이클 관리"
sidebar_position: 3
category: "genai-aiml"
tags: [mlops, kubeflow, mlflow, vllm, argocd, gitops, argo-workflows, eks, ml-pipeline]
last_update:
  date: 2026-03-17
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, GitOpsDeployment } from '@site/src/components/MlOpsTables';

# EKS 기반 MLOps 파이프라인 구축

> 📅 **작성일**: 2026-02-13 | **수정일**: 2026-03-17 | ⏱️ **읽는 시간**: 약 15분

## 개요

MLOps는 머신러닝 모델의 개발, 배포, 운영을 자동화하고 표준화하는 실천 방법론입니다. 이 문서에서는 Amazon EKS 환경에서 Kubeflow Pipelines, MLflow, vLLM 모델 서빙, ArgoCD GitOps 배포를 활용하여 데이터 준비부터 모델 서빙까지 엔드투엔드 ML 라이프사이클을 구축하는 방법을 다룹니다.

### 주요 목표

- **완전 자동화**: 데이터 수집부터 모델 배포까지 자동화된 파이프라인 구축
- **실험 추적**: MLflow를 통한 체계적인 실험 관리 및 모델 버전 관리
- **확장 가능한 서빙**: vLLM 기반 고성능 모델 서빙 + ArgoCD GitOps 배포
- **GPU 최적화**: Karpenter를 활용한 동적 GPU 리소스 관리

---

## MLOps 아키텍처 개요

### 엔드투엔드 ML 라이프사이클

```mermaid
flowchart LR
    subgraph Data["데이터 계층"]
        S3[S3<br/>Data Lake]
        RDS[(RDS/Aurora<br/>Feature Store)]
    end

    subgraph Dev["개발 환경"]
        NOTEBOOK[Jupyter<br/>Notebooks]
        EXPERIMENT[MLflow<br/>Tracking]
    end

    subgraph Training["학습 파이프라인"]
        DATA_PREP[데이터<br/>준비]
        FEATURE_ENG[피처<br/>엔지니어링]
        TRAIN[모델<br/>학습]
        EVAL[모델<br/>평가]
        REGISTER[모델<br/>레지스트리]
    end

    subgraph Serving["서빙 계층"]
        VLLM[vLLM<br/>Model Server]
        ARGOCD[ArgoCD<br/>GitOps Deploy]
        LB[Load Balancer<br/>Ingress]
    end

    subgraph Monitor["모니터링"]
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        DRIFT[Drift<br/>Detection]
    end

    S3 -->|원본 데이터| DATA_PREP
    RDS -->|피처 데이터| FEATURE_ENG
    NOTEBOOK --> EXPERIMENT
    EXPERIMENT -->|실험 추적| TRAIN

    DATA_PREP --> FEATURE_ENG
    FEATURE_ENG --> TRAIN
    TRAIN --> EVAL
    EVAL -->|검증 통과| REGISTER

    REGISTER -->|모델 등록| ARGOCD
    ARGOCD -->|GitOps 배포| VLLM
    VLLM --> LB

    VLLM -->|메트릭| PROMETHEUS
    PROMETHEUS --> GRAFANA
    VLLM -->|예측 데이터| DRIFT

    style Data fill:#569a31
    style Dev fill:#ffd93d
    style Training fill:#ff9900
    style Serving fill:#326ce5
    style Monitor fill:#9c27b0
```

### 핵심 컴포넌트

<PipelineComponents />

---

## Kubeflow Pipelines 아키텍처

### Kubeflow 설치 (AWS 배포판)

AWS에서는 Kubeflow on AWS 배포판을 제공하며, EKS와 통합된 구성을 제공합니다.

```bash
# Kubeflow on AWS 설치 (v1.9+)
export KUBEFLOW_RELEASE_VERSION=v1.9.0
export AWS_CLUSTER_NAME=ml-cluster
export AWS_REGION=us-west-2

# Kubeflow 매니페스트 다운로드
git clone https://github.com/awslabs/kubeflow-manifests.git
cd kubeflow-manifests
git checkout ${KUBEFLOW_RELEASE_VERSION}

# Kustomize로 배포
while ! kustomize build deployments/vanilla | kubectl apply -f -; do echo "Retrying to apply resources"; sleep 10; done
```

### Kubeflow 아키텍처

```mermaid
flowchart TB
    UI[Central Dashboard<br/>Web UI]

    subgraph Pipelines["파이프라인"]
        KFP_API[API Server]
        KFP_ENGINE[Argo<br/>Workflows]
        KFP_DB[(MySQL<br/>Metadata)]
    end

    subgraph Notebooks["노트북"]
        JUPYTER[Jupyter<br/>Notebooks]
    end

    subgraph Training["학습"]
        TRAINING_OP[Training Op<br/>TFJob/PyTorch]
    end

    subgraph Serving["서빙 & 배포"]
        VLLM_SERVE[vLLM]
        ARGOCD_DEPLOY[ArgoCD]
    end

    subgraph Metadata["메타데이터"]
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

### Kubeflow Pipelines 컴포넌트 작성

Kubeflow Pipelines는 Python SDK를 통해 재사용 가능한 컴포넌트를 정의합니다.

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
    """데이터 준비 및 전처리 컴포넌트"""
    import pandas as pd
    import boto3
    from sklearn.model_selection import train_test_split
    
    # S3에서 데이터 로드
    s3 = boto3.client('s3')
    bucket, key = s3_input_path.replace("s3://", "").split("/", 1)
    
    obj = s3.get_object(Bucket=bucket, Key=key)
    df = pd.read_csv(obj['Body'])
    
    # 데이터 전처리
    df = df.dropna()
    df = df.drop_duplicates()
    
    # Train/Test 분할
    train_df, test_df = train_test_split(df, train_size=train_split, random_state=42)
    
    # 출력 저장
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
    """피처 엔지니어링 컴포넌트"""
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    import pickle
    
    # 데이터 로드
    train_df = pd.read_csv(f"{input_dataset.path}/train.csv")
    test_df = pd.read_csv(f"{input_dataset.path}/test.csv")
    
    # 피처 선택
    X_train = train_df[feature_columns]
    X_test = test_df[feature_columns]
    
    # 스케일링
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 스케일러 저장
    with open(f"{output_features.path}/scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    
    # 변환된 데이터 저장
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
    """모델 학습 컴포넌트 (PyTorch)"""
    import pandas as pd
    import torch
    import torch.nn as nn
    import mlflow
    import mlflow.pytorch
    
    # MLflow 설정
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    mlflow.set_experiment(experiment_name)
    
    # 데이터 로드
    X_train = pd.read_csv(f"{input_features.path}/X_train.csv").values
    y_train = pd.read_csv(f"{input_features.path}/y_train.csv").values.ravel()
    
    # PyTorch 데이터셋
    X_tensor = torch.FloatTensor(X_train)
    y_tensor = torch.FloatTensor(y_train)
    dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    # 모델 정의
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
    
    # MLflow 실험 시작
    with mlflow.start_run():
        mlflow.log_params({
            "learning_rate": learning_rate,
            "epochs": epochs,
            "batch_size": batch_size
        })
        
        # 학습
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
        
        # 모델 저장
        model_path = f"{output_model.path}/model.pth"
        torch.save(model.state_dict(), model_path)
        mlflow.pytorch.log_model(model, "model")
        
        # 모델 URI 저장
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
    """모델 평가 컴포넌트"""
    import pandas as pd
    import torch
    import mlflow
    from sklearn.metrics import mean_squared_error, r2_score
    import json
    
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    
    # 테스트 데이터 로드
    X_test = pd.read_csv(f"{input_features.path}/X_test.csv").values
    y_test = pd.read_csv(f"{input_features.path}/y_test.csv").values.ravel()
    
    # 모델 로드
    with open(f"{input_model.path}/model_uri.txt", "r") as f:
        model_uri = f.read().strip()
    
    model = mlflow.pytorch.load_model(model_uri)
    model.eval()
    
    # 예측
    with torch.no_grad():
        X_tensor = torch.FloatTensor(X_test)
        predictions = model(X_tensor).squeeze().numpy()
    
    # 평가 메트릭 계산
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)
    
    # 메트릭 로깅
    with mlflow.start_run():
        mlflow.log_metrics({
            "test_mse": mse,
            "test_rmse": rmse,
            "test_r2": r2
        })
    
    # 출력 메트릭 저장
    metrics = {
        "mse": mse,
        "rmse": rmse,
        "r2": r2
    }
    
    with open(output_metrics.path, "w") as f:
        json.dump(metrics, f)
    
    print(f"Evaluation Metrics - MSE: {mse:.4f}, RMSE: {rmse:.4f}, R2: {r2:.4f}")
```

### 파이프라인 정의

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
    # 1. 데이터 준비
    data_prep_task = data_preparation(
        s3_input_path=s3_input_path,
        train_split=0.8
    )
    
    # 2. 피처 엔지니어링
    feature_eng_task = feature_engineering(
        input_dataset=data_prep_task.outputs["output_dataset"],
        feature_columns=feature_columns
    )
    
    # 3. 모델 학습 (GPU 노드에서 실행)
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
    
    # 4. 모델 평가
    eval_task = model_evaluation(
        input_features=feature_eng_task.outputs["output_features"],
        input_model=train_task.outputs["output_model"],
        mlflow_tracking_uri=mlflow_tracking_uri
    )
    
    return eval_task.outputs["output_metrics"]


# 파이프라인 컴파일 및 실행
if __name__ == "__main__":
    from kfp import compiler
    
    compiler.Compiler().compile(
        pipeline_func=ml_pipeline,
        package_path="ml_pipeline.yaml"
    )
    
    # Kubeflow Pipelines 클라이언트로 실행
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

## MLflow 통합

### MLflow 아키텍처

MLflow는 ML 실험 추적, 모델 레지스트리, 모델 배포를 위한 오픈소스 플랫폼입니다.

```mermaid
flowchart TB
    subgraph Clients["클라이언트"]
        NOTEBOOK[Jupyter<br/>Notebooks]
        PIPELINE[Kubeflow<br/>Pipelines]
        CICD[CI/CD<br/>Workflows]
    end

    subgraph MLflow["MLflow 플랫폼"]
        UI[MLflow UI<br/>웹 인터페이스]
        API[REST API<br/>Tracking]
        BACKEND[(PostgreSQL<br/>메타데이터)]
        S3[S3 Bucket<br/>모델 아티팩트]
        REGISTRY[Model Registry<br/>버전 관리]
        STAGES[Stage 관리<br/>Staging/Production]
    end

    NOTEBOOK -->|실험 로깅| API
    PIPELINE -->|파이프라인 실행| API
    CICD -->|배포 트리거| API

    API --> BACKEND
    API --> S3
    API --> REGISTRY
    REGISTRY --> STAGES
    UI -->|조회| API

    style Clients fill:#ffd93d
    style MLflow fill:#ff9900
    style BACKEND fill:#326ce5
    style S3 fill:#569a31
    style REGISTRY fill:#9c27b0
```

### MLflow 배포 YAML

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

### PostgreSQL 백엔드 배포

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

## GitOps 배포 패턴 비교

### ArgoCD vs Flux vs 수동 배포 비교

<GitOpsDeployment />

### ArgoCD GitOps 배포 아키텍처

```mermaid
flowchart LR
    GIT[Git Repository<br/>매니페스트 저장소]

    subgraph ArgoCD["ArgoCD 컨트롤 플레인"]
        REPO_SERVER[Repo Server<br/>매니페스트 렌더링]
        APP_CONTROLLER[Application<br/>Controller]
        API_SERVER[API Server<br/>+ Web UI]
    end

    subgraph Target["EKS 클러스터"]
        VLLM_DEPLOY[vLLM<br/>Deployment]
        HPA[HPA<br/>오토스케일링]
        SVC[Service<br/>Ingress]
    end

    GIT -->|Poll/Webhook| REPO_SERVER
    REPO_SERVER --> APP_CONTROLLER
    APP_CONTROLLER -->|Sync| VLLM_DEPLOY
    APP_CONTROLLER -->|Sync| HPA
    APP_CONTROLLER -->|Sync| SVC
    API_SERVER -->|관리| APP_CONTROLLER

    style ArgoCD fill:#326ce5
    style Target fill:#9c27b0
    style GIT fill:#ff9900
```

### ArgoCD 설치 및 설정

```bash
# ArgoCD 네임스페이스 생성 및 설치
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD CLI 설치
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin/

# 초기 관리자 비밀번호 확인
argocd admin initial-password -n argocd

# ArgoCD 서버 로그인
argocd login argocd-server.argocd.svc.cluster.local --username admin --password <password>
```

### ArgoCD Application 예제 (vLLM 모델 서빙 배포)

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

### vLLM 모델 서빙 Deployment 예제

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

## Argo Workflows CI/CD 통합

### Argo Workflows 아키텍처

```mermaid
flowchart LR
    GIT[Git Repository<br/>모델 코드]
    TRIGGER[Webhook<br/>Trigger]

    subgraph Argo["Argo Workflows"]
        WORKFLOW[Workflow<br/>Controller]
        BUILD[빌드<br/>컨테이너]
        TEST[테스트<br/>실행]
        TRAIN[모델<br/>학습]
        VALIDATE[모델<br/>검증]
        DEPLOY[ArgoCD<br/>GitOps 배포]
    end

    REGISTRY[Container<br/>Registry]
    VLLM_PROD[vLLM<br/>Production]

    GIT -->|코드 푸시| TRIGGER
    TRIGGER --> WORKFLOW
    WORKFLOW --> BUILD
    BUILD --> TEST
    TEST --> TRAIN
    TRAIN --> VALIDATE
    VALIDATE --> DEPLOY

    BUILD -->|이미지 푸시| REGISTRY
    DEPLOY -->|서빙 시작| VLLM_PROD

    style GIT fill:#f5f5f5
    style Argo fill:#4285f4
    style REGISTRY fill:#ff9900
    style VLLM_PROD fill:#326ce5
```

### Argo Workflow 예제

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
          
          # 최신 모델 로드
          model_uri = "{{workflow.parameters.s3-model-path}}"
          
          # 검증 메트릭 확인
          # (실제로는 테스트 데이터셋으로 평가)
          metrics = {
              "accuracy": 0.95,
              "precision": 0.93,
              "recall": 0.94
          }
          
          # 임계값 검증
          if metrics["accuracy"] >= 0.90:
              print("passed")
          else:
              print("failed")
    
    - name: argocd-deployment
      script:
        image: argoproj/argocd:v2.13
        command: [sh]
        source: |
          # Git 저장소의 매니페스트를 업데이트하여 ArgoCD 자동 배포 트리거
          argocd login $ARGOCD_SERVER --username admin --password $ARGOCD_PASSWORD --insecure

          # vLLM 모델 서빙 매니페스트의 이미지/모델 경로 업데이트
          argocd app set vllm-{{workflow.parameters.model-name}} \
            --parameter model.storageUri={{workflow.parameters.s3-model-path}} \
            --parameter model.image=my-registry/{{workflow.parameters.model-name}}:{{workflow.uid}}

          # ArgoCD Sync 트리거
          argocd app sync vllm-{{workflow.parameters.model-name}} --force --prune

          # 배포 완료 대기
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

## GPU 리소스 스케줄링 (Karpenter)

### Karpenter 아키텍처

```mermaid
flowchart TB
    PENDING[Pending Pods<br/>GPU 필요]
    CONTROLLER[Karpenter<br/>Controller]

    subgraph Provisioning["노드 프로비저닝"]
        PROVISION[인스턴스<br/>선택]
        EC2[EC2 실행<br/>g5/p4/p5]
        SPOT[Spot<br/>70% 절감]
    end

    subgraph Optimization["비용 최적화"]
        CONSOLIDATION[노드<br/>통합]
        TERMINATION[우아한<br/>종료]
    end

    PENDING -->|스케일링 요청| CONTROLLER
    CONTROLLER --> PROVISION
    PROVISION --> EC2
    PROVISION --> SPOT

    CONTROLLER -->|최적화 실행| CONSOLIDATION
    CONSOLIDATION --> TERMINATION

    style PENDING fill:#ea4335
    style CONTROLLER fill:#4285f4
    style Provisioning fill:#76b900
    style Optimization fill:#9c27b0
```

### Karpenter NodePool 설정

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
    # NVIDIA Driver 설치
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

### GPU 워크로드 스케줄링 예제

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

## 엔드투엔드 파이프라인 예제

### 전체 워크플로우

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
    # 1. 데이터 검증
    data_validation = data_quality_check(
        data_source=data_source
    )
    
    # 2. 데이터 준비
    data_prep = data_preparation(
        s3_input_path=data_source,
        train_split=0.8
    ).after(data_validation)
    
    # 3. 피처 엔지니어링
    feature_eng = feature_engineering(
        input_dataset=data_prep.outputs["output_dataset"],
        feature_columns=["amount", "merchant_id", "user_age", "transaction_hour"]
    )
    
    # 4. 모델 학습 (GPU)
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
    
    # 5. 모델 평가
    evaluation = model_evaluation(
        input_features=feature_eng.outputs["output_features"],
        input_model=training.outputs["output_model"],
        mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000"
    )
    
    # 6. 모델 등록 (조건부)
    with dsl.Condition(evaluation.outputs["output_metrics"].outputs["accuracy"] >= deploy_threshold):
        registration = register_model(
            model_uri=training.outputs["output_model"].uri,
            model_name=model_name,
            mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000"
        )
        
        # 7. ArgoCD GitOps 배포 (vLLM 서빙)
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

## 모니터링 및 알림

### MLflow 메트릭 모니터링

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

## 요약

EKS 기반 MLOps 파이프라인은 Kubeflow, MLflow, vLLM, ArgoCD를 통합하여 완전 자동화된 ML 라이프사이클을 제공합니다.

### 핵심 포인트

1. **Kubeflow Pipelines**: 재사용 가능한 컴포넌트 기반 ML 워크플로우
2. **MLflow**: 실험 추적 및 모델 레지스트리로 거버넌스 강화
3. **vLLM**: 고성능 LLM 서빙 (PagedAttention, Prefix Caching)
4. **ArgoCD GitOps**: 선언적 배포, 자동 동기화, 원클릭 롤백
5. **Karpenter**: GPU 리소스 동적 프로비저닝으로 비용 최적화
6. **Argo Workflows**: CI/CD 자동화로 배포 주기 단축

### 다음 단계

- [SageMaker-EKS 통합](./sagemaker-eks-integration.md) - 하이브리드 ML 아키텍처
- [GPU 리소스 관리](../model-serving/gpu-resource-management.md) - GPU 클러스터 최적화
- [모델 모니터링](../operations-mlops/agent-monitoring.md) - 프로덕션 모델 관찰성

---

## 참고 자료

- [Kubeflow 공식 문서](https://www.kubeflow.org/docs/)
- [MLflow 공식 문서](https://mlflow.org/docs/latest/index.html)
- [vLLM 공식 문서](https://docs.vllm.ai/)
- [ArgoCD 공식 문서](https://argo-cd.readthedocs.io/)
- [Karpenter 공식 문서](https://karpenter.sh/)
- [Argo Workflows 공식 문서](https://argoproj.github.io/workflows/)
