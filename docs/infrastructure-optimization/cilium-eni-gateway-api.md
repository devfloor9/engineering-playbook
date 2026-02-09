---
title: "Cilium ENI와 Gateway API를 활용한 고성능 네트워킹"
sidebar_label: "Cilium ENI & Gateway API"
description: "Amazon EKS에서 Cilium ENI 모드와 Gateway API를 결합하여 고성능 eBPF 기반 네이티브 네트워킹을 구현하는 완전 가이드"
tags: [eks, cilium, eni, gateway-api, networking, ebpf]
category: "performance-networking"
date: 2025-02-09
authors: [devfloor9]
sidebar_position: 3
---

# Cilium ENI 모드와 Gateway API 구성 가이드

> **📌 기준 버전**: Cilium v1.19.0, Gateway API v1.2.1, Amazon EKS 1.32

> 📅 **작성일**: 2025-02-09 | ⏱️ **읽는 시간**: 약 8분


이 가이드는 Amazon EKS 환경에서 Cilium ENI 모드와 Gateway API를 구성하기 위한 전반적인 개요를 제공합니다. 세부적인 구현 방법은 각 섹션의 공식 문서 링크를 참조하세요.

## 버전 정보

---

## 1. 개요 및 아키텍처

### 1.1 Cilium ENI 모드란?

Cilium ENI 모드는 AWS Elastic Network Interface(ENI)를 직접 사용하여 파드에 VPC IP를 할당하는 네트워킹 방식입니다.

**주요 특징:**

- 파드가 VPC 네이티브 IP를 직접 사용
- AWS VPC CNI 대체 가능
- eBPF 기반의 고성능 네트워킹
- 네이티브 라우팅으로 오버레이 오버헤드 제거

### 1.2 Gateway API란?

Gateway API는 Kubernetes Ingress를 대체하는 차세대 트래픽 관리 표준입니다.

**주요 이점:**

- 역할 기반 리소스 분리 (인프라 관리자 vs 애플리케이션 개발자)
- 표현력 있는 라우팅 규칙
- 확장 가능한 설계
- 멀티 프로토콜 지원 (HTTP, HTTPS, TCP, gRPC)

:::info Gateway API GA 현황
Gateway API v1.0이 2023년 10월 GA되었으며, 현재 v1.2.1이 안정 버전입니다.
- **GA 리소스**: GatewayClass, Gateway, HTTPRoute
- **Beta**: ReferenceGrant, BackendTLSPolicy (v1.2+)
- **주요 구현체**: Cilium, kGateway v2.1 (CNCF Sandbox), Istio, NGINX Gateway Fabric, Kong
:::

### 1.3 아키텍처 오버뷰

**주요 구성 요소:**

- **NLB (Network Load Balancer)**: L4 로드밸런서로 TCP 트래픽을 노드로 전달
- **eBPF TPROXY**: 노드에 도착한 트래픽을 투명하게 Envoy로 전달
- **Cilium Envoy**: L7 라우팅 처리 (HTTPRoute 규칙 적용)
- **Cilium Operator**: ENI 생성/관리 및 Gateway Controller 역할 수행
- **Cilium Agent**: 각 노드에서 eBPF 프로그램 관리 및 네트워킹 처리
- **ENI (Elastic Network Interface)**: 파드에 VPC 네이티브 IP 할당
- **Hubble**: 네트워크 플로우 관측성 제공

### 1.4 트래픽 흐름

**트래픽 처리 단계:**

1. **Client → NLB**: HTTPS 요청이 NLB(L4)로 도착
2. **NLB → Node**: TCP 패킷을 노드로 전달 (L4 포워딩만 수행)
3. **eBPF TPROXY**: 노드에서 eBPF가 트래픽을 가로채 Envoy로 전달
4. **Cilium Envoy → Pod**: HTTPRoute 규칙에 따라 Pod IP(ENI IP)로 직접 라우팅

:::tip
Service 리소스는 실제 트래픽 경로에 있지 않습니다. HTTPRoute의 backendRef로 참조되어 엔드포인트 디스커버리에만 사용됩니다.
:::

### 1.5 ENI 모드와 Gateway API의 관계

- **NLB + Envoy 조합**: NLB가 L4 로드밸런싱, Envoy가 L7 라우팅 담당
- **Cilium Operator**: ENI 생성/관리 및 Gateway Controller 역할 수행
- **네이티브 라우팅**: Envoy가 Pod의 ENI IP로 직접 트래픽 전달 (Service 우회)
- **통합 관측성**: Hubble을 통해 Gateway 트래픽 모니터링 가능
- **Network Policy 통합**: Ingress 트래픽에도 CiliumNetworkPolicy 적용 가능

:::info 상세 정보
Cilium AWS ENI 문서 참조
:::

---

## 2. 사전 요구사항 체크리스트

