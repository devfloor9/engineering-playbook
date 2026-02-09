---
title: 소개
description: Engineering Playbook에 오신 것을 환영합니다 - 클라우드 네이티브 아키텍처와 모범 사례를 위한 종합 가이드
tags: [kubernetes, cloud-native, introduction, getting-started]
---

# Engineering Playbook

**Engineering Playbook**에 오신 것을 환영합니다. 이 문서는 AWS 기반 클라우드 네이티브 인프라를 위한 기술 가이드, 모범 사례, 아키텍처 패턴을 종합적으로 다룹니다. 또한 각 기술 도메인에 대한 **테스트 및 벤치마크 정보**를 제공하여, 구현의 성능과 안정성을 검증할 수 있도록 지원합니다.

## 주요 내용

이 플레이북은 다섯 가지 핵심 기술 도메인으로 구성되어 있으며, 각 도메인에는 상세한 구현 가이드, 트러블슈팅 자료, 실제 사례가 포함되어 있습니다.

### [Infrastructure Optimization](./infrastructure-optimization/)
- EKS DNS 성능 최적화
- Cilium ENI 모드 구성
- 네트워크 성능 튜닝 전략
- 로드 밸런싱 및 인그레스 패턴

### [Operations & Observability](./operations-observability/)
- Hubble 네트워크 가시성 구현
- AI/ML 워크로드 모니터링
- Prometheus 및 Grafana 구성
- 로깅 및 알림 전략

### [Agentic AI Platform](./agentic-ai-platform/)
- 프로덕션 GenAI 플랫폼 아키텍처
- GPU 효율성 최적화
- MIG 및 타임슬라이싱 전략
- 모델 서빙 및 추론 패턴

### [Hybrid Infrastructure](./hybrid-infrastructure/)
- EKS 하이브리드 노드 구성
- 클라우드 버스팅 아키텍처
- 멀티 클라우드 관리 패턴
- EKS를 활용한 엣지 컴퓨팅

### [Security & Governance](./security-governance/)
- ROSA 네트워크 보안 구현
- 컴플라이언스 아키텍처 패턴
- RBAC 및 IAM 모범 사례
- 보안 모니터링 및 감사

### [Benchmark Reports](./benchmarks/)
- 인프라 성능 벤치마크 리포트
- AI/ML 워크로드 처리량 및 지연 시간 측정
- 네트워크 및 스토리지 성능 테스트 결과
- 비용 대비 성능 비교 분석

## 시작하기

1. **클라우드 네이티브가 처음이신가요?** 각 도메인의 소개 문서부터 시작하세요
2. **특정 사용 사례가 있으신가요?** 검색 기능을 활용하여 관련 가이드를 찾아보세요
3. **구현 준비가 되셨나요?** 코드 예제가 포함된 단계별 가이드를 따라하세요

## 플레이북 활용 방법

각 가이드는 일관된 구조를 따릅니다:

- **개요**: 배경과 목표
- **사전 요구사항**: 필요한 지식과 도구
- **아키텍처**: 시스템 설계와 구성요소
- **구현**: 단계별 구현 방법
- **모니터링**: 검증 및 관찰성
- **트러블슈팅**: 일반적인 문제와 해결 방법

## 기여하기

이 플레이북은 최신 클라우드 네이티브 패턴과 모범 사례로 지속적으로 업데이트됩니다. 기여, 이슈 또는 제안 사항은 [GitHub 저장소](https://github.com/devfloor9/engineering-playbook)를 방문해 주세요.

## 지원

- **문서 관련 이슈**: [GitHub Issues](https://github.com/devfloor9/engineering-playbook/issues)
- **기술 질문**: 검색 기능을 활용하거나 태그별로 찾아보세요
