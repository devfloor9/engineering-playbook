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

### 6.5 Node Readiness Controller and Declarative Node Management

**Node Readiness Controller (NRC)** is a feature introduced as alpha in Kubernetes 1.32 that declaratively manages node Readiness state using CRDs (Custom Resource Definitions). This is an important example showing that the K8s ecosystem is **evolving from imperative node management to declarative node management**.

#### Node Readiness Controller from an AIOps Perspective

**Limitations of the traditional approach:**

```
Node anomaly detected → Manually run kubectl cordon/drain
Problems:
- Manual intervention required (response delay)
- Inconsistent responses (different procedures per operator)
- Difficult to track node state changes (no audit trail)
```

**NRC-based declarative management:**

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
    tolerationSeconds: 300  # Pod eviction after 5-minute grace period
```

Now when a DiskPressure condition occurs, **NRC automatically adds taints** to block new Pod scheduling, and existing Pods are evicted after 5 minutes. Node isolation is possible through declarative policies alone without manual operator intervention.

#### AIOps Integration Scenario: AI-Based Predictive Node Management

NRC enables **proactive node management** when combined with AI-based predictive analytics.

**Scenario: Preemptive Node Isolation Based on Hardware Failure Prediction**

```
[Phase 1] Anomaly Detection
  CloudWatch Agent → Collect node hardware metrics
  ├─ Gradual decrease in disk IOPS (30% degradation vs normal)
  ├─ Increase in memory ECC errors (5 occurrences in last hour)
  └─ Rising CPU temperature trend (45°C → 62°C)
       ↓
  ML model analysis: "85% probability of hardware failure within 72 hours"

[Phase 2] AI Agent Updates Node Condition
  Kagent/Strands Agent sets custom Node Condition:
  kubectl annotate node ip-10-0-1-42 predicted-failure=high-risk

[Phase 3] NRC Automatically Manages Taints
  NodeReadinessRule detects the Condition → Automatically adds taints
  ├─ Block new Pod scheduling (NoSchedule)
  ├─ Existing workloads continue normal operation (grace period)
  └─ Karpenter provisions replacement nodes

[Phase 4] Gradual Workload Migration
  AI Agent determines priority by workload characteristics:
  1. Migrate stateless applications first (no downtime)
  2. Stateful workloads wait for maintenance window
  3. Remove node after all workloads are migrated
```

**Core Value:**

| Traditional Approach | NRC + AIOps Approach |
|---------------------|---------------------|
| Response **after** failure occurs | Preemptive action **before** failure occurs |
| Manual cordon/drain | Automatic processing based on declarative policies |
| Inconsistent responses | Standardized responses via CRD |
| Difficult audit trail | Policy version control via Git |
| Potential downtime | Zero-downtime through gradual workload migration |

#### DevOps Agent Integration Patterns

**Pattern 1: Node Problem Detector + NRC**

```
Node Problem Detector detects hardware anomaly
  → Node Condition update (DiskPressure, MemoryPressure, etc.)
     → NRC automatically adds taints
        → Karpenter provisions replacement nodes
```

**Pattern 2: AI Prediction + NRC (Proactive)**

```
CloudWatch Agent collects metrics
  → AI model predicts failure
     → DevOps Agent sets custom Node Condition
        → NRC applies declarative policies
           → Zero-downtime workload migration
```

**Pattern 3: Security Event-Based Automatic Isolation**

```
GuardDuty detects abnormal process on node
  → EventBridge → Lambda → Adds security-risk Condition to Node
     → NRC immediately applies NoExecute taint
        → All Pods evicted (preventing security incident spread)
           → Node maintained in isolated state for forensic analysis
```

#### Position in the AIOps Maturity Model

| Maturity Level | Node Management Approach | NRC Utilization |
|---------------|------------------------|----------------|
| **Level 0 (Manual)** | Manual cordon/drain | Not applied |
| **Level 1 (Reactive)** | Node Problem Detector + manual response | Not applied |
| **Level 2 (Declarative)** | Condition-based automatic taint management with NRC | ✅ **NRC adoption** |
| **Level 3 (Predictive)** | AI predicts node failure + preemptive isolation with NRC | ✅ AI + NRC integration |
| **Level 4 (Autonomous)** | DevOps Agent + NRC for fully autonomous node lifecycle management | ✅ Agent + NRC automation |

:::info Evolution of the K8s Ecosystem
Node Readiness Controller demonstrates that the Kubernetes ecosystem is **evolving from imperative to declarative, and from reactive to predictive**. When NRC is combined with AI-based predictive analytics, workloads can be preemptively migrated **before** node failures occur, enabling zero-downtime operations. This is an implementation of AIOps' core value — "AI solves problems before humans need to intervene" — in the node management domain.
:::

**References:**

- [Kubernetes Blog: Introducing Node Readiness Controller](https://kubernetes.io/blog/2026/02/03/introducing-node-readiness-controller/)

### 6.6 Multi-Cluster AIOps Management

Large organizations operate multiple EKS clusters for development, staging, production, and more. To effectively implement AIOps in multi-cluster environments, **unified observability, centralized AI insights, and organization-wide governance** are required.

#### Multi-Cluster AIOps Strategy

**Key Challenges:**

| Challenge | Description | Solution |
|-----------|-------------|----------|
| **Distributed observability** | Independent monitoring stacks per cluster | Centralize with CloudWatch Cross-Account Observability |
| **Duplicate alerts** | Same issue generates individual alerts across multiple clusters | Correlation analysis and unified insights with Amazon Q Developer |
| **Inconsistent responses** | Different incident response procedures per cluster | Standardized workflows with Bedrock Agent + Strands SOPs |
| **Lack of governance** | Policy inconsistency across clusters | Unified policies with AWS Organizations + OPA/Kyverno |
| **Insufficient cost visibility** | Difficult to compare costs across clusters | Integrated dashboard with CloudWatch + Cost Explorer |

#### 1. Centralized Monitoring with CloudWatch Cross-Account Observability

**CloudWatch Cross-Account Observability** consolidates metrics, logs, and traces from multiple AWS accounts into a single observability account.

**Architecture:**

```
[Development Account]        [Staging Account]        [Production Account]
  EKS Cluster A               EKS Cluster B            EKS Cluster C
  └─ CloudWatch Agent         └─ CloudWatch Agent      └─ CloudWatch Agent
  └─ ADOT Collector           └─ ADOT Collector        └─ ADOT Collector
         ↓                            ↓                         ↓
         └────────────────────────────┴─────────────────────────┘
                                      ↓
                    [Observability Account (Central)]
                    ├─ Amazon Managed Prometheus (AMP)
                    ├─ Amazon Managed Grafana (AMG)
                    ├─ CloudWatch Logs Insights (unified logs)
                    ├─ X-Ray (unified traces)
                    └─ Amazon Q Developer (unified insights)
