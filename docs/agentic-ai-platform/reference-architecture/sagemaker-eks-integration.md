---
title: "SageMaker-EKS 하이브리드 ML 아키텍처"
sidebar_label: "SageMaker-EKS 통합"
description: "SageMaker에서 학습하고 EKS에서 서빙하는 하이브리드 ML 아키텍처"
sidebar_position: 4
category: "genai-aiml"
tags: [sagemaker, eks, hybrid, mlops, model-registry, training, inference, 'scope:impl']
last_update:
  date: 2026-04-17
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { HybridComparison, CostOptimization } from '@site/src/components/SagemakerTables';

# SageMaker-EKS 하이브리드 ML 아키텍처

> 📅 **작성일**: 2026-02-13 | **수정일**: 2026-04-06 | ⏱️ **읽는 시간**: 약 15분

## 개요

SageMaker의 관리형 학습 환경과 EKS의 유연한 서빙 인프라를 결합한 하이브리드 아키텍처입니다. 각 플랫폼의 강점을 활용하여 비용 효율성과 운영 유연성을 동시에 달성합니다.

<HybridComparison />


## 하이브리드 아키텍처 패턴

### 전체 아키텍처 개요

```mermaid
flowchart LR
    subgraph SageMaker["SageMaker 학습"]
        SM_NB[Notebooks<br/>개발]
        SM_TRAIN[Training Jobs<br/>관리형 학습]
        SM_PIPE[Pipelines<br/>오케스트레이션]
        SM_REG[Model Registry<br/>중앙 거버넌스]
    end

    subgraph Storage["공유 스토리지"]
        S3[S3<br/>모델 아티팩트]
        ECR[ECR<br/>컨테이너]
    end

    subgraph EKS["EKS 서빙"]
        VLLM[vLLM<br/>모델 서빙]
        TRITON[Triton<br/>GPU 최적화]
        GATEWAY[Gateway<br/>트래픽 관리]
        MONITOR[Monitoring<br/>관찰성]
    end

    SM_NB --> SM_TRAIN
    SM_TRAIN --> SM_PIPE
    SM_PIPE --> SM_REG
    SM_REG -->|모델 저장| S3

    S3 -->|모델 로드| VLLM
    ECR -->|이미지 로드| VLLM
    VLLM --> TRITON
    TRITON --> GATEWAY
    GATEWAY --> MONITOR

    SM_PIPE -.->|배포 트리거| VLLM

    style SageMaker fill:#ff9900
    style Storage fill:#569a31
    style EKS fill:#326ce5
```

### 패턴 1: SageMaker 학습 → EKS 서빙

**사용 사례:** 대규모 분산 학습, 학습 인프라 관리 부담 감소, 서빙 환경 세밀한 제어

### 패턴 2: EKS 학습 → SageMaker 서빙

**사용 사례:** 커스텀 학습 프레임워크, Kubernetes 네이티브 학습 도구 (Kubeflow, Ray)

### 패턴 3: 하이브리드 서빙

**사용 사례:** 고가용성 프로덕션, 멀티 리전, A/B 테스팅

---

## SageMaker Pipelines 통합

### SageMaker Components for Kubeflow Pipelines

AWS는 Kubeflow Pipelines에서 SageMaker를 호출할 수 있는 공식 컴포넌트를 제공합니다.

