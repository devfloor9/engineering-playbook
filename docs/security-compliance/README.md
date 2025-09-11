# Security & Compliance

이 섹션에서는 Amazon EKS 환경에서의 보안 강화 및 컴플라이언스 준수에 대한 심화 기술 문서들을 다룹니다.

## 📚 주요 문서

### 네트워크 보안 컴플라이언스
- **ROSA Network Security Compliance Architecture: Best Practices and Implementation**
  - Red Hat OpenShift Service on AWS (ROSA) 네트워크 보안 아키텍처
  - 컴플라이언스 요구사항 준수 방법
  - 보안 정책 구현 및 모니터링

## 🎯 학습 목표

이 섹션을 통해 다음을 학습할 수 있습니다:

- EKS 클러스터의 종합적인 보안 강화 방법
- 네트워크 보안 정책 설계 및 구현
- 컴플라이언스 요구사항 준수 전략
- 보안 모니터링 및 사고 대응 체계 구축

## 🛡️ 보안 영역

### 클러스터 보안
- **인증 및 권한 관리**
  - IAM 역할 및 정책 최적화
  - RBAC(Role-Based Access Control) 구성
  - OIDC 프로바이더 통합

- **네트워크 보안**
  - 네트워크 정책(Network Policies) 구현
  - 서비스 메시 보안 (Istio/Linkerd)
  - VPC 및 서브넷 보안 설정

### 워크로드 보안
- **Pod 보안**
  - Pod Security Standards 적용
  - Security Context 설정
  - 컨테이너 이미지 스캐닝

- **시크릿 관리**
  - AWS Secrets Manager 통합
  - External Secrets Operator 활용
  - 암호화 키 관리 (KMS)

### 데이터 보안
- **저장 데이터 암호화**
  - EBS 볼륨 암호화
  - etcd 암호화
  - 애플리케이션 레벨 암호화

- **전송 데이터 암호화**
  - TLS/mTLS 구성
  - 서비스 간 통신 암호화
  - 인그레스 TLS 설정

## 📋 컴플라이언스 프레임워크

### 주요 표준
- **SOC 2**: 보안, 가용성, 처리 무결성
- **PCI DSS**: 결제 카드 데이터 보안
- **HIPAA**: 의료 정보 보호
- **GDPR**: 개인정보 보호 규정
- **ISO 27001**: 정보보안 관리 시스템

### 컴플라이언스 도구
- **AWS Config**: 리소스 구성 모니터링
- **AWS Security Hub**: 보안 상태 중앙 관리
- **Amazon GuardDuty**: 위협 탐지
- **AWS CloudTrail**: API 호출 감사

## 🔧 보안 도구 및 기술

### 오픈소스 보안 도구
- **Falco**: 런타임 보안 모니터링
- **OPA Gatekeeper**: 정책 기반 제어
- **Trivy**: 컨테이너 이미지 취약점 스캐닝
- **Kube-bench**: CIS Kubernetes 벤치마크

### AWS 네이티브 보안 서비스
- **AWS WAF**: 웹 애플리케이션 방화벽
- **AWS Shield**: DDoS 보호
- **Amazon Inspector**: 취약점 평가
- **AWS Systems Manager**: 패치 관리

## 🚨 보안 모니터링 및 대응

### 실시간 모니터링
- 보안 이벤트 로그 수집 및 분석
- 이상 행위 탐지 및 알림
- 자동화된 보안 대응 워크플로우

### 사고 대응
- 보안 사고 대응 계획 수립
- 포렌식 분석 및 복구 절차
- 사후 분석 및 개선 방안

## 🔗 관련 자료

- [EKS Engineering Playbook 메인](../../README.md)
- [Hybrid & Multi-Cloud](../hybrid-multicloud/)
- [Observability & Monitoring](../observability-monitoring/)
- [Performance & Networking](../performance-networking/)

---

**💡 팁**: 보안은 한 번 설정하고 끝나는 것이 아닙니다. 지속적인 모니터링과 정기적인 보안 평가가 필수입니다!