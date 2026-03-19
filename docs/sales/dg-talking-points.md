---
title: "DG Rep 토킹포인트 - Modern Agentic Applications Day"
sidebar_label: "DG 토킹포인트"
description: "2026.4.9 Modern Agentic Applications Day 고객 초대를 위한 DG Rep 세일즈 피치 가이드"
---

# DG Rep 토킹포인트

> **핵심 테제**: "앱 현대화를 잘 해온 기업이 Agentic AI도 잘 합니다."

---

## 1. 30초 엘리베이터 피치 (전화용)

> AI 에이전트가 엔터프라이즈 애플리케이션의 미래를 바꾸고 있습니다. 하지만 AI 에이전트는 하늘에서 뚝 떨어지는 게 아닙니다 — 컨테이너, Kubernetes, 클라우드 네이티브 인프라가 기반이어야 합니다. **앱 현대화를 잘 해온 기업이 Agentic AI도 잘 합니다.** 4월 9일, AWS가 준비한 Modern Agentic Applications Day에서 EKS 기반 AI 플랫폼부터 AgentOps, 마이그레이션 전략까지 한 번에 알아보세요. **200명 한정**입니다.

---

## 2. 2분 요약 (미팅 오프닝용)

2026년, 엔터프라이즈 80%가 AI 에이전트 도입을 계획하고 있습니다. 하지만 대부분의 기업이 간과하는 사실이 있습니다 — **AI 에이전트는 수십 개의 마이크로서비스(LLM 서빙, 벡터DB, 게이트웨이, 모니터링)의 조합**이라는 것입니다. 컨테이너 오케스트레이션 없이는 프로덕션 운영이 불가능합니다.

AWS는 이 도전을 3개 기둥으로 해결합니다:

1. **클라우드 네이티브 AI 플랫폼**: EKS Auto Mode + PCP로 AI 워크로드 기반을 자동화하고, vLLM + llm-d로 자체 LLM을 서빙합니다. GPU MIG로 비용을 75% 절감하여 50 req/s 기준 월 $4,900 수준으로 운영 가능합니다.

2. **AgentOps**: Bedrock AgentCore + MCP로 셀프호스팅 15+ Pod를 매니지드로 전환, 운영 복잡도를 80% 줄입니다. DevOps를 잘 하던 팀이 AgentOps도 자연스럽게 할 수 있습니다.

3. **하이브리드 & 마이그레이션**: VMware → EKS 마이그레이션으로 TCO 40-60% 절감하면서 AI-ready 인프라를 확보합니다. Hybrid Nodes로 온프레미스도 EKS로 통합 관리합니다.

**4월 9일 Modern Agentic Applications Day**에서 이 3개 기둥의 Deep Dive 세션과 성공 사례를 한 번에 확인하실 수 있습니다. 행사 후에는 **AI Platform / AgentOps / Migration** 3개 트랙의 PoC를 바로 시작할 수 있습니다. 200명 한정이라 빠른 등록을 권합니다.

---

## 3. 산업별 후킹 포인트

### E-commerce

- AI 추천 에이전트로 고객별 실시간 개인화 추천 → **전환율 35% 향상** 사례
- GPU MIG + Semantic Caching으로 50 req/s 기준 **월 $4,900** 수준에서 운영
- 앱 현대화(컨테이너)가 완료된 기업이라면 AI 전환은 자연스러운 다음 단계

### 금융 (FSI)

- 데이터 주권과 규제 준수가 핵심 — **Hybrid Nodes**로 온프레미스 데이터 보호하면서 EKS AI 플랫폼 활용
- 실시간 이상거래 탐지 에이전트 구축, **탐지 정확도 99.2%** 달성
- 금융 규제 환경에서도 안전한 AI 운영 — Pod Identity, 암호화, 감사 로그 완비

### Gaming

- **AI NPC 에이전트**로 실시간 대화형 경험 제공 — 플레이 시간 2.5배 증가
- vLLM + llm-d로 저지연 추론 서빙 (TTFT 40% 단축)
- 수백만 동시접속에도 **Karpenter 자동 스케일링**으로 안정적 운영

### Manufacturing

- 비전 AI 품질검사 에이전트로 **불량률 90% 감소** 사례
- GPU MIG로 하나의 GPU를 7개 워크로드에 분할 → **비용 75% 절감**
- 공장 Edge에서도 **Hybrid Nodes**로 EKS 통합 관리

