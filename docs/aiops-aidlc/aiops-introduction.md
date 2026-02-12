---
title: "AI로 K8s 운영 혁신하기 — AIOps 전략 가이드"
sidebar_label: "AIOps 전략 가이드"
description: "K8s 플랫폼의 복잡성을 AI로 낮추고 혁신을 가속하는 AIOps 전략 — AWS 오픈소스 관리형 서비스, Kiro+MCP, AI Agent 확장"
sidebar_position: 2
category: "aiops-aidlc"
tags: [aiops, eks, observability, anomaly-detection, monitoring, kiro, mcp, ai-agent]
last_update:
  date: 2026-02-12
  author: devfloor9
---

import { AiopsMaturityModel, MonitoringComparison, AwsServicesMap, RoiMetrics, AwsManagedOpenSource, K8sOpenSourceEcosystem, EvolutionDiagram, DevOpsAgentArchitecture, McpServerTypes, McpServersMap, ManagedAddonsOverview, AiToolsComparison, AiAgentFrameworks, OperationPatternsComparison, RoiQuantitativeMetrics, CostStructure, NextSteps } from '@site/src/components/AiopsIntroTables';

# AI로 K8s 운영 혁신하기 — AIOps 전략 가이드

> 📅 **작성일**: 2026-02-12 | ⏱️ **읽는 시간**: 약 25분 | 📌 **기준 환경**: EKS 1.35+, AWS CLI v2

---

## 1. 개요

**AIOps(Artificial Intelligence for IT Operations)**는 머신러닝과 빅데이터 분석을 IT 운영에 적용하여, 인시던트 탐지·진단·복구를 자동화하고 인프라 관리의 복잡성을 획기적으로 줄이는 운영 패러다임입니다.

Kubernetes 플랫폼은 선언적 API, 자동 스케일링, 자가 치유 등 강력한 기능과 확장성을 제공하지만, 그 복잡성은 운영팀에게 상당한 부담을 줍니다. **AIOps는 K8s 플랫폼의 다양한 기능과 확장성을 AI로 극대화하면서 복잡도는 낮추고 혁신을 가속하는 모델**입니다.

### 이 문서에서 다루는 내용

- AWS 오픈소스 전략과 EKS의 진화 과정
- Kiro + Hosted MCP 기반 AIOps 핵심 아키텍처
- 프로그래머틱 운영 vs 디렉팅 기반 운영 비교
- 전통적 모니터링과 AIOps의 패러다임 차이
- AIOps 핵심 역량 및 EKS 적용 시나리오
- AWS AIOps 서비스 맵 및 성숙도 모델
- ROI 평가 프레임워크

:::info 학습 경로
이 문서는 AIops & AIDLC 시리즈의 첫 번째 문서입니다. 전체 학습 경로:

1. **AIOps 소개** (현재 문서) → 2. [지능형 관찰성 스택](/docs/aiops-aidlc/aiops-observability-stack) → 3. [AIDLC 프레임워크](/docs/aiops-aidlc/aidlc-framework) → 4. [예측 운영](/docs/aiops-aidlc/aiops-predictive-operations)

:::

---

## 2. AWS 오픈소스 전략과 EKS의 진화

AWS의 컨테이너 전략은 **오픈소스를 K8s 네이티브 관리형 서비스로 진화**시키는 방향으로 일관되게 발전해왔습니다. 이 전략의 핵심은 K8s 생태계의 강점을 유지하면서 운영 복잡성을 제거하는 것입니다.

### 2.1 Managed Add-ons: 운영 복잡성 제거

