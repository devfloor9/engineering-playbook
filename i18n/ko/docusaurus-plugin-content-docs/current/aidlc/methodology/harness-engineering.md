---
title: 하네스 엔지니어링
description: AIDLC 신뢰성의 두 번째 축 — AI 실행의 안전성을 아키텍처적으로 강제하는 하네스 설계 (engineering-playbook 확장 콘텐츠)
created: "2026-04-07"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 11
tags:
  - aidlc
  - harness
  - methodology
  - scope:methodology
keywords:
  - harness engineering
  - quality gates
  - circuit breaker
  - AI safety
  - architectural constraints
  - guardrails
sidebar_label: 하네스 엔지니어링
---

import { QualityGates } from '@site/src/components/AidlcTables';

:::info 확장 개념 (engineering-playbook 독자 콘텐츠)
온톨로지·하네스 엔지니어링은 [AWS Labs AIDLC 공식 방법론](https://github.com/awslabs/aidlc-workflows) 에 포함되지 않은, engineering-playbook 의 독자 확장 콘텐츠입니다. DDD + 2026년 Agentic AI 베스트 프랙티스를 반영해 엔터프라이즈 AI 신뢰성을 강화했습니다. 공식 AIDLC 적용 시 이 축은 선택적으로 도입 가능합니다.
:::

> "에이전트가 어려운 게 아니라, 하네스가 어렵다" — NxCode, 2026

## 개요

**하네스 엔지니어링(Harness Engineering)**은 AI가 만든 결과를 검사하고, 실행 범위를 제한하는 구조를 설계하는 일입니다. 온톨로지에 정의한 업무 규칙을 검사 조건으로 옮기고, 재시도와 실행 시간의 한계를 정합니다. 아래 2026년 인용은 하네스 설계가 왜 필요한지 보여주는 예시이며, 특정 프로젝트에서 보고된 사례입니다.

> OpenAI Codex가 100만 줄의 코드를 생성할 때, 인간 엔지니어가 작성한 코드는 0줄이었습니다(한 보고 사례의 예시이며, 모든 환경을 대표하는 측정값은 아닙니다). 엔지니어의 역할은 **코드를 쓰는 것이 아니라 하네스를 설계하는 것**으로 전환되었습니다.

```mermaid
graph LR
    subgraph Ontology["온톨로지 (WHAT + WHEN)"]
        DEF["도메인 제약 정의"]
        FB["피드백 루프"]
        DEF -->|"운영 데이터"| FB
        FB -->|"정제"| DEF
    end

    subgraph Harness["하네스 엔지니어링 (HOW)"]
        VAL["구조화된 검증"]
        ARCH["아키텍처적 제약"]
    end

    Ontology -->|"제약 조건 전달"| Harness
    Harness -->|"검증 결과 → 온톨로지 진화"| Ontology

    style Ontology fill:#4caf50,color:#fff
    style Harness fill:#2196f3,color:#fff
```

**하네스의 역할:**
- 온톨로지가 정의한 제약을 아키텍처적으로 검증
- 재시도 예산, 타임아웃, 출력 게이트, 서킷 브레이커 설계
- 독립적 검증 보장 (코드 생성 에이전트 ≠ 검증 에이전트)
- 검증 결과를 온톨로지 진화로 피드백

---

## 하네스 vs 가드레일

많은 팀이 "가드레일"과 "하네스"를 혼용하지만, 이 둘은 **범위와 시점이 근본적으로 다릅니다**.

| 구분 | 가드레일(Guardrails) | 하네스(Harness) |
|------|---------------------|----------------|
| **범위** | 런타임 입출력 필터링과 대화·검색·도구 실행 단계의 제약 | 아키텍처 전체 설계 |
| **역할** | 입출력 필터링(PII 마스킹, 프롬프트 인젝션 방어)뿐 아니라 대화, 검색(retrieval), 도구 실행 단계의 제약 | 재시도 예산, 타임아웃, 출력 게이트, 서킷 브레이커 |
| **시점** | 실행 중 | 설계 시점부터 |
| **실패 모드** | 개별 요청 차단 | 시스템 전체 보호 |
| **예시** | Bedrock Guardrails, NeMo Guardrails | AIDLC Quality Gates, 독립 검증 에이전트 |

**핵심 차이:**
- **가드레일**은 "입출력뿐 아니라 대화·검색·도구 실행 단계에서 위험을 걸러 내는 제어" — 예: 프롬프트 인젝션 탐지, PII 마스킹, 도구 호출 제한
- **하네스**는 "AI가 안전하게 동작하도록 제약하는 아키텍처" — 예: 재시도 847번 방지, 비용 폭주 차단

---

## Fintech Runaway 사례: 하네스 없는 AI의 실패

:::danger 실제 사례: $2,200 손실 사건

한 핀테크 스타트업의 AI 에이전트가 하나의 루프에서 **847번의 API 재시도**를 실행하여:
- **$2,200의 LLM API 비용** 발생
- **14개의 불완전한 이메일** 고객에게 전송
- **3시간 동안 서비스 정지** (수동 개입 필요)

**원인 분석:**
- ❌ 모델 문제가 아님 (GPT-4를 사용)
- ❌ 프롬프트 문제가 아님 (프롬프트는 명확했음)
- ✅ **아키텍처적 실패** — 하네스 부재

**부재한 하네스 패턴:**
1. 재시도 예산 없음 (무제한 재시도)
2. 타임아웃 없음 (루프 무한 실행 가능)
3. 출력 게이트 없음 (불완전 이메일 전송 차단 실패)
4. 서킷 브레이커 없음 (847번 실패 후에도 계속 시도)
5. 비용 제한 없음 ($2,200 청구 전까지 알림 없음)

:::

**교훈:** 이 예제는 재시도, 실행 시간, 출력, 비용에 한도를 정해야 하는 이유를 보여줍니다. 이런 제어는 실패한 에이전트 작업의 영향을 제한하고, 그동안 모델·프롬프트·연동 문제의 원인을 조사할 수 있게 합니다.

---

## AIDLC 3단계별 하네스 패턴

| 단계 | 하네스 유형 | 검증 대상 | 구현 방법 |
|------|-----------|----------|----------|
| **Inception** | Spec 검증 하네스 | 요구사항 완전성, 상충 여부, NFR 충족 | 온톨로지 기반 Spec 일관성 자동 검증 |
| **Construction** | 빌드/테스트 하네스 | 코드 정확성, 보안, 아키텍처 준수 | 독립 에이전트 리뷰 + 온톨로지 위반 탐지 |
| **Operations** | 런타임 하네스 | AI Agent 행동 제약, 비용 제한 | 서킷 브레이커, 재시도 예산, 출력 게이트 |

```mermaid
graph TD
    subgraph Inception["Inception 하네스"]
        I1["Spec 일관성 검증"]
        I2["NFR 충족 여부"]
        I3["온톨로지 위반 탐지"]
    end

    subgraph Construction["Construction 하네스"]
        C1["빌드 자동화"]
        C2["테스트 커버리지"]
        C3["보안 스캔"]
        C4["아키텍처 리뷰"]
    end

    subgraph Operations["Operations 하네스"]
        O1["서킷 브레이커"]
        O2["재시도 예산"]
        O3["타임아웃"]
        O4["출력 게이트"]
        O5["비용 제한"]
    end

    I1 --> C1
    I2 --> C2
    I3 --> C4
    C1 --> O1
    C2 --> O2
    C3 --> O3
    C4 --> O4

    style Inception fill:#4caf50,color:#fff
    style Construction fill:#2196f3,color:#fff
    style Operations fill:#ff9800,color:#fff
```

---

## 하네스 패턴 카탈로그

### 1. 서킷 브레이커(Circuit Breaker)

**목적:** 반복적 실패 시 추가 시도를 차단하여 시스템 전체 보호

**패턴:**
```yaml
circuit_breaker:
  failure_threshold: 5        # 5번 실패 시 Open
  timeout: 60s               # 60초 후 Half-Open
  success_threshold: 2       # 2번 성공 시 Closed
```

**적용 사례:**
- LLM API 호출 (Bedrock, OpenAI)
- 외부 서비스 연동 (결제, 이메일)
- Agent 간 통신 (다중 에이전트 시스템)

---

### 2. 재시도 예산(Retry Budget)

**목적:** 무제한 재시도 방지, 전체 비용 제어

**패턴:**
```yaml
retry_budget:
  max_attempts: 3            # 단일 작업당 최대 3회 재시도
  backoff: exponential       # 지수 백오프
  max_backoff: 30s          # 최대 30초 대기
  budget_limit: 10          # 시간당 전체 재시도 횟수 상한
```

`max_attempts`는 하나의 작업이 실패했을 때 그 작업을 다시 시도하는 횟수의 상한이고, `budget_limit`은 여러 작업에 걸쳐 시간당 허용하는 재시도 총량입니다. 두 값은 서로 다른 범위를 제한하므로 함께 사용합니다. 비용 상한은 재시도 횟수가 아니라 아래 7번 비용 제한(Cost Limit) 패턴의 금액 설정으로 강제합니다.

**Fintech Runaway 방지 (위 설정 적용 시):**
- ✅ 847번 재시도 → 작업당 3회로 제한
- ✅ 즉시 재시도 → 지수 백오프 (1s, 2s, 4s)
- ✅ $2,200 비용 → 비용 제한 패턴의 시간당 $10·일일 $100 상한으로 차단

---

### 3. 타임아웃(Timeout)

**목적:** 무한 루프 방지, 응답 시간 보장

**패턴:**
```yaml
timeout:
  request: 30s              # 단일 요청 타임아웃
  total: 300s               # 전체 작업 타임아웃
  idle: 60s                 # 무응답 시 타임아웃
```

**적용 사례:**
- LLM 추론 (30초 초과 시 대기 중단)
- 코드 생성 (전체 5분 제한)
- 테스트 실행 (Idle 1분 초과 시 대기 종료)

타임아웃은 호출 측이 기다리는 시간을 제한할 뿐, 그 자체로 진행 중인 작업을 멈추거나 이미 발생한 부분적 부수 효과를 되돌리지는 않습니다. 실제로 작업을 중단하려면 명시적인 취소(cancellation) 신호를, 이미 쓰인 데이터를 되돌리려면 별도의 보상(compensation) 처리를 함께 설계해야 합니다.

---

### 4. 출력 게이트(Output Gate)

**목적:** 불완전하거나 유해한 출력 차단

**패턴:**
```yaml
output_gate:
  validators:
    - syntax_check          # 코드 구문 검증
    - schema_validation     # JSON 스키마 검증
    - pii_detection        # PII 탐지 및 마스킹
    - toxicity_filter      # 유해 콘텐츠 필터
    - completeness_check   # 필수 필드·본문 완결성 검증(별도 구현 필요)
  action_on_failure: reject # 실패 시 출력 거부
```

위에 나열한 `syntax_check`·`schema_validation`·`pii_detection`·`toxicity_filter`는 구문, 스키마, 민감 정보, 유해성만 검사하므로 "이메일 본문이 업무적으로 불완전한지"는 판단하지 못합니다. 불완전한 이메일을 차단하려면 필수 필드와 본문 완결 조건을 명시적으로 검사하는 `completeness_check` 같은 검증기를 별도로 구현해 출력 게이트에 추가해야 합니다.

**Fintech Runaway 방지:**
- ✅ 불완전 이메일 14개 → 완결성 검증기를 추가하면 출력 게이트에서 차단
- ✅ PII 노출 방지
- ✅ 유해 콘텐츠 필터링

---

### 5. PII 마스킹(PII Masking)

**목적:** 민감 정보 보호 (입출력 모두)

**패턴:**
```yaml
pii_masking:
  patterns:
    - email: "***@***.***"
    - ssn: "***-**-****"
    - credit_card: "****-****-****-****"
  redact_in_logs: true      # 로그에서도 마스킹
```

---

### 6. 프롬프트 인젝션 방어(Prompt Injection Defense)

**목적:** 악의적 프롬프트 차단

**패턴:**
```yaml
prompt_injection_defense:
  techniques:
    - instruction_hierarchy  # 시스템 프롬프트 우선순위
    - delimiter_isolation    # 구분자로 사용자 입력 격리
    - output_validation     # 출력 스키마 검증
```

---

### 7. 비용 제한(Cost Limit)

**목적:** LLM API 비용 폭주 방지

**패턴:**
```yaml
cost_limit:
  per_request: 0.50         # 요청당 $0.50 제한
  per_hour: 10.00          # 시간당 $10 제한
  per_day: 100.00          # 일일 $100 제한
  alert_threshold: 0.80    # 80% 도달 시 알림
```

5~7번 패턴의 YAML(PII 마스킹, 프롬프트 인젝션 방어, 비용 제한)은 설정 키와 임계값을 선언한 구성 계약일 뿐이며 그 자체로 동작하지 않습니다. 실제로 마스킹을 수행하는 엔진, 인젝션을 탐지하는 검출기, 사용량을 집계해 임계값에서 차단·알림을 발생시키는 미터링 구현이 있어야 이 설정이 효력을 가집니다.

---

## Quality Gates — 전 단계 품질 보증

AI-DLC에서 사람 검증은 **Loss Function**입니다 — 각 단계에서 오류를 조기에 포착하여 하류 전파를 방지합니다. Quality Gates는 이 Loss Function을 체계화한 것입니다.

```
Inception          Construction          Operations
    │                   │                    │
    ▼                   ▼                    ▼
[Mob Elaboration    [DDD Model         [배포 전 검증]
 산출물 검증]        검증]
    │                   │                    │
    ▼                   ▼                    ▼
[Spec 정합성]      [코드 + 보안 스캔]    [SLO 기반 모니터링]
    │                   │                    │
    ▼                   ▼                    ▼
[NFR 충족 여부]    [테스트 커버리지]     [AI Agent 대응 검증]
```

<QualityGates />

---

## AI 기반 PR 리뷰 자동화

전통적 코드 리뷰는 린트 규칙과 정적 분석에 의존하지만, **AI 기반 리뷰는 아키텍처 패턴, 보안 모범 사례, 비즈니스 로직 정합성**까지 검증합니다.

### 검증 항목

**1. DDD 패턴 준수**
- Aggregate 캡슐화 위반 탐지
- Entity 직접 수정 방지
- Value Object 불변성 검증

**예시:**
```go
// ❌ 위반: Aggregate 외부에서 Entity 직접 수정
func UpdateUserEmail(userID string, email string) error {
    user, err := userRepo.FindByID(userID)
    if err != nil {
        return err
    }
    user.Email = email  // ❌ Entity 직접 수정
    return userRepo.Save(user)
}

// ✅ 권장: Aggregate 메서드로 수정 후 저장
func UpdateUserEmail(userID string, email string) error {
    user, err := userRepo.FindByID(userID)
    if err != nil {
        return err
    }
    if err := user.ChangeEmail(email); err != nil {  // ✅ Aggregate 메서드 사용
        return err
    }
    return userRepo.Save(user)  // ✅ 변경을 저장소에 영속화
}
```

**2. 마이크로서비스 통신**
- 동기 호출: gRPC 사용
- 비동기 이벤트: SQS/SNS 사용
- 외부 API: HTTP REST (OpenAPI spec 필수)

**3. 관찰성**
- 모든 핸들러에 OpenTelemetry 계측
- 비즈니스 메트릭은 Prometheus 커스텀 메트릭으로 노출
- 구조화된 로깅 (JSON 형식, contextual fields 포함)

**4. 보안**
- 인증: JWT (이 프로젝트 정책은 RS256을 요구하며 HS256을 금지합니다. HS256도 유효한 알고리즘이지만, 공유 비밀 유출 위험을 줄이기 위한 조직 정책으로 비대칭 서명을 택한 것입니다.)
- 민감 정보: AWS Secrets Manager에서 조회
- SQL 쿼리: Prepared Statement 사용 (문자열 연결 금지)

---

## 독립 검증 원칙

:::caution 같은 에이전트의 테스트 함정

"같은 AI 에이전트가 작성한 테스트는 같은 에이전트의 오류를 잡지 못한다" — 이는 AI가 숙제를 스스로 채점하는 것과 같습니다.

**증상:**
- 테스트가 통과 ✅
- CI가 녹색 ✅
- PR 머지 완료 ✅
- **3일 후 기능이 반만 동작** ❌

**원인:**
- 테스트가 '완료'에 최적화되었지 '정확성'에 최적화되지 않음
- 코드 생성 에이전트와 테스트 생성 에이전트가 동일
- 같은 편향(bias)을 공유

:::

**해결: 독립적 검증 하네스**

```mermaid
graph LR
    A[코드 생성 에이전트] -->|코드| B[독립 리뷰 에이전트]
    B -->|검증 통과| C[머지]
    B -->|검증 실패| D[수정 요청]
    D --> A

    style A fill:#4caf50,color:#fff
    style B fill:#2196f3,color:#fff
    style C fill:#059669,color:#fff
    style D fill:#dc2626,color:#fff
```

**구현 원칙:**
1. **다른 에이전트 사용** — 코드 생성 ≠ 테스트 생성
2. **다른 모델 사용** — GPT-4 생성 → Claude 검증
3. **사람 검증** — 핵심 로직은 사람이 최종 승인

검증자를 다른 에이전트·모델로 바꾸면 생성자와 공유하던 편향은 줄어듭니다. 그러나 검증자가 다르다는 사실 자체가 정확성을 보장하지는 않습니다. 독립 검증이 성립하려면 생성 과정과 분리된 독립적인 테스트 오라클(기대 결과의 근거)이나 명세가 있어야 하며, 단지 모델만 교체해서는 두 모델이 같은 오해를 공유할 때 오류를 놓칠 수 있습니다.

---

## 하네스 설계 체크리스트

AIDLC 3단계별 하네스 패턴 체크리스트:

### Inception 하네스
- [ ] Spec 일관성 자동 검증
- [ ] NFR 충족 여부 확인
- [ ] 온톨로지 위반 탐지
- [ ] 요구사항 상충 검사

### Construction 하네스
- [ ] 빌드 자동화 (CI/CD)
- [ ] 테스트 커버리지 80% 이상
- [ ] 보안 스캔 (SAST, SCA)
- [ ] 아키텍처 패턴 검증
- [ ] 독립 에이전트 리뷰
- [ ] Quality Gates 통과

### Operations 하네스
- [ ] 서킷 브레이커 구현
- [ ] 재시도 예산 설정
- [ ] 타임아웃 정의
- [ ] 출력 게이트 활성화
- [ ] PII 마스킹
- [ ] 프롬프트 인젝션 방어
- [ ] 비용 제한 설정
- [ ] SLO 기반 알림

---

## 참고 자료

- **[온톨로지 엔지니어링](./ontology-engineering.md)** — 하네스가 검증하는 제약의 정의 (WHAT 축)
- **[역할 재정의](../enterprise/role-composition.md)** — 하네스 엔지니어 역할
- **[비용 효과](../enterprise/cost-estimation.md)** — 하네스 ROI 계산
- **[MSA 복잡도](../enterprise/msa-complexity/index.md)** — MSA별 하네스 패턴

### 외부 참조
- [Harness Engineering: Governing AI Agents through Architectural Rigor](https://harness-engineering.ai/blog/harness-engineering-governing-ai-agents-through-architectural-rigor/) — Kai Renner, 2026-03
- [Harness Engineering Complete Guide](https://www.nxcode.io/resources/news/harness-engineering-complete-guide-ai-agent-codex-2026) — NxCode, 2026-03
- [Specwright: Closes the Loop](https://obsidian-owl.github.io/engineering-blog/posts/specwright-spec-driven-development-that-closes-the-loop/) — Obsidian Owl, 2026-02
- [EleutherAI LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness) — GitHub 11.7k+ stars
