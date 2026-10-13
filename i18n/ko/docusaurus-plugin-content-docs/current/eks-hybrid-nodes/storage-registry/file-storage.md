---
title: EKS Hybrid Nodes 공유 파일 스토리지 솔루션
description: EKS Hybrid Nodes 환경에서 공유 파일 스토리지 구현을 위한 포괄적 가이드로, AWS 관리형 서비스, 엔터프라이즈 스토리지 통합 및 Amazon Linux 2023 대체 접근법을 다룹니다.
created: "2025-09-15"
last_update:
  date: 2026-10-13
  author: YoungJoon Jeong
reading_time: 17
tags:
  - eks
  - hybrid-node
  - storage
  - efs
  - fsx
  - nfs
  - amazon-linux-2023
  - scope:impl
sidebar_label: 파일 스토리지
category: hybrid-multicloud
---

## 개요

하이브리드 환경에서 공유 파일 스토리지는 여러 노드 간 데이터 공유, 상태 저장 애플리케이션 운영, 그리고 클라우드와 온프레미스 간 데이터 일관성 유지를 위한 핵심 구성 요소입니다. 초기 Amazon Linux 2023 릴리스에는 전통적인 고가용성 클러스터링 패키지(pacemaker, corosync)가 포함되지 않아, Amazon Linux 2 기반의 NFS 클러스터 구성을 그대로 옮기기 어려웠습니다.

본 문서는 EKS Hybrid Nodes 환경에서 공유 파일 스토리지를 선택할 때 고려할 솔루션과 제약 사항을 정리합니다. 아래 패키지 가용성은 명시된 Amazon Linux 2023 릴리스 기준이며, 적용 전에 사용 중인 AMI의 실제 릴리스에서 재확인해야 합니다.

## 기술적 배경 및 현황 분석

### Amazon Linux 2023 클러스터링 패키지 가용성 {#amazon-linux-2023-패키지-정책-변화}

Amazon Linux 2에서 Amazon Linux 2023으로 전환한 초기 릴리스에는 다음 클러스터링 관련 패키지가 기본 리포지토리에 포함되지 않았습니다:

- `corosync` 및 관련 라이브러리 (`corosynclib`, `corosync-qdevice`, `corosync-qnetd`)
- `pacemaker` 패키지 세트 (`pacemaker-cli`, `pacemaker-cluster-libs`, `pacemaker-remote` 등)

다만 이 상태는 릴리스에 따라 달라집니다. AWS가 공개한 릴리스 노트에 따르면 AL2023.10(버전 2023.10.20260105)에서 `corosync` 3.1.9와 `pacemaker` 3.0.1 패키지가 리포지토리에 다시 추가되었습니다. 따라서 "AL2023에는 pacemaker/corosync가 없다"는 서술은 특정 초기 릴리스에만 해당하며, 현재 사용하는 AMI의 릴리스에서 `dnf list corosync pacemaker` 등으로 실제 가용성을 확인해야 합니다.

패키지 설치 가능 여부와, 온프레미스 AL2023에서 pacemaker/corosync 기반 HA 토폴로지가 AWS의 테스트·지원 범위에 포함되는지는 별개의 문제입니다. 패키지가 리포지토리에 있더라도 특정 HA 구성이 EKS Hybrid Nodes에서 검증·지원된다는 의미는 아니므로, 지원 범위는 EKS Hybrid Nodes 및 Amazon Linux 공식 문서에서 별도로 확인해야 합니다.

### 지원 운영체제

EKS Hybrid Nodes는 Amazon Linux 2023, Ubuntu (20.04/22.04/24.04 LTS), RHEL (8/9)을 공식 지원합니다. Bottlerocket은 VMware vSphere 환경(v1.37+)에서 프리뷰로 지원되며, Rocky Linux는 공식 지원 목록에 포함되지 않아 AWS Support 범위를 벗어납니다. 전체 시스템 요구 사항은 [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md)를 참조합니다.

## 공유 파일 스토리지 솔루션 아키텍처

