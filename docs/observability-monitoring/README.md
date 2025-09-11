# Observability & Monitoring

이 섹션에서는 Amazon EKS 환경에서의 관찰성(Observability)과 모니터링 관련 심화 기술 문서들을 다룹니다.

## 📚 주요 문서

### 네트워크 관찰성
- **Gaining Network Visibility: Implementing Hubble for EKS Observability**
  - Hubble을 통한 네트워크 트래픽 가시성 확보
  - 서비스 메시 관찰성 구현
  - 네트워크 정책 및 보안 모니터링

### AI/ML 워크로드 모니터링
- **Monitoring AI/ML Workloads: Integrating Langfuse with Amazon EKS**
  - AI/ML 파이프라인 성능 추적
  - Langfuse를 통한 LLM 애플리케이션 모니터링
  - 모델 성능 및 비용 최적화

## 🎯 학습 목표

이 섹션을 통해 다음을 학습할 수 있습니다:

- EKS 클러스터의 종합적인 관찰성 구축 방법
- 네트워크 트래픽 및 서비스 간 통신 모니터링
- AI/ML 워크로드 특화 모니터링 전략
- 실시간 알림 및 자동화된 대응 체계 구축

## 🔧 주요 도구 및 기술

- **Hubble**: Cilium 기반 네트워크 관찰성 플랫폼
- **Langfuse**: LLM 애플리케이션 모니터링 및 추적
- **Prometheus & Grafana**: 메트릭 수집 및 시각화
- **Jaeger**: 분산 추적 시스템

## 🔗 관련 자료

- [EKS Engineering Playbook 메인](../../README.md)
- [Performance & Networking](../performance-networking/)
- [GenAI & AI/ML](../genai-aiml/)
- [Security & Compliance](../security-compliance/)

---

**💡 팁**: 효과적인 모니터링을 위해서는 SLI(Service Level Indicators)와 SLO(Service Level Objectives)를 먼저 정의하는 것이 중요합니다!