### 2.1 EKS 클러스터 요구사항

:::tip
Cilium DaemonSet은 hostNetwork: true로 실행되어 CNI 없이도 설치 가능합니다. 테인트를 사용하면 Cilium이 준비되기 전까지 다른 파드가 스케줄링되지 않습니다.
:::

:::tip EKS Auto Mode와 Cilium
EKS Auto Mode는 자체 VPC CNI를 자동 관리합니다. Cilium ENI 모드를 사용하려면 Self-managed 노드가 필요합니다. Auto Mode 클러스터에서 Cilium의 고급 기능(Hubble, Network Policy 강화)이 필요한 경우, Cilium을 오버레이 모드로 추가 배포할 수 있습니다.
:::

### 2.2 VPC 및 서브넷 요구사항

### 2.3 IAM 권한 요구사항

- `ec2:CreateNetworkInterface`
- `ec2:DeleteNetworkInterface`
- `ec2:DescribeNetworkInterfaces`
- `ec2:AttachNetworkInterface`
- `ec2:ModifyNetworkInterfaceAttribute`
- `ec2:AssignPrivateIpAddresses`
- `ec2:UnassignPrivateIpAddresses`

### 2.4 네트워크 요구사항

:::info 상세 요구사항
Cilium 설치 사전 요구사항 참조
:::

---

## 3. 설치 흐름 개요

### 3.1 설치 단계 요약

**신규 클러스터 (권장):**

```text
1. EKS 클러스터 생성 (--bootstrapSelfManagedAddons false 옵션 사용)
   └─→ 기본 VPC CNI, CoreDNS, kube-proxy 설치 건너뛰기
   └─→ 노드 테인트 적용: node.cilium.io/agent-not-ready=true:NoExecute

2. Gateway API CRDs 설치
   └─→ kubectl apply -f gateway-api-crds.yaml

3. Cilium Helm 저장소 추가
   └─→ helm repo add cilium https://helm.cilium.io/

4. Cilium Helm 설치 (hostNetwork로 실행되어 CNI 없이 설치 가능)
   └─→ helm install cilium cilium/cilium --version 1.19.0 --values values.yaml

5. CoreDNS 설치 (Cilium 설치 후)
   └─→ kubectl apply -f coredns.yaml 또는 EKS 애드온으로 설치

6. 설치 검증
   └─→ cilium status --wait

7. Gateway 리소스 생성
   └─→ GatewayClass → Gateway → HTTPRoute
```

**기존 클러스터 (다운타임 발생):**

```text
1. 기존 워크로드 백업/준비

2. aws-node DaemonSet 삭제
   └─→ kubectl -n kube-system delete daemonset aws-node

3. Cilium 설치
   └─→ helm install cilium cilium/cilium --version 1.19.0 --values values.yaml

4. 기존 파드 재시작 (네트워킹 복구)
   └─→ kubectl rollout restart deployment -n <namespace>
```

:::tip
Cilium DaemonSet은 hostNetwork: true로 실행되므로 CNI가 없는 상태에서도 노드의 호스트 네트워크를 통해 설치됩니다.
:::

### 3.2 주요 Helm Values 개요

```yaml
# 핵심 설정 - 전체 옵션은 공식 문서 참조
eni:
  enabled: true
  awsEnablePrefixDelegation: true  # IP 용량 확장

ipam:
  mode: eni

routingMode: native  # 네이티브 라우팅 (터널링 비활성화)

gatewayAPI:
  enabled: true

hubble:
  enabled: true
  relay:
    enabled: true
  ui:
    enabled: true

operator:
  replicas: 2  # 고가용성
```

### 3.3 주요 구성 결정 사항

### 3.4 Gateway 노출 방식 비교

:::tip 권장사항
프로덕션 환경에서는 NLB + Cilium Gateway API 조합을 권장합니다. NLB가 L4 로드밸런싱과 헬스체크를 담당하고, Cilium Envoy가 L7 라우팅을 처리합니다.
:::

📚 **상세 설치 가이드**: Cilium Helm 설치 문서

---

## 4. Gateway API 구성 개요

### 4.1 리소스 계층 구조

```text
GatewayClass (클러스터 범위)
    │
    └─→ Gateway (네임스페이스 범위)
            │
            └─→ HTTPRoute (네임스페이스 범위)
                    │
                    └─→ Service → Pod
```

### 4.2 역할 분리

### 4.3 기본 리소스 예제

**GatewayClass:**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cilium
spec:
  controllerName: io.cilium/gateway-controller
```

**Gateway (NLB 사용):**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
  namespace: default
  annotations:
    # NLB 사용을 위한 annotation (AWS Load Balancer Controller 사용 시)
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  gatewayClassName: cilium
  listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: Same
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - name: my-tls-secret
      allowedRoutes:
        namespaces:
          from: Same
```

**HTTPRoute:**

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-route
  namespace: default
