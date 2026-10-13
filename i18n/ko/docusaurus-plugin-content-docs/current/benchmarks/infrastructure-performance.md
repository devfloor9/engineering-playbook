---
title: 인프라 성능 벤치마크
description: EKS 클러스터 인프라 성능 벤치마크 - 네트워크, DNS, 오토스케일링
created: "2026-02-09"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 2
tags:
  - benchmark
  - infrastructure
  - performance
  - network
  - dns
  - scope:tech
sidebar_label: Report 6. 인프라 성능 [예정]
sidebar_position: 6
category: benchmarks
---

EKS 클러스터 인프라의 네트워크, DNS, 오토스케일링을 비교하기 위한 측정 계획입니다. 아래 항목은 시험 범위이며 이 문서에 실측 결과가 제시된 것은 아닙니다.

## 네트워크 성능

### Cilium ENI vs VPC CNI 비교

VPC CNI와 Cilium의 다섯 가지 구성에 대한 과거 요약 기록과 검증 한계는 별도 문서에서 다룹니다.

저장된 수치의 의미와 재실험 조건은 [1. CNI 성능 비교](./cni-performance-comparison.md)를 참조하세요. 원본 로그와 적용된 설정이 없어 제품별 성능 순위는 아직 검증되지 않았습니다.

**기존 스크립트가 요청하는 구성 (5개):**

- A: VPC CNI 기본 (kube-proxy + iptables)
- B: Cilium + kube-proxy (Overlay)
- C: Cilium kube-proxy-less (eBPF 대체)
- D: Cilium ENI 모드 (Native Routing)
- E: Cilium ENI + 추가 옵션 (DSR, native XDP, socket LB 등; 실제 활성화 여부 미검증)

### Gateway API 성능

**측정 항목**

- 요청 처리 지연 시간 (P50, P95, P99)
- 초당 요청 처리량 (RPS)
- TLS 핸드셰이크 오버헤드

## DNS 성능

### CoreDNS 최적화 전후 비교

**측정 항목**

- DNS 해석 지연 시간
- 캐시 히트율
- 초당 쿼리 처리량
- NodeLocal DNSCache 효과

## 오토스케일링 반응 속도

### Karpenter vs Cluster Autoscaler

**측정 항목**

- 스케일 아웃 반응 시간
- 노드 프로비저닝 시간
- Pod 스케줄링 지연

## 비용 효율성

### 인스턴스 타입별 비용 대비 성능

**측정 항목**

- vCPU당 처리량
- 메모리당 비용
- Spot vs On-Demand 안정성 비교
