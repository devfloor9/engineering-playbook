---
title: 방화벽·DNS 사전 등록과 TGW 토폴로지
description: "EKS Hybrid Nodes 도입 시 방화벽·네트워크 조직에 제출할 5존 사전 등록 룰 표, FQDN 와일드카드 미지원 환경 대응, Transit Gateway 토폴로지와 온프레미스 LB 경로 설계를 다룹니다."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 10
tags:
  - eks
  - hybrid-node
  - networking
  - firewall
  - security
  - scope:impl
keywords:
  - Transit Gateway
  - Route 53 Resolver
  - FQDN
  - "602401143452"
sidebar_label: 방화벽 & TGW 토폴로지
category: hybrid-multicloud
---

## 개요

방화벽·네트워크 조직이 분리된 환경에서는 구축 전에 등록 요청서를 제출해야 하며, 누락 항목은 곧 구축 지연입니다. 본 문서는 방화벽 등록 지점을 5개 존으로 구분한 신청서 수준의 룰 표, FQDN 와일드카드 미지원 환경 대응, 그리고 Transit Gateway(TGW) 토폴로지와 온프레미스 LB 경로 설계를 다룹니다.

## 방화벽 등록 5존 구조

| Zone | 등록 지점 | 관리 주체 (통상) |
|----|-----------|------------------|
| A | 온프레미스 방화벽 (상시 운영 룰) | 네트워크·보안팀 |
| B | AWS 보안 그룹 | 클라우드 플랫폼팀 |
| C | 온프레미스 → AWS 서비스 엔드포인트 (outbound 도메인) | 네트워크·보안팀 |
| D | 컨트롤 플레인 ENI 대역·DNS | 양쪽 협의 |
| E | 권장 추가 룰 (CNI·ICMP) | 네트워크·보안팀 |

### Zone A: 온프레미스 방화벽 상시 운영 룰

공식 문서의 상시 운영(ongoing operations) 요건을 신청서 형식으로 정리하면 다음과 같습니다.

| 방향 | 프로토콜/포트 | 출발지 | 목적지 | 사유 |
|------|--------------|--------|--------|------|
| Outbound | TCP 443 | Node CIDR | EKS 컨트롤 플레인 ENI 서브넷 CIDR | kubelet → Kubernetes API server |
| Outbound | TCP 443 | Pod CIDR | EKS 컨트롤 플레인 ENI 서브넷 CIDR | Pod → Kubernetes API server |
| Outbound | TCP 443 | Node CIDR | SSM 서비스 엔드포인트 | SSM 자격 증명 갱신 + 5분 주기 heartbeat (SSM 사용 시) |
| Outbound | TCP 443 | Node CIDR | IAM Roles Anywhere 엔드포인트 | 자격 증명 갱신 (IAM RA 사용 시) |
| Outbound | TCP 443 | Pod CIDR | STS 리전 엔드포인트 | IRSA 사용 Pod 한정 |
| Outbound | TCP 443 | Node CIDR | EKS Auth 엔드포인트 | EKS Pod Identity 사용 시 |
| **Inbound** | TCP 10250 | EKS 컨트롤 플레인 ENI 서브넷 CIDR | Node CIDR | **Kubernetes API server → kubelet** (`kubectl logs`/`exec`) |
| **Inbound** | TCP 웹훅 포트 | EKS 컨트롤 플레인 ENI 서브넷 CIDR | Pod CIDR | API server → 웹훅 (하이브리드 노드에서 웹훅 실행 시) |
| In/Out | TCP·UDP 53 | Pod CIDR | Pod CIDR (+ 클라우드 CoreDNS 배치 시 VPC CIDR) | Pod → CoreDNS |
| In/Out | 앱 포트 | Pod CIDR | Pod CIDR | Pod 간 통신 |

