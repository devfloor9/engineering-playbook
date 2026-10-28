---
title: Cost Effectiveness Framework
description: Quantifying AIDLC Cost Effectiveness — RFP Estimation Model, Ontology/Harness ROI, Open Weight TCO Comparison
created: "2026-04-07"
last_update:
  date: 2026-10-29
  author: devfloor9
reading_time: 46
tags:
  - aidlc
  - enterprise
  - agentic-ai
  - scope:enterprise
sidebar_label: Cost Effectiveness Framework
---

import { ProductivityMetrics, DetailedMetrics } from '@site/src/components/AidlcTables';

Adopting AIDLC changes both the development workflow and its costs. Estimates need to account for AI tools, ontology design, harness engineering, training, and output verification alongside any reduction in implementation effort. Without measured effort and quality data, those changes are difficult to justify in a request for proposal (RFP), a return-on-investment (ROI) calculation, or a budget request. This chapter explains how to build that estimate.

## 1. RFP Cost Estimation Dilemma

### 1.1 Fixed-Price Bidding Market Reality

The Korean SI market is dominated by fixed-price bidding. Issuers present detailed RFPs, and bidders submit fixed amounts. Post-contract cost overrun risk is borne entirely by bidders.

**Traditional Estimation Formula**:

```
Total Cost = Σ(MM by Role × Monthly Rate)
         + Infrastructure Cost
         + Risk Buffer (10-20%)
```

Here MM (man-months) already includes the duration of involvement, so the monthly rate is not multiplied by duration again.

Problems arising with AIDLC adoption:

1. **How to quantify AI productivity?**
   - The fact that "AI generates code" alone cannot justify MM reduction
   - Issuers expect "AI = automatic cost reduction", but bidders estimate conservatively due to lack of actual data

2. **Additional cost items emerge**:
   - Ontology design: Initial 2-4 weeks
   - Harness engineering: Continuous effort
   - AI tool licensing: Claude Team ($30/user/month), LiteLLM Pro, etc.
   - Training: 1-2 weeks for developer AIDLC transition training

3. **Increased risk**:
   - AI output quality variability
   - Harness integration complexity in legacy environments
   - Organizational transition resistance

As a result, many bidders **cannot reflect AIDLC cost savings in proposals** and revert to traditional estimation methods.

### 1.2 Cost Reduction vs Quality Improvement Trade-off

AIDLC provides two types of value:

- **Cost Reduction**: Complete same scope with less effort
- **Quality Improvement**: Achieve higher quality/scope with same effort

In fixed-price bidding, cost reduction leads to bidder margin increase, but issuers prefer quality improvement. Proposals must clearly present this balance.

**Example: ₩5B Project**

**Table 1. Proposal, effort, margin, and issuer value by AIDLC scenario for a ₩5B project**

| Scenario | Approach | Proposal | Actual Effort | Bidder Margin | Issuer Value |
|---------|----------|--------|----------|-------------|------------|
| Traditional Method | No AIDLC | ₩5B | ₩4B | ₩1B (20%) | Meet basic requirements |
| Emphasize Cost Reduction | Apply AIDLC | ₩4B (-20%) | ₩3.2B | ₩0.8B (20%) | Meet basic requirements |
| Emphasize Quality Improvement | Apply AIDLC | ₩5B | ₩3.5B | ₩1.5B (30%) | High quality + additional features |
| Balance | Apply AIDLC | ₩4.5B (-10%) | ₩3.3B | ₩1.2B (27%) | Basic + partial high quality |

In most cases, the **balance scenario** is most realistic. Issuers realize cost reduction while receiving quality improvement guarantees.

---

## 2. AIDLC Cost Model Framework

### 2.1 Phase-by-Phase Cost Reduction Structure

AIDLC produces differentiated effects across the official three phases (Inception, Construction, Operations). The effort and savings figures below are illustrative scenario assumptions for explanation, not measured results from a specific customer.

#### Inception Phase

