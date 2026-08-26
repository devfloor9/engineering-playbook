---
title: 노드 인증 방식 — SSM vs IAM Roles Anywhere
description: "EKS Hybrid Nodes의 IAM 자격 증명 공급자 선택 가이드 — SSM hybrid activation과 IAM Roles Anywhere 비교, Vault PKI 연동 패턴, Hybrid Nodes IAM role 최소 권한, 자격 증명 수명주기 관리를 다룹니다."
created: "2026-08-25"
last_update:
  date: "2026-08-26"
  author: YoungJoon Jeong
reading_time: 9
tags:
  - eks
  - hybrid-node
  - security
  - iam
  - scope:design
keywords:
  - SSM hybrid activation
  - IAM Roles Anywhere
  - nodeadm
  - X.509
sidebar_label: 노드 인증 방식
category: hybrid-multicloud
---

## 개요

하이브리드 노드는 EC2 인스턴스 프로파일이 없으므로 온프레미스용 IAM 자격 증명 공급자가 필요합니다. 선택지는 SSM hybrid activation과 IAM Roles Anywhere 두 가지이며, `nodeadm install`의 `--credential-provider` 옵션으로 지정합니다. 본 문서는 두 방식의 동작 차이, 조직 유형별 선택 기준, 그리고 자격 증명 수명주기 관리 관점의 권장 사항을 다룹니다.

## 동작 방식 비교

| 항목 | SSM hybrid activation | IAM Roles Anywhere |
|------|----------------------|--------------------|
| 인증 기반 | activation code/ID로 등록된 SSM 관리형 인스턴스 | X.509 인증서 (사설 CA 신뢰 앵커) |
| 사전 인프라 | 불필요 | PKI(사설 CA)·인증서 배포 체계 필요 |
| 자격 증명 갱신 | SSM agent가 자동 갱신 (5분 주기 heartbeat) | 인증서 기반 세션 갱신 — 인증서 수명주기 관리 필요 |
| nodeadm 옵션 | `--credential-provider ssm` | `--credential-provider iam-ra` |
| 방화벽 대상 | `ssm.<region>`, `amazon-ssm-<region>.s3.<region>` | `rolesanywhere.<region>`, `rolesanywhere.amazonaws.com` |
| 부가 효과 | 노드가 SSM 관리형 인스턴스로 등록 — Session Manager 접속·패치 관리 연계 가능 | 기존 PKI 거버넌스와 통합 — 인증서 폐기로 노드 자격 즉시 차단 |
| 운영 부담 | activation 만료·수량 관리 | CA 운영, 인증서 발급·갱신·폐기 자동화 |

## 선택 기준