### Telco

- 네트워크 최적화 AI 에이전트로 **운영 효율 50% 향상**
- Edge AI 워크로드에 Hybrid Nodes 최적 — 5G/6G 시대 필수 인프라
- EKS로 코어 네트워크부터 Edge까지 통합 AI 플랫폼 구축

---

## 4. 예상 질문 & 답변

### Q1. AI 에이전트랑 기존 챗봇이랑 뭐가 다른가요?

챗봇은 미리 정의된 규칙이나 단순 Q&A만 처리합니다. **AI 에이전트는 자율적으로 도구를 사용하고, 의사결정을 내리며, 멀티스텝 작업을 실행**합니다. 예를 들어 "이번 달 매출 보고서를 만들어줘"라는 요청에 데이터 조회 → 분석 → 시각화 → 보고서 생성까지 자율적으로 수행합니다.

### Q2. 우리는 아직 컨테이너도 안 했는데요?

마이그레이션 트랙이 바로 그 시작점입니다. **VMware → EKS 전환이 AI-ready 인프라 확보의 첫걸음**이고, 이 과정에서 TCO 40-60% 절감 효과도 얻습니다. 행사에서 단계적 전환 로드맵을 자세히 다룹니다.

### Q3. GPU가 비싸서 AI 도입이 부담됩니다.

그래서 GPU 최적화가 핵심입니다. **MIG로 GPU 비용 75% 절감**, Bedrock AgentCore로 셀프호스팅 대비 **운영 비용 80% 감소**가 가능합니다. Semantic Caching으로 반복 쿼리 비용도 추가 절감됩니다.

### Q4. Bedrock만 쓰면 되는 거 아닌가요?

Bedrock은 좋은 시작점이지만, **자체 모델 서빙(vLLM), 커스텀 에이전트 로직, 하이브리드 구성**이 필요한 경우 EKS 기반 플랫폼이 필수입니다. AgentCore가 Bedrock과 EKS를 연결하여 둘의 장점을 모두 활용할 수 있게 해줍니다.

### Q5. GCP/Azure 대비 AWS 장점이 뭔가요?

GCP, Azure도 유사한 서비스를 제공하지만 핵심 차별점이 있습니다: **AWS는 전용 컨트롤 플레인(PCP, 99.99% SLA)을 유일하게 제공**하고, AgentCore는 **MCP 프로토콜을 네이티브로 지원**하여 에이전트 간 통신을 표준화합니다. 또한 Inferentia2/Trainium 같은 **자체 AI 칩으로 추론 비용을 추가 절감**할 수 있습니다. Auto Mode + Karpenter + Transform으로 인프라 구축부터 마이그레이션까지 하나의 경로로 통합된 점도 강점입니다.

### Q6. 행사에서 뭘 얻을 수 있나요?

**AI 플랫폼 아키텍처, AgentOps 실전 가이드, 마이그레이션 성공 사례**를 하루에 모두 확인할 수 있습니다. 200명 한정이라 CTO/VP급 네트워킹 기회도 제공됩니다. 행사 후 즉시 PoC를 시작할 수 있는 3개 트랙도 준비되어 있습니다.

### Q7. PoC는 어떻게 진행되나요?

3개 트랙을 준비했습니다:
- **AI Platform**: EKS + vLLM PoC → 2주 PoC → 프로덕션 로드맵
- **AgentOps**: Bedrock AgentCore PoC → 에이전트 운영 자동화
- **Migration**: AWS Transform 어세스먼트 → VMware→EKS 마이그레이션

행사 참석 고객에게 우선 PoC 기회를 제공합니다.

### Q8. 보안/규제 문제는 어떻게 해결하나요?

**EKS Pod Identity**로 세밀한 접근 제어, **Hybrid Nodes**로 데이터 주권 보장, Private Subnets + VPC 격리로 네트워크 보안을 확보합니다. 금융/의료 규제 환경에서의 구축 사례를 행사에서 공유합니다.

### Q9. 기존 Kubernetes 클러스터가 있는데 AI 워크로드 추가 가능한가요?

가능합니다. **EKS Auto Mode 전환으로 GPU 노드 자동 프로비저닝**이 가능하고, 기존 워크로드와 AI 워크로드가 같은 클러스터에서 공존할 수 있습니다. Karpenter가 AI 워크로드에 맞는 GPU 인스턴스를 자동으로 할당합니다.