```

**Setup Method:**

```bash
# Step 1: Configure Monitoring Account in the Observability account
aws oam create-sink \
  --name multi-cluster-observability \
  --tags Key=Environment,Value=Production

# Step 2: Create Link from each source account (dev/staging/prod)
aws oam create-link \
  --resource-types "AWS::CloudWatch::Metric" \
  "AWS::Logs::LogGroup" \
  "AWS::XRay::Trace" \
  --sink-identifier "arn:aws:oam:us-east-1:123456789012:sink/sink-id" \
  --label-template '$AccountName-$Region'

# Step 3: Create unified dashboard in AMG (consolidate all cluster metrics)
```

**Unified Dashboard Example (AMG):**

```yaml
# Grafana Dashboard JSON — Multi-cluster Pod status overview
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

#### 2. Multi-Cluster Insights with Amazon Q Developer

Amazon Q Developer performs **cross-cluster correlation analysis** based on unified observability data.

**Use Cases:**

| Question | Q Developer Analysis | Value |
|----------|---------------------|-------|
| "Why did latency increase simultaneously across multiple clusters yesterday at 3 PM?" | Analyzes X-Ray traces to identify CPU spike on a shared RDS instance | No need for per-cluster investigation, immediate root cause identification |
| "Why is the cost difference between production and staging clusters so large?" | Analyzes Cost Explorer data to discover excessive NAT Gateway costs in production | Cost optimization opportunity discovery |
| "Are we applying the same security policies across all clusters?" | Compares GuardDuty Findings to detect weak RBAC settings in the development cluster | Security governance strengthening |

**Practical Example: Multi-Cluster Failure Correlation Analysis**

```
Developer: "All production clusters simultaneously had Pods go into CrashLoopBackOff state at 10 AM today. Why?"

Q Developer analysis:
  1. Unified log analysis across all clusters with CloudWatch Logs Insights
     → Common pattern: "Failed to pull image: registry.example.com/app:v2.1"

  2. Image registry access analysis with X-Ray traces
     → registry.example.com DNS lookup failure (Route 53)

  3. Route 53 health check verification with CloudWatch metrics
     → registry.example.com health check changed to UNHEALTHY at 9:58 AM

  4. Root cause identification
     → Image registry server TLS certificate expiration

  5. Recommended action
     → Renew certificate then restart Pods across all clusters
```

#### 3. Organization-Wide AIOps Governance Framework

In multi-cluster environments, **consistent policy enforcement and standardized response procedures** are essential.

##### Governance Layers

```
[Layer 1] AWS Organizations — Define account and cluster hierarchy
         ↓
[Layer 2] Service Control Policies (SCPs) — Organization-wide security policies
         ↓
[Layer 3] OPA/Kyverno — Per-cluster K8s policies (Pod Security, Network Policy)
         ↓
[Layer 4] Bedrock Agent Guardrails — AI auto-response safety mechanisms
         ↓
[Layer 5] CloudTrail + CloudWatch Logs — Audit trail and compliance verification
```

##### Standardized Incident Response Workflow

**Multi-cluster response automation with Bedrock Agent + Strands SOPs:**

```python
# Strands SOP: Multi-cluster Pod CrashLoopBackOff response
from strands import Agent, sop

@sop(name="multi_cluster_crash_response")
def handle_multi_cluster_crash(event):
    """
    Unified response when the same issue occurs across multiple clusters
    """
    affected_clusters = event['clusters']  # ['dev', 'staging', 'prod']

    # Step 1: Verify same pattern across all clusters
    common_error = analyze_common_pattern(affected_clusters)

    if common_error:
        # Step 2: Identify common root cause (e.g., external dependency failure)
        root_cause = identify_shared_dependency(common_error)

        # Step 3: Resolve root cause centrally
        fix_shared_dependency(root_cause)

        # Step 4: Propagate automatic recovery to all clusters
        for cluster in affected_clusters:
            restart_affected_pods(cluster)
            verify_recovery(cluster)

        return {
            'status': 'resolved',
            'root_cause': root_cause,
            'affected_clusters': affected_clusters
        }
    else:
        # Step 5: Individual per-cluster response needed
        return {
            'status': 'escalated',
            'message': 'No common pattern found, escalating to ops team'
        }
```

##### Multi-Cluster Policy Standardization (OPA)

```rego
# OPA Policy: Apply identical Pod Security Standards across all clusters
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

#### 4. Multi-Cluster Cost Optimization

**CloudWatch + Cost Explorer integrated analysis:**

```sql
-- CloudWatch Logs Insights: Cost driver analysis by cluster
fields @timestamp, cluster_name, namespace, pod_name, node_type, cost_per_hour
| filter event_type = "pod_usage"
| stats sum(cost_per_hour) as total_cost by cluster_name, namespace
| sort total_cost desc
| limit 10
```

**AI-based cost optimization insights (Q Developer):**

```
Question: "Analyze cost growth rates by cluster for the past month and suggest optimization opportunities"

