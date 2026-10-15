---
title: 트러블슈팅 가이드
description: Inference Gateway 배포 및 운영 중 발생하는 일반적인 문제와 해결 방법
created: "2026-04-18"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 11
tags:
  - troubleshooting
  - debugging
  - kgateway
  - bifrost
  - scope:impl
sidebar_label: 3. 트러블슈팅
sidebar_position: 3
---

이 문서는 Inference Gateway 배포 및 운영 중 발생하는 일반적인 문제와 해결 방법을 다룹니다. 문제 발생 시 해당 섹션을 참조하여 빠르게 해결하세요.

---

## 1. 404 Not Found

**증상**: `http://<NLB_ENDPOINT>/v1/chat/completions` 요청 시 404

**진단**:
```bash
# HTTPRoute 상태 확인
kubectl get httproute -A

# Gateway 상태 확인
kubectl get gateway -n ai-gateway -o yaml

# kgateway 로그 확인
kubectl logs -n kgateway-system -l app=kgateway --tail=50
```

**일반적 원인**:
- HTTPRoute의 `parentRefs.namespace`가 Gateway 네임스페이스와 불일치
- Gateway 리스너의 `allowedRoutes`가 HTTPRoute의 네임스페이스를 허용하지 않아 라우트가 attach되지 않음
- ReferenceGrant가 누락되어 크로스 네임스페이스 백엔드 참조 불가
- `hostnames` 필드가 요청의 Host 헤더와 불일치

**해결 방법**:

1. **parent 상태 먼저 확인**: HTTPRoute의 `status.parents` 조건에서 `Accepted`와 `ResolvedRefs`가 모두 `True`인지 확인합니다. `Accepted=False`이면 리스너 attach(네임스페이스/hostname) 문제이고, `ResolvedRefs=False`이면 백엔드 참조(ReferenceGrant 포함) 문제입니다.
```bash
kubectl get httproute <route> -n <ns> -o jsonpath='{.status.parents[*].conditions[*].type}{"\n"}{.status.parents[*].conditions[*].status}'
```

2. **parentRefs 확인**:
```yaml
# HTTPRoute에서 Gateway 네임스페이스 명시
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Gateway가 있는 네임스페이스
```

3. **리스너 allowedRoutes에서 라우트 네임스페이스 허용**: HTTPRoute가 Gateway와 다른 네임스페이스에 있으면, Gateway 리스너가 해당 네임스페이스의 라우트를 허용해야 attach됩니다. ReferenceGrant는 리스너 attach가 아니라 크로스 네임스페이스 백엔드 참조에만 적용되므로 둘을 혼동하지 않습니다.
```yaml
# Gateway 리스너
spec:
  listeners:
    - name: http
      allowedRoutes:
        namespaces:
          from: Selector  # 또는 All
          selector:
            matchLabels:
              kubernetes.io/metadata.name: ai-gateway  # HTTPRoute가 있는 네임스페이스
```

4. **ReferenceGrant 생성** (백엔드가 다른 네임스페이스일 때만):
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-gateway-to-services
  namespace: ai-inference  # Service가 있는 네임스페이스
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: ai-gateway  # HTTPRoute가 있는 네임스페이스
  to:
    - group: ""
      kind: Service
```

5. **hostnames 검증**:
```bash
# 요청 시 Host 헤더 확인
curl -v http://<NLB_ENDPOINT>/v1/models

# HTTPRoute에 일치하는 hostname 추가
spec:
  hostnames:
    - "api.example.com"
    - "<NLB_ENDPOINT>"  # NLB DNS 이름도 추가