- **PKI를 운영하지 않는 조직**: SSM이 기본 선택입니다. 별도 인프라 없이 activation 발급만으로 시작할 수 있고, 공식 quickstart 경로도 SSM 기준입니다.
- **사설 CA·인증서 거버넌스를 이미 갖춘 조직**(금융·통신 보안팀 관리 체계): IAM Roles Anywhere가 기존 통제 체계와 자연스럽게 통합됩니다. 인증서 폐기가 곧 노드 자격 차단이라는 운영 모델을 선호하는 보안 조직에 적합합니다.
- **기존 HashiCorp Vault 운영 조직**: Vault가 독립적인 자격 증명 공급자로 지원되는 것은 아니며, Vault의 PKI Secrets Engine을 사설 CA로 사용해 IAM Roles Anywhere의 신뢰 앵커(trust anchor)로 등록하는 통합 패턴이 AWS 공식 블로그로 제공됩니다. 기존 Vault 기반 시크릿·인증서 관리 체계를 유지하면서 하이브리드 노드 인증에 연결할 수 있습니다.
- 어느 쪽이든 노드별 IAM role은 Hybrid Nodes IAM role 하나로 수렴하며, 방화벽 등록 대상 엔드포인트가 달라진다는 점([Zone C 도메인 목록](../networking/firewall-connectivity.md#zone-c-aws-서비스-엔드포인트-outbound-도메인))을 신청서에 반영해야 합니다.

:::note nodeadm 버전 주의 (SSM)
SSM을 자격 증명 공급자로 사용하는 경우 `nodeadm` 1.0.19 이상이 필요합니다. 이전 버전은 만료된 SSM 서명 키를 포함해 `nodeadm install`/`upgrade`가 서명 검증 오류로 실패합니다. 업그레이드 시 유의점은 [업그레이드와 수명주기 관리](../operations-cost/upgrade-lifecycle)를 참조합니다.
:::

## SSM Hybrid Activation 구조적 특징

SSM 방식을 선택하면 다음 두 가지 구조적 특징이 운영 설계에 영향을 줍니다.

- **노드 이름이 `mi-` 관리형 인스턴스 ID로 고정됩니다.** SSM hybrid activation으로 등록된 노드는 SSM이 발급하는 관리형 인스턴스 ID(`mi-` 접두사, 예: `mi-0f1c2d3e4a5b6c7d8`)가 Kubernetes 노드 이름이 되며, 임의의 노드 이름을 지정할 수 없습니다. 호스트명 기반 노드 식별·자동화 스크립트를 운영하는 조직은 노드 레이블(`--node-labels`)로 식별 체계를 보완해야 합니다. 노드 이름을 직접 지정해야 하는 요건(사내 CMDB 연동 등)이 있다면 IAM Roles Anywhere가 대안입니다 — 인증서 CN이 노드 이름이 됩니다.
- **activation은 만료 기한을 갖습니다.** 기본 24시간, 최대 30일까지 설정할 수 있으며(activation당 등록 한도 최대 1,000대), 만료된 activation으로는 신규 노드를 등록할 수 없습니다(기존 등록 노드의 자격 증명 갱신은 activation 만료와 무관하게 SSM agent가 계속 수행). 대규모 증설 시 만료 전 등록 완료가 가능하도록 activation 발급을 증설 일정과 묶어 관리하고, 클러스터당 activation 1개를 클러스터 ARN 태그와 함께 운영하는 구성이 권장됩니다.
- **단선 복구 지연을 감안합니다.** SSM 임시 자격 증명은 1시간 유효·자동 갱신되지만, 네트워크 단선 시 SSM agent의 재시도 백오프가 최대 30분까지 늘어나 재연결 후 노드 복귀에 최대 30분이 걸릴 수 있습니다(강제 갱신은 `amazon-ssm-agent` 재시작). IAM Roles Anywhere는 kubelet이 요청 시점에 자격 증명을 발급받으므로 연결 복구 후 수 초 내 재인증됩니다 — 단선이 잦은 환경에서는 이 차이가 선택 기준이 됩니다.

```bash
# 30일 유효·최대 10대 등록 activation 발급 예시 (만료일은 발급일 +30일 이내로 지정)
aws ssm create-activation \
  --default-instance-name eks-hybrid-nodes \
  --iam-role AmazonEKSHybridNodesRole \
  --registration-limit 10 \
  --expiration-date "2026-09-25T00:00:00" \
  --region us-west-2
```

## IAM Roles Anywhere 구성과 인증서 체인 검증

사설 PKI(자체 CA 또는 HashiCorp Vault PKI)로 IAM Roles Anywhere를 구성할 때 `nodeadm` NodeConfig는 다음 형식을 따릅니다.

```yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: us-west-2
  hybrid:
    iamRolesAnywhere:
      nodeName: hybrid-node-01            # 인증서 CN과 일치해야 함
      trustAnchorArn: arn:aws:rolesanywhere:us-west-2:ACCOUNT_ID:trust-anchor/TA_ID
      profileArn: arn:aws:rolesanywhere:us-west-2:ACCOUNT_ID:profile/PROFILE_ID
      roleArn: arn:aws:iam::ACCOUNT_ID:role/AmazonEKSHybridNodesRole
      certificatePath: /etc/iam/pki/node.crt   # 인증서 (체인 포함 시 결합 순서 준수)
      privateKeyPath: /etc/iam/pki/node.key
```

구성 시 가장 잦은 실패 지점은 **인증서 체인 파일의 결합 순서**입니다. 중간 CA를 사용하는 PKI(Vault 포함)에서 인증서 파일은 반드시 다음 순서로 결합합니다.

```text
node.crt 파일 구성 (위 → 아래 순서 엄수)
① 노드(leaf) 인증서
② 중간 CA 체인 (ca_chain — 발급 CA부터 상위 순)
③ 루트 CA (trust anchor에 등록된 CA까지)
```

```bash
# Vault PKI 발급 결과의 올바른 결합 예시
vault write -format=json pki_int/issue/eks-hybrid \
  common_name="hybrid-node-01" ttl="8760h" > issued.json

jq -r '.data.certificate' issued.json  >  node.crt   # ① leaf
jq -r '.data.ca_chain[]'  issued.json  >> node.crt   # ② 중간 CA 체인
jq -r '.data.private_key' issued.json  >  node.key

# 결합 순서 검증 — 체인이 올바르면 OK 출력
openssl verify -CAfile root-ca.crt -untrusted node.crt node.crt
```

순서가 뒤바뀌거나 중간 CA가 누락되면 IAM Roles Anywhere의 `CreateSession` 호출이 신뢰 체인 검증 실패로 거부되고, 노드는 `AccessDeniedException` 또는 인증서 검증 오류로 조인에 실패합니다. 다음 세 가지를 배포 자동화의 검증 게이트로 고정합니다.

1. `nodeName`과 인증서 CN(Common Name) 일치 여부 — `nodeName`은 64자 이하
2. leaf → 중간 CA → 루트 CA 결합 순서와 체인 완결성 (`openssl verify`)
3. trust anchor에 등록된 CA가 체인의 종점과 일치하는지
4. IAM Roles Anywhere 프로파일의 **커스텀 role session name 허용(`acceptRoleSessionName`) 활성화** 여부 — 비활성 상태면 nodeName 기반 세션 생성이 거부됨

## EKS Access Entry: HYBRID_LINUX 매핑 (필수)

자격 증명 공급자 구성과 별개로, 클러스터 측에서 Hybrid Nodes IAM role을 **`HYBRID_LINUX` 타입 access entry**로 등록해야 노드 조인이 승인됩니다. 이 매핑이 없으면 자격 증명 발급까지 성공해도 kubelet의 API server 인증이 `Unauthorized`로 거부됩니다.

```bash
aws eks create-access-entry \
  --cluster-name my-hybrid-cluster \
  --principal-arn arn:aws:iam::ACCOUNT_ID:role/AmazonEKSHybridNodesRole \
  --type HYBRID_LINUX

# 등록 확인
aws eks list-access-entries --cluster-name my-hybrid-cluster
```

- `HYBRID_LINUX` 타입 access entry에는 Kubernetes 그룹·access policy를 추가로 연결할 수 없으며, EKS가 노드 권한(`system:nodes` 상당)을 자동 부여합니다.
- 클러스터 인증 모드가 `API` 또는 `API_AND_CONFIG_MAP`이어야 합니다. 하이브리드 노드는 `aws-auth` ConfigMap 방식을 지원하지 않습니다.
- `nodeadm init`은 이 access entry의 존재를 사전 검증합니다(`eks:ListAccessEntries` 권한 필요 — 위 최소 권한 표 참조).

## Hybrid Nodes IAM Role 최소 권한

Hybrid Nodes IAM role에는 다음 권한이 필요합니다. 공식 문서가 명시하는 최소 구성이며, 워크로드용 권한을 이 role에 추가하지 않습니다.

| 권한 | 용도 | 미부여 시 대안 |
|------|------|---------------|
| `eks:DescribeCluster` | `nodeadm`이 API 엔드포인트·CA 번들·Service CIDR 등 클러스터 정보 조회 | NodeConfig에 해당 값을 직접 기입 |
| `eks:ListAccessEntries` | `nodeadm`이 클러스터 access entry 사전 검증 | `nodeadm init`에 `--skip cluster-access-validation` 지정 |
| `AmazonEC2ContainerRegistryPullOnly` (관리형 정책) | kubelet의 ECR 컨테이너 이미지 pull | 없음 (필수) |
| `AmazonSSMManagedInstanceCore` (관리형 정책, SSM 사용 시) | hybrid activation 등록과 자격 증명 갱신 | 없음 (SSM 필수) |
| `ssm:DeregisterManagedInstance` + `ssm:DescribeInstanceInformation` (SSM 사용 시) | `nodeadm uninstall`의 관리형 인스턴스 등록 해제 | 노드 제거 시 SSM 항목 수동 정리 |
| `eks-auth:AssumeRoleForPodIdentity` (선택) | EKS Pod Identity Agent의 Pod 자격 증명 발급 | Pod Identity 미사용 시 불필요 |

`ssm:DeregisterManagedInstance`는 공식 CloudFormation 예제처럼 해당 hybrid activation과 연결된 인스턴스로 리소스 조건을 좁혀 부여하는 것이 권장됩니다.

## 자격 증명 수명주기 관리

인증 방식 결정 이후에는 자격 증명의 발급·갱신·폐기 흐름을 운영 절차로 정착시켜야 합니다.

- **SSM**: activation은 만료 기한과 등록 가능 수량을 갖습니다. 노드 증설 계획에 맞춰 activation을 발급·관리하고, 만료된 activation으로는 신규 노드를 등록할 수 없다는 점을 증설 런북에 반영합니다. 등록 해제된 노드의 SSM 관리형 인스턴스 항목은 정리 대상입니다.
- **IAM Roles Anywhere**: 인증서 만료가 곧 노드 인증 실패입니다. 인증서 갱신 자동화(만료 전 교체)와 만료 임박 알림을 구성하고, 유출 의심 시 인증서 폐기(CRL) → 노드 자격 즉시 차단 절차를 보안 대응 플레이북에 포함합니다. 임시 자격 증명의 세션 유효 기간은 기본 1시간이며 최대 12시간까지 설정할 수 있습니다.
- **최소 권한**: Hybrid Nodes IAM role에는 노드 운영에 필요한 권한만 부여하고, 워크로드 권한은 IRSA 또는 EKS Pod Identity로 Pod 단위 분리합니다. 노드 role에 워크로드용 광범위 권한을 얹는 구성은 피합니다.

## 권장 사항 요약

- PKI 부재 조직은 SSM, 사설 CA 거버넌스 보유 조직은 IAM Roles Anywhere를 선택합니다.
- SSM 사용 시 nodeadm 1.0.19 이상을 사용하고, 노드 이름이 `mi-` ID로 고정되는 특성을 자동화 체계에 반영합니다.
- IAM Roles Anywhere는 인증서 결합 순서(leaf → 중간 CA → 루트 CA)와 CN=nodeName 일치를 배포 검증 게이트로 고정합니다.
- Hybrid Nodes IAM role을 `HYBRID_LINUX` access entry로 등록하는 절차를 클러스터 생성 직후 단계에 포함합니다.
- 선택한 방식의 자격 증명 엔드포인트를 방화벽 신청서(Zone A·C)에 반영합니다.
- 자격 증명 갱신·폐기 절차를 증설 런북과 보안 대응 플레이북에 문서화합니다.
- 워크로드 권한은 노드 role이 아닌 IRSA/Pod Identity로 분리합니다.

## 참고 자료

### 공식 문서
- [Prepare credentials for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-creds.html) — SSM·IAM Roles Anywhere 자격 증명 구성
- [Amazon EKS Hybrid Nodes overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Hybrid Nodes 전제 조건
- [IAM Roles Anywhere User Guide](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) — 신뢰 앵커·프로파일 구성
- [Grant IAM users access to Kubernetes with EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html) — HYBRID_LINUX 타입 access entry
- [SSM CreateActivation API](https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_CreateActivation.html) — activation 만료(기본 24시간·최대 30일)·등록 수량 파라미터

### 기술 블로그
- [Extending EKS with Hybrid Nodes: IAM Roles Anywhere and HashiCorp Vault — AWS Containers Blog](https://aws.amazon.com/blogs/containers/extending-eks-with-hybrid-nodes-iam-roles-anywhere-and-hashicorp-vault/) — Vault PKI를 신뢰 앵커로 사용하는 통합 패턴

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — nodeadm 등록 흐름
- [방화벽·DNS 사전 등록 가이드](../networking/firewall-connectivity.md) — 인증 방식별 엔드포인트 등록
