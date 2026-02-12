---
title: "AIops & AIDLC"
sidebar_label: "AIops & AIDLC"
description: "K8s 플랫폼의 장점을 AI로 극대화하면서 복잡도는 낮춰 혁신을 가속하는 AIOps & AIDLC 가이드"
sidebar_position: 4
category: "aiops-aidlc"
last_update:
  date: 2026-02-12
  author: devfloor9
---

import { PlatformComparison, CoreTechStack } from '@site/src/components/AiopsIntroTables';

# AIops & AIDLC for Modern Application Platform

> 📅 **작성일**: 2026-02-12 | ⏱️ **읽는 시간**: 약 5분

Kubernetes는 컨테이너 오케스트레이션의 표준으로 자리 잡았지만, 그 다양한 기능과 확장성은 운영 복잡도라는 대가를 수반합니다. AIOps(AI for IT Operations)와 AIDLC(AI-Driven Development Lifecycle)는 이 복잡도를 AI로 해결하면서 K8s 플랫폼의 장점을 극대화하는 접근입니다. 단순히 AI를 모니터링에 적용하는 수준을 넘어, 개발부터 배포, 운영, 장애 대응까지 전체 수명주기를 AI가 주도하는 새로운 운영 패러다임을 제시합니다.

이 가이드의 핵심 전제는 AWS의 오픈소스 전략입니다. AWS는 Kubernetes 생태계의 핵심 도구들을 Managed Add-on(22+), Community Add-ons Catalog, 그리고 관리형 오픈소스 서비스(AMP, AMG, ADOT)로 제공하여 운영 부담을 AWS에 위임하면서도 오픈소스의 유연성과 이식성을 유지합니다. 2025년 11월에는 EKS Capabilities(Managed Argo CD, ACK, KRO)를 발표하여 GitOps와 선언적 인프라 관리까지 AWS 관리형으로 확장했습니다. EKS는 이 오픈소스 전략의 핵심 실행자로서, K8s 네이티브 자동화의 중심 컴포넌트 역할을 수행합니다.

이러한 기반 위에서 AIOps의 핵심 도구로 등장한 것이 Kiro와 MCP(Model Context Protocol)입니다. Kiro는 Spec-driven 개발 방식(requirements → design → tasks → 코드)으로 프로그래머틱 자동화를 실현하며, AWS MCP 서버(50+ GA)를 통해 EKS 클러스터 제어, CloudWatch 메트릭 분석, 비용 최적화 등을 개발 워크플로우 안에서 직접 수행합니다. 2025년 11월에는 Fully Managed MCP(EKS/ECS Preview)와 AWS MCP Server 통합(15,000+ API, Preview)이 추가되어, 로컬 실행부터 클라우드 호스팅, 전체 AWS API 통합까지 3단계 호스팅 옵션을 제공합니다. 개별 MCP 서버가 서비스별 심화 도구(kubectl 실행, PromQL 쿼리 등)를 제공한다면, 통합 서버는 멀티 서비스 복합 작업과 Agent SOPs(사전 구축 워크플로우)가 강점이며, 두 방식은 대체가 아닌 병용 관계입니다.

Kiro + MCP가 "사람이 지시하고 AI가 실행"하는 프로그래머틱 패턴이라면, AI Agent 프레임워크는 이벤트 기반으로 AI가 자율적으로 감지·판단·실행하는 다음 단계입니다. Amazon Q Developer(GA)는 CloudWatch Investigations와 EKS 트러블슈팅에서 가장 성숙한 프로덕션 패턴을 제공하고, Strands Agents(오픈소스)는 AWS 프로덕션 검증을 거친 에이전트 SDK로 Agent SOPs를 자연어 워크플로우로 정의합니다. Kagent는 K8s 네이티브 AI 에이전트로 MCP 통합(kmcp)을 지원하지만 아직 초기 단계입니다. 현실적인 접근은 Q Developer부터 시작하여 점진적으로 에이전트 범위를 확장하는 것입니다.

## Agentic AI Platform과의 차이

이 카테고리는 **AI로 플랫폼을 운영하는 방법**에 집중합니다. Agentic AI Platform이 LLM 서빙, GPU 관리, 추론 최적화 등 AI 워크로드를 실행하는 플랫폼 자체를 다룬다면, AIops & AIDLC는 그 플랫폼(또는 일반 애플리케이션 플랫폼)을 AI 도구로 더 효율적으로 개발하고 운영하는 방법론을 제공합니다.

<PlatformComparison />

<CoreTechStack />

:::info 학습 경로
**1 → 2 → 3 → 4** 순서로 읽으면 AIOps 전략 수립부터 자율 운영 실현까지의 전체 여정을 따라갈 수 있습니다.

- [1. AIOps 전략 가이드](./aiops-introduction.md)는 전체 방향성을 이해하는 출발점
- [2. 지능형 관찰성 스택](./aiops-observability-stack.md)은 AI 분석의 데이터 기반을 구축
- [3. AIDLC 프레임워크](./aidlc-framework.md)는 개발 방법론을
- [4. 예측 스케일링 및 자동 복구](./aiops-predictive-operations.md)는 자율 운영의 실현을 다룹니다.
:::

## 참고 자료

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [AWS Labs AIDLC Workflows (GitHub)](https://github.com/awslabs/aidlc-workflows)
- [Proactive EKS Monitoring with CloudWatch](https://aws.amazon.com/blogs/containers/proactive-amazon-eks-monitoring-with-amazon-cloudwatch-operator-and-aws-control-plane-metrics/)
- [AWS MCP Servers (개별 50+ GA)](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