spec:
  parentRefs:
    - name: my-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service  # Service는 엔드포인트 디스커버리용
          port: 80
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: web-service
          port: 80
```

:::tip
Gateway 리소스를 생성하면 Cilium이 자동으로 LoadBalancer 타입 Service를 생성합니다. AWS Load Balancer Controller가 설치되어 있으면 annotation에 따라 NLB가 프로비저닝됩니다.
:::

📚 **상세 구성 가이드**: Cilium Gateway API 문서

---

## 5. 성능 최적화 고려사항

### 5.1 NLB + Cilium Envoy 조합의 이점

- **NLB (L4)**: 고성능 TCP 로드밸런싱, 낮은 지연, 자동 스케일링
- **Cilium Envoy (L7)**: 유연한 HTTP 라우팅, TLS 종료, 헤더 기반 라우팅
- **eBPF TPROXY**: 커널 레벨에서 투명한 트래픽 전달, kube-proxy 우회

### 5.2 ENI 및 IP 관리

- **Prefix Delegation 활성화**: `awsEnablePrefixDelegation: true`로 노드당 IP 용량 대폭 증가
- **초과 IP 해제**: `awsReleaseExcessIPs: true`로 미사용 IP 반환
- **서브넷 크기**: 워크로드 규모에 맞는 충분한 CIDR 블록 할당

### 5.3 BPF 튜닝

- **맵 사전 할당**: `bpf.preallocateMaps: true`로 런타임 할당 오버헤드 감소
- **맵 크기 조정**: 대규모 클러스터에서 `bpf.mapDynamicSizeRatio` 조정
- **LRU 맵**: 연결 추적 테이블 크기 최적화

### 5.4 라우팅 최적화

- **네이티브 라우팅**: `routingMode: native`로 오버레이 오버헤드 제거
- **Maglev 로드밸런싱**: 일관된 해싱으로 연결 분산 개선
- **XDP 가속**: 지원 인스턴스에서 `loadBalancer.acceleration: native` 활성화

### 5.5 인스턴스 타입 고려사항

📚 **상세 튜닝 가이드**: Cilium 성능 튜닝 문서

---

## 6. 고급 기능

### BGP Control Plane v2

Cilium 1.16+부터 BGP Control Plane v2가 도입되어 온프레미스 및 하이브리드 환경에서의 네트워킹이 크게 개선되었습니다:

- **CiliumBGPPeeringPolicy** CRD로 BGP 피어링 설정 관리
- **LoadBalancer IP 광고**: 외부 로드밸런서 없이 서비스 IP를 직접 광고
- **Multi-hop BGP**: 복잡한 네트워크 토폴로지 지원
- **하이브리드 환경**: EKS Hybrid Nodes와 온프레미스 네트워크 간 직접 라우팅

---

## 7. 운영 고려사항

### 7.1 관측성 도구

**Hubble:**

- 실시간 네트워크 플로우 가시성
- 서비스 맵 시각화
- L7 프로토콜 관측

**Prometheus 메트릭:**

- Cilium Agent 메트릭
- Gateway 트래픽 메트릭
- ENI 할당 메트릭

**Grafana 대시보드:**

- Cilium 공식 대시보드 제공
- Gateway API 트래픽 모니터링

### 7.2 Source IP 보존

Cilium Gateway API는 `externalTrafficPolicy: Local` 설정 없이도 Source IP를 보존합니다:

- **X-Forwarded-For**: 원본 클라이언트 IP 포함
- **X-Envoy-External-Address**: 신뢰할 수 있는 클라이언트 주소

```yaml
# 애플리케이션에서 헤더 확인
X-Forwarded-For: <client-ip>, <nlb-ip>
X-Envoy-External-Address: <client-ip>
```

:::warning
TLS Passthrough 사용 시에는 TCP 프록시로 동작하므로 Source IP가 Envoy IP로 보입니다.
:::

### 7.3 주요 검증 명령어

```bash
# Cilium 상태 확인
cilium status --wait

# 연결성 테스트
cilium connectivity test

# Gateway 리소스 확인
kubectl get gatewayclass,gateway,httproute -A

# Gateway 상세 상태
kubectl describe gateway <gateway-name>

# Hubble 네트워크 플로우 관찰
hubble observe --namespace default

# ENI 상태 확인
kubectl get ciliumnodes -o wide
```

### 7.4 일반적인 문제 및 해결 방향

📚 **상세 문제해결 가이드**: Cilium 트러블슈팅 문서

---

## 8. 공식 문서 링크 모음

### 8.1 Cilium 문서

### 8.2 Kubernetes Gateway API 문서

### 8.3 AWS 문서

---

## 9. 다음 단계

1. 공식 문서를 참조하여 환경에 맞는 세부 설정 적용
2. Hubble을 활용한 네트워크 모니터링 구성
