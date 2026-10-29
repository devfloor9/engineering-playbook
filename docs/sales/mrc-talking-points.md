---
title: MRC Talking Points - Modern Agentic Applications Day
description: MRC (Marketing Representative for Customers) sales pitch guide for customer invitations to the 2026-04-09 Modern Agentic Applications Day.
created: "2026-03-19"
last_update:
  date: 2026-10-29
  author: YoungJoon Jeong
reading_time: 23
tags:
  - sales
  - gtm
  - agentic-ai
  - talking-points
  - scope:design
sidebar_label: MRC Talking Points
---

> **Core thesis**: "Enterprises that succeeded at digital transformation also do Agentic AI well."

:::note
This document is an archived copy of the invitation and speaking script for the Modern Agentic Applications Day held on April 9, 2026. It was written against that event's operating details and does not advertise current registration or remaining seats.
:::

---

## 1. 30-Second Elevator Pitch (for phone)

> An agent application needs a way to run or access models, call tools, and observe its behavior. Modern Agentic Applications Day on April 9 covers **LLM serving with GPU Operator and vLLM on EKS**, alongside **managed agent operation with Bedrock AgentCore and Hosted MCP**. The sessions address cost optimization and AgentOps across these approaches. **Capacity was 200 attendees.**

---

## 2. Two-Minute Summary (for meeting openers)

Recently, many enterprises plan to adopt AI agents. But most companies overlook one fact — **AI agents are a combination of dozens of microservices (LLM serving, vector DB, gateway, monitoring)**. Deploying and operating these services together makes container orchestration an important foundation.

AWS addresses this challenge on two tracks:

1. **Modern Agentic Infra**: EKS is the managed Kubernetes that fully supports LLMOps. With GPU Operator and run.ai you manage GPU resources efficiently, and with vLLM + llm-d you serve your own LLMs. Combining MIG partitioning with Karpenter autoscaling **achieves cost optimization and operational stability at the same time**. With Hybrid Nodes, on-premises is also unified under EKS. The operating cost of about $4,900/month at 50 req/s is an illustrative figure (a hypothetical scenario, not measured data, with no defined Region, period, model, token lengths, GPU/MIG configuration, cache assumptions, SLO, or comparison baseline).

2. **Modern Agentic Apps**: A managed-agent ecosystem from AWS is available. **Bedrock AgentCore** runs and scales the agent runtime as a managed service, **Hosted MCP servers** standardize agent-to-tool integration, and managed agents such as **DevOps Agent** assist with infrastructure operations tasks. The customer still owns model choice, permissions, application code, evaluation, and operations, and managed agents both take actions directly and recommend actions. Moving self-hosted Pods to managed services reduces the components you operate yourself (the reduction depends on migration scope).

At **Modern Agentic Applications Day on April 9**, attendees could see both tracks' deep-dive sessions and real-world build cases in a single day. After the event, **Modern Agentic Infra / Modern Agentic Apps** PoCs across two tracks were set up to follow on. Capacity was 200.

---

## 3. Industry-Specific Hooks

The customer outcome figures in this section (conversion rate, detection accuracy, playtime, defect rate, cost-savings rate, operational efficiency, monthly cost) are illustrative figures for which no publishable original customer measurement was found, including the items phrased as a "case" or as "achieving" a result (primary source not verified as of 2026-10-29). Present them to customers as example targets to validate in a PoC, not as achieved results.

### E-commerce

- AI recommendation agents deliver real-time per-customer personalization → **35% conversion uplift** example (not a measured customer case)
- GPU MIG + Semantic Caching operating at the level of **$4,900/month** at 50 req/s is an example (a hypothetical scenario with no defined Region, model, GPU configuration, or cache hit-rate assumptions, not measured data)
- For companies that have completed digital transformation (containers), AI transformation is the natural next step

### Financial Services (FSI)

- Data sovereignty and regulatory compliance are key — **Hybrid Nodes** protect on-premises data while leveraging the EKS AI platform
- Build real-time fraud detection agents → **99.2% detection accuracy** example (not a measured customer case)
- Safe AI operations even in financial regulatory environments — Pod Identity, encryption, and audit logs fully in place

### Gaming

