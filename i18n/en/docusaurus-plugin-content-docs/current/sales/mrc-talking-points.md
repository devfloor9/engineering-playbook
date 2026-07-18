---
title: MRC Talking Points - Modern Agentic Applications Day
description: MRC (Marketing Representative for Customers) sales pitch guide for customer invitations to the 2026-04-09 Modern Agentic Applications Day.
created: "2026-03-19"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 10
tags:
  - sales
  - gtm
  - agentic-ai
  - talking-points
  - scope:design
sidebar_label: MRC Talking Points
---

> **Core thesis**: "Enterprises that succeeded at digital transformation also do Agentic AI well."

---

## 1. 30-Second Elevator Pitch (for phone)

> AI agents are changing how enterprises work. But AI agents do not fall from the sky — they require robust cloud-native infrastructure as a foundation. **Serving LLMs with GPU Operator and vLLM on EKS and operating agents with Bedrock AgentCore and Hosted MCP** is the practical answer. At Modern Agentic Applications Day on April 9, see everything from cost optimization to AgentOps in a single day. **Limited to 200 attendees.**

---

## 2. Two-Minute Summary (for meeting openers)

In 2026, 80% of enterprises plan to adopt AI agents. But most companies overlook one fact — **AI agents are a combination of dozens of microservices (LLM serving, vector DB, gateway, monitoring)**. Production operation is impossible without container orchestration.

AWS addresses this challenge on two tracks:

1. **Modern Agentic Infra**: EKS is the managed Kubernetes that fully supports LLMOps. With GPU Operator and run.ai you manage GPU resources efficiently, and with vLLM + llm-d you serve your own LLMs. Combining MIG partitioning with Karpenter autoscaling **achieves cost optimization and operational stability at the same time**. With Hybrid Nodes, on-premises is also unified under EKS, operable at about $4,900/month at 50 req/s.

2. **Modern Agentic Apps**: A rich managed-agent ecosystem from AWS is available. **Bedrock AgentCore** operates the agent runtime as a managed service, **Hosted MCP servers** standardize agent-to-tool integration, and managed agents such as **DevOps Agent** automate infrastructure operations. Migrating 15+ self-hosted Pods to managed services reduces operational complexity by 80%.

At **Modern Agentic Applications Day on April 9**, see both tracks' deep-dive sessions and real-world build cases in a single day. After the event, **Modern Agentic Infra / Modern Agentic Apps** PoCs across two tracks can start immediately. Capacity is capped at 200, so early registration is recommended.

---

## 3. Industry-Specific Hooks

### E-commerce

- AI recommendation agents deliver real-time per-customer personalization → **35% conversion uplift** case
- GPU MIG + Semantic Caching operates at the level of **$4,900/month** at 50 req/s
- For companies that have completed digital transformation (containers), AI transformation is the natural next step

### Financial Services (FSI)

- Data sovereignty and regulatory compliance are key — **Hybrid Nodes** protect on-premises data while leveraging the EKS AI platform
- Build real-time fraud detection agents, achieving **99.2% detection accuracy**
- Safe AI operations even in financial regulatory environments — Pod Identity, encryption, and audit logs fully in place

### Gaming

- **AI NPC agents** deliver real-time conversational experiences — 2.5× increase in playtime
- vLLM + llm-d delivers low-latency inference serving (TTFT shortened by 40%)
- Stable operation even at millions of concurrent users via **Karpenter autoscaling**

### Manufacturing

- Vision AI quality inspection agents — **90% defect-rate reduction** case
- GPU MIG partitions one GPU across 7 workloads → **75% cost savings**
- Unified EKS management even at the factory edge via **Hybrid Nodes**

### Telco

- Network optimization AI agents deliver **50% operational efficiency uplift**
- Hybrid Nodes are optimal for edge AI workloads — essential infrastructure for the 5G/6G era
- Build a unified AI platform spanning core network to edge with EKS

---

## 4. Anticipated Questions & Answers

### Q1. What's different between AI agents and existing chatbots?

Chatbots handle only predefined rules or simple Q&A. **AI agents autonomously use tools, make decisions, and execute multi-step tasks.** For example, given "create this month's sales report," they autonomously perform data lookup → analysis → visualization → report generation.

### Q2. We haven't even adopted containers yet.

The Modern Agentic Infra track is exactly that starting point. **EKS-based container migration is the first step toward AI-ready infrastructure**, and Hybrid Nodes unify on-premises and cloud management. The event covers a phased migration roadmap in detail.

### Q3. GPUs are expensive — AI adoption is a financial burden.

