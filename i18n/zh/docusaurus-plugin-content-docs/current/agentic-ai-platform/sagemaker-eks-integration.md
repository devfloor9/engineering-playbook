---
title: "SageMaker-EKS 混合 ML 架构"
sidebar_label: "16. SageMaker-EKS Integration"
description: "混合 ML 架构：在 SageMaker 上训练，在 EKS 上服务"
sidebar_position: 16
category: "aiops-aidlc"
tags: [sagemaker, eks, hybrid, mlops, model-registry, training, inference]
last_update:
  date: 2026-02-14
  author: devfloor9
---

import SpecificationTable from '@site/src/components/tables/SpecificationTable';
import { HybridComparison, CostOptimization } from '@site/src/components/SagemakerTables';

# SageMaker-EKS 混合 ML 架构

> 📅 **撰写日期**: 2025-02-05 | **修改日期**: 2026-02-14 | ⏱️ **阅读时间**: 约 18 分钟

## 概述

设计一种混合 ML 架构，将 SageMaker 的托管训练环境与 EKS 灵活的服务基础设施相结合。这种方法利用各平台的优势，同时实现成本效率和运营灵活性。

### 混合架构的优势

<HybridComparison />


## 混合架构模式

### 整体架构概览

```mermaid
flowchart TB
    subgraph "SageMaker Training"
        SM_NB[SageMaker Notebooks<br/>Development]
        SM_TRAIN[SageMaker Training Jobs<br/>Managed Training]
        SM_PIPE[SageMaker Pipelines<br/>Orchestration]
        SM_REG[SageMaker Model Registry<br/>Central Governance]
    end

    subgraph "EKS Serving"
        KSERVE[KServe<br/>Model Serving]
        TRITON[Triton Inference Server<br/>GPU Optimization]
        GATEWAY[Inference Gateway<br/>Traffic Management]
        MONITOR[Prometheus + Grafana<br/>Monitoring]
    end

    subgraph "Shared Storage"
        S3[S3 Model Artifacts<br/>Versioned Storage]
        ECR[ECR Container Registry<br/>Custom Images]
    end

    SM_NB --> SM_TRAIN
    SM_TRAIN --> SM_PIPE
    SM_PIPE --> SM_REG
    SM_REG --> S3

    S3 --> KSERVE
    ECR --> KSERVE
    KSERVE --> TRITON
    TRITON --> GATEWAY
    GATEWAY --> MONITOR

    SM_PIPE -.->|Trigger Deployment| KSERVE

    style SM_TRAIN fill:#ff9900
    style KSERVE fill:#326ce5
    style S3 fill:#569a31
```

### 模式 1：SageMaker 训练 → EKS 服务

最常见的混合模式，在 SageMaker 上训练模型，在 EKS 上提供服务。

**使用场景：**
- 需要大规模分布式训练的情况
- 希望减少训练基础设施管理负担的情况
- 服务环境中需要精细控制的情况


### 模式 2：EKS 训练 → SageMaker 服务

需要特殊训练环境，但希望以托管方式运营服务的情况。

**使用场景：**
- 使用自定义训练框架
- 利用 Kubernetes 原生训练工具（Kubeflow、Ray）
- 希望减少服务基础设施管理负担的情况

### 模式 3：混合服务

同时运营 SageMaker Endpoint 和 EKS 服务以分散工作负载。

**使用场景：**
- 高可用性至关重要的生产环境
- 多区域部署
- A/B 测试和金丝雀部署

---

## SageMaker Pipelines 集成

### SageMaker Components for Kubeflow Pipelines

AWS 提供了官方组件，可以在 Kubeflow Pipelines 中调用 SageMaker。

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
    training_image: str,
    role_arn: str,
    instance_type: str,
    instance_count: int,
    s3_input_data: str,
    s3_output_path: str,
    hyperparameters: dict
) -> str:
    """执行 SageMaker Training Job 的组件"""
    import boto3
    import sagemaker
    from sagemaker.estimator import Estimator

    session = sagemaker.Session()

    estimator = Estimator(
        image_uri=training_image,
        role=role_arn,
        instance_count=instance_count,
        instance_type=instance_type,
        output_path=s3_output_path,
        sagemaker_session=session,
        hyperparameters=hyperparameters
    )

    estimator.fit({"training": s3_input_data}, wait=True)

    # 返回模型工件路径
    return estimator.model_data


