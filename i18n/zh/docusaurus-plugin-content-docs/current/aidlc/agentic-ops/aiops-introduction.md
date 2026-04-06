---
title: "Revolutionizing K8s Operations with AI — AIOps Strategy Guide"
sidebar_label: "AIOps Strategy Guide"
description: "AIOps strategy to reduce K8s platform complexity with AI and accelerate innovation — AWS open-source managed services, Kiro+MCP, AI Agent extension"
category: "agentic-ops"
tags: [aiops, eks, observability, anomaly-detection, monitoring, kiro, mcp, ai-agent]
last_update:
 date: 2026-02-14
 author: devfloor9
---

import { AiopsMaturityModel, MonitoringComparison, AwsServicesMap, RoiMetrics, AwsManagedOpenSource, K8sOpenSourceEcosystem, EvolutionDiagram, DevOpsAgentArchitecture, McpServerTypes, McpServersMap, ManagedAddonsOverview, AiToolsComparison, AiAgentFrameworks, OperationPatternsComparison, RoiQuantitativeMetrics, CostStructure, NextSteps } from '@site/src/components/AiopsIntroTables';

# Revolutionizing K8s Operations with AI — AIOps Strategy Guide

> 📅 **Created**: 2026-02-12 | **Updated**: 2026-02-14 | ⏱️ **Reading time**: ~48 min

---

## 1. Overview

**AIOps(Artificial Intelligence for IT Operations)**는 머신러닝 and 빅data analysis IT operations applying, incident detection·diagnosis·recovery Automation and infrastructure Management complex 획기 as 줄this is Operations 패러다임.

Kubernetes platform declarative API, automatic scaling, 치유 etc. powerful feature and extension provides, but, 그 complex operations teams에 상당 부담 . **AIOps is a model that maximizes K8s platform capabilities and extensibility with AI while reducing complexity and accelerating innovation**.

### What This Document Covers

- AWS open-source strategy and EKS evolution 과정
- Kiro + Hosted MCP based AIOps core architecture
- programmatic Operations vs directing based Operations ratio교
- Traditional Monitoring and AIOps 패러다임 차이
- AIOps core capabilities and EKS application scenarios
- AWS AIOps service 맵 and maturity model
- ROI assessment framework

:::info Learning Path
This document AIops & AIDLC time리즈 첫 번째 document. entire Learning Path:

1. **[1. AIOps strategy 가이드](./aiops-introduction.md)** (Current document) → 2. **[2. intelligent observability stack](./aiops-observability-stack.md)** → 3. **[3. AIDLC framework](../../aidlc/aidlc-framework.md)** → 4. **[4. prediction scaling and automatic recovery](./aiops-predictive-operations.md)**

:::

---

## 2. AWS Open-Source Strategy and EKS Evolution

AWS container strategy **open-source K8s native managed service evolution**time키 방향 as day관되 발beforehas been. 이 strategy core is K8s 생태계 강점 maintenanceif서 operational complexity removal 것.

### 2.1 Managed Add-ons: Eliminating Operational Complexity