:::warning 방향에 주의
TCP 10250은 **AWS(컨트롤 플레인)에서 온프레미스로 들어오는 inbound**입니다. "쿠버네티스 포트니까 나가는 방향"으로 신청하는 실수가 잦으며, 이 경우 노드 등록은 성공하지만 `kubectl logs`/`exec`가 timeout으로 실패합니다. 또한 TCP 443은 온프레미스에서 나가는 outbound이며 "양방향"이 아닙니다. EKS에는 6443 포트가 존재하지 않으므로 신청 대상이 아닙니다.
:::

웹훅 포트는 애드온마다 다릅니다(예: 443, 8443, 9443). 배포 예정 애드온의 웹훅 Service 정의를 확인해 목록을 확정합니다. Hybrid Nodes Gateway를 사용하면 웹훅 inbound 룰과 Pod CIDR 관련 온프렘 룰이 불필요해지는 대신 **UDP 8472(게이트웨이 노드 IP ↔ 하이브리드 노드 IP, 양방향)** 룰이 추가됩니다.

방화벽이 stateful(연결 추적 기반)이라는 전제로 응답 패킷 룰은 생략했습니다. stateless ACL 장비가 경로에 있다면 역방향 ephemeral 포트 룰이 별도로 필요합니다.

### Zone B: AWS 보안 그룹

EKS는 원격 네트워크가 구성된 클러스터의 **inbound 규칙을 자동 생성**합니다. outbound는 SG 기본값(전체 허용)에 의존하므로, outbound를 제한 운영하는 조직은 아래 규칙을 명시적으로 등록해야 합니다.

| 방향 | 프로토콜/포트 | 대상 | 사유 | 생성 주체 |
|------|--------------|------|------|-----------|
| Inbound | TCP 443 | Node CIDR | kubelet → API server | EKS 자동 생성 |
| Inbound | TCP 443 | Pod CIDR | Pod → API server (CNI NAT 미사용 시) | EKS 자동 생성 |
| Outbound | TCP 10250 | Node CIDR | API server → kubelet | **수동 등록** (제한 운영 시) |
| Outbound | TCP 웹훅 포트 | Pod CIDR | API server → 웹훅 | **수동 등록** (제한 운영 시) |
| In+Out | UDP 8472 | 게이트웨이 노드 ↔ 하이브리드 노드 | VXLAN (Gateway 사용 시, 게이트웨이 SG) | 수동 등록 |

운영상 주의 두 가지입니다. ① SG inbound 규칙 기본 한도는 60개로, 한도 근접 시 자동 생성 규칙이 적용되지 않을 수 있어 수동 보완이 필요합니다. ② 클러스터에서 원격 네트워크를 제거해도 EKS는 대응 SG 규칙을 자동 삭제하지 않으므로 정리는 운영자 책임입니다.

### Zone C: AWS 서비스 엔드포인트 (outbound 도메인)

**설치·업그레이드 시** 필요한 도메인입니다(OS 이미지 빌드 시점에 반영하거나 호스트별 런타임 허용).