### Q10. 행사 참석 대상이 누구인가요?

**CTO, VP Engineering, 인프라 리더, 플랫폼 팀 리드**가 주요 대상입니다. AI 전략을 수립 중이거나 컨테이너 기반 앱 현대화를 진행 중인 기술 의사결정자에게 가장 적합합니다. 산업은 E-commerce, FSI, Gaming, Manufacturing, Telco를 중점적으로 다룹니다.

---

## 5. 경쟁사 대비 차별점

| 비교 항목 | AWS (EKS) | GCP (GKE) | Azure (AKS) |
|-----------|-----------|-----------|-------------|
| **컨트롤 플레인** | PCP 전용 (99.99% SLA) | 공유 (99.95% SLA) | 공유 (99.95% SLA) |
| **데이터 플레인 자동화** | Auto Mode + Karpenter | Autopilot + NAP | NAP (Node Auto-provisioning) |
| **AI 에이전트 런타임** | AgentCore (MCP 네이티브) | Vertex AI Agent Builder | Azure AI Agent Service |
| **GPU 최적화** | Karpenter + MIG/DRA 통합 | MIG 지원 + GKE NAP | MIG 지원 |
| **AI 전용 칩** | Inferentia2, Trainium | TPU v5e/v5p | Maia 100 (제한적) |
| **마이그레이션** | Transform (K8s 통합) | Migrate to Containers | Azure Migrate |
| **GPU 인스턴스** | H100, L40S, Inferentia2, Trainium | H100, A100, L4, L40S | H100, A100, MI300X |

:::tip 핵심 차별화 메시지
GCP/Azure도 유사 서비스를 제공하지만, AWS는 **전용 컨트롤 플레인(PCP, 99.99% SLA)**, **MCP 네이티브 에이전트 런타임(AgentCore)**, **Auto Mode + Karpenter + Transform으로 이어지는 통합 경로**를 제공하는 점에서 차별화됩니다.
:::

---

## 6. 후속 파이프라인 연결

### Track 1: AI Platform (EKS + vLLM)

| 단계 | 내용 | 기간 |
|------|------|------|
| 어세스먼트 | 현재 인프라 분석 + AI 워크로드 요구사항 정의 | 1주 |
| PoC | EKS Auto Mode + vLLM + GPU 최적화 구성 | 2주 |
| 프로덕션 로드맵 | 프로덕션 아키텍처 설계 + 마이그레이션 계획 | 1주 |

### Track 2: AgentOps (Bedrock AgentCore)

| 단계 | 내용 | 기간 |
|------|------|------|
| 에이전트 설계 | 유스케이스 정의 + 에이전트 아키텍처 설계 | 1주 |
| PoC | AgentCore + MCP 연동 + 에이전트 구축 | 2주 |
| 운영 자동화 | 모니터링, 스케일링, CI/CD 파이프라인 구성 | 1주 |

### Track 3: Migration (AWS Transform)

| 단계 | 내용 | 기간 |
|------|------|------|
| 어세스먼트 | VMware/레거시 환경 분석 + 전환 대상 선정 | 2주 |
| 파일럿 마이그레이션 | 핵심 워크로드 EKS 전환 + 검증 | 4주 |
| AI 온보딩 | 마이그레이션 완료 후 AI 워크로드 배포 | 2주 |

:::info 행사 참석 고객 혜택
행사 참석 고객에게 **PoC 우선 배정** 및 **AWS SA 전담 지원**을 제공합니다.
:::

---

## 7. 행사 정보 요약

| 항목 | 내용 |
|------|------|
| **행사명** | Modern Agentic Applications Day |
| **일시** | 2026년 4월 9일 (수) |
| **장소** | 센터필드 18층 |
| **규모** | 200명 한정 |
| **대상** | CTO, VP Engineering, 인프라 리더, 플랫폼 팀 리드 |
| **핵심 세션** | 클라우드 네이티브 AI 플랫폼 / AgentOps / 마이그레이션 |
| **후속 프로그램** | 3개 PoC 트랙 (AI Platform / AgentOps / Migration) |

:::tip 초대 시 강조 포인트
- "앱 현대화의 다음 단계가 궁금하시다면"
- "AI 인프라 비용이 걱정되신다면 — GPU 75% 절감 사례를 공유합니다"
- "200명 한정이라 빠른 등록을 권합니다"
- "행사 후 바로 PoC를 시작할 수 있습니다"
:::