- **AI NPC agents** deliver real-time conversational experiences — 2.5× increase in playtime
- vLLM + llm-d delivers low-latency inference serving. The 40% TTFT reduction is an external report: the llm-d project blog (2026-03-13, written by Google engineers) reports that predicted-latency based scheduling on Google Vertex AI production clusters reduced TTFT and ITL by "up to 40%"; it is not a value measured on an EKS gaming workload
- **Karpenter autoscaling** adds and removes nodes as concurrent users change (no EKS load test validating millions of concurrent users has been verified)

### Manufacturing

- Vision AI quality inspection agents → **90% defect-rate reduction** example (not a measured customer case)
- GPU MIG partitions one GPU across 7 workloads → **75% cost savings**
- Unified EKS management even at the factory edge via **Hybrid Nodes**

### Telco

- Network optimization AI agents deliver **50% operational efficiency uplift**
- Hybrid Nodes are optimal for edge AI workloads — essential infrastructure for the 5G/6G era
- Build a unified AI platform spanning core network to edge with EKS

---

## 4. Anticipated Questions & Answers

### Q1. What's different between AI agents and existing chatbots?

A rule-based chatbot handles predefined rules or simple Q&A (LLM-based conversational systems can respond more broadly). **AI agents go further — they autonomously use tools, make decisions, and execute multi-step tasks.** For example, given "create this month's sales report," they autonomously perform data lookup → analysis → visualization → report generation.

### Q2. We haven't even adopted containers yet.

The Modern Agentic Infra track is exactly that starting point. **EKS-based container migration is the first step toward AI-ready infrastructure**, and Hybrid Nodes unify on-premises and cloud management. The event covers a phased migration roadmap in detail.

### Q3. GPUs are expensive — AI adoption is a financial burden.