**Traditional Method**:
- Requirements analysis: 4 weeks
- Domain modeling: 2 weeks
- Architecture design: 3 weeks
- Total **9 weeks**

**AIDLC Method**:
- AI requirements analysis: 1 week (AI auto-decomposes Intent → Unit)
- Ontology engineering: 2 weeks (Formalize domain model as ontology)
- Architecture design: 2 weeks (AI proposes reference architecture)
- Total **5 weeks (-44%)**

**Cost Reduction Mechanism**:
- AI auto-detects requirements ambiguity and generates clarification questions
- Ontology structures domain knowledge for repeated reuse
- AI immediately proposes reference architecture patterns

#### Construction Phase

This phase concentrates 60-70% of project costs. It's AIDLC's core value delivery point.

##### Prototype and architecture verification (formerly Elaboration) {#elaboration-phase}

The prototype development and architecture verification that traditional methods separate into an Elaboration phase also belong here. AIDLC has AI rapidly generate prototypes and automatically verify domain accuracy based on ontology.

**Traditional Method**:
- Developers write specification → code → unit test → review → fix
- Feedback loop: Daily basis
- Code generation speed: 100 LOC/day

**AIDLC Method**:
- AI auto-generates code based on ontology
- Harness provides runtime verification and immediate feedback
- Feedback loop: Minute basis
- Code generation speed: 500 LOC/day (+400%)

**Cost Reduction**: Approximately 40-60%

**Cautions**:
- Harness overhead increases in legacy environment integration
- AI-generated code quality varies for complex business logic
- Review effort decreases, but ontology accuracy verification effort added

#### Operations Phase {#transition-operations-phase}

**Traditional Method**:
- Manual deployment checklist
- Manual alert monitoring
- Manual diagnosis and recovery on failures

**AIDLC Method**:
- GitOps automatic deployment (Argo CD)
- AI Agent autonomous incident response
- 73% MTTR reduction (45min → 12min)

**Cost Reduction**: Approximately 50-70% (operations personnel optimization)

### 2.2 Cost Increase Factors

AIDLC adoption doesn't always bring cost reduction only. The following factors increase costs:

#### Initial Investment

Dollar-denominated costs are converted at ₩1,350/$ (illustrative rate as of 2026-10-15).

**Table 2. AIDLC adoption initial investment items by scale and cost**

| Item | Scale | Cost |
|------|------|------|
| Ontology design | 2-4 weeks (1 architect + 0.5 domain expert) | ₩50-100M |
| Initial harness engineering setup | 1-2 weeks (2 DevOps) | ₩20-40M |
| AIDLC training | 10 developers × 1 week | ₩30M |
| AI tool licensing (first 3 months) | Claude Team 10 people × $30/month × 3 months = $900 | ≈₩1.2M |
| **Total** | | **≈₩101-171M** |

For medium projects (₩2B), initial investment ratio is approximately **5.1-8.6%**. This cost is concentrated during the first Bolt cycle (2-4 weeks), after which savings accumulate.

#### Ongoing Costs

- AI tool licensing: ₩3M/month (10 developers basis)
- Ontology maintenance: 4 hours/week (0.1 MM architect)
- Harness operations: 8 hours/week (0.2 MM DevOps)

For 6-month projects, ongoing costs add approximately **₩70-100M**.

#### Break-Even Point

Point where initial investment + ongoing costs are offset by savings:

```
Small Projects (<₩1B): 2-3 months later
Medium Projects (₩1-5B): 1-2 months later
Large Projects (₩5B+): 1 month later
```

Break-even point comes faster with larger projects. This is because AIDLC produces **greater effects on large-scale repetitive work**.

---

## 3. Expected Benefits by Project Scale

### 3.1 Small Project (Under ₩1B)

**Table 3. Traditional vs AIDLC cost and savings rate for a small project**

| Item | Traditional Cost | AIDLC Cost | Savings Rate |
|------|------------|-----------|--------|
| Total MM | 50 MM | 40 MM | 20% |
| Total Cost | ₩800M | ₩650M | 18.75% |
| Initial Investment | 0 | ₩120M | +₩120M |
| Net Savings | - | ₩30M | **3.75%** |

