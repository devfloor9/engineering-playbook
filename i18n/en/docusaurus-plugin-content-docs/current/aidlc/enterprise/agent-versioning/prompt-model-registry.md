---
title: Prompt & Model Registry
description: Comparison and implementation guide for Langfuse, PromptLayer, Braintrust, AWS Bedrock Prompt Management
created: "2026-04-19"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 23
tags:
  - prompt-registry
  - versioning
  - langfuse
  - bedrock
  - scope:enterprise
sidebar_label: Prompt & Model Registry
---

## Why Prompt Registry is Needed

Central repository managing prompt and model versions like code. Solves the following problems:

- **Version Tracking**: "It worked yesterday but is strange today" → track which prompts changed
- **Environment-specific Deployment**: Use different versions for staging/canary/production environments
- **Rollback**: Restore an approved earlier version in the label or application configuration, then check that applications use it and that errors and latency have recovered.
- **Audit Evidence**: Retain change history for financial/medical regulatory compliance

---

## Langfuse Prompt

[Langfuse](https://langfuse.com/) is a self-hostable LLMOps platform. Prompt registry features:

- **Version Control**: Automatic version increment with each change (`v1`, `v2`, ...)
- **Labels**: Apply environment-specific labels like `production`, `staging`, `canary`
- **Rollout Management**: Applications reference only the label when a specific label is attached to a specific version (`get_prompt("financial-analysis", label="production")`)
- **Diff View**: Visualize changes between versions
- **Access Log**: Track which session used which prompt version

The example below uses [Langfuse Python SDK 4.15.3](https://github.com/langfuse/langfuse-python/blob/49b8f9e7f2767295c7b61809e943813d202d10ee/langfuse/_client/client.py#L4119-L4224). Register a version with a client authenticated to the intended project and save the response in `candidate`. Evaluation and release approval follow registration.

```python
from langfuse import Langfuse

client = Langfuse()

# Query prompt version
prompt = client.get_prompt("financial-analysis", label="production")
print(prompt.version)  # Example: 5
print(prompt.prompt)   # Actual text

# Register a staging candidate
candidate = client.create_prompt(
    name="financial-analysis",
    prompt="You are a conservative investment advisor...",
    labels=["staging"]
)
```

Save `candidate.name` and `candidate.version` with the project identity and evaluation record. Another author may create a version in between, so evaluate the returned version instead of assuming that the next version is 6.

Have the release workflow verify evaluation evidence and approval for the exact project, name and version before calling the function below. Pass the name and version from that verified record as `approved_name` and `approved_version`.

```python
# langfuse_prompt_promotion.py
def promote_evaluated_prompt(
    client, *, candidate, approved_name, approved_version
):
    """Match a candidate to an externally verified approval record."""
    if (not isinstance(approved_name, str) or not approved_name.strip()
            or type(approved_version) is not int or approved_version < 1
            or candidate.name != approved_name
            or type(candidate.version) is not int
            or candidate.version != approved_version
            or candidate.is_fallback):
        raise ValueError("candidate_not_approved")
    return client.update_prompt(
        name=candidate.name,
        version=candidate.version,
        new_labels=["production"],
    )
```

This function checks that the candidate's name and version match the approval record. The calling workflow must authenticate the approval, verify the target project and coordinate concurrent label changes. Read back the label afterward and check application propagation as described below. An API error can occur after the server applies a change, so reconcile registry state before retrying.

**Rollback verification:** applications can continue using the previous prompt after a label changes. [Langfuse's prompt cache](https://langfuse.com/docs/prompt-management/features/caching) has a default TTL of 60 seconds and can return an expired entry while fetching a new value in the background. The deployed SDK version, TTL settings, failed refreshes, fallback prompts and requests already in progress affect when the change takes effect.

The function below reads the version assigned to `production` directly from the registry, bypassing its local cache. It uses the [`get_prompt` implementation](https://raw.githubusercontent.com/langfuse/langfuse-python/main/langfuse/_client/client.py) checked on 2026-09-19; pin your SDK version and verify its arguments and return value. Supply a client authenticated to the intended project and the recovery version from the approved change record.

This read does not clear other processes' caches. A successful result still requires a separate check that applications use the restored version to serve requests.

```python
# registry_label_check.py
def confirm_registry_target(client, *, prompt_name, expected_version):
    """Read registry state only; this does not verify recovered traffic."""
    if not isinstance(prompt_name, str) or not prompt_name.strip():
        raise ValueError("prompt_name_required")
    if type(expected_version) is not int or expected_version < 1:
        raise ValueError("positive_integer_version_required")
    prompt = client.get_prompt(
        prompt_name, label="production", cache_ttl_seconds=0, fallback=None
    )
    if (prompt.name != prompt_name or prompt.is_fallback
            or type(prompt.version) is not int
            or prompt.version != expected_version):
        raise ValueError("registry_target_not_confirmed")
    return {
        "prompt_name": prompt.name,
        "registry_version": prompt.version,
        "traffic_recovery_verified": False,
    }
```

Next, check the version used by each application group in the rollout, along with request counts, errors and latency. Inspect requests in progress and fallback behavior as well. When observations are missing or stale, continue incident response until the [rollback plan](./governance-automation.md#rollback-plan-required) exit criteria are met. The function above only performs the registry lookup.

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

- **Prompt Versions**: Create a static snapshot with `CreatePromptVersion` and retain its returned version ARN.
- **Environment Mapping**: Store `PROD`/`STAGING` → version ARN in the application's actual configuration system. The inspected Bedrock Prompt management API model has no `CreatePromptAlias` or `UpdatePromptAlias` operation.
- **IAM Integration**: Configure and verify permissions for the actual prompt operations and resources.
- **CloudTrail**: Audit supported prompt-management operations. Audit the separate configuration change that moves application traffic in that configuration system.

The function below calls [CreatePromptVersion](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_CreatePromptVersion.html) and returns the version ARN from its response. Supply a `bedrock-agent` client authenticated to the intended account and Region, and the unversioned ARN returned by prompt creation or lookup. A prompt's human-readable name cannot replace the ID in that ARN. The example checks commercial-partition (`arn:aws`) ARNs; configure credentials and permissions before running it.

```python
# bedrock_prompt_version.py
import re


def validate_client_token(value):
    if (not isinstance(value, str) or not 33 <= len(value) <= 256
            or re.fullmatch(r"[A-Za-z0-9](?:-*[A-Za-z0-9])*", value) is None):
        raise ValueError("invalid_client_token")


def snapshot_prompt(bedrock, prompt_arn, *, description, client_token):
    """Create a candidate snapshot; do not change application configuration."""
    match = re.fullmatch(
        r"arn:aws:bedrock:[a-z0-9-]{1,20}:[0-9]{12}:prompt/([A-Za-z0-9]{10})",
        prompt_arn if isinstance(prompt_arn, str) else "",
    )
    if match is None:
        raise ValueError("expected_unversioned_prompt_arn")
    if not isinstance(description, str) or not 1 <= len(description) <= 200:
        raise ValueError("invalid_description")
    validate_client_token(client_token)
    response = bedrock.create_prompt_version(
        promptIdentifier=prompt_arn,
        description=description,
        clientToken=client_token,
    )
    version = response.get("version")
    if (not isinstance(version, str)
            or re.fullmatch(r"[1-9][0-9]{0,4}", version) is None
            or response.get("id") != match[1]
            or response.get("arn") != f"{prompt_arn}:{version}"):
        raise ValueError("unexpected_prompt_version_response")
    return {
        "prompt_id": response["id"],
        "version": version,
        "version_arn": response["arn"],
    }
```

Save `client_token` with the original request and reuse it only when retrying the same operation and inputs. Keep the returned `version_arn` with the evaluation results and approval record.

After evaluation and approval, map `PROD` to that ARN in the application configuration. Use the configuration system to control access and concurrent changes, record the change, and read back the saved value. The function above implements candidate creation only. Rollback also requires restoring an approved ARN and checking application behavior and traffic health.

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
| **Labels/Alias** | ✅ | ✅ | ❌ | Application-owned version-ARN mapping |
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

This new-install example uses [chart 2.1.1](https://github.com/langfuse/langfuse-k8s/releases/tag/langfuse-2.1.1), appVersion `4.35.0` and its [versioned values](https://github.com/langfuse/langfuse-k8s/blob/7e60f0985d36f0d4f68c0e09fd5b6da9c362fdd4/charts/langfuse/values.yaml). Provision the backing services first. An upgrade from chart 1.x needs a separate migration procedure. Replace the `.invalid` endpoints, example ports and region with settings reviewed for the deployment environment.

Choose and record the target Kubernetes context and namespace (for example, `langfuse`) before deployment. Prepare these dependencies separately:

- Prepare PostgreSQL with the `langfuse` database, user and compatible schema.
- Prepare a Redis/Valkey user and TLS endpoint, and configure the `noeviction` policy.
- Prepare an external, non-clustered ClickHouse database and user, with HTTPS and native TLS endpoints.
- Grant access to the event, export and media prefixes in an S3-compatible bucket. Check endpoint, region and path-style settings, plus browser access and CORS for media.
- Create the `langfuse-runtime` Secret in the release namespace with all eight keys referenced below. Supply backing-service credentials, a 64-hex-character encryption key, and securely generated salt and NextAuth secret. Preserve application keys across redeployments. The Redis password enters a connection URL, so follow the encoding requirements for special characters.

This example disables automatic PostgreSQL and ClickHouse migrations. Complete the approved schema migrations before starting the application. Check certificate trust for each service as well. PostgreSQL's `sslmode=require` requests TLS; review server-certificate verification separately for the environment.

```yaml
# langfuse-values.yaml
# Chart: langfuse/langfuse 2.1.1; appVersion: 4.35.0
langfuse:
  image:
    tag: "4.35.0"
  replicas: 2
  resources:
    requests: {cpu: "500m", memory: "1Gi"}
    limits: {cpu: "2000m", memory: "4Gi"}
  salt:
    secretKeyRef: {name: langfuse-runtime, key: salt}
  encryptionKey:
    secretKeyRef: {name: langfuse-runtime, key: encryption-key}
  nextauth:
    url: "https://langfuse.example.invalid"
    secret:
      secretKeyRef: {name: langfuse-runtime, key: nextauth-secret}

postgresql:
  deploy: false
  host: postgresql.example.invalid
  port: 5432
  args: "sslmode=require"
  auth:
    username: langfuse
    database: langfuse
    existingSecret: langfuse-runtime
    secretKeys: {userPasswordKey: postgresql-password}
  migration: {autoMigrate: false}

redis:
  deploy: false
  host: redis.example.invalid
  port: 6379
  tls: {enabled: true}
  auth:
    username: "default"
    existingSecret: langfuse-runtime
    existingSecretPasswordKey: redis-password

clickhouse:
  deploy: false
  host: "https://clickhouse.example.invalid"
  httpPort: 8443
  nativePort: 9440
  database: langfuse
  cluster: {enabled: false}
  auth:
    username: langfuse
    existingSecret: langfuse-runtime
    existingSecretKey: clickhouse-password
  migration: {ssl: true, autoMigrate: false}

s3:
  deploy: false
  storageProvider: s3
  bucket: langfuse-prompts
  region: us-east-1
  endpoint: "https://object-store.example.invalid"
  forcePathStyle: true
  accessKeyId:
    secretKeyRef: {name: langfuse-runtime, key: s3-access-key-id}
  secretAccessKey:
    secretKeyRef: {name: langfuse-runtime, key: s3-secret-access-key}
  eventUpload: {prefix: "events/"}
  batchExport: {enabled: true, prefix: "exports/"}
  mediaUpload: {enabled: true, prefix: "media/"}
```

`deploy: false` disables the chart's bundled PostgreSQL, Valkey, SeaweedFS and ClickHouse/Keeper deployments. The application uses the external databases, users, buckets and Secret prepared earlier.

The shared replica and resource settings apply to both the web and worker Deployments. This gives two web pods and two worker pods, with the listed resources allocated per pod. Adjust these example values for the workload; they are not measured sizing recommendations. Size the backing services separately.

The release has [template checks](https://github.com/langfuse/langfuse-k8s/blob/7e60f0985d36f0d4f68c0e09fd5b6da9c362fdd4/charts/langfuse/templates/validations.yaml), but no top-level `values.schema.json`. Review against this exact chart and keep the chart version fixed in the deployment configuration. Ingress/TLS termination, access policy, Secret existence, connectivity, schema compatibility and application health still require environment validation. This reference was checked offline; it has not been installed or rendered with Helm.

### Bedrock Prompt Management Setup

First create a draft with [CreatePrompt](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_CreatePrompt.html), then create a version with `snapshot_prompt` above. `defaultVariant` names the selected variant, which stores the template, `modelId` and inference settings together.

Supply the model or inference-profile ID approved for the intended account and Region. Confirm that the model supports the `TEXT` template and the example's `temperature=0.2` and `maxTokens=1024` settings. Successful prompt creation still requires separate checks for model access, inference compatibility and response quality.

```python
# bedrock_prompt_setup.py
from bedrock_prompt_version import snapshot_prompt, validate_client_token


def create_initial_prompt_version(
    bedrock, *, model_id, prompt_text, create_token, snapshot_token
):
    """Create a model-bound draft and return its candidate version descriptor."""
    if not isinstance(model_id, str) or not model_id.strip():
        raise ValueError("model_id_required")
    if not isinstance(prompt_text, str) or not prompt_text.strip():
        raise ValueError("prompt_text_required")
    validate_client_token(create_token)
    validate_client_token(snapshot_token)
    draft = bedrock.create_prompt(
        name="financial-analysis",
        description="Financial analysis expert prompt",
        defaultVariant="default",
        variants=[{
            "name": "default",
            "modelId": model_id,
            "templateType": "TEXT",
            "templateConfiguration": {"text": {"text": prompt_text}},
            "inferenceConfiguration": {
                "text": {"temperature": 0.2, "maxTokens": 1024}
            },
        }],
        clientToken=create_token,
    )
    return snapshot_prompt(
        bedrock, draft["arn"], description="Initial candidate snapshot",
        client_token=snapshot_token,
    )
```

Pass the reviewed financial-analysis instruction as `prompt_text`, for example “You are a financial analysis expert...”. Save separate `create_token` and `snapshot_token` values with their original request inputs before execution. If you store the result in `candidate`, use `candidate["version_arn"]` in the proposed `PROD` configuration. Evaluate and approve the returned version before deployment instead of hardcoding version `1`.

If version creation fails, the draft may already exist. Keep the original inputs and tokens, and check the current state before retrying. The two API calls do not succeed or roll back as a single operation.

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