| 컴포넌트 | URL | 포트 |
|----------|-----|------|
| EKS 노드 아티팩트 (S3) | `hybrid-assets.eks.amazonaws.com` | TCP 443 |
| EKS 서비스 | `eks.<region>.amazonaws.com` | TCP 443 |
| ECR API | `api.ecr.<region>.amazonaws.com` | TCP 443 |
| EKS 애드온 이미지 레지스트리 | 리전별 상이 — 아래 [와일드카드 미지원 대응](#fqdn-와일드카드-미지원-환경-대응) 참조 | TCP 443 |
| SSM 바이너리 | `amazon-ssm-<region>.s3.<region>.amazonaws.com` (SSM 사용 시) | TCP 443 |
| SSM 서비스 | `ssm.<region>.amazonaws.com` (SSM 사용 시) | TCP 443 |
| IAM Roles Anywhere 바이너리 | `rolesanywhere.amazonaws.com` (IAM RA 사용 시) | TCP 443 |
| IAM Roles Anywhere 서비스 | `rolesanywhere.<region>.amazonaws.com` (IAM RA 사용 시) | TCP 443 |
| OS 패키지 저장소 | OS·지역별 상이 (yum/apt/snap 저장소) | TCP 443 |

**상시 운영 시**에는 Zone A 표의 자격 증명 엔드포인트(ssm/rolesanywhere/sts/eks-auth)와 `eks.<region>` 접근이 유지되어야 합니다. Cilium·Gateway 차트를 사용하는 경우 `public.ecr.aws`(Amazon ECR Public)도 허용 대상입니다.

### Zone D: 컨트롤 플레인 ENI 대역과 DNS

**ENI IP는 고정이 아닙니다.** 클러스터 업그레이드 등 변경 시 기존 ENI가 삭제·재생성되므로 개별 IP 단위 방화벽 등록은 반드시 깨집니다. [CIDR 설계의 전용 서브넷 전략](./cidr-network-design.md#컨트롤-플레인-eni-전용-서브넷-전략)대로 /28 전용 서브넷 2개를 클러스터에 전달하고, 방화벽에는 **서브넷 CIDR 2개를 등록**합니다.

**DNS**: 온프레미스 노드가 AWS 내부 도메인(프라이빗 엔드포인트 등)을 조회해야 하면 Route 53 Resolver inbound endpoint를 VPC에 배치하고 온프레미스 DNS가 해당 존을 포워딩하도록 구성합니다. 반대로 클라우드 Pod가 온프레미스 도메인(사내 레지스트리 등)을 조회해야 하면 outbound endpoint + forward rule을 구성합니다.

```bash
# inbound endpoint (온프렘 → AWS 조회)
aws route53resolver create-resolver-endpoint \
  --creator-request-id hybrid-inbound-001 \
  --name hybrid-inbound-endpoint \
  --security-group-ids sg-resolver-xxxxx \
  --direction INBOUND \
  --ip-addresses SubnetId=subnet-xxxxx SubnetId=subnet-yyyyy

# outbound endpoint + 사내 도메인 포워딩 (AWS → 온프렘 조회)
aws route53resolver create-resolver-rule \
  --creator-request-id hybrid-fwd-001 \
  --name on-prem-dns-rule \
  --rule-type FORWARD \
  --domain-name company.local \
  --target-ips Ip=192.168.1.53,Port=53 \
  --resolver-endpoint-id rslvr-out-xxxxx
```

Resolver endpoint IP도 방화벽 대상(TCP·UDP 53)이므로 Zone A 신청서에 포함합니다.

### Zone E: 권장 추가 룰

| 항목 | 룰 | 사유 |
|------|-----|------|
| CNI 자체 포트 | Cilium: 노드 간 UDP 8472(VXLAN)·TCP 4240(health)·ICMP echo / Calico: TCP 179(BGP) 등 | 공식 문서가 CNI별 포트의 별도 허용을 요구 — 각 CNI 문서 기준으로 확정 |
| PMTUD | ICMP Type 3 Code 4 (Fragmentation Needed) 허용 | 오버레이 캡슐화로 유효 MTU가 줄어드는 환경에서 경로 MTU 탐색 실패 시 대용량 응답이 조용히 유실됨 |
| 모니터링 | 관측 스택의 스크래핑 경로 (예: AMP·Prometheus → Pod CIDR) | 관측 대상·도구별로 확정 |

## FQDN 와일드카드 미지원 환경 대응

FQDN 방화벽이 와일드카드(`*.amazonaws.com`)를 지원하지 않는 환경에서는 도메인을 개별 열거해야 합니다. 서울 리전(ap-northeast-2) 기준 구체 값은 다음과 같습니다.

| 용도 | 도메인 (ap-northeast-2) |
|------|------------------------|
| EKS 노드 아티팩트 | `hybrid-assets.eks.amazonaws.com` |
| EKS API | `eks.ap-northeast-2.amazonaws.com` |
| ECR API | `api.ecr.ap-northeast-2.amazonaws.com` |
| **EKS 애드온 이미지 레지스트리** | `602401143452.dkr.ecr.ap-northeast-2.amazonaws.com` |
| ECR Public (Cilium·Gateway 차트) | `public.ecr.aws` |
| SSM | `ssm.ap-northeast-2.amazonaws.com`, `amazon-ssm-ap-northeast-2.s3.ap-northeast-2.amazonaws.com` |
| IAM Roles Anywhere | `rolesanywhere.ap-northeast-2.amazonaws.com`, `rolesanywhere.amazonaws.com` |
| STS (IRSA 시) | `sts.ap-northeast-2.amazonaws.com` |

애드온 레지스트리 계정 ID `602401143452`는 서울 리전을 포함한 주요 리전 공통이나 **리전별로 다른 계정을 쓰는 리전이 있으므로**(예: ap-southeast-5는 `151610086707`) 대상 리전을 [공식 레지스트리 목록](https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html)에서 확인합니다. ECR pull은 이미지 레이어를 S3에서 받는 경우가 있어, FQDN 제어가 엄격한 환경에서는 프라이빗 레지스트리(Harbor) 미러링 또는 ECR PrivateLink(VPC 엔드포인트) 경유가 현실적인 대안입니다. Harbor 구성은 [Harbor 레지스트리 통합](../storage-registry/harbor-registry.md)을 참조합니다.

## 환경별 등록 요청 체크리스트

dev/stg/prd 환경마다 아래 값을 채워 신청서를 작성합니다.

- [ ] Node CIDR (환경별 온프레미스 대역)
- [ ] Pod CIDR (Gateway 미사용 시에만 온프렘 등록 필요)
- [ ] EKS 컨트롤 플레인 ENI 전용 서브넷 CIDR ×2
- [ ] Zone A 상시 룰 표 (방향 검증 완료본)
- [ ] Zone C 도메인 목록 (인증 방식에 따라 SSM 또는 IAM RA 행 선택)
- [ ] Gateway 사용 시: UDP 8472 룰 (게이트웨이 노드 IP 또는 게이트웨이 서브넷 CIDR ↔ Node CIDR)
- [ ] Route 53 Resolver endpoint IP (DNS 연동 시)
- [ ] 웹훅 포트 목록 (하이브리드 노드에서 웹훅 실행 시)

## TGW 토폴로지

### TGW 기반 하이브리드 연결 구조

공식 네트워킹 가이드는 VGW와 함께 TGW를 표준 연결 옵션으로 다룹니다. TGW 토폴로지에서 점검할 항목은 세 가지입니다.

1. **VPC 라우트 테이블**: Node CIDR(및 풀 라우팅 시 Pod CIDR) 목적지 경로가 TGW attachment를 가리켜야 합니다.
2. **TGW 라우트 테이블**: 온프레미스 방향 attachment(DX Gateway 또는 VPN)로 Node/Pod CIDR가 전파(propagation) 또는 정적 등록되어야 하고, 역방향으로 VPC CIDR가 온프레미스 측에 광고되어야 합니다.
3. **멀티 계정**: 환경별 계정 분리 구조에서는 TGW를 Resource Access Manager(RAM)로 공유하고, TGW 라우트 테이블 격리 정책(환경 간 라우팅 차단 여부)을 명시적으로 설계합니다.

### Gateway와 TGW의 상호작용

Hybrid Nodes Gateway는 TGW 환경에서 문제없이 동작하며, 오히려 TGW 측 관리 항목을 줄입니다.

- **Pod CIDR은 TGW 라우트에서 제외됩니다.** Gateway가 VPC 라우트 테이블에 "Pod CIDR → leader ENI" 경로를 관리하므로, TGW·온프레미스 라우터는 Pod CIDR을 알 필요가 없습니다.
- **VXLAN 트래픽은 노드 IP 간 UDP 8472**로 TGW를 통과합니다. TGW에는 Node CIDR ↔ VPC CIDR 경로만 있으면 됩니다.
- Gateway의 `routeTableIDs`에는 TGW attachment 서브넷을 포함해 **하이브리드 Pod와 통신하는 모든 서브넷의 라우트 테이블**을 열거해야 합니다.

### 온프레미스 LB → 클라우드 Pod(DR) 경로

온프레미스 로드밸런서가 AWS에서 실행 중인 DR Pod로 트래픽을 보내는 구성은 가능합니다. 핵심은 클라우드 Pod의 IP 특성입니다.

- 클라우드 노드의 Pod는 VPC CNI가 **VPC 대역의 IP를 직접 할당**하므로, 온프레미스에서 VPC CIDR로의 라우팅(TGW 경유)만 확보되면 Pod IP가 직접 도달 가능합니다.
- 단 Pod IP는 재스케줄링 시 변경되므로 LB 타겟으로 Pod IP를 정적 등록하는 방식은 취약합니다. **NLB/ALB(내부형)를 AWS 측에 두고 온프레미스 LB는 NLB/ALB의 안정적 엔드포인트를 타겟**으로 하는 계층 구성이 권장됩니다.
- 보안 그룹에서 온프레미스 LB 대역(또는 Node CIDR)의 inbound를 해당 포트로 허용해야 하며, 헬스 체크 경로·포트도 동일하게 허용 대상입니다.

반대 방향(AWS LB → 온프레미스 하이브리드 Pod IP 타겟)은 Pod CIDR 라우팅 또는 Gateway가 전제 조건입니다([기능표](../overview-architecture/hybrid-nodes-fundamentals.md#node-대역-필수-pod-대역-선택-원칙) 참조).

## 권장 사항 요약

- 방화벽 신청은 5존(온프렘 룰·SG·엔드포인트·ENI 대역·권장 룰)으로 구조화해 관리 주체별로 분리 제출합니다.
- TCP 10250의 방향(AWS → 온프렘 inbound)을 신청서에서 반드시 재검증합니다 — 가장 잦은 실수 지점입니다.
- 컨트롤 플레인 ENI는 개별 IP가 아닌 전용 /28 서브넷 CIDR 2개 단위로 등록합니다.
- FQDN 와일드카드 미지원 환경은 리전별 애드온 레지스트리 계정 ID를 공식 목록에서 확인해 개별 등록하고, 장기적으로 Harbor 미러링 또는 ECR PrivateLink를 검토합니다.
- TGW 멀티 계정 구조에서는 RAM 공유와 라우트 테이블 격리 정책을 설계 단계에서 확정합니다.
- 온프렘 LB → 클라우드 워크로드 경로는 Pod IP 직접 타겟 대신 내부형 NLB/ALB를 경유시킵니다.

## 참고 자료

### 공식 문서
- [Prepare networking for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-networking.html) — 방화벽·SG 규칙, 엔드포인트 목록
- [View Amazon container image registries for Amazon EKS add-ons](https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html) — 리전별 애드온 레지스트리 계정 ID
- [Configure webhooks for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-webhooks.html) — 웹훅 포트와 배치 전략

### 관련 문서 (내부)
- [CIDR 설계와 대역 최소화](./cidr-network-design.md) — ENI 전용 서브넷 전략과 신청 대역 산정
- [Hybrid Nodes Gateway 구축과 운영](./hybrid-nodes-gateway.md) — UDP 8472 룰이 필요한 Gateway 구성
- [노드 인증 방식](../security-authn/node-authentication.md) — 인증 방식별 방화벽 대상 엔드포인트 차이
- [Harbor 레지스트리 통합](../storage-registry/harbor-registry.md) — FQDN 제한 환경의 프라이빗 레지스트리 대안