That is exactly why GPU optimization is critical. On EKS, **GPU Operator + run.ai** precisely allocate GPUs at the workload level, and **MIG partitioning** divides a single GPU into up to 7 partitions, enabling **75% cost savings**. Adding Semantic Caching and Karpenter autoscaling reduces costs further.

### Q4. Isn't it enough to use only Bedrock?

Bedrock is a good starting point, but if you need **self-hosted model serving (vLLM), custom agent logic, or hybrid composition**, an EKS-based platform is essential. AWS's strength is the ability to combine the two — operate the agent runtime as a managed service via **AgentCore**, connect first-party tools via **Hosted MCP servers**, and serve required models directly on vLLM atop EKS.

### Q5. What are AWS's advantages over GCP/Azure?

GCP and Azure offer similar services. AWS's differentiator is that **the full LLMOps stack is integrated on EKS**. GPU Operator, run.ai, vLLM, and Karpenter compose the **model-serving infrastructure**, and AgentCore + Hosted MCP + DevOps Agent automate **agent operations**. EKS is also the only one to offer a 99.99% SLA dedicated control plane (PCP).

### Q6. What can I get from the event?

You can see **practical guides on AI infrastructure architecture and agent applications** all in one day. Capacity is 200, so CTO/VP-level networking opportunities are also provided. Two tracks are ready to start a PoC immediately after the event.

### Q7. How does the PoC proceed?

Two tracks are prepared:
- **Modern Agentic Infra**: EKS + GPU Operator + vLLM PoC → 2-week PoC → production roadmap
- **Modern Agentic Apps**: Bedrock AgentCore + Hosted MCP PoC → agent build and ops automation

Event attendees receive PoC priority.

### Q8. How are security and regulatory concerns addressed?

**EKS Pod Identity** for fine-grained access control, **Hybrid Nodes** for data sovereignty, and Private Subnets + VPC isolation for network security. Build cases under financial/healthcare regulatory environments are shared at the event.

### Q9. We already have a Kubernetes cluster — can we add AI workloads?

Yes. **Migrating to EKS Auto Mode enables automatic GPU node provisioning**, and existing workloads and AI workloads can coexist on the same cluster. Karpenter automatically allocates GPU instances suited to AI workloads.

### Q10. Who is the event audience?

The primary audience is **CTOs, VPs of Engineering, platform engineering leaders, and IT decision makers**. It is most suitable for technical decision makers shaping an AI strategy or in the midst of digital transformation. The covered industries focus on E-commerce, FSI, Gaming, Manufacturing, and Telco.

---

## 5. Competitive Differentiation

| Comparison Item | AWS (EKS) | GCP (GKE) | Azure (AKS) |
|-----------|-----------|-----------|-------------|
| **Control plane** | PCP dedicated (99.99% SLA) | Shared (99.95% SLA) | Shared (99.95% SLA) |
| **Data-plane automation** | Auto Mode + Karpenter | Autopilot + NAP | NAP (Node Auto-provisioning) |
| **AI agent runtime** | AgentCore (MCP-native) | Vertex AI Agent Builder | Azure AI Agent Service |
| **GPU optimization** | Karpenter + MIG/DRA (Karpenter v1.14+ supports DRA) | MIG support + GKE NAP | MIG support |
| **AI-dedicated chips** | Inferentia2, Trainium | TPU v5e/v5p | Maia 100 (limited) |
| **Migration** | Transform (K8s integrated) | Migrate to Containers | Azure Migrate |
| **GPU instances** | H100, L40S, Inferentia2, Trainium | H100, A100, L4, L40S | H100, A100, MI300X |

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
Event attendees receive **PoC priority allocation** and **dedicated AWS SA support**.
:::

---

## 7. Event Summary

| Item | Details |
|------|------|
| **Event** | Modern Agentic Applications Day |
| **Date** | April 9, 2026 (Wed) |
| **Venue** | Centerfield 18F |
| **Capacity** | Limited to 200 |
| **Audience** | CTOs, VPs of Engineering, platform engineering leaders, IT decision makers |
| **Key sessions** | Modern Agentic Infra / Modern Agentic Apps |
| **Follow-up program** | 2 PoC tracks (Agentic Infra / Agentic Apps) |

:::tip Points to emphasize on invitation
- "If you're curious about the next step after digital transformation"
- "If AI infrastructure cost is a concern — we share a case of 75% GPU savings"
- "Capacity is limited to 200, so early registration is recommended"
- "PoCs can start immediately after the event"
:::