**Characteristics**:
- Initial investment weight is high, limiting savings effect
- Inception phase compression effect largest (requirements analysis time reduction)
- Harness setup overhead relatively high

**Recommendations**:
- Design ontology lightweight (focus on core entities)
- Implement harness essential validation only
- Reuse existing reference architecture

### 3.2 Medium Project (₩1-5B)

**Table 4. Traditional vs AIDLC cost and savings rate for a medium project**

| Item | Traditional Cost | AIDLC Cost | Savings Rate |
|------|------------|-----------|--------|
| Total MM | 250 MM | 175 MM | 30% |
| Total Cost | ₩4B | ₩2.8B | 30% |
| Initial Investment | 0 | ₩150M | +₩150M |
| Net Savings | - | ₩1.05B | **26.25%** |

**Characteristics**:
- Construction phase acceleration effect materializes
- Ontology reuse effect accumulates
- Harness investment vs ROI clear

**Recommendations**:
- Design ontology systematically (cover entire domain)
- Expand harness progressively (core → entire)
- Actively adopt AI review automation

### 3.3 Large Project (₩5B+)

**Table 5. Traditional vs AIDLC cost and savings rate for a large project**

| Item | Traditional Cost | AIDLC Cost | Savings Rate |
|------|------------|-----------|--------|
| Total MM | 600 MM | 400 MM | 33.3% |
| Total Cost | ₩10B | ₩6.5B | 35% |
| Initial Investment | 0 | ₩200M | +₩200M |
| Ongoing Cost | 0 | ₩150M | +₩150M |
| Net Savings | - | ₩3.15B | **31.5%** |

**Characteristics**:
- Operations automation effect accumulates (long-term operations cost reduction)
- Ontology consistency effect maximized in multi-team parallel development
- Service-to-service harness integration effect in MSA environment

**Recommendations**:
- Expand ontology to enterprise level
- Integrate harness with service mesh
- Actively adopt AI Agent autonomous operations

### 3.4 Complex Program (₩10B+)

Complex programs with multiple bundled projects achieve additional effects through **ontology reuse** and **harness platformization**.

**Example: Bank Next-Gen System (₩30B, 3 years)**

**Table 6. Traditional vs AIDLC cost and savings rate by phase for the bank next-gen system**

| Phase | Traditional Cost | AIDLC Cost | Savings Rate |
|------|------------|-----------|--------|
| Phase 1 (Accounting) | ₩10B | ₩6.8B (-32%) | 32% |
| Phase 2 (Loans) | ₩10B | ₩6.0B (-40%) | 40% |
| Phase 3 (Deposits) | ₩10B | ₩5.5B (-45%) | 45% |
| **Total** | ₩30B | ₩18.3B | **39%** |

Savings rate increases as phases progress due to:
- Ontology accumulates, increasing reuse rate
- Harness becomes platformized, reducing setup time
- Team AIDLC proficiency improves

---

## 4. Ontology ROI

Ontology is AIDLC's core investment item. Quantifying initial investment vs long-term effects.

### 4.1 Initial Investment

**Table 7. Ontology initial investment activities by effort and cost**

| Activity | Effort | Cost (₩10M/month basis) |
|------|------|------------------------|
| Domain analysis | 1 week (1 architect) | ₩2.5M |
| Entity/relationship modeling | 1 week (1 architect) | ₩2.5M |
| Define validation rules | 1 week (0.5 architect + 0.5 domain expert) | ₩2.5M |
| Ontology documentation | 1 week (1 technical writer) | ₩2M |
| **Total** | **4 weeks** | **₩9.5M** |

For medium projects (₩2B), this is **0.475%** initial investment.

### 4.2 Long-Term Effects

