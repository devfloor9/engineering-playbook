---
title: 인프라 성능 벤치마크
sidebar_position: 1
description: EKS 클러스터 인프라 성능 벤치마크 - 네트워크, DNS, 오토스케일링
tags: [benchmark, infrastructure, performance, network, dns]
last_update:
  date: 2026-02-09
  author: engineering-playbook
---

# 인프라 성능 벤치마크

EKS 클러스터 인프라의 핵심 성능 지표를 측정하고 분석합니다.

## 네트워크 성능

### Cilium ENI vs VPC CNI 비교

:::note 테스트 예정
이 벤치마크는 현재 준비 중입니다. 테스트 환경 구성 후 결과가 업데이트됩니다.
:::

**테스트 환경**
- 클러스터: EKS 1.31
- 노드 타입: m6i.xlarge
- CNI: Cilium ENI mode / VPC CNI

**측정 항목**
- Pod-to-Pod 지연 시간
- Pod-to-Service 지연 시간
- TCP/UDP 처리량
- 연결 설정 속도

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