EKS Managed Add-ons K8s cluster key features AWS directly Management extension 모듈. current **22 abnormal** Managed Add-on are provided ([AWS 공식 목록](https://docs.aws.amazon.com/eks/latest/userguide/workloads-add-ons-available-eks.html) Reference).

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

2025year 3monthly 출time **Community Add-ons Catalog**은 metrics-server, cert-manager, external-dns etc. 커뮤니티 tool EKS 콘솔 from 원클릭 as Deploymentcan . migration Helm이나 kubectl directly installation·Managementmust 했던 tool들 AWS Management 체계 편입time킨 것.

### 2.3 Managed Open-Source Services — Reduce Operational Burden, Avoid Vendor Lock-in

AWS open-source strategy 두 가지 core objectives 있:

1. **operational burden removal**: patch, scaling, HA configuration, 백업 etc. operational tasks AWS 대신 perform
2. **vendor lock-in prevention**: standard open-source API(PromQL, Grafana Dashboard JSON, OpenTelemetry SDK 등)를 그대 use므로, neededtime 체 operations transition possible

이 strategy observability 국되지 not. **database, streaming, search·analysis, ML** etc. infrastructure before반 걸쳐 major open-source 프로젝트 complete managed as provides.

<AwsManagedOpenSource />

이 광scope managed open-source 포트폴리오 중 from **Kubernetes and directly 관련 프로젝트 and service**를 별also cleanupif following and 같:

<K8sOpenSourceEcosystem />

#### 2.2.3 vendor lock-in prevention actual case

AWS managed open-source strategy Core Value **vendor lock-in without operational burdenonly 줄인다**는 것. standard open-source API 그대 use므로, neededtime 다른 backend transition .

##### ADOT based observability backend transition pattern

ADOT(AWS Distro for OpenTelemetry)는 OpenTelemetry based으로, **application code modificationnot 않고 observability backend 유롭 교체** .

**transition possible backend:**

| backend | type | transition time change scope |
|--------|------|------------------|
| **CloudWatch** | AWS native | ADOT Collector exporter Configurationonly change |
| **Datadog** | 3rd Party SaaS | ADOT Collector exporter Configurationonly change |
| **Splunk** | 3rd Party (SaaS/On-prem) | ADOT Collector exporter Configurationonly change |
| **Grafana Cloud** | open-source managed | ADOT Collector exporter Configurationonly change |
| **Self-hosted Prometheus** | 체 Operations | ADOT Collector exporter Configurationonly change |

:::tip ADOT Core Value
ADOT(OpenTelemetry based)를 useif observability backend 교체해also **application code modification needed 없**. 이것 AWS open-source strategy Core Value. application OpenTelemetry SDK metric/traces/log generation and, ADOT Collector this collection to 원 backend transfer.
:::

**ADOT Collector Configuration example: CloudWatch → Datadog transition**

```yaml
# CloudWatch 백엔드 사용 (기존)
receivers:
 otlp:
 protocols:
 grpc:
 endpoint: 0.0.0.0:4317

processors:
 batch:

exporters:
 awscloudwatch:
 namespace: MyApp
 region: us-east-1

service:
 pipelines:
 metrics:
 receivers: [otlp]
 processors: [batch]
 exporters: [awscloudwatch]
```

```yaml
# Datadog 백엔드로 전환 (exporter만 변경)
receivers:
 otlp:
 protocols:
 grpc:
 endpoint: 0.0.0.0:4317

processors:
 batch:

exporters:
 datadog:
 api:
 site: datadoghq.com
 key: ${DATADOG_API_KEY}

service:
 pipelines:
 metrics:
 receivers: [otlp]
 processors: [batch]
 exporters: [datadog] # ← 이 부분만 변경
```

**application code change none:**

```python
# Python 애플리케이션 — 백엔드 전환 시에도 코드 수정 불필요
from opentelemetry import metrics

meter = metrics.get_meter(__name__)
request_counter = meter.create_counter("http_requests_total")

def handle_request():
 request_counter.add(1) # ← 백엔드와 무관하게 동일한 코드
```

##### AMP/AMG → Self-hosted transition consideration사항

AWS managed Prometheus(AMP) and Grafana(AMG) from 체 operations transition when following 사항 considerationmust .

**AMP → Self-hosted Prometheus transition:**

| Item | AMP (managed) | Self-hosted Prometheus |
|------|-------------|------------------------|
| **PromQL 호환** | 100% 호환 | 100% 호환 (동day query use possible) |
| **data 마이그레이션** | Remote Write → Self-hosted | Thanos/Cortex etc. as 장기 storage소 build needed |
| **scaling** | AWS automatic Management | Thanos/Cortex 평 extension build needed |
| **고가용** | AWS automatic guarantee | cluster링 and 복제 directly Configuration |
| **operational burden** | none | 업그레이드, patch, Monitoring, 백업 needed |
| **cost** | collection/storage/query당 과금 | infrastructure cost + Operations 인력 cost |

**AMG → Self-hosted Grafana transition:**

| Item | AMG (managed) | Self-hosted Grafana |
|------|-------------|---------------------|
| **dashboard 호환** | 100% 호환 | 100% 호환 (JSON 내보내기/가져오기) |
| **IAM Integration** | AWS IAM native | SAML/OAuth directly Configuration needed |
| **plugin** | AWS data source preemptive installation | manual installation and 버before Management |
| **업그레이드** | AWS automatic perform | directly 계획 and execution |
| **고가용** | AWS automatic guarantee | load balancer and 세션 storage소 Configuration needed |

##### ratio교표: AWS managed vs Self-hosted vs 3rd Party

| 기준 | AWS managed (AMP/AMG) | Self-hosted (Prometheus/Grafana) | 3rd Party (Datadog/Splunk) |
|------|----------------------|----------------------------------|---------------------------|
| **Operations complexalso** | 낮음 (AWS Management) | high ( directly Management) | 낮음 (벤더 Management) |
| **initial Configuration** | simple (AWS 콘솔/CLI) | complex (cluster Configuration) | simple (SaaS registration) |
| **scaling** | automatic | manual (Thanos/Cortex needed) | automatic |
| **장기 storage** | AMP default 150day | directly Configuration (S3 + Thanos 등) | 벤더 policy 따름 |
| **Cost Structure** | use량 based | infrastructure + 인력 | use량 or 호스트 based |
| **data 주권** | AWS region 내 | complete 제어 | 벤더 infrastructure |
| **커스터마이징** | limitation | complete 유 | 벤더 Provision scope 내 |
| **transition 용이** | high (standard API) | high (standard open-source) | intermediate (per 벤더 차이) |

:::info transition per scenario recommended
**AWS → Self-hosted transition**: data 주권, 커스터마이징, Cost Optimization(대규모 environment)가 major 이유day when consideration. 단, Operations 역량 and 인력 securing mandatory.

**AWS → 3rd Party transition**: Integration observability platform(APM, log, infrastructure Monitoring Integration), 고급 AI/ML feature, multi 클라우드 Integration needed when consideration.

**Self-hosted → AWS transition**: operational burden reduction, 고가용 Automation, fast start needed when 유용. especially observability before문 인력 shortage 팀 합.
:::

**Key Message**: AWS managed service use더라also standard open-source API(PromQL, OpenTelemetry, Grafana Dashboard JSON 등)를 그대 use므로, transition needed when **기술 종속 without movement possible**. 이것 AWS open-source strategy Core 차별화 포인트.


### 2.4 Key Message of Evolution

<EvolutionDiagram />

:::tip Key Insight
EKS AWS open-source strategy **Core execution**. managed service operational complexity removal and, EKS Capabilities Automation 컴포넌트 enhancement and, Kiro+MCP AI utilization efficiency Operations 실현 and, AI Agent autonomous Operations extension — each phase migration phase 위 쌓this is **cumulative evolution** model.
:::

---

## 3. The Core of AIOps: AWS Automation → MCP Integration → AI Tools → Kiro Orchestration

섹션 2 from 살펴본 AWS open-source strategy(Managed Add-ons, managed service, EKS Capabilities)은 K8s Operations based provides. AIOps 이 based 위 **MCP Automation tool Integration and, AI tool connection and, Kiro before체 orchestration** 계층 structure.

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

### 3.1 MCP — Unified Interface for AWS Automation Tools

섹션 2 Managed Add-ons, AMP/AMG, CloudWatch, EKS Capabilities 각 each powerful Automation tool이지only, AI 이 tool들 approach려면 **standardization interface**is required. MCP(Model Context Protocol)가 이 role . AWS **50 abnormal MCP server**를 open-source Provision to, each AWS service AI tool callcan tool(Tool)로 노출.

<McpServersMap />

#### Detailed Comparison of Three Hosting Methods

<McpServerTypes />

#### Individual MCP vs Unified Server — Complementary, Not Replacement

세 가지 method **대체 관계 아니라 상호 보완** 관계. Core 차this is **깊 vs scope**.

**per MCP server** (EKS MCP, CloudWatch MCP 등)는 해당 service **native 념 이해 advanced tool**. for example, EKS MCP kubectl execution, Pod log analysis, K8s event based troubleshooting etc. Kubernetes before문 feature provides. Fully Managed 버before(EKS/ECS)은 이 the same feature AWS 클라우드 from 호스팅 to IAM 인증, CloudTrail audit, automatic patch etc. 엔터프라이즈 요구사항 additional 것.

**AWS MCP Server Integration**은 15,000+ AWS API 범용 as call server. AWS Knowledge MCP + AWS API MCP 나 Integration 것으로, EKS case `eks:DescribeCluster`, `eks:ListNodegroups` etc. AWS API level call possiblenotonly, Pod log Analysis이나 K8s event resolution such as advanced feature Provisionnot not. 대신 **multi service 복합 작업**(S3 + Lambda + CloudFront 조합 등)과 **Agent SOPs**(preemptive build workflow)가 강점.

:::info 현실인 병용 pattern
```
EKS 심화 작업 → 개별 EKS MCP (또는 Fully Managed)
 "Pod CrashLoopBackOff 원인 분석해줘"

멀티 서비스 작업 → AWS MCP Server 통합
 "S3에 정적 사이트 올리고 CloudFront 연결해줘"

운영 인사이트 → 개별 CloudWatch MCP + Cost Explorer MCP
 "지난 주 비용 급증 원인과 메트릭 이상 분석해줘"
```

IDE per MCP and Integration server **함께 connection**해두면, AI tool 작업 특 according to appropriate server automatic optional.
:::

### 3.1.1 Amazon Bedrock AgentCore Integration Pattern

**Amazon Bedrock AgentCore**는 production environment from AI Agent safety Deployment and Managementcan complete managed platform. MCP server and Integration to EKS Monitoring and operational tasks Automation 엔터프라이즈급 Agent build .

#### Bedrock AgentCore overview

Bedrock AgentCore following feature Provision:

| Feature | Description | EKS operations서 value |
|------|------|-------------------|
| **Agent Orchestration** | complex 다phase workflow automatic execution | EKS failure response scenario autonomous execution |
| **Knowledge Bases** | RAG based 컨텍스트 search | past incident response 이력 learning |
| **Action Groups** | external API/tool Integration | MCP server through EKS 제어 |
| **Guardrails** | safety 장치 and 필터링 | risk Operations 명령 automatic blocking |
| **Audit Logging** | CloudTrail Integration audit tracking | compliance and security audit |

#### EKS Monitoring/Operations 위 Bedrock Agent build pattern

**architecture:**

```
[CloudWatch 알람 / EventBridge 이벤트]
 ↓
[Bedrock Agent 트리거]
 ↓
[Bedrock AgentCore Orchestration]
 ├─ Knowledge Base: 과거 인시던트 대응 이력 검색
 ├─ Action Group 1: EKS MCP 서버 (Pod 상태 조회, 로그 수집)
 ├─ Action Group 2: CloudWatch MCP (메트릭 분석)
 ├─ Action Group 3: X-Ray MCP (트레이스 분석)
 └─ Guardrails: 위험 명령 필터링 (프로덕션 삭제 방지)
 ↓
[자율 진단 및 복구 실행]
 ↓
[CloudTrail 감사 로그 기록]
```

**Practical Example: Pod CrashLoopBackOff automatic response Agent**

```python
# Bedrock Agent 정의 (Terraform 예시)
resource "aws_bedrock_agent" "eks_incident_responder" {
 agent_name = "eks-incident-responder"
 foundation_model = "anthropic.claude-3-5-sonnet-20241022-v2:0"
 instruction = <<EOF
 You are an EKS operations expert responsible for diagnosing and resolving
 Kubernetes incidents. When a Pod enters CrashLoopBackOff state:
 1. Collect Pod logs and events
 2. Analyze error patterns
 3. Check related resources (ConfigMaps, Secrets, Services)
 4. Suggest remediation or auto-fix if safe
 EOF

 # Action Group: EKS MCP 서버 통합
 action_group {
 action_group_name = "eks-operations"
 description = "EKS cluster operations via MCP"

 api_schema {
 payload = jsonencode({
 openAPIVersion = "3.0.0"
 info = { title = "EKS MCP Actions", version = "1.0" }
 paths = {
 "/getPodLogs" = {
 post = {
 operationId = "getPodLogs"
 parameters = [
 { name = "cluster", in = "query", required = true, schema = { type = "string" } },
 { name = "namespace", in = "query", required = true, schema = { type = "string" } },
 { name = "pod", in = "query", required = true, schema = { type = "string" } }
 ]
 }
 }
 "/getPodEvents" = {
 post = {
 operationId = "getPodEvents"
 parameters = [
 { name = "cluster", in = "query", required = true },
 { name = "namespace", in = "query", required = true },
 { name = "pod", in = "query", required = true }
 ]
 }
 }
 }
 })
 }

 action_group_executor {
 lambda = aws_lambda_function.eks_mcp_proxy.arn
 }
 }

 # Guardrails: 위험 명령 차단
 guardrail_configuration {
 guardrail_identifier = aws_bedrock_guardrail.production_safety.id
 guardrail_version = "1"
 }
}

# Guardrails 정의: 프로덕션 환경 보호
resource "aws_bedrock_guardrail" "production_safety" {
 name = "production-safety"

 # 프로덕션 네임스페이스 삭제 차단
 content_policy_config {
 filters_config {
 input_strength = "HIGH"
 output_strength = "HIGH"
 type = "VIOLENCE" # 파괴적 작업 필터
 }
 }

 # 민감 데이터 필터링
 sensitive_information_policy_config {
 pii_entities_config {
 action = "BLOCK"
 type = "AWS_ACCESS_KEY"
 }
 pii_entities_config {
 action = "BLOCK"
 type = "AWS_SECRET_KEY"
 }
 }

 # 허용된 작업만 실행
 topic_policy_config {
 topics_config {
 name = "allowed_operations"
 type = "DENY"
 definition = "Pod deletion in production namespace"
 }
 }
}
```

#### AgentCore + MCP server 연동 workflow

**Step 1: Lambda Proxy MCP server call**

```python
# Lambda 함수: Bedrock Agent Action → EKS MCP 서버 프록시
import json
import requests

def lambda_handler(event, context):
 # Bedrock Agent에서 전달된 파라미터
 action = event['actionGroup']
 api_path = event['apiPath']
 parameters = event['parameters']

 # EKS MCP 서버 호출 (Hosted MCP 엔드포인트)
 mcp_endpoint = "https://mcp-eks.aws.example.com"

 if api_path == "/getPodLogs":
 response = requests.post(f"{mcp_endpoint}/tools/get-pod-logs", json={
 "cluster": parameters['cluster'],
 "namespace": parameters['namespace'],
 "pod": parameters['pod'],
 "tail": 100
 })
 logs = response.json()['logs']

 return {
 'messageVersion': '1.0',
 'response': {
 'actionGroup': action,
 'apiPath': api_path,
 'httpMethod': 'POST',
 'httpStatusCode': 200,
 'responseBody': {
 'application/json': {
 'body': json.dumps({'logs': logs})
 }
 }
 }
 }
```

**Step 2: EventBridge Rule Agent automatic trigger**

```json
{
 "source": ["aws.eks"],
 "detail-type": ["EKS Pod State Change"],
 "detail": {
 "status": ["CrashLoopBackOff"]
 }
}
```

#### Bedrock Agent vs Kagent vs Strands ratio교

| Item | Bedrock Agent (AgentCore) | Kagent | Strands |
|------|-------------------------|--------|---------|
| **maturity** | GA (production readiness 완료) | initial phase (알파) | stabilization phase (베타) |
| **호스팅** | complete managed (AWS) | 체 호스팅 (K8s) | 체 호스팅 or 클라우드 |
| **MCP Integration** | Lambda Proxy needed | native MCP 클라이언트 | MCP tool directly call |
| **Guardrails** | 내장 (AWS Guardrails) | custom Implementation needed | Python 데코레이터 Implementation |
| **audit tracking** | CloudTrail automatic Integration | manual 로깅 Implementation needed | 로깅 plugin Configuration |
| **knowledge 베이스** | Bedrock Knowledge Bases (RAG) | external 벡터 DB 연동 | LangChain RAG Integration |
| **Cost Structure** | API call당 과금 | infrastructure cost (K8s) | infrastructure cost |
| **합 scenario** | 엔터프라이즈 compliance, production Automation | K8s native Integration, 실험 AI Operations | 범용 Agent workflow, fast 프로토타이핑 |
| **advantage** | 제 operational burden, 엔터프라이즈급 security | K8s CRD Integration, native observability | 유연 workflow, 풍부 tool 생태계 |
| **단점** | Lambda Proxy needed, AWS 종속 | initial phase, non-안정can음 | 체 호스팅 needed, operational burden |

#### each framework 합 scenario

**Bedrock Agent optionalmust case:**

- 엔터프라이즈 environment from compliance and audit tracking mandatory인 case
- AI Agent infrastructure directly Management and 싶지 않 case
- AWS Guardrails safety 장치 강제must case
- past incident 이력 RAG learningtime켜야 case

**Kagent optionalmust case:**

- K8s native Integration 최우선인 case (CRD, Operator pattern)
- 실험 AI Operations 빠르 timealso and 싶 case
- AWS 외 클라우드나 on-premises K8s cluster use case
- initial phase 프로젝트 non-안정 감can case

**Strands optionalmust case:**

- 유연 Agent workflow and tool Integration required case
- Python 생태계 (LangChain, CrewAI 등)와 Integration and 싶 case
- 범용 AI Agent platform as EKS 외 various 작업 Automation려 case
- 프로토타이핑 and fast 실험 우선time case

:::tip Practical Recommended Strategy
**production environment**: Bedrock Agent start to 엔터프라이즈 요구사항(security, audit, Guardrails)을 충족 after, **development/staging environment** from Kagent/Strands 실험 as test 이브리드 strategy recommended. Bedrock Agent immediately use possible 안정 Provision and, Kagent/Strands 향after K8s native autonomous operations transitioncan based 마련.
:::

### 3.2 AI Tools — Infrastructure Control via MCP

MCP AWS service AI approach possible interface 노출if, various AI tool들 이 through infrastructure directly 조times and 제어 .

<AiToolsComparison />

이 phase from AI tool 사람 지time according to **per 작업 perform**. "Pod status Verification해줘", "cost Analysis해줘" such as 프롬프트 MCP through Real-time data based as response. 유용notonly, each 작업 independent이고 사람 매번 지timemust 계 .

### 3.3 Kiro — Spec-Driven Unified Orchestration

**Kiro**는 per AI tool 계 넘어, ** entire workflow Spec as definition and MCP through day관되 execution** orchestration 계층. MCP native design AWS MCP server and directly Integration.

Kiro Spec-driven workflow:

1. **requirements.md** → 요구사항 structure화 Spec as definition
2. **design.md** → architecture 결정사항 document화
3. **tasks.md** → Implementation 태스크 automatic minutes해
4. **code generation** → MCP collection actual infrastructure data 반영 code, IaC, Configuration 파day generation

per AI tool "물어보면 답" method이라면, Kiro **Spec 번 definition multiple MCP server 연쇄 call to 최종 result물 reaching**.

```
[1] Spec 정의 (requirements.md)
 "EKS 클러스터의 Pod 자동 스케일링을 트래픽 패턴 기반으로 최적화"
 ↓
[2] MCP로 현재 상태 수집
 ├─ EKS MCP → 클러스터 구성, HPA 설정, 노드 현황
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

이 workflow core is AI **추상 추측 아니라 actual infrastructure data based as code generation**다 점. MCP 없으면 AI day반인 Best Practiceonly presentationnotonly, MCP 있으면 current cluster actual status 반영 맞춤-type result물 only들어냅.

<DevOpsAgentArchitecture />

### 3.4 Extension to AI Agents — Autonomous Operations

Kiro + MCP "사람 Spec definition and AI execution" orchestration이라면, AI Agent framework **event based as AI autonomous as detection·decision·execution** Next Steps. MCP Provision the same infrastructure interface 위에서, 사람 입 without Agent 스스 loop 돌립.

<AiAgentFrameworks />

### 3.5 Amazon Q Developer & Q Business Latest Features

Amazon Q Developer and Q Business AWS 대표인 AI based Operations tool. 두 제품 서 다른 목 as design되었지only, AIOps 맥락 from 상호 보완 as use.

:::info Amazon Q Developer vs Q Business
**Amazon Q Developer**는 development 생산 tool로, code 작, infrastructure Automation, troubleshooting 특화 . **Amazon Q Business**는 ratio즈니스 data Analysis tool로, Operations log, metric, ratio즈니스 insight generation utilization. AIOps from Q Developer code/infrastructure Automation에, Q Business Operations log/metric based insight generation use.
:::

#### Amazon Q Developer 최신 feature (2025-2026)

**1. Real-time code build and test (2025year 2monthly)**

Q Developer 이제 code change 사항 **development review기 before automatic as build and test**.

**feature**:
- code generation after immediately build execution
- 단위 test automatic execution and result 보고
- build failure time automatic modification recommendation
- development review before 품질 Validation 완료

**EKS environment from utilization**:

```
개발자: "Deployment YAML에 리소스 제한을 추가하고 HPA를 설정해줘"

Q Developer:
 1. Deployment YAML 수정 (requests/limits 추가)
 2. HPA YAML 생성
 3. kubectl apply --dry-run=client로 문법 검증
 4. 변경사항을 개발자에게 제시 (이미 검증 완료 상태)
```

**References**:
- [Enhancing Code Generation with Real-Time Execution in Amazon Q Developer](https://aws.amazon.com/blogs/devops/enhancing-code-generation-with-real-time-execution-in-amazon-q-developer/)

**2. CloudWatch Investigations Integration — AI based root cause Analysis**

Q Developer CloudWatch Investigations and Integration, **Operations incident root cause natural language 설명**.

**workflow**:

```
1. CloudWatch 알람 발생 (예: EKS Pod의 메모리 사용률 급증)
2. Q Developer에게 질문: "왜 production 네임스페이스의 Pod 메모리가 급증했나요?"
3. Q Developer가 자동 분석:
 ├─ CloudWatch 메트릭: 메모리 사용 패턴
 ├─ X-Ray 트레이스: 특정 API 호출에서 메모리 누수 의심
 ├─ EKS 로그: OutOfMemory 에러 로그
 └─ 최근 배포 이력: 2시간 전 새 버전 배포
4. Q Developer 응답:
 "2시간 전 배포된 v2.3.1에서 캐시 무효화 로직 버그로 인해 메모리 누수가
 발생했습니다. /api/users 엔드포인트 호출 시 캐시가 계속 누적됩니다.
 권장 조치: v2.3.0으로 롤백하거나 캐시 TTL을 설정하세요."
```

**3. Cost Explorer Integration — Cost Optimization automatic recommendation**

Q Developer AWS Cost Explorer and Integration, **cost spike cause automatic Analysis and Optimization 방안 recommendation**.

**EKS Cost Optimization scenario**:

```
개발자: "지난 주 EKS 비용이 급증한 이유를 알려줘"

Q Developer 분석:
 ├─ Cost Explorer: EC2 인스턴스 비용 40% 증가
 ├─ CloudWatch 메트릭: 평균 CPU 사용률 25% (과도한 프로비저닝)
 ├─ Karpenter 로그: 대부분 c5.4xlarge 인스턴스 사용
 └─ 워크로드 패턴: 메모리 집약적, CPU 집약적 아님

Q Developer 권장:
 1. c5.4xlarge → r5.2xlarge로 변경 (메모리 최적화 인스턴스)
 2. Karpenter NodePool에 Spot 인스턴스 우선순위 추가
 3. HPA 설정을 CPU가 아닌 메모리 기반으로 조정
 예상 절감: 월 $1,200 (약 30%)
```

**4. directly 콘솔 troubleshooting — EKS cluster 이슈 natural language 질의**

AWS 콘솔 from Q Developer call to **EKS cluster current status immediately 질의** .

**example**:

```
콘솔에서 Q Developer 호출:

질문: "이 클러스터에 CrashLoopBackOff 상태인 Pod가 있나요?"
답변: "production 네임스페이스의 api-server Pod가 CrashLoopBackOff 상태입니다.
 원인: ConfigMap 'api-config'가 존재하지 않습니다."

질문: "어떤 알람이 활성화되어 있나요?"
답변: "현재 3개의 CloudWatch 알람이 ALARM 상태입니다:
 1. EKS-HighMemoryUsage (80% 임계값 초과)
 2. EKS-FailedPods (5개 이상 실패)
 3. EKS-DiskPressure (노드 디스크 90% 사용)"
```

**5. security scan automatic modification recommendation**

Q Developer code and IaC(Infrastructure as Code) **security vulnerability automatic scan and modification 방안 presentation**.

**Kubernetes YAML security scan example**:

```yaml
# 개발자가 작성한 Deployment
apiVersion: apps/v1
kind: Deployment
spec:
 template:
 spec:
 containers:
 - name: app
 image: myapp:latest
 securityContext:
 runAsUser: 0 # ⚠️ 보안 이슈: root로 실행

# Q Developer 제안:
# "컨테이너를 root 사용자로 실행하는 것은 보안 위험입니다.
# 다음과 같이 수정하세요:"

securityContext:
 runAsNonRoot: true
 runAsUser: 1000
 readOnlyRootFilesystem: true
 allowPrivilegeEscalation: false
 capabilities:
 drop:
 - ALL
```

#### Amazon Q Business — log based 액셔너블 insight

Amazon Q Business **ratio즈니스 data(log, metric, document)를 Analysis to 액션 아이템 generation** 데 특화 .

**CloudWatch Logs → Q Business workflow**:

```
1. CloudWatch Logs에 EKS 애플리케이션 로그 저장
2. Q Business에 데이터 소스로 CloudWatch Logs 연결
3. 자연어 질의:
 "지난 24시간 동안 가장 많이 발생한 에러는?"
 "에러율이 가장 높은 시간대와 그 원인은?"
 "고객 영향도가 가장 큰 장애는?"

4. Q Business 응답:
 - 에러 유형별 빈도 차트
 - 영향받은 사용자 수 추정
 - 근본 원인 분석 (예: 특정 API 엔드포인트의 DB 타임아웃)
 - 액션 아이템 생성 (예: "DB 연결 풀 크기 증가 필요")
```

**Operations insight automatic generation example**:

| 질 | Q Business response |
|------|----------------|
| "이번 주 Deployment after errorrate 변화는?" | "monthly요day Deployment after errorrate 15% → 22% increase. major cause: /api/checkout endpoint 타임아웃. recommended: 타임아웃 값 5초 → 10초 increase" |
| "cost most 많 드 service는?" | "api-gateway service entire cost 40% 차지. major cause: non- required log storage(Debug 레벨). recommended: log 레벨 Info changeif monthly $800 savings possible" |
| "고객 non-only most 많 feature은?" | "결제 feature from 지난 주 타임아웃 incident 3times occurrence. impact: 약 200명 고객 결제 failure 경험. recommended: 결제 service HPA Configuration adjustment and DB query Optimization" |

**Q Developer vs Q Business utilization ratio교**:

| Scenario | Q Developer | Q Business |
|---------|-------------|------------|
| code 디버깅 | ✅ recommendation | - |
| IaC generation/modification | ✅ recommendation | - |
| infrastructure troubleshooting | ✅ recommendation | - |
| log pattern Analysis | possible | ✅ recommendation |
| ratio즈니스 insight | - | ✅ recommendation |
| 경영진 보고서 generation | - | ✅ recommendation |

:::tip Practical Usage Patterns
**development team**은 Q Developer use to code 작, IaC Management, 즉각 troubleshooting perform. **operations teams**은 Q Developer infrastructure 이슈 해결 and, Q Business 장기 트렌드 Analysis and Cost Optimization insight 얻. **경영진**은 Q Business Operations 현황 보고서 natural language generation.
:::

**References**:
- [Amazon Q Developer for Operations](https://aws.amazon.com/q/developer/operate/)
- [Building AIOps with Amazon Q Developer CLI and MCP Server](https://aws.amazon.com/blogs/machine-learning/building-aiops-with-amazon-q-developer-cli-and-mcp-server/)
- [Amazon Q Business in OpenSearch](https://aws.amazon.com/opensearch-service/features/q-developer/)

---

:::warning Practical Application Guide

- **지금 start**: Q Developer + CloudWatch MCP 조합 as AI based troubleshooting adoption
- **development 생산**: Kiro + EKS/IaC/Terraform MCP Spec-driven development workflow build
- **gradual extension**: repetitive Operations scenario Strands Agent SOPs code화
- **향after 탐색**: Kagent etc. K8s native Agent framework 숙when autonomous operations transition
:::

:::info Core Value
이 계층 structure Core Value ** each 레이어 independent으로also value 있으면서, 위 쌓day록 Automation level 높아진다**는 점. MCPonly connection해also AI tool from infrastructure directly 조timescan고, Kiro 더if Spec-driven workflow possible and, Agent additionalif autonomous operations extension. AMP/CloudWatch/Datadog etc. 어떤 observability stack use든 MCP single interface 추상화므로, AI tool and Agent backend 무관 동day behavior.
:::

---

## 4. Operations Automation Patterns: Human-Directed, Programmatically-Executed

AIOps core is **사람 의also(Intent)와 guardrails definition and, system programmatic execution** "Human-Directed, Programmatically-Executed" model. 이 model 업계 from 세 가지 pattern 스펙트럼 as implementation.

### 4.1 Prompt-Driven (Interactive) Operations

 each phase 사람 natural language 프롬프트 지time and, AI single 작업 perform pattern. ChatOps, AI 어time스턴트 based operations 이 해당.

```
운영자: "현재 production 네임스페이스의 Pod 상태를 확인해줘"
AI: (kubectl get pods -n production 실행 후 결과 반환)
운영자: "CrashLoopBackOff 상태인 Pod의 로그를 봐줘"
AI: (kubectl logs 실행 후 결과 반환)
운영자: "메모리 부족인 것 같으니 limits를 올려줘"
AI: (kubectl edit 실행)
```

**Suitable Situations**: 탐색 디버깅, new type failure analysis, daytimes action
**계**: 사람 loop all phase 관여(Human-in-the-Loop), repetitive scenario from ratioefficiency

### 4.2 Spec-Driven (Codified) Operations

Operations scenario **사양(Spec)이나 code declarative definition** and, system this programmatic execution pattern. IaC(Infrastructure as Code), GitOps, Runbook-as-Code 이 범주 속.

```
[Intent 정의] requirements.md / SOP 문서로 운영 시나리오 선언
 ↓
[코드 생성] Kiro + MCP로 자동화 코드 생성 (IaC, 런북, 테스트)
 ↓
[검증] 자동화된 테스트 + Policy-as-Code 검증
 ↓
[배포] GitOps (Managed Argo CD)로 선언적 배포
 ↓
[모니터링] 관찰성 스택이 실행 결과를 지속 추적
```

**Suitable Situations**: repetitive Deployment, infrastructure provisioning, 정-type화 Operations 절차
**Core Value**: Spec 번 정 → repetitive execution time additional cost none, consistency guarantee, Git based audit tracking

### 4.3 Agent-Driven (Autonomous) Operations

AI Agent **event detection and, 컨텍스트 collection·Analysis to, preemptive definition guardrails 내 from autonomous as response** pattern. Human-on-the-Loop — 사람 guardrails and policy Configuration and, Agent execution.

```
[이벤트 감지] 관찰성 스택 → 알림 트리거
 ↓
[컨텍스트 수집] MCP로 메트릭 + 트레이스 + 로그 + K8s 상태 통합 조회
 ↓
[분석·판단] AI가 근본 원인 분석 + 대응 방안 결정
 ↓
[자율 실행] 가드레일 범위 내 자동 복구 (Kagent/Strands SOPs)
 ↓
[피드백 학습] 결과를 기록하고 대응 패턴 지속 개선
```

**Suitable Situations**: incident automatic response, Cost Optimization, [4. prediction scaling and automatic recovery](./aiops-predictive-operations.md)
**Core Value**: 초 단위 response, 24/7 무인 Operations, 컨텍스트 based intelligent decision

### 4.4 Pattern Comparison: EKS Cluster Issue Response Scenario

<OperationPatternsComparison />

:::tip practical from pattern 조합
세 pattern 배타 아니라 **상호 보완**. actual operations서 new failure type **Prompt-Driven** as 탐색·Analysis 뒤, repetitive possible pattern **Spec-Driven** as code화 and, 최종 as **Agent-Driven** as autonomous화 gradual 숙 과정 거칩. core is repetitive인 Operations scenario Automation to operations teams strategy 작업 focuscanalso록 것.
:::

---

## 5. Traditional Monitoring vs AIOps

<MonitoringComparison />

### The Core of the Paradigm Shift

Traditional Monitoring **사람 규칙 definition and, system 규칙 execution** model. AIOps **system data from pattern learning and, 사람 strategy 결정** model transition.

EKS environment from 이 transition especially important 이유:

1. **microservices complex**: 십~백 service 상호작용 and, manual as all dependency 파악기 difficult
2. **dynamic infrastructure**: Karpenter based node automatic provisioning as infrastructure continuous as 변화
3. **다차원 data**: metric, log, traces, K8s event, AWS service event 동time occurrence
4. **속also 요구**: GitOps based 빈번 Deployment failure cause 다양화

---

## 6. AIOps Core Capabilities

AIOps 네 가지 core capabilities EKS environment scenario along with 살펴봅.

### 6.1 Anomaly Detection

정 threshold not **ML based dynamic baseline** as abnormal detection.

**EKS scenario: gradual memory 누**

```
전통적 방식:
 메모리 사용률 > 80% → 알림 → 운영자 확인 → 이미 OOMKilled 발생

AIOps 방식:
 ML 모델이 메모리 사용 패턴의 기울기 변화 감지
 → "메모리 사용량이 평소 대비 비정상적 증가 추세"
 → OOMKilled 발생 전에 선제 알림
 → Agent가 자동으로 메모리 프로파일링 데이터 수집
```

**Application service**: DevOps Guru (ML abnormal detection), CloudWatch Anomaly Detection (metric 밴드)

### 6.2 Root Cause Analysis

 multiple data source **correlation Analysis** to root cause automatic identification.

**EKS scenario: between헐 타임아웃**

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

**Application service**: CloudWatch Investigations, Q Developer, Kiro + EKS MCP

### 6.3 Predictive Analytics

past pattern learning to **미래 status prediction** and preemptive action.

**EKS scenario: traffic spike prediction**

```
데이터: 최근 4주간의 시간대별 요청량 패턴

ML 예측:
 월요일 09:00에 트래픽 2.5배 급증 예상 (주간 패턴)
 → Karpenter NodePool에 선제적 노드 프로비저닝
 → HPA minReplicas 사전 조정
 → Cold Start 없이 트래픽 수용
```

**Application service**: CloudWatch metric + Prophet/ARIMA model + Karpenter

세 Implementation method [4. prediction scaling and automatic recovery](./aiops-predictive-operations.md)를 Reference.

### 6.4 Auto-Remediation

detection abnormal about **preemptive definition safety scope 내 from autonomous recovery**.

**EKS scenario: 디스크 프레셔 인 Pod Eviction**

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

**Application service**: Kagent + Strands SOPs, EventBridge + Lambda

:::tip safety 장치 design
automatic recovery Implementation when 반드time **safety 장치(Guardrails)**를 Configuration:

- production environment in phase execution (canary → progressive)
- recovery execution before current status 스냅샷 storage
- recovery failure time automatic rollback
- 특정 time 내 동day recovery 횟 limitation (무 loop prevention)
:::

### 6.5 Node Readiness Controller and Declarative Node Management

**Node Readiness Controller (NRC)**는 Kubernetes 1.32 from 알파 adoption feature으로, node Readiness status CRD(Custom Resource Definition)로 declarative as Management. this is K8s 생태계 **명령-type node Management(imperative) from declarative-type node Management(declarative)로 evolution** and 있음 보여주 important case.

#### AIOps 관점 from Node Readiness Controller

**Traditional method 계:**

```
노드 이상 감지 → 수동으로 kubectl cordon/drain 실행
문제점:
- 수동 개입 필요 (반응 지연)
- 일관성 없는 대응 (운영자마다 다른 절차)
- 노드 상태 변화 추적 어려움 (감사 추적 부재)
```

**NRC based declarative Management:**

```yaml
apiVersion: node.k8s.io/v1alpha1
kind: NodeReadinessRule
metadata:
 name: disk-pressure-auto-taint
spec:
 selector:
 matchExpressions:
 - key: node.kubernetes.io/disk-pressure
 operator: Exists
 taints:
 - key: node.kubernetes.io/disk-pressure
 effect: NoSchedule
 - key: node.kubernetes.io/disk-pressure
 effect: NoExecute
 tolerationSeconds: 300 # 5분 유예 후 Pod eviction
```

이제 DiskPressure condition occurrenceif **NRC automatic as taint additional** to 새 Pod scheduling blocking and, existing Pod 5minutes after eviction. Operations manual 입 without declarative policyonly as node isolation possible.

#### AIOps Integration scenario: AI based node prediction Management

NRC AI based prediction Analysis and combination to **proactive node Management**를 possible .

**scenario: 드웨어 failure prediction based preemptive node isolation**

```
[Phase 1] 이상 징후 감지
 CloudWatch Agent → 노드 하드웨어 메트릭 수집
 ├─ 디스크 IOPS 점진적 감소 (정상 대비 30% 저하)
 ├─ 메모리 ECC 오류 증가 (지난 1시간 동안 5회)
 └─ CPU 온도 상승 추세 (45°C → 62°C)
 ↓
 ML 모델 분석: "72시간 내 하드웨어 장애 가능성 85%"

[Phase 2] AI Agent가 Node Condition 업데이트
 Kagent/Strands Agent가 커스텀 Node Condition 설정:
 kubectl annotate node ip-10-0-1-42 predicted-failure=high-risk

[Phase 3] NRC가 자동으로 taint 관리
 NodeReadinessRule이 해당 Condition 감지 → taint 자동 추가
 ├─ 새 Pod 스케줄링 차단 (NoSchedule)
 ├─ 기존 워크로드는 정상 동작 유지 (유예 기간)
 └─ Karpenter가 대체 노드 프로비저닝

[Phase 4] 점진적 워크로드 이전
 AI Agent가 워크로드 특성별 우선순위 결정:
 1. Stateless 애플리케이션 먼저 이전 (다운타임 없음)
 2. Stateful 워크로드는 유지보수 창 대기
 3. 모든 워크로드 이전 완료 후 노드 제거
```

**Core Value:**

| Traditional method | NRC + AIOps method |
|------------|------------------|
| failure occurrence **after** response | failure occurrence **before** preemptive action |
| manual cordon/drain | declarative policy based automatic 처리 |
| consistency 없 response | CRD standardization response |
| audit tracking difficult | Git as policy 버before Management |
| 다운타임 occurrence possible | gradual workload migration as 무interruption |

#### DevOps Agent Integration pattern

**pattern 1: Node Problem Detector + NRC**

```
Node Problem Detector가 하드웨어 이상 감지
 → Node Condition 업데이트 (DiskPressure, MemoryPressure 등)
 → NRC가 자동으로 taint 추가
 → Karpenter가 대체 노드 프로비저닝
```

**pattern 2: AI prediction + NRC (proactive)**

```
CloudWatch Agent가 메트릭 수집
 → AI 모델이 장애 예측
 → DevOps Agent가 커스텀 Node Condition 설정
 → NRC가 선언적 정책 적용
 → 무중단으로 워크로드 이전
```

**pattern 3: security event based automatic isolation**

```
GuardDuty가 노드에서 비정상 프로세스 탐지
 → EventBridge → Lambda → Node에 security-risk Condition 추가
 → NRC가 즉시 NoExecute taint 적용
 → 모든 Pod eviction (보안 사고 확산 방지)
 → 포렌식 분석을 위해 노드는 격리 상태 유지
```

#### AIOps maturity model from position

| maturity level | node Management method | NRC utilization |
|------------|---------------|---------|
| **Level 0 (manual)** | manual cordon/drain | 미Application |
| **Level 1 (reactive-type)** | Node Problem Detector + manual response | 미Application |
| **Level 2 (declarative-type)** | NRC condition based automatic taint Management | ✅ **NRC adoption** |
| **Level 3 (prediction-type)** | AI node failure prediction + NRC preemptive isolation | ✅ AI + NRC Integration |
| **Level 4 (autonomous-type)** | DevOps Agent + NRC complete autonomous node 생애주기 Management | ✅ Agent + NRC Automation |

:::info K8s 생태계 evolution
Node Readiness Controller Kubernetes 생태계 **명령-type from declarative-type으로, reactive-type from prediction-type as evolution** and 있음 보여. NRC AI based prediction Analysis and combinationif, node failure occurrence기 **before**에 preemptive as workload migration to 다운타임 없 operations possible. this is AIOps Core Value인 "사람 입기 before AI issue 해결다"를 node Management 영역 from Implementation case.
:::

**References:**

- [Kubernetes Blog: Introducing Node Readiness Controller](https://kubernetes.io/blog/2026/02/03/introducing-node-readiness-controller/)

### 6.6 Multi-Cluster AIOps Management

대규모 organization development, staging, production etc. multiple EKS cluster Operations. multi cluster environment from AIOps effective as Implementation려면 **Integration observability, 중앙 focus식 AI insight, organization entire 거버넌스**is required.

#### multi cluster AIOps strategy

**Core 과제:**

| Challenge | Description | Solution |
|------|------|----------|
| **distributed observability** | each cluster마다 independent인 Monitoring stack | CloudWatch Cross-Account Observability 중앙 focus |
| **중복 alert** | 동day 이슈 multiple cluster from per alert | Amazon Q Developer correlation Analysis and Integration insight |
| **consistency 없 response** | cluster마다 다른 incident response 절차 | Bedrock Agent + Strands SOPs standardization workflow |
| **거버넌스 부re-** | per cluster policy non-day치 | AWS Organizations + OPA/Kyverno Integration policy |
| **cost visibility shortage** | cluster between Cost Comparison difficult | CloudWatch + Cost Explorer Integration dashboard |

#### 1. CloudWatch Cross-Account Observability utilization 중앙 focus Monitoring

**CloudWatch Cross-Account Observability**는 multiple AWS account metric, log, traces single observability account as Integration.

**architecture:**

```
[Development Account] [Staging Account] [Production Account]
 EKS Cluster A EKS Cluster B EKS Cluster C
 └─ CloudWatch Agent └─ CloudWatch Agent └─ CloudWatch Agent
 └─ ADOT Collector └─ ADOT Collector └─ ADOT Collector
 ↓ ↓ ↓
 └────────────────────────────┴─────────────────────────┘
 ↓
 [Observability Account (Central)]
 ├─ Amazon Managed Prometheus (AMP)
 ├─ Amazon Managed Grafana (AMG)
 ├─ CloudWatch Logs Insights (통합 로그)
 ├─ X-Ray (통합 트레이스)
 └─ Amazon Q Developer (통합 인사이트)
```

**Configuration method:**

```bash
# Step 1: Observability 계정에서 Monitoring Account 구성
aws oam create-sink \
 --name multi-cluster-observability \
 --tags Key=Environment,Value=Production

# Step 2: 각 소스 계정(dev/staging/prod)에서 Link 생성
aws oam create-link \
 --resource-types "AWS::CloudWatch::Metric" \
 "AWS::Logs::LogGroup" \
 "AWS::XRay::Trace" \
 --sink-identifier "arn:aws:oam:us-east-1:123456789012:sink/sink-id" \
 --label-template '$AccountName-$Region'

# Step 3: AMG에서 통합 대시보드 생성 (모든 클러스터 메트릭 통합)
```

**Integration dashboard example (AMG):**

```yaml
# Grafana Dashboard JSON — 멀티 클러스터 Pod 상태 통합
{
 "title": "Multi-Cluster EKS Overview",
 "panels": [
 {
 "title": "Pod Status Across All Clusters",
 "targets": [
 {
 "expr": "sum by (cluster, namespace, phase) (kube_pod_status_phase{cluster=~\".*\"})",
 "datasource": "AMP-Cross-Account"
 }
 ]
 },
 {
 "title": "Node Health by Cluster",
 "targets": [
 {
 "expr": "sum by (cluster, condition) (kube_node_status_condition{condition=\"Ready\",cluster=~\".*\"})",
 "datasource": "AMP-Cross-Account"
 }
 ]
 }
 ]
}
```

#### 2. Amazon Q Developer multi cluster insight

Amazon Q Developer Integration observability data based as **cluster between correlation Analysis**을 perform.

**use case:**

| Question | Q Developer Analysis | value |
|------|-----------------|------|
| "어제 오after 3time multiple cluster from simultaneously latency increase 이유는?" | X-Ray traces Analysis to 공통 RDS instance CPU 스파이크 identification | per cluster 조사 non-needed, root cause immediately identification |
| "production and staging cluster cost 차 왜 이렇 큰가요?" | Cost Explorer data Analysis to production 과also NAT Gateway cost 발견 | Cost Optimization 기times 발견 |
| " all cluster from the same security policy Application and 있나요?" | GuardDuty Findings ratio교 to development cluster 취약 RBAC Configuration detection | security 거버넌스 enhancement |

**Practical Example: multi cluster failure correlation Analysis**

```
개발자: "오늘 오전 10시에 모든 프로덕션 클러스터에서 동시에 Pod가 CrashLoopBackOff 상태가 되었어요. 왜 그런가요?"

Q Developer 분석:
 1. CloudWatch Logs Insights로 모든 클러스터의 로그 통합 분석
 → 공통 패턴: "Failed to pull image: registry.example.com/app:v2.1"

 2. X-Ray 트레이스로 이미지 레지스트리 접근 분석
 → registry.example.com DNS 조회 실패 (Route 53)

 3. CloudWatch 메트릭으로 Route 53 헬스 체크 확인
 → registry.example.com 헬스 체크가 오전 9:58에 UNHEALTHY로 변경

 4. 근본 원인 식별
 → 이미지 레지스트리 서버의 TLS 인증서 만료

 5. 권장 조치
 → 인증서 갱신 후 모든 클러스터에서 Pod 재시작
```

#### 3. organization entire AIOps 거버넌스 framework

multi cluster environment in **consistent policy Application and standardization response 절차**가 mandatory.

##### 거버넌스 계층

```
[Layer 1] AWS Organizations — 계정 및 클러스터 계층 구조 정의
 ↓
[Layer 2] Service Control Policies (SCPs) — 조직 전체 보안 정책
 ↓
[Layer 3] OPA/Kyverno — 클러스터별 K8s 정책 (Pod Security, Network Policy)
 ↓
[Layer 4] Bedrock Agent Guardrails — AI 자동 대응 안전 장치
 ↓
[Layer 5] CloudTrail + CloudWatch Logs — 감사 추적 및 컴플라이언스 검증
```

##### standardization incident response workflow

**Bedrock Agent + Strands SOPs multi cluster response Automation:**

```python
# Strands SOP: 멀티 클러스터 Pod CrashLoopBackOff 대응
from strands import Agent, sop

@sop(name="multi_cluster_crash_response")
def handle_multi_cluster_crash(event):
 """
 여러 클러스터에서 동일 이슈 발생 시 통합 대응
 """
 affected_clusters = event['clusters'] # ['dev', 'staging', 'prod']

 # Step 1: 모든 클러스터에서 동일 패턴 확인
 common_error = analyze_common_pattern(affected_clusters)

 if common_error:
 # Step 2: 공통 근본 원인 식별 (예: 외부 의존성 장애)
 root_cause = identify_shared_dependency(common_error)

 # Step 3: 중앙에서 근본 원인 해결
 fix_shared_dependency(root_cause)

 # Step 4: 모든 클러스터에 자동 복구 전파
 for cluster in affected_clusters:
 restart_affected_pods(cluster)
 verify_recovery(cluster)

 return {
 'status': 'resolved',
 'root_cause': root_cause,
 'affected_clusters': affected_clusters
 }
 else:
 # Step 5: 클러스터별 개별 대응 필요
 return {
 'status': 'escalated',
 'message': 'No common pattern found, escalating to ops team'
 }
```

##### multi cluster policy standardization (OPA)

```rego
# OPA Policy: 모든 클러스터에 동일한 Pod Security Standards 적용
package kubernetes.admission

deny[msg] {
 input.request.kind.kind == "Pod"
 not input.request.object.spec.securityContext.runAsNonRoot

 msg := sprintf("Pod %v must run as non-root user (Organization Policy)", [input.request.object.metadata.name])
}

deny[msg] {
 input.request.kind.kind == "Pod"
 container := input.request.object.spec.containers[_]
 not container.securityContext.allowPrivilegeEscalation == false

 msg := sprintf("Container %v must set allowPrivilegeEscalation to false (Organization Policy)", [container.name])
}
```

#### 4. multi cluster Cost Optimization

**CloudWatch + Cost Explorer Integration Analysis:**

```sql
-- CloudWatch Logs Insights: 클러스터별 비용 드라이버 분석
fields @timestamp, cluster_name, namespace, pod_name, node_type, cost_per_hour
| filter event_type = "pod_usage"
| stats sum(cost_per_hour) as total_cost by cluster_name, namespace
| sort total_cost desc
| limit 10
```

**AI based Cost Optimization insight (Q Developer):**

```
질문: "지난 달 클러스터별 비용 증가율을 분석하고, 최적화 기회를 제안해줘"

Q Developer 분석:
 1. Cost Explorer 데이터 분석
 - Cluster A (dev): +5% (정상 범위)
 - Cluster B (staging): +120% (이상 급증)
 - Cluster C (prod): +15% (트래픽 증가로 예상 범위 내)

 2. Cluster B의 비용 급증 원인 분석
 - CloudWatch 메트릭: GPU 인스턴스(g5.xlarge) 사용량 급증
 - 로그 분석: ML 팀이 실험용 워크로드를 staging에서 장기 실행 중

 3. 최적화 권장사항
 - ML 워크로드를 Spot Instances로 전환 (비용 70% 절감 예상)
 - 스테이징 클러스터에 Karpenter 적용하여 유휴 노드 자동 제거
 - 개발 클러스터는 업무 외 시간(야간/주말) 자동 스케일다운
```

:::info Core Value
multi cluster AIOps core is **distributed infrastructure Integration time each as Management** 것. CloudWatch Cross-Account Observability data 중앙 focus and, Amazon Q Developer cluster between correlation Analysis and, Bedrock Agent and Strands standardization automatic response Implementationif, cluster increase해also Operations complexalso linear as increasenot not.
:::

### 6.7 EventBridge-Based AI Auto-Response Patterns

Amazon EventBridge AWS service, application, SaaS Provision업체 event connection to event based architecture build server리스 event 버스. EKS and Integration to **cluster event automatic as response AI Agent workflow**를 build .

#### EventBridge + EKS event integration architecture

EKS cluster Kubernetes event EventBridge transfer to Automation response workflow trigger .

```
[EKS 클러스터]
 ├─ Pod 상태 변경 (CrashLoopBackOff, OOMKilled, ImagePullBackOff)
 ├─ 노드 상태 변경 (NotReady, DiskPressure, MemoryPressure)
 ├─ 스케일링 이벤트 (HPA 스케일 업/다운, Karpenter 노드 추가/제거)
 └─ 보안 경고 (GuardDuty Findings, 비정상 API 호출)
 ↓
[EventBridge Event Bus]
 이벤트 수집 및 라우팅
 ↓
[EventBridge Rules]
 이벤트 패턴 매칭 + 필터링
 ↓
[대응 워크플로우]
 ├─ Lambda → Kagent/Strands Agent 호출 → 자동 진단·복구
 ├─ Step Functions → 다단계 자동 대응 워크플로우
 ├─ SNS/SQS → 알림 또는 비동기 처리
 └─ CloudWatch Logs → 감사 및 분석
```

#### major event type and response pattern

| Event Type | Detection Condition | Auto-Response Pattern |
|------------|----------|---------------|
| **Pod CrashLoopBackOff** | Pod restart 횟 > 5times | AI Agent log Analysis → root cause identification → automatic rollback or Configuration modification |
| **node NotReady** | node status change | Karpenter trigger → 신규 node provisioning, existing Pod drain |
| **OOMKilled** | memory shortage as Pod 종료 | AI Agent memory use pattern Analysis → HPA/VPA Configuration automatic adjustment |
| **ImagePullBackOff** | 이미지 풀 failure | Lambda ECR permission Validation → automatic modification or alert |
| **DiskPressure** | node 디스크 userate > 85% | Lambda 이미지 cache cleanup → 임time 파day deletion |
| **GuardDuty Finding** | security 위협 detection | Step Functions → Pod isolation → forensic data collection → alert |

#### AI Agent Integration pattern

##### pattern 1: EventBridge → Lambda → AI Agent (Kagent/Strands)

**workflow:**

```
1. EKS 이벤트 발생: Pod CrashLoopBackOff
 ↓
2. EventBridge Rule 매칭: "Pod.status.phase == 'CrashLoopBackOff'"
 ↓
3. Lambda 함수 실행:
 - EKS MCP로 Pod 로그 수집
 - CloudWatch MCP로 메트릭 수집
 - X-Ray MCP로 트레이스 수집
 ↓
4. Kagent/Strands Agent 호출:
 - AI가 수집된 컨텍스트 분석
 - 근본 원인 식별 (예: ConfigMap 누락, 환경 변수 오류)
 - 자동 복구 실행 또는 운영팀 알림
 ↓
5. 결과 기록:
 - CloudWatch Logs에 진단 결과 저장
 - 복구 성공 시 이벤트 종료
 - 복구 실패 시 에스컬레이션
```

**Lambda 함 example (Python):**

```python
import boto3
import json
from kagent import KagentClient

eks_client = boto3.client('eks')
logs_client = boto3.client('logs')
kagent = KagentClient()

def lambda_handler(event, context):
 # EventBridge 이벤트에서 Pod 정보 추출
 detail = event['detail']
 pod_name = detail['pod_name']
 namespace = detail['namespace']
 cluster_name = detail['cluster_name']

 # Pod 로그 수집 (최근 100줄)
 logs = get_pod_logs(cluster_name, namespace, pod_name, tail=100)

 # Kagent에게 진단 요청
 diagnosis = kagent.diagnose(
 context={
 'pod_name': pod_name,
 'namespace': namespace,
 'logs': logs,
 'event_type': 'CrashLoopBackOff'
 },
 instruction="Analyze the root cause and suggest remediation"
 )

 # AI가 제안한 복구 조치 실행
 if diagnosis.confidence > 0.8:
 apply_remediation(diagnosis.remediation_steps)
 return {'status': 'auto_remediated', 'diagnosis': diagnosis}
 else:
 # 확신도가 낮으면 운영팀 알림
 notify_ops_team(diagnosis)
 return {'status': 'escalated', 'diagnosis': diagnosis}
```

##### pattern 2: EventBridge → Step Functions → 다phase automatic response

**workflow (Node NotReady response):**

```json
{
 "Comment": "EKS 노드 장애 자동 복구 워크플로우",
 "StartAt": "VerifyNodeStatus",
 "States": {
 "VerifyNodeStatus": {
 "Type": "Task",
 "Resource": "arn:aws:lambda:...:function:VerifyNodeStatus",
 "Next": "IsNodeRecoverable"
 },
 "IsNodeRecoverable": {
 "Type": "Choice",
 "Choices": [
 {
 "Variable": "$.recoverable",
 "BooleanEquals": true,
 "Next": "AttemptNodeRestart"
 },
 {
 "Variable": "$.recoverable",
 "BooleanEquals": false,
 "Next": "CordonAndDrainNode"
 }
 ]
 },
 "AttemptNodeRestart": {
 "Type": "Task",
 "Resource": "arn:aws:lambda:...:function:RestartNode",
 "Next": "WaitForNodeReady"
 },
 "WaitForNodeReady": {
 "Type": "Wait",
 "Seconds": 60,
 "Next": "CheckNodeRecovered"
 },
 "CheckNodeRecovered": {
 "Type": "Task",
 "Resource": "arn:aws:lambda:...:function:CheckNodeStatus",
 "Next": "NodeRecovered"
 },
 "NodeRecovered": {
 "Type": "Choice",
 "Choices": [
 {
 "Variable": "$.status",
 "StringEquals": "Ready",
 "Next": "Success"
 },
 {
 "Variable": "$.status",
 "StringEquals": "NotReady",
 "Next": "CordonAndDrainNode"
 }
 ]
 },
 "CordonAndDrainNode": {
 "Type": "Task",
 "Resource": "arn:aws:lambda:...:function:CordonAndDrain",
 "Next": "TriggerKarpenter"
 },
 "TriggerKarpenter": {
 "Type": "Task",
 "Resource": "arn:aws:lambda:...:function:TriggerNodeReplacement",
 "Next": "Success"
 },
 "Success": {
 "Type": "Succeed"
 }
 }
}
```

#### ML inference workload network performance observability

ML inference workload(Ray, vLLM, Triton, PyTorch 등)는 **GPU between 통신, model 병렬화, distributed inference** as 인해 day반 workload and 다른 network 특 가집.

**ML workload 고유 observability 요구사항:**

| metric | day반 workload | ML inference workload |
|--------|-------------|-----------------|
| **network bandwidth** | intermediate (API call) | 매우 high (model 가중치, 텐서 transfer) |
| **delay time 민감also** | high (use 대면) | 매우 high (Real-time inference SLA) |
| **패킷 드롭 impact** | re-transfer after recovery | inference failure or 타임아웃 |
| **East-West traffic** | 낮음 (대부minutes North-South) | 매우 high (GPU node between 통신) |
| **network pattern** | request-response | Burst + Sustained (model 로딩, inference, result 집계) |

**Container Network Observability data utilization:**

EKS Container Network Observability following network metric collection:

- **Pod between network 처리량** (bytes/sec)
- **network delay time** (p50, p99)
- **패킷 드롭rate**
- **re-transferrate**
- **TCP connection status**

**ML inference workload Monitoring example:**

```yaml
# Prometheus 쿼리 예시 — vLLM 워크로드의 네트워크 병목 탐지
apiVersion: v1
kind: ConfigMap
metadata:
 name: ml-network-alerts
data:
 alerts.yaml: |
 groups:
 - name: ml_inference_network
 rules:
 # GPU 노드 간 네트워크 지연 시간 이상
 - alert: HighInterGPULatency
 expr: |
 container_network_latency_p99{
 workload="vllm-inference",
 direction="pod-to-pod"
 } > 10
 for: 5m
 annotations:
 summary: "GPU 노드 간 네트워크 지연 시간 급증"
 description: "vLLM 추론 워크로드의 노드 간 지연이 10ms를 초과했습니다. 모델 병렬화 성능에 영향을 줄 수 있습니다."

 # 네트워크 대역폭 포화
 - alert: NetworkBandwidthSaturation
 expr: |
 rate(container_network_transmit_bytes{
 workload="ray-cluster"
 }[5m]) > 9e9 # 9GB/s (10GbE의 90%)
 for: 2m
 annotations:
 summary: "Ray 클러스터 네트워크 대역폭 포화"
 description: "네트워크 대역폭이 90%를 초과했습니다. ENA Express 또는 EFA 활성화를 고려하세요."
```

**EventBridge 규칙: ML network abnormal automatic response**

```json
{
 "source": ["aws.cloudwatch"],
 "detail-type": ["CloudWatch Alarm State Change"],
 "detail": {
 "alarmName": ["HighInterGPULatency", "NetworkBandwidthSaturation"],
 "state": {
 "value": ["ALARM"]
 }
 }
}
```

automatic response 액션:
1. **Lambda 함**: Container Network Observability data Analysis → bottleneck 구between identification
2. **AI Agent**: root cause diagnosis (CNI configuration, ENI 당, AZ between 통신 등)
3. **automatic Optimization**: ENA Express Activation, Prefix Delegation configuration, Pod 토폴로지 adjustment

:::info GPU workload 특
GPU based ML inference workload **network performance bottleneck major cause**. model 가중치( GB), intermediate 텐서(백 MB), result 집계 etc. as 인해 day반 workload compared to 10-100배 high network bandwidth needed. Container Network Observability through 이러 pattern 가time화 and, EventBridge based automatic Optimization Real-time response .
:::

#### EventBridge Rule example: Pod CrashLoopBackOff automatic response

**EventBridge 규칙 정 (JSON):**

```json
{
 "source": ["aws.eks"],
 "detail-type": ["EKS Pod State Change"],
 "detail": {
 "clusterName": ["production-cluster"],
 "namespace": ["default", "production"],
 "eventType": ["Warning"],
 "reason": ["BackOff", "CrashLoopBackOff"],
 "involvedObject": {
 "kind": ["Pod"]
 }
 }
}
```

**response workflow (Lambda + AI Agent):**

```python
# Lambda 함수: EKS 이벤트 → AI Agent 자동 진단
import boto3
import json
from strands import StrandsAgent

def lambda_handler(event, context):
 detail = event['detail']

 # 이벤트 정보 추출
 cluster_name = detail['clusterName']
 namespace = detail['namespace']
 pod_name = detail['involvedObject']['name']
 reason = detail['reason']

 # Strands Agent 초기화 (MCP 통합)
 agent = StrandsAgent(
 mcp_servers=['eks-mcp', 'cloudwatch-mcp', 'xray-mcp']
 )

 # AI Agent에게 진단 요청
 diagnosis_result = agent.run(
 sop_name="eks_pod_crashloop_diagnosis",
 context={
 'cluster': cluster_name,
 'namespace': namespace,
 'pod': pod_name,
 'reason': reason
 }
 )

 # 진단 결과에 따라 자동 복구 또는 에스컬레이션
 if diagnosis_result.auto_remediable:
 # 자동 복구 실행
 remediation_result = agent.run(
 sop_name="eks_pod_auto_remediation",
 context=diagnosis_result.remediation_plan
 )

 # CloudWatch Logs에 결과 기록
 log_remediation(diagnosis_result, remediation_result)

 return {
 'statusCode': 200,
 'body': json.dumps({
 'status': 'auto_remediated',
 'diagnosis': diagnosis_result.summary,
 'remediation': remediation_result.summary
 })
 }
 else:
 # 운영팀 알림 (SNS)
 notify_ops_team(diagnosis_result)

 return {
 'statusCode': 200,
 'body': json.dumps({
 'status': 'escalated',
 'diagnosis': diagnosis_result.summary,
 'reason': diagnosis_result.escalation_reason
 })
 }
```

**Strands Agent SOP example (YAML):**

```yaml
# eks_pod_crashloop_diagnosis.yaml
name: eks_pod_crashloop_diagnosis
description: "EKS Pod CrashLoopBackOff 자동 진단"
version: "1.0"

steps:
 - name: collect_pod_logs
 action: mcp_call
 mcp_server: eks-mcp
 tool: get_pod_logs
 params:
 cluster: "{{context.cluster}}"
 namespace: "{{context.namespace}}"
 pod: "{{context.pod}}"
 tail_lines: 100
 output: pod_logs

 - name: collect_pod_events
 action: mcp_call
 mcp_server: eks-mcp
 tool: get_pod_events
 params:
 cluster: "{{context.cluster}}"
 namespace: "{{context.namespace}}"
 pod: "{{context.pod}}"
 output: pod_events

 - name: collect_metrics
 action: mcp_call
 mcp_server: cloudwatch-mcp
 tool: get_pod_metrics
 params:
 cluster: "{{context.cluster}}"
 namespace: "{{context.namespace}}"
 pod: "{{context.pod}}"
 duration: "15m"
 output: pod_metrics

 - name: analyze_root_cause
 action: llm_analyze
 model: claude-opus-4
 prompt: |
 Analyze the following EKS Pod CrashLoopBackOff incident:

 Pod Logs:
 {{pod_logs}}

 Pod Events:
 {{pod_events}}

 Metrics:
 {{pod_metrics}}

 Identify the root cause and suggest remediation.
 Format: JSON with fields 'root_cause', 'confidence', 'remediation_steps', 'auto_remediable'
 output: diagnosis

 - name: return_result
 action: return
 value: "{{diagnosis}}"
```

:::tip EventBridge + AI Agent value
EventBridge based automatic response pattern **사람 입 without incident 초 단위 detection·diagnosis·recovery**can . AI Agent(Kagent, Strands)와 Integrationif 단순 규칙 based response 넘어, 컨텍스트 이해 and root cause identification intelligent Automation possible. 이것 Traditional Automation(Runbook-as-Code)와 AIOps Core 차이.
:::

---

## 7. AWS AIOps Service Map

<AwsServicesMap />

### Inter-Service Integration Flow

AWS AIOps service들 independent으로also value 있지only, **Integration use time time너지**가 극대화:

1. **CloudWatch Observability Agent** → metric/log/traces collection
2. **Application Signals** → service 맵 + SLI/SLO automatic generation
3. **DevOps Guru** → ML abnormal detection + recommended action
4. **CloudWatch Investigations** → AI root cause Analysis
5. **Q Developer** → natural language based troubleshooting
6. **Hosted MCP** → AI tool from directly AWS resource approach

:::tip 3rd Party observability stack use case
Datadog, Sumo Logic, Splunk etc. 3rd Party solution use environment에서also, ADOT(OpenTelemetry)를 collection 레이어 utilizationif 위 service들 and the same data 3rd Party backend transfer . MCP Integration 레이어 backend optional 추상화므로, AI tool and Agent 어떤 observability stack에서든 동day behavior.
:::

### 7.7 CloudWatch Generative AI Observability

**announcement**: 2025year 7monthly Preview, 2025year 10monthly GA

**Core Value**: Traditional observability 3-Pillar(Metrics/Logs/Traces)를 넘어, **AI workload before용 observability**이라 네 번째 Pillar additional.

#### LLM and AI Agent workload Monitoring

CloudWatch Generative AI Observability Amazon Bedrock, EKS, ECS, on-premises etc. **어떤 infrastructure from execution되 LLM and AI Agent workloadalso Integration Monitoring**.

** major feature**:

| Feature | Description |
|------|------|
| **토 large 소ratio tracking** | 프롬프트 토큰, 완료 토큰, total 토 large use량 Real-time tracking |
| **latency Analysis** | LLM call, Agent tool execution, entire 체인 delay time measurement |
| **End-to-End 트레이싱** | AI stack before체(프롬프트 → LLM → tool call → response) flow tracking |
| **Hallucination risk 경 detection** | 환각(Hallucination) occurrence risk high execution 경 identification |
| **Retrieval Miss identification** | RAG pipeline from knowledge 베이스 search failure detection |
| **Rate-Limit re-timealso Monitoring** | API limitation as 인 re-timealso pattern tracking |
| **model transition 결정 tracking** | 다중 model strategy from model optional 로직 가time화 |

#### Amazon Bedrock AgentCore and external framework 호환

**native Integration**:
- Amazon Bedrock Data Automation MCP Server 연동
- AgentCore Gateway through automatic 계측
- GitHub Action as PR observability data automatic injection

**external framework Support**:
- LangChain
- LangGraph
- CrewAI
- 기타 OpenTelemetry based Agent framework

#### AI observability 고유 요구사항

Traditional application Monitoring and 달리, AI workload following and such as 고유 metric needed:

```
전통적 모니터링:
 CPU/메모리/네트워크 → 요청 수 → 응답 시간 → 에러율

AI 워크로드 모니터링:
 위 항목 + 토큰 소비 + 모델 레이턴시 + 도구 실행 성공률 +
 Retrieval 정확도 + Hallucination 빈도 + Context Window 활용률
```

**EKS from utilization scenario**:

```yaml
# EKS에서 실행되는 AI Agent 워크로드
apiVersion: apps/v1
kind: Deployment
metadata:
 name: ai-customer-support-agent
spec:
 template:
 spec:
 containers:
 - name: agent
 image: my-ai-agent:latest
 env:
 - name: OTEL_EXPORTER_OTLP_ENDPOINT
 value: "http://adot-collector:4317"
 - name: CLOUDWATCH_AI_OBSERVABILITY_ENABLED
 value: "true"
```

Agent executionwhen CloudWatch following automatic collection:
- 고객 문 → LLM call → knowledge 베이스 search → response generation entire traces
- each phase 토 large 소ratio and cost
- Hallucination occurrence possible high 경로(example: Retrieval Miss after LLM day반 knowledge as 답변)

:::info AI observability Cost Optimization Core
LLM API call 토큰당 과금. CloudWatch Gen AI Observability **어떤 프롬프트 과also 토큰 소ratio지**, **어떤 tool 조합 ratioefficiency인지**를 가time화 to AI workload cost 20-40% savings .
:::

**References**:
- [CloudWatch Gen AI Observability Preview announcement](https://aws.amazon.com/blogs/mt/launching-amazon-cloudwatch-generative-ai-observability-preview/)
- [Agentic AI Observability with CloudWatch](https://www.goml.io/blog/cloudwatch-for-agentic-ai-observability)

### 7.8 GuardDuty Extended Threat Detection — EKS security observability

**announcement**: 2025year 6monthly EKS Support, 2025year 12monthly EC2/ECS extension

**Core Value**: security abnormal detection Operations abnormal detection and Integration to **before체 observability(Holistic Observability)**을 실현.

#### AI/ML based 다phase 공격 detection

GuardDuty Extended Threat Detection ** multiple data source correlation Analysis** to Traditional security Monitoring으 놓치기 쉬운 정교 공격 detection.

**correlation Analysis data source**:

| Data Source | Detection Content |
|------------|----------|
| **EKS audit log** | rationormal API call pattern(example: permission escalation timealso, ratio인 Secret approach) |
| **런타임 행동** | container 내 rationormal process execution, example상치 않 network connection |
| **맬웨어 execution** | 알려진/알려지지 않 맬웨어 time그니처 detection |
| **AWS API 활동** | CloudTrail event and EKS 활동 time correlation Analysis |

#### Attack Sequence Findings — multi resource 위협 identification

** single event detection 계**:

```
전통적 보안 모니터링:
 이벤트 1: Pod가 외부 IP로 연결 → 경고
 이벤트 2: IAM 역할 임시 자격 증명 요청 → 경고
 이벤트 3: S3 버킷 객체 나열 → 경고

문제: 각 이벤트는 개별적으로 보면 정상일 수 있음 → 오탐 발생
```

**Attack Sequence Findings method**:

```
GuardDuty AI 분석:
 이벤트 1 + 이벤트 2 + 이벤트 3을 시간적·논리적으로 연결
 → "데이터 탈취(Data Exfiltration) 공격 시퀀스" 탐지
 → 단일 Critical Severity Finding 생성
```

GuardDuty ** multiple resource(Pod, node, IAM role, S3 버킷)와 data source(EKS log, CloudTrail, VPC Flow Logs)에 걸친 공격 체인**을 automatic as identification.

#### actual case: 2025year 11monthly cryptomining 캠페인 detection

**배경**: 2025year 11monthly 2day부터 start 대규모 cryptomining 공격 캠페인 Amazon EC2 and ECS 타깃 as occurrence했.

**공격 time퀀스**:
1. **initial 침투**: 공 취약 container 이미지 악용
2. **permission 획득**: IMDS(Instance Metadata Service)를 through IAM 격 증명 탈취
3. **측면 movement**: 획득 격 증명 as 다른 EC2 instance/ECS 작업 start
4. **cryptomining execution**: 고performance instance mining 소프트웨어 Deployment

**GuardDuty detection 메커니즘**:

| Detection Phase | Method |
|-----------|------|
| **abnormal 행동 identification** | container example상치 않 external mining 풀 connection timealso |
| **격 증명 오용 detection** | IMDS call 빈also spike + rationormal time대 API call |
| **resource 스파이크 correlation Analysis** | CPU 100% use + 알려진 mining process time그니처 |
| **공격 체인 re-Configuration** | time 순서 event connection to entire 공격 scenario presentation |

**result**: GuardDuty 공격 automatic detection and, AWS 고객에 경고 발송했으며, 이 through 백only 달러 potential cost 손실 example방했.

**References**:
- [AWS Security Blog: Cryptomining Campaign Detection](https://aws.amazon.com/blogs/security/cryptomining-campaign-targeting-amazon-ec2-and-amazon-ecs/)

#### AIOps 관점: security observability Integration

**Traditional minutes리 model**:

```
보안팀 → GuardDuty, Security Hub
운영팀 → CloudWatch, Prometheus
결과: 보안 이상과 운영 이상이 따로 보고됨 → 상관관계 파악 지연
```

**AIOps Integration model**:

```
GuardDuty Extended Threat Detection (보안 이상)
 ↓
CloudWatch Investigations (AI 근본 원인 분석)
 ↓
운영 메트릭(CPU, 메모리, 네트워크) + 보안 이벤트 통합 분석
 ↓
"CPU 급증의 원인은 정상 트래픽이 아닌 크립토마이닝" 자동 판별
```

**EKS environment from utilization**:

```bash
# GuardDuty Extended Threat Detection for EKS 활성화
aws guardduty create-detector \
 --enable \
 --features '[{"Name":"EKS_RUNTIME_MONITORING","Status":"ENABLED"}]'

# 탐지된 위협을 CloudWatch Events로 전송
aws events put-rule \
 --name guardduty-eks-threats \
 --event-pattern '{"source":["aws.guardduty"],"detail-type":["GuardDuty Finding"]}'
```

Activation after, GuardDuty EKS cluster all workload continuous as Monitoring and, **첫 번째 Analysis phase AI automatic perform** to operations teams response time 크 단축.

:::warning security observability = Operations observability
security abnormal(example: cryptomining)은 종종 Operations abnormal(example: CPU spike, network traffic abnormal) as 먼저 나타납. GuardDuty Extended Threat Detection CloudWatch and Integrationif, operations teams "왜 이 Pod CPU 100%인가?"라 질문 "security 위협"이라 답 immediately 얻 .
:::

**References**:
- [GuardDuty Extended Threat Detection for EKS announcement](https://aws.amazon.com/blogs/aws/amazon-guardduty-expands-extended-threat-detection-coverage-to-amazon-eks-clusters/)
- [GuardDuty Extended Threat Detection for EC2/ECS](https://aws.amazon.com/about-aws/whats-new/2025/12/guardduty-extended-threat-detection-ec2-ecs/)

세 observability stack build method and stack optional pattern [2. intelligent observability stack](./aiops-observability-stack.md)을 Reference.

---

## 8. AIOps Maturity Model

<AiopsMaturityModel />

### Transition Guide by Maturity Level

#### Level 0 → Level 1 transition (most fast ROI)

Managed Add-ons and AMP/AMG adoptiononly as observability 기초 확립 . `aws eks create-addon` 명령 as ADOT, CloudWatch Observability Agent Deployment and, AMP/AMG 중앙 focus식 dashboard build.

```bash
# Level 1 시작: 핵심 관찰성 Add-ons 배포
aws eks create-addon --cluster-name my-cluster --addon-name adot
aws eks create-addon --cluster-name my-cluster --addon-name amazon-cloudwatch-observability
aws eks create-addon --cluster-name my-cluster --addon-name eks-node-monitoring-agent
```

#### Level 1 → Level 2 transition (Automation 기초)

Managed Argo CD GitOps adoption and, ACK AWS resource K8s CRD declarative Management. KRO 복합 resource single Deployment 단위 Configurationif, infrastructure change consistency and tracking 크 improvement.

#### Level 2 → Level 3 transition (intelligent Analysis)

CloudWatch AI and DevOps Guru Activation to ML based abnormal detection and prediction analysis start. CloudWatch Investigations AI root cause analysis adoption and, Q Developer natural language based troubleshooting utilization.

#### Level 3 → Level 4 transition (autonomous Operations)

Kiro + Hosted MCP programmatic Operations 체계 build and, Kagent/Strands Agent Deployment to incident response, Deployment Validation, resource Optimization AI autonomous as performalso록 .

:::warning Gradual Adoption Recommended
Level 0 from Level 4 번 also약려 not 마. each 레벨 from sufficient Operations 경험 and data accumulation after following 레벨 transition 것 공 확rate 높. especially Level 3 → Level 4 transition **AI autonomous recovery safety Validation**이 Core.
:::

---

## 9. ROI Assessment

<RoiMetrics />

### ROI Assessment Framework

AIOps adoption ROI systematic as 평가기 위 framework.

#### 정량 지표

<RoiQuantitativeMetrics />

#### 정 지표

- **operations teams only족also**: repetitive 작업 reduction, strategy 업무 focus
- **Deployment 신감**: automatic Validation as Deployment 품질 improvement
- **incident response 품질**: root cause 해결rate increase
- **knowledge Management**: AI Agent response pattern learning to organization knowledge accumulation

### Cost Structure Considerations

<CostStructure />

### 9.1 AIOps ROI advanced Analysis model

AIOps adoption value 정량·정 as 평 advanced Analysis model. 단순 cost savings 넘어, organization 민첩 and 혁신 역량 improvement 포괄.

#### 정량 ROI calculation 공식

**1. incident response cost savings**

```
MTTR 감소로 인한 연간 절감액 = (기존 MTTR - 새로운 MTTR) × 연간 인시던트 수 × 시간당 대응 비용

실전 예시:
- 기존 MTTR: 평균 2시간
- AIOps 도입 후 MTTR: 평균 20분 (0.33시간)
- 연간 P1/P2 인시던트: 120건
- 시간당 대응 비용: $150 (운영팀 3명 × $50/시간)

절감액 = (2 - 0.33) × 120 × $150 = $30,060/년
```

**2. failure 인 ratio즈니스 손실 reduction**

```
연간 다운타임 손실 감소 = (기존 연간 다운타임 - 새로운 연간 다운타임) × 시간당 매출 손실

실전 예시:
- 기존 연간 다운타임: 8시간 (MTTR 2시간 × 월 2회 × 12개월 ÷ 6회 주요 장애)
- AIOps 도입 후: 1.3시간 (MTTR 20분 × 동일 빈도)
- 시간당 매출 손실: $50,000 (이커머스 플랫폼 가정)

손실 감소 = (8 - 1.3) × $50,000 = $335,000/년
```

**3. Operations Automation 인 인력 efficiency improvement**

```
운영팀 생산성 향상 가치 = 절감된 반복 작업 시간 × 시간당 인건비 × 전략적 업무 가치 계수

실전 예시:
- 자동화된 반복 작업: 주당 40시간 (4명 × 주당 10시간)
- 시간당 인건비: $50
- 전략적 업무 가치 계수: 1.5배 (전략적 업무의 가치가 반복 작업보다 50% 높음)

연간 가치 = 40 × 52 × $50 × 1.5 = $156,000/년
```

**4. prediction scaling as 인 infrastructure cost savings**

```
연간 인프라 비용 절감 = 불필요한 과잉 프로비저닝 비용 - 예측 기반 최적화 후 비용

실전 예시:
- 기존: 피크 대응을 위해 항상 3배 오버프로비저닝 → 월 $30,000
- AIOps 예측 스케일링: 피크 5분 전 자동 스케일업 → 평균 1.2배 프로비저닝 → 월 $12,000

절감액 = ($30,000 - $12,000) × 12 = $216,000/년
```

**종합 정량 ROI:**

| Item | 연between savings/value |
|------|--------------|
| incident response cost savings | $30,060 |
| 다운타임 손실 reduction | $335,000 |
| operations teams 생산 improvement | $156,000 |
| infrastructure cost savings | $216,000 |
| **total 연between value** | **$737,060** |

**AIOps adoption cost:**

| Item | 연between cost |
|------|----------|
| AWS managed service (AMP/AMG/DevOps Guru) | $50,000 |
| Bedrock Agent API call cost | $20,000 |
| additional CloudWatch log/metric 스토리지 | $10,000 |
| initial build consulting (1times) | $30,000 |
| **total 연between cost** | **$110,000** |

**ROI 계산:**

```
ROI = (총 연간 가치 - 총 연간 비용) / 총 연간 비용 × 100%
 = ($737,060 - $110,000) / $110,000 × 100%
 = 570%

투자 회수 기간 = 총 연간 비용 / 월평균 가치
 = $110,000 / ($737,060 / 12)
 = 1.8개월
```

:::warning ROI calculation time Considerations
위 공식 **intermediate 규모 organization(직원 100-500명, 연매출 $50M-$200M)**을 가정 example. actual ROI following 요인 according to 크 달라집니다:

- organization 규모 and incident 빈also
- ratio즈니스 다운타임 actual impact (이커머스 vs SaaS vs 내부 tool)
- existing Operations maturity (Level 0 vs Level 2 from start)
- cluster and complexalso

**소규모 스타트업**(직원 &lt;50명)은 절대 금액 작지only 상대 ROI 더 높 있고, **대규모 엔터프라이즈**(직원 &gt;1000명)는 절대 금액 10배 abnormal 커질 .
:::

#### 정 value: 팀 burnout reduction, development 경험 improvement

정량 지표 measurement기 어렵지only, organization 장기 과 결정 impact 미치 정 value.

**1. operations teams burnout reduction**

| Metric | AIOps adoption before | AIOps adoption after | improvement 효 and |
|------|-------------|-------------|----------|
| **야between alert 빈also** | 주당 average 8times | 주당 average 1times | AI Agent automatic response as 85% reduction |
| **주말 긴급 response** | monthly average 4times | monthly average 0.5times | prediction Analysis as preemptive action |
| **repetitive 작업 ratiorate** | 업무 time 60% | 업무 time 15% | Automation 45%p reduction |
| **operations teams 이직rate** | 연 25% | 연 8% | 업무 only족also improvement |
| **온콜 스트레스 점** | 7.8/10 (high) | 3.2/10 (낮음) | autonomous recovery 스트레스 대폭 reduction |

**ratio즈니스 impact:**
- Operations before문 이직rate reduction → 연between 채용/교육 cost savings: $120,000 (average 연봉 40% 가정)
- burnout as 인 생산 저 prevention → 정량화 어렵지only organization 건강 증대

**2. development 경험 (DX) improvement**

| Metric | AIOps adoption before | AIOps adoption after | improvement 효 and |
|------|-------------|-------------|----------|
| **Deployment 신감** | 50% (non-안감 high) | 90% ( high 신뢰) | automatic Validation and rollback |
| **failure cause 파악 time** | average 45minutes | average 5minutes | AI root cause Analysis |
| **infrastructure 문 response time** | average 2time | immediately (Q Developer) | 셀프service possible |
| **Deployment 빈also** | 주 2times | day 3times | safety improvement as 빈번 Deployment possible |
| **development only족also** | 6.2/10 | 8.7/10 | infrastructure complexalso 추상화 |

**ratio즈니스 impact:**
- Deployment 빈also increase → feature 출time 속also improvement → time장 경쟁력 enhancement
- development infrastructure 디버깅 대신 Business logic focus → 제품 품질 improvement

**3. knowledge Management and organization learning**

| Metric | AIOps adoption before | AIOps adoption after | improvement 효 and |
|------|-------------|-------------|----------|
| **incident response pattern document화** | manual, non-complete | AI Agent automatic learning | knowledge 손실 prevention |
| **신규 Operations onboarding 기between** | 3months | 1months | AI 어time스턴트 Real-time 가이드 |
| **repetitive failure occurrencerate** | 40% | 5% | learning response pattern automatic Application |
| **Best Practices Applicationrate** | 30% | 85% | AI automatic as Application |

**ratio즈니스 impact:**
- organization knowledge system accumulation → Core 인력 의존also reduction
- 신규 팀원 빠르 생산 발휘 → organization extension 증대

**4. 혁신 역량 improvement**

AIOps adoption as operations teams **repetitive 작업 from 해방**when, strategy 업무 focus .

| Redirected Time Usage | Organizational Value |
|---------------|----------|
| ** new service 실험** | 신규 feature 출time 속also 2배 improvement |
| **architecture Optimization** | infrastructure efficiency 20% improvement |
| **security enhancement** | vulnerability response time 70% 단축 |
| **Cost Optimization Analysis** | 연between infrastructure cost 15% savings |
| **팀 역량 development** | 클라우드 native before문 improvement |

:::tip 정 value actual impact
Netflix Chaos Engineering 팀 Operations Automation securing time 60%를 system times복탄력 improvement investment to, result as **연between 다운타임 99.9% from 99.99%로 improvement**time켰 ([Netflix case](https://netflixtechblog.com/tagged/chaos-engineering)). this is 정 investment 정량 and transition되 대표 example.
:::

#### per phase investment compared to 효 and Analysis (maturity level별)

AIOps maturity model(섹션 8) each per 레벨 investment 규모 and 기대 효 and Analysis.

##### Level 0 → Level 1 transition

**investment item:**

| Item | Cost | Notes |
|------|------|------|
| Managed Add-ons Deployment (ADOT, CloudWatch Agent) | $0 | Add-on 체 무료, data collection costonly occurrence |
| AMP/AMG initial Configuration | $5,000 | dashboard build consulting |
| CloudWatch log/metric increase | $3,000/monthly | observability data collection cost |
| **total initial investment** | **$5,000 + $3,000/monthly** | |

**기대 effect:**

| Effect | Metric | Expected Improvement |
|------|----------|----------|
| **observability visibility** | metric coverage | 30% → 95% |
| **incident detection time** | failure 인지 속also | average 30minutes → 5minutes |
| **dashboard build time** | 신규 service Monitoring | 2day → 2time (AMG 템플릿 utilization) |

**ROI:** investment times 기between 약 **3-4months**. observability 부re- 인 블라인드 스팟 removal Core Value.

##### Level 1 → Level 2 transition

**investment item:**

| Item | Cost | Notes |
|------|------|------|
| Managed Argo CD Configuration | $2,000 | GitOps workflow build |
| ACK + KRO adoption | $3,000 | IaC transition consulting |
| existing manual Deployment IaC transition | $10,000 | Terraform/Pulumi 마이그레이션 |
| **total initial investment** | **$15,000** | |

**기대 effect:**

| Effect | Metric | Expected Improvement |
|------|----------|----------|
| **Deployment time 단축** | infrastructure change required time | average 2time → 10minutes |
| **Deployment error reduction** | Configuration non-day치 인 failure | monthly 3times → monthly 0.2times |
| **rollback 속also** | issue occurrence time recovery time | average 45minutes → 5minutes |

**ROI:** investment times 기between 약 **2-3months**. Deployment Automation 인 error 대폭 reduction.

##### Level 2 → Level 3 transition

**investment item:**

| Item | Cost | Notes |
|------|------|------|
| CloudWatch AI + DevOps Guru Activation | $8,000/monthly | ML abnormal detection service 과금 |
| Q Developer Integration | $5,000 | initial Configuration and MCP 연동 |
| Kiro + EKS MCP server build | $15,000 | Spec-driven workflow build |
| **total initial investment** | **$20,000 + $8,000/monthly** | |

**기대 effect:**

| Effect | Metric | Expected Improvement |
|------|----------|----------|
| **root cause Analysis 속also** | RCA required time | average 2time → 10minutes |
| **prediction 정확also** | failure preemptive detectionrate | 0% → 60% |
| **incident response MTTR** | average recovery time | 2time → 30minutes |

**ROI:** investment times 기between 약 **4-6months**. ML based prediction Analysis Core Value.

##### Level 3 → Level 4 transition

**investment item:**

| Item | Cost | Notes |
|------|------|------|
| Bedrock Agent build | $25,000 | autonomous Operations Agent development |
| Strands/Kagent SOPs development | $20,000 | automatic recovery scenario Implementation |
| Bedrock Agent API call cost | $10,000/monthly | production workload 과금 |
| safety Validation and test | $15,000 | production Application before 철저 Validation |
| **total initial investment** | **$60,000 + $10,000/monthly** | |

**기대 effect:**

| Effect | Metric | Expected Improvement |
|------|----------|----------|
| **automatic recoveryrate** | Agent autonomous 해결 ratiorate | 0% → 70% |
| **incident response MTTR** | average recovery time | 30minutes → 5minutes |
| **야between/주말 alert** | 온콜 부담 | 주 8times → 주 1times |

**ROI:** investment times 기between 약 **6-9months**. initial investment 크지only, autonomous operations 장기 cost savings 효 and most 큼.

**per 레벨 cumulative ROI ratio교:**

| maturity level | cumulative initial investment | monthly Operations cost | 연between savings/value | investment times 기between |
|-----------|-------------|-----------|--------------|--------------|
| **Level 1** | $5,000 | $3,000 | $100,000 | 3-4months |
| **Level 2** | $20,000 | $3,000 | $250,000 | 2-3months (cumulative) |
| **Level 3** | $40,000 | $11,000 | $500,000 | 4-6months (cumulative) |
| **Level 4** | $100,000 | $21,000 | $737,000 | 6-9months (cumulative) |

:::info gradual investment strategy
Level 0 → Level 1 ** fast ROI and low 리스크**로 immediately start possible. Level 2 → Level 3 organization Automation 역량 어느 정also equipped after 진행 and, Level 4 **sufficient data accumulation and safety Validation after** adoption 것 safety. each 레벨 from 최소 6months abnormal Operations 경험 쌓 after Next Steps transition 것 recommended.
:::

---

## 10. Conclusion

AIOps K8s platform powerful feature and extension AI 극대화if서, Operations complexalso 낮추고 혁신 가속 Operations 패러다임.

### Key Summary

1. **AWS open-source strategy**: Managed Add-ons + managed open-source(AMP/AMG/ADOT) → operational complexity removal
2. **EKS Capabilities**: Managed Argo CD + ACK + KRO → declarative Automation Core 컴포넌트
3. **Kiro + Hosted MCP**: Spec-driven programmatic Operations → costefficiency이고 fast response
4. **AI Agent extension**: Q Developer(GA) + Strands(OSS) + Kagent(initial) → gradual autonomous Operations

### Next Steps

<NextSteps />

### References

- [AWS AI-Driven Development Life Cycle](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
- [Amazon EKS Add-ons](https://docs.aws.amazon.com/eks/latest/userguide/eks-add-ons.html)
- [EKS Capabilities](https://docs.aws.amazon.com/eks/latest/userguide/eks-capabilities.html)
- [AWS Hosted MCP Servers](https://github.com/awslabs/mcp)
- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
- [Kiro IDE](https://kiro.dev/)
