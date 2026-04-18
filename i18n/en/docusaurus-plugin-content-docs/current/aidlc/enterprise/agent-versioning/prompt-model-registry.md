---
title: "Prompt & Model Registry"
sidebar_label: "Prompt & Model Registry"
description: "Comparison and implementation guide for Langfuse, PromptLayer, Braintrust, AWS Bedrock Prompt Management"
tags: [prompt-registry, versioning, langfuse, bedrock, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# Prompt & Model Registry

## Why Prompt Registry is Needed

Central repository managing prompt and model versions like code. Solves the following problems:

- **Version Tracking**: "It worked yesterday but is strange today" → track which prompts changed
- **Environment-specific Deployment**: Use different versions for staging/canary/production environments
- **Rollback**: Immediate recovery to previous version when issues occur
- **Audit Evidence**: Retain change history for financial/medical regulatory compliance

---

## Langfuse Prompt

[Langfuse](https://langfuse.com/) is a self-hostable LLMOps platform. Prompt registry features:

- **Version Control**: Automatic version increment with each change (`v1`, `v2`, ...)
- **Labels**: Apply environment-specific labels like `production`, `staging`, `canary`
- **Rollout Management**: Applications reference only the label when a specific label is attached to a specific version (`get_prompt("financial-analysis", label="production")`)
- **Diff View**: Visualize changes between versions
- **Access Log**: Track which session used which prompt version

```python
from langfuse import Langfuse

client = Langfuse()

# Query prompt version
prompt = client.get_prompt("financial-analysis", label="production")
print(prompt.version)  # Example: 5
print(prompt.prompt)   # Actual text

# Deploy new version
client.create_prompt(
    name="financial-analysis",
    prompt="You are a conservative investment advisor...",
    labels=["staging"]  # Deploy to staging first
)
# After validation
client.update_prompt_label("financial-analysis", version=6, label="production")
```

**Advantages**:
- Self-hosted, RBAC, S3+KMS backend capable
- Integrated with observability (automatically record prompt version in trace)

**Disadvantages**:
- Python SDK-centric (TypeScript SDK exists but with limited features)
- Simple UI (shows diff but no approval workflow)

---

## PromptLayer

[PromptLayer](https://promptlayer.com/) is a SaaS prompt registry.

- **Version Tagging**: Git-style tags (`v1.0`, `v1.1-alpha`)
- **Visual Diff**: Highlight word-level changes between versions
- **A/B Experiments**: Deploy two versions simultaneously and compare performance
- **Analytics**: Dashboard for latency, token usage, error rate by version

**Advantages**:
- Ready to use without installation
- Team collaboration features (comments, approval workflow)

**Disadvantages**:
- SaaS only (no on-premises)
- Data sovereignty issues (prompts stored on external servers)

---

## Braintrust Prompts

[Braintrust](https://www.braintrust.dev/) is an evaluation platform that also provides prompt management features.

- **Playground**: Write prompt → immediately evaluate with test set
- **Versioning**: Automatic version increment + commit message
- **Dataset Integration**: Automatically trigger evaluation run on prompt changes
- **Experimentation**: Side-by-side comparison of two prompt versions

**Advantages**:
- Evaluation and prompt management in one platform
- Automatically check quality regression on every change

**Disadvantages**:
- Strong in development/test stages rather than runtime deployment
- Weak production rollout features (requires direct implementation)

---

## AWS Bedrock Prompt Management

AWS Bedrock provides [Prompt Management](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html) features (GA November 2024).

- **Prompt Versions**: Create immutable versions with `CreatePromptVersion` API
- **Alias**: Connect aliases like `PROD`, `STAGING` to versions
- **IAM Integration**: Set policies to allow only specific versions
- **CloudTrail**: Audit logs of who deployed which version and when

```python
import boto3

bedrock = boto3.client('bedrock-agent')

# Create new version
response = bedrock.create_prompt_version(
    promptIdentifier='arn:aws:bedrock:us-east-1:123456789012:prompt/fin-analysis',
    description='Changed to conservative investment advisor style'
)
version_id = response['version']

# Update production alias
bedrock.update_prompt_alias(
    promptIdentifier='arn:aws:bedrock:us-east-1:123456789012:prompt/fin-analysis',
    aliasIdentifier='PROD',
    promptVersion=version_id
)
```

**Advantages**:
- AWS native, IAM/CloudTrail/KMS integration
- Directly referenceable from Lambda, Step Functions

**Disadvantages**:
- Requires Bedrock model usage (Claude, Llama, etc.)
- Requires separate configuration from self-hosted LLM (vLLM, llm-d)

---

## Comparison Table

| Feature | Langfuse | PromptLayer | Braintrust | Bedrock PM |
|---------|----------|-------------|------------|------------|
| **Deployment Method** | Self-hosted | SaaS | SaaS | AWS Managed |
| **Version Control** | ✅ | ✅ | ✅ | ✅ |
| **Labels/Alias** | ✅ | ✅ | ❌ | ✅ |
| **Visual Diff** | Basic | ✅ | ✅ | ❌ |
| **Approval Workflow** | ❌ | ✅ | ❌ | ❌(Implement with IAM) |
| **A/B Experiments** | Manual | ✅ | ✅ | Manual |
| **Auto Evaluation Integration** | Possible (trace-based) | ❌ | ✅ | Possible (Lambda) |
| **Data Sovereignty** | ✅ | ❌ | ❌ | ✅(Within region) |
| **AIDLC Suitability** | **⭐ High** | Medium (SaaS) | High (Eval-focused) | High (Bedrock only) |

**AIDLC Recommendation**: **Langfuse** (self-hosted requirement) or **AWS Bedrock PM** (when using Bedrock). PromptLayer/Braintrust if SaaS is allowed.

---

## Implementation Guide

### Langfuse Self-hosted Deployment

```yaml
# langfuse-values.yaml (Helm)
replicaCount: 2

postgresql:
  enabled: true
  auth:
    password: "secure-password"

env:
  - name: DATABASE_URL
    value: "postgresql://user:pass@postgres:5432/langfuse"
  - name: NEXTAUTH_SECRET
    valueFrom:
      secretKeyRef:
        name: langfuse-secrets
        key: nextauth-secret
  - name: S3_BUCKET_NAME
    value: "langfuse-prompts"
  - name: S3_ENDPOINT
    value: "https://s3.us-east-1.amazonaws.com"

resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2000m"
    memory: "4Gi"
```

```bash
helm repo add langfuse https://langfuse.github.io/langfuse-k8s
helm install langfuse langfuse/langfuse -f langfuse-values.yaml
```

### Bedrock Prompt Management Setup

```python
import boto3

bedrock = boto3.client('bedrock-agent', region_name='us-east-1')

# 1. Create prompt
prompt_response = bedrock.create_prompt(
    name='financial-analysis',
    description='Financial analysis expert prompt',
    variants=[{
        'name': 'default',
        'templateType': 'TEXT',
        'templateConfiguration': {
            'text': {
                'text': 'You are a financial analysis expert...'
            }
        }
    }]
)
prompt_arn = prompt_response['arn']

# 2. Create version
version_response = bedrock.create_prompt_version(
    promptIdentifier=prompt_arn,
    description='v1 initial version'
)

# 3. Create PROD alias
bedrock.create_prompt_alias(
    promptIdentifier=prompt_arn,
    name='PROD',
    promptVersion='1'
)
```

---

## References

- **Langfuse Prompts**: [langfuse.com/docs/prompts](https://langfuse.com/docs/prompts)
- **PromptLayer**: [promptlayer.com](https://promptlayer.com/)
- **Braintrust Prompts**: [braintrust.dev/docs/guides/prompts](https://www.braintrust.dev/docs/guides/prompts)
- **AWS Bedrock Prompt Management**: [AWS Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html)

---

## Next Steps

Once you've built the prompt registry:

1. **[Deployment Strategies](./deployment-strategies.md)** — Select and implement Canary/Shadow/A-B strategies
2. **[Governance & Automation](./governance-automation.md)** — Build automatic regression detection and rollback system
3. **[Evaluation Framework](../../toolchain/evaluation-framework.md)** — Integrate Golden Dataset-based evaluation
