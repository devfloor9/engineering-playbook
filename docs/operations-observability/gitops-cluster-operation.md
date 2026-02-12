---
title: "GitOps 기반 EKS 클러스터 운영"
sidebar_label: "1. GitOps 클러스터 운영"
description: "대규모 EKS 클러스터의 안정적인 운영을 위한 GitOps 아키텍처, KRO/ACK 활용 방법, 멀티클러스터 관리 전략 및 자동화 기법을 다룹니다."
tags: [eks, gitops, argocd, kro, ack, kubernetes, automation, infrastructure-as-code]
category: "observability-monitoring"
last_update:
  date: 2025-02-09
  author: devfloor9
sidebar_position: 1
---

# GitOps 기반 EKS 클러스터 운영

> 📅 **작성일**: 2025-02-09 | ⏱️ **읽는 시간**: 약 7분

> **📌 기준 버전**: ArgoCD v2.13+ / v3 (프리릴리즈), Kubernetes 1.32


## 개요

대규모 EKS 클러스터를 안정적이고 확장 가능하게 운영하기 위해서는 GitOps 원칙을 따른 자동화된 배포 및 관리 전략이 필수입니다. 이 문서는 ArgoCD, KRO/ACK, 그리고 Infrastructure as Code 패턴을 활용하여 프로덕션급 클러스터 운영 환경을 구축하는 방법을 설명합니다.

### 문제 해결

전통적인 EKS 클러스터 운영에서는 다음의 문제들이 있었습니다:

- 수동 설정으로 인한 환경 간 불일치
- 인프라 변경 이력 추적 어려움
- 대규모 멀티클러스터 관리의 복잡성
- 배포 검증 및 롤백 프로세스의 부재
- 정책 준수 자동화 부족

이 아키텍처는 이러한 문제들을 해결하기 위해 설계되었습니다.

## 기술적 고려사항 및 아키텍처 요약

### 핵심 제안 사항

**1. GitOps 플랫폼 선택**

- ArgoCD ApplicationSets를 활용한 멀티 클러스터 관리
- Progressive Delivery를 위한 Flagger 통합

:::tip ArgoCD as EKS Add-on
ArgoCD는 EKS Add-on으로도 제공됩니다. `aws eks create-addon`을 통해 설치하면 AWS가 버전 호환성을 관리합니다.
:::

**2. Infrastructure as Code 전략**

- **ACK/KRO (Kubernetes Resource Orchestrator)** 채택 권장
  - 기존 Terraform 상태와의 점진적 마이그레이션 가능
  - Kubernetes 네이티브 접근 방식으로 운영 일관성 확보
  - Helm 대비 더 유연한 리소스 오케스트레이션

**3. 자동화 핵심 요소**

- Blue/Green 방식의 EKS 업그레이드 자동화
- Addon 버전 관리를 위한 자동화된 테스트 파이프라인
- Policy as Code (OPA/Gatekeeper) 기반 거버넌스

**4. 보안 및 규정 준수**

- External Secrets Operator + AWS Secrets Manager 조합
- Git 서명 및 RBAC 기반 승인 워크플로우
- 실시간 규정 준수 모니터링 대시보드

### 예상 ROI

| 효과 | 개선 |
|------|------|
| 운영 부담 | 수동 작업 자동화로 감소 |
| 업그레이드 빈도 | 연 1회 → 분기별 가능 |
| 장애 복구 | 자동 롤백으로 시간 개선 |

## 아키텍처 개요

GitOps 기반 EKS 클러스터 운영은 Git을 단일 진실 공급원으로 삼고, 선언적 구성 관리를 통해 클러스터 상태를 자동으로 동기화합니다.

### GitOps 워크플로우

