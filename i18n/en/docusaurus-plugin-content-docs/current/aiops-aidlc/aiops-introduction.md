---
title: "Innovating K8s Operations with AI — AIOps Strategy Guide"
sidebar_label: "1. AIOps Strategy Guide"
description: "AIOps strategy to reduce K8s platform complexity with AI and accelerate innovation — AWS open-source managed services, Kiro+MCP, AI Agent extension"
sidebar_position: 1
category: "aiops-aidlc"
tags: [aiops, eks, observability, anomaly-detection, monitoring, kiro, mcp, ai-agent]
last_update:
  date: 2026-02-14
  author: devfloor9
---

import { AiopsMaturityModel, MonitoringComparison, AwsServicesMap, RoiMetrics, AwsManagedOpenSource, K8sOpenSourceEcosystem, EvolutionDiagram, DevOpsAgentArchitecture, McpServerTypes, McpServersMap, ManagedAddonsOverview, AiToolsComparison, AiAgentFrameworks, OperationPatternsComparison, RoiQuantitativeMetrics, CostStructure, NextSteps } from '@site/src/components/AiopsIntroTables';

# Innovating K8s Operations with AI — AIOps Strategy Guide

> 📅 **Written**: 2026-02-12 | **Updated**: 2026-02-14 | ⏱️ **Reading time**: About 48 minutes

---

## 1. Overview

**AIOps (Artificial Intelligence for IT Operations)** is an operational paradigm that applies machine learning and big data analytics to IT operations, automating incident detection, diagnosis, and recovery while dramatically reducing the complexity of infrastructure management.

The Kubernetes platform provides powerful features and scalability such as declarative APIs, auto-scaling, and self-healing, but its complexity places a significant burden on operations teams. **AIOps is a model that maximizes the various features and scalability of the K8s platform with AI while reducing complexity and accelerating innovation**.

### What This Document Covers

- AWS open-source strategy and the evolution of EKS
- Core AIOps architecture based on Kiro + Hosted MCP
- Programmatic operations vs directing-based operations comparison
- Paradigm differences between traditional monitoring and AIOps
- AIOps core capabilities and EKS application scenarios
- AWS AIOps service map and maturity model
- ROI evaluation framework

:::info Learning Path
This document is the first in the AIops & AIDLC series. Complete learning path:

1. **[1. AIOps Strategy Guide](./aiops-introduction.md)** (current document) → 2. **[2. Intelligent Observability Stack](./aiops-observability-stack.md)** → 3. **[3. AIDLC Framework](./aidlc-framework.md)** → 4. **[4. Predictive Scaling and Auto-Remediation](./aiops-predictive-operations.md)**

:::

---

## 2. AWS Open-Source Strategy and the Evolution of EKS

AWS's container strategy has consistently evolved in the direction of **transforming open-source into K8s-native managed services**. The core of this strategy is to maintain the strengths of the K8s ecosystem while eliminating operational complexity.

### 2.1 Managed Add-ons: Eliminating Operational Complexity

