---
title: "提示词·模型注册中心"
sidebar_label: "提示词·模型注册中心"
description: "Langfuse、PromptLayer、Braintrust、AWS Bedrock Prompt Management 比较及构建指南"
tags: [prompt-registry, versioning, langfuse, bedrock, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 提示词·模型注册中心

## 为什么需要提示词注册中心

像管理代码一样管理提示词和模型版本的中央存储库。解决以下问题：

- **版本追踪**："昨天还好今天就不对了" → 追踪哪个提示词发生了变更
- **按环境部署**：staging/canary/production 环境使用不同版本
- **回滚**：问题发生时立即恢复到上一版本
- **审计证据**：金融·医疗监管对应的变更历史保存

---

## Langfuse Prompt

[Langfuse](https://langfuse.com/) 是可以 self-hosted 的 LLMOps 平台。提示词注册中心功能：

- **版本管理**：每次变更自动递增版本(`v1`, `v2`, ...)
- **标签**：按 `production`、`staging`、`canary` 为不同环境打标签
- **Rollout 管理**：为特定标签绑定特定版本后，应用程序仅引用标签(`get_prompt("financial-analysis", label="production")`)
- **Diff 查看**：可视化版本间的变更内容
- **Access Log**：追踪哪个会话使用了哪个提示词版本

```python
from langfuse import Langfuse

client = Langfuse()

# 查询提示词版本
prompt = client.get_prompt("financial-analysis", label="production")
print(prompt.version)  # 例：5
print(prompt.prompt)   # 实际文本

# 部署新版本
client.create_prompt(
    name="financial-analysis",
    prompt="你是保守型投资顾问...",
    labels=["staging"]  # 先部署到 staging
)
# 验证后
client.update_prompt_label("financial-analysis", version=6, label="production")
```

**优点**：
- Self-hosted，支持 RBAC、S3+KMS 后端
- 与 Observability 集成（trace 中自动记录提示词版本）

**缺点**：
- 以 Python SDK 为中心（TypeScript SDK 存在但功能受限）
- UI 简单（可以看 diff 但没有审批工作流）

---

## PromptLayer

[PromptLayer](https://promptlayer.com/) 是 SaaS 提示词注册中心。

- **版本标签**：Git 风格标签(`v1.0`, `v1.1-alpha`)
- **Visual Diff**：按单词突出显示两个版本间的变更
- **A/B 实验**：同时部署两个版本并比较性能
- **Analytics**：按版本显示 latency、token 使用、错误率仪表板

**优点**：
- 无需安装即可使用
- 团队协作功能（评论、审批工作流）

**缺点**：
- 仅 SaaS（不支持本地部署）
- 数据主权问题（提示词存储在外部服务器）

---

## Braintrust Prompts

[Braintrust](https://www.braintrust.dev/) 是评估(Evaluation)平台，但也提供提示词管理功能。

- **Playground**：编写提示词 → 立即用测试集评估
- **Versioning**：自动版本递增 + commit message
- **Datasets 集成**：提示词变更时自动触发 evaluation run
- **Experimentation**：side-by-side 比较两个提示词版本

**优点**：
- 评估和提示词管理在一个平台
- 每次变更自动进行质量回归检查

**缺点**：
- 在开发·测试阶段更具优势，而非运行时部署
- Production rollout 功能较弱（需要自行实现）

---

## AWS Bedrock Prompt Management

AWS Bedrock 提供 [Prompt Management](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html) 功能（2024年11月 GA）。

- **Prompt 版本**：通过 `CreatePromptVersion` API 创建不可变版本
- **Alias**：将 `PROD`、`STAGING` 等 alias 连接到版本
- **IAM 集成**：设置策略使其仅能使用特定版本
- **CloudTrail**：审计日志记录谁在何时部署了哪个版本

```python
import boto3

bedrock = boto3.client('bedrock-agent')

# 创建新版本
response = bedrock.create_prompt_version(
    promptIdentifier='arn:aws:bedrock:us-east-1:123456789012:prompt/fin-analysis',
    description='改为保守型投资顾问风格'
)
version_id = response['version']

# 更新 production alias
bedrock.update_prompt_alias(
    promptIdentifier='arn:aws:bedrock:us-east-1:123456789012:prompt/fin-analysis',
    aliasIdentifier='PROD',
    promptVersion=version_id
)
```

**优点**：
- AWS 原生，与 IAM/CloudTrail/KMS 集成
- 可从 Lambda、Step Functions 直接引用

**缺点**：
- 前提是使用 Bedrock 模型（Claude、Llama 等）
- self-hosted LLM（vLLM、llm-d）需要单独配置

---

## 比较表

| 功能 | Langfuse | PromptLayer | Braintrust | Bedrock PM |
|------|----------|-------------|------------|------------|
| **部署方式** | Self-hosted | SaaS | SaaS | AWS Managed |
| **版本管理** | ✅ | ✅ | ✅ | ✅ |
| **标签/Alias** | ✅ | ✅ | ❌ | ✅ |
| **Visual Diff** | 基本 | ✅ | ✅ | ❌ |
| **审批工作流** | ❌ | ✅ | ❌ | ❌(通过IAM实现) |
| **A/B 实验** | 手动 | ✅ | ✅ | 手动 |
| **自动评估集成** | 可（基于trace） | ❌ | ✅ | 可（Lambda） |
| **数据主权** | ✅ | ❌ | ❌ | ✅(区域内) |
| **AIDLC 适配性** | **⭐ 高** | 中（SaaS） | 高（以Eval为中心） | 高（Bedrock专用） |

**AIDLC 推荐**：**Langfuse**（self-hosted 要求）或 **AWS Bedrock PM**（使用 Bedrock 时）。PromptLayer/Braintrust 在允许 SaaS 时使用。

---

## 构建指南

### Langfuse Self-hosted 部署

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

### Bedrock Prompt Management 设置

```python
import boto3

bedrock = boto3.client('bedrock-agent', region_name='us-east-1')

# 1. 创建提示词
prompt_response = bedrock.create_prompt(
    name='financial-analysis',
    description='金融分析专家提示词',
    variants=[{
        'name': 'default',
        'templateType': 'TEXT',
        'templateConfiguration': {
            'text': {
                'text': '你是金融分析专家...'
            }
        }
    }]
)
prompt_arn = prompt_response['arn']

# 2. 创建版本
version_response = bedrock.create_prompt_version(
    promptIdentifier=prompt_arn,
    description='v1 初始版本'
)

# 3. 创建 PROD alias
bedrock.create_prompt_alias(
    promptIdentifier=prompt_arn,
    name='PROD',
    promptVersion='1'
)
```

---

## 参考资料

- **Langfuse Prompts**: [langfuse.com/docs/prompts](https://langfuse.com/docs/prompts)
- **PromptLayer**: [promptlayer.com](https://promptlayer.com/)
- **Braintrust Prompts**: [braintrust.dev/docs/guides/prompts](https://www.braintrust.dev/docs/guides/prompts)
- **AWS Bedrock Prompt Management**: [AWS 文档](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html)

---

## 下一步

构建提示词注册中心后：

1. **[部署策略](./deployment-strategies.md)** — 选择并实现 Canary/Shadow/A-B 策略
2. **[治理·自动化](./governance-automation.md)** — 构建自动回归检测和回滚体系
3. **[Evaluation Framework](../../toolchain/evaluation-framework.md)** — 集成基于 Golden Dataset 的评估