@dsl.component(
    base_image="public.ecr.aws/sagemaker/sagemaker-distribution:latest",
    packages_to_install=["sagemaker>=2.200.0"]
)
def register_model_to_registry(
    model_data: str,
    model_package_group_name: str,
    inference_image: str,
    role_arn: str
) -> str:
    """将模型注册到 SageMaker Model Registry"""
    import boto3
    import sagemaker
    from sagemaker.model import Model

    session = sagemaker.Session()

    model = Model(
        image_uri=inference_image,
        model_data=model_data,
        role=role_arn,
        sagemaker_session=session
    )

    # 注册到 Model Registry
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
    packages_to_install=["kubernetes", "boto3"]
)
def deploy_to_kserve(
    model_package_arn: str,
    model_name: str,
    namespace: str = "kserve-inference"
) -> str:
    """部署 KServe InferenceService"""
    import boto3
    from kubernetes import client, config

    # 从 SageMaker Model Registry 查询模型信息
    sm_client = boto3.client('sagemaker')
    model_package = sm_client.describe_model_package(
        ModelPackageName=model_package_arn
    )

    model_data_url = model_package['InferenceSpecification']['Containers'][0]['ModelDataUrl']

    # 创建 KServe InferenceService
    config.load_incluster_config()
    custom_api = client.CustomObjectsApi()

    inference_service = {
        "apiVersion": "serving.kserve.io/v1beta1",
        "kind": "InferenceService",
        "metadata": {
            "name": model_name,
            "namespace": namespace
        },
        "spec": {
            "predictor": {
                "pytorch": {
                    "storageUri": model_data_url,
                    "resources": {
                        "requests": {
                            "nvidia.com/gpu": "1",
                            "memory": "8Gi"
                        },
                        "limits": {
                            "nvidia.com/gpu": "1",
                            "memory": "16Gi"
                        }
                    }
                }
            },
            "minReplicas": 2,
            "maxReplicas": 10
        }
    }

    custom_api.create_namespaced_custom_object(
        group="serving.kserve.io",
        version="v1beta1",
        namespace=namespace,
        plural="inferenceservices",
        body=inference_service
    )

    return f"Deployed {model_name} to KServe"


