---
title: "MRC 토킹포인트 - Modern Agentic Applications Day"
sidebar_label: "MRC 토킹포인트"
description: "2026.4.9 Modern Agentic Applications Day 고객 초대를 위한 MRC(Marketing Representative for Customers) 세일즈 피치 가이드"
---

# MRC 토킹포인트

> **핵심 테제**: "앱 현대화를 잘 해온 기업이 Agentic AI도 잘 합니다."

---

## 1. 30초 엘리베이터 피치 (전화용)

> AI 에이전트가 엔터프라이즈의 일하는 방식을 바꾸고 있습니다. 하지만 AI 에이전트는 하늘에서 뚝 떨어지지 않습니다 — 견고한 클라우드 네이티브 인프라가 기반이어야 합니다. **EKS 위에서 GPU Operator, vLLM으로 LLM을 서빙하고, Bedrock AgentCore와 Hosted MCP로 에이전트를 운영하는 것**이 현실적인 답입니다. 4월 9일 Modern Agentic Applications Day에서 비용 최적화부터 AgentOps까지 한 번에 알아보세요. **200명 한정**입니다.

---

## 2. 2분 요약 (미팅 오프닝용)

2026년, 엔터프라이즈 80%가 AI 에이전트 도입을 계획하고 있습니다. 하지만 대부분의 기업이 간과하는 사실이 있습니다 — **AI 에이전트는 수십 개의 마이크로서비스(LLM 서빙, 벡터DB, 게이트웨이, 모니터링)의 조합**이라는 것입니다. 컨테이너 오케스트레이션 없이는 프로덕션 운영이 불가능합니다.

AWS는 이 도전을 3개 기둥으로 해결합니다:

1. **Cloud Native LLMOps 플랫폼**: EKS는 LLMOps를 완벽하게 지원하는 관리형 Kubernetes입니다. GPU Operator와 run.ai로 GPU 리소스를 효율적으로 관리하고, vLLM + llm-d로 자체 LLM을 서빙합니다. MIG 파티셔닝과 Karpenter 자동 스케일링을 결합하여 **비용 최적화와 운영 안정성을 동시에 달성**합니다. 50 req/s 기준 월 $4,900 수준으로 운영 가능합니다.

2. **AgentOps**: AWS가 제공하는 다양한 매니지드 에이전트 생태계를 활용할 수 있습니다. **Bedrock AgentCore**로 에이전트 런타임을 매니지드로 운영하고, **Hosted MCP 서버**로 에이전트-도구 연결을 표준화하며, **DevOps Agent** 같은 매니지드 에이전트로 인프라 운영까지 자동화합니다. 셀프호스팅 15+ Pod를 매니지드로 전환하여 운영 복잡도를 80% 줄입니다.

3. **하이브리드 & 마이그레이션**: VMware → EKS 마이그레이션으로 TCO 40-60% 절감하면서 AI-ready 인프라를 확보합니다. Hybrid Nodes로 온프레미스도 EKS로 통합 관리합니다.

**4월 9일 Modern Agentic Applications Day**에서 이 3개 기둥의 Deep Dive 세션과 실제 구축 사례를 한 번에 확인하실 수 있습니다. 행사 후에는 **AI Platform / AgentOps / Migration** 3개 트랙의 PoC를 바로 시작할 수 있습니다. 200명 한정이라 빠른 등록을 권합니다.

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

그래서 GPU 최적화가 핵심입니다. EKS 위에서 **GPU Operator + run.ai**로 GPU를 워크로드 단위로 정밀 할당하고, **MIG 파티셔닝**으로 하나의 GPU를 최대 7개로 분할하여 **비용 75% 절감**이 가능합니다. 여기에 Semantic Caching과 Karpenter Spot 전략을 더하면 비용을 더욱 낮출 수 있습니다.

### Q4. Bedrock만 쓰면 되는 거 아닌가요?

Bedrock은 좋은 시작점이지만, **자체 모델 서빙(vLLM), 커스텀 에이전트 로직, 하이브리드 구성**이 필요한 경우 EKS 기반 플랫폼이 필수입니다. AWS의 강점은 둘을 조합할 수 있다는 것입니다 — **AgentCore**로 에이전트 런타임을 매니지드로 운영하면서, **Hosted MCP 서버**로 자사 도구와 연결하고, 필요한 모델은 EKS 위 vLLM에서 직접 서빙할 수 있습니다.

### Q5. GCP/Azure 대비 AWS 장점이 뭔가요?

GCP, Azure도 유사한 서비스를 제공합니다. AWS의 차별점은 **LLMOps 전체 스택이 EKS 위에서 통합**된다는 것입니다. GPU Operator, run.ai, vLLM, Karpenter로 **모델 서빙 인프라**를 구성하고, AgentCore + Hosted MCP + DevOps Agent로 **에이전트 운영**을 자동화하며, Transform으로 **마이그레이션**까지 하나의 경로로 연결됩니다. 또한 EKS는 99.99% SLA의 전용 컨트롤 플레인(PCP)을 유일하게 제공합니다.

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
GCP/Azure도 유사 서비스를 제공하지만, AWS는 **EKS 위에서 LLMOps 전체 스택(GPU Operator, run.ai, vLLM, Karpenter)이 통합**되고, **AgentCore + Hosted MCP + DevOps Agent로 매니지드 에이전트 생태계**를 제공하며, **Transform으로 마이그레이션까지 하나의 경로**로 연결되는 점에서 차별화됩니다.
:::

---

## 6. 후속 파이프라인 연결

### Track 1: Cloud Native LLMOps (EKS + vLLM)

| 단계 | 내용 | 기간 |
|------|------|------|
| 어세스먼트 | 현재 인프라 분석 + AI 워크로드 요구사항 정의 | 1주 |
| PoC | EKS + GPU Operator + run.ai + vLLM 구성 | 2주 |
| 프로덕션 로드맵 | 프로덕션 아키텍처 설계 + 비용 최적화 계획 | 1주 |

### Track 2: AgentOps (AgentCore + Hosted MCP)

| 단계 | 내용 | 기간 |
|------|------|------|
| 에이전트 설계 | 유스케이스 정의 + 에이전트 아키텍처 설계 | 1주 |
| PoC | AgentCore + Hosted MCP 서버 연동 + 에이전트 구축 | 2주 |
| 운영 자동화 | DevOps Agent 연계, 모니터링, CI/CD 구성 | 1주 |

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
