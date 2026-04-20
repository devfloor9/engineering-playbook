---
title: "Enterprise Compliance Framework"
sidebar_label: "Compliance"
description: "Compliance guide mapping SOC2, ISO27001, electronic financial supervision regulations, and ISMS-P to AI operations"
tags: [compliance, soc2, iso27001, isms-p, audit, security]
last_update:
  date: 2026-04-04
  author: YoungJoon Jeong
---

# Enterprise Compliance Framework

Provides compliance frameworks and practical mapping guides that must be followed when operating AI platforms in enterprise environments.

## Why AI Compliance Is Needed

### Traditional IT Compliance vs AI Operations Compliance

:::info Key Difference
Traditional IT compliance deals with **static systems**, while AI compliance deals with **non-deterministic, learning systems**.
:::

| Area | Traditional IT Compliance | AI Operations Compliance |
|------|--------------------------|-------------------------|
| **Predictability** | Code → Same input = Same output | Model → Same input may produce different outputs |
| **Access Control** | DB/API level | Model API + Prompt + Output filtering |
| **Audit Trail** | Transaction logs | Inference traces + Token usage |
| **Change Management** | Code deployment | Model version + LoRA adapter + Playbook |
| **Incident Response** | Rollback + Hotfix | Model swap + Guardrails hardening |

### AI-Specific Risks

:::caution AI-Specific Compliance Risks
- **Hallucination**: Model generates factually incorrect information
- **Prompt Injection**: Malicious input manipulates model behavior
- **PII Exposure**: Personal information leaked from training data
- **Model Bias**: Discriminatory outputs against specific groups
- **Token Abuse**: Cost explosion and resource exhaustion
:::

These risks must be mapped to existing compliance frameworks to establish **actionable controls**.

---

## SOC2 Trust Criteria to AI Operations Mapping

SOC2 (Service Organization Control 2) is a global standard for verifying cloud service security, availability, and confidentiality.

### SOC2 Control Mapping Table

| SOC2 Control | Trust Criteria | AI Operations Implementation | Technology Stack |
|-------------|----------------|---------------------------|-----------------|
| **CC6.1-6.8** | Logical/Physical access control | Model API auth + Data access control | **Pod Identity + RBAC + API Key** |
| **CC7.1-7.4** | System monitoring | Inference request tracking + GPU resource monitoring | **Langfuse + AMP/AMG + DCGM** |
| **CC7.3** | Anomaly detection and incident response | Automatic alerts + Playbook rollback | **PagerDuty + ArgoCD** |
| **CC8.1** | Change management | Playbook version control + Approval gates | **GitOps + Approval Gate** |

---

## ISO27001 Annex A to AI Operations Mapping

ISO27001 is the international standard for Information Security Management Systems (ISMS). Annex A defines 114 control items.

### ISO27001 Control Mapping Table

| Annex A | Control Area | AI Operations Implementation | Technology Stack |
|---------|-------------|---------------------------|-----------------|
| **A.8** | Asset management | Model registry + LoRA adapter management | **ECR + MLflow Model Registry** |
| **A.9** | Access control | API Key management + RBAC + Multi-tenant isolation | **kgateway + Pod Identity** |
| **A.12** | Operational security | Logging + Monitoring + Backup | **CloudTrail + AMP/AMG + S3** |
| **A.14** | System development security | Playbook CI/CD + Automated code review | **ArgoCD + Guardrails API** |
| **A.16** | Information security incident management | Automatic detection + Automatic response | **Alerts + Playbook rollback** |
| **A.17** | Business continuity | Multi-AZ deployment + Autoscaling | **EKS + Karpenter** |

---

## Financial Regulation Mapping

### Electronic Financial Supervision Regulation Mapping

| Article | Content | AI Operations Mapping | Implementation |
|---------|---------|----------------------|---------------|
| **Article 15** | Access control and authorization management | Model API authentication + Audit logs | **API Key + CloudTrail** |
| **Article 17** | Electronic financial transaction data encryption | Data encryption + TLS | **KMS + ALB TLS** |
| **Article 34** | Transaction and transfer limit settings | Token usage limits + Rate Limiting | **kgateway rate-limit** |

### ISMS-P (Privacy Certification) Mapping

| Item | Requirement | AI Operations Mapping | Implementation |
|------|-----------|----------------------|---------------|
| **2.6** | Access control | API Key + RBAC + Multi-factor authentication | **Pod Identity + MFA** |
| **2.9** | System and service development security | Playbook version control + Guardrails | **Git + Guardrails API** |
| **2.11** | Information security incident management | Automatic incident detection and response | **Alerts + Auto rollback** |

---

## Audit Data Retention Policy

### Per-Data-Classification Retention Criteria

| Data | Storage Location | Retention Period | Access Authority | Legal Basis |
|------|-----------------|-----------------|-----------------|------------|
| **Inference traces** | Langfuse + S3 | 3 years | Audit team, DevOps | ISO27001 A.12.4 |
| **API call logs** | CloudTrail + S3 | 5 years | Security team, Audit team | Electronic Financial Supervision Art. 19 |
| **Model change history** | Git + ECR | Permanent | DevOps, ML team | SOC2 CC8.1 |
| **GPU metrics** | AMP + S3 | 1 year | Operations team | Internal policy |
| **PII detection logs** | CloudWatch + S3 | 3 years | Security team, Compliance team | ISMS-P 2.11 |

---

## Practical Checklists

### SOC2 Audit Preparation

- [ ] CC6.1-6.8: Pod Identity + RBAC configuration complete
- [ ] CC7.1-7.4: Langfuse + AMP/AMG monitoring built
- [ ] CC7.3: PagerDuty alerts + Auto rollback configured
- [ ] CC8.1: GitOps + Approval Gate applied

### ISO27001 Certification Preparation

- [ ] A.8: MLflow Model Registry built
- [ ] A.9: kgateway + API Key management system
- [ ] A.12: CloudTrail + S3 audit log retention
- [ ] A.14: CI/CD pipeline automated verification
- [ ] A.16: Incident response Playbook created
- [ ] A.17: Multi-AZ + Karpenter autoscaling

### Financial Regulation Compliance

- [ ] Article 15: API access control
- [ ] Article 17: TLS + KMS encryption
- [ ] Article 34: Rate Limiting
- [ ] ISMS-P 2.6: MFA applied
- [ ] ISMS-P 2.9: Guardrails API integration
- [ ] ISMS-P 2.11: Automated incident response

---

## References

- [SOC2 Trust Services Criteria](https://www.aicpa-cima.com/resources/landing/trust-services-criteria)
- [ISO/IEC 27001:2022](https://www.iso.org/standard/82875.html)
- [Electronic Financial Supervision Regulations (FSC)](https://www.law.go.kr/)
- [ISMS-P Certification Standards (KISA)](https://isms.kisa.or.kr/)
- [Langfuse Compliance Guide](https://langfuse.com/docs/compliance)
- [Guardrails AI Security](https://docs.guardrailsai.com/concepts/security/)
