---
title: "Agent Versioning & Change Management"
sidebar_label: "Agent Versioning"
description: "엔터프라이즈 Agent의 프롬프트·모델·배포 전략·거버넌스를 통합하는 Change Management 체계"
tags: [agent-versioning, prompt-registry, canary, feature-flag, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Agent 변경 관리

## 왜 Agent Change Management가 필요한가

### 전통적 소프트웨어 변경과의 차이

전통적 소프트웨어에서 변경 관리는 코드, 설정, 인프라 변경을 대상으로 삼는다. Agent 시스템은 여기에 **확률적 구성요소**가 추가된다:

| 변경 유형 | 전통적 시스템 | Agentic 시스템 |
|-----------|--------------|---------------|
| **출력 결정성** | 동일 입력 → 동일 출력 | 동일 입력 → 확률 분포 |
| **회귀 감지** | 단위 테스트, 통합 테스트 | 통계적 평가(BLEU, Exact Match, LLM-as-Judge) |
| **롤백 기준** | 기능 장애, 성능 저하 | 정확도 하락, 환각 증가, latency P99 |
| **변경 단위** | 코드 커밋, 바이너리 | 프롬프트 버전, 모델 교체, 파라미터 조정 |

### Prompt와 Model을 코드처럼 관리해야 하는 이유

1. **Prompt는 로직의 핵심**  
   "당신은 금융 분석 전문가입니다" → "당신은 보수적 투자 자문가입니다"로 한 줄 변경하면 출력 패턴 전체가 변한다.

2. **모델 교체는 런타임 교체**  
   GPT-4 → Claude 4.7 Sonnet 전환 시 동일 프롬프트도 응답 스타일, 토큰 사용량, latency가 달라진다.

3. **변경 추적 없이는 롤백 불가**  
   "어제까지 잘 됐는데 오늘 이상해요"라는 신고를 받았을 때, 누가 어떤 프롬프트를 언제 바꿨는지 모르면 복구할 수 없다.

4. **규제 요구사항**  
   금융권, 의료, 공공 부문에서는 "이 답변은 어느 프롬프트 버전, 어느 모델 버전으로 생성되었는가"를 감사(Audit) 기록으로 남겨야 한다.

---

## 3계층 Change Management 체계

Agent 변경 관리는 세 가지 계층으로 구성된다:

### 1. 프롬프트·모델 레지스트리

프롬프트와 모델 버전을 코드처럼 관리하는 중앙 저장소. Langfuse, Bedrock Prompt Management, PromptLayer 등을 사용해 버전 관리, 라벨링, 변경 이력 추적을 수행한다.

**[프롬프트·모델 레지스트리 상세 보기 →](./prompt-model-registry.md)**

### 2. 배포 전략

Shadow Testing, Canary Rollout, A/B Testing, Blue-Green Deployment 등 점진적 배포 전략과 Feature Flag 기반 전개 방식.

**[배포 전략 상세 보기 →](./deployment-strategies.md)**

### 3. 거버넌스·자동화

회귀 감지, 자동 롤백, 승인 워크플로, 감사 증빙, AIDLC 단계별 적용 방안.

**[거버넌스·자동화 상세 보기 →](./governance-automation.md)**

---

## 핵심 원칙

1. **모든 변경은 버전 관리**: 프롬프트, 모델, 파라미터 변경은 Git 커밋처럼 추적 가능해야 한다.
2. **점진적 배포**: 전체 트래픽을 한 번에 바꾸지 않는다. Canary → 단계적 확대.
3. **자동 회귀 감지**: Golden Dataset 평가 + 실시간 메트릭 모니터링으로 성능 저하를 즉시 탐지.
4. **빠른 롤백**: 문제 발생 시 1분 이내 복구 가능한 메커니즘 필수.
5. **감사 증빙**: 금융·의료·공공 부문 규제 대응을 위한 7년 보관 체계.

---

## 관련 문서

import DocCardList from '@theme/DocCardList';

<DocCardList />

---

## AIDLC 연관 문서

- [Evaluation Framework](../../toolchain/evaluation-framework.md) — Golden Dataset 기반 회귀 감지
- [Agent 모니터링](../../../agentic-ai-platform/operations-mlops/observability/agent-monitoring.md) — 실시간 observability

---

## 다음 단계

변경 관리 프로세스를 수립했다면:

1. **[프롬프트·모델 레지스트리](./prompt-model-registry.md)** — Langfuse/Bedrock PM 선택 및 구축
2. **[배포 전략](./deployment-strategies.md)** — Canary/Shadow/A-B 중 적합한 전략 선택
3. **[거버넌스·자동화](./governance-automation.md)** — 자동 회귀 감지 및 롤백 체계 구축