A figure of **87% accuracy vs 62%** for domain-specific AI versus general AI is cited with McKinsey research "The economic potential of generative AI" (2023) as its source, but the figure could not be traced in that report (primary source not verified as of 2026-10-29). Ontology is the mechanism that transforms AI to domain-specific.

#### Error Rate Reduction

Illustrative figures (a hypothetical scenario, not measured data) used to explain the importance of the feedback loop emphasized in Hamel Husain, "A Field Guide to Rapidly Improving AI Products" (2025):

**Table 8. Error rate, total cost, and improvement by feedback loop and ontology condition**

| Condition | Error Rate (Day 31) | Total Cost | Improvement |
|------|----------------|---------|--------|
| No Feedback Loop (Baseline) | 8.3% | $25K | - |
| Feedback Loop (AI only) | 7.9% | $28K | 5% improvement |
| Feedback Loop + Ontology | **1.2%** | $30K | **85.5% improvement** |

In the illustrative figures above, with ontology, AI self-corrects in domain context, reducing error rate **7x**.

**Project Conversion** (an example calculation applying the illustrative figures above, not a measured result):
- Medium project defect fix cost: assumed to be ₩300M (7.5% of total cost)
- 85% error reduction with ontology: **₩255M savings**
- ROI vs ₩9.5M ontology initial investment: **2,584%**

#### Review Effort Savings

When AI generates domain-accurate code based on ontology, reviewers focus on business logic verification.

**Table 9. Review time and savings rate by review item with and without ontology**

| Review Item | Without Ontology | With Ontology | Savings Rate |
|----------|--------------|--------------|--------|
| Domain consistency verification | 30 min | 5 min | 83% |
| Coding convention verification | 15 min | 3 min | 80% |
| Security/performance verification | 20 min | 15 min | 25% |
| Business logic verification | 30 min | 30 min | 0% |
| **Total** | **95 min** | **53 min** | **44%** |

For medium projects with 500 PRs:
- Traditional review time: 500 × 95min = 791 hours = 4.4 MM
- AIDLC review time: 500 × 53min = 442 hours = 2.5 MM
- Savings: **1.9 MM (approximately ₩30M)**

### 4.3 Ontology Maintenance Costs

Ontology is not static. Continuous updates needed as requirements change.

MM (man-months) is converted at a uniform 1 MM = 160 hours (20 days/month × 8 hours).

**Table 10. Ontology maintenance activities by frequency and monthly effort**

| Activity | Frequency | Effort/time | Monthly Effort |
|------|------|---------|---------|
| Add new entities | Weekly | 2 hours | 8 hours |
| Modify relationships | Bi-weekly | 1 hour | 2 hours |
| Add validation rules | Bi-weekly | 1 hour | 2 hours |
| **Total** | | | **12 hours/month (0.075 MM)** |

6-month project maintenance cost: 72 hours = **0.45 MM (approximately ₩4.5M)**

**Net ROI Calculation**:
- Initial investment: ₩9.5M
- Maintenance (6 months): ₩4.5M
- Total investment: **₩14M**
- Effect (error savings + review savings): ₩255M + ₩30M = **₩285M**
- **Net ROI: 1,936%**

---

## 5. Harness ROI

Harness automates feedback loop between AI and operating environment. Without harness, runtime errors accumulate and can derail projects.

### 5.1 Cost of Harness Absence: Fintech Runaway Case

An illustrative scenario (not a documented real case) for the lack-of-feedback-loop problem discussed in Hamel Husain, "A Field Guide to Rapidly Improving AI Products" (2025):

**Scenario**: AI Agent develops email reminder feature for fintech app

**Developing without harness**:
- AI generates code → Manual test → Deploy
- Runtime error occurs → AI checks error log → Fix → Redeploy
- Slow feedback loop causes AI to **repeat same mistakes**

**Result**:
- API calls: 847 times (7x normal)
- LLM cost: **$2,200** (normal $300)
- Generated emails: 14 (all incomplete)
- Project failure