That is exactly why GPU optimization is critical. On EKS, **GPU Operator + run.ai** precisely allocate GPUs at the workload level, and **MIG partitioning** divides a single GPU into up to 7 partitions, which lowers GPU cost (the **75% cost savings** figure is an illustrative figure; primary source not verified as of 2026-10-29. The actual saving depends on the workload's GPU utilization and the MIG profile configuration). Adding Semantic Caching and Karpenter autoscaling reduces costs further.

### Q4. Isn't it enough to use only Bedrock?

Bedrock is a good starting point. If you need **self-hosted model serving (vLLM), custom agent logic, or hybrid composition**, or GPU-resource control or integration with an existing Kubernetes operation, an EKS-based platform is advantageous. Depending on your requirements, Bedrock on its own or another execution environment may also be a good fit. AWS's strength is the ability to combine the two — operate the agent runtime as a managed service via **AgentCore**, connect first-party tools via **Hosted MCP servers**, and serve required models directly on vLLM atop EKS.

### Q5. What are AWS's advantages over GCP/Azure?

GCP and Azure offer similar services. AWS's differentiator is that **the full LLMOps stack is integrated on EKS**. GPU Operator, run.ai, vLLM, and Karpenter compose the **model-serving infrastructure**, and AgentCore + Hosted MCP + DevOps Agent automate **agent operations**. EKS also offers a 99.99% SLA on the Provisioned Control Plane (PCP), higher than the 99.95% SLA on the standard control plane.

### Q6. What can I get from the event?

The event presented **practical guides on AI infrastructure architecture and agent applications** in a single day. It was run with a capacity of 200, which also provided CTO/VP-level networking opportunities. Two tracks were prepared so that a PoC could continue after the event.

### Q7. How does the PoC proceed?

Two tracks are prepared:
- **Modern Agentic Infra**: EKS + GPU Operator + vLLM PoC → 2-week PoC → production roadmap
- **Modern Agentic Apps**: Bedrock AgentCore + Hosted MCP PoC → agent build and ops automation

Event attendees are given priority notice for PoC participation; whether a PoC proceeds depends on eligibility, SA availability, and internal approval.

### Q8. How are security and regulatory concerns addressed?

**EKS Pod Identity** for fine-grained access control, **Hybrid Nodes** to place workloads and data on-premises, and Private Subnets + VPC isolation for network security. Whether data sovereignty or regulatory compliance is met depends on reviewing each customer's data flows and applicable regulations. Build cases under financial/healthcare regulatory environments are shared at the event.

### Q9. We already have a Kubernetes cluster — can we add AI workloads?

Yes. **Migrating to EKS Auto Mode enables automatic GPU node provisioning**, and existing workloads and AI workloads can coexist on the same cluster. Karpenter automatically allocates GPU instances suited to AI workloads.

### Q10. Who is the event audience?

The primary audience is **CTOs, VPs of Engineering, platform engineering leaders, and IT decision makers**. It is most suitable for technical decision makers shaping an AI strategy or in the midst of digital transformation. The covered industries focus on E-commerce, FSI, Gaming, Manufacturing, and Telco.

---

## 5. Competitive Differentiation

| Comparison Item | AWS (EKS) | GCP (GKE) | Azure (AKS) |
|-----------|-----------|-----------|-------------|
| **Control plane** | Provisioned Control Plane (99.99% SLA) | Shared (99.95% SLA) | Shared (99.95% SLA) |
| **Data-plane automation** | Auto Mode + Karpenter | Autopilot + NAP | NAP (Node Auto-provisioning) |
| **AI agent runtime** | AgentCore (MCP-native) | Vertex AI Agent Builder | Azure AI Agent Service |
| **GPU optimization** | Karpenter + MIG, DRA (Karpenter v1.14+, on managed node groups/self-managed nodes, not Auto Mode, requires Kubernetes 1.34+) | MIG support + GKE NAP | MIG support |
| **AI-dedicated chips** | Inferentia2, Trainium | TPU v5e/v5p | Maia 100 (limited) |
| **Migration** | Transform (K8s integrated) | Migrate to Containers | Azure Migrate |
| **Accelerator instances (examples)** | GPUs: H100, L40S / purpose-built accelerators: Inferentia2, Trainium | H100, A100, L4, L40S | H100, A100, MI300X |

:::tip Core differentiating message
GCP and Azure offer similar services, but AWS differentiates with **a fully integrated LLMOps stack on EKS (GPU Operator, run.ai, vLLM, Karpenter)** and with **a managed-agent ecosystem (AgentCore + Hosted MCP + DevOps Agent)**.
:::

---

## 6. Follow-Up Pipeline

### Track 1: Modern Agentic Infra (EKS + GPU + LLMOps)

| Stage | Content | Duration |
|------|------|------|
| Assessment | Analyze current infrastructure + define AI workload requirements | 1 week |
| PoC | Compose EKS + GPU Operator + run.ai + vLLM + Hybrid Nodes | 2 weeks |
| Production roadmap | Design production architecture + cost-optimization plan | 1 week |

### Track 2: Modern Agentic Apps (AgentCore + MCP + agent development)

| Stage | Content | Duration |
|------|------|------|
| Agent design | Define use cases + design agent architecture | 1 week |
| PoC | AgentCore + Hosted MCP server integration + agent build | 2 weeks |
| Operations automation | DevOps Agent integration, monitoring, CI/CD setup | 1 week |

:::info Event-attendee benefits
Event attendees may be offered **PoC priority notice** and **AWS SA support**. Actual allocation and support scope depend on eligibility, staffing availability, and internal approval, and in each track the 2-week PoC is one stage of the 4-week overall track. This process does not guarantee production readiness.
:::

---

## 7. Event Summary

| Item | Details |
|------|------|
| **Event** | Modern Agentic Applications Day |
| **Date** | April 9, 2026 (Thu) |
| **Venue** | Centerfield 18F |
| **Capacity** | 200 (capacity operated) |
| **Audience** | CTOs, VPs of Engineering, platform engineering leaders, IT decision makers |
| **Key sessions** | Modern Agentic Infra / Modern Agentic Apps |
| **Follow-up program** | 2 PoC tracks (Agentic Infra / Agentic Apps) |

:::tip Points to emphasize on invitation
- "If you're curious about the next step after digital transformation"
- "If AI infrastructure cost is a concern — we share how MIG partitioning lowers GPU cost" (the 75% saving is an illustrative figure, not a measured customer case, so do not call it a "case")
- "The event was operated at a capacity of 200"
- "The event leads into follow-on PoC tracks"
:::
