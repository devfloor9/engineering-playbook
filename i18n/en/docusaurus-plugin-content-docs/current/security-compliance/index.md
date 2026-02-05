---
title: "Security & Governance"
sidebar_label: "Security & Governance"
description: "Advanced technical documentation on security hardening and compliance management in Amazon EKS environments"
sidebar_position: 5
---

# Security & Governance

Security in modern cloud environments extends beyond simple firewall deployment to encompass defense-in-depth strategies and continuous security posture assessment. Security hardening in Amazon EKS environments requires a comprehensive approach spanning from cluster-level access control to network isolation, data encryption, and runtime security monitoring. This section covers security architecture design and implementation based on the Defense in Depth principle.

Security governance transcends technical controls to embed organizational policies, processes, and compliance requirements into code and infrastructure. In regulated industries such as finance, compliance with frameworks like PCI-DSS, SOC 2, and ISO 27001 is mandatory. This necessitates establishing automated policy enforcement, continuous audit logging, and real-time threat detection systems. In Kubernetes-based environments, robust security posture can be achieved by integrating native security features like RBAC, Network Policy, and Pod Security Standards with AWS cloud-native services such as IAM, KMS, and GuardDuty.

Incident response capability is a core element of security strategy. Operating under the premise that perfect defense is impossible, it is crucial to establish swift detection, accurate analysis, effective isolation, and systematic recovery processes when security incidents occur. API audit logs through CloudTrail, network traffic analysis via VPC Flow Logs, and anomaly detection using runtime security tools like Falco form the foundation of incident response. Furthermore, post-incident analysis to identify root causes and automation of preventive measures continuously improve security posture.

Security is not a one-time configuration but an area requiring continuous assessment and improvement. Proactive identification and remediation of security vulnerabilities through regular vulnerability scanning, CIS benchmark-based security assessments, and penetration testing are essential. Applying Zero Trust principles to deny all access by default and permit only explicitly verified requests is fundamental to modern security architecture.

## Main Documents

**Operational Security and Incident Management**

[Default Namespace Incident Response](./default-namespace-incident.md) - Analysis of default namespace security threats, incident detection and response procedures, post-incident analysis and improvement measures, security monitoring automation

## Architecture Patterns

```mermaid
graph TB
    subgraph External[\"External Access\"]
        Users[\"Users\"]
        IdP[\"Identity Provider\"]
        API[\"API Gateway\"]
    end
    
    subgraph EdgeSecurity[\"Edge Security\"]
        WAF[\"AWS WAF\"]
        Shield[\"AWS Shield\"]
        NLB[\"Network Load Balancer\"]
    end
    
    subgraph Network[\"Network Layer\"]
        VPC[\"VPC\"]
        SG[\"Security Groups\"]
        NACL[\"Network ACLs\"]
    end
    
    subgraph EKS[\"EKS Cluster\"]
        CP[\"Control Plane\"]
        RBAC[\"RBAC Policies\"]
        NetworkPolicy[\"Network Policies\"]
        IRSA[\"IAM Roles for SA\"]
    end
    
    subgraph DataProtection[\"Data Protection\"]
        KMS[\"AWS KMS\"]
        Secrets[\"Secrets Manager\"]
        Encryption[\"etcd Encryption\"]
    end
    
    subgraph Monitoring[\"Security Monitoring\"]
        CloudTrail[\"AWS CloudTrail\"]
        GuardDuty[\"Amazon GuardDuty\"]
        SecurityHub[\"AWS Security Hub\"]
        Logs[\"Application Logs\"]
    end
    
    Users --> IdP
    IdP --> API
    API --> WAF
    WAF --> Shield
    Shield --> NLB
    NLB --> VPC
    VPC --> SG
    SG --> CP
    CP --> RBAC
    RBAC --> NetworkPolicy
    CP --> IRSA
    IRSA --> KMS
    Secrets --> CP
    CP --> Encryption
    CP --> CloudTrail
    CP --> GuardDuty
    GuardDuty --> SecurityHub
    CP --> Logs
    
    style External fill:#ea4335
    style EdgeSecurity fill:#fbbc04
    style Network fill:#4286f4
    style EKS fill:#34a853
    style DataProtection fill:#9c27b0
    style Monitoring fill:#ff6d00
```

## Security Areas

Security architecture consists of three layers: cluster level, workload level, and data level. Cluster security is implemented through the integration of AWS IAM and Kubernetes RBAC, centered on authentication and authorization management. IRSA (IAM Roles for Service Accounts) enables fine-grained AWS resource access permissions at the pod level, applying the principle of least privilege to minimize the attack surface. OIDC provider integration allows connection with existing enterprise SSO systems and strengthens user authentication security by applying MFA.

Network security is a core element of defense in depth, controlling pod-to-pod communication through Kubernetes Network Policies and implementing namespace isolation. Adopting a service mesh (Istio, Linkerd) automatically configures mTLS to encrypt all service-to-service communication and automates certificate management. At the VPC level, public and private subnets are separated, outbound traffic is controlled through NAT Gateway, and network traffic is continuously monitored via VPC Flow Logs.

Workload security strengthens container execution environment security through Pod Security Standards. Applying the Restricted level blocks root privilege execution, restricts host network access, and removes dangerous Capabilities. Security Context settings enforce read-only filesystems and minimize execution privileges. Container images are scanned in the CI/CD pipeline using tools like Trivy to proactively block vulnerabilities, and policies are enforced to use only signed images from approved registries.

