---
title: "모델 서빙 & 추론 인프라"
sidebar_label: "모델 서빙 & 추론 인프라"
sidebar_position: 2
---

# 모델 서빙 & 추론 인프라

GPU/가속기 위에서 LLM을 배포하고 서빙하는 방법을 다룹니다.

- [4. GPU 리소스 관리](./gpu-resource-management.md) — MIG, Time-Slicing 등 GPU 리소스 설정
- [5. vLLM 모델 서빙](./vllm-model-serving.md) — 기본 모델 서빙 구성
- [6. MoE 모델 서빙](./moe-model-serving.md) — Mixture of Experts 모델 서빙
- [7. llm-d 분산 추론](./llm-d-eks-automode.md) — Kubernetes 네이티브 분산 추론 (Auto Mode & Karpenter)
- [8. NeMo 프레임워크](./nemo-framework.md) — 학습 및 서빙 프레임워크
- [20. EKS GPU 노드 전략](./eks-gpu-node-strategy.md) — Auto Mode + Karpenter + Hybrid Node 구성