**After harness introduction**:
- Harness provides immediate feedback of runtime errors to AI
- API calls: 123 times
- LLM cost: **$320**
- Generated emails: 50 (all normal)
- Project success

**Cost Savings**: $1,880 (85%)

### 5.2 Harness Introduction Effects

**Table 11. Runtime stability metrics and improvement with and without harness**

| Metric | Without Harness | With Harness | Improvement |
|------|------------|------------|--------|
| Runtime failure rate | 15/week | 3/week | 80% ↓ |
| Incident MTTR | 4 hours | 45 min | 81% ↓ |
| Rollback ratio | 12% | 2% | 83% ↓ |
| Emergency patch frequency | 8/month | 1/month | 87% ↓ |

**Project Conversion**:
- Medium project runtime failure response cost: Average ₩200M (5% of total cost)
- 80% failure reduction with harness: **₩160M savings**

### 5.3 Harness Investment Costs

**Table 12. Harness investment items by effort and cost**

| Item | Effort | Cost |
|------|------|------|
| Initial setup (CI/CD integration) | 1 week (2 DevOps) | ₩20M |
| Implement runtime verification logic | 1 week (1 DevOps + 1 developer) | ₩20M |
| Ongoing operations (6 months) | 8 hours/week | ₩60M |
| **Total** | | **₩100M** |

**Net ROI**: (₩160M - ₩100M) / ₩100M = **60%**

---

## 6. Open Weight Model TCO Comparison

AIDLC supports both cloud APIs like Claude/GPT and open weight models like GLM/Qwen. TCO varies significantly based on choice.

### 6.1 Cloud API Costs

**Table 13. Cloud API token prices and context size by model**

| Model | Input Token Price | Output Token Price | Context Size |
|------|--------------|--------------|--------------|
| Claude Sonnet 4.0 | $3/MTok | $15/MTok | 200K |
| GPT-4.1 | $2/MTok | $8/MTok | ~1M |
| GPT-3.5 Turbo | $0.5/MTok | $1.5/MTok | 16K |

**Medium Project Usage Estimate** (6 months, 10 developers):
- Monthly requests: 10 people × 100/day × 20 days = 20,000
- Average input tokens: 2,000 (context + prompt)
- Average output tokens: 1,000 (code generation)
- Monthly tokens: (20,000 × 2,000) + (20,000 × 1,000) = 60 MTok

**Monthly Cost** (dollar amounts converted at ₩1,350/$, illustrative rate as of 2026-10-15):
- Claude Sonnet 4.0: (40 MTok × $3) + (20 MTok × $15) = **$420** (approximately ₩0.57M)
- GPT-4.1: (40 MTok × $2) + (20 MTok × $8) = **$240** (approximately ₩0.32M)
- 6-month total: **$1,440-$2,520** (approximately ₩1.9-3.4M)

**Advantages**:
- No initial cost
- No infrastructure management needed
- Immediate use of latest models

**Disadvantages**:
- Cost explosion with increased usage
- External data transmission (unsuitable for confidential projects)
- Network latency (400-800ms)

### 6.2 Self-Hosting Costs

**Infrastructure**: EKS + GPU nodes (vLLM-based)

**Table 14. Self-hosting components by spec and monthly cost**

| Component | Spec | Monthly Cost |
|----------|------|---------|
| GPU instance | p5.48xlarge (H100×8) Spot | $20,000 (approximately ₩26M) |
| Storage | 1TB EBS gp3 | $100 (approximately ₩1.3M) |
| Network | Data transfer | $200 (approximately ₩2.6M) |
| Operations personnel | 0.5 MLOps engineer | $5,000 (approximately ₩6.5M) |
| **Total** | | **$25,300 (approximately ₩33M/month)** |

6-month total cost: **$151,800 (approximately ₩200M)**

**Break-Even Point Calculation**:

Point where cloud API cost exceeds self-hosting:

```
Average tokens per request = 2,000 input + 1,000 output (per the §6.1 usage model)
Monthly requests = $25,300 / (average cost per request)

Claude Sonnet 4.0: (2,000×$3 + 1,000×$15)/1M = $0.021/request
→ ~1,204,762 requests/month (~600 developer scale at 2,000 requests/developer/month)

GPT-3.5 Turbo: (2,000×$0.5 + 1,000×$1.5)/1M = $0.0025/request
→ ~10,120,000 requests/month (~5,060 developer scale)
```

**Conclusion**:

Hosting choice is not decided by developer count alone; weigh it together with data-control requirements, latency requirements, and measured request volume. The tendencies below assume the break-even calculation above and should be recomputed with each organization's measured request volume.

- Request volume below the break-even point with no restriction on external data transmission: cloud API advantageous
- Request volume above the break-even point: self-hosting advantageous
- Confidential projects where external data transmission is prohibited: self-hosting or an isolated deployment is required regardless of request volume

### 6.3 Hybrid Strategy

In practice, cloud API + self-hosting hybrid is optimal:

**Table 15. Model selection and rationale by task type**

| Task Type | Model Selection | Reason |
|----------|----------|------|
| Complex architecture design | Claude Sonnet 4.0 (cloud) | High-quality reasoning needed |
| Repetitive code generation | GLM-5/Qwen (self-hosted) | High volume requests, low latency |
| Code review | GPT-4.1 (cloud) | Deep analysis needed |
| Unit test generation | GLM-4 (self-hosted) | Mass generation |

**Cost Optimization Effect** (illustrative estimate, not a measured result; varies with task mix and request volume):
- 60% cloud API usage reduction
- 40% self-hosting efficiency improvement
- Total cost **30-40% savings**

---

## 7. Productivity Metrics

Core metrics for measuring AIDLC adoption effects.

### 7.1 AIDLC Productivity Metrics

<ProductivityMetrics />

### 7.2 Detailed Measurement Items and DORA Mapping

<DetailedMetrics />

### 7.3 Metric Collection Methods

#### Development Productivity

**Data Sources**:
- GitHub/GitLab metrics: Commit count, PR review time, deployment frequency
- JIRA/Linear: Ticket processing speed, backlog burn-down
- AI tool logs: LLM call count, generated code LOC, acceptance rate

**Measurement Cycle**: Weekly (aligned with Bolt cycle)

#### Operational Stability

**Data Sources**:
- AMP/AMG: MTTR, error rate, SLO achievement rate
- Argo CD: Deployment success rate, rollback frequency
- PagerDuty: Incident count, escalation rate

**Measurement Cycle**: Daily (real-time dashboard)

#### Cost Efficiency

**Data Sources**:
- AWS Cost Explorer: Infrastructure costs
- LLM provider dashboard: API costs
- Timesheets: Actual effort invested

**Measurement Cycle**: Monthly

### 7.4 Benchmark Data

The following table shows industry figures that have been cited with McKinsey "The economic potential of generative AI" (2023) as their source. The productivity improvement rates and ROI periods in the table could not be traced in that report (primary source not verified as of 2026-10-29), so use them only as examples for planning.

**Table 16. Productivity improvement and ROI period benchmark by industry**

| Industry | Productivity Improvement | ROI Period | Note |
|------|-----------|---------|------|
| Software Development | 35-45% | 3-6 months | Code generation focus |
| Financial Services | 20-30% | 6-12 months | Compliance burden |
| Manufacturing | 15-25% | 12-18 months | Legacy system integration |

For the Korean SI market, setting a **20-30% range**, similar to financial services, is recommended as a realistic goal. This range is an author's estimate, not a measured result.

---

## 8. RFP Proposal Writing Guide

### 8.1 Cost Reduction Statement Strategy

**Wrong Approach**:
> "We will improve development productivity by introducing AI."

This expression is vague and unmeasurable. Issuers want specific numbers.

**Correct Approach**:

The figures below are forecasts and targets at proposal time, presented separately from contractually committed deliverables. A proposal should state which items are binding commitments and which are targets.