Secret management is centralized through the integration of AWS Secrets Manager and External Secrets Operator. Instead of storing secrets directly as Kubernetes Secrets, they are kept in external secret stores, with automatic rotation and periodic synchronization minimizing secret exposure risk. Envelope encryption using KMS protects data encryption keys, and key rotation policies manage long-term key exposure risk.

Data security includes encryption for both data at rest and data in transit. EBS volumes are protected at the block level through KMS-based encryption, and etcd transparently encrypts the Kubernetes configuration database through AWS KMS integration. At the application level, end-to-end encryption for sensitive data provides multi-layered protection. Data in transit is encrypted through TLS/mTLS, with the API server protected by TLS and mTLS automatically applied to pod-to-pod communication through the service mesh. At the ingress level, HTTPS is enforced and certificates are automatically renewed through Let's Encrypt and Cert Manager.

## Compliance Frameworks

Compliance adherence requires integration of technical implementation and organizational processes. SOC 2 addresses data security, availability, and processing integrity, implemented in EKS environments through high availability architecture, data encryption, and access control. PCI-DSS is an essential standard for payment card data processing, requiring network isolation, data encryption, access control, and regular security assessments. HIPAA is regulation for healthcare information protection, with data encryption and audit logging at its core. GDPR requires data minimization, user rights protection, and processing transparency for personal information protection, while ISO 27001 provides a comprehensive framework for information security management systems.

Compliance requirements in EKS environments are mapped to technical controls. Access control requirements are implemented through the combination of AWS IAM and Kubernetes RBAC, while encryption requirements are met through TLS/mTLS and AWS KMS. Audit requirements are implemented through API call logging via CloudTrail and application log collection, and monitoring requirements are met through real-time threat detection via GuardDuty and Security Hub. Policy enforcement is automated through OPA Gatekeeper at the admission control stage, proactively blocking policy violations.

Compliance tools enable automated assessment and continuous monitoring. AWS Config continuously monitors resource configurations and detects policy violations, while Security Hub integrates results from multiple security services to provide a centralized dashboard. GuardDuty identifies anomalous behavior through machine learning-based threat detection, and CloudTrail records all API calls to provide audit trails. Inspector assesses vulnerabilities in EC2 instances and container images and provides security recommendations.

## Security Tools and Technologies

Open source security tools are key elements for strengthening security in Kubernetes environments. Falco monitors runtime security at the system call level, detecting anomalous behavior in real-time. It detects unexpected process execution, sensitive file access, network connection attempts, and generates alerts. OPA Gatekeeper provides policy-based control, operating as an admission webhook to validate security policies at pod creation time and block deployments on violations. Trivy scans container images and filesystems to detect known vulnerabilities, integrating into CI/CD pipelines to prevent vulnerable images from being deployed to production environments. Kube-bench evaluates cluster security settings against CIS Kubernetes benchmarks and provides recommendations, while kube-hunter performs penetration testing on clusters to discover potential security vulnerabilities.

AWS native security services provide security features optimized for cloud environments. AWS WAF is a web application firewall that blocks common web attacks like SQL injection and XSS, implementing application-specific security policies through custom rules. AWS Shield automatically provides basic DDoS protection to all AWS services, while Shield Advanced offers advanced protection against large-scale DDoS attacks and 24/7 DDoS response team support. Amazon Inspector continuously assesses vulnerabilities in EC2 instances and container images, providing CVE-based security recommendations, and AWS Systems Manager automates operating system and application patching to rapidly address vulnerabilities.

## Security Monitoring and Response

Real-time security monitoring is an essential element for early threat detection and rapid response. Security event logs are collected from multiple sources including CloudTrail, VPC Flow Logs, application logs, and container logs, then integrated into a centralized log repository. Anomaly detection is implemented through machine learning-based analysis and rule-based alerting, with GuardDuty automatically detecting abnormal API call patterns, suspicious network activity, and compromised instance behavior. Automated security response workflows are implemented through EventBridge and Lambda, automatically performing isolation, alerting, and recovery actions when specific security events occur.

The incident response process minimizes the impact of security incidents through systematic and repeatable procedures. In the detection phase, security monitoring tools automatically identify anomalies and generate alerts. In the analysis phase, the security team evaluates incident severity, impact scope, and attack vectors to determine response priorities. In the isolation phase, affected resources are disconnected from the network to prevent further damage propagation. In the recovery phase, compromised systems are restored to normal state and services are resumed. In the post-incident analysis phase, root causes are identified and attack paths are reconstructed, while in the improvement phase, security policies and technical controls are strengthened based on lessons learned to prevent recurrence.

Forensic analysis is the process of understanding the full context of security incidents and collecting evidence. Through CloudTrail log analysis, attacker API call patterns and privilege escalation attempts are tracked, and VPC Flow Logs are reviewed to identify abnormal network traffic and data exfiltration attempts. Container logs are collected to analyze application-level attack traces, and network traffic analysis detects communication with C&C servers or internal reconnaissance activities. This forensic data can be used as evidence when legal action is required and provides insights for improving security posture.

## Related Categories

[Hybrid Infrastructure](/docs/hybrid-multicloud) - Hybrid environment security

[Operations & Observability](/docs/observability-monitoring) - Security monitoring

[Infrastructure Optimization](/docs/performance-networking) - Network security
