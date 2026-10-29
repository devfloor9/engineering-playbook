---
title: Extension System
description: AWS Labs AIDLC Extension System — integrate organization-specific security, compliance, and domain rules into AIDLC workflows via opt-in mechanism
created: "2026-04-18"
last_update:
  date: 2026-10-29
  author: devfloor9
reading_time: 18
tags:
  - aidlc
  - extension
  - enterprise
  - compliance
  - governance
  - scope:enterprise
sidebar_label: Extension System
sidebar_position: 7
category: aidlc
---

AWS Labs [AIDLC Workflows](https://github.com/awslabs/aidlc-workflows) provides an **Extension System** that allows organizations to add **regulatory and domain-specific rules** beyond the official 5 principles and 11 Common Rules. This document covers Extension architecture, Built-in extensions, opt-in activation mechanism, and Korean enterprise (ISMS-P · financial regulations) application examples.

---

## 1. Overview: Why Extensions?

### 1.1 Core vs Extension Separation

AIDLC clearly separates the **stable methodology core** from **variable organizational rules**.

**Figure 1. Structural separation of AIDLC Core and the Extension System**

```mermaid
graph TB
    subgraph Core["AIDLC Core (stable)"]
        CR[11 Common Rules]
        INC[Inception 7 Stage]
        CON[Construction per-Unit Loop]
    end

    subgraph Extensions["Extension System (variable)"]
        BUILTIN[Built-in Extensions<br/>security/ · testing/]
        ORG[Organization Extensions<br/>Org-specific regulations]
        DOMAIN[Domain Extensions<br/>Finance · Healthcare · Public]
    end

    Core -->|opt-in.md| Extensions
    Extensions -->|Activated rules only| Core

    style Core fill:#326ce5,color:#fff
    style Extensions fill:#ff9900,color:#fff
```

**Core Principles:**
- Core contains **minimum rules common to all organizations and industries**
- Extensions are **selectively applied by organization, industry, or project**
- **In the official v0.1.7, the user's answer to each extension's `*.opt-in.md` question determines activation**

### 1.2 Extension Benefits

**Table 1. Extension adoption benefits with description and example**

| Benefit | Description | Example |
|---------|-------------|---------|
| **Regulatory Compliance** | Embed industry-specific laws/regulations into AIDLC workflows | Financial sector electronic financial supervision regulations |
| **Organization Standardization** | Separate team standards, templates, checklists into reusable modules | Architecture Decision Records (ADR) templates |
| **Gradual Adoption** | Adopt core methodology first, extend with organization-specific features later | Add compliance after MVP launch |
| **Tool Independence** | Extensions expressed in Markdown + YAML work across all AIDLC platforms | Kiro · Claude Code · Cursor |

These benefits are not guaranteed automatically by merely applying an Extension. Each benefit, including regulatory compliance, holds only if the compliance controls that apply to the project are first defined and then confirmed in a validation step before release.

---

## 2. Built-in Extensions

The AWS Labs repository release this guide pins, v0.1.7, has two **Built-in Extensions** under `aidlc-rules/aws-aidlc-rule-details/extensions/` (checked 2026-10-29). `security/baseline/` holds the rule file `security-baseline.md` (SECURITY-01 to SECURITY-15) and the opt-in question file `security-baseline.opt-in.md`; `testing/property-based/` holds `property-based-testing.md` (PBT-01 to PBT-10) and `property-based-testing.opt-in.md`. The official rule files are Markdown, and there is no `rules.yaml`. The `rules.yaml` blocks in 2.1 and 2.2 below are not official files; they are YAML illustrations this guide made to explain how an extension is organized, so their rule IDs, tools and numbers (SEC-001, 80% coverage, and so on) also differ from the official rules. Read the official rules in the Markdown files above. This guide is based on v0.1.7 and was not compared with the latest release (v2.11.2, 2026-10-28).

### 2.1 security/ Extension

**Purpose**: Integrate security requirement extraction, verification, and enforcement into AIDLC workflows.

**Key Rules:**
```yaml
# extensions/security/rules.yaml
security_extension:
  version: 0.1.0
  applies_to_stages:
    - requirements_analysis
    - application_design
    - construction.code_generation
    - construction.build_and_test

  rules:
    - id: SEC-001
      name: "Threat Modeling Required"
      stage: application_design
      action: "STRIDE-based threat modeling document mandatory"

    - id: SEC-002
      name: "Secrets Scanning"
      stage: construction.build_and_test
      action: "Automatically run git-secrets + truffleHog, block hardcoded credentials"

    - id: SEC-003
      name: "SAST Integration"
      stage: construction.build_and_test
      action: "Run at least one of Semgrep / Snyk / Checkov"

    - id: SEC-004
      name: "Dependency Vulnerability Check"
      stage: construction.build_and_test
      action: "Run OSV-Scanner or Trivy, block merge for Critical vulnerabilities"

    - id: SEC-005
      name: "Least Privilege IAM"
      stage: construction.infrastructure_design
      action: "IAM Policy must not use wildcard Resource (justification required for special cases)"
```

### 2.2 testing/ Extension

**Purpose**: Automatic test generation, coverage management, quality gate enforcement.

**Key Rules:**
```yaml
# extensions/testing/rules.yaml
testing_extension:
  version: 0.1.0
  applies_to_stages:
    - construction.functional_design
    - construction.code_generation
    - construction.build_and_test

  rules:
    - id: TEST-001
      name: "TDD First"
      stage: construction.code_generation
      action: "Generate test code before production code"

    - id: TEST-002
      name: "Minimum Coverage"
      stage: construction.build_and_test
      action: "Unit test coverage ≥ 80%, block Checkpoint Approval on failure"

    - id: TEST-003
      name: "Integration Test Required"
      stage: construction.build_and_test
      action: "Integration tests mandatory for external dependencies (DB, API)"

    - id: TEST-004
      name: "Acceptance Test Linkage"
      stage: construction.functional_design
      action: "Map Acceptance Tests to each Functional Requirement"
```

---

## 3. Opt-in Mechanism

### 3.1 opt-in.md File Structure

The official v0.1.7 activates extensions as follows (checked 2026-10-29). At workflow start it reads only the `*.opt-in.md` files in the subdirectories of `extensions/`; in Requirements Analysis it adds each file's `## Opt-In Prompt` question to the clarifying-questions file and asks the user. It records the answers in the `## Extension Configuration` table of `aidlc-docs/aidlc-state.md` and only then loads the rule files (the `.opt-in.md` name with `.md` instead) of the extensions the user opted into. Extensions without a `*.opt-in.md` file are always enforced, and an extension with no recorded configuration is treated as enforced.

The **`opt-in.md`** file below and the A-E selection question in 3.2 are not an official specification; they are a convention this guide proposes for managing several organization and domain extensions per project in one place. The official workflow does not read this file, so using the convention requires connecting it through separate instructions or tooling.

**Location**: `<project-root>/.aidlc/opt-in.md`

**File Structure:**
```markdown
# AIDLC Opt-in Extensions

**Project**: payment-service
**Updated**: 2026-04-18

## Enabled Extensions

### Built-in
- [x] security (version 0.1.0)
- [x] testing (version 0.1.0)

### Organization
- [x] org-example-security (version 1.2.0) — Example organization's internal security standards
- [x] org-compliance-ismsp (version 2.1.0) — ISMS-P (Korean Personal Information & Information Security Management System) certification standards

### Domain
- [x] finance-korea (version 1.0.0) — Korean Electronic Financial Supervision Regulations

## Disabled Extensions (explicit rejection)

- [ ] healthcare-hipaa — N/A (financial service)
- [ ] public-sector-korea — N/A
```

### 3.2 Requirements Analysis Stage opt-in Questions

In this convention, you instruct the Requirements Analysis stage to read the `opt-in.md` file to check activated extensions. **If the file doesn't exist or no extensions are specified**, you instruct it to ask the user as follows, following Common Rules rule 1 (Question Format):

```markdown
Q. Select Extensions to apply to this project (multiple choice):

A. security only (default, recommended for all projects)
B. security + testing (standard, general production projects)
C. security + testing + organization regulations (enterprise)
D. C + industry regulations (finance/healthcare/public)
E. None (demo/PoC only, prohibited for production)

[Answer]:
```

**Handling the response (proposed convention):**
- `[Answer]: C` → instruct the agent to record security, testing, and organization extensions in `opt-in.md`. The official workflow does not do this automatically.

### 3.3 Extension Priority

The priority order and waiver (exception-approval) process below are not an AWS Labs official specification; they are a local operating convention proposed by this document. Organizations may adjust them to fit their own governance.

When **conflicting rules** exist across multiple extensions, priority order:

```
1. Common Rules (highest priority, official specification)
2. Domain Extensions (industry regulations)
3. Organization Extensions (organization standards)
4. Built-in Extensions (security, testing)
5. Project-local overrides (lowest priority)
```

**Conflict Resolution Example:**
```
Common Rules 11: Reproducible — Recommends Temperature = 0
Organization Extension (finance): Allows Temperature = 0.1 (some creativity allowed)

→ Common Rules take priority → Force Temperature = 0
→ If organization truly needs this, must execute Common Rules waiver process
```

---

## 4. Organization Compliance Extension Examples

### 4.1 Korea ISMS-P Extension

**Background**: ISMS-P (Korean Personal Information & Information Security Management System) is a private certification requiring compliance with Korea information security laws. Virtually mandatory for public contracts and financial services entry.

The rule IDs below (ISMSP-2.5.1 and so on) and the numbers (passwords of 9+ characters with 3+ character types, logout after 10 minutes of inactivity, lockout after 5 failed logins, reporting within 24 hours, AES-256) are example values made for this guide. They were not checked against the current ISMS-P certification criteria or the related notices and guides (as of 2026-10-29), and they are not assumed to match the item numbers or names of the criteria. When you put them into an organization extension, re-check the items and numbers against the applicable edition of the criteria and the legal text.

**Extension Directory Structure:**
```
extensions/org-compliance-ismsp/
  rules.yaml
  templates/
    pia-template.md           # Privacy Impact Assessment (PIA)
    access-control-matrix.md
    incident-response-plan.md
  audit-mappings/
    ismsp-2.1.yaml           # ISMS-P 2.1 administrative controls
    ismsp-2.8.yaml           # Personal information processing stage requirements
```

**rules.yaml Example:**
```yaml
extension:
  name: org-compliance-ismsp
  version: 2.1.0
  description: ISMS-P 2.1 certification standards AIDLC integration
  applies_to:
    industries: [finance, public, healthcare]
    regions: [KR]

  rules:
    - id: ISMSP-2.5.1
      name: "User Account Management"
      stage: application_design
      common_rules_mapping: [checkpoint_approval, audit_logging]
      action: |
        Authentication/authorization design obligations:
        - Password policy (9+ characters, 3+ types)
        - Session timeout (auto logout after 10+ min inactivity)
        - Account lockout after 5 consecutive failed login attempts

    - id: ISMSP-2.8.2
      name: "Personal Information Processing Stage Requirements"
      stage: requirements_analysis
      action: |
        Specify requirements for all stages of personal information collection/use/provision/disposal:
        - Minimize collection items
        - Prohibit use beyond purpose
        - Encrypted storage (AES-256 or higher)
        - Automatic disposal after retention period

    - id: ISMSP-2.9.1
      name: "Incident Response"
      stage: operations.observability
      action: |
        Establish reporting system within 24 hours of security incident detection:
        - KISA reporting integration
        - Stakeholder notification
        - Forensic evidence preservation
```

### 4.2 Korea Financial Supervision Extension

**Background**: Electronic Financial Supervision Regulations (Financial Supervisory Service) and mandatory network separation/ISMS-P.

The rule IDs below (EFSR-8 and so on) and the required levels (RTO ≤ 3 hours, RPO ≤ 24 hours, DR drill at least once a year, TLS 1.3 or higher, AES-256, masking of 6+ digits) are example settings made for this guide. They were not checked against the article numbers and requirements of the Electronic Financial Supervision Regulations (as of 2026-10-29), so confirm them against the current text of the regulation on the Korean National Law Information Center before applying them.

**rules.yaml Excerpt:**
```yaml
extension:
  name: finance-korea
  version: 1.0.0
  description: Korean Electronic Financial Supervision Regulations AIDLC integration
  applies_to:
    industries: [finance]
    regions: [KR]

  rules:
    - id: EFSR-8
      name: "Network Separation Obligation"
      stage: application_design
      action: |
        Development/business/operation network logical/physical separation design mandatory:
        - Separate VPC per EKS cluster
        - Prohibit direct internet access (via Egress proxy)
        - Allow access only via Bastion Host

    - id: EFSR-13
      name: "Sensitive Information Encryption"
      stage: construction.infrastructure_design
      action: |
        Card info/resident registration number/account number compliance standards:
        - Storage: AES-256 + KMS key separation
        - Transmission: TLS 1.3 or higher
        - Logs: Masking mandatory (6+ digits)

    - id: EFSR-DR
      name: "Disaster Recovery Obligation"
      stage: application_design
      action: |
        Disaster recovery center establishment mandatory (RTO ≤ 3 hours, RPO ≤ 24 hours):
        - Multi-AZ deployment
        - Cross-Region backup
        - DR drill at least once annually
```

---

## 5. Custom Extension Creation Guide

The directory structure, the `metadata.yaml` and `rules.yaml` specifications in this section and the `aidlc extension …` and `aidlc run --pilot` commands in 5.4 are an organization-extension convention proposed by this guide. The official v0.1.7 repository has no such file specification or CLI (checked 2026-10-29). An extension that the official workflow reads consists of a rule file `<name>.md` and an optional opt-in question file `<name>.opt-in.md` in a subdirectory of `extensions/`, so even when you use the convention below, you must also create these two Markdown files to connect the extension to the official workflow.

### 5.1 Directory Structure

```
extensions/<extension-name>/
  metadata.yaml          # Extension metadata (required)
  rules.yaml             # Rules to apply (required)
  templates/             # Artifact templates (optional)
    <template-name>.md
  audit-mappings/        # Audit/regulation mapping (optional)
    <regulation>.yaml
  scripts/               # Automation scripts (optional)
    validate.sh
  README.md              # Usage guide (required)
```

### 5.2 metadata.yaml Specification

The extension name, contact, dates and checksum below are illustrative placeholder values.

```yaml
extension:
  name: org-example-security
  version: 1.2.0
  description: "Example organization internal security standards AIDLC integration"
  author: security-team@example.com
  license: Proprietary
  created: 2026-02-15
  updated: 2026-04-10

  dependencies:
    - name: security        # Depends on Built-in security extension
      version: ">=0.1.0"

  conflicts: []             # List of conflicting extensions

  applies_to:
    stages: [requirements_analysis, application_design, construction, operations]
    industries: []          # Empty array = all industries
    regions: [KR]

  checksum: sha256:<content-digest> # Tampering prevention
```

### 5.3 rules.yaml Specification

```yaml
rules:
  - id: <UNIQUE-ID>
    name: "<Human-readable name>"
    description: "<Detailed rule description>"
    severity: [low | medium | high | critical]
    stage: <target stage>
    common_rules_mapping:
      - <common rule name>  # e.g.: checkpoint_approval
    action: |
      <Specific execution instructions, multi-line allowed>
    validation:
      command: <Automatic verification command>
      expected_exit_code: 0
    references:
      - url: https://example.com/regulation
        title: "Related regulation document"
```

### 5.4 Extension Testing

Run the following tests before deploying a new Extension. The `aidlc` commands below are examples that assume a validation tool your organization implements:

```bash
# 1. Syntax validation
aidlc extension validate extensions/<extension-name>/

# 2. Conflict checking
aidlc extension check-conflicts --existing opt-in.md --new <extension-name>

# 3. Pilot execution
aidlc run --pilot --extensions <extension-name> --input sample-request.md

# 4. Result comparison (diff against execution without extension)
diff .aidlc/baseline/ .aidlc/pilot/
```

---

## 6. Extension Governance

### 6.1 Extension Lifecycle

**Figure 2. Extension lifecycle state transitions**

```mermaid
stateDiagram-v2
    [*] --> Proposed: Team proposal
    Proposed --> Review: Governance review
    Review --> Rejected: Conflict/duplication
    Review --> Approved: Approved
    Approved --> Piloted: 1-3 team pilot
    Piloted --> Revised: Feedback incorporation
    Revised --> Piloted
    Piloted --> Published: Enterprise-wide deployment
    Published --> Deprecated: Replacement extension emerges
    Deprecated --> [*]
    Rejected --> [*]
```

### 6.2 Extension Registry

Organizations operate internal Extension Registry to manage extensions. The address, extension names, owning teams and review dates below are illustrative placeholder values:

```yaml
# internal-registry.yaml
registry:
  url: https://extensions.example.com/aidlc/
  extensions:
    - name: org-example-security
      version: 1.2.0
      status: published
      owner: security-team
      reviewed_at: 2026-04-10

    - name: org-compliance-ismsp
      version: 2.1.0
      status: published
      owner: compliance-team
      reviewed_at: 2026-03-20

    - name: domain-banking-kr
      version: 0.5.0-beta
      status: piloted
      owner: banking-domain-team
      reviewed_at: 2026-04-05
```

### 6.3 Extension Monitoring Metrics

Measure whether Extensions actually provide value:

**Table 2. Extension monitoring metrics with measurement method and target**

| Metric | Measurement Method | Target |
|--------|-------------------|---------|
| Adoption Rate | Projects with Extension enabled / Total projects | >80% |
| Rule Trigger Frequency | Monthly warning/error count per rule | Team vs organization average comparison |
| Regulatory Success Rate | Audit pass rate of Extension-applied projects | 100% |
| Development Speed Impact | Lead time before/after Extension application | ≤ 15% degradation allowed |

---

## 7. References

### Official Repositories
- [AWS Labs AIDLC Extensions](https://github.com/awslabs/aidlc-workflows/tree/v0.1.7/aidlc-rules/aws-aidlc-rule-details/extensions) — Built-in extension sources
- [AWS Labs AIDLC Common Rules](https://github.com/awslabs/aidlc-workflows/tree/v0.1.7/aidlc-rules/aws-aidlc-rule-details/common) — Common rules interacting with Extensions

### Related Documents
- [Common Rules](../methodology/common-rules.md) — 11 common rules applied with Extensions
- [Governance Framework](./governance-framework.md) — Governance integration of organization extensions
- [Adoption Strategy](./adoption-strategy.md) — Extension adoption sequence (Phase 1-4)
- [Audit & Governance Logging](../operations/audit-governance.md) — Extension rule trigger history auditing

### Regulatory References
- [KISA ISMS-P Certification Standards](https://isms.kisa.or.kr/) — ISMS-P 2.1/2.8/2.9 administrative controls
- [Electronic Financial Supervision Regulations (Financial Supervisory Service)](https://fss.or.kr/) — Network separation/encryption/disaster recovery obligations
- [Personal Information Protection Act Enforcement Decree](https://law.go.kr/) — Personal information processing obligations