```

---

## 2. Bifrost provider/model 에러

**증상**: `Provider not found` 또는 `Model not found` 에러

**표 1. Provider/Model 에러 메시지별 원인과 해결**

| 에러 메시지 | 원인 | 해결 |
|------------|------|------|
| `Provider not found: vllm` | config.json에 provider 미등록 | `vllm` provider 추가 또는 `custom_provider_config`로 임의 이름 등록 |
| `Model not found: glm-5` | provider prefix 누락 | 요청 시 `openai/glm-5` 형태로 전송 |
| UI에서 설정 미표시 | providers가 배열로 작성됨 | `"providers": [...]` -> `"providers": {...}` (map) |
| OTel trace 미도착 | trace_type 오류 | 레거시 `"otel"` -> `"genai_extension"` (v1.5.0+ 필수) |
| Langfuse 403/401 | Authorization 포맷 오류 | `Basic <BASE64(public_key:secret_key)>` 확인 |

**올바른 config.json 포맷**:

```json
{
  "providers": {
    "openai": {
      "keys": [
        {
          "name": "local-vllm",
          "value": "dummy",
          "weight": 1.0,
          "models": ["glm-5"]
        }
      ],
      "network_config": {
        "base_url": "http://vllm-service:8000"
      }
    }
  }
}
```

**OTel 플러그인 올바른 설정**: `trace_type`은 `genai_extension`을 사용합니다(레거시 `otel` 값은 더 이상 사용하지 않습니다).

```json
{
  "plugins": [
    {
      "enabled": true,
      "name": "otel",
      "config": {
        "service_name": "bifrost",
        "trace_type": "genai_extension",
        "protocol": "http",
        "collector_url": "http://langfuse-web.langfuse.svc.cluster.local:3000/api/public/otel/v1/traces",
        "headers": {
          "Authorization": "Basic <BASE64(pk:sk)>",
          "x-langfuse-ingestion-version": "4"
        }
      }
    }
  ]
}
```

---

## 3. Bifrost 모델명 매핑 문제

**증상**: `openai/glm-5`로 요청했지만 vLLM에서 `model not found`

**원인**: Bifrost는 요청 시 provider prefix만 제거하고 모델명은 그대로 전달합니다 (`openai/glm-5` → vLLM에 `glm-5` 전달). vLLM의 `--served-model-name`이 일치하지 않으면 에러가 발생합니다.

**해결**: vLLM의 `--served-model-name`을 요청 모델명과 일치시킵니다.

```bash
# vLLM 서버 시작 시
vllm serve zai-org/GLM-5-FP8 \
  --served-model-name=glm-5 \
  --tensor-parallel-size=8
# --served-model-name은 Bifrost가 전달하는 이름(glm-5)과 일치해야 합니다
```

**클라이언트 요청**:
```python
from openai import OpenAI

client = OpenAI(base_url="http://<NLB_ENDPOINT>/v1", api_key="dummy")