```python
# sagemaker_kubeflow_pipeline.py
import kfp
from kfp import dsl
from kfp.aws import use_aws_secret
import sagemaker
from sagemaker.workflow.pipeline_context import PipelineSession

@dsl.component(
    base_image="public.ecr.aws/sagemaker/sagemaker-distribution:latest",
    packages_to_install=["sagemaker>=2.200.0"]
)
def sagemaker_training_component(
    training_image: str, role_arn: str, instance_type: str,
    instance_count: int, s3_input_data: str, s3_output_path: str,
    hyperparameters: dict
) -> str:
    """SageMaker Training Job 실행"""
    import sagemaker
    from sagemaker.estimator import Estimator
    
    estimator = Estimator(
        image_uri=training_image, role=role_arn,
        instance_count=instance_count, instance_type=instance_type,
        output_path=s3_output_path, sagemaker_session=sagemaker.Session(),
        hyperparameters=hyperparameters
    )
    estimator.fit({"training": s3_input_data}, wait=True)
    return estimator.model_data


@dsl.component(
    base_image="public.ecr.aws/sagemaker/sagemaker-distribution:latest",
    packages_to_install=["sagemaker>=2.200.0"]
)
def register_model_to_registry(
    model_data: str, model_package_group_name: str,
    inference_image: str, role_arn: str
) -> str:
    """Model Registry에 모델 등록"""
    import sagemaker
    from sagemaker.model import Model
    
    model = Model(
        image_uri=inference_image, model_data=model_data,
        role=role_arn, sagemaker_session=sagemaker.Session()
    )
    model_package = model.register(
        content_types=["application/json"],
        response_types=["application/json"],
        inference_instances=["ml.g5.xlarge"],
        transform_instances=["ml.g5.xlarge"],
        model_package_group_name=model_package_group_name,
        approval_status="PendingManualApproval"
    )
    return model_package.model_package_arn


@dsl.component(
    base_image="python:3.10",
    packages_to_install=["kubernetes", "boto3", "pyyaml"]
)
def deploy_to_vllm(
    model_package_arn: str, model_name: str, namespace: str = "vllm-inference"
) -> str:
    """vLLM Deployment 배포"""
    import boto3, yaml, tempfile, subprocess

    sm_client = boto3.client('sagemaker')
    model_package = sm_client.describe_model_package(ModelPackageName=model_package_arn)
    model_data_url = model_package['InferenceSpecification']['Containers'][0]['ModelDataUrl']

    deployment_manifest = {
        "apiVersion": "apps/v1", "kind": "Deployment",
        "metadata": {
            "name": f"vllm-{model_name}", "namespace": namespace,
            "labels": {"app": f"vllm-{model_name}", "model": model_name}
        },
        "spec": {
            "replicas": 2,
            "selector": {"matchLabels": {"app": f"vllm-{model_name}"}},
            "template": {
                "metadata": {"labels": {"app": f"vllm-{model_name}"}},
                "spec": {
                    "containers": [{
                        "name": "vllm-server",
                        "image": "vllm/vllm-openai:latest",
                        "args": ["--model", model_data_url, "--tensor-parallel-size", "1", "--max-model-len", "4096"],
                        "ports": [{"containerPort": 8000, "name": "http"}],
                        "resources": {
                            "requests": {"nvidia.com/gpu": "1", "memory": "16Gi"},
                            "limits": {"nvidia.com/gpu": "1", "memory": "32Gi"}
                        },
                        "env": [{"name": "VLLM_LOGGING_LEVEL", "value": "INFO"}]
                    }]
                }
            }
        }
    }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        yaml.dump(deployment_manifest, f)
        manifest_path = f.name

    subprocess.run(["kubectl", "apply", "-f", manifest_path, "-n", namespace], check=True)
    return f"Deployed {model_name} to vLLM"


@dsl.pipeline(name="SageMaker to EKS Hybrid Pipeline", description="Train on SageMaker, deploy to EKS")
def hybrid_ml_pipeline(
    training_image: str = "763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-training:2.1.0-gpu-py310",
    inference_image: str = "763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-inference:2.1.0-gpu-py310",
    role_arn: str = "arn:aws:iam::123456789012:role/SageMakerExecutionRole",
    instance_type: str = "ml.g5.2xlarge",
    s3_input_data: str = "s3://my-bucket/training-data/",
    s3_output_path: str = "s3://my-bucket/models/",
    model_package_group: str = "fraud-detection-models"
):
    training_task = sagemaker_training_component(
        training_image=training_image, role_arn=role_arn,
        instance_type=instance_type, instance_count=2,
        s3_input_data=s3_input_data, s3_output_path=s3_output_path,
        hyperparameters={"epochs": "50", "batch-size": "64", "learning-rate": "0.001"}
    )
    training_task.apply(use_aws_secret('aws-secret', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'))
    
    registry_task = register_model_to_registry(
        model_data=training_task.output, model_package_group_name=model_package_group,
        inference_image=inference_image, role_arn=role_arn
    )
    registry_task.apply(use_aws_secret('aws-secret', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'))
    
    deploy_task = deploy_to_vllm(
        model_package_arn=registry_task.output,
        model_name="fraud-detection-v1", namespace="vllm-inference"
    )
    return deploy_task.output
```


---

## SageMaker Model Registry 거버넌스

### 중앙 집중식 모델 관리