@dsl.pipeline(
    name="SageMaker to EKS Hybrid Pipeline",
    description="Train on SageMaker, deploy to EKS"
)
def hybrid_ml_pipeline(
    training_image: str = "763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-training:2.1.0-gpu-py310",
    inference_image: str = "763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-inference:2.1.0-gpu-py310",
    role_arn: str = "arn:aws:iam::123456789012:role/SageMakerExecutionRole",
    instance_type: str = "ml.g5.2xlarge",
    s3_input_data: str = "s3://my-bucket/training-data/",
    s3_output_path: str = "s3://my-bucket/models/",
    model_package_group: str = "fraud-detection-models"
):
    # 1. 在 SageMaker 上训练
    training_task = sagemaker_training_component(
        training_image=training_image,
        role_arn=role_arn,
        instance_type=instance_type,
        instance_count=2,
        s3_input_data=s3_input_data,
        s3_output_path=s3_output_path,
        hyperparameters={
            "epochs": "50",
            "batch-size": "64",
            "learning-rate": "0.001"
        }
    )
    training_task.apply(use_aws_secret('aws-secret', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'))

    # 2. 注册到 Model Registry
    registry_task = register_model_to_registry(
        model_data=training_task.output,
        model_package_group_name=model_package_group,
        inference_image=inference_image,
        role_arn=role_arn
    )
    registry_task.apply(use_aws_secret('aws-secret', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'))

    # 3. 部署到 EKS KServe
    deploy_task = deploy_to_kserve(
        model_package_arn=registry_task.output,
        model_name="fraud-detection-v1",
        namespace="kserve-inference"
    )

    return deploy_task.output
```


---

## SageMaker Model Registry 治理

### 集中式模型管理

SageMaker Model Registry 作为所有模型的中央存储库，在 EKS 服务环境中也可以应用相同的治理策略。

```mermaid
flowchart TB
    subgraph "Model Lifecycle"
        DEV[开发环境<br/>实验模型]
        STAGING[预发布<br/>验证中]
        PROD[生产<br/>已批准模型]
        ARCHIVED[归档<br/>已废弃模型]
    end

    subgraph "Approval Process"
        AUTO[自动批准<br/>基于指标]
        MANUAL[手动批准<br/>需要审核]
    end

    subgraph "Deployment Targets"
        SM_EP[SageMaker Endpoint]
        EKS_KSERVE[EKS KServe]
        BATCH[Batch Transform]
    end

    DEV --> STAGING
    STAGING --> AUTO
    STAGING --> MANUAL
    AUTO --> PROD
    MANUAL --> PROD
    PROD --> ARCHIVED

    PROD --> SM_EP
    PROD --> EKS_KSERVE
    PROD --> BATCH

    style PROD fill:#34a853
    style STAGING fill:#fbbc04
    style ARCHIVED fill:#ea4335
```

### Model Registry 设置

```python
# model_registry_setup.py
import boto3
import sagemaker
from sagemaker.model_package import ModelPackageGroup

sm_client = boto3.client('sagemaker')
session = sagemaker.Session()

# 创建 Model Package Group
model_package_group_name = "fraud-detection-models"

try:
    sm_client.create_model_package_group(
        ModelPackageGroupName=model_package_group_name,
        ModelPackageGroupDescription="Fraud detection models for production",
        Tags=[
            {"Key": "Team", "Value": "ml-platform"},
            {"Key": "Environment", "Value": "production"}
        ]
    )
except sm_client.exceptions.ResourceInUse:
    print(f"Model package group {model_package_group_name} already exists")

# 设置模型批准策略
model_approval_policy = {
    "Rules": [
        {
            "Name": "AutoApproveHighAccuracy",
            "Condition": {
                "MetricName": "accuracy",
                "Operator": "GreaterThanOrEqualTo",
                "Value": 0.95
            },
            "Action": "Approve"
        },
        {
            "Name": "RejectLowAccuracy",
            "Condition": {
                "MetricName": "accuracy",
                "Operator": "LessThan",
                "Value": 0.85
            },
            "Action": "Reject"
        }
    ]
}
```

### 从 EKS 查询 Model Registry

```python
# eks_model_loader.py
import boto3
from kubernetes import client, config

def get_approved_model_from_registry(model_package_group_name: str) -> str:
    """从 Model Registry 查询已批准的最新模型"""
    sm_client = boto3.client('sagemaker')

    # 查询已批准的模型包
    response = sm_client.list_model_packages(
        ModelPackageGroupName=model_package_group_name,
        ModelApprovalStatus='Approved',
        SortBy='CreationTime',
        SortOrder='Descending',
        MaxResults=1
    )

    if not response['ModelPackageSummaryList']:
        raise ValueError(f"No approved models found in {model_package_group_name}")

    model_package_arn = response['ModelPackageSummaryList'][0]['ModelPackageArn']

    # 查询模型详细信息
    model_package = sm_client.describe_model_package(
        ModelPackageName=model_package_arn
    )

    model_data_url = model_package['InferenceSpecification']['Containers'][0]['ModelDataUrl']

    return model_data_url


def update_kserve_with_latest_model(model_name: str, namespace: str):
    """使用最新已批准模型更新 KServe InferenceService"""
    config.load_incluster_config()
    custom_api = client.CustomObjectsApi()

    # 从 Model Registry 查询最新模型
    model_url = get_approved_model_from_registry("fraud-detection-models")

    # 更新 InferenceService
    patch_body = {
        "spec": {
            "predictor": {
                "pytorch": {
                    "storageUri": model_url
                }
            }
        }
    }

    custom_api.patch_namespaced_custom_object(
        group="serving.kserve.io",
        version="v1beta1",
        namespace=namespace,
        plural="inferenceservices",
        name=model_name,
        body=patch_body
    )

    print(f"Updated {model_name} with model from {model_url}")
```


---

## 成本优化策略

### 训练 vs 服务成本分析

<CostOptimization />

### 成本优化检查清单

```yaml
# cost-optimization-config.yaml
training:
  # SageMaker Managed Spot Training（最高节省 90%）
  use_spot_instances: true
  max_wait_time_seconds: 86400  # 24小时
  max_run_time_seconds: 43200   # 12小时

  # 启用检查点（应对 Spot 中断）
  checkpoint_s3_uri: s3://my-bucket/checkpoints/
  checkpoint_local_path: /opt/ml/checkpoints

  # 实例类型优化
  instance_type: ml.g5.2xlarge  # GPU 训练
  instance_count: 2

  # 训练完成后自动终止
  auto_terminate: true

serving:
  # Karpenter Spot 实例（最高节省 70%）
  capacity_type: spot

  # 自动扩缩设置
  min_replicas: 1
  max_replicas: 10
  target_utilization: 70

  # 空闲时间缩容
  scale_down_delay: 300  # 5分钟

  # GPU 共享（MIG 或 MPS）
  enable_gpu_sharing: true
  max_shared_clients: 4

storage:
  # S3 Intelligent-Tiering
  s3_storage_class: INTELLIGENT_TIERING

  # 旧模型归档
  lifecycle_policy:
    archive_after_days: 90
    delete_after_days: 365
```

### 成本监控仪表板

```python
# cost_monitoring.py
import boto3
from datetime import datetime, timedelta

def get_sagemaker_training_costs(days=30):
    """查询 SageMaker 训练成本"""
    ce_client = boto3.client('ce')

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)

    response = ce_client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date.strftime('%Y-%m-%d'),
            'End': end_date.strftime('%Y-%m-%d')
        },
        Granularity='DAILY',
        Metrics=['UnblendedCost'],
        Filter={
            'Dimensions': {
                'Key': 'SERVICE',
                'Values': ['Amazon SageMaker']
            }
        },
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'USAGE_TYPE'}
        ]
    )

    return response