EKS Managed Add-ons는 K8s 클러스터의 핵심 기능을 AWS가 직접 관리하는 확장 모듈입니다. 현재 **22개 이상**의 Managed Add-on이 제공됩니다 ([AWS 공식 목록](https://docs.aws.amazon.com/eks/latest/userguide/workloads-add-ons-available-eks.html) 참조).

<ManagedAddonsOverview />

```bash
# Managed Add-on 설치 예시 — 단일 명령으로 배포 및 관리
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name adot \
  --addon-version v0.40.0-eksbuild.1

# 설치된 Add-on 목록 확인
aws eks list-addons --cluster-name my-cluster
```

### 2.2 Community Add-ons Catalog (2025.03)

2025년 3월 출시된 **Community Add-ons Catalog**은 metrics-server, cert-manager, external-dns 등 커뮤니티 도구를 EKS 콘솔에서 원클릭으로 배포할 수 있게 합니다. 이전에는 Helm이나 kubectl로 직접 설치·관리해야 했던 도구들을 AWS 관리 체계에 편입시킨 것입니다.

### 2.3 관리형 오픈소스 서비스 — 운영 부담은 줄이고, 기술 종속은 피하고

AWS의 오픈소스 전략에는 두 가지 핵심 목표가 있습니다:

1. **운영 부담 제거**: 패치, 스케일링, HA 구성, 백업 등 운영 작업을 AWS가 대신 수행
2. **벤더 종속 방지**: 표준 오픈소스 API(PromQL, Grafana Dashboard JSON, OpenTelemetry SDK 등)를 그대로 사용하므로, 필요시 자체 운영으로 전환 가능

이 전략은 관찰성에 국한되지 않습니다. **데이터베이스, 스트리밍, 검색·분석, ML** 등 인프라 전반에 걸쳐 주요 오픈소스 프로젝트를 완전 관리형으로 제공합니다.

<AwsManagedOpenSource />

이 광범위한 관리형 오픈소스 포트폴리오 중에서 **Kubernetes와 직접 관련된 프로젝트와 서비스**를 별도로 정리하면 다음과 같습니다:

<K8sOpenSourceEcosystem />


### 2.4 진화의 핵심 메시지

<EvolutionDiagram />

:::tip 핵심 인사이트
EKS는 AWS 오픈소스 전략의 **핵심 실행자**입니다. 관리형 서비스로 운영 복잡성을 제거하고, EKS Capabilities로 자동화 컴포넌트를 강화하고, Kiro+MCP로 AI를 활용한 효율적 운영을 실현하고, AI Agent로 자율 운영까지 확장하는 — 각 단계가 이전 단계 위에 쌓이는 **누적적 진화** 모델입니다.
:::

---

## 3. AIOps의 핵심: AWS 자동화 → MCP 통합 → AI 도구 → Kiro 오케스트레이션

섹션 2에서 살펴본 AWS의 오픈소스 전략(Managed Add-ons, 관리형 서비스, EKS Capabilities)은 K8s 운영의 기반을 제공합니다. AIOps는 이 기반 위에 **MCP로 자동화 도구를 통합하고, AI 도구로 연결하며, Kiro로 전체를 오케스트레이션**하는 계층 구조입니다.

```
[Layer 1] AWS 자동화 도구 — 기반
  Managed Add-ons · AMP/AMG/ADOT · CloudWatch · EKS Capabilities (Argo CD, ACK, KRO)
                    ↓
[Layer 2] MCP 서버 — 통합 인터페이스
  50+ 개별 MCP 서버가 각 AWS 서비스를 AI가 접근 가능한 도구(Tool)로 노출
                    ↓
[Layer 3] AI 도구 — MCP를 통한 인프라 제어
  Q Developer · Claude Code · GitHub Copilot 등이 MCP로 AWS 서비스를 직접 조회·제어
                    ↓
[Layer 4] Kiro — Spec-Driven 통합 오케스트레이션
  requirements → design → tasks → 코드 생성, MCP 네이티브로 전체 워크플로우 통합
                    ↓
[Layer 5] AI Agent — 자율 운영 (확장)
  Kagent · Strands · Q Developer가 이벤트 기반으로 자율 감지·판단·실행
```

### 3.1 MCP — AWS 자동화 도구의 통합 인터페이스

섹션 2의 Managed Add-ons, AMP/AMG, CloudWatch, EKS Capabilities는 각각 강력한 자동화 도구이지만, AI가 이 도구들에 접근하려면 **표준화된 인터페이스**가 필요합니다. MCP(Model Context Protocol)가 이 역할을 합니다. AWS는 **50개 이상의 MCP 서버**를 오픈소스로 제공하여, 각 AWS 서비스를 AI 도구가 호출할 수 있는 도구(Tool)로 노출합니다.

<McpServersMap />

#### 3가지 호스팅 방식 상세 비교

<McpServerTypes />

#### 개별 MCP vs 통합 서버 — 대체가 아닌 병용

세 가지 방식은 **대체 관계가 아니라 상호 보완** 관계입니다. 핵심 차이는 **깊이 vs 범위**입니다.

**개별 MCP 서버** (EKS MCP, CloudWatch MCP 등)는 해당 서비스의 **네이티브 개념을 이해하는 심화 도구**입니다. 예를 들어 EKS MCP는 kubectl 실행, Pod 로그 분석, K8s 이벤트 기반 트러블슈팅 등 Kubernetes 전문 기능을 제공합니다. Fully Managed 버전(EKS/ECS)은 이 동일한 기능을 AWS 클라우드에서 호스팅하여 IAM 인증, CloudTrail 감사, 자동 패치 등 엔터프라이즈 요구사항을 추가한 것입니다.

**AWS MCP Server 통합**은 15,000+ AWS API를 범용적으로 호출하는 서버입니다. AWS Knowledge MCP + AWS API MCP를 하나로 통합한 것으로, EKS의 경우 `eks:DescribeCluster`, `eks:ListNodegroups` 등 AWS API 수준의 호출은 가능하지만, Pod 로그 분석이나 K8s 이벤트 해석 같은 심화 기능은 제공하지 않습니다. 대신 **멀티 서비스 복합 작업**(S3 + Lambda + CloudFront 조합 등)과 **Agent SOPs**(사전 구축 워크플로우)가 강점입니다.

:::info 현실적인 병용 패턴
```
EKS 심화 작업    → 개별 EKS MCP (또는 Fully Managed)
                   "Pod CrashLoopBackOff 원인 분석해줘"

멀티 서비스 작업  → AWS MCP Server 통합
                   "S3에 정적 사이트 올리고 CloudFront 연결해줘"

운영 인사이트     → 개별 CloudWatch MCP + Cost Explorer MCP
                   "지난 주 비용 급증 원인과 메트릭 이상 분석해줘"
```

IDE에 개별 MCP와 통합 서버를 **함께 연결**해두면, AI 도구가 작업 특성에 따라 적절한 서버를 자동 선택합니다.
:::

### 3.2 AI 도구 — MCP를 통한 인프라 제어

MCP가 AWS 서비스를 AI 접근 가능한 인터페이스로 노출하면, 다양한 AI 도구들이 이를 통해 인프라를 직접 조회하고 제어할 수 있습니다.

<AiToolsComparison />

이 단계에서 AI 도구는 사람의 지시에 따라 **개별 작업을 수행**합니다. "Pod 상태 확인해줘", "비용 분석해줘" 같은 프롬프트에 MCP를 통해 실시간 데이터를 기반으로 응답합니다. 유용하지만, 각 작업이 독립적이고 사람이 매번 지시해야 하는 한계가 있습니다.

### 3.3 Kiro — Spec-Driven 통합 오케스트레이션

**Kiro**는 개별 AI 도구의 한계를 넘어, **전체 워크플로우를 Spec으로 정의하고 MCP를 통해 일관되게 실행**하는 오케스트레이션 계층입니다. MCP 네이티브로 설계되어 AWS MCP 서버와 직접 통합됩니다.

Kiro의 Spec-driven 워크플로우:

1. **requirements.md** → 요구사항을 구조화된 Spec으로 정의
2. **design.md** → 아키텍처 결정사항을 문서화
3. **tasks.md** → 구현 태스크를 자동 분해
4. **코드 생성** → MCP로 수집한 실제 인프라 데이터를 반영한 코드, IaC, 설정 파일 생성

개별 AI 도구가 "물어보면 답하는" 방식이라면, Kiro는 **Spec 한 번 정의로 여러 MCP 서버를 연쇄 호출하여 최종 결과물까지 도달**합니다.

```
[1] Spec 정의 (requirements.md)
    "EKS 클러스터의 Pod 자동 스케일링을 트래픽 패턴 기반으로 최적화"
         ↓
[2] MCP로 현재 상태 수집
    ├─ EKS MCP       → 클러스터 구성, HPA 설정, 노드 현황
    ├─ CloudWatch MCP → 지난 2주간 트래픽 패턴, CPU/메모리 추이
    └─ Cost Explorer MCP → 현재 비용 구조, 인스턴스 유형별 지출
         ↓
[3] 컨텍스트 기반 코드 생성
    Kiro가 수집된 데이터를 반영하여:
    ├─ Karpenter NodePool YAML (실제 트래픽에 맞는 인스턴스 유형)
    ├─ HPA 설정 (실측 메트릭 기반 target 값)
    └─ CloudWatch 알람 (실제 베이스라인 기반 임계값)
         ↓
[4] 배포 및 검증
    Managed Argo CD로 GitOps 배포 → MCP로 배포 결과 실시간 확인
```

이 워크플로우의 핵심은 AI가 **추상적 추측이 아니라 실제 인프라 데이터를 기반으로 코드를 생성**한다는 점입니다. MCP가 없으면 AI는 일반적인 Best Practice만 제시하지만, MCP가 있으면 현재 클러스터의 실제 상태를 반영한 맞춤형 결과물을 만들어냅니다.

<DevOpsAgentArchitecture />

### 3.4 AI Agent로의 확장 — 자율 운영

Kiro + MCP가 "사람이 Spec을 정의하고 AI가 실행"하는 오케스트레이션이라면, AI Agent 프레임워크는 **이벤트 기반으로 AI가 자율적으로 감지·판단·실행**하는 다음 단계입니다. MCP가 제공하는 동일한 인프라 인터페이스 위에서, 사람의 개입 없이 Agent가 스스로 루프를 돌립니다.

<AiAgentFrameworks />

:::warning 현실적 적용 가이드

- **지금 시작**: Q Developer + CloudWatch MCP 조합으로 AI 기반 트러블슈팅 도입
- **개발 생산성**: Kiro + EKS/IaC/Terraform MCP로 Spec-driven 개발 워크플로우 구축
- **점진적 확장**: 반복적 운영 시나리오를 Strands Agent SOPs로 코드화
- **향후 탐색**: Kagent 등 K8s 네이티브 Agent 프레임워크가 성숙되면 자율 운영으로 전환
:::

:::info 핵심 가치
이 계층 구조의 핵심 가치는 **각 레이어가 독립적으로도 가치가 있으면서, 위로 쌓일수록 자동화 수준이 높아진다**는 점입니다. MCP만 연결해도 AI 도구에서 인프라를 직접 조회할 수 있고, Kiro를 더하면 Spec-driven 워크플로우가 가능하며, Agent를 추가하면 자율 운영으로 확장됩니다. AMP/CloudWatch/Datadog 등 어떤 관찰성 스택을 사용하든 MCP가 단일 인터페이스로 추상화하므로, AI 도구와 Agent는 백엔드에 무관하게 동일하게 동작합니다.
:::

---

## 4. 운영 자동화 패턴: Human-Directed, Programmatically-Executed

AIOps의 핵심은 **사람이 의도(Intent)와 가드레일을 정의하고, 시스템이 프로그래머틱하게 실행**하는 "Human-Directed, Programmatically-Executed" 모델입니다. 이 모델은 업계에서 세 가지 패턴의 스펙트럼으로 구현됩니다.

### 4.1 Prompt-Driven (Interactive) Operations

각 단계를 사람이 자연어 프롬프트로 지시하고, AI가 단일 작업을 수행하는 패턴입니다. ChatOps, AI 어시스턴트 기반 운영이 이에 해당합니다.

```
운영자: "현재 production 네임스페이스의 Pod 상태를 확인해줘"
AI: (kubectl get pods -n production 실행 후 결과 반환)
운영자: "CrashLoopBackOff 상태인 Pod의 로그를 봐줘"
AI: (kubectl logs 실행 후 결과 반환)
운영자: "메모리 부족인 것 같으니 limits를 올려줘"
AI: (kubectl edit 실행)
```

**적합한 상황**: 탐색적 디버깅, 새로운 유형의 장애 분석, 일회성 조치
**한계**: 사람이 루프의 모든 단계에 관여(Human-in-the-Loop), 반복 시나리오에서 비효율적

### 4.2 Spec-Driven (Codified) Operations

운영 시나리오를 **사양(Spec)이나 코드로 선언적 정의**하고, 시스템이 이를 프로그래머틱하게 실행하는 패턴입니다. IaC(Infrastructure as Code), GitOps, Runbook-as-Code가 이 범주에 속합니다.

```
[Intent 정의]  requirements.md / SOP 문서로 운영 시나리오 선언
       ↓
[코드 생성]    Kiro + MCP로 자동화 코드 생성 (IaC, 런북, 테스트)
       ↓
[검증]         자동화된 테스트 + Policy-as-Code 검증
       ↓
[배포]         GitOps (Managed Argo CD)로 선언적 배포
       ↓
[모니터링]     관찰성 스택이 실행 결과를 지속 추적
```

**적합한 상황**: 반복적 배포, 인프라 프로비저닝, 정형화된 운영 절차
**핵심 가치**: Spec 한 번 정의 → 반복 실행 시 추가 비용 없음, 일관성 보장, Git 기반 감사 추적

### 4.3 Agent-Driven (Autonomous) Operations

AI Agent가 **이벤트를 감지하고, 컨텍스트를 수집·분석하여, 사전 정의된 가드레일 내에서 자율적으로 대응**하는 패턴입니다. Human-on-the-Loop — 사람은 가드레일과 정책을 설정하고, Agent가 실행합니다.

```
[이벤트 감지]  관찰성 스택 → 알림 트리거
       ↓
[컨텍스트 수집] MCP로 메트릭 + 트레이스 + 로그 + K8s 상태 통합 조회
       ↓
[분석·판단]    AI가 근본 원인 분석 + 대응 방안 결정
       ↓
[자율 실행]    가드레일 범위 내 자동 복구 (Kagent/Strands SOPs)
       ↓
[피드백 학습]  결과를 기록하고 대응 패턴 지속 개선
```

**적합한 상황**: 인시던트 자동 대응, 비용 최적화, 예측 스케일링
**핵심 가치**: 초 단위 대응, 24/7 무인 운영, 컨텍스트 기반 지능형 판단

### 4.4 패턴 비교: EKS 클러스터 이슈 대응 시나리오

<OperationPatternsComparison />

:::tip 실전에서의 패턴 조합
세 패턴은 배타적이 아니라 **상호 보완적**입니다. 실제 운영에서는 새로운 장애 유형을 **Prompt-Driven**으로 탐색·분석한 뒤, 반복 가능한 패턴을 **Spec-Driven**으로 코드화하고, 최종적으로 **Agent-Driven**으로 자율화하는 점진적 성숙 과정을 거칩니다. 핵심은 반복적인 운영 시나리오를 자동화하여 운영팀이 전략적 작업에 집중할 수 있도록 하는 것입니다.
:::

---

## 5. 전통적 모니터링 vs AIOps

<MonitoringComparison />

### 패러다임 전환의 핵심

전통적 모니터링은 **사람이 규칙을 정의하고, 시스템이 규칙을 실행**하는 모델입니다. AIOps는 **시스템이 데이터에서 패턴을 학습하고, 사람은 전략을 결정**하는 모델로의 전환입니다.

EKS 환경에서 이 전환이 특히 중요한 이유:

1. **마이크로서비스 복잡성**: 수십~수백 개의 서비스가 상호작용하며, 수동으로 모든 의존성을 파악하기 어려움
2. **동적 인프라**: Karpenter 기반 노드 자동 프로비저닝으로 인프라가 지속적으로 변화
3. **다차원 데이터**: 메트릭, 로그, 트레이스, K8s 이벤트, AWS 서비스 이벤트가 동시 발생
4. **속도 요구**: GitOps 기반 빈번한 배포로 장애 원인이 다양화

---

## 6. AIOps 핵심 역량

AIOps의 네 가지 핵심 역량을 EKS 환경 시나리오와 함께 살펴봅니다.

### 6.1 이상 탐지 (Anomaly Detection)

정적 임계값이 아닌 **ML 기반 동적 베이스라인**으로 이상을 탐지합니다.

**EKS 시나리오: 점진적 메모리 누수**

```
전통적 방식:
  메모리 사용률 > 80% → 알림 → 운영자 확인 → 이미 OOMKilled 발생

AIOps 방식:
  ML 모델이 메모리 사용 패턴의 기울기 변화 감지
  → "메모리 사용량이 평소 대비 비정상적 증가 추세"
  → OOMKilled 발생 전에 선제 알림
  → Agent가 자동으로 메모리 프로파일링 데이터 수집
```

**적용 서비스**: DevOps Guru (ML 이상 탐지), CloudWatch Anomaly Detection (메트릭 밴드)

### 6.2 근본 원인 분석 (Root Cause Analysis)

여러 데이터 소스를 **상관관계 분석**하여 근본 원인을 자동 식별합니다.

**EKS 시나리오: 간헐적 타임아웃**

```
증상: API 서비스에서 간헐적 504 타임아웃

전통적 방식:
  API Pod 로그 확인 → 정상 → DB 연결 확인 → 정상
  → 네트워크 확인 → CoreDNS 확인 → 원인 불명 → 수시간 소요

AIOps 방식:
  CloudWatch Investigations가 자동 분석:
  ├─ X-Ray 트레이스: 특정 AZ의 DB 연결에서 지연 발생
  ├─ Network Flow Monitor: 해당 AZ 서브넷의 패킷 드롭 증가
  └─ K8s 이벤트: 해당 AZ 노드의 ENI 할당 실패
  → 근본 원인: 서브넷 IP 고갈
  → 권장 조치: 서브넷 CIDR 확장 또는 Prefix Delegation 활성화
```

**적용 서비스**: CloudWatch Investigations, Q Developer, Kiro + EKS MCP

### 6.3 예측 분석 (Predictive Analytics)

과거 패턴을 학습하여 **미래 상태를 예측**하고 선제 조치합니다.

**EKS 시나리오: 트래픽 급증 예측**

```
데이터: 최근 4주간의 시간대별 요청량 패턴

ML 예측:
  월요일 09:00에 트래픽 2.5배 급증 예상 (주간 패턴)
  → Karpenter NodePool에 선제적 노드 프로비저닝
  → HPA minReplicas 사전 조정
  → Cold Start 없이 트래픽 수용
```

**적용 서비스**: CloudWatch 메트릭 + Prophet/ARIMA 모델 + Karpenter

자세한 구현 방법은 [예측 스케일링 및 자동 복구 패턴](/docs/aiops-aidlc/aiops-predictive-operations)을 참조하세요.

### 6.4 자동 복구 (Auto-Remediation)

탐지된 이상에 대해 **사전 정의된 안전 범위 내에서 자율 복구**합니다.

**EKS 시나리오: 디스크 프레셔로 인한 Pod Eviction**

```
탐지: Node의 DiskPressure 조건 활성화

AI Agent 대응:
  1. 해당 노드의 컨테이너 이미지 캐시 정리 (crictl rmi --prune)
  2. 임시 파일 정리
  3. DiskPressure 조건 해소 확인
  4. 해소되지 않으면:
     ├─ 해당 노드를 cordon (새 Pod 스케줄링 차단)
     ├─ 기존 Pod를 다른 노드로 drain
     └─ Karpenter가 신규 노드 자동 프로비저닝
  5. 에스컬레이션: 반복 발생 시 운영팀 알림 + 루트 볼륨 크기 증가 권장
```

**적용 서비스**: Kagent + Strands SOPs, EventBridge + Lambda

:::tip 안전 장치 설계
자동 복구를 구현할 때는 반드시 **안전 장치(Guardrails)**를 설정하세요:

- 프로덕션 환경에서는 단계적 실행 (canary → progressive)
- 복구 실행 전 현재 상태 스냅샷 저장
- 복구 실패 시 자동 롤백
- 특정 시간 내 동일 복구 횟수 제한 (무한 루프 방지)
:::

---

## 7. AWS AIOps 서비스 맵

<AwsServicesMap />

### 서비스 간 통합 흐름

AWS AIOps 서비스들은 독립적으로도 가치가 있지만, **통합 사용 시 시너지**가 극대화됩니다:

1. **CloudWatch Observability Agent** → 메트릭/로그/트레이스 수집
2. **Application Signals** → 서비스 맵 + SLI/SLO 자동 생성
3. **DevOps Guru** → ML 이상 탐지 + 권장 조치
4. **CloudWatch Investigations** → AI 근본 원인 분석
5. **Q Developer** → 자연어 기반 트러블슈팅
6. **Hosted MCP** → AI 도구에서 직접 AWS 리소스 접근

:::tip 3rd Party 관찰성 스택을 사용하는 경우
Datadog, Sumo Logic, Splunk 등 3rd Party 솔루션을 사용하는 환경에서도, ADOT(OpenTelemetry)를 수집 레이어로 활용하면 위 서비스들과 동일한 데이터를 3rd Party 백엔드로 전송할 수 있습니다. MCP 통합 레이어가 백엔드 선택을 추상화하므로, AI 도구와 Agent는 어떤 관찰성 스택에서든 동일하게 동작합니다.
:::

자세한 관찰성 스택 구축 방법과 스택 선택 패턴은 [EKS 지능형 관찰성 스택 구축](/docs/aiops-aidlc/aiops-observability-stack)을 참조하세요.

---

## 8. AIOps 성숙도 모델

<AiopsMaturityModel />

### 성숙도 레벨별 전환 가이드

#### Level 0 → Level 1 전환 (가장 빠른 ROI)

Managed Add-ons와 AMP/AMG 도입만으로 관찰성 기초를 확립할 수 있습니다. `aws eks create-addon` 명령으로 ADOT, CloudWatch Observability Agent를 배포하고, AMP/AMG로 중앙 집중식 대시보드를 구축합니다.

```bash
# Level 1 시작: 핵심 관찰성 Add-ons 배포
aws eks create-addon --cluster-name my-cluster --addon-name adot
aws eks create-addon --cluster-name my-cluster --addon-name amazon-cloudwatch-observability
aws eks create-addon --cluster-name my-cluster --addon-name eks-node-monitoring-agent
```

#### Level 1 → Level 2 전환 (자동화 기초)

Managed Argo CD로 GitOps를 도입하고, ACK로 AWS 리소스를 K8s CRD로 선언적 관리합니다. KRO로 복합 리소스를 단일 배포 단위로 구성하면, 인프라 변경의 일관성과 추적성이 크게 향상됩니다.

#### Level 2 → Level 3 전환 (지능형 분석)

CloudWatch AI와 DevOps Guru를 활성화하여 ML 기반 이상 탐지와 예측 분석을 시작합니다. CloudWatch Investigations로 AI 근본 원인 분석을 도입하고, Q Developer로 자연어 기반 트러블슈팅을 활용합니다.

#### Level 3 → Level 4 전환 (자율 운영)

Kiro + Hosted MCP로 프로그래머틱 운영 체계를 구축하고, Kagent/Strands Agent를 배포하여 인시던트 대응, 배포 검증, 리소스 최적화를 AI가 자율적으로 수행하도록 합니다.

:::warning 점진적 도입 권장
Level 0에서 Level 4로 한 번에 도약하려 하지 마세요. 각 레벨에서 충분한 운영 경험과 데이터를 축적한 후 다음 레벨로 전환하는 것이 성공 확률이 높습니다. 특히 Level 3 → Level 4 전환은 **AI 자율 복구의 안전성 검증**이 핵심입니다.
:::

---

## 9. ROI 평가

<RoiMetrics />

### ROI 평가 프레임워크

AIOps 도입의 ROI를 체계적으로 평가하기 위한 프레임워크입니다.

#### 정량적 지표

<RoiQuantitativeMetrics />

#### 정성적 지표

- **운영팀 만족도**: 반복 작업 감소, 전략적 업무 집중
- **배포 자신감**: 자동 검증으로 배포 품질 향상
- **인시던트 대응 품질**: 근본 원인 해결률 증가
- **지식 관리**: AI Agent가 대응 패턴을 학습하여 조직 지식 축적

### 비용 구조 고려사항

<CostStructure />

---

## 10. 마무리

AIOps는 K8s 플랫폼의 강력한 기능과 확장성을 AI로 극대화하면서, 운영 복잡도를 낮추고 혁신을 가속하는 운영 패러다임입니다.

### 핵심 요약

1. **AWS 오픈소스 전략**: Managed Add-ons + 관리형 오픈소스(AMP/AMG/ADOT) → 운영 복잡성 제거
2. **EKS Capabilities**: Managed Argo CD + ACK + KRO → 선언적 자동화의 핵심 컴포넌트
3. **Kiro + Hosted MCP**: Spec-driven 프로그래머틱 운영 → 비용효율적이고 빠른 대응
4. **AI Agent 확장**: Q Developer(GA) + Strands(OSS) + Kagent(초기) → 점진적 자율 운영

### 다음 단계

<NextSteps />

### 참고 자료

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [Amazon EKS Add-ons](https://docs.aws.amazon.com/eks/latest/userguide/eks-add-ons.html)
- [EKS Capabilities](https://docs.aws.amazon.com/eks/latest/userguide/eks-capabilities.html)
- [AWS Hosted MCP Servers](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
- [Kiro IDE](https://kiro.dev/)