SageMaker Model Registry는 모든 모델의 중앙 저장소로, EKS 서빙 환경에서도 동일한 거버넌스를 적용합니다.

```mermaid
flowchart LR
    subgraph Lifecycle["모델 라이프사이클"]
        DEV[개발<br/>실험 모델]
        STAGING[스테이징<br/>검증 중]
        PROD[프로덕션<br/>승인됨]
        ARCHIVED[아카이브<br/>폐기됨]
    end

    subgraph Approval["승인 프로세스"]
        AUTO[자동 승인<br/>메트릭 기반]
        MANUAL[수동 승인<br/>리뷰 필요]
    end

    subgraph Deploy["배포 타겟"]
        SM_EP[SageMaker<br/>Endpoint]
        EKS_VLLM[EKS<br/>vLLM]
        BATCH[Batch<br/>Transform]
    end

    DEV --> STAGING
    STAGING --> AUTO
    STAGING --> MANUAL
    AUTO --> PROD
    MANUAL --> PROD
    PROD --> ARCHIVED

    PROD -->|배포| SM_EP
    PROD -->|배포| EKS_VLLM
    PROD -->|배포| BATCH

    style DEV fill:#f5f5f5
    style STAGING fill:#fbbc04
    style PROD fill:#34a853
    style ARCHIVED fill:#ea4335
    style Approval fill:#4285f4
    style Deploy fill:#326ce5
```

### Model Registry 설정

```python
# model_registry_setup.py
import boto3

sm_client = boto3.client('sagemaker')

try:
    sm_client.create_model_package_group(
        ModelPackageGroupName="fraud-detection-models",
        ModelPackageGroupDescription="Fraud detection models for production",
        Tags=[{"Key": "Team", "Value": "ml-platform"}, {"Key": "Environment", "Value": "production"}]
    )
except sm_client.exceptions.ResourceInUse:
    print("Model package group already exists")

# 모델 승인 정책
model_approval_policy = {
    "Rules": [
        {"Name": "AutoApproveHighAccuracy", "Condition": {"MetricName": "accuracy", "Operator": "GreaterThanOrEqualTo", "Value": 0.95}, "Action": "Approve"},
        {"Name": "RejectLowAccuracy", "Condition": {"MetricName": "accuracy", "Operator": "LessThan", "Value": 0.85}, "Action": "Reject"}
    ]
}
```

### EKS에서 Model Registry 조회

```python
# eks_model_loader.py
import boto3
from kubernetes import client, config

def get_approved_model_from_registry(model_package_group_name: str) -> str:
    """승인된 최신 모델 조회"""
    sm_client = boto3.client('sagemaker')
    response = sm_client.list_model_packages(
        ModelPackageGroupName=model_package_group_name,
        ModelApprovalStatus='Approved', SortBy='CreationTime',
        SortOrder='Descending', MaxResults=1
    )
    if not response['ModelPackageSummaryList']:
        raise ValueError(f"No approved models in {model_package_group_name}")
    
    model_package_arn = response['ModelPackageSummaryList'][0]['ModelPackageArn']
    model_package = sm_client.describe_model_package(ModelPackageName=model_package_arn)
    return model_package['InferenceSpecification']['Containers'][0]['ModelDataUrl']

def update_vllm_with_latest_model(model_name: str, namespace: str):
    """vLLM Deployment 업데이트"""
    config.load_incluster_config()
    model_url = get_approved_model_from_registry("fraud-detection-models")
    
    patch_body = {
        "spec": {"template": {"spec": {"containers": [{
            "name": "vllm-server",
            "args": ["--model", model_url, "--tensor-parallel-size", "1", "--max-model-len", "4096"]
        }]}}}
    }
    client.AppsV1Api().patch_namespaced_deployment(
        name=f"vllm-{model_name}", namespace=namespace, body=patch_body
    )
    print(f"Updated {model_name} with {model_url}")
```


---

## 비용 최적화 전략

### 학습 vs 서빙 비용 분석

<CostOptimization />

### 비용 최적화 체크리스트

