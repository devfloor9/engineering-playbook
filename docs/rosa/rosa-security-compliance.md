---
title: "ROSA Security Compliance Console Access Control"
description: "금융권 보안 요구사항을 충족하기 위한 Red Hat Hybrid Cloud Console 접근 제어 방안"
tags: [rosa, openshift, security, compliance, idp, mfa, financial]
category: "rosa"
date: 2025-02-04
authors: [devfloor9]
sidebar_position: 2
---

# ROSA Security Compliance Console Access Control

## Customer Situation

A financial institution in Korea is implementing ROSA (Red Hat OpenShift Service on AWS) and has raised concerns specifically regarding access control to the Red Hat Hybrid Cloud Console. This is separate from the ROSA cluster network architecture, which is already confirmed to meet their requirements.

## Current Understanding

- The private network configuration for ROSA clusters is well understood and implementable, with no concerns.
- The security compliance issue specifically relates to the Red Hat Hybrid Cloud Console access pattern, not the ROSA cluster itself.
- When a ROSA cluster is created, administrators access the cluster through the Red Hat Hybrid Cloud Console, which currently doesn't meet the security requirements.

## Current Blocker

The default public access pattern to the Red Hat Hybrid Cloud Console does not meet financial sector regulatory requirements, even though the ROSA cluster itself can be properly secured in a private network configuration.

## Security Requirements

### Specific Console Access Control Needs

The customer requires:

1. Identity Provider (IdP) integration for the Red Hat Hybrid Cloud Console access
2. MFA implementation through the IdP
3. IP-based access control for the console

### Important Clarifications

- This requirement is specifically for the Red Hat Hybrid Cloud Console access
- This is completely separate from OIDC/SAML configurations for the ROSA clusters themselves
- The concern is not about the ROSA cluster's network architecture, which is already confirmed to be compliant when implemented in a private network configuration (with Zero Egress configuration)

## Proposed Access Control Workflow

The customer is proposing the following secure access workflow:

1. Administrator accesses the AWS ROSA console
2. When accessing the Red Hat Hybrid Cloud Console, authentication is processed through an IdP configured in AWS
3. The IdP enforces:
   - Multi-Factor Authentication (MFA)
   - IP-based access control

This workflow ensures that administrative access is strictly controlled and compliant with security requirements.

```mermaid
sequenceDiagram
    participant Admin
    participant AWS Console
    participant IdP
    participant RH Console as Red Hat Hybrid Cloud Console
    participant ROSA

    Admin->>AWS Console: 1. Access AWS ROSA Console
    Admin->>RH Console: 2. Access Red Hat Hybrid Cloud Console
    RH Console->>IdP: Request Authentication
    IdP->>IdP: 3. Verify MFA & IP-based Access Control
    IdP-->>RH Console: Authentication Response
    RH Console->>ROSA: Access ROSA Cluster (if authenticated)
```

### Overall Architecture

```mermaid
graph TB
    subgraph Customer["Customer Environment"]
        Admin[Administrator]
        IdP[Corporate IdP<br/>with MFA & IP Control]
    end

    subgraph AWS["AWS Cloud"]
        AWSC[AWS Console]
        subgraph Private["Private Network"]
            ROSA[ROSA Cluster<br/>Zero Egress Config]
        end
    end

    subgraph RedHat["Red Hat"]
        HCC[Hybrid Cloud Console<br/>IdP Integration Required]
    end

    Admin -->|1. Access| AWSC
    Admin -->|2. Access| HCC
    HCC -->|3. Auth Request| IdP
    IdP -->|4. MFA + IP Check| IdP
    IdP -->|5. Auth Response| HCC
    HCC -->|6. Manage| ROSA

    style IdP fill:#ff9900,stroke:#232f3e,stroke-width:2px
    style HCC fill:#EE0000,stroke:#232f3e,stroke-width:2px
```

## Response Needed

1. Information about similar cases in the financial sector
2. Previous solutions implemented for admin access control
3. Best practices based on other financial sector implementations

## Next Steps

- Confirm if the proposed workflow meets Red Hat's technical capabilities
- Provide documentation on IdP integration with Red Hat Hybrid Cloud Console
- Share relevant case studies or examples from other financial sector implementations
- Provide technical guidance for implementation

:::warning 주의사항
이 문서는 금융권 고객의 보안 요구사항을 다루고 있습니다. 실제 구현 시 Red Hat 및 AWS와의 협의가 필요합니다.
:::
