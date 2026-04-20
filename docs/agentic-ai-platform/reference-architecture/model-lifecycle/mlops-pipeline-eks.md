---
title: "EKS 기반 MLOps 파이프라인 구축"
sidebar_label: "MLOps 파이프라인"
description: "Kubeflow + MLflow + vLLM + ArgoCD GitOps 기반 엔드투엔드 ML 라이프사이클 관리"
created: 2026-02-11
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
sidebar_position: 3
category: "genai-aiml"
tags: [mlops, kubeflow, mlflow, vllm, argocd, gitops, argo-workflows, eks, ml-pipeline, 'scope:impl']
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { PipelineComponents, GitOpsDeployment } from '@site/src/components/MlOpsTables';

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

> 배포 가이드는 [Kubeflow on AWS 공식 문서](https://awslabs.github.io/kubeflow-manifests/)를 참조하세요.

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
    df = df.dropna().drop_duplicates()
    
    # Train/Test 분할
    train_df, test_df = train_test_split(df, train_size=train_split, random_state=42)
    
    # 출력 저장
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
    """모델 학습 컴포넌트 (PyTorch)"""
    import pandas as pd
    import torch
    import torch.nn as nn
    import mlflow
    import mlflow.pytorch
    
    mlflow.set_tracking_uri(mlflow_tracking_uri)
    mlflow.set_experiment(experiment_name)
    
    # 데이터 로드
    X_train = pd.read_csv(f"{input_features.path}/X_train.csv").values
    y_train = pd.read_csv(f"{input_features.path}/y_train.csv").values.ravel()
    
    # 모델 정의 (간단한 예시)
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
    
    # MLflow 실험 시작
    with mlflow.start_run():
        mlflow.log_params({"learning_rate": learning_rate, "epochs": epochs})
        
        # 학습 루프
        for epoch in range(epochs):
            optimizer.zero_grad()
            outputs = model(torch.FloatTensor(X_train))
            loss = criterion(outputs.squeeze(), torch.FloatTensor(y_train))
            loss.backward()
            optimizer.step()
            mlflow.log_metric("train_loss", loss.item(), step=epoch)
        
        # 모델 저장
        torch.save(model.state_dict(), f"{output_model.path}/model.pth")
        mlflow.pytorch.log_model(model, "model")
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
    experiment_name: str = "eks-ml-experiment"
):
    # 1. 데이터 준비
    data_prep_task = data_preparation(s3_input_path=s3_input_path)
    
    # 2. 모델 학습 (GPU 노드에서 실행)
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
    end

    NOTEBOOK & PIPELINE & CICD -->|실험 로깅| API
    API --> BACKEND
    API --> S3
    API --> REGISTRY
    UI -->|조회| API

    style Clients fill:#ffd93d
    style MLflow fill:#ff9900
```

### MLflow 배포 YAML

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

> 배포 가이드는 [ArgoCD 공식 문서](https://argo-cd.readthedocs.io/en/stable/getting_started/)를 참조하세요.

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

### vLLM 모델 서빙 Deployment 예제

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

## Argo Workflows CI/CD 통합

### Argo Workflows 아키텍처

```mermaid
flowchart LR
    GIT[Git Repository<br/>모델 코드]
    TRIGGER[Webhook<br/>Trigger]

    subgraph Argo["Argo Workflows"]
        WORKFLOW[Workflow<br/>Controller]
        BUILD[빌드<br/>컨테이너]
        TRAIN[모델<br/>학습]
        VALIDATE[모델<br/>검증]
        DEPLOY[ArgoCD<br/>GitOps 배포]
    end

    VLLM_PROD[vLLM<br/>Production]

    GIT -->|코드 푸시| TRIGGER
    TRIGGER --> WORKFLOW
    WORKFLOW --> BUILD --> TRAIN --> VALIDATE --> DEPLOY
    DEPLOY -->|서빙 시작| VLLM_PROD

    style Argo fill:#4285f4
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
          # 검증 로직 (간소화)
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

## GPU 리소스 스케줄링 (Karpenter)

Karpenter는 GPU 워크로드를 위한 동적 노드 프로비저닝을 제공합니다. Pending Pod를 감지하면 적합한 GPU 인스턴스를 자동으로 선택하고 프로비저닝합니다.

:::info Karpenter 상세 설정
NodePool 구성, Spot 전략, Consolidation 정책, GPU 인스턴스 비교는 [GPU 리소스 관리](../model-serving/gpu-infrastructure/gpu-resource-management.md)를 참조하세요.
:::

---

## 엔드투엔드 파이프라인 예제

### 전체 워크플로우

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
    # 1. 데이터 준비
    data_prep = data_preparation(s3_input_path=data_source)
    
    # 2. 모델 학습 (GPU)
    training = model_training(
        input_features=data_prep.outputs["output_dataset"],
        mlflow_tracking_uri="http://mlflow-server.mlflow.svc.cluster.local:5000",
        experiment_name=experiment_name
    )
    training.set_gpu_limit(1)
    training.add_node_selector_constraint("karpenter.sh/capacity-type", "spot")
    
    # 3. ArgoCD GitOps 배포
    deployment = deploy_via_argocd(
        model_name=model_name,
        model_uri=training.outputs["output_model"].uri
    )
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
- [GPU 리소스 관리](../model-serving/gpu-infrastructure/gpu-resource-management.md) - GPU 클러스터 최적화
- [모델 모니터링](../operations-mlops/observability/agent-monitoring.md) - 프로덕션 모델 관찰성

---

## 참고 자료

- [Kubeflow 공식 문서](https://www.kubeflow.org/docs/)
- [MLflow 공식 문서](https://mlflow.org/docs/latest/index.html)
- [vLLM 공식 문서](https://docs.vllm.ai/)
- [ArgoCD 공식 문서](https://argo-cd.readthedocs.io/)
- [Karpenter 공식 문서](https://karpenter.sh/)
- [Argo Workflows 공식 문서](https://argoproj.github.io/workflows/)
