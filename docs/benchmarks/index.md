---
title: "EKS 성능 벤치마크 보고서"
sidebar_position: 7
description: "EKS 환경 성능 벤치마크 보고서 모음 — 네트워킹, AI/ML 추론, 인프라 & 운영"
category: "benchmarks"
tags: [benchmark, performance, testing, report, eks]
last_update:
  date: 2026-03-20
  author: devfloor9
---

# EKS 성능 벤치마크 보고서

EKS 환경에서 실제 워크로드 기반으로 측정한 성능 벤치마크 보고서입니다. 아키텍처 결정과 최적화 방향을 데이터로 검증합니다.

## 네트워킹

| # | 보고서 | 상태 |
|---|--------|------|
| 1 | [VPC CNI vs Cilium 네트워크 성능 비교](./cni-performance-comparison.md) | ✅ 완성 |
| 2 | [Gateway API 구현체 성능 비교](./gateway-api-benchmark.md) | 📋 계획 |

## AI/ML 추론

| # | 보고서 | 상태 |
|---|--------|------|
| 3 | [Llama 4 FM 서빙: GPU vs Custom Silicon](./ai-ml-workload.md) | ✅ 완성 |
| 4 | [추론 플랫폼: AgentCore vs EKS 자체 구축](./agentcore-vs-eks-inference.md) | 📋 계획 |
| 5 | [NVIDIA Dynamo 추론 벤치마크](./dynamo-inference-benchmark.md) | 🆕 신규 |

## 인프라 & 운영

| # | 보고서 | 상태 |
|---|--------|------|
| 6 | [인프라 성능](./infrastructure-performance.md) | 🔜 예정 |
| 7 | [하이브리드 인프라](./hybrid-infrastructure.md) | 🔜 예정 |
| 8 | [보안 및 운영](./security-operations.md) | 🔜 예정 |

## 벤치마크 방법론

모든 벤치마크는 다음 원칙을 따릅니다:

1. **재현 가능성**: 테스트 환경, 도구, 구성을 명시
2. **통계적 유의성**: 충분한 반복 실행으로 신뢰할 수 있는 결과 도출
3. **공정한 비교**: 동일 조건에서 비교 대상 간 측정
4. **실제 워크로드**: 합성 벤치마크보다 실제 패턴에 가까운 테스트 우선

## 리포트 구조

각 벤치마크 리포트는 일관된 구조를 따릅니다:

- **테스트 환경**: 클러스터 스펙, 노드 타입, 네트워크 구성
- **테스트 도구**: 사용된 벤치마크 도구 및 버전
- **테스트 시나리오**: 구체적인 테스트 케이스 설명
- **결과**: 데이터, 차트, 분석
- **권장 사항**: 결과 기반 최적화 제안