```yaml
# cost-optimization-config.yaml
training:
  # SageMaker Managed Spot Training (최대 90% 절감)
  use_spot_instances: true
  max_wait_time_seconds: 86400  # 24시간
  max_run_time_seconds: 43200   # 12시간
  
  # 체크포인트 활성화 (Spot 중단 대비)
  checkpoint_s3_uri: s3://my-bucket/checkpoints/
  checkpoint_local_path: /opt/ml/checkpoints
  
  # 인스턴스 타입 최적화
  instance_type: ml.g5.2xlarge  # GPU 학습
  instance_count: 2
  
  # 학습 완료 후 자동 종료
  auto_terminate: true

serving:
  # Karpenter Spot 인스턴스 (최대 70% 절감)
  capacity_type: spot
  
  # 오토스케일링 설정
  min_replicas: 1
  max_replicas: 10
  target_utilization: 70
  
  # 유휴 시간 스케일 다운
  scale_down_delay: 300  # 5분
  
  # GPU 공유 (MIG 또는 MPS)
  enable_gpu_sharing: true
  max_shared_clients: 4

storage:
  # S3 Intelligent-Tiering
  s3_storage_class: INTELLIGENT_TIERING
  
  # 오래된 모델 아카이브
  lifecycle_policy:
    archive_after_days: 90
    delete_after_days: 365
```

### 비용 모니터링 대시보드

```python
# cost_monitoring.py
import boto3
from datetime import datetime, timedelta

def get_sagemaker_training_costs(days=30):
    """SageMaker 학습 비용 조회"""
    ce_client = boto3.client('ce')
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    return ce_client.get_cost_and_usage(
        TimePeriod={'Start': start_date.strftime('%Y-%m-%d'), 'End': end_date.strftime('%Y-%m-%d')},
        Granularity='DAILY', Metrics=['UnblendedCost'],
        Filter={'Dimensions': {'Key': 'SERVICE', 'Values': ['Amazon SageMaker']}},
        GroupBy=[{'Type': 'DIMENSION', 'Key': 'USAGE_TYPE'}]
    )

def get_eks_serving_costs(cluster_name: str, days=30):
    """EKS 서빙 비용 조회"""
    ce_client = boto3.client('ce')
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    return ce_client.get_cost_and_usage(
        TimePeriod={'Start': start_date.strftime('%Y-%m-%d'), 'End': end_date.strftime('%Y-%m-%d')},
        Granularity='DAILY', Metrics=['UnblendedCost'],
        Filter={'And': [
            {'Dimensions': {'Key': 'SERVICE', 'Values': ['Amazon Elastic Compute Cloud - Compute']}},
            {'Tags': {'Key': 'kubernetes.io/cluster/' + cluster_name, 'Values': ['owned']}}
        ]}
    )
```


---

## 멀티 리전 배포 패턴

### 글로벌 모델 배포 아키텍처

```mermaid
flowchart TB
    subgraph Primary["Primary (us-west-2)"]
        SM_TRAIN[SageMaker<br/>Training]
        SM_REG[Model<br/>Registry]
        S3_PRIMARY[S3<br/>Primary]
    end

    subgraph APNE2["Seoul (ap-northeast-2)"]
        S3_REPLICA[S3<br/>Replica]
        EKS_AP[EKS<br/>Seoul]
        VLLM_AP[vLLM<br/>APNE2]
    end

    subgraph EUW1["Ireland (eu-west-1)"]
        S3_EU[S3<br/>Replica]
        EKS_EU[EKS<br/>Ireland]
        VLLM_EU[vLLM<br/>EUW1]
    end

    subgraph Global["글로벌 트래픽"]
        CLOUDFRONT[CloudFront<br/>Edge Cache]
        R53[Route 53<br/>Geo Routing]
    end

    SM_TRAIN --> SM_REG
    SM_REG --> S3_PRIMARY

    S3_PRIMARY -->|복제| S3_REPLICA
    S3_PRIMARY -->|복제| S3_EU

    S3_REPLICA --> EKS_AP
    EKS_AP --> VLLM_AP

    S3_EU --> EKS_EU
    EKS_EU --> VLLM_EU

    CLOUDFRONT --> R53
    R53 -->|라우팅| VLLM_AP
    R53 -->|라우팅| VLLM_EU

    style Primary fill:#ff9900
    style APNE2 fill:#326ce5
    style EUW1 fill:#326ce5
    style Global fill:#9c27b0
```

### S3 Cross-Region Replication 설정