def get_eks_serving_costs(cluster_name: str, days=30):
    """查询 EKS 服务成本"""
    ce_client = boto3.client('ce')

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)

    response = ce_client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date.strftime('%Y-%m-%d'),
            'End': end_date.strftime('%Y-%m-%d')
        },
        Granularity='DAILY',
        Metrics=['UnblendedCost'],
        Filter={
            'And': [
                {
                    'Dimensions': {
                        'Key': 'SERVICE',
                        'Values': ['Amazon Elastic Compute Cloud - Compute']
                    }
                },
                {
                    'Tags': {
                        'Key': 'kubernetes.io/cluster/' + cluster_name,
                        'Values': ['owned']
                    }
                }
            ]
        }
    )

    return response
```


---

## 多区域部署模式

### 全球模型部署架构

```mermaid
flowchart TB
    subgraph "Primary Region (us-west-2)"
        SM_TRAIN[SageMaker Training]
        SM_REG[Model Registry<br/>Primary]
        S3_PRIMARY[S3 Model Artifacts<br/>Primary]
    end

    subgraph "Secondary Region (ap-northeast-2)"
        S3_REPLICA[S3 Model Artifacts<br/>Replica]
        EKS_AP[EKS Cluster<br/>Seoul]
        KSERVE_AP[KServe<br/>Asia Pacific]
    end

    subgraph "Secondary Region (eu-west-1)"
        S3_EU[S3 Model Artifacts<br/>Replica]
        EKS_EU[EKS Cluster<br/>Ireland]
        KSERVE_EU[KServe<br/>Europe]
    end

    subgraph "Global Traffic Management"
        R53[Route 53<br/>Geo Routing]
        CLOUDFRONT[CloudFront<br/>Edge Caching]
    end

    SM_TRAIN --> SM_REG
    SM_REG --> S3_PRIMARY

    S3_PRIMARY -->|S3 Cross-Region Replication| S3_REPLICA
    S3_PRIMARY -->|S3 Cross-Region Replication| S3_EU

    S3_REPLICA --> EKS_AP
    EKS_AP --> KSERVE_AP

    S3_EU --> EKS_EU
    EKS_EU --> KSERVE_EU

    R53 --> KSERVE_AP
    R53 --> KSERVE_EU
    CLOUDFRONT --> R53

    style SM_TRAIN fill:#ff9900
    style KSERVE_AP fill:#326ce5
    style KSERVE_EU fill:#326ce5
