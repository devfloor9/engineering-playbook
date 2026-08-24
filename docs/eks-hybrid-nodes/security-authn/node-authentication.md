---
title: 노드 인증 방식 — SSM vs IAM Roles Anywhere
description: "EKS Hybrid Nodes의 IAM 자격 증명 공급자 선택 가이드 — SSM hybrid activation과 IAM Roles Anywhere의 동작 방식 비교, 조직 유형별 선택 기준, 자격 증명 수명주기 관리를 다룹니다."
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 4
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
- 어느 쪽이든 노드별 IAM role은 Hybrid Nodes IAM role 하나로 수렴하며, 방화벽 등록 대상 엔드포인트가 달라진다는 점([존 C 도메인 목록](../networking/firewall-connectivity.md#존-c-aws-서비스-엔드포인트-outbound-도메인))을 신청서에 반영해야 합니다.

:::note nodeadm 버전 주의 (SSM)
SSM을 자격 증명 공급자로 사용하는 경우 `nodeadm` 1.0.19 이상이 필요합니다. 이전 버전은 만료된 SSM 서명 키를 포함해 `nodeadm install`/`upgrade`가 서명 검증 오류로 실패합니다.
:::

## 자격 증명 수명주기 관리

인증 방식 결정 이후에는 자격 증명의 발급·갱신·폐기 흐름을 운영 절차로 정착시켜야 합니다.

- **SSM**: activation은 만료 기한과 등록 가능 수량을 갖습니다. 노드 증설 계획에 맞춰 activation을 발급·관리하고, 만료된 activation으로는 신규 노드를 등록할 수 없다는 점을 증설 런북에 반영합니다. 등록 해제된 노드의 SSM 관리형 인스턴스 항목은 정리 대상입니다.
- **IAM Roles Anywhere**: 인증서 만료가 곧 노드 인증 실패입니다. 인증서 갱신 자동화(만료 전 교체)와 만료 임박 알림을 구성하고, 유출 의심 시 인증서 폐기(CRL) → 노드 자격 즉시 차단 절차를 보안 대응 플레이북에 포함합니다.
- **최소 권한**: Hybrid Nodes IAM role에는 노드 운영에 필요한 권한만 부여하고, 워크로드 권한은 IRSA 또는 EKS Pod Identity로 Pod 단위 분리합니다. 노드 role에 워크로드용 광범위 권한을 얹는 구성은 피합니다.

## 권장 사항 요약

- PKI 부재 조직은 SSM, 사설 CA 거버넌스 보유 조직은 IAM Roles Anywhere를 선택합니다.
- SSM 사용 시 nodeadm 1.0.19 이상을 사용합니다.
- 선택한 방식의 자격 증명 엔드포인트를 방화벽 신청서(존 A·C)에 반영합니다.
- 자격 증명 갱신·폐기 절차를 증설 런북과 보안 대응 플레이북에 문서화합니다.
- 워크로드 권한은 노드 role이 아닌 IRSA/Pod Identity로 분리합니다.

## 참고 자료

### 공식 문서
- [Prepare credentials for hybrid nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-creds.html) — SSM·IAM Roles Anywhere 자격 증명 구성
- [Amazon EKS Hybrid Nodes overview](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — Hybrid Nodes 전제 조건
- [IAM Roles Anywhere User Guide](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) — 신뢰 앵커·프로파일 구성

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — nodeadm 등록 흐름
- [방화벽·DNS 사전 등록 가이드](../networking/firewall-connectivity.md) — 인증 방식별 엔드포인트 등록
