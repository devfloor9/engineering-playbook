---
title: 인프라 성능 벤치마크
sidebar_position: 1
description: EKS 클러스터 인프라 성능 벤치마크 - 네트워크, DNS, 오토스케일링
category: "benchmarks"
tags: [benchmark, infrastructure, performance, network, dns]
last_update:
  date: 2026-02-09
  author: devfloor9
---

# 인프라 성능 벤치마크

EKS 클러스터 인프라의 핵심 성능 지표를 측정하고 분석합니다.

## 네트워크 성능

### Cilium ENI vs VPC CNI 비교

VPC CNI와 Cilium CNI의 다중 모드(kube-proxy, kube-proxy-less, ENI, 튜닝 적용)별 정량 비교는 독립 문서로 분리하여 상세하게 다루고 있습니다.

상세 벤치마크 결과는 [CNI 성능 비교 벤치마크](./cni-performance-comparison.md)를 참조하세요.

**비교 시나리오 (5개):**
- A: VPC CNI 기본 (kube-proxy + iptables)
- B: Cilium + kube-proxy (Overlay)
- C: Cilium kube-proxy-less (eBPF 대체)
- D: Cilium ENI 모드 (Native Routing)
- E: Cilium ENI + 풀 튜닝 (DSR, XDP, Socket LB 등)

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