```mermaid
sequenceDiagram
    participant Dev as 개발자
    participant Git as Git Repository
    participant PR as PR/MR Review
    participant Argo as ArgoCD Server
    participant AS as ApplicationSets
    participant KRO as KRO Controller
    participant OPA as OPA Gatekeeper
    participant ESO as External Secrets
    participant EKS as EKS Clusters
    participant AWS as AWS Services
    participant Mon as Monitoring

    Dev->>Git: 1. Push 변경사항
    Git->>PR: 2. PR/MR 생성
    PR->>PR: 3. 자동 검증 (CI)
    PR->>Dev: 4. 승인 요청
    Dev->>PR: 5. 승인
    PR->>Git: 6. Merge to main

    Git->>Argo: 7. Webhook 트리거
    Argo->>Git: 8. Pull 최신 변경사항

    alt Application 배포
        Argo->>AS: 9a. ApplicationSet 동기화
        AS->>AS: 10a. 클러스터별 매니페스트 생성
        AS->>OPA: 11a. 정책 검증
        OPA-->>AS: 12a. 검증 결과
        alt 정책 통과
            AS->>ESO: 13a. Secret 요청
            ESO->>AWS: 14a. Secrets Manager 조회
            AWS-->>ESO: 15a. Secret 반환
            ESO-->>AS: 16a. Secret 주입
            AS->>EKS: 17a. 매니페스트 적용
            EKS-->>AS: 18a. 배포 상태
        else 정책 위반
            OPA->>Mon: 13b. 정책 위반 알림
            OPA->>Dev: 14b. 배포 차단 알림
        end
    else Infrastructure 변경
        Argo->>KRO: 9b. KRO 리소스 동기화
        KRO->>KRO: 10b. 리소스 검증
        KRO->>AWS: 11b. AWS API 호출
        AWS-->>KRO: 12b. 리소스 생성/수정
        KRO->>EKS: 13b. 상태 업데이트
    end

    EKS->>Mon: 19. 메트릭/로그 전송
    Mon->>Mon: 20. 이상 감지

    alt 이상 감지됨
        Mon->>Argo: 21. 롤백 트리거
        Argo->>EKS: 22. 이전 버전 배포
        Mon->>Dev: 23. 알림 발송
    end

    loop Health Check (30초마다)
        Argo->>EKS: 상태 확인
        EKS-->>Argo: 동기화 상태
        Argo->>Mon: 동기화 메트릭
    end
```

## 멀티클러스터 관리 전략

### ApplicationSets 기반 클러스터 관리

ArgoCD ApplicationSets는 멀티클러스터 환경에서 일관된 배포를 관리하는 핵심 도구입니다.

**핵심 전략:**

#### 1. Cluster Generator

- 클러스터 레지스트리 기반 동적 애플리케이션 생성
- 레이블 기반 클러스터 그룹핑 (환경, 리전, 목적별)

#### 2. Git Directory Generator

- 환경별 구성 관리 (dev/staging/prod)
- 클러스터별 오버라이드 설정

#### 3. Matrix Generator

- 클러스터 × 애플리케이션 조합 관리
- 조건부 배포 규칙 적용

## 멀티클러스터 자동화

### EKS 클러스터 업그레이드 자동화

Blue/Green 배포 패턴을 사용하여 무중단 클러스터 업그레이드를 구현합니다.

**준비 단계**

- 새 클러스터 프로비저닝 (KRO)
- Addon 호환성 검증
- 보안 정책 동기화

**마이그레이션 단계**

- 워크로드 점진적 이동
- 트래픽 가중치 조정 (0% → 100%)
- 실시간 모니터링

**검증 및 완료**

- 자동화된 smoke test
- 성능 메트릭 비교
- 구 클러스터 제거

## 보안 및 거버넌스

### Git Repository 구조 설계

효과적인 GitOps 구현을 위해서는 적절한 저장소 구조가 필수입니다.

**Monorepo vs Polyrepo 권장사항:**

| 대상 | 권장 방식 | 이유 |
|------|---------|------|
| 애플리케이션 코드 | Polyrepo | 팀별 독립성 보장 |
| 인프라 구성 | Monorepo | 중앙 관리 및 일관성 확보 |
| 정책 정의 | Monorepo | 전사 표준화 강제 |

### Secret 관리 아키텍처

:::info External Secrets Operator (ESO) 권장

**주요 특징:**

- 중앙집중식 Secret 저장소
- 자동 로테이션 지원
- 세밀한 접근 제어 (IRSA)
- 암호화된 Git 저장 불필요

AWS Secrets Manager와 함께 사용하면 조직의 보안 정책을 효과적으로 구현할 수 있습니다.

:::

## Terraform에서 KRO로의 마이그레이션 전략

