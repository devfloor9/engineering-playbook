---
title: "프롬프트·모델 레지스트리"
sidebar_label: "프롬프트·모델 레지스트리"
description: "Langfuse, PromptLayer, Braintrust, AWS Bedrock Prompt Management 비교 및 구축 가이드"
tags: [prompt-registry, versioning, langfuse, bedrock, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 프롬프트·모델 레지스트리

## 왜 프롬프트 레지스트리가 필요한가

프롬프트와 모델 버전을 코드처럼 관리하는 중앙 저장소. 다음 문제를 해결한다:

- **버전 추적**: "어제 잘 됐는데 오늘 이상해요" → 어떤 프롬프트가 변경되었는지 추적
- **환경별 배포**: staging/canary/production 환경마다 다른 버전 사용
- **롤백**: 문제 발생 시 이전 버전으로 즉시 복구
- **감사 증빙**: 금융·의료 규제 대응을 위한 변경 이력 보관

---

## Langfuse Prompt

[Langfuse](https://langfuse.com/)는 self-hosted 가능한 LLMOps 플랫폼이다. 프롬프트 레지스트리 기능:

- **버전 관리**: 매 변경마다 자동 버전 증가(`v1`, `v2`, ...)
- **라벨**: `production`, `staging`, `canary`로 환경별 라벨 부여
- **Rollout 관리**: 특정 라벨을 특정 버전에 붙이면 애플리케이션은 라벨만 참조(`get_prompt("financial-analysis", label="production")`)
- **Diff 보기**: 버전 간 변경 내용 시각화
- **Access Log**: 어떤 세션이 어떤 프롬프트 버전을 사용했는지 추적

```python
from langfuse import Langfuse

client = Langfuse()

# 프롬프트 버전 조회
prompt = client.get_prompt("financial-analysis", label="production")
print(prompt.version)  # 예: 5
print(prompt.prompt)   # 실제 텍스트

# 새 버전 배포
client.create_prompt(
    name="financial-analysis",
    prompt="당신은 보수적 투자 자문가입니다...",
    labels=["staging"]  # 먼저 staging에 배포
)
# 검증 후
client.update_prompt_label("financial-analysis", version=6, label="production")
```

**장점**:
- Self-hosted, RBAC, S3+KMS 백엔드 가능
- Observability와 통합(trace에서 프롬프트 버전 자동 기록)

**단점**:
- Python SDK 중심(TypeScript SDK는 있지만 기능 제한적)
- UI는 단순(diff는 보이지만 승인 워크플로 없음)

---

## PromptLayer

[PromptLayer](https://promptlayer.com/)는 SaaS 프롬프트 레지스트리다.

- **버전 태깅**: Git 스타일 태그(`v1.0`, `v1.1-alpha`)
- **Visual Diff**: 두 버전 간 단어 단위 변경 강조
- **A/B 실험**: 두 버전을 동시 배포하고 성능 비교
- **Analytics**: 버전별 latency, 토큰 사용, 에러율 대시보드

**장점**:
- 설치 없이 즉시 사용
- 팀 협업 기능(댓글, 승인 워크플로)

**단점**:
- SaaS 전용(온프레미스 불가)
- 데이터 주권 이슈(프롬프트가 외부 서버에 저장)

---

## Braintrust Prompts

[Braintrust](https://www.braintrust.dev/)는 평가(Evaluation) 플랫폼이지만 프롬프트 관리 기능도 제공한다.

- **Playground**: 프롬프트 작성 → 즉시 테스트 세트로 평가
- **Versioning**: 자동 버전 증가 + commit message
- **Datasets 연동**: 프롬프트 변경 시 자동으로 evaluation run 트리거
- **Experimentation**: 두 프롬프트 버전을 side-by-side 비교

**장점**:
- 평가와 프롬프트 관리가 하나의 플랫폼
- 매 변경마다 자동으로 품질 회귀 체크

**단점**:
- 런타임 배포보다는 개발·테스트 단계에 강점
- Production rollout 기능은 약함(직접 구현 필요)

---

## AWS Bedrock Prompt Management

AWS Bedrock는 [Prompt Management](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html) 기능을 제공한다(2024년 11월 GA).

- **Prompt 버전**: `CreatePromptVersion` API로 immutable 버전 생성
- **Alias**: `PROD`, `STAGING` 같은 alias를 버전에 연결
- **IAM 통합**: 특정 버전만 사용 가능하도록 정책 설정
- **CloudTrail**: 누가 언제 어떤 버전을 배포했는지 감사 로그

```python
import boto3

bedrock = boto3.client('bedrock-agent')

# 새 버전 생성
response = bedrock.create_prompt_version(
    promptIdentifier='arn:aws:bedrock:us-east-1:123456789012:prompt/fin-analysis',
    description='보수적 투자 자문 스타일로 변경'
)
version_id = response['version']

# 프로덕션 alias 업데이트
bedrock.update_prompt_alias(
    promptIdentifier='arn:aws:bedrock:us-east-1:123456789012:prompt/fin-analysis',
    aliasIdentifier='PROD',
    promptVersion=version_id
)
```

**장점**:
- AWS 네이티브, IAM/CloudTrail/KMS 통합
- Lambda, Step Functions에서 직접 참조 가능

**단점**:
- Bedrock 모델 사용 전제(Claude, Llama 등)
- self-hosted LLM(vLLM, llm-d)과는 별도 구성 필요

---

## 비교표

| 기능 | Langfuse | PromptLayer | Braintrust | Bedrock PM |
|------|----------|-------------|------------|------------|
| **배포 방식** | Self-hosted | SaaS | SaaS | AWS Managed |
| **버전 관리** | ✅ | ✅ | ✅ | ✅ |
| **라벨/Alias** | ✅ | ✅ | ❌ | ✅ |
| **Visual Diff** | 기본 | ✅ | ✅ | ❌ |
| **승인 워크플로** | ❌ | ✅ | ❌ | ❌(IAM으로 구현) |
| **A/B 실험** | 수동 | ✅ | ✅ | 수동 |
| **자동 평가 연동** | 가능(trace 기반) | ❌ | ✅ | 가능(Lambda) |
| **데이터 주권** | ✅ | ❌ | ❌ | ✅(리전 내) |
| **AIDLC 적합성** | **⭐ 높음** | 중간(SaaS) | 높음(Eval 중심) | 높음(Bedrock 전용) |

**AIDLC 권장**: **Langfuse**(self-hosted 요구사항) 또는 **AWS Bedrock PM**(Bedrock 사용 시). PromptLayer/Braintrust는 SaaS 허용 시.

---

## 구축 가이드

### Langfuse Self-hosted 배포

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

### Bedrock Prompt Management 설정

```python
import boto3

bedrock = boto3.client('bedrock-agent', region_name='us-east-1')

# 1. 프롬프트 생성
prompt_response = bedrock.create_prompt(
    name='financial-analysis',
    description='금융 분석 전문가 프롬프트',
    variants=[{
        'name': 'default',
        'templateType': 'TEXT',
        'templateConfiguration': {
            'text': {
                'text': '당신은 금융 분석 전문가입니다...'
            }
        }
    }]
)
prompt_arn = prompt_response['arn']

# 2. 버전 생성
version_response = bedrock.create_prompt_version(
    promptIdentifier=prompt_arn,
    description='v1 초기 버전'
)

# 3. PROD alias 생성
bedrock.create_prompt_alias(
    promptIdentifier=prompt_arn,
    name='PROD',
    promptVersion='1'
)
```

---

## 참고 자료

- **Langfuse Prompts**: [langfuse.com/docs/prompts](https://langfuse.com/docs/prompts)
- **PromptLayer**: [promptlayer.com](https://promptlayer.com/)
- **Braintrust Prompts**: [braintrust.dev/docs/guides/prompts](https://www.braintrust.dev/docs/guides/prompts)
- **AWS Bedrock Prompt Management**: [AWS 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-management.html)

---

## 다음 단계

프롬프트 레지스트리를 구축했다면:

1. **[배포 전략](./deployment-strategies.md)** — Canary/Shadow/A-B 전략 선택 및 구현
2. **[거버넌스·자동화](./governance-automation.md)** — 자동 회귀 감지 및 롤백 체계 구축
3. **[Evaluation Framework](../../toolchain/evaluation-framework.md)** — Golden Dataset 기반 평가 연동
