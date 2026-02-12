---
title: 하이브리드 인프라 벤치마크
sidebar_label: "4. 하이브리드 인프라"
sidebar_position: 3
description: 하이브리드 클라우드 인프라 네트워크 및 스토리지 성능 벤치마크
category: "benchmarks"
tags: [benchmark, hybrid, network, storage, sriov]
last_update:
  date: 2026-02-09
  author: devfloor9
---

# 하이브리드 인프라 벤치마크

클라우드와 온프레미스 간 하이브리드 인프라의 성능을 측정합니다.

## 네트워크 성능

### EKS Hybrid Nodes 네트워크

:::note 테스트 예정
이 벤치마크는 현재 준비 중입니다.
:::

**측정 항목**

- 클라우드-온프레미스 간 지연 시간
- VPN/Direct Connect 대역폭
- Pod 간 통신 성능 (리전 간)

### SR-IOV 네트워크 가속

**측정 항목**

- SR-IOV vs 가상 NIC 처리량
- RDMA 성능 (GPU Direct)
- 네트워크 지연 시간 감소율

## 스토리지 성능

### 하이브리드 파일 스토리지

**측정 항목**

- 순차/랜덤 읽기/쓰기 IOPS
- 대용량 파일 전송 속도
- 공유 파일시스템 동시 접근 성능

## 컨테이너 레지스트리

### Harbor 레지스트리 성능

**측정 항목**

- 이미지 풀 속도 (로컬 vs 원격)
- 레플리케이션 지연 시간
- 동시 풀 요청 처리량