```json
{
  "Role": "arn:aws:iam::123456789012:role/S3ReplicationRole",
  "Rules": [
    {
      "ID": "ReplicateModelsToAPNE2", "Status": "Enabled", "Priority": 1,
      "Filter": {"Prefix": "models/"},
      "Destination": {
        "Bucket": "arn:aws:s3:::my-models-ap-northeast-2",
        "ReplicationTime": {"Status": "Enabled", "Time": {"Minutes": 15}},
        "Metrics": {"Status": "Enabled", "EventThreshold": {"Minutes": 15}}
      }
    },
    {
      "ID": "ReplicateModelsToEUW1", "Status": "Enabled", "Priority": 2,
      "Filter": {"Prefix": "models/"},
      "Destination": {
        "Bucket": "arn:aws:s3:::my-models-eu-west-1",
        "ReplicationTime": {"Status": "Enabled", "Time": {"Minutes": 15}}
      }
    }
  ]
}
```

### 멀티 리전 배포 자동화

```python
# multi_region_deployment.py
import boto3
from typing import List, Dict
from kubernetes import client, config

class MultiRegionDeployer:
    def __init__(self, regions: List[str]):
        self.regions = regions
        self.sm_clients = {region: boto3.client('sagemaker', region_name=region) for region in regions}
    
    def deploy_model_to_all_regions(self, model_package_arn: str, model_name: str, namespace: str = "vllm-inference"):
        """모든 리전에 모델 배포"""
        deployment_results = {}
        for region in self.regions:
            try:
                model_url = self._get_regional_model_url(model_package_arn, region)
                result = self._deploy_to_eks(region, model_url, model_name, namespace)
                deployment_results[region] = {"status": "success", "model_url": model_url, "endpoint": result}
            except Exception as e:
                deployment_results[region] = {"status": "failed", "error": str(e)}
        return deployment_results
    
    def _get_regional_model_url(self, model_package_arn: str, region: str) -> str:
        """리전별 모델 URL 조회"""
        model_package = self.sm_clients[region].describe_model_package(ModelPackageName=model_package_arn)
        original_url = model_package['InferenceSpecification']['Containers'][0]['ModelDataUrl']
        return original_url.replace('us-west-2', region)
    
    def _deploy_to_eks(self, region: str, model_url: str, model_name: str, namespace: str) -> str:
        """리전별 EKS 클러스터에 배포"""
        config.load_kube_config(context=f"eks-{region}")
        
        vllm_deployment = {
            "apiVersion": "apps/v1", "kind": "Deployment",
            "metadata": {"name": f"vllm-{model_name}-{region}", "namespace": namespace,
                        "labels": {"app": f"vllm-{model_name}", "region": region}},
            "spec": {
                "replicas": 2,
                "selector": {"matchLabels": {"app": f"vllm-{model_name}", "region": region}},
                "template": {
                    "metadata": {"labels": {"app": f"vllm-{model_name}", "region": region}},
                    "spec": {"containers": [{
                        "name": "vllm-server", "image": "vllm/vllm-openai:latest",
                        "args": ["--model", model_url, "--tensor-parallel-size", "1", "--max-model-len", "4096"],
                        "ports": [{"containerPort": 8000, "name": "http"}],
                        "resources": {"requests": {"nvidia.com/gpu": "1"}, "limits": {"nvidia.com/gpu": "1"}}
                    }]}
                }
            }
        }
        client.AppsV1Api().create_namespaced_deployment(namespace=namespace, body=vllm_deployment)
        return f"http://vllm-{model_name}-{region}.{namespace}.svc.cluster.local:8000"

# 사용 예시
deployer = MultiRegionDeployer(regions=["us-west-2", "ap-northeast-2", "eu-west-1"])
results = deployer.deploy_model_to_all_regions(
    model_package_arn="arn:aws:sagemaker:us-west-2:123456789012:model-package/fraud-detection/1",
    model_name="fraud-detection-v1"
)
print(results)
```


---

## 모델 모니터링 및 드리프트 탐지

### 통합 모니터링 아키텍처

