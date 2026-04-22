---
title: "Korea AI Basic Act — High-Impact AI Regulation and Generative AI Labeling"
sidebar_label: "Korea AI Basic Act"
description: "Korea AI Basic Act's high-impact AI impact assessment, generative AI labeling obligations, PIPA/ISMS-P cross-compliance, and AIDLC integration guide"
tags: [korea, ai-law, pipa, isms-p, compliance, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Korea AI Framework Act (AI 기본법, Enforcement Expected 2026)

> 📅 **Published**: 2026-04-18 | ⏱️ **Reading Time**: ~5 minutes

---

## Overview

**Korea AI Framework Act (AI 기본법, Artificial Intelligence Framework Act)** is Korea's first comprehensive AI regulation law, **expected to be enforced in H1 2026**.

**Legislative Background:**
- Led by Ministry of Science and ICT
- Expected to pass National Assembly in 2025
- References EU AI Act while adapting to Korean circumstances

---

## Core Provisions

### 1. High-Impact AI System Designation

**Definition**: AI that significantly impacts human life, safety, and rights

**Examples:**
- Recruitment and promotion decision support systems
- Credit scoring and loan review
- Medical diagnosis assistance
- Crime prediction and sentencing support

**Obligations:**
- Conduct pre-deployment impact assessment
- Inform users of AI usage
- Explain decision-making process

---

### 2. Generative AI Labeling Obligation

**Target**: Text, image, video, code generation AI

**Obligation Content:**
- **Clearly label** AI-generated content
- Watermark or metadata insertion recommended

**AIDLC Response:**
```python
# AI-GENERATED: Claude 3.7 Sonnet (2026-04-18)
# PROMPT: "Implement user authentication API endpoint"
# REVIEW: @senior-developer (2026-04-18)

@app.post("/auth/login")
def login(credentials: LoginRequest):
    # Generated code...
```

---

### 3. Impact Assessment

**Target**: Before deploying high-impact AI systems

**Assessment Items:**
- Risk factors (bias, privacy violations)
- Mitigation measures
- Alternative approaches review
- Post-deployment monitoring plan

**AIDLC Mapping**: Inception → Requirements Analysis (NFR fulfillment check)

```yaml
# .aidlc/compliance/korea-impact-assessment.yaml
impact_assessment:
  project: payment-service-v2
  assessment_date: 2026-04-18
  
  # High-impact AI determination
  high_impact: false
  rationale: "Used as development tool, final decisions by developers"
  
  # Risk factors
  risk_factors:
    - factor: "Security vulnerabilities in generated code"
      severity: medium
      mitigation: "Automated SAST scanning + independent review"
    
    - factor: "PII exposure"
      severity: high
      mitigation: "Guardrails filtering + log masking"
  
  # Post-deployment monitoring
  post_monitoring:
    frequency: daily
    metrics:
      - "Security vulnerability detection rate"
      - "Code quality metrics"
```

---

### 4. Post-Deployment Management

**Obligations:**
- **Continuous monitoring** after deployment
- **Immediate correction** when malfunction or bias detected
- **Report to Ministry of Science and ICT** for major incidents

**AIDLC Mapping**: Operations → Post-market monitoring

```yaml
# .aidlc/monitoring/korea-post-market.yaml
post_market_monitoring:
  responsible_party: "AI Governance Team"
  
  # Continuous monitoring
  monitoring:
    frequency: daily
    metrics:
      - name: "error_rate"
        target: "< 1%"
      - name: "security_vulnerabilities"
        target: "0 critical"
  
  # Corrective action
  corrective_action:
    sla: 7d  # Correct within 7 days of malfunction detection
    escalation: "Report to Ministry of Science and ICT for major incidents"
```

---

## Cross-Compliance with PIPA (Personal Information Protection Act)

**PIPA** and **Korea AI Basic Act** are **mutually complementary**:

| Item | PIPA | Korea AI Basic Act |
|------|------|-----------|
| **Scope** | Overall personal information processing | AI system-specific |
| **Profiling** | Consent required (Art. 15) | Additional impact assessment for high-impact AI |
| **Automated Decisions** | Right to refuse guaranteed (Art. 37-2) | Explanation obligation (AI Basic Act) |
| **Accountability** | Data subject rights-centered | AI system safety-centered |

**AIDLC Response**: **Simultaneous compliance** with PIPA + Korea AI Basic Act required when processing personal information

```yaml
# .aidlc/compliance/korea-privacy.yaml
privacy_compliance:
  # PIPA compliance
  pipa:
    consent: "Obtain explicit consent"
    data_minimization: "Collect minimal personal information only"
    purpose_limitation: "Prohibit use beyond collection purpose"
    
  # Korea AI Basic Act compliance
  ai_law:
    transparency: "Inform AI usage"
    explainability: "Explain decision-making process"
    human_oversight: "Human approval for critical decisions"
```

---

## Integration with ISMS-P

**ISMS-P (Korea ISMS-Personal Information)** certified organizations:
- Can **integrate Korea AI Basic Act requirements into ISMS-P management system**
- AI system management items to be added during certification audit (after 2026)

**Integrated Operations:**
```yaml
# .aidlc/compliance/korea-isms-p-integration.yaml
isms_p_integration:
  # Existing ISMS-P controls
  existing_controls:
    - "2.5.1 Personal information collection & use"
    - "2.6.2 Personal information storage & retention"
    - "3.1.1 Information security policy"
    
  # Korea AI Basic Act additional controls
  ai_controls:
    - control: "High-impact AI impact assessment"
      mapping: "ISMS-P 2.1.2 Risk management"
    
    - control: "Generative AI labeling obligation"
      mapping: "ISMS-P 2.5.6 Data subject rights"
    
    - control: "AI system post-deployment management"
      mapping: "ISMS-P 3.2.1 Monitoring"
```

---

## AIDLC Integration Checklist

### Inception Stage
- [ ] High-impact AI system determination
- [ ] Impact assessment (risk identification & mitigation strategy)
- [ ] PIPA personal information impact assessment (when applicable)

### Construction Stage
- [ ] Transparency labeling on AI-generated code (`# AI-GENERATED: ...`)
- [ ] Independent review process implementation
- [ ] Automated security vulnerability scanning (SAST)

### Operations Stage
- [ ] Continuous monitoring dashboard operation
- [ ] Correct within 7 days of malfunction detection
- [ ] Report to Ministry of Science and ICT for major incidents

---

## References

**Official Documents:**
- [Ministry of Science and ICT AI Policy](https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=112) (update needed upon official release)
- [Personal Information Protection Act (PIPA)](https://www.pipc.go.kr/np/default/page.do?mCode=D030010000)
- [ISMS-P Certification Standards](https://isms.kisa.or.kr/)

**Related Documentation:**
- [Regulatory Compliance Overview](../index.md)
- [Governance Framework](../../governance-framework.md)
- [Harness Engineering](../../../methodology/harness-engineering.md)