```

### S3 Cross-Region Replication 设置

```json
{
  "Role": "arn:aws:iam::123456789012:role/S3ReplicationRole",
  "Rules": [
    {
      "ID": "ReplicateModelsToAPNE2",
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {
        "Prefix": "models/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::my-models-ap-northeast-2",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {
            "Minutes": 15
          }
        },
        "Metrics": {
          "Status": "Enabled",
          "EventThreshold": {
            "Minutes": 15
          }
        }
      }
    },
    {
      "ID": "ReplicateModelsToEUW1",
      "Status": "Enabled",
      "Priority": 2,
      "Filter": {
        "Prefix": "models/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::my-models-eu-west-1",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {
            "Minutes": 15
          }
        }
      }
    }
  ]
}
```

### 多区域部署自动化

```python
# multi_region_deployment.py
import boto3
from typing import List, Dict

class MultiRegionDeployer:
    def __init__(self, regions: List[str]):
        self.regions = regions
        self.sm_clients = {
            region: boto3.client('sagemaker', region_name=region)
            for region in regions
        }

    def deploy_model_to_all_regions(
        self,
        model_package_arn: str,
        model_name: str,
        namespace: str = "kserve-inference"
    ):
        """将模型部署到所有区域"""
        deployment_results = {}

        for region in self.regions:
            try:
                # 从区域级 S3 存储桶加载模型
                model_url = self._get_regional_model_url(model_package_arn, region)

                # 部署到区域级 EKS 集群
                result = self._deploy_to_eks(
                    region=region,
                    model_url=model_url,
                    model_name=model_name,
                    namespace=namespace
                )

                deployment_results[region] = {
                    "status": "success",
                    "model_url": model_url,
                    "endpoint": result
                }

            except Exception as e:
                deployment_results[region] = {
                    "status": "failed",
                    "error": str(e)
                }

        return deployment_results

    def _get_regional_model_url(self, model_package_arn: str, region: str) -> str:
        """查询区域级模型 URL"""
        sm_client = self.sm_clients[region]

        # 从 Model Registry 查询模型信息
        model_package = sm_client.describe_model_package(
            ModelPackageName=model_package_arn
        )

        # 转换为区域级 S3 存储桶
        original_url = model_package['InferenceSpecification']['Containers'][0]['ModelDataUrl']
        regional_url = original_url.replace('us-west-2', region)

        return regional_url

    def _deploy_to_eks(
        self,
        region: str,
        model_url: str,
        model_name: str,
        namespace: str
    ) -> str:
        """部署到区域级 EKS 集群"""
        from kubernetes import client, config

        # 加载区域级 kubeconfig
        config.load_kube_config(context=f"eks-{region}")

        custom_api = client.CustomObjectsApi()

        inference_service = {
            "apiVersion": "serving.kserve.io/v1beta1",
            "kind": "InferenceService",
            "metadata": {
                "name": f"{model_name}-{region}",
                "namespace": namespace
            },
            "spec": {
                "predictor": {
                    "pytorch": {
                        "storageUri": model_url,
                        "resources": {
                            "requests": {"nvidia.com/gpu": "1"},
                            "limits": {"nvidia.com/gpu": "1"}
                        }
                    }
                },
                "minReplicas": 2,
                "maxReplicas": 10
            }
        }

        custom_api.create_namespaced_custom_object(
            group="serving.kserve.io",
            version="v1beta1",
            namespace=namespace,
            plural="inferenceservices",
            body=inference_service
        )

        return f"https://{model_name}-{region}.{namespace}.svc.cluster.local"


# 使用示例
deployer = MultiRegionDeployer(
    regions=["us-west-2", "ap-northeast-2", "eu-west-1"]
)

results = deployer.deploy_model_to_all_regions(
    model_package_arn="arn:aws:sagemaker:us-west-2:123456789012:model-package/fraud-detection/1",
    model_name="fraud-detection-v1"
)

