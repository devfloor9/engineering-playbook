---
title: EKS 성능 벤치마크 보고서
description: EKS 환경 성능 벤치마크 보고서 모음 — 네트워킹, AI/ML 추론, 인프라 & 운영
created: "2026-02-09"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 2
tags:
  - benchmark
  - performance
  - testing
  - report
  - eks
  - scope:nav
sidebar_position: 7
category: benchmarks
---

EKS 환경의 성능 보고서와 측정 계획을 모았습니다. 각 보고서의 검증 범위를 확인하고, 실제 측정·공개 자료 분석·로컬 도구 검증을 구분해 아키텍처 결정에 활용하세요.

## 네트워킹

| # | 보고서 | 상태 |
|---|--------|------|
| 1 | [VPC CNI vs Cilium 네트워크 성능 비교](./cni-performance-comparison.md) | ✅ 완성 |
| 2 | [Gateway API 아키텍처·기능 비교 및 시험 보고서](./gateway-api-benchmark.md) | 자료·도구 검증 완료 / EKS 실측 대기 |

## AI/ML 추론

| # | 보고서 | 상태 |
|---|--------|------|
| 3 | [Llama 4 서빙 비교: 사양과 검증 계획](./ai-ml-workload.md) | 사양 검토 / 성능·비용 실측 대기 |
| 4 | [추론 플랫폼: AgentCore vs EKS 자체 구축](./agentcore-vs-eks-inference.md) | 📋 계획 |
| 5 | [NVIDIA Dynamo 추론 벤치마크](./dynamo-inference-benchmark.md) | 🆕 신규 |

## 인프라 & 운영

| # | 보고서 | 상태 |
|---|--------|------|
| 6 | [인프라 성능](./infrastructure-performance.md) | 🔜 예정 |
| 7 | [하이브리드 인프라](./hybrid-infrastructure.md) | 🔜 예정 |
| 8 | [보안 및 운영](./security-operations.md) | 🔜 예정 |

## 벤치마크 방법론

결과의 신뢰성은 다음 기준으로 검토합니다. 보고서가 등록되어 있다는 사실만으로 이 조건을 모두 충족한 것은 아닙니다.

1. **재현 가능성**: 테스트 환경, 도구, 구성을 명시
2. **불확실성**: 표본 수와 반복별 분포를 제시하고, 오차 범위를 뒷받침하는 근거를 명시
3. **공정한 비교**: 동일 조건에서 비교 대상 간 측정
4. **실제 워크로드**: 합성 벤치마크보다 실제 패턴에 가까운 테스트 우선

## 리포트 구조

보고서는 다음 정보를 제공해야 합니다. 실행하지 않은 항목과 검증할 자료가 없는 항목은 상태를 명시합니다.

- **테스트 환경**: 클러스터 스펙, 노드 타입, 네트워크 구성
- **테스트 도구**: 사용된 벤치마크 도구 및 버전
- **테스트 시나리오**: 구체적인 테스트 케이스 설명
- **결과**: 데이터, 차트, 분석
- **권장 사항**: 결과 기반 최적화 제안
