---
title: 가속 컴퓨팅 인프라
description: EKS GPU 노드 전략, Karpenter·KEDA·DRA 리소스 관리, NVIDIA GPU 스택, AWS Neuron 스택 — GPU·AWS 커스텀 가속기를 포괄하는 가속 컴퓨팅 계층
created: "2026-04-17"
last_update:
  date: "2026-07-19"
  author: devfloor9
reading_time: 4
tags:
  - gpu
  - eks
  - karpenter
  - gpu-operator
  - neuron
  - scope:tech
sidebar_label: 가속 컴퓨팅 인프라
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

Kubernetes 위에서 **어떤 가속 인스턴스를 · 어떻게 스케줄링하고 · 어떤 드라이버·파티셔닝 스택으로 관리할지** 를 다루는 계층입니다. NVIDIA GPU 뿐 아니라 AWS 커스텀 가속기(Trainium/Inferentia)까지 포괄합니다. 이 계층이 확립되어야 상위의 추론 프레임워크(vLLM·llm-d 등)가 안정적으로 돌아갑니다.

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/eks-gpu-node-strategy"
    icon="🖥️"
    title="EKS GPU 노드 전략"
    description="Auto Mode vs Karpenter vs Managed Node Group vs Hybrid Node — 워크로드별 최적 노드 선택, 보안 강화, 트러블슈팅."
    color="#326ce5"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management"
    icon="📊"
    title="GPU 리소스 관리"
    description="Karpenter NodePool, KEDA 스케일링, DRA 동적 리소스 할당, Spot/Consolidation 비용 최적화 전략."
    color="#f59e0b"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack"
    icon="💚"
    title="NVIDIA GPU 스택"
    description="GPU Operator ClusterPolicy, DCGM 모니터링, MIG·Time-Slicing 파티셔닝, Dynamo 추론 프레임워크."
    color="#76b900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/aws-neuron-stack"
    icon="🧭"
    title="AWS Neuron 스택"
    description="Trainium2/Inferentia2, Neuron SDK 2.x, aws-neuron-device-plugin, NxD Inference, vLLM Neuron backend."
    color="#ff9900"
  />
  <DocCard
    to="/docs/agentic-ai-platform/model-serving/gpu-infrastructure/criu-gpu-migration"
    icon="🧪"
    title="CRIU GPU Migration (Preview)"
    description="Spot reclaim·노드 교체 시 GPU 워크로드 checkpoint/restore 기술 동향과 EKS 적용 시나리오 검증 체크리스트."
    color="#9c27b0"
  />
</DocCardGrid>

:::tip 선택 가이드
NVIDIA 중심이면 **노드 전략 → 리소스 관리 → NVIDIA 스택**, AWS 실리콘(Trainium/Inferentia) 을 고려한다면 **노드 전략 → Neuron 스택** 으로 이어 읽으세요.
:::

## 관련 문서

- [EKS 디버깅 — GPU·AI 워크로드](/docs/eks-best-practices/operations-reliability/eks-debugging/gpu-ai-workload) — GPU 노드·드라이버·DCGM 트러블슈팅 플레이북
- [vLLM 모델 서빙](../inference-frameworks/vllm-model-serving.md) — 상위 추론 엔진 계층
- [llm-d EKS Auto Mode](../inference-frameworks/llm-d-eks-automode.md) — Disaggregated Serving·Auto Mode 사례
