# NVIDIA Dynamo Platform — EKS Deployment Guide

NVIDIA Dynamo 기반 LLM 추론 플랫폼을 Amazon EKS에 배포하기 위한 매니페스트 및 스크립트 모음입니다.

## 사전 요구사항

- Amazon EKS 클러스터 (v1.32+, Auto Mode 권장)
- GPU 노드 그룹 (p5/p4d/g6e — NVIDIA A100/H100/L40S)
- AWS EFS CSI Driver 설치 완료
- AWS Load Balancer Controller 설치 완료
- Helm v3.14+
- kubectl v1.32+

## 컴포넌트 구성

| 컴포넌트 | 설명 | 네임스페이스 |
|----------|------|-------------|
| GPU Operator | NVIDIA GPU 드라이버 및 플러그인 관리 | `gpu-operator` |
| Monitoring | Prometheus + Grafana + Pushgateway | `monitoring` |
| Dynamo Platform | CRDs + Operator + etcd + NATS | `dynamo-system` |
| Dynamo vLLM | Aggregated/Disaggregated vLLM 서빙 | `dynamo-system` |
| Benchmark | AIPerf 벤치마크 (4가지 모드) | `dynamo-system` |
| AIConfigurator | Quick Estimate + SLA 기반 배포 | `dynamo-system` |

## 설치 순서

### 1. 기본 리소스 생성

```bash
kubectl apply -f base/namespace.yaml
kubectl apply -f base/storageclass-efs.yaml
# HuggingFace 토큰 설정 후
kubectl apply -f base/hf-token-secret.yaml
```

### 2. GPU Operator 설치

```bash
cd gpu-operator && bash install.sh
```

### 3. 모니터링 스택 설치

```bash
cd monitoring && bash install.sh
```

### 4. Dynamo Platform 설치

```bash
cd dynamo-platform && bash install.sh
```

### 5. 모델 다운로드 및 서빙 배포

```bash
# 모델 다운로드 (EFS에 저장)
kubectl apply -f dynamo-vllm/model-download-job.yaml

# Aggregated 모드 배포
kubectl apply -f dynamo-vllm/deploy-aggregated.yaml

# 또는 Disaggregated 모드 배포
kubectl apply -f dynamo-vllm/deploy-disaggregated.yaml
```

### 6. 벤치마크 실행

```bash
cd benchmark && bash run-all.sh --model Qwen3-30B-A3B-FP8 --concurrency "1,2,4,8,16,32,64"
```

## EKS Auto Mode 호환성

모든 매니페스트에 EKS Auto Mode toleration이 포함되어 있습니다:

```yaml
tolerations:
  - key: "eks.amazonaws.com/compute-type"
    operator: "Exists"
  - key: "nvidia.com/gpu"
    operator: "Exists"
    effect: "NoSchedule"
```

## 참고

- 원본 코드: PR #102 (nvidia-platform 브랜치)
- Vagrant 환경 CLI 코드를 EKS 배포용 사전 렌더링 YAML로 변환
- Dynamo v0.9.1 기준, DynamoWorkerMetadata CRD 수동 번들 포함
