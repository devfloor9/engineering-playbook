---
title: "East-West 트래픽 최적화: 성능과 비용의 균형"
sidebar_label: "East-West 트래픽 최적화"
description: "EKS에서 서비스 간 통신의 지연시간을 최소화하고 크로스-AZ 비용을 절감하는 심층 최적화 전략. Topology Hints부터 Cilium ClusterMesh, Istio Ambient까지"
tags: [eks, networking, performance, cost-optimization, service-mesh]
category: "performance-networking"
date: 2025-05-22
authors: [devfloor9]
sidebar_position: 4
---

# EKS East-West 트래픽 최적화 가이드

East-West(서비스↔서비스)의 홉 수가 1 → 2 로 늘어나면 p99 지연이 msec 단위로 지연되고, AZ 를 가로지르면 AWS 대역폭 요금(GB 단가 $0.01)이 발생합니다. 이 아티클은 **Kubernetes 네이티브 기능(Topology Hints·InternalTrafficPolicy)부터 Cilium ClusterMesh, AWS VPC Lattice, Istio Ambient**까지 레이어별 옵션을 간단히 알아보고, p99·p999 지연, CPU·메모리 오버헤드, 그리고 **10 TB/월** 동-AZ 트래픽을 가정한 비용을 정량 비교합니다.

---

## 2. Kubernetes 기본기 딥다이브

:::tip NodeLocal DNSCache 효과
NodeLocal DNSCache를 활용하면 교차 AZ DNS 요금 및 지연율을 감소시킬 수 있습니다.
:::

NodeLocal DNSCache를 켜면 DNS 질의가 노드 내에서 처리되어, p99 lookup 지연을 수 ms→sub-ms로 줄이고 CoreDNS QPS 부하를 완화합니다.

---

## 3. AWS 내부 Load Balancer 옵션 비교

**IP 타겟**을 사용하면 LB → Pod가 AZ 로컬로 고정돼 불필요한 cross-AZ 요금을 제거합니다.

---

## 4. 서비스 메쉬 vs 사이드카리스: 성능 데이터

Istio 1.24 공식 벤치마크: sidecar Envoy 2-worker, 1 KB HTTP, 1 kRPS 기준

---

## 5. 멀티 클러스터 연결 옵션

---

## 6. 10 TB/월 East-West 트래픽 비용 시뮬레이션

가정: 동일 리전 3-AZ EKS 클러스터, 총 10 TB (= 10,240 GB) 서비스-간 트래픽.

계산식:

- NLB / ALB 처리료는 평균 14.22 GB/h → NLCU or LCU * 요율(0.006 / 0.008)로 환산
- cross-AZ 단가는 $0.01 / GB (동 리전)

**인사이트:**

- InternalTrafficPolicy Local 로 노드-로컬을 보장하면 **비용 0 달러**에 가장 낮은 지연을 달성. 단, Pod 의 Affinity 구성 및 근접 배치가 필수.
- 서비스가 20 개 이상, 다계정이면 Lattice가 운영 편의 (추가 비용 발생)
- ALB는 L7 기능·WAF 필요한 특정 경로에만 "스팟" 투입하고, 나머지는 ClusterIP 경로를 유지하는 **하이브리드**가 대부분의 워크로드에 가장 경제적.

---

## 7. p99·p999 성능 요약

p99/p999은 실험값 + AWS 공개 SLA (ELB ≤ 2 ms)에서 발췌.

---

## 8. 아키텍처 선택 가이드

1. **"저비용 + 초저지연"**: ClusterIP + Topology Hints (+ 필요 시 InternalTrafficPolicy Local) + NodeLocal DNSCache.
2. **"L4 안정성과 고정 IP 필요"**: NLB IP 모드, 단 트래픽 > 5 TB/월이면 비용 확인
3. **"L7 라우팅·WAF·gRPC 메소드별 제어"**: 내부 ALB + K8s Gateway API. 사용 경로에만 배치해 LCU 증가를 방지
4. **"전사 Zero-Trust, 멀티클러스터"**: Istio Ambient → Sidecar 전환은 필요한 Workload로 스코프 down.
5. **"다계정·서비스 > 50개"**: 관리형 Lattice + IAM 정책으로 네트워크 관련 복잡도 낮춤

---

## 9. 결론

- EKS에서는 **네트워크 로컬리티가 성능·비용의 최적 방안**. Topology Aware Routing 과 IP 타겟 LB만으로도 Cross AZ, DTO 비용을 제로에 가깝게 절감 가능.
- 서비스 메쉬의 이점(mTLS, 트래픽 정책)을 누리되, **사이드카 → 노드-프락시(Ambient) → Sidecar-less(eBPF)** 순으로 오버헤드를 줄이는 전략을 검토 필요.
- Ex) 월간 10 TB 규모에서는 ClusterIP-Local 구성이 **ALB 대비 약 98 달러, VPC Lattice 대비 400 + 달러**를 절감.

---

## 참고 문헌

1. AWS Elastic Load Balancing LCU /NLCU 가격 예시
2. AWS Cross-AZ 전송 $0.01/GB 요금 FAQ
3. AWS ELB 지연 p99 ≤ 2 ms 권고
4. AWS Network Load Balancer ultralow latency 설명
5. AWS NLB cross-AZ 비용 분석 블로그
6. AWS VPC Lattice 가격 문서
7. Istio 1.24 Sidecar 벤치마크 테이블 (p99·CPU·Mem)
8. Istio 공식 Sidecar 리소스 가이드
9. NodeLocal DNSCache 공식 문서