EKS Managed Add-ons are extension modules where AWS directly manages core K8s cluster functionality. Currently, **more than 22** Managed Add-ons are available (see [AWS official list](https://docs.aws.amazon.com/eks/latest/userguide/workloads-add-ons-available-eks.html)).

<ManagedAddonsOverview />

```bash
# Managed Add-on installation example — deploy and manage with a single command
aws eks create-addon \
  --cluster-name my-cluster \
  --addon-name adot \
  --addon-version v0.40.0-eksbuild.1

# Check installed Add-on list
aws eks list-addons --cluster-name my-cluster
```

### 2.2 Community Add-ons Catalog (2025.03)

The **Community Add-ons Catalog** launched in March 2025 enables one-click deployment of community tools such as metrics-server, cert-manager, and external-dns from the EKS console. Tools that previously required manual installation and management via Helm or kubectl have been incorporated into the AWS management framework.

### 2.3 Managed Open-Source Services — Reduce Operational Burden, Avoid Vendor Lock-in

AWS's open-source strategy has two core objectives:

1. **Eliminate operational burden**: AWS handles operational tasks such as patching, scaling, HA configuration, and backups
2. **Prevent vendor lock-in**: Since standard open-source APIs (PromQL, Grafana Dashboard JSON, OpenTelemetry SDK, etc.) are used as-is, you can switch to self-managed operations when needed

This strategy is not limited to observability. It provides fully managed versions of major open-source projects across the entire infrastructure spectrum, including **databases, streaming, search & analytics, and ML**.

<AwsManagedOpenSource />

Among this broad managed open-source portfolio, the **projects and services directly related to Kubernetes** are organized as follows:

<K8sOpenSourceEcosystem />

#### 2.2.3 Real-World Examples of Vendor Lock-in Prevention

The core value of AWS's managed open-source strategy is **reducing operational burden without vendor lock-in**. Since standard open-source APIs are used as-is, you can switch to a different backend when needed.

##### ADOT-Based Observability Backend Switching Pattern

ADOT (AWS Distro for OpenTelemetry) is based on OpenTelemetry, allowing you to **freely switch observability backends without modifying application code**.

**Switchable backends:**

| Backend | Type | Scope of Change When Switching |
|---------|------|-------------------------------|
| **CloudWatch** | AWS Native | Only change ADOT Collector exporter configuration |
| **Datadog** | 3rd Party SaaS | Only change ADOT Collector exporter configuration |
| **Splunk** | 3rd Party (SaaS/On-prem) | Only change ADOT Collector exporter configuration |
| **Grafana Cloud** | Managed Open-Source | Only change ADOT Collector exporter configuration |
| **Self-hosted Prometheus** | Self-Managed | Only change ADOT Collector exporter configuration |

:::tip Core Value of ADOT
When using ADOT (OpenTelemetry-based), **there is no need to modify application code** even when switching observability backends. This is the core value of AWS's open-source strategy. Applications generate metrics/traces/logs using the OpenTelemetry SDK, and the ADOT Collector collects and forwards them to the desired backend.
:::

**ADOT Collector Configuration Example: CloudWatch → Datadog Switch**

```yaml
# Using CloudWatch backend (existing)
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
# Switching to Datadog backend (only exporter changed)
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
      exporters: [datadog]  # ← Only this part changed
```

**Application code remains unchanged:**

```python
# Python application — no code modification needed when switching backends
from opentelemetry import metrics

meter = metrics.get_meter(__name__)
request_counter = meter.create_counter("http_requests_total")

def handle_request():
    request_counter.add(1)  # ← Same code regardless of backend
```

##### AMP/AMG → Self-hosted Migration Considerations

When migrating from AWS Managed Prometheus (AMP) and Grafana (AMG) to self-managed operations, the following should be considered.

**AMP → Self-hosted Prometheus Migration:**

| Item | AMP (Managed) | Self-hosted Prometheus |
|------|---------------|------------------------|
| **PromQL Compatibility** | 100% compatible | 100% compatible (same queries usable) |
| **Data Migration** | Remote Write → Self-hosted | Need to build long-term storage with Thanos/Cortex |
| **Scaling** | Automatically managed by AWS | Need to build horizontal scaling with Thanos/Cortex |
| **High Availability** | Automatically guaranteed by AWS | Must configure clustering and replication manually |
| **Operational Burden** | None | Upgrades, patches, monitoring, backups required |
| **Cost** | Pay per ingestion/storage/query | Infrastructure cost + operational personnel cost |

**AMG → Self-hosted Grafana Migration:**

| Item | AMG (Managed) | Self-hosted Grafana |
|------|---------------|---------------------|
| **Dashboard Compatibility** | 100% compatible | 100% compatible (JSON export/import) |
| **IAM Integration** | AWS IAM native | Must configure SAML/OAuth manually |
| **Plugins** | AWS data sources pre-installed | Manual installation and version management |
| **Upgrades** | Automatically performed by AWS | Must plan and execute manually |
| **High Availability** | Automatically guaranteed by AWS | Need to configure load balancer and session store |

##### Comparison: AWS Managed vs Self-hosted vs 3rd Party

| Criteria | AWS Managed (AMP/AMG) | Self-hosted (Prometheus/Grafana) | 3rd Party (Datadog/Splunk) |
|----------|----------------------|----------------------------------|---------------------------|
| **Operational Complexity** | Low (AWS manages) | High (self-managed) | Low (vendor manages) |
| **Initial Setup** | Simple (AWS Console/CLI) | Complex (cluster configuration) | Simple (SaaS registration) |
| **Scaling** | Automatic | Manual (Thanos/Cortex needed) | Automatic |
| **Long-term Storage** | AMP defaults to 150 days | Must configure manually (S3 + Thanos, etc.) | Per vendor policy |
| **Cost Structure** | Usage-based | Infrastructure + personnel | Usage or host-based |
| **Data Sovereignty** | Within AWS Region | Full control | Vendor infrastructure |
| **Customization** | Limited | Full freedom | Within vendor-provided scope |
| **Migration Ease** | High (standard APIs) | High (standard open-source) | Medium (varies by vendor) |

:::info Recommendations by Migration Scenario
**AWS → Self-hosted migration**: Consider when data sovereignty, customization, and cost optimization (large-scale environments) are the primary reasons. However, operational capability and personnel are essential.

**AWS → 3rd Party migration**: Consider when integrated observability platforms (APM, logs, infrastructure monitoring integration), advanced AI/ML capabilities, or multi-cloud integration are needed.

**Self-hosted → AWS migration**: Useful when reducing operational burden, automating high availability, and quick startup are needed. Particularly suitable for teams lacking observability expertise.
:::

**Key Message**: Even when using AWS managed services, since standard open-source APIs (PromQL, OpenTelemetry, Grafana Dashboard JSON, etc.) are used as-is, you can **migrate without technical lock-in** when needed. This is the key differentiating point of AWS's open-source strategy.


### 2.4 Key Message of the Evolution

<EvolutionDiagram />

:::tip Key Insight
EKS is the **core executor** of AWS's open-source strategy. It eliminates operational complexity with managed services, strengthens automation components with EKS Capabilities, enables efficient AI-powered operations with Kiro+MCP, and extends to autonomous operations with AI Agents — a **cumulative evolution** model where each stage builds upon the previous one.
:::

---

## 3. The Core of AIOps: AWS Automation → MCP Integration → AI Tools → Kiro Orchestration

The AWS open-source strategy (Managed Add-ons, managed services, EKS Capabilities) explored in Section 2 provides the foundation for K8s operations. AIOps is a layered architecture that **integrates automation tools with MCP, connects them with AI tools, and orchestrates everything with Kiro** on top of this foundation.

```
[Layer 1] AWS Automation Tools — Foundation
  Managed Add-ons · AMP/AMG/ADOT · CloudWatch · EKS Capabilities (Argo CD, ACK, KRO)
                    ↓
[Layer 2] MCP Servers — Unified Interface
  50+ individual MCP servers expose each AWS service as AI-accessible tools
                    ↓
[Layer 3] AI Tools — Infrastructure Control via MCP
  Q Developer · Claude Code · GitHub Copilot etc. directly query/control AWS services via MCP
                    ↓
[Layer 4] Kiro — Spec-Driven Unified Orchestration
  requirements → design → tasks → code generation, native MCP integration for entire workflow
                    ↓
[Layer 5] AI Agent — Autonomous Operations (Extension)
  Kagent · Strands · Q Developer autonomously detect, decide, and execute based on events
```

### 3.1 MCP — Unified Interface for AWS Automation Tools

The Managed Add-ons, AMP/AMG, CloudWatch, and EKS Capabilities from Section 2 are each powerful automation tools, but AI needs a **standardized interface** to access them. MCP (Model Context Protocol) fills this role. AWS provides **more than 50 MCP servers** as open-source, exposing each AWS service as a tool that AI tools can invoke.

<McpServersMap />

#### Detailed Comparison of 3 Hosting Methods

<McpServerTypes />

#### Individual MCP vs Unified Server — Complementary, Not Replacement

The three methods are **complementary, not replacement** relationships. The key difference is **depth vs breadth**.

**Individual MCP servers** (EKS MCP, CloudWatch MCP, etc.) are **specialized tools that understand the native concepts** of their respective services. For example, EKS MCP provides Kubernetes-specific features such as kubectl execution, Pod log analysis, and K8s event-based troubleshooting. Fully Managed versions (EKS/ECS) host these same capabilities in the AWS cloud, adding enterprise requirements such as IAM authentication, CloudTrail auditing, and automatic patching.

**AWS MCP Server unified** is a server that generically calls 15,000+ AWS APIs. It combines AWS Knowledge MCP + AWS API MCP into one. For EKS, it can make AWS API-level calls like `eks:DescribeCluster`, `eks:ListNodegroups`, but does not provide specialized features like Pod log analysis or K8s event interpretation. Instead, its strengths are **multi-service composite operations** (S3 + Lambda + CloudFront combinations, etc.) and **Agent SOPs** (pre-built workflows).

:::info Practical Combined Usage Pattern
```
EKS specialized tasks  → Individual EKS MCP (or Fully Managed)
                         "Analyze the cause of Pod CrashLoopBackOff"

Multi-service tasks     → AWS MCP Server unified
                         "Deploy a static site to S3 and connect CloudFront"

Operational insights    → Individual CloudWatch MCP + Cost Explorer MCP
                         "Analyze the cause of last week's cost spike and metric anomalies"
```

By **connecting both individual MCP and unified servers** to your IDE, AI tools automatically select the appropriate server based on task characteristics.
:::

### 3.1.1 Amazon Bedrock AgentCore Integration Pattern

**Amazon Bedrock AgentCore** is a fully managed platform for safely deploying and managing AI Agents in production environments. By integrating with MCP servers, you can build enterprise-grade Agents that automate EKS monitoring and operational tasks.

#### Bedrock AgentCore Overview

Bedrock AgentCore provides the following capabilities:

| Capability | Description | Value in EKS Operations |
|------------|-------------|------------------------|
| **Agent Orchestration** | Automatic execution of complex multi-step workflows | Autonomous execution of EKS incident response scenarios |
| **Knowledge Bases** | RAG-based context retrieval | Learning from past incident response history |
| **Action Groups** | External API/tool integration | EKS control via MCP servers |
| **Guardrails** | Safety mechanisms and filtering | Automatic blocking of dangerous operational commands |
| **Audit Logging** | CloudTrail integrated audit trail | Compliance and security auditing |

#### Bedrock Agent Architecture Pattern for EKS Monitoring/Operations

**Architecture:**

```
[CloudWatch Alarms / EventBridge Events]
         ↓
[Bedrock Agent Trigger]
         ↓
[Bedrock AgentCore Orchestration]
  ├─ Knowledge Base: Search past incident response history
  ├─ Action Group 1: EKS MCP Server (Pod status query, log collection)
  ├─ Action Group 2: CloudWatch MCP (metric analysis)
  ├─ Action Group 3: X-Ray MCP (trace analysis)
  └─ Guardrails: Dangerous command filtering (production deletion prevention)
         ↓
[Autonomous Diagnosis and Recovery Execution]
         ↓
[CloudTrail Audit Log Recording]
```

**Practical Example: Automated Pod CrashLoopBackOff Response Agent**

```python
# Bedrock Agent Definition (Terraform example)
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

  # Action Group: EKS MCP Server Integration
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

  # Guardrails: Dangerous command blocking
  guardrail_configuration {
    guardrail_identifier = aws_bedrock_guardrail.production_safety.id
    guardrail_version = "1"
  }
}

# Guardrails Definition: Production Environment Protection
resource "aws_bedrock_guardrail" "production_safety" {
  name = "production-safety"

  # Block production namespace deletion
  content_policy_config {
    filters_config {
      input_strength = "HIGH"
      output_strength = "HIGH"
      type = "VIOLENCE"  # Destructive operation filter
    }
  }

  # Sensitive data filtering
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

  # Only allow permitted operations
  topic_policy_config {
    topics_config {
      name = "allowed_operations"
      type = "DENY"
      definition = "Pod deletion in production namespace"
    }
  }
}
```

#### AgentCore + MCP Server Integration Workflow

**Step 1: Lambda Proxy Calls MCP Server**

```python
# Lambda Function: Bedrock Agent Action → EKS MCP Server Proxy
import json
import requests

def lambda_handler(event, context):
    # Parameters passed from Bedrock Agent
    action = event['actionGroup']
    api_path = event['apiPath']
    parameters = event['parameters']

    # EKS MCP Server call (Hosted MCP endpoint)
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

**Step 2: Automatic Agent Trigger with EventBridge Rule**

```json
{
  "source": ["aws.eks"],
  "detail-type": ["EKS Pod State Change"],
  "detail": {
    "status": ["CrashLoopBackOff"]
  }
}
```

#### Bedrock Agent vs Kagent vs Strands Comparison

| Item | Bedrock Agent (AgentCore) | Kagent | Strands |
|------|-------------------------|--------|---------|
| **Maturity** | GA (production-ready) | Early stage (alpha) | Stabilizing (beta) |
| **Hosting** | Fully managed (AWS) | Self-hosted (K8s) | Self-hosted or cloud |
| **MCP Integration** | Lambda Proxy required | Native MCP client | Direct MCP tool calls |
| **Guardrails** | Built-in (AWS Guardrails) | Custom implementation required | Python decorator implementation |
| **Audit Trail** | CloudTrail auto-integration | Manual logging implementation required | Logging plugin configuration |
| **Knowledge Base** | Bedrock Knowledge Bases (RAG) | External vector DB integration | LangChain RAG integration |
| **Cost Structure** | Per API call billing | Infrastructure cost (K8s) | Infrastructure cost |
| **Suitable Scenarios** | Enterprise compliance, production automation | K8s native integration, experimental AI operations | General-purpose Agent workflows, rapid prototyping |
| **Advantages** | Zero operational burden, enterprise-grade security | K8s CRD integration, native observability | Flexible workflows, rich tool ecosystem |
| **Disadvantages** | Lambda Proxy required, AWS dependency | Early stage, may be unstable | Self-hosting required, operational burden |

#### Suitable Scenarios for Each Framework

**When to choose Bedrock Agent:**

- When compliance and audit trails are essential in enterprise environments
- When you don't want to manage AI Agent infrastructure yourself
- When safety mechanisms must be enforced with AWS Guardrails
- When past incident history needs to be learned through RAG

**When to choose Kagent:**

- When K8s native integration is the top priority (CRD, Operator patterns)
- When you want to quickly experiment with AI operations
- When using non-AWS cloud or on-premises K8s clusters
- When you can tolerate instability of early-stage projects

**When to choose Strands:**

- When flexible Agent workflows and tool integration are needed
- When you want to integrate with the Python ecosystem (LangChain, CrewAI, etc.)
- When automating various tasks beyond EKS as a general-purpose AI Agent platform
- When prioritizing prototyping and rapid experimentation

:::tip Practical Recommended Strategy
**Production environment**: Start with Bedrock Agent to meet enterprise requirements (security, auditing, Guardrails), then experimentally test Kagent/Strands in **development/staging environments** — a hybrid strategy is recommended. Bedrock Agent provides immediate stability, while Kagent/Strands lay the foundation for future transition to K8s-native autonomous operations.
:::

### 3.2 AI Tools — Infrastructure Control via MCP

Once MCP exposes AWS services as AI-accessible interfaces, various AI tools can directly query and control infrastructure through them.

<AiToolsComparison />

At this stage, AI tools **perform individual tasks** according to human instructions. They respond based on real-time data via MCP to prompts like "Check Pod status" or "Analyze costs." Useful, but limited in that each task is independent and requires human instruction each time.

### 3.3 Kiro — Spec-Driven Unified Orchestration

**Kiro** is an orchestration layer that goes beyond the limitations of individual AI tools, **defining entire workflows as Specs and executing them consistently through MCP**. Designed as MCP-native, it integrates directly with AWS MCP servers.

Kiro's Spec-driven workflow:

1. **requirements.md** → Define requirements as structured Specs
2. **design.md** → Document architectural decisions
3. **tasks.md** → Automatically decompose implementation tasks
4. **Code generation** → Generate code, IaC, and configuration files reflecting actual infrastructure data collected via MCP

If individual AI tools work in a "ask and answer" fashion, Kiro **chains multiple MCP server calls from a single Spec definition to reach the final deliverable**.

```
[1] Spec Definition (requirements.md)
    "Optimize EKS cluster Pod auto-scaling based on traffic patterns"
         ↓
[2] Collect Current State via MCP
    ├─ EKS MCP       → Cluster configuration, HPA settings, node status
    ├─ CloudWatch MCP → Traffic patterns over the past 2 weeks, CPU/memory trends
    └─ Cost Explorer MCP → Current cost structure, spending by instance type
         ↓
[3] Context-Based Code Generation
    Kiro generates based on collected data:
    ├─ Karpenter NodePool YAML (instance types matching actual traffic)
    ├─ HPA configuration (target values based on measured metrics)
    └─ CloudWatch alarms (thresholds based on actual baselines)
         ↓
[4] Deployment and Verification
    Deploy via Managed Argo CD with GitOps → Real-time deployment result verification via MCP
```

The key to this workflow is that AI **generates code based on actual infrastructure data, not abstract guesses**. Without MCP, AI can only suggest general Best Practices, but with MCP, it creates customized deliverables reflecting the actual state of the current cluster.

<DevOpsAgentArchitecture />

### 3.4 Extension to AI Agents — Autonomous Operations

If Kiro + MCP is orchestration where "humans define Specs and AI executes," AI Agent frameworks are the next stage where **AI autonomously detects, decides, and executes based on events**. On the same infrastructure interface provided by MCP, Agents run their own loops without human intervention.

<AiAgentFrameworks />

### 3.5 Amazon Q Developer & Q Business Latest Features

Amazon Q Developer and Q Business are AWS's representative AI-based operational tools. The two products are designed for different purposes but are used complementarily in the AIOps context.

:::info Amazon Q Developer vs Q Business
**Amazon Q Developer** is a developer productivity tool specializing in code writing, infrastructure automation, and troubleshooting. **Amazon Q Business** is a business data analysis tool used for operational log and metric analysis and business insight generation. In AIOps, Q Developer is used for code/infrastructure automation, and Q Business for generating insights based on operational logs/metrics.
:::

#### Amazon Q Developer Latest Features (2025-2026)

**1. Real-time Code Build and Test (February 2025)**

Q Developer now **automatically builds and tests code changes before the developer reviews them**.

**Features**:
- Immediate build execution after code generation
- Automatic unit test execution and result reporting
- Automatic fix suggestions on build failures
- Quality verification completed before developer review

**Usage in EKS Environments**:

```
Developer: "Add resource limits to the Deployment YAML and set up HPA"

Q Developer:
  1. Modify Deployment YAML (add requests/limits)
  2. Generate HPA YAML
  3. Validate syntax with kubectl apply --dry-run=client
  4. Present changes to developer (already verified)
```

**Reference Materials**:
- [Enhancing Code Generation with Real-Time Execution in Amazon Q Developer](https://aws.amazon.com/blogs/devops/enhancing-code-generation-with-real-time-execution-in-amazon-q-developer/)

**2. CloudWatch Investigations Integration — AI-Based Root Cause Analysis**

Q Developer integrates with CloudWatch Investigations to **explain the root cause of operational incidents in natural language**.

**Workflow**:

```
1. CloudWatch alarm triggered (e.g., memory usage spike in EKS Pod)
2. Ask Q Developer: "Why did Pod memory spike in the production namespace?"
3. Q Developer auto-analyzes:
   ├─ CloudWatch metrics: Memory usage patterns
   ├─ X-Ray traces: Memory leak suspected in specific API call
   ├─ EKS logs: OutOfMemory error logs
   └─ Recent deployment history: New version deployed 2 hours ago
4. Q Developer response:
   "A memory leak occurred due to a cache invalidation logic bug in v2.3.1
    deployed 2 hours ago. Cache accumulates on /api/users endpoint calls.
    Recommended action: Roll back to v2.3.0 or set a cache TTL."
```

**3. Cost Explorer Integration — Automatic Cost Optimization Suggestions**

Q Developer integrates with AWS Cost Explorer to **automatically analyze cost spike causes and suggest optimization measures**.

**EKS Cost Optimization Scenario**:

```
Developer: "Tell me why EKS costs spiked last week"

Q Developer Analysis:
  ├─ Cost Explorer: EC2 instance costs increased 40%
  ├─ CloudWatch metrics: Average CPU utilization 25% (over-provisioned)
  ├─ Karpenter logs: Mostly using c5.4xlarge instances
  └─ Workload pattern: Memory-intensive, not CPU-intensive

Q Developer Recommendations:
  1. Change c5.4xlarge → r5.2xlarge (memory-optimized instances)
  2. Add Spot instance priority to Karpenter NodePool
  3. Adjust HPA settings from CPU-based to memory-based
  Estimated savings: $1,200/month (approximately 30%)
```

**4. Direct Console Troubleshooting — Natural Language Queries for EKS Cluster Issues**

You can invoke Q Developer from the AWS console to **immediately query the current state of EKS clusters**.

**Examples**:

```
Invoking Q Developer from the console:

Question: "Are there any Pods in CrashLoopBackOff state in this cluster?"
Answer: "The api-server Pod in the production namespace is in CrashLoopBackOff state.
        Cause: ConfigMap 'api-config' does not exist."

Question: "What alarms are currently active?"
Answer: "Currently 3 CloudWatch alarms are in ALARM state:
        1. EKS-HighMemoryUsage (exceeded 80% threshold)
        2. EKS-FailedPods (more than 5 failures)
        3. EKS-DiskPressure (node disk 90% used)"
```

**5. Security Scan Auto-Fix Suggestions**

Q Developer **automatically scans code and IaC (Infrastructure as Code) for security vulnerabilities and suggests fixes**.

**Kubernetes YAML Security Scan Example**:

```yaml
# Deployment written by developer
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        securityContext:
          runAsUser: 0  # ⚠️ Security issue: running as root

# Q Developer suggestion:
# "Running a container as root user is a security risk.
#  Modify as follows:"

securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
```

#### Amazon Q Business — Actionable Insights from Logs

Amazon Q Business specializes in **analyzing business data (logs, metrics, documents) to generate action items**.

**CloudWatch Logs → Q Business Workflow**:

```
1. Store EKS application logs in CloudWatch Logs
2. Connect CloudWatch Logs as a data source to Q Business
3. Natural language queries:
   "What was the most frequent error in the last 24 hours?"
   "What time period had the highest error rate and why?"
   "What was the failure with the greatest customer impact?"

4. Q Business response:
   - Error frequency chart by type
   - Estimated number of affected users
   - Root cause analysis (e.g., DB timeout on a specific API endpoint)
   - Action item generation (e.g., "Need to increase DB connection pool size")
```

**Operational Insight Auto-Generation Examples**:

| Query | Q Business Response |
|-------|-------------------|
| "How did error rates change after this week's deployment?" | "Error rate increased from 15% to 22% after Monday's deployment. Main cause: /api/checkout endpoint timeout. Recommendation: Increase timeout from 5 seconds to 10 seconds" |
| "Which service costs the most?" | "The api-gateway service accounts for 40% of total costs. Main cause: Unnecessary log storage (Debug level). Recommendation: Changing log level to Info can save $800/month" |
| "What feature has the most customer complaints?" | "3 timeout incidents occurred in the payment feature last week. Impact: Approximately 200 customers experienced payment failures. Recommendation: Adjust HPA settings for the payment service and optimize DB queries" |

**Q Developer vs Q Business Usage Comparison**:

| Scenario | Q Developer | Q Business |
|---------|-------------|------------|
| Code debugging | ✅ Recommended | - |
| IaC creation/modification | ✅ Recommended | - |
| Infrastructure troubleshooting | ✅ Recommended | - |
| Log pattern analysis | Possible | ✅ Recommended |
| Business insights | - | ✅ Recommended |
| Executive report generation | - | ✅ Recommended |

:::tip Practical Usage Patterns
**Development teams** use Q Developer for code writing, IaC management, and immediate troubleshooting. **Operations teams** use Q Developer for infrastructure issue resolution and Q Business for long-term trend analysis and cost optimization insights. **Executives** use Q Business to generate operational status reports in natural language.
:::

**Reference Materials**:
- [Amazon Q Developer for Operations](https://aws.amazon.com/q/developer/operate/)
- [Building AIOps with Amazon Q Developer CLI and MCP Server](https://aws.amazon.com/blogs/machine-learning/building-aiops-with-amazon-q-developer-cli-and-mcp-server/)
- [Amazon Q Business in OpenSearch](https://aws.amazon.com/opensearch-service/features/q-developer/)

---

:::warning Practical Application Guide

- **Start now**: Introduce AI-based troubleshooting with Q Developer + CloudWatch MCP combination
- **Developer productivity**: Build Spec-driven development workflows with Kiro + EKS/IaC/Terraform MCP
- **Gradual expansion**: Codify repetitive operational scenarios as Strands Agent SOPs
- **Future exploration**: Transition to autonomous operations when K8s-native Agent frameworks like Kagent mature
:::

:::info Core Value
The core value of this layered architecture is that **each layer is independently valuable, while the level of automation increases as layers are stacked**. Just connecting MCP allows direct infrastructure queries from AI tools; adding Kiro enables Spec-driven workflows; and adding Agents extends to autonomous operations. Regardless of which observability stack you use — AMP/CloudWatch/Datadog — MCP abstracts it as a single interface, so AI tools and Agents operate identically regardless of the backend.
:::

---

## 4. Operations Automation Patterns: Human-Directed, Programmatically-Executed

The core of AIOps is the "Human-Directed, Programmatically-Executed" model where **humans define intent and guardrails, and systems execute programmatically**. This model is implemented as a spectrum of three patterns in the industry.

### 4.1 Prompt-Driven (Interactive) Operations

A pattern where humans give natural language prompt instructions at each step, and AI performs a single task. ChatOps and AI assistant-based operations fall into this category.

```
Operator: "Check the Pod status of the current production namespace"
AI: (Executes kubectl get pods -n production and returns results)
Operator: "Show me the logs of the Pod in CrashLoopBackOff state"
AI: (Executes kubectl logs and returns results)
Operator: "It seems to be out of memory, increase the limits"
AI: (Executes kubectl edit)
```

**Suitable situations**: Exploratory debugging, analysis of new types of failures, one-time actions
**Limitations**: Human is involved in every step of the loop (Human-in-the-Loop), inefficient for repetitive scenarios

### 4.2 Spec-Driven (Codified) Operations

A pattern where operational scenarios are **declaratively defined as specifications (Specs) or code**, and systems execute them programmatically. IaC (Infrastructure as Code), GitOps, and Runbook-as-Code fall into this category.

```
[Intent Definition]  Declare operational scenarios via requirements.md / SOP documents
       ↓
[Code Generation]    Generate automation code with Kiro + MCP (IaC, runbooks, tests)
       ↓
[Verification]       Automated tests + Policy-as-Code verification
       ↓
[Deployment]         Declarative deployment via GitOps (Managed Argo CD)
       ↓
[Monitoring]         Observability stack continuously tracks execution results
```

**Suitable situations**: Repetitive deployments, infrastructure provisioning, standardized operational procedures
**Core value**: Define Spec once → No additional cost for repeated execution, consistency guaranteed, Git-based audit trail

### 4.3 Agent-Driven (Autonomous) Operations

A pattern where AI Agents **detect events, collect and analyze context, and autonomously respond within predefined guardrails**. Human-on-the-Loop — humans set guardrails and policies, and Agents execute.

```
[Event Detection]    Observability stack → Alert trigger
       ↓
[Context Collection] Unified query of metrics + traces + logs + K8s state via MCP
       ↓
[Analysis/Decision]  AI performs root cause analysis + determines response plan
       ↓
[Autonomous Execution] Auto-recovery within guardrail scope (Kagent/Strands SOPs)
       ↓
[Feedback Learning]  Record results and continuously improve response patterns
```

**Suitable situations**: Automated incident response, cost optimization, [4. Predictive Scaling and Auto-Remediation](./aiops-predictive-operations.md)
**Core value**: Second-level response, 24/7 unmanned operations, context-based intelligent decision-making

### 4.4 Pattern Comparison: EKS Cluster Issue Response Scenario

<OperationPatternsComparison />

:::tip Combining Patterns in Practice
The three patterns are not mutually exclusive but **complementary**. In actual operations, you go through a gradual maturation process of exploring and analyzing new failure types with **Prompt-Driven**, codifying repeatable patterns with **Spec-Driven**, and ultimately automating with **Agent-Driven**. The key is to automate repetitive operational scenarios so that operations teams can focus on strategic work.
:::

---

## 5. Traditional Monitoring vs AIOps

<MonitoringComparison />

### The Core of the Paradigm Shift

Traditional monitoring is a model where **humans define rules and systems execute rules**. AIOps is a transition to a model where **systems learn patterns from data and humans make strategic decisions**.

Why this transition is particularly important in EKS environments:

1. **Microservice complexity**: Dozens to hundreds of services interact, making it difficult to manually identify all dependencies
2. **Dynamic infrastructure**: Infrastructure continuously changes with Karpenter-based automatic node provisioning
3. **Multi-dimensional data**: Metrics, logs, traces, K8s events, and AWS service events occur simultaneously
4. **Speed requirements**: Frequent deployments based on GitOps diversify failure causes

---

## 6. AIOps Core Capabilities

Let's examine the four core capabilities of AIOps along with EKS environment scenarios.

### 6.1 Anomaly Detection

Detects anomalies using **ML-based dynamic baselines** rather than static thresholds.

**EKS Scenario: Gradual Memory Leak**

```
Traditional approach:
  Memory usage > 80% → Alert → Operator checks → OOMKilled already occurred

AIOps approach:
  ML model detects slope change in memory usage pattern
  → "Memory usage is showing an abnormal increasing trend compared to normal"
  → Preemptive alert before OOMKilled occurs
  → Agent automatically collects memory profiling data
```

**Applied services**: DevOps Guru (ML anomaly detection), CloudWatch Anomaly Detection (metric bands)

### 6.2 Root Cause Analysis

Automatically identifies root causes through **correlation analysis** of multiple data sources.

**EKS Scenario: Intermittent Timeouts**

```
Symptom: Intermittent 504 timeouts in API service

Traditional approach:
  Check API Pod logs → Normal → Check DB connections → Normal
  → Check network → Check CoreDNS → Cause unknown → Hours spent

AIOps approach:
  CloudWatch Investigations auto-analyzes:
  ├─ X-Ray traces: Latency in DB connections for a specific AZ
  ├─ Network Flow Monitor: Increased packet drops in that AZ's subnet
  └─ K8s events: ENI allocation failures on nodes in that AZ
  → Root cause: Subnet IP exhaustion
  → Recommended action: Expand subnet CIDR or enable Prefix Delegation
```

**Applied services**: CloudWatch Investigations, Q Developer, Kiro + EKS MCP

### 6.3 Predictive Analytics

Learns from past patterns to **predict future states** and take preemptive action.

**EKS Scenario: Traffic Spike Prediction**

```
Data: Request volume patterns by time of day over the past 4 weeks

ML prediction:
  2.5x traffic spike expected Monday at 09:00 (weekly pattern)
  → Preemptive node provisioning in Karpenter NodePool
  → Pre-adjust HPA minReplicas
  → Accommodate traffic without Cold Start
```

**Applied services**: CloudWatch metrics + Prophet/ARIMA models + Karpenter

For detailed implementation methods, see [4. Predictive Scaling and Auto-Remediation](./aiops-predictive-operations.md).

### 6.4 Auto-Remediation

**Autonomously recovers within predefined safety boundaries** for detected anomalies.

**EKS Scenario: Pod Eviction Due to Disk Pressure**

```
Detection: DiskPressure condition activated on Node

AI Agent Response:
  1. Clean container image cache on the node (crictl rmi --prune)
  2. Clean temporary files
  3. Verify DiskPressure condition resolved
  4. If not resolved:
     ├─ Cordon the node (block new Pod scheduling)
     ├─ Drain existing Pods to other nodes
     └─ Karpenter auto-provisions new nodes
  5. Escalation: Alert operations team if recurring + recommend root volume size increase
```

**Applied services**: Kagent + Strands SOPs, EventBridge + Lambda

:::tip Safety Mechanism Design
When implementing auto-remediation, always set up **guardrails**:

- Phased execution in production environments (canary → progressive)
- Save current state snapshot before recovery execution
- Automatic rollback on recovery failure
- Limit number of identical recoveries within a time window (infinite loop prevention)
:::