Q Developer analysis:
  1. Cost Explorer data analysis
     - Cluster A (dev): +5% (normal range)
     - Cluster B (staging): +120% (abnormal surge)
     - Cluster C (prod): +15% (within expected range due to traffic growth)

  2. Cost surge root cause analysis for Cluster B
     - CloudWatch metrics: GPU instance (g5.xlarge) usage spike
     - Log analysis: ML team running experimental workloads long-term in staging

  3. Optimization recommendations
     - Switch ML workloads to Spot Instances (estimated 70% cost reduction)
     - Apply Karpenter to staging cluster for automatic idle node removal
     - Auto scale-down development cluster during off-hours (nights/weekends)
```

:::info Core Value
The key to multi-cluster AIOps is **managing distributed infrastructure with a unified perspective**. By centralizing data with CloudWatch Cross-Account Observability, analyzing cross-cluster correlations with Amazon Q Developer, and implementing standardized automated responses with Bedrock Agent and Strands, operational complexity does not increase linearly even as the number of clusters grows.
:::

### 6.7 EventBridge-Based AI Auto-Response Patterns

Amazon EventBridge is a serverless event bus that connects events from AWS services, applications, and SaaS providers to build event-driven architectures. By integrating with EKS, you can build **AI Agent workflows that automatically respond to cluster events**.

#### EventBridge + EKS Event Integration Architecture

You can trigger automated response workflows by sending Kubernetes events from EKS clusters to EventBridge.

```
[EKS Cluster]
  ├─ Pod state changes (CrashLoopBackOff, OOMKilled, ImagePullBackOff)
  ├─ Node state changes (NotReady, DiskPressure, MemoryPressure)
  ├─ Scaling events (HPA scale up/down, Karpenter node add/remove)
  └─ Security alerts (GuardDuty Findings, abnormal API calls)
         ↓
[EventBridge Event Bus]
  Event collection and routing
         ↓
[EventBridge Rules]
  Event pattern matching + filtering
         ↓
[Response Workflows]
  ├─ Lambda → Kagent/Strands Agent invocation → Automatic diagnosis/recovery
  ├─ Step Functions → Multi-stage automated response workflows
  ├─ SNS/SQS → Notifications or asynchronous processing
  └─ CloudWatch Logs → Audit and analysis
```

#### Key Event Types and Response Patterns

| Event Type | Detection Condition | Auto-Response Pattern |
|-----------|-------------------|----------------------|
| **Pod CrashLoopBackOff** | Pod restart count > 5 | AI Agent analyzes logs → identifies root cause → automatic rollback or config fix |
| **Node NotReady** | Node state change | Karpenter trigger → new node provisioning, existing Pod drain |
| **OOMKilled** | Pod terminated due to memory shortage | AI Agent analyzes memory usage patterns → auto-adjusts HPA/VPA settings |
| **ImagePullBackOff** | Image pull failure | Lambda verifies ECR permissions → auto-fix or alert |
| **DiskPressure** | Node disk usage > 85% | Lambda cleans image cache → deletes temp files |
| **GuardDuty Finding** | Security threat detected | Step Functions → Pod isolation → forensic data collection → alert |

#### AI Agent Integration Patterns

##### Pattern 1: EventBridge → Lambda → AI Agent (Kagent/Strands)

**Workflow:**

```
1. EKS event occurs: Pod CrashLoopBackOff
         ↓
2. EventBridge Rule match: "Pod.status.phase == 'CrashLoopBackOff'"
         ↓
3. Lambda function execution:
   - Collect Pod logs via EKS MCP
   - Collect metrics via CloudWatch MCP
   - Collect traces via X-Ray MCP
         ↓
4. Kagent/Strands Agent invocation:
   - AI analyzes collected context
   - Root cause identification (e.g., missing ConfigMap, environment variable error)
   - Execute automatic recovery or alert operations team
         ↓
5. Result recording:
   - Save diagnosis results to CloudWatch Logs
   - Close event on successful recovery
   - Escalate on recovery failure
```

**Lambda Function Example (Python):**

```python
import boto3
import json
from kagent import KagentClient

eks_client = boto3.client('eks')
logs_client = boto3.client('logs')
kagent = KagentClient()

def lambda_handler(event, context):
    # Extract Pod information from EventBridge event
    detail = event['detail']
    pod_name = detail['pod_name']
    namespace = detail['namespace']
    cluster_name = detail['cluster_name']

    # Collect Pod logs (last 100 lines)
    logs = get_pod_logs(cluster_name, namespace, pod_name, tail=100)

    # Request diagnosis from Kagent
    diagnosis = kagent.diagnose(
        context={
            'pod_name': pod_name,
            'namespace': namespace,
            'logs': logs,
            'event_type': 'CrashLoopBackOff'
        },
        instruction="Analyze the root cause and suggest remediation"
    )

    # Execute AI-suggested remediation actions
    if diagnosis.confidence > 0.8:
        apply_remediation(diagnosis.remediation_steps)
        return {'status': 'auto_remediated', 'diagnosis': diagnosis}
    else:
        # Alert operations team when confidence is low
        notify_ops_team(diagnosis)
        return {'status': 'escalated', 'diagnosis': diagnosis}