### 1. AWS 관리형 서비스 기반 솔루션

#### Amazon EFS (Elastic File System)

Amazon EFS는 EKS Hybrid Nodes 환경에서 가장 권장되는 공유 파일 스토리지 솔루션입니다.

**핵심 특징:**

- NFSv4.1 프로토콜 지원으로 기존 NFS 클라이언트와 호환
- 자동 확장/축소로 용량 관리 불필요
- Regional 파일 시스템은 여러 가용 영역에 데이터를 중복 저장하여 연간 99.999999999%(11 9's)의 내구성을 제공하도록 설계되었습니다. One Zone 파일 시스템은 단일 가용 영역에만 저장되므로 해당 AZ 장애 시 데이터가 손실될 수 있습니다. 11 9's는 설계 목표치이며 보장값이 아니므로, AWS Backup 또는 EFS Replication으로 백업·복구를 별도로 구성해야 합니다.
- 전송 중 및 저장 시 암호화 지원

**하이브리드 연결 방법:**

- AWS Direct Connect 또는 VPN을 통한 프라이빗 연결 (온프레미스에서 EFS에 접근하려면 필수)
- EFS Mount Helper를 통한 최적화된 마운트 성능 및 전송 중 암호화

**Kubernetes 통합 시 주의사항:**

온프레미스 서버에서 NFSv4.1로 EFS 파일 시스템에 접근하는 것과, EKS Hybrid Nodes에서 EFS CSI Driver로 동적 프로비저닝하는 것은 별개의 문제입니다. AWS가 EKS Hybrid Nodes와의 호환성을 검증한 애드온 목록에는 Amazon FSx CSI Driver는 포함되지만 **Amazon EFS CSI Driver는 포함되어 있지 않습니다**. 최신 EFS CSI Driver는 하이브리드 노드에 적용되는 `eks.amazonaws.com/compute-type: hybrid` 레이블에 대한 anti-affinity 규칙을 가지고 있어 하이브리드 노드에서 스케줄되지 않습니다. 따라서 하이브리드 노드에서 EFS를 사용하려는 경우 다음 중 하나를 따라야 합니다.

- 애플리케이션에서 `nfs` 볼륨 또는 직접 NFSv4.1 마운트로 EFS 파일 시스템에 접근 (CSI 동적 프로비저닝 없음)
- 또는 하이브리드 노드에서 호환성이 검증된 Amazon FSx CSI Driver 등 다른 경로를 선택

호환 애드온 목록은 변경될 수 있으므로 적용 전 [하이브리드 노드용 애드온 구성 문서](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-add-ons.html)에서 최신 상태를 확인해야 합니다.

**구현 고려사항:**

- 온프레미스에서 EFS 액세스 시 네트워크 지연시간 고려 필요
- 대역폭 사용량에 따른 네트워크 비용 계산
- 백업 및 라이프사이클 정책 설정

#### Amazon FSx

고성능이 요구되는 워크로드의 경우 Amazon FSx를 고려할 수 있습니다.

**FSx for Lustre:**

- 고성능 컴퓨팅(HPC) 및 AI/ML 워크로드에 최적화
- S3와의 네이티브 통합으로 데이터 티어링 지원
- 수백 GB/s 처리량과 수백만 IOPS 지원
- 2025년 현재 GenAI 추론 워크로드에서 활용 사례 증가

**FSx for NetApp ONTAP:**

- 기존 NetApp 환경과의 호환성
- 멀티 프로토콜 지원 (NFS, SMB, iSCSI)
- 고급 데이터 관리 기능 (스냅샷, 클론, 복제)

**FSx for OpenZFS:**

- 고성능 NFS 워크로드 지원
- 압축 및 중복제거를 통한 스토리지 효율성
- 스냅샷 및 백업 기능 내장

### 2. 엔터프라이즈 스토리지 통합 솔루션

기존 온프레미스 스토리지 투자를 활용하면서 Kubernetes 환경과 통합하는 방안입니다.

#### CSI Driver 기반 통합

**NetApp Trident:**

- ONTAP, Cloud Volumes ONTAP, Azure NetApp Files 지원
- 동적 볼륨 프로비저닝 및 스냅샷 관리
- 데이터 보호 및 재해복구 기능 내장

**Dell PowerScale CSI:**

- OneFS 기반 스케일아웃 NAS 통합
- 고성능 및 대용량 스토리지 요구사항 충족
- 멀티 테넌시 및 QoS 지원

**Pure Storage CSI:**

- FlashBlade 및 FlashArray 통합
- 올플래시 성능과 데이터 압축/중복제거
- 클라우드 네이티브 데이터 서비스

#### 구현 아키텍처

엔터프라이즈 스토리지 통합 시 다음과 같은 아키텍처를 권장합니다:

1. **스토리지 백엔드 구성**: 온프레미스 스토리지 시스템에서 NFS 익스포트 또는 iSCSI 타겟 구성
2. **CSI Driver 배포**: Kubernetes 클러스터에 해당 벤더의 CSI Driver 설치
3. **StorageClass 정의**: 동적 프로비저닝을 위한 스토리지 클래스 구성
4. **네트워크 최적화**: 스토리지 트래픽을 위한 전용 네트워크 세그먼트 구성

### 3. 하이브리드 운영체제 기반 솔루션

특별한 요구사항이나 기존 운영 노하우를 활용해야 하는 경우의 대안입니다.

#### Ubuntu/RHEL 기반 전통적 NFS 클러스터

**Ubuntu 22.04 LTS 활용:**

- `pacemaker`, `corosync`, `nfs-kernel-server` 패키지 지원
- 5년간 장기 지원으로 안정적인 운영 환경 제공
- 광범위한 커뮤니티 지원과 문서화

**RHEL 9 활용:**

- 엔터프라이즈급 지원과 보안 업데이트
- Red Hat의 고가용성 애드온 활용 가능
- 기존 RHEL 운영 경험 활용

**구현 시 고려사항:**

- 클러스터 노드 간 네트워크 분할 시나리오 대응
- 스토리지 백엔드의 고가용성 구성
- 정기적인 클러스터 상태 모니터링 및 유지보수

## 실제 구현 사례 및 레퍼런스

### Dell PowerFlex + EKS Hybrid Nodes

Dell Technologies에서 수행한 공식 레퍼런스 구현으로, PostgreSQL 데이터베이스를 EKS Hybrid Nodes 환경에서 PowerFlex 스토리지와 연동하여 운영한 사례입니다.

**성능 결과(Dell 발표 기준):**

Dell이 공개한 테스트는 pgbench의 내장 스크립트 `select-only`(SELECT만 수행하는 읽기 전용 트랜잭션)로 수행되었습니다. Dell 백서에 공개된 실행 조건은 scale factor 20000으로 초기화(`pgbench -i -s 20000`)한 뒤 클라이언트 180개, 스레드 80개로 600초 동안 실행(`-c 180 -j 80 -T 600 -b select-only`)한 것입니다. 보고된 수치는 다음과 같습니다.

- 238,804 read IOPS
- 0.638ms **read latency**(읽기 지연시간)

두 수치는 원문 블로그가 보고한 값입니다. 백서도 같은 238,804 IOPS를 보고하지만, 지연시간은 수치 없이 "minimal latency"라고만 적고 있습니다. 백서에 공개된 실행 조건은 위의 한 가지 구성뿐이므로, 동시 세션 수에 따른 확장성은 이 자료로 판단할 수 없습니다.

이 수치는 Dell의 특정 테스트 환경과 구성에서 얻은 읽기 전용 결과입니다. 백서는 pgbench 실행 조건은 공개하지만, 테스트에 사용한 서버와 PowerFlex 클러스터의 하드웨어 사양, 네트워크 구성은 밝히지 않습니다. 쓰기 포함 혼합 워크로드나 다른 환경에서 동일한 성능이 재현된다는 의미는 아니므로, 실제 환경에서는 직접 측정이 필요합니다. 원문: [What If? Unleashing innovation with Amazon EKS Hybrid Nodes and Dell PowerFlex](https://infohub.delltechnologies.com/en-nz/p/what-if-unleashing-innovation-with-amazon-eks-hybrid-nodes-and-dell-powerflex/), 백서: [Amazon EKS Hybrid Nodes on Dell PowerFlex — PostgreSQL deployment](https://infohub.delltechnologies.com/en-us/l/amazon-eks-hybrid-nodes-on-dell-powerflex/postgresql-deployment-1/) (Dell H04475, 2025년 4월).

**아키텍처 특징:**

- PowerFlex CSI Driver를 통한 동적 볼륨 프로비저닝
- 소프트웨어 정의 스토리지의 유연성과 Kubernetes 네이티브 통합
- 하이브리드 환경에서 일관된 스토리지 관리 경험

### Superbet (Happening) 분산 엣지 사례

게임 및 스포츠 베팅 플랫폼인 Superbet에서 EKS Hybrid Nodes를 활용하여 분산된 엣지 환경을 관리하는 사례입니다.

**구현 목적:**

- 지역별 규제 요구사항 준수를 위한 데이터 로컬라이제이션
- 중앙 집중식 Kubernetes 관리를 통한 운영 효율성 향상
- 엣지 위치에서의 낮은 지연시간 서비스 제공

**스토리지 전략:**

- 로컬 캐시를 위한 고성능 스토리지
- 중앙 데이터 동기화를 위한 네트워크 스토리지
- 컴플라이언스 요구사항을 충족하는 데이터 보호

## Amazon Repository 패키지 추가 요청 프로세스

### 패키지 추가 요청 가능성

특정 패키지가 사용 중인 Amazon Linux 2023 릴리스에 포함되어 있지 않은 경우, 공개 채널을 통해 추가를 요청할 수 있습니다. 다만 앞서 설명한 것처럼 `corosync`와 `pacemaker`는 AL2023.10에서 리포지토리에 다시 추가되었으므로, 요청 전에 현재 릴리스에서 해당 패키지가 이미 제공되는지 먼저 확인합니다.

### 공식 요청 채널 {#공식-요청-절차}

Amazon Linux 2023 프로젝트는 패키지 추가와 같은 기능 요청을 공개 채널에서 수집합니다. AL2023 저장소 README에 안내된 경로는 다음과 같습니다.

- GitHub `amazonlinux/amazon-linux-2023` 저장소의 [이슈](https://github.com/amazonlinux/amazon-linux-2023/issues)로 기능 요청/버그 제출 (기존 이슈를 먼저 확인)
- 질문이나 토론은 GitHub [Discussions](https://github.com/amazonlinux/amazon-linux-2023/discussions) 사용
- 담당 AWS 어카운트 팀 또는 [AWS re:Post](https://repost.aws/)를 통한 피드백
- 보안 이슈는 이슈가 아니라 [보안 정책](https://github.com/amazonlinux/amazon-linux-2023/security/policy)에 따라 보안팀에 보고

### 요청 시 포함하면 도움이 되는 정보(작성자 권고) {#현실적-기대치-및-제약사항}

아래 항목은 AWS가 공개한 필수 요건이 아니라, 요청 내용을 명확히 전달하기 위한 작성자의 권고입니다.

- 구체적인 사용 사례와 해결하려는 문제
- 기존 대안(지원 OS, 관리형 서비스 등) 검토 결과와 한계
- 가능하면 재현 가능한 예시나 참고 자료

처리 기간, 승인 확률, AWS의 내부 우선순위에 대해서는 공개된 공식 기준이 없으므로 본 문서에서 단정하지 않습니다. 요청의 수용 여부와 일정은 Amazon Linux 팀의 판단에 따릅니다.

### 대안 접근 방법

**소스 컴파일 방식 (권장하지 않음):**

Amazon Linux 2023에서 직접 소스 컴파일을 통한 패키지 설치는 기술적으로 가능하지만 다음과 같은 심각한 문제점들이 있습니다:

- **복잡한 의존성 관리**: 수십 개의 의존 라이브러리와 개발 도구 필요
- **보안 업데이트 누락**: 수동으로 보안 패치를 추적하고 적용해야 함
- **시스템 안정성 위험**: 검증되지 않은 바이너리로 인한 시스템 불안정 가능성
- **운영 복잡성 증가**: 업그레이드, 백업, 복구 과정의 복잡성 급증
- **지원 범위 제외**: AWS Support에서 문제 해결 지원 불가

**권장 대안:**

1. **지원 OS 활용**: Ubuntu 22.04 LTS 또는 RHEL 9에서 필요 패키지 사용
2. **관리형 서비스**: Amazon EFS, FSx 등 AWS 네이티브 솔루션 채택
3. **엔터프라이즈 솔루션**: 검증된 3rd party 스토리지 솔루션과 CSI Driver 통합

### 요청을 명확히 전달하기 위한 참고 사항 {#패키지-요청-시-고려사항}

아래는 승인 확률에 대한 예측이 아니라, 요청을 검토자가 이해하기 쉽게 만들기 위한 일반적인 작성 참고 사항입니다.

- 동일한 필요를 가진 다른 사용자나 사용 사례가 있다면 함께 제시
- 왜 기존 대안(지원 OS, 관리형 서비스 등)으로 충분하지 않은지 구체적으로 설명
- 패키지의 유지보수 주체, 라이선스, 보안 업데이트 경로 등 운영에 영향을 주는 정보 포함

실제 채택 여부, 보안·안정성 판단, 유지보수 부담에 대한 결정은 Amazon Linux 팀의 몫이며, 본 문서는 그 결과를 예단하지 않습니다.

## 비용 최적화 전략

### 비용 최적화 권장사항

**단기 전략:**

- 워크로드 특성에 맞는 적절한 성능 모드 선택
- 사용하지 않는 데이터에 대한 라이프사이클 정책 적용
- 네트워크 트래픽 최적화를 통한 데이터 전송 비용 절감

**장기 전략:**

- 데이터 티어링(EFS IA/Archive 등)을 통한 스토리지 비용 최적화
- 예약 인스턴스나 Savings Plans는 Amazon EC2, Fargate, Lambda, SageMaker 등 **컴퓨팅** 사용량에만 적용됩니다. EFS·FSx의 스토리지 용량이나 처리량 요금에는 적용되지 않으므로, 하이브리드 노드에서 사용하는 컴퓨팅(해당되는 경우)에 한해 고려합니다. 파일 스토리지 비용은 각 서비스의 스토리지 클래스·처리량 모드·수명 주기 정책 등 서비스별 요금 옵션으로 최적화합니다.
- 멀티 클라우드 전략 수립 시 벤더 종속성 고려

## 보안 및 컴플라이언스

### 데이터 보호

아래 보안 기능은 선택한 서비스·드라이버·프로토콜에 따라 지원 범위와 구성 방식이 다릅니다. EFS, FSx(ONTAP/OpenZFS 등), 온프레미스 NFS에 동일하게 적용된다고 가정하지 말고, 각 서비스 문서에서 지원 여부를 확인해야 합니다.

**암호화:**

- 전송 중 암호화: EFS는 EFS Mount Helper를 통해 TLS 1.2로 NFS 트래픽을 암호화합니다. FSx 계열과 온프레미스 NFS는 지원되는 암호화 방식과 설정이 서비스/프로토콜마다 다르므로 개별 확인이 필요합니다.
- 저장 시 암호화: EFS와 FSx는 AWS KMS 키를 사용한 저장 시 암호화를 지원합니다. 온프레미스 NFS는 백엔드 스토리지의 자체 암호화 기능에 의존합니다.
- 키 관리: KMS 키 로테이션 및 액세스 제어 정책 적용 (관리형 서비스에 한함)

**액세스 제어:**

- EFS: IAM 정책, EFS Access Point, POSIX 권한을 조합해 접근을 제어합니다.
- FSx/온프레미스 NFS: 프로토콜(NFS/SMB)과 디렉터리 서비스 통합 방식에 따라 권한 모델이 다릅니다.
- 공통: 네트워크 레벨 액세스 제어(보안 그룹, NACL) 및 온프레미스 방화벽 규칙

### 컴플라이언스 고려사항

**데이터 주권:**

- 지역별 데이터 보관 요구사항 준수
- 국경 간 데이터 전송 규제 대응
- 로컬 데이터 처리 요구사항 충족

**감사 및 로깅:**

- CloudTrail은 EFS/FSx의 **관리 API 호출**(파일 시스템 생성·설정 변경 등)을 기록하며, 파일 단위의 읽기/쓰기 접근 자체를 기록하지는 않습니다. 파일 데이터 접근 감사가 필요하면 서비스별 기능(예: FSx for Windows File Server의 파일 접근 감사, FSx for NetApp ONTAP의 감사 기능) 또는 애플리케이션/클라이언트 측 로깅을 별도로 구성해야 합니다.
- VPC Flow Logs를 통한 네트워크 트래픽 모니터링
- 온프레미스 NFS는 백엔드 스토리지가 제공하는 감사 로그에 의존합니다.

## 결론 및 권장사항

초기 Amazon Linux 2023 릴리스에는 pacemaker와 corosync가 포함되지 않아 이 패키지에 의존하는 NFS 구성을 그대로 옮기기 어려웠습니다. 이후 AL2023.10에서 두 패키지가 리포지토리에 다시 추가되었으나, 패키지 가용성은 사용 중인 릴리스에서 확인해야 하고 특정 HA 구성의 지원 범위는 별개입니다. EKS Hybrid Nodes에서는 이 가이드의 AWS 관리형 파일 서비스, CSI 드라이버를 통한 기존 기업 스토리지, 별도로 운영하는 NFS 서비스를 가용성·연결·운영 요구에 맞춰 비교합니다.

**핵심 권장사항:**

1. **Amazon EFS 우선 고려**: 대부분의 사용 사례에서 최적의 선택으로, 복잡한 설정 없이 엔터프라이즈급 기능 제공
2. **기존 투자 보호**: 온프레미스 엔터프라이즈 스토리지가 있는 경우 CSI Driver를 통한 통합으로 투자 보호 및 클라우드 이점 확보
3. **단계적 접근**: 작은 규모로 시작하여 점진적으로 확장하는 방식으로 위험 최소화
4. **운영 자동화**: 수동 관리를 최소화하고 자동화된 모니터링 및 복구 체계 구축
5. **보안 우선**: 데이터 보호와 컴플라이언스 요구사항을 초기 설계 단계부터 고려

이러한 접근법을 통해 EKS Hybrid Nodes 환경에서 안정적이고 확장 가능하며 비용 효율적인 공유 파일 스토리지 솔루션을 구축할 수 있습니다.

---

## 참고 자료

### 공식 문서
- [Amazon EKS Hybrid Nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — EKS Hybrid Nodes 공식 사용자 가이드
- [Amazon EFS User Guide](https://docs.aws.amazon.com/efs/latest/ug/) — Amazon Elastic File System 사용자 가이드
- [Amazon Linux 2023 Release Notes](https://docs.aws.amazon.com/linux/al2023/release-notes/) — Amazon Linux 2023 릴리스 노트 및 변경사항
- [Amazon EKS Hybrid Nodes on Dell PowerFlex](https://infohub.delltechnologies.com/en-us/l/amazon-eks-hybrid-nodes-on-dell-powerflex/overview-7117/) — Dell 백서(H04475, 2025년 4월). 설치·구성 절차와 PostgreSQL pgbench 테스트 조건
- Kubernetes CSI 드라이버 개발 가이드 — Container Storage Interface 공식 명세

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — Hybrid Nodes 정의·요구 사항·동작 원리
- [Harbor 프라이빗 레지스트리 EKS 통합](./harbor-registry.md) — 하이브리드 환경 컨테이너 레지스트리 구성