> "By applying AIDLC methodology, we target the following cost optimization (forecasts/targets):
> 
> 1. **44% Inception Phase reduction target**: 9 weeks → 5 weeks with AI requirements analysis
> 2. **40% Construction Phase acceleration target**: developer productivity gains from ontology-based code auto-generation
> 3. **50% Operations cost reduction target**: shorter MTTR from AI Agent autonomous incident response
> 
> Total proposal: ₩4.5B (10% reduction vs traditional method) — this amount is the binding contractual commitment.
> 
> A ₩150M initial AIDLC investment is included, targeting approximately ₩285M in error-reduction effect across the project (net ROI approximately 90%, subject to recomputation against measured results)."

### 8.2 Risk Mitigation Strategy

AIDLC adoption entails new risks. Specify mitigation strategies in proposal.

**Table 17. AIDLC adoption risks with mitigation strategy and responsible party**

| Risk | Mitigation Strategy | Responsibility |
|--------|----------|------|
| AI-generated code quality variation | Ontology-based auto-verification + 2-stage review | Bidder |
| Harness integration complexity | Pre-analyze legacy environment + phased application | Bidder |
| Organizational transition resistance | 4-week training program + pilot project | Issuer+Bidder |
| Data leakage concerns | Self-hosted LLM + network isolation | Bidder |

### 8.3 Phased Application Roadmap

Applying AIDLC to all phases at once is risky. Present phased approach.

**Phase 1: Pilot (First Bolt, 2-4 weeks)**
- Goal: Verify AIDLC feasibility
- Scope: 1 core module
- Ontology: Lightweight design
- Harness: Basic verification only
- Expected effect: 15-20% productivity improvement

**Phase 2: Scale-up (2-3 months)**
- Goal: Expand to entire team
- Scope: 5 major modules
- Ontology: Cover entire domain
- Harness: Integration test automation
- Expected effect: 25-35% productivity improvement

**Phase 3: Optimization (Late project)**
- Goal: Maximize ROI
- Scope: Entire system
- Ontology: Continuous improvement
- Harness: AI Agent autonomous operations
- Expected effect: 30-40% productivity improvement

### 8.4 Proposal Checklist

- [ ] Specify concrete savings rate vs traditional method (%)
- [ ] Specify initial investment cost and present ROI period
- [ ] Quantify ontology/harness investment vs long-term effects
- [ ] Specify break-even point by project scale
- [ ] Present rationale for cloud API vs self-hosting choice
- [ ] Attach phased application roadmap
- [ ] Detail risk mitigation strategies
- [ ] Specify measurement metrics and collection methods
- [ ] Include reference project cases (if available)
- [ ] Include issuer training plan

---

## 9. Next Steps

After understanding cost effectiveness framework, proceed to next documents:

1. **[Adoption Strategy](./adoption-strategy.md)**: Strategy for phased AIDLC organizational adoption
2. **[Role Composition](./role-composition.md)**: How PM, architect, developer roles change
3. **[Governance Framework](./governance-framework.md)**: Methods for enterprise-wide AI-generated code quality management

Also reference methodology guides to prepare for actual implementation:

- **[Ontology Engineering](../methodology/ontology-engineering.md)**: Practical guide for structuring domain knowledge
- **[Harness Engineering](../methodology/harness-engineering.md)**: Methods for automating runtime feedback loops
- **[Open Weight Models](../toolchain/open-weight-models.md)**: Self-hosted LLM deployment guide

---

## References

- McKinsey Global Institute. "The economic potential of generative AI: The next productivity frontier." 2023.
- Husain, Hamel. "A Field Guide to Rapidly Improving AI Products." 2025. (https://hamel.dev/blog/posts/field-guide/)
- Forsgren, Nicole et al. "Accelerate: The Science of Lean Software and DevOps." 2018. (DORA metrics source)
- AWS. "Building Generative AI applications using Amazon Bedrock." 2024.
- DeepLearning.AI. "Building and Evaluating Advanced RAG Applications." Andrew Ng. 2024.