print(results)
```


---

## 模型监控与漂移检测

### 统一监控架构

```mermaid
flowchart TB
    subgraph "Data Collection"
        KSERVE[KServe Predictor<br/>Inference Requests]
        LOGGER[Request Logger<br/>Sidecar]
    end

    subgraph "SageMaker Model Monitor"
        DATA_QUALITY[Data Quality Monitor<br/>Input Drift]
        MODEL_QUALITY[Model Quality Monitor<br/>Prediction Drift]
        BIAS[Bias Monitor<br/>Fairness]
        EXPLAINABILITY[Explainability Monitor<br/>Feature Attribution]
    end

    subgraph "Storage & Analysis"
        S3_LOGS[S3 Inference Logs<br/>Structured Data]
        ATHENA[Amazon Athena<br/>SQL Analysis]
    end

    subgraph "Alerting"
        CW_ALARMS[CloudWatch Alarms<br/>Threshold Violations]
        SNS[SNS Topics<br/>Notifications]
        LAMBDA[Lambda Functions<br/>Auto-remediation]
    end

    KSERVE --> LOGGER
    LOGGER --> S3_LOGS

    S3_LOGS --> DATA_QUALITY
    S3_LOGS --> MODEL_QUALITY
    S3_LOGS --> BIAS
    S3_LOGS --> EXPLAINABILITY

    S3_LOGS --> ATHENA

    DATA_QUALITY --> CW_ALARMS
    MODEL_QUALITY --> CW_ALARMS
    CW_ALARMS --> SNS
    SNS --> LAMBDA

    style DATA_QUALITY fill:#ff9900
    style MODEL_QUALITY fill:#ff9900
```

### KServe Logger Sidecar 设置

```yaml
apiVersion: serving.kserve.io/v1beta1
kind: InferenceService
metadata:
  name: fraud-detection-monitored
  namespace: kserve-inference
spec:
  predictor:
    pytorch:
      storageUri: s3://my-models/fraud-detection/model.tar.gz
      resources:
        requests:
          nvidia.com/gpu: 1
        limits:
          nvidia.com/gpu: 1

    # 添加 Logger Sidecar
    logger:
      mode: all  # request, response, all
      url: http://logger-service.monitoring.svc.cluster.local:8080/log

  minReplicas: 2
  maxReplicas: 10
---
apiVersion: v1
kind: Service
metadata:
  name: logger-service
  namespace: monitoring
spec:
  selector:
    app: inference-logger
  ports:
    - port: 8080
      targetPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inference-logger
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inference-logger
  template:
    metadata:
      labels:
        app: inference-logger
    spec:
      serviceAccountName: inference-logger-sa
      containers:
        - name: logger
          image: my-registry/inference-logger:latest
          ports:
            - containerPort: 8080
          env:
            - name: S3_BUCKET
              value: "my-inference-logs"
            - name: S3_PREFIX
              value: "fraud-detection/"
            - name: AWS_REGION
              value: "us-west-2"
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "1"
              memory: "2Gi"
```

### SageMaker Model Monitor 集成

```python
# sagemaker_model_monitor.py
import boto3
from sagemaker.model_monitor import (
    DataCaptureConfig,
    DataQualityMonitor,
    ModelQualityMonitor
)
from sagemaker import Session

session = Session()
sm_client = boto3.client('sagemaker')

# 设置 Data Quality Monitor
data_quality_monitor = DataQualityMonitor(
    role='arn:aws:iam::123456789012:role/SageMakerModelMonitorRole',
    instance_count=1,
    instance_type='ml.m5.xlarge',
    volume_size_in_gb=20,
    max_runtime_in_seconds=3600,
    sagemaker_session=session
)

# 创建基线（基于训练数据）
baseline_job = data_quality_monitor.suggest_baseline(
    baseline_dataset='s3://my-bucket/training-data/baseline.csv',
    dataset_format={'csv': {'header': True}},
    output_s3_uri='s3://my-bucket/model-monitor/baseline',
    wait=True
)