```mermaid
flowchart LR
    subgraph Collection["데이터 수집"]
        VLLM[vLLM<br/>Predictor]
        OTEL[OTEL<br/>Sidecar]
    end

    subgraph Storage["저장 & 분석"]
        S3_LOGS[S3<br/>추론 로그]
        LANGFUSE[Langfuse<br/>관찰성]
        ATHENA[Athena<br/>SQL 분석]
    end

    subgraph Monitor["모델 모니터"]
        DATA_QUALITY[Data<br/>Quality]
        MODEL_QUALITY[Model<br/>Quality]
        BIAS[Bias<br/>Monitor]
        EXPLAINABILITY[Explain<br/>Monitor]
    end

    subgraph Alert["알림"]
        CW_ALARMS[CloudWatch<br/>Alarms]
        SNS[SNS<br/>Topics]
        LAMBDA[Lambda<br/>Auto-fix]
    end

    VLLM -->|요청/응답| OTEL
    OTEL --> LANGFUSE
    OTEL --> S3_LOGS

    S3_LOGS -->|입력 분석| DATA_QUALITY
    S3_LOGS -->|예측 분석| MODEL_QUALITY
    S3_LOGS -->|편향 분석| BIAS
    S3_LOGS -->|해석성 분석| EXPLAINABILITY

    S3_LOGS -->|쿼리| ATHENA

    DATA_QUALITY -->|위반| CW_ALARMS
    MODEL_QUALITY -->|위반| CW_ALARMS
    CW_ALARMS --> SNS
    SNS --> LAMBDA

    style Collection fill:#326ce5
    style Storage fill:#569a31
    style Monitor fill:#ff9900
    style Alert fill:#ea4335
```

### vLLM OTEL Sidecar 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-fraud-detection-monitored
  namespace: vllm-inference
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vllm-fraud-detection
  template:
    metadata:
      labels:
        app: vllm-fraud-detection
    spec:
      serviceAccountName: vllm-sa
      containers:
        - name: vllm-server
          image: vllm/vllm-openai:latest
          args: [--model, s3://my-models/fraud-detection/model.tar.gz, --tensor-parallel-size, "1", --max-model-len, "4096"]
          ports:
            - containerPort: 8000
              name: http
          resources:
            requests: {nvidia.com/gpu: 1, memory: 16Gi}
            limits: {nvidia.com/gpu: 1, memory: 32Gi}
          env:
            - name: VLLM_LOGGING_LEVEL
              value: "INFO"
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:latest
          args: [--config=/conf/otel-collector-config.yaml]
          ports:
            - containerPort: 4317
            - containerPort: 4318
          volumeMounts:
            - name: otel-config
              mountPath: /conf
          env:
            - name: LANGFUSE_PUBLIC_KEY
              valueFrom: {secretKeyRef: {name: langfuse-credentials, key: public-key}}
            - name: LANGFUSE_SECRET_KEY
              valueFrom: {secretKeyRef: {name: langfuse-credentials, key: secret-key}}
            - name: LANGFUSE_HOST
              value: "https://langfuse.example.com"
          resources:
            requests: {cpu: "200m", memory: "512Mi"}
            limits: {cpu: "500m", memory: "1Gi"}
      volumes:
        - name: otel-config
          configMap:
            name: otel-collector-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: vllm-inference
data:
  otel-collector-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc: {endpoint: 0.0.0.0:4317}
          http: {endpoint: 0.0.0.0:4318}
    processors:
      batch: {timeout: 10s, send_batch_size: 1024}
      resource:
        attributes:
          - {key: service.name, value: vllm-fraud-detection, action: upsert}
    exporters:
      otlphttp/langfuse:
        endpoint: ${LANGFUSE_HOST}/api/public/ingestion
        headers: {Authorization: Bearer ${LANGFUSE_SECRET_KEY}}
      awss3:
        s3uploader: {region: us-west-2, s3_bucket: my-inference-logs, s3_prefix: fraud-detection/, s3_partition: hour}
      awscloudwatchlogs:
        log_group_name: /aws/vllm/fraud-detection
        log_stream_name: inference-logs
        region: us-west-2
    service:
      pipelines:
        traces: {receivers: [otlp], processors: [batch, resource], exporters: [otlphttp/langfuse]}
        logs: {receivers: [otlp], processors: [batch, resource], exporters: [awss3, awscloudwatchlogs]}
```

### SageMaker Model Monitor 통합

```python
# sagemaker_model_monitor.py
from sagemaker.model_monitor import DataQualityMonitor
from sagemaker import Session

data_quality_monitor = DataQualityMonitor(
    role='arn:aws:iam::123456789012:role/SageMakerModelMonitorRole',
    instance_count=1, instance_type='ml.m5.xlarge',
    volume_size_in_gb=20, max_runtime_in_seconds=3600,
    sagemaker_session=Session()
)

baseline_job = data_quality_monitor.suggest_baseline(
    baseline_dataset='s3://my-bucket/training-data/baseline.csv',
    dataset_format={'csv': {'header': True}},
    output_s3_uri='s3://my-bucket/model-monitor/baseline', wait=True
)

monitoring_schedule = data_quality_monitor.create_monitoring_schedule(
    monitor_schedule_name='fraud-detection-data-quality',
    endpoint_input='s3://my-inference-logs/fraud-detection/',
    output_s3_uri='s3://my-bucket/model-monitor/reports',
    statistics=baseline_job.baseline_statistics(),
    constraints=baseline_job.suggested_constraints(),
    schedule_cron_expression='cron(0 * * * ? *)',
    enable_cloudwatch_metrics=True
)
print(f"Monitoring schedule: {monitoring_schedule.monitoring_schedule_name}")
```

### 드리프트 탐지 및 자동 재학습

```python
# drift_detection_handler.py
import boto3, json
from datetime import datetime

def lambda_handler(event, context):
    """CloudWatch Alarm 트리거 시 자동 재학습"""
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']
    
    if 'DataQualityViolation' in alarm_name:
        print(f"Data quality violation: {alarm_name}")
        sm_client = boto3.client('sagemaker')
        training_job_name = f"fraud-detection-retrain-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        sm_client.create_training_job(
            TrainingJobName=training_job_name,
            RoleArn='arn:aws:iam::123456789012:role/SageMakerExecutionRole',
            AlgorithmSpecification={
                'TrainingImage': '763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-training:2.1.0-gpu-py310',
                'TrainingInputMode': 'File'
            },
            InputDataConfig=[{
                'ChannelName': 'training',
                'DataSource': {'S3DataSource': {
                    'S3DataType': 'S3Prefix',
                    'S3Uri': 's3://my-bucket/training-data/',
                    'S3DataDistributionType': 'FullyReplicated'
                }}
            }],
            OutputDataConfig={'S3OutputPath': 's3://my-bucket/models/'},
            ResourceConfig={'InstanceType': 'ml.g5.2xlarge', 'InstanceCount': 2, 'VolumeSizeInGB': 50},
            StoppingCondition={'MaxRuntimeInSeconds': 43200},
            Tags=[{'Key': 'Trigger', 'Value': 'AutoRetraining'}, {'Key': 'Reason', 'Value': 'DataDrift'}]
        )
        print(f"Retraining job: {training_job_name}")
        return {'statusCode': 200, 'body': json.dumps({'message': 'Retraining triggered', 'training_job': training_job_name})}
    
    return {'statusCode': 200, 'body': json.dumps({'message': 'No action required'})}