# openai/ prefix는 Bifrost가 제거 → vLLM에 glm-5 전달
response = client.chat.completions.create(
    model="openai/glm-5",
    messages=[{"role": "user", "content": "Hello"}]
)
```

**커스텀 이름 매핑이 필요한 경우**, Bifrost v1.5.0+의 모델 alias 기능을 사용합니다. 아래 설정은 `glm-5` 요청을 vLLM의 `glm5-prod`로 매핑합니다.

```json
{
  "providers": {
    "openai": {
      "keys": [{
        "name": "local-vllm",
        "aliases": {
          "glm-5": "glm5-prod"
        }
      }]
    }
  }
}
```

상세는 [Bifrost Aliasing Models 문서](https://docs.getbifrost.ai/providers/aliasing-models)를 참조하세요.

---

## 4. Langfuse Sub-path 404

**증상**: `/langfuse/` 접속 시 페이지는 로드되지만 CSS/JS 등 정적 자산이 404

**원인**: Next.js 정적 자산 경로 (`/_next/*`)가 Langfuse로 라우팅되지 않음

**권장**: 가능하면 Langfuse를 서브 경로가 아닌 전용 호스트네임(예: `langfuse.example.com`)으로 노출합니다. 서브 경로 라우팅은 아래 경로들이 다른 애플리케이션의 루트 API/정적 경로와 충돌할 수 있고, Langfuse를 서브 경로에서 올바로 서빙하려면 라우팅만으로는 부족합니다. 빌드 타임 base path(`NEXTAUTH_URL`/base path 설정), 인증 콜백 URL, 헬스 프로브 경로까지 서브 경로에 맞춰 구성한 뒤 로그인·화면 이동·정적 자산 로드를 모두 확인해야 합니다.

**서브 경로를 유지해야 하는 경우의 해결**: [기본 배포 섹션 2.3](./basic-deployment.md#langfuse-sub-path-라우팅-urlrewrite)의 HTTPRoute에서 `/_next`, `/api/auth`, `/api/public`, `/icon.svg` 경로도 Langfuse로 라우팅 추가

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: langfuse-route
  namespace: observability
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway
  rules:
    # /langfuse → / prefix 제거
    - matches:
        - path:
            type: PathPrefix
            value: /langfuse/
      filters:
        - type: URLRewrite
          urlRewrite:
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Next.js static assets (필수!)
    - matches:
        - path:
            type: PathPrefix
            value: /_next
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse auth API (필수!)
    - matches:
        - path:
            type: PathPrefix
            value: /api/auth
      backendRefs:
        - name: langfuse-web
          port: 3000
    # Langfuse public API (필수!)
    - matches:
        - path:
            type: PathPrefix
            value: /api/public
      backendRefs:
        - name: langfuse-web
          port: 3000
```

---

## 5. OTel Trace가 Langfuse에 도착하지 않음

**진단 순서**:

```bash
# 1. Bifrost 로그에서 OTel 전송 확인
kubectl logs -l app=bifrost -n ai-external --tail=30 | grep -i otel

# 2. Langfuse 로그에서 OTLP 수신 확인 (네임스페이스는 환경에 따라 조정)
kubectl logs -l app=langfuse-web -n observability --tail=30 | grep -i otlp

# 3. kgateway URLRewrite 동작 확인
kubectl logs -n kgateway-system -l app=kgateway --tail=30 | grep "otel"
```

**표 2. OTel trace 연동 확인 항목과 올바른 값**

| 확인 항목 | 올바른 값 |
|----------|----------|
| `trace_type` | `"genai_extension"` (not `"otel"`) |
| `collector_url` | 전체 경로 포함 (`/api/public/otel/v1/traces`) |
| Authorization | `Basic <BASE64(public_key:secret_key)>` |
| kgateway URLRewrite | `/api/public/otel` -> `/api/public/otel/v1/traces` (경유 시) |
| ReferenceGrant | observability 네임스페이스에 생성됨 |

**Bifrost OTel 플러그인 검증**:

```bash
# Bifrost config.json 확인
kubectl get configmap bifrost-gateway-config -n ai-external -o yaml

# Authorization 헤더 BASE64 디코딩 검증
echo "<BASE64_STRING>" | base64 -d
# 예상 출력: pk-xxx:sk-xxx
```

**Langfuse 엔드포인트 직접 테스트**:

빈 `resourceSpans` 요청은 엔드포인트 도달성과 인증 수용 여부만 확인합니다(200은 연결·인증 성공을 뜻할 뿐, 트레이스가 실제로 저장·표시되는지는 검증하지 않습니다). 트레이스 미표시 증상을 재현하려면 알려진 trace/span ID와 타임스탬프를 가진 유효한 합성 span을 전송한 뒤, Langfuse UI에서 해당 trace가 수집·표시되는지 확인합니다.

```bash
# 연결·인증 확인 전용: Langfuse Pod 내부에서 직접 OTLP 전송 테스트
kubectl exec -it -n observability <langfuse-web-pod> -- curl -v \
  -H "Authorization: Basic <BASE64(pk:sk)>" \
  -H "x-langfuse-ingestion-version: 4" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}' \
  http://localhost:3000/api/public/otel/v1/traces
# 예상: 연결·인증 성공 시 200 (저장·표시 여부는 유효한 span으로 별도 확인)
```

상세 설정은 [Langfuse OTel 연동](../../integrations/monitoring-observability-setup.md)을 참조하세요.

---

## 6. kgateway Pod CrashLoopBackOff

**증상**: kgateway 컨트롤러 또는 프록시 Pod가 반복적으로 재시작

**진단**:
```bash
# Pod 상태 확인
kubectl get pods -n kgateway-system

# Pod 이벤트 확인
kubectl describe pod -n kgateway-system <pod-name>

# 로그 확인
kubectl logs -n kgateway-system <pod-name> --previous
```

**일반적 원인**:
- Gateway API CRD 또는 kgateway CRD(`kgateway-crds` 차트) 미설치, 버전 불일치
- Gateway의 `spec.infrastructure.parametersRef`가 존재하지 않는 `GatewayParameters` 참조
- 리소스 부족 (CPU/Memory)

**해결 방법**:

1. **CRD 설치 확인**:
```bash
kubectl get crd | grep gateway
# 예상: gatewayclasses.gateway.networking.k8s.io, gateways.gateway.networking.k8s.io, httproutes.gateway.networking.k8s.io
```

2. **GatewayParameters 존재 확인** (참조하는 경우):
```bash
kubectl get gatewayparameters -A
```

3. **리소스 증설**:
```yaml
# kgateway Helm values
controller:
  resources:
    requests:
      cpu: 500m      # 증설
      memory: 1Gi    # 증설
    limits:
      cpu: 2000m
      memory: 2Gi
```

---

## 7. Bifrost SQLite 초기화 실패

**증상**: Bifrost Pod 로그에 `failed to initialize database` 또는 `permission denied`

**원인**: PVC 쓰기 권한 오류 (fsGroup 미설정)

**해결**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bifrost
spec:
  template:
    spec:
      securityContext:
        fsGroup: 1000  # 필수!
      containers:
      - name: bifrost
        image: maximhq/bifrost:v1.5.16  # 최신 태그는 hub.docker.com/r/maximhq/bifrost 확인
        args: ["-app-dir", "/app/data"]
        volumeMounts:
        - name: bifrost-data
          mountPath: /app/data
```

**검증**:
```bash
# Bifrost Pod 내부에서 권한 확인
kubectl exec -it -n ai-external <bifrost-pod> -- ls -la /app/data
# 예상: drwxrwsr-x 2 1000 1000
```

---

## 8. CloudFront 403 Forbidden

**증상**: CloudFront를 통한 요청이 403 에러 반환

**원인**:
- WAF 규칙이 정상 트래픽을 차단
- NLB Security Group이 CloudFront Prefix List를 허용하지 않음
- CloudFront Origin 설정 오류

**진단**:

```bash
# 1. WAF 로그 확인 (CloudWatch Logs)
aws logs tail /aws-wafv2/cloudfront/inference-gateway-waf --follow

# 2. NLB SG 확인
aws ec2 describe-security-groups --group-ids ${CF_RESTRICTED_SG_ID}

# 3. 오리진(NLB) 직접 도달성 테스트 (Pod 내부에서 — CloudFront/WAF를 거치지 않음)
#    이 요청은 Pod에서 NLB로 직접 가므로 CloudFront와 WAF를 우회합니다.
#    또한 -H "Host:"는 애플리케이션 Host 헤더만 바꿀 뿐 TLS SNI를 그 이름으로 설정하지 않습니다.
kubectl exec -it -n kgateway-system <kgateway-pod> -- curl -v \
  -H "Host: <CF_DOMAIN>" \
  https://<NLB_DNS>/v1/models

# CloudFront 경로 자체를 검증하려면 CloudFront 도메인으로 요청하고
# 인증서/SNI가 일치하도록 --resolve 등으로 SNI를 명시합니다.
# curl -v https://<CF_DOMAIN>/v1/models
```

**해결**:

1. **WAF 규칙 조정** (특정 규칙을 일시적으로 Count 모드로 전환하여 트래픽 분석):

   기본 동작(`DefaultAction`)을 `Allow`로 바꾸면 매칭 규칙이 아니라 ACL 전체의 기본 처리가 허용으로 바뀌어 보호가 사라질 수 있습니다. 또한 `update-web-acl`은 전체 구성을 교체하므로 `Name`, `VisibilityConfig`, `Rules`를 모두 다시 전달해야 합니다. 분석이 필요한 규칙만 Count로 바꾸려면, 먼저 현재 구성과 `LockToken`을 읽어 보존한 뒤 해당 규칙에만 `OverrideAction: Count`(규칙 그룹) 또는 룰 그룹 참조의 `RuleActionOverrides`를 적용하고, 분석이 끝나면 원래 구성으로 되돌립니다.

```bash
# 1) 현재 ACL 전체 구성과 LockToken을 읽어 백업
aws wafv2 get-web-acl --scope CLOUDFRONT --region us-east-1 \
  --id <WEB_ACL_ID> --name <WEB_ACL_NAME> > webacl-backup.json
LOCK_TOKEN=$(jq -r '.LockToken' webacl-backup.json)

# 2) 백업에서 Rules/VisibilityConfig를 가져와, 분석 대상 규칙(그룹)만
#    OverrideAction 또는 RuleActionOverrides로 Count 처리한 Rules를 작성
#    (DefaultAction과 나머지 규칙은 그대로 유지)

# 3) 전체 구성을 다시 전달하여 업데이트 (Name/VisibilityConfig/Rules 필수)
aws wafv2 update-web-acl \
  --scope CLOUDFRONT --region us-east-1 \
  --id <WEB_ACL_ID> --name <WEB_ACL_NAME> \
  --default-action "$(jq -c '.WebACL.DefaultAction' webacl-backup.json)" \
  --visibility-config "$(jq -c '.WebACL.VisibilityConfig' webacl-backup.json)" \
  --rules file://rules-count-override.json \
  --lock-token ${LOCK_TOKEN}

# 4) 롤백: 다시 get-web-acl로 최신 LockToken을 받아 백업 Rules로 복원
```

2. **NLB SG에 CloudFront Prefix List 추가**:
```bash
export CF_PREFIX_LIST_ID=$(aws ec2 describe-managed-prefix-lists \
  --filters "Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing" \
  --query "PrefixLists[0].PrefixListId" --output text)

aws ec2 authorize-security-group-ingress \
  --group-id ${CF_RESTRICTED_SG_ID} \
  --ip-permissions "IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=${CF_PREFIX_LIST_ID}}]"
```

---

## 9. LLM Classifier 분류 오류

**증상**: 단순한 요청이 GLM-5로 라우팅되거나, 복잡한 요청이 Qwen3-4B로 라우팅됨

**원인**: 분류 키워드 또는 임계값 튜닝 필요

**진단**:
```bash
# LLM Classifier 로그 확인
kubectl logs -l app=llm-classifier -n ai-inference --tail=50
```

**해결**: `extproc_http.py` 분류 로직 조정

```python
# 키워드 추가/제거
STRONG_KEYWORDS = [
    "리팩터", "아키텍처", "설계", "분석", "최적화", "디버그", "마이그레이션",
    "refactor", "architect", "design", "analyze", "optimize", "debug",
    "migration", "complex", "performance", "security", "review",
    "구현",  # 추가 예시
]

# 임계값 조정
TOKEN_THRESHOLD = 500  # 300-700 범위 실험
TURN_THRESHOLD = 5     # 3-10 범위 실험
```

**A/B 테스트 구성** (점진적 롤아웃):

아래 HTTPRoute는 `parentRefs`로 Gateway에 attach되어야 동작하며, 백엔드(`llm-classifier`, `bifrost-service`)가 라우트와 다른 네임스페이스에 있으면 섹션 1의 `allowedRoutes`/ReferenceGrant 구성이 필요합니다. 또한 `llm-classifier` 백엔드로 트래픽을 보내는 구성은 분류기가 요청을 받아 그대로 추론 API로 전달하는 HTTP 프록시여야 유효합니다. 분류기가 프록시가 아니라면 이 가중치 분할은 그대로 적용할 수 없습니다.

```yaml
# 트래픽 분할: 50% LLM Classifier, 50% 직접 라우팅
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ab-test-route
  namespace: ai-inference  # 백엔드 Service가 있는 네임스페이스
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Gateway가 있는 네임스페이스
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /v1/
      backendRefs:
        - name: llm-classifier
          port: 8080
          weight: 50
        - name: bifrost-service
          port: 8080
          weight: 50
```

---

## 10. 자주 묻는 질문 (FAQ)

### Q1: kgateway vs Bifrost 차이?

**A**: kgateway는 Kubernetes Gateway API 표준 구현체로 진입(L1) 트래픽 라우팅을 담당하고, Bifrost는 멀티 프로바이더 통합 + Cascade Routing + 거버넌스(L1, across-model)를 제공합니다. 일반적으로 `kgateway → Bifrost → vLLM` 순서로 연결합니다. KV-aware(L2, within-model) Pod 선택이 필요하면 Bifrost 대신/함께 [Inference Extension(InferencePool + EPP)](./advanced-features.md#inference-extension)을 구성합니다. 레이어 구분은 [라우팅 전략](../../../model-serving/inference-routing/routing-strategy.md#두-개의-라우팅-레이어--반드시-구분) 참조.

### Q2: config.json 변경 후 즉시 반영 안 됨

**A**: Bifrost는 시작 시 config.json을 SQLite에 저장하므로, 설정을 바꾸면 Pod가 다시 시작되어야 반영됩니다. 레이블로 매칭되는 Pod를 한꺼번에 `delete`하면 가용성에 영향을 줄 수 있습니다. Deployment라면 롤링 재시작을 사용하고, 준비 상태를 확인한 뒤 문제가 생기면 롤백합니다. 단일 복제본이거나 SQLite를 로컬 볼륨에 두는 경우에는 재시작 중 짧은 중단이 불가피하므로 유지보수 시간대에 수행합니다.

```bash
# Deployment 롤링 재시작 (가용성 유지)
kubectl rollout restart deployment/bifrost -n ai-external
kubectl rollout status deployment/bifrost -n ai-external   # 준비 상태 확인
# 문제 시 롤백
kubectl rollout undo deployment/bifrost -n ai-external
```

### Q3: Langfuse 트레이스가 느리게 도착함

**A**: Langfuse는 비동기 배치 처리를 사용하므로 트레이스가 전송 직후 바로 표시되지 않습니다. 도착까지의 지연은 OTel exporter의 배치/플러시 주기, Langfuse 수집 큐 적체, 버전에 따라 달라지므로 고정된 "정상 범위"로 단정할 수 없습니다. 특정 환경에서 관찰된 지연(예: 수 초에서 수십 초)은 그 환경의 설정과 부하에 대한 예시일 뿐이며, 실제 값은 배치 설정과 큐 상태를 기준으로 측정해야 합니다. 실시간 확인이 필요하면 Langfuse 로그를 직접 확인하세요:
```bash
kubectl logs -l app=langfuse-web -n observability --tail=20 -f
```

### Q4: NLB 직접 접근 vs CloudFront 경유 속도 차이?

**A**: AWS WAF 검사는 통상 한 자릿수 ms 수준이며, CloudFront 엣지 TLS 종단은 오히려 클라이언트-엣지 간 지연을 감소시킬 수 있습니다. 캐시 미스 시 추가 홉으로 인한 지연은 상황에 따라 다르므로, 실제 지연은 워크로드별로 측정이 필요합니다. 프로덕션에서는 보안 트레이드오프를 고려하여 CloudFront + WAF 사용을 권장합니다.

### Q5: Bifrost double-prefix 트릭이 필요한 이유?

**A**: Aider가 내부적으로 LiteLLM을 사용하며, LiteLLM은 `openai/` prefix를 제거합니다. `openai/openai/glm-5` → LiteLLM 제거 → `openai/glm-5` → Bifrost 도착. LLM Classifier를 사용하면 이 트릭이 불필요합니다.

---

## 참고 자료

- [기본 배포](./basic-deployment.md) - kgateway, HTTPRoute, Bifrost 기본 구성
- [고급 기능](./advanced-features.md) - LLM Classifier, CloudFront/WAF, Semantic Caching
- [Langfuse 배포 가이드](../../integrations/monitoring-observability-setup.md) - OTel 연동 및 트러블슈팅
- [Kubernetes Gateway API 공식 문서](https://gateway-api.sigs.k8s.io/)
- [kgateway 공식 문서](https://kgateway.dev/docs/)
- [Bifrost 공식 문서](https://docs.getbifrost.ai/)