```

##### Pattern 2: EventBridge → Step Functions → Multi-Stage Auto-Response

**Workflow (Node NotReady Response):**

```json
{
  "Comment": "EKS node failure automatic recovery workflow",
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

#### ML Inference Workload Network Performance Observability

ML inference workloads (Ray, vLLM, Triton, PyTorch, etc.) have different network characteristics from general workloads due to **GPU-to-GPU communication, model parallelization, and distributed inference**.

**Unique Observability Requirements for ML Workloads:**

| Metric | General Workloads | ML Inference Workloads |
|--------|-------------------|----------------------|
| **Network bandwidth** | Medium (API calls) | Very high (model weights, tensor transfers) |
| **Latency sensitivity** | High (user-facing) | Very high (real-time inference SLA) |
| **Packet drop impact** | Recovery after retransmission | Inference failure or timeout |
| **East-West traffic** | Low (mostly North-South) | Very high (inter-GPU node communication) |
| **Network pattern** | Request-response | Burst + Sustained (model loading, inference, result aggregation) |

**Container Network Observability Data Utilization:**

EKS Container Network Observability collects the following network metrics:

- **Pod-to-Pod network throughput** (bytes/sec)
- **Network latency** (p50, p99)
- **Packet drop rate**
- **Retransmission rate**
- **TCP connection state**

**ML Inference Workload Monitoring Example:**

```yaml
# Prometheus query example — Detecting network bottlenecks in vLLM workloads
apiVersion: v1
kind: ConfigMap
metadata:
  name: ml-network-alerts
data:
  alerts.yaml: |
    groups:
    - name: ml_inference_network
      rules:
      # Abnormal inter-GPU node network latency
      - alert: HighInterGPULatency
        expr: |
          container_network_latency_p99{
            workload="vllm-inference",
            direction="pod-to-pod"
          } > 10
        for: 5m
        annotations:
          summary: "Inter-GPU node network latency spike"
          description: "Inter-node latency for vLLM inference workload has exceeded 10ms. This may affect model parallelization performance."

      # Network bandwidth saturation
      - alert: NetworkBandwidthSaturation
        expr: |
          rate(container_network_transmit_bytes{
            workload="ray-cluster"
          }[5m]) > 9e9  # 9GB/s (90% of 10GbE)
        for: 2m
        annotations:
          summary: "Ray cluster network bandwidth saturation"
          description: "Network bandwidth has exceeded 90%. Consider enabling ENA Express or EFA."
```

**EventBridge Rule: ML Network Anomaly Auto-Response**

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

Auto-response actions:
1. **Lambda function**: Analyze Container Network Observability data → identify bottleneck segments
2. **AI Agent**: Root cause diagnosis (CNI configuration, ENI allocation, cross-AZ communication, etc.)
3. **Automatic optimization**: Enable ENA Express, configure Prefix Delegation, adjust Pod topology

:::info GPU Workload Specifics
For GPU-based ML inference workloads, **the network is the primary cause of performance bottlenecks**. Due to model weights (several GB), intermediate tensors (hundreds of MB), and result aggregation, 10-100x higher network bandwidth is required compared to general workloads. Container Network Observability makes these patterns visible, and EventBridge-based auto-optimization enables real-time response.
:::

#### EventBridge Rule Example: Pod CrashLoopBackOff Auto-Response

**EventBridge Rule Definition (JSON):**

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

**Response Workflow (Lambda + AI Agent):**

```python
# Lambda function: EKS event → AI Agent automatic diagnosis
import boto3
import json
from strands import StrandsAgent

def lambda_handler(event, context):
    detail = event['detail']

    # Extract event information
    cluster_name = detail['clusterName']
    namespace = detail['namespace']
    pod_name = detail['involvedObject']['name']
    reason = detail['reason']

    # Initialize Strands Agent (MCP integration)
    agent = StrandsAgent(
        mcp_servers=['eks-mcp', 'cloudwatch-mcp', 'xray-mcp']
    )

    # Request diagnosis from AI Agent
    diagnosis_result = agent.run(
        sop_name="eks_pod_crashloop_diagnosis",
        context={
            'cluster': cluster_name,
            'namespace': namespace,
            'pod': pod_name,
            'reason': reason
        }
    )

    # Auto-remediate or escalate based on diagnosis result
    if diagnosis_result.auto_remediable:
        # Execute auto-remediation
        remediation_result = agent.run(
            sop_name="eks_pod_auto_remediation",
            context=diagnosis_result.remediation_plan
        )

        # Record results in CloudWatch Logs
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
        # Alert operations team (SNS)
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

**Strands Agent SOP Example (YAML):**

```yaml
# eks_pod_crashloop_diagnosis.yaml
name: eks_pod_crashloop_diagnosis
description: "EKS Pod CrashLoopBackOff automatic diagnosis"
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

:::tip Value of EventBridge + AI Agent
EventBridge-based auto-response patterns enable **detecting, diagnosing, and recovering from incidents in seconds without human intervention**. When integrated with AI Agents (Kagent, Strands), it goes beyond simple rule-based responses to enable intelligent automation that understands context and identifies root causes. This is the key difference between traditional automation (Runbook-as-Code) and AIOps.
:::

---

## 7. AWS AIOps Service Map

<AwsServicesMap />

### Integration Flow Between Services

AWS AIOps services provide value independently, but **synergy is maximized when used together**:

1. **CloudWatch Observability Agent** → Metrics/logs/traces collection
2. **Application Signals** → Service map + automatic SLI/SLO generation
3. **DevOps Guru** → ML anomaly detection + recommended actions
4. **CloudWatch Investigations** → AI root cause analysis
5. **Q Developer** → Natural language-based troubleshooting
6. **Hosted MCP** → Direct AWS resource access from AI tools

:::tip When Using 3rd Party Observability Stacks
Even in environments using 3rd party solutions like Datadog, Sumo Logic, or Splunk, you can send the same data to 3rd party backends by using ADOT (OpenTelemetry) as the collection layer. Since the MCP integration layer abstracts backend selection, AI tools and Agents work identically regardless of which observability stack is used.
:::

### 7.7 CloudWatch Generative AI Observability

**Announced**: July 2025 Preview, October 2025 GA

**Core Value**: Goes beyond the traditional 3-Pillar observability (Metrics/Logs/Traces) by adding a fourth Pillar: **AI workload-specific observability**.

#### LLM and AI Agent Workload Monitoring

CloudWatch Generative AI Observability provides **unified monitoring for LLM and AI Agent workloads running on any infrastructure** — Amazon Bedrock, EKS, ECS, on-premises, and more.

**Key Features**:

| Feature | Description |
|---------|-------------|
| **Token consumption tracking** | Real-time tracking of prompt tokens, completion tokens, and total token usage |
| **Latency analysis** | Latency measurement for LLM calls, Agent tool execution, and full chain |
| **End-to-End tracing** | Flow tracking across the entire AI stack (prompt → LLM → tool calls → response) |
| **Hallucination risk path detection** | Identification of execution paths with high hallucination risk |
| **Retrieval miss identification** | Detection of knowledge base search failures in RAG pipelines |
| **Rate-limit retry monitoring** | Tracking retry patterns caused by API rate limits |
| **Model switching decision tracking** | Visibility into model selection logic in multi-model strategies |

#### Amazon Bedrock AgentCore and External Framework Compatibility

**Native integration**:
- Amazon Bedrock Data Automation MCP Server integration
- Automatic instrumentation through AgentCore Gateway
- Automatic observability data injection into PRs via GitHub Actions

**External framework support**:
- LangChain
- LangGraph
- CrewAI
- Other OpenTelemetry-based Agent frameworks

#### Unique Requirements for AI Observability

Unlike traditional application monitoring, AI workloads require the following unique metrics:

```
Traditional monitoring:
  CPU/Memory/Network → Request count → Response time → Error rate

AI workload monitoring:
  Above items + Token consumption + Model latency + Tool execution success rate +
  Retrieval accuracy + Hallucination frequency + Context window utilization
```

**Usage Scenario on EKS**:

```yaml
# AI Agent workload running on EKS
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

Once the Agent is running, CloudWatch automatically collects:
- Full trace from customer inquiry → LLM call → knowledge base search → response generation
- Token consumption and cost at each step
- Paths with high hallucination probability (e.g., LLM answering with general knowledge after a Retrieval Miss)

:::info AI Observability is Key to Cost Optimization
LLM API calls are billed per token. CloudWatch Gen AI Observability visualizes **which prompts consume excessive tokens** and **which tool combinations are inefficient**, enabling 20-40% cost reduction for AI workloads.
:::

**References**:
- [CloudWatch Gen AI Observability Preview Announcement](https://aws.amazon.com/blogs/mt/launching-amazon-cloudwatch-generative-ai-observability-preview/)
- [Agentic AI Observability with CloudWatch](https://www.goml.io/blog/cloudwatch-for-agentic-ai-observability)

### 7.8 GuardDuty Extended Threat Detection — EKS Security Observability

**Announced**: June 2025 EKS support, December 2025 EC2/ECS expansion

**Core Value**: Integrates security anomaly detection with operational anomaly detection to achieve **holistic observability**.

#### AI/ML-Based Multi-Stage Attack Detection

GuardDuty Extended Threat Detection **correlates multiple data sources** to detect sophisticated attacks that are easily missed by traditional security monitoring.

**Correlated Data Sources**:

| Data Source | Detection Content |
|------------|------------------|
| **EKS audit logs** | Abnormal API call patterns (e.g., privilege escalation attempts, unauthorized Secret access) |
| **Runtime behavior** | Abnormal process execution within containers, unexpected network connections |
| **Malware execution** | Detection of known/unknown malware signatures |
| **AWS API activity** | Temporal correlation analysis between CloudTrail events and EKS activity |

#### Attack Sequence Findings — Multi-Resource Threat Identification

**Limitations of single event detection**:

```
Traditional security monitoring:
  Event 1: Pod connects to external IP → Alert
  Event 2: IAM role temporary credential request → Alert
  Event 3: S3 bucket object listing → Alert

Problem: Each event may appear normal individually → False positives
```

**Attack Sequence Findings approach**:

```
GuardDuty AI analysis:
  Event 1 + Event 2 + Event 3 connected temporally and logically
  → "Data Exfiltration attack sequence" detected
  → Single Critical Severity Finding generated
```

GuardDuty automatically identifies **attack chains spanning multiple resources (Pods, nodes, IAM roles, S3 buckets) and data sources (EKS logs, CloudTrail, VPC Flow Logs)**.

#### Real-World Case: November 2025 Cryptomining Campaign Detection

**Background**: A large-scale cryptomining attack campaign targeting Amazon EC2 and ECS began on November 2, 2025.

**Attack Sequence**:
1. **Initial intrusion**: Exploiting publicly available vulnerable container images
2. **Privilege acquisition**: IAM credential theft via IMDS (Instance Metadata Service)
3. **Lateral movement**: Starting other EC2 instances/ECS tasks with acquired credentials
4. **Cryptomining execution**: Deploying mining software on high-performance instances

**GuardDuty Detection Mechanism**:

| Detection Stage | Method |
|----------------|--------|
| **Abnormal behavior identification** | Container attempting unexpected connections to external mining pools |
| **Credential misuse detection** | Surge in IMDS call frequency + API calls at abnormal hours |
| **Resource spike correlation analysis** | 100% CPU usage + known mining process signatures |
| **Attack chain reconstruction** | Connecting events in temporal order to present complete attack scenario |

**Result**: GuardDuty automatically detected the attack, AWS issued warnings to customers, and this prevented potential cost losses of millions of dollars.

**References**:
- [AWS Security Blog: Cryptomining Campaign Detection](https://aws.amazon.com/blogs/security/cryptomining-campaign-targeting-amazon-ec2-and-amazon-ecs/)

#### AIOps Perspective: Integration of Security Observability

**Traditional separation model**:

```
Security team → GuardDuty, Security Hub
Operations team → CloudWatch, Prometheus
Result: Security anomalies and operational anomalies reported separately → Delayed correlation
```

**AIOps integrated model**:

```
GuardDuty Extended Threat Detection (security anomalies)
            ↓
CloudWatch Investigations (AI root cause analysis)
            ↓
Operational metrics (CPU, memory, network) + security event integrated analysis
            ↓
"CPU spike caused by cryptomining, not normal traffic" automatic determination
```

**Usage on EKS**:

```bash
# Enable GuardDuty Extended Threat Detection for EKS
aws guardduty create-detector \
  --enable \
  --features '[{"Name":"EKS_RUNTIME_MONITORING","Status":"ENABLED"}]'

# Forward detected threats to CloudWatch Events
aws events put-rule \
  --name guardduty-eks-threats \
  --event-pattern '{"source":["aws.guardduty"],"detail-type":["GuardDuty Finding"]}'
```

Once enabled, GuardDuty continuously monitors all workloads in the EKS cluster, and **AI automatically performs the first analysis stage**, significantly reducing the operations team's response time.

:::warning Security Observability = Operational Observability
Security anomalies (e.g., cryptomining) often manifest first as operational anomalies (e.g., CPU spikes, network traffic anomalies). When GuardDuty Extended Threat Detection is integrated with CloudWatch, the operations team can immediately get the answer "security threat" to the question "Why is this Pod's CPU at 100%?"
:::

**References**:
- [GuardDuty Extended Threat Detection for EKS Announcement](https://aws.amazon.com/blogs/aws/amazon-guardduty-expands-extended-threat-detection-coverage-to-amazon-eks-clusters/)
- [GuardDuty Extended Threat Detection for EC2/ECS](https://aws.amazon.com/about-aws/whats-new/2025/12/guardduty-extended-threat-detection-ec2-ecs/)

For detailed observability stack construction methods and stack selection patterns, refer to [2. Intelligent Observability Stack](./aiops-observability-stack.md).

---

## 8. AIOps Maturity Model

<AiopsMaturityModel />

### Maturity Level Transition Guide

#### Level 0 → Level 1 Transition (Fastest ROI)

You can establish an observability foundation just by adopting Managed Add-ons and AMP/AMG. Deploy ADOT and CloudWatch Observability Agent with the `aws eks create-addon` command, and build centralized dashboards with AMP/AMG.

```bash
# Level 1 start: Deploy core observability add-ons
aws eks create-addon --cluster-name my-cluster --addon-name adot
aws eks create-addon --cluster-name my-cluster --addon-name amazon-cloudwatch-observability
aws eks create-addon --cluster-name my-cluster --addon-name eks-node-monitoring-agent
```

#### Level 1 → Level 2 Transition (Automation Foundation)

Introduce GitOps with Managed Argo CD, and declaratively manage AWS resources as K8s CRDs with ACK. Configuring composite resources as single deployment units with KRO greatly improves infrastructure change consistency and traceability.

#### Level 2 → Level 3 Transition (Intelligent Analysis)

Enable CloudWatch AI and DevOps Guru to start ML-based anomaly detection and predictive analytics. Introduce AI root cause analysis with CloudWatch Investigations, and leverage natural language-based troubleshooting with Q Developer.

#### Level 3 → Level 4 Transition (Autonomous Operations)

Build a programmatic operations framework with Kiro + Hosted MCP, and deploy Kagent/Strands Agents to enable AI to autonomously handle incident response, deployment verification, and resource optimization.

:::warning Gradual Adoption Recommended
Do not attempt to leap from Level 0 to Level 4 all at once. It is more likely to succeed when you accumulate sufficient operational experience and data at each level before transitioning to the next. The **safety verification of AI autonomous recovery** is especially critical for the Level 3 → Level 4 transition.
:::

---

## 9. ROI Assessment

<RoiMetrics />

### ROI Assessment Framework

A framework for systematically evaluating the ROI of AIOps adoption.

#### Quantitative Metrics

<RoiQuantitativeMetrics />

#### Qualitative Metrics

- **Operations team satisfaction**: Reduced repetitive tasks, focus on strategic work
- **Deployment confidence**: Improved deployment quality through automated verification
- **Incident response quality**: Increased root cause resolution rate
- **Knowledge management**: AI Agents learn response patterns to accumulate organizational knowledge

### Cost Structure Considerations

<CostStructure />

### 9.1 AIOps ROI In-Depth Analysis Model

An in-depth analysis model for quantitatively and qualitatively evaluating the value of AIOps adoption. It goes beyond simple cost reduction to encompass improvements in organizational agility and innovation capabilities.

#### Quantitative ROI Calculation Formulas

**1. Incident Response Cost Reduction**

```
Annual savings from MTTR reduction = (Previous MTTR - New MTTR) × Annual incident count × Hourly response cost

Practical example:
- Previous MTTR: Average 2 hours
- MTTR after AIOps adoption: Average 20 minutes (0.33 hours)
- Annual P1/P2 incidents: 120
- Hourly response cost: $150 (operations team of 3 × $50/hour)

Savings = (2 - 0.33) × 120 × $150 = $30,060/year
```

**2. Business Loss Reduction from Outages**

```
Annual downtime loss reduction = (Previous annual downtime - New annual downtime) × Hourly revenue loss

Practical example:
- Previous annual downtime: 8 hours (MTTR 2 hours × 2 per month × 12 months ÷ 6 major incidents)
- After AIOps adoption: 1.3 hours (MTTR 20 minutes × same frequency)
- Hourly revenue loss: $50,000 (assuming e-commerce platform)

Loss reduction = (8 - 1.3) × $50,000 = $335,000/year
```

**3. Personnel Efficiency Gains from Operations Automation**

```
Operations team productivity improvement value = Saved repetitive task hours × Hourly labor cost × Strategic work value multiplier

Practical example:
- Automated repetitive tasks: 40 hours per week (4 people × 10 hours/week)
- Hourly labor cost: $50
- Strategic work value multiplier: 1.5x (strategic work is 50% more valuable than repetitive tasks)

Annual value = 40 × 52 × $50 × 1.5 = $156,000/year
```

**4. Infrastructure Cost Reduction from Predictive Scaling**

```
Annual infrastructure cost savings = Unnecessary over-provisioning cost - Cost after prediction-based optimization

Practical example:
- Previous: Always 3x over-provisioned for peak handling → $30,000/month
- AIOps predictive scaling: Auto scale-up 5 minutes before peak → average 1.2x provisioning → $12,000/month

Savings = ($30,000 - $12,000) × 12 = $216,000/year
```

**Comprehensive Quantitative ROI:**

| Item | Annual Savings/Value |
|------|---------------------|
| Incident response cost reduction | $30,060 |
| Downtime loss reduction | $335,000 |
| Operations team productivity improvement | $156,000 |
| Infrastructure cost reduction | $216,000 |
| **Total annual value** | **$737,060** |

**AIOps Adoption Costs:**

| Item | Annual Cost |
|------|------------|
| AWS managed services (AMP/AMG/DevOps Guru) | $50,000 |
| Bedrock Agent API call costs | $20,000 |
| Additional CloudWatch log/metric storage | $10,000 |
| Initial implementation consulting (one-time) | $30,000 |
| **Total annual cost** | **$110,000** |

**ROI Calculation:**

```
ROI = (Total annual value - Total annual cost) / Total annual cost × 100%
    = ($737,060 - $110,000) / $110,000 × 100%
    = 570%

Payback period = Total annual cost / Monthly average value
              = $110,000 / ($737,060 / 12)
              = 1.8 months
```

:::warning Cautions for ROI Calculation
The formulas above are examples assuming a **mid-sized organization (100-500 employees, $50M-$200M annual revenue)**. Actual ROI varies significantly based on:

- Organization size and incident frequency
- Actual impact of business downtime (e-commerce vs SaaS vs internal tools)
- Existing operational maturity (starting from Level 0 vs Level 2)
- Number and complexity of clusters

**Small startups** (&lt;50 employees) may have smaller absolute amounts but relatively higher ROI, while **large enterprises** (&gt;1000 employees) may see absolute amounts 10x or more larger.
:::

#### Qualitative Value: Reduced Team Burnout, Improved Developer Experience

Qualitative values that are difficult to measure with quantitative metrics but have a decisive impact on long-term organizational performance.

**1. Reduced Operations Team Burnout**

| Metric | Before AIOps | After AIOps | Improvement |
|--------|-------------|-------------|------------|
| **Night alert frequency** | Average 8 per week | Average 1 per week | 85% reduction via AI Agent auto-response |
| **Weekend emergency responses** | Average 4 per month | Average 0.5 per month | Preemptive action via predictive analytics |
| **Repetitive task ratio** | 60% of work hours | 15% of work hours | 45pp reduction via automation |
| **Operations team turnover rate** | 25% annually | 8% annually | Improved job satisfaction |
| **On-call stress score** | 7.8/10 (high) | 3.2/10 (low) | Significantly reduced stress via autonomous recovery |

**Business Impact:**
- Reduced operations expert turnover → Annual recruitment/training cost savings: $120,000 (assuming 40% of average salary)
- Prevention of productivity decline from burnout → Difficult to quantify but improves organizational health

**2. Developer Experience (DX) Improvement**

| Metric | Before AIOps | After AIOps | Improvement |
|--------|-------------|-------------|------------|
| **Deployment confidence** | 50% (high anxiety) | 90% (high trust) | Automated verification and rollback |
| **Failure root cause identification time** | Average 45 minutes | Average 5 minutes | AI root cause analysis |
| **Infrastructure inquiry response time** | Average 2 hours | Instant (Q Developer) | Self-service enabled |
| **Deployment frequency** | 2 per week | 3 per day | More frequent deployments due to improved safety |
| **Developer satisfaction** | 6.2/10 | 8.7/10 | Infrastructure complexity abstraction |

**Business Impact:**
- Increased deployment frequency → Faster feature delivery → Strengthened market competitiveness
- Developers focus on business logic instead of infrastructure debugging → Improved product quality

**3. Knowledge Management and Organizational Learning**

| Metric | Before AIOps | After AIOps | Improvement |
|--------|-------------|-------------|------------|
| **Incident response pattern documentation** | Manual, incomplete | AI Agent auto-learning | Knowledge loss prevention |
| **New operator onboarding period** | 3 months | 1 month | AI assistant provides real-time guidance |
| **Recurring failure rate** | 40% | 5% | Learned response patterns automatically applied |
| **Best practices adoption rate** | 30% | 85% | AI automatically applies them |

**Business Impact:**
- Organizational knowledge accumulates in the system → Reduced dependency on key personnel
- New team members achieve productivity quickly → Increased organizational scalability

**4. Innovation Capacity Improvement**

When the operations team is **freed from repetitive tasks** through AIOps adoption, they can focus on strategic work.

| Redirected Time Usage | Organizational Value |
|----------------------|---------------------|
| **New service experimentation** | 2x improvement in new feature delivery speed |
| **Architecture optimization** | 20% improvement in infrastructure efficiency |
| **Security hardening** | 70% reduction in vulnerability response time |
| **Cost optimization analysis** | 15% annual infrastructure cost reduction |
| **Team capability development** | Enhanced cloud-native expertise |

:::tip Actual Impact of Qualitative Value
Netflix's Chaos Engineering team invested 60% of the time saved through operations automation into improving system resilience, ultimately **improving annual uptime from 99.9% to 99.99%** ([Netflix case study](https://netflixtechblog.com/tagged/chaos-engineering)). This is a representative example of qualitative investment converting to quantitative results.
:::

#### Investment vs. Impact Analysis by Stage (Per Maturity Level)

Analyzing investment scale and expected impact for each level of the AIOps maturity model (Section 8).

##### Level 0 → Level 1 Transition

**Investment Items:**

| Item | Cost | Notes |
|------|------|-------|
| Managed Add-ons deployment (ADOT, CloudWatch Agent) | $0 | Add-ons themselves are free, only data collection costs |
| AMP/AMG initial configuration | $5,000 | Dashboard construction consulting |
| CloudWatch log/metric increase | $3,000/month | Observability data collection costs |
| **Total initial investment** | **$5,000 + $3,000/month** | |

**Expected Impact:**

| Impact | Measurement Metric | Expected Improvement |
|--------|-------------------|---------------------|
| **Observability visibility** | Metric coverage | 30% → 95% |
| **Incident detection time** | Failure awareness speed | Average 30 min → 5 min |
| **Dashboard construction time** | New service monitoring | 2 days → 2 hours (using AMG templates) |

**ROI:** Payback period approximately **3-4 months**. Eliminating blind spots from lack of observability is the core value.

##### Level 1 → Level 2 Transition

**Investment Items:**

| Item | Cost | Notes |
|------|------|-------|
| Managed Argo CD configuration | $2,000 | GitOps workflow construction |
| ACK + KRO adoption | $3,000 | IaC transition consulting |
| Converting existing manual deployments to IaC | $10,000 | Terraform/Pulumi migration |
| **Total initial investment** | **$15,000** | |

**Expected Impact:**

| Impact | Measurement Metric | Expected Improvement |
|--------|-------------------|---------------------|
| **Deployment time reduction** | Infrastructure change duration | Average 2 hours → 10 min |
| **Deployment error reduction** | Failures from config inconsistencies | 3 per month → 0.2 per month |
| **Rollback speed** | Recovery time on issues | Average 45 min → 5 min |

**ROI:** Payback period approximately **2-3 months**. Deployment automation drastically reduces human errors.

##### Level 2 → Level 3 Transition

**Investment Items:**

| Item | Cost | Notes |
|------|------|-------|
| CloudWatch AI + DevOps Guru activation | $8,000/month | ML anomaly detection service billing |
| Q Developer integration | $5,000 | Initial setup and MCP integration |
| Kiro + EKS MCP server construction | $15,000 | Spec-driven workflow construction |
| **Total initial investment** | **$20,000 + $8,000/month** | |

**Expected Impact:**

| Impact | Measurement Metric | Expected Improvement |
|--------|-------------------|---------------------|
| **Root cause analysis speed** | RCA duration | Average 2 hours → 10 min |
| **Prediction accuracy** | Pre-failure detection rate | 0% → 60% |
| **Incident response MTTR** | Average recovery time | 2 hours → 30 min |

**ROI:** Payback period approximately **4-6 months**. ML-based predictive analytics is the core value.

##### Level 3 → Level 4 Transition

**Investment Items:**

| Item | Cost | Notes |
|------|------|-------|
| Bedrock Agent construction | $25,000 | Autonomous operations Agent development |
| Strands/Kagent SOPs development | $20,000 | Auto-recovery scenario implementation |
| Bedrock Agent API call costs | $10,000/month | Production workload billing |
| Safety verification and testing | $15,000 | Thorough verification before production deployment |
| **Total initial investment** | **$60,000 + $10,000/month** | |

**Expected Impact:**

| Impact | Measurement Metric | Expected Improvement |
|--------|-------------------|---------------------|
| **Auto-recovery rate** | Agent autonomous resolution rate | 0% → 70% |
| **Incident response MTTR** | Average recovery time | 30 min → 5 min |
| **Night/weekend alerts** | On-call burden | 8 per week → 1 per week |

**ROI:** Payback period approximately **6-9 months**. Initial investment is large, but autonomous operations deliver the greatest long-term cost savings.

**Cumulative ROI Comparison by Level:**

| Maturity Level | Cumulative Initial Investment | Monthly Operating Cost | Annual Savings/Value | Payback Period |
|---------------|------------------------------|----------------------|---------------------|---------------|
| **Level 1** | $5,000 | $3,000 | $100,000 | 3-4 months |
| **Level 2** | $20,000 | $3,000 | $250,000 | 2-3 months (cumulative) |
| **Level 3** | $40,000 | $11,000 | $500,000 | 4-6 months (cumulative) |
| **Level 4** | $100,000 | $21,000 | $737,000 | 6-9 months (cumulative) |

:::info Gradual Investment Strategy
Level 0 → Level 1 can be started immediately with **fast ROI and low risk**. Level 2 → Level 3 should proceed after the organization has developed some automation capabilities, and Level 4 should be adopted **after sufficient data accumulation and safety verification**. We recommend accumulating at least 6 months of operational experience at each level before transitioning to the next stage.
:::

---

## 10. Conclusion

AIOps is an operational paradigm that maximizes the powerful capabilities and extensibility of the K8s platform with AI, while reducing operational complexity and accelerating innovation.

### Key Summary

1. **AWS Open Source Strategy**: Managed Add-ons + Managed Open Source (AMP/AMG/ADOT) → Eliminates operational complexity
2. **EKS Capabilities**: Managed Argo CD + ACK + KRO → Core components of declarative automation
3. **Kiro + Hosted MCP**: Spec-driven programmatic operations → Cost-effective and rapid response
4. **AI Agent Extension**: Q Developer (GA) + Strands (OSS) + Kagent (Early) → Gradual autonomous operations

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
