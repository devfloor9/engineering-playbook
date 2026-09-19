---
title: 프롬프트·모델 레지스트리
description: Langfuse, PromptLayer, Braintrust, AWS Bedrock Prompt Management 비교 및 구축 가이드
created: "2026-04-18"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 12
tags:
  - prompt-registry
  - versioning
  - langfuse
  - bedrock
  - scope:enterprise
sidebar_label: 프롬프트·모델 레지스트리
---

## 왜 프롬프트 레지스트리가 필요한가

프롬프트와 모델 버전을 코드처럼 관리하는 중앙 저장소. 다음 문제를 해결한다:

- **버전 추적**: "어제 잘 됐는데 오늘 이상해요" → 어떤 프롬프트가 변경되었는지 추적
- **환경별 배포**: staging/canary/production 환경마다 다른 버전 사용
- **롤백**: 승인된 이전 버전으로 라벨이나 환경 설정을 되돌리고, 애플리케이션이 그 버전을 사용하는지와 오류율·지연이 회복됐는지 확인한다.
- **감사 증빙**: 금융·의료 규제 대응을 위한 변경 이력 보관

---

## Langfuse Prompt

[Langfuse](https://langfuse.com/)는 self-hosted 가능한 LLMOps 플랫폼이다. 프롬프트 레지스트리 기능:

- **버전 관리**: 매 변경마다 자동 버전 증가(`v1`, `v2`, ...)
- **라벨**: `production`, `staging`, `canary`로 환경별 라벨 부여
- **Rollout 관리**: 특정 라벨을 특정 버전에 붙이면 애플리케이션은 라벨만 참조(`get_prompt("financial-analysis", label="production")`)
- **Diff 보기**: 버전 간 변경 내용 시각화
- **Access Log**: 어떤 세션이 어떤 프롬프트 버전을 사용했는지 추적

아래 예제는 [Langfuse Python SDK 4.15.3](https://github.com/langfuse/langfuse-python/blob/49b8f9e7f2767295c7b61809e943813d202d10ee/langfuse/_client/client.py#L4119-L4224) 기준이다. 대상 프로젝트에 인증된 client로 새 버전을 등록하고, 반환값을 `candidate`에 보관한다. 평가와 배포 승인은 등록 후 별도로 진행한다.

```python
from langfuse import Langfuse

client = Langfuse()

# 프롬프트 버전 조회
prompt = client.get_prompt("financial-analysis", label="production")
print(prompt.version)  # 예: 5
print(prompt.prompt)   # 실제 텍스트

# staging 후보 등록
candidate = client.create_prompt(
    name="financial-analysis",
    prompt="당신은 보수적 투자 자문가입니다...",
    labels=["staging"]
)
```

`candidate.name`과 `candidate.version`을 프로젝트 식별 정보 및 평가 기록과 함께 저장한다. 다른 작성자가 중간에 새 버전을 만들 수 있으므로 “다음 버전은 6”이라고 가정하지 말고, 실제 반환된 버전을 평가한다.

배포 절차에서 평가 증거와 대상 프로젝트·이름·버전의 승인을 확인한 뒤 아래 함수를 호출한다. `approved_name`과 `approved_version`에는 확인한 승인 기록의 값을 전달한다.

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

이 함수가 검사하는 것은 후보와 승인 기록의 이름·버전 일치 여부다. 승인 기록의 진위, 대상 프로젝트, 동시에 들어오는 라벨 변경은 호출 측 배포 절차에서 확인하고 제어해야 한다. 변경 후에는 라벨을 다시 읽고 아래 절차로 애플리케이션에 반영됐는지 확인한다. API 오류가 나도 서버에서 변경이 적용됐을 수 있으므로, 재시도 전에 레지스트리 상태를 확인한다.

**롤백 확인:** 라벨을 바꿔도 애플리케이션은 잠시 이전 프롬프트를 사용할 수 있다. [Langfuse의 프롬프트 캐시](https://langfuse.com/docs/prompt-management/features/caching)는 기본 TTL이 60초이며, 만료 후에도 백그라운드에서 새 값을 가져오는 동안 기존 값을 반환할 수 있다. 실제 반영 시점은 SDK 버전, TTL 설정, 갱신 실패, 대체 프롬프트(fallback), 이미 처리 중인 요청에 따라 달라진다.

아래 함수는 캐시를 거치지 않고 레지스트리에서 `production` 라벨의 버전을 읽는다. 2026-09-19에 확인한 [`get_prompt` 구현](https://raw.githubusercontent.com/langfuse/langfuse-python/main/langfuse/_client/client.py)을 기준으로 작성했으므로, 사용할 SDK 버전을 고정하고 인자와 반환값을 확인한다. 대상 프로젝트에 인증된 client와 변경 기록에서 승인한 복구 버전을 전달한다.

이 조회는 다른 프로세스의 캐시를 지우지 않는다. 함수가 성공해도 애플리케이션이 복구 버전으로 요청을 처리하는지는 별도로 확인해야 한다.

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

레지스트리를 확인한 뒤에는 배포 대상 애플리케이션 그룹별로 실제 사용한 버전과 요청 수·오류율·지연을 확인한다. 처리 중인 작업과 대체 프롬프트의 동작도 살핀다. 관측값이 없거나 오래되었으면 [롤백 계획](./governance-automation.md#롤백-계획-필수)의 종료 기준을 충족할 때까지 장애 대응을 계속한다. 위 함수는 이 과정에서 레지스트리 조회만 담당한다.

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

- **Prompt 버전**: `CreatePromptVersion`으로 정적 snapshot을 만들고 응답의 버전 ARN을 보존한다.
- **환경 매핑**: 애플리케이션 설정에 `PROD`나 `STAGING`이 사용할 버전 ARN을 저장한다. 확인한 Bedrock Prompt management API 모델에는 `CreatePromptAlias`와 `UpdatePromptAlias` 작업이 없다.
- **IAM 통합**: 사용할 프롬프트 API와 리소스에 필요한 권한을 구성하고 검증한다.
- **CloudTrail**: 지원되는 프롬프트 관리 API의 호출 기록을 남긴다. 애플리케이션이 사용할 버전을 바꾸는 설정 변경은 해당 설정 시스템에서도 기록한다.

아래 함수는 [CreatePromptVersion](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_CreatePromptVersion.html)을 호출하고 응답에 담긴 버전 ARN을 반환한다. 대상 계정·리전에 인증된 `bedrock-agent` client와 프롬프트 생성·조회에서 받은 버전 없는 ARN을 전달한다. 사람이 붙인 프롬프트 이름은 ARN의 ID 자리에 사용할 수 없다. 예제는 상용 파티션(`arn:aws`)의 ARN을 검사하며, 자격 증명과 권한 설정은 실행 전에 완료해야 한다.

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

`client_token`을 원래 요청과 함께 보관하고, 동일한 작업과 입력을 재시도할 때만 재사용한다. 반환된 `version_arn`은 평가 결과·승인 기록과 함께 보관한다.

평가와 승인을 마치면 애플리케이션 설정의 `PROD`를 해당 ARN에 연결한다. 설정 시스템에서 접근 권한과 동시 변경을 제어하고, 변경을 기록한 뒤 저장된 값을 다시 읽어 확인한다. 위 함수는 후보 버전을 만드는 단계까지만 구현한다. 롤백할 때도 이전에 승인한 ARN을 복원한 뒤 애플리케이션과 트래픽의 상태를 확인해야 한다.

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
| **라벨/Alias** | ✅ | ✅ | ❌ | 애플리케이션의 버전 ARN 매핑 |
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

다음은 [chart 2.1.1](https://github.com/langfuse/langfuse-k8s/releases/tag/langfuse-2.1.1), appVersion `4.35.0`의 [values](https://github.com/langfuse/langfuse-k8s/blob/7e60f0985d36f0d4f68c0e09fd5b6da9c362fdd4/charts/langfuse/values.yaml)를 사용한 신규 설치 예시다. 저장소 서비스는 미리 준비한다. chart 1.x에서 업그레이드할 때는 별도의 마이그레이션 절차가 필요하다. `.invalid` 주소와 예시 포트·리전은 배포할 환경의 값으로 바꾼다.

배포 전에 대상 Kubernetes context와 namespace(예: `langfuse`)를 정하고 기록한다. 다음 의존성을 별도로 준비한다.

- PostgreSQL에 `langfuse` 데이터베이스·사용자와 호환 스키마를 준비한다.
- Redis/Valkey에 사용할 사용자와 TLS endpoint를 준비하고 `noeviction` 정책을 설정한다.
- 외부 비클러스터 ClickHouse에 데이터베이스·사용자, HTTPS와 native TLS endpoint를 준비한다.
- S3 호환 버킷에 event·export·media prefix 접근 권한을 부여한다. endpoint·리전·path-style 설정과 media의 브라우저 접근·CORS도 확인한다.
- release namespace에 `langfuse-runtime` Secret을 만들고 아래 설정에서 참조하는 키 8개를 넣는다. 저장소 자격 증명, 64자리 16진수 encryption key, 안전하게 생성한 salt·NextAuth secret이 필요하다. 애플리케이션 키는 재배포해도 유지한다. Redis 비밀번호는 연결 URL에 들어가므로 특수문자의 인코딩 요구사항을 따른다.

이 예시는 PostgreSQL과 ClickHouse의 자동 마이그레이션을 끈다. 애플리케이션을 시작하기 전에 승인된 스키마 마이그레이션을 완료한다. 각 서비스의 인증서 신뢰 설정도 확인한다. PostgreSQL의 `sslmode=require`는 TLS를 요청하는 설정이며, 서버 인증서 검증 방식은 환경에 맞게 추가로 확인해야 한다.

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

`deploy: false`로 PostgreSQL·Valkey·SeaweedFS·ClickHouse/Keeper의 chart 내부 배포를 끈다. 외부 데이터베이스·사용자·버킷과 Secret은 앞서 준비한 것을 사용한다.

공통 replica·resource 설정은 web과 worker Deployment 각각에 적용된다. 따라서 이 예시에는 web Pod 2개와 worker Pod 2개가 생기며, 리소스 값은 Pod 하나당 값이다. 이 값은 측정된 권장 사양이 아니므로 부하에 맞게 조정한다. 저장소 용량도 따로 산정한다.

이 release에는 [template 검사](https://github.com/langfuse/langfuse-k8s/blob/7e60f0985d36f0d4f68c0e09fd5b6da9c362fdd4/charts/langfuse/templates/validations.yaml)가 있지만 최상위 `values.schema.json`은 없다. 정확히 이 chart를 기준으로 검토하고 배포 구성에서도 chart 버전을 고정한다. Ingress·TLS 종료, 접근 정책, Secret 존재 여부, 연결, 스키마 호환성 및 애플리케이션 상태는 환경에서 추가 검증해야 한다. 이 참조 구성은 오프라인으로만 검사했으며 Helm으로 설치하거나 렌더링하지 않았다.

### Bedrock Prompt Management 설정

먼저 [CreatePrompt](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_CreatePrompt.html)로 초안을 만들고, 위의 `snapshot_prompt` 함수로 버전을 생성한다. `defaultVariant`는 사용할 variant의 이름이며, 해당 variant에는 프롬프트 템플릿과 `modelId`, 추론 설정이 함께 저장된다.

대상 계정·리전에서 승인된 모델 또는 inference profile ID를 전달한다. 선택한 모델이 `TEXT` 템플릿과 예시의 `temperature=0.2`, `maxTokens=1024`를 지원하는지 확인한다. 프롬프트 생성이 성공해도 모델 호출 권한, 추론 호환성, 응답 품질은 별도로 검증해야 한다.

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

`prompt_text`에는 “당신은 금융 분석 전문가입니다...”처럼 검토한 금융 분석 지침을 전달한다. 실행 전에 `create_token`과 `snapshot_token`을 각각 원래 요청 입력과 함께 저장한다. 반환값을 `candidate`에 보관했다면 `candidate["version_arn"]`을 `PROD` 설정안에 사용한다. 버전 번호를 `1`로 고정하지 않고, 실제 반환된 버전을 평가·승인한 뒤 배포한다.

버전 생성이 실패해도 초안은 이미 만들어졌을 수 있다. 원래 요청과 토큰을 보관하고 현재 상태를 확인한 후 재시도한다. 두 API 호출 전체가 한 번에 성공하거나 취소되는 것은 아니다.

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