```


---

## 요약

SageMaker-EKS 하이브리드 아키텍처는 관리형 학습과 유연한 서빙의 장점을 결합합니다.

### 핵심 포인트

1. **하이브리드 패턴**: SageMaker 학습 + EKS 서빙
2. **중앙 거버넌스**: Model Registry 통합 관리
3. **비용 최적화**: Spot 인스턴스 + 오토스케일링
4. **멀티 리전**: S3 Cross-Region Replication
5. **모니터링**: Model Monitor + EKS 로깅 통합

### 권장 사항

- 대규모 분산 학습은 SageMaker, 서빙은 EKS에서 운영
- Model Registry 중앙 거버넌스 강화
- 드리프트 탐지 시 자동 재학습 파이프라인 구축

### 다음 단계

- [EKS 기반 MLOps 파이프라인](./mlops-pipeline-eks.md)
- [GPU 리소스 관리](../model-serving/gpu-infrastructure/gpu-resource-management.md)
- [모델 모니터링](../operations-mlops/agent-monitoring.md)

---

## 참고 자료

- [SageMaker Components for Kubeflow Pipelines](https://docs.aws.amazon.com/sagemaker/latest/dg/kubernetes-sagemaker-components-for-kubeflow-pipelines.html)
- [SageMaker Model Registry](https://docs.aws.amazon.com/sagemaker/latest/dg/model-registry.html)
- [SageMaker Model Monitor](https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html)
- [vLLM Documentation](https://docs.vllm.ai/)
- [vLLM Deployment Guide](https://docs.vllm.ai/en/latest/serving/deploying_with_docker.html)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/)
- [Langfuse Self-Hosting](https://langfuse.com/docs/deployment/self-host)
- [AWS Multi-Region Architecture](https://aws.amazon.com/solutions/implementations/multi-region-application-architecture/)

