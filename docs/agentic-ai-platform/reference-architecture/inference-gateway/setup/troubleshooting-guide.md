---
title: "트러블슈팅 가이드"
sidebar_label: "3. 트러블슈팅"
description: "Inference Gateway 배포 및 운영 중 발생하는 일반적인 문제와 해결 방법"
created: 2026-04-18
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags: [troubleshooting, debugging, kgateway, bifrost, 'scope:impl']
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
- ReferenceGrant가 누락되어 크로스 네임스페이스 접근 불가
- `hostnames` 필드가 요청의 Host 헤더와 불일치

**해결 방법**:

1. **parentRefs 확인**:
```yaml
# HTTPRoute에서 Gateway 네임스페이스 명시
spec:
  parentRefs:
    - name: unified-gateway
      namespace: ai-gateway  # Gateway가 있는 네임스페이스
```

2. **ReferenceGrant 생성**:
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

3. **hostnames 검증**:
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

**원인과 해결**:

| 에러 메시지 | 원인 | 해결 |
|------------|------|------|
| `Provider not found: vllm` | 빌트인 provider 이름 미사용 | `openai`, `anthropic` 등 빌트인 이름 사용 |
| `Model not found: glm-5` | provider prefix 누락 | 요청 시 `openai/glm-5` 형태로 전송 |
| UI에서 설정 미표시 | providers가 배열로 작성됨 | `"providers": [...]` -> `"providers": {...}` (map) |
| OTel trace 미도착 | trace_type 오류 | `"genai_extension"` -> `"otel"` |
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

**OTel 플러그인 올바른 설정**:

```json
{
  "plugins": [
    {
      "enabled": true,
      "name": "otel",
      "config": {
        "service_name": "bifrost",
        "trace_type": "otel",  # NOT "genai_extension"
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

## 3. Bifrost 모델명 정규화 문제

**증상**: `openai/glm-5`로 요청했지만 vLLM에서 `model not found`

**원인**: Bifrost는 모델명에서 하이픈을 제거하여 정규화합니다 (`glm-5` -> `glm5`).

**해결**: vLLM의 `--served-model-name`을 정규화된 이름과 일치시킵니다.

```bash
# vLLM 서버 시작 시
vllm serve zai-org/GLM-5-FP8 \
  --served-model-name=glm5 \  # 하이픈 없는 이름
  --tensor-parallel-size=8
```

**클라이언트 요청**:
```python
from openai import OpenAI

client = OpenAI(base_url="http://<NLB_ENDPOINT>/v1", api_key="dummy")