# 创建监控调度
monitoring_schedule = data_quality_monitor.create_monitoring_schedule(
    monitor_schedule_name='fraud-detection-data-quality',
    endpoint_input='s3://my-inference-logs/fraud-detection/',  # EKS 日志
    output_s3_uri='s3://my-bucket/model-monitor/reports',
    statistics=baseline_job.baseline_statistics(),
    constraints=baseline_job.suggested_constraints(),
    schedule_cron_expression='cron(0 * * * ? *)',  # 每小时
    enable_cloudwatch_metrics=True
)

print(f"Monitoring schedule created: {monitoring_schedule.monitoring_schedule_name}")
```

### 漂移检测与自动重训练

```python
# drift_detection_handler.py
import boto3
import json
from datetime import datetime

def lambda_handler(event, context):
    """CloudWatch Alarm 触发时自动重训练"""

    # 解析 Alarm 信息
    message = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = message['AlarmName']

    if 'DataQualityViolation' in alarm_name:
        print(f"Data quality violation detected: {alarm_name}")

        # 触发 SageMaker Training Job
        sm_client = boto3.client('sagemaker')

        training_job_name = f"fraud-detection-retrain-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        response = sm_client.create_training_job(
            TrainingJobName=training_job_name,
            RoleArn='arn:aws:iam::123456789012:role/SageMakerExecutionRole',
            AlgorithmSpecification={
                'TrainingImage': '763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-training:2.1.0-gpu-py310',
                'TrainingInputMode': 'File'
            },
            InputDataConfig=[
                {
                    'ChannelName': 'training',
                    'DataSource': {
                        'S3DataSource': {
                            'S3DataType': 'S3Prefix',
                            'S3Uri': 's3://my-bucket/training-data/',
                            'S3DataDistributionType': 'FullyReplicated'
                        }
                    }
                }
            ],
            OutputDataConfig={
                'S3OutputPath': 's3://my-bucket/models/'
            },
            ResourceConfig={
                'InstanceType': 'ml.g5.2xlarge',
                'InstanceCount': 2,
                'VolumeSizeInGB': 50
            },
            StoppingCondition={
                'MaxRuntimeInSeconds': 43200  # 12小时
            },
            Tags=[
                {'Key': 'Trigger', 'Value': 'AutoRetraining'},
                {'Key': 'Reason', 'Value': 'DataDrift'}
            ]
        )

        print(f"Retraining job started: {training_job_name}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Retraining triggered',
                'training_job': training_job_name
            })
        }

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'No action required'})
    }
```


---

## 总结

SageMaker-EKS 混合架构结合了托管训练和灵活服务的优势。

### 核心要点

1. **混合模式**：SageMaker 训练 + EKS 服务，发挥各平台优势
2. **集中治理**：通过 SageMaker Model Registry 统一管理所有模型
3. **成本优化**：使用 Spot 实例和自动扩缩降低成本
4. **多区域**：通过 S3 Cross-Region Replication 实现全球部署
5. **监控**：SageMaker Model Monitor 与 EKS 日志集成

### 建议

- 大规模分布式训练在 SageMaker 上进行，减少基础设施管理负担
- 服务环境在 EKS 上运营，实现精细控制和成本优化
- 将 Model Registry 作为中央存储库，强化治理
- 检测到漂移时构建自动重训练流水线

### 后续步骤

- [基于 EKS 的 MLOps 流水线](./mlops-pipeline-eks.md) - Kubeflow + MLflow + KServe
- [GPU 资源管理](./gpu-resource-management.md) - GPU 集群优化
- [模型监控](./agent-monitoring.md) - 生产模型可观测性

---

## 参考资料

- [SageMaker Components for Kubeflow Pipelines](https://docs.aws.amazon.com/sagemaker/latest/dg/kubernetes-sagemaker-components-for-kubeflow-pipelines.html)
- [SageMaker Model Registry](https://docs.aws.amazon.com/sagemaker/latest/dg/model-registry.html)
- [SageMaker Model Monitor](https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html)
- [KServe Documentation](https://kserve.github.io/website/)
- [AWS Multi-Region Architecture](https://aws.amazon.com/solutions/implementations/multi-region-application-architecture/)
