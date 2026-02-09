---
title: AI/ML 워크로드 벤치마크
sidebar_position: 2
description: AI/ML 모델 서빙 및 추론 성능 벤치마크 리포트
tags: [benchmark, ai, ml, gpu, inference, vllm]
last_update:
  date: 2026-02-09
  author: engineering-playbook
---

# AI/ML 워크로드 벤치마크

AI/ML 워크로드의 추론 성능, GPU 활용률, 모델 서빙 효율성을 측정합니다.

## 모델 추론 성능

### vLLM 단독 서빙

:::note 테스트 예정
이 벤치마크는 현재 준비 중입니다.
:::

**테스트 환경**
- GPU: NVIDIA A100 80GB / H100
- 모델: Llama 3.1 8B, 70B
- 프레임워크: vLLM

**측정 항목**
- Time to First Token (TTFT)
- Inter-Token Latency (ITL)
- 초당 토큰 생성량
- 동시 요청 처리량

### Ray Serve + vLLM 통합

**측정 항목**
- 멀티 모델 로드밸런싱 성능
- 오토스케일링 반응 시간
- 리소스 활용률

### MoE 모델 서빙

**측정 항목**
- Expert 라우팅 오버헤드
- 메모리 사용량 비교 (Dense vs MoE)
- 토큰 처리 성능

## GPU 리소스 효율성

### MIG vs Time-Slicing vs MPS

**측정 항목**
- GPU 활용률
- 워크로드 격리 효과
- 멀티 테넌트 성능 영향

## 추론 게이트웨이

### LiteLLM 라우팅 성능

**측정 항목**
- 라우팅 오버헤드
- 모델 간 전환 지연 시간
- 폴백 반응 속도