기존 Terraform 환경에서 KRO로 점진적으로 전환합니다. 이 접근 방식은 위험을 최소화하면서 가치를 지속적으로 제공합니다.

### Phase 1: 파일럿 (2개월)

- Dev 환경 1개 클러스터 대상
- 기본 리소스만 마이그레이션 (VPC, Subnets, Security Groups)
- Terraform 상태 임포트 및 검증

### Phase 2: 확대 적용 (3개월)

- Staging 환경 포함
- EKS 클러스터 및 Addon 관리 추가
- 자동화 파이프라인 구축

### Phase 3: 전체 마이그레이션 (4개월)

- Production 환경 순차 적용
- 모든 AWS 리소스 KRO 관리
- Terraform 완전 제거

### KRO 리소스 정의 예시

다음은 KRO를 사용한 EKS 클러스터 및 노드 그룹 정의의 예시입니다.

```yaml
apiVersion: kro.io/v1alpha1
kind: ResourceGroup
metadata:
  name: eks-cluster-us-east-1-prod
spec:
  resources:
    # EKS 클러스터 정의
    - apiVersion: eks.aws.crossplane.io/v1beta1
      kind: Cluster
      metadata:
        name: prod-cluster-01
      spec:
        forProvider:
          region: us-east-1
          version: "1.29"
          roleArnRef:
            name: eks-cluster-role
          resourcesVpcConfig:
            - subnetIdRefs:
                - name: private-subnet-1a
                - name: private-subnet-1b

    # 노드 그룹 정의
    - apiVersion: eks.aws.crossplane.io/v1alpha1
      kind: NodeGroup
      metadata:
        name: prod-nodegroup-01
      spec:
        forProvider:
          clusterNameRef:
            name: prod-cluster-01
          instanceTypes:
            - c7i.8xlarge
          scalingConfig:
            - minSize: 3
              maxSize: 50
              desiredSize: 10
```

## ArgoCD v3 업데이트 (2025)

ArgoCD v3가 KubeCon EU 2025에서 프리릴리즈되었으며, 주요 개선 사항은 다음과 같습니다:

### 확장성 개선

- **대규모 클러스터 지원**: 수천 개의 Application 리소스 관리 성능 향상
- **Sharding 개선**: Application Controller의 수평 확장 강화
- **메모리 최적화**: 대규모 매니페스트 처리 시 메모리 사용량 감소

### 보안 강화

- **RBAC 개선**: 더 세밀한 권한 제어
- **Audit Logging**: 모든 작업에 대한 감사 로그 강화
- **시크릿 관리**: External Secrets Operator와의 통합 개선

### 마이그레이션 가이드

ArgoCD v2.x에서 v3로의 마이그레이션:

1. v2.13으로 먼저 업그레이드 (호환성 확인)
2. 사용 중단 API 확인 및 업데이트
3. v3 프리릴리즈에서 기능 테스트
4. 프로덕션 업그레이드 실행

:::warning 주의사항
ArgoCD v3는 2025년 상반기 프리릴리즈 상태입니다. 프로덕션 환경에서는 안정 버전(v2.13+)을 사용하고, v3 GA 릴리즈를 확인한 후 마이그레이션하세요.
:::

## 결론

GitOps 기반 대규모 EKS 클러스터 운영 전략은 수동 관리 부담을 획기적으로 줄이고, 안정성과 확장성을 크게 향상시킬 수 있습니다.

:::tip 핵심 권장사항

**1. ACK/KRO를 통한 인프라 관리 통합**

- Kubernetes 네이티브 인프라 관리
- 기존 Terraform 상태와의 호환성

**2. ArgoCD ApplicationSets를 활용한 멀티클러스터 관리**

- 클러스터 간 일관된 배포
- 환경별 커스터마이징

**3. 자동화된 Blue/Green 업그레이드 전략 활용**

- 무중단 클러스터 업그레이드
- 자동 롤백 기능

**4. Policy as Code 기반 거버넌스**

- OPA/Gatekeeper를 통한 정책 강제
- 규정 준수 자동화

:::

단계적 마이그레이션 접근을 통해 리스크를 최소화하면서도 빠르게 가치를 실현할 수 있습니다.