# Bifrost는 glm-5 → glm5로 정규화하므로, vLLM에서 glm5로 서빙해야 함
response = client.chat.completions.create(
    model="openai/glm-5",  # 요청 시 원래 이름 사용
    messages=[{"role": "user", "content": "Hello"}]
)
```

:::info Bifrost 모델 alias 기능
Bifrost에서 모델 alias 기능이 [#1058](https://github.com/maximhq/bifrost/issues/1058)로 요청되어 있으나, 2026.04 기준 미구현 상태입니다.
:::

---

## 4. Langfuse Sub-path 404

**증상**: `/langfuse/` 접속 시 페이지는 로드되지만 CSS/JS 등 정적 자산이 404

**원인**: Next.js 정적 자산 경로 (`/_next/*`)가 Langfuse로 라우팅되지 않음

**해결**: [기본 배포 섹션 2.3](./basic-deployment.md#langfuse-sub-path-라우팅-urlrewrite)의 HTTPRoute에서 `/_next`, `/api/auth`, `/api/public`, `/icon.svg` 경로도 Langfuse로 라우팅 추가

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

**체크리스트**:

| 확인 항목 | 올바른 값 |
|----------|----------|
| `trace_type` | `"otel"` (not `"genai_extension"`) |
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

```bash
# Langfuse Pod 내부에서 직접 OTLP 전송 테스트
kubectl exec -it -n observability <langfuse-web-pod> -- curl -v \
  -H "Authorization: Basic <BASE64(pk:sk)>" \
  -H "x-langfuse-ingestion-version: 4" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}' \
  http://localhost:3000/api/public/otel/v1/traces
# 예상: 200 OK
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
- Gateway API CRD 미설치 또는 버전 불일치
- GatewayClass의 `parametersRef`가 존재하지 않는 GatewayClassConfig 참조
- 리소스 부족 (CPU/Memory)

**해결 방법**:

1. **CRD 설치 확인**:
```bash
kubectl get crd | grep gateway
# 예상: gatewayclasses.gateway.networking.k8s.io, gateways.gateway.networking.k8s.io, httproutes.gateway.networking.k8s.io
```

2. **GatewayClassConfig 존재 확인**:
```bash
kubectl get gatewayclassconfig -A
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
        image: bifrost/bifrost:v2.0.0
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

# 3. CloudFront → NLB 직접 테스트 (Pod 내부에서)
kubectl exec -it -n kgateway-system <kgateway-pod> -- curl -v \
  -H "Host: <CF_DOMAIN>" \
  https://<NLB_DNS>/v1/models
```

**해결**:

1. **WAF 규칙 조정** (일시적으로 Count 모드로 전환하여 트래픽 분석):
```bash
aws wafv2 update-web-acl \
  --scope CLOUDFRONT \
  --region us-east-1 \
  --id <WEB_ACL_ID> \
  --lock-token <LOCK_TOKEN> \
  --default-action '{"Allow":{}}'
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

```yaml
# 트래픽 분할: 50% LLM Classifier, 50% 직접 라우팅
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ab-test-route
spec:
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

**A**: kgateway는 Kubernetes Gateway API 표준 구현체로 경로 기반 라우팅을 담당하고, Bifrost는 멀티 프로바이더 통합 + Cascade Routing + 거버넌스를 제공합니다. 일반적으로 kgateway → Bifrost → vLLM 순서로 연결합니다.

### Q2: config.json 변경 후 즉시 반영 안 됨

**A**: Bifrost는 시작 시 config.json을 SQLite에 저장합니다. 변경 시 Pod 재시작 필요:
```bash
kubectl delete pod -l app=bifrost -n ai-external
```

### Q3: Langfuse 트레이스가 느리게 도착함

**A**: Langfuse는 비동기 배치 처리를 사용합니다. 트레이스 도착까지 10-30초 소요 정상. 실시간 확인이 필요하면 Langfuse 로그를 직접 확인하세요:
```bash
kubectl logs -l app=langfuse-web -n observability --tail=20 -f
```

### Q4: NLB 직접 접근 vs CloudFront 경유 속도 차이?

**A**: CloudFront 경유 시 TLS 종단 + WAF 검사로 인해 약 10-50ms 추가 지연 발생. 프로덕션에서는 보안 트레이드오프로 수용 권장.

### Q5: Bifrost double-prefix 트릭이 필요한 이유?

**A**: Aider가 내부적으로 LiteLLM을 사용하며, LiteLLM은 `openai/` prefix를 제거합니다. `openai/openai/glm-5` → LiteLLM 제거 → `openai/glm-5` → Bifrost 도착. LLM Classifier를 사용하면 이 트릭이 불필요합니다.

---

## 참고 자료

- [기본 배포](./basic-deployment.md) - kgateway, HTTPRoute, Bifrost 기본 구성
- [고급 기능](./advanced-features.md) - LLM Classifier, CloudFront/WAF, Semantic Caching
- [Langfuse 배포 가이드](../../integrations/monitoring-observability-setup.md) - OTel 연동 및 트러블슈팅
- [Kubernetes Gateway API 공식 문서](https://gateway-api.sigs.k8s.io/)
- [kgateway 공식 문서](https://kgateway.dev/docs/)
- [Bifrost 공식 문서](https://bifrost.dev/docs)
