---
title: AIDLC Common Rules
description: AWS Labs AIDLC 공식 11개 공통 규칙 해설 — Question Format부터 Audit Logging까지, 엔터프라이즈 적용 가이드
created: "2026-04-18"
last_update:
  date: 2026-10-31
  author: YoungJoon Jeong
reading_time: 17
tags:
  - aidlc
  - common-rules
  - methodology
  - governance
  - scope:methodology
sidebar_label: Common Rules
sidebar_position: 6
category: aidlc
---

AWS Labs [AIDLC Workflows](https://github.com/awslabs/aidlc-workflows) v0.1.7 의 `aws-aidlc-rule-details/common/` 디렉터리에는 11개 규칙 파일(`ascii-diagram-standards`, `content-validation`, `depth-levels`, `error-handling`, `overconfidence-prevention`, `process-overview`, `question-format-guide`, `session-continuity`, `terminology`, `welcome-message`, `workflow-changes`)이 들어 있습니다. 이 파일들은 Inception → Construction → Operations 전 단계에서 AI 에이전트와 사람이 협업하는 방식을 규정합니다.

본 문서는 위 공식 파일의 내용을 엔터프라이즈 관점에서 **주제별로 재편한 11개 규칙**으로 해설합니다. 이 재편 목록(아래 1절 표)은 공식 파일 이름과 1:1로 대응하지 않습니다. 예를 들어 "Checkpoint Approval", "Audit Logging", "No Duplication", "Methodology First", "Reproducible" 는 공식 `common/` 에 같은 이름의 파일로 존재하지 않으며, 본 문서가 재현성·감사 가능성·안전성을 설명하기 위해 묶은 주제 범주입니다. 각 규칙은 "무엇(What) / 왜(Why) / 어떻게(How)" 3단 구조로 해설하고, 엔터프라이즈 환경에서의 적용 팁을 덧붙입니다.

---

## 1. 개요: 주제별로 재편한 11개 규칙 {#1-개요-11개-common-rules}

아래 표와 다이어그램은 공식 `common/` 파일을 그대로 나열한 것이 아니라, 본 문서가 상호작용·품질·거버넌스 세 범주로 **재편한 주제 목록**입니다.

```mermaid
graph TB
    subgraph Interaction["상호작용 규칙"]
        Q["Question Format<br/>letter + Other + [Answer]:"]
        OP["Overconfidence Prevention"]
        WC["Workflow Changes"]
    end

    subgraph Quality["품질 규칙"]
        CV["Content Validation"]
        EH["Error Handling"]
        ND["No Duplication"]
        MF["Methodology First"]
        REP["Reproducible"]
    end

    subgraph Governance["거버넌스 규칙"]
        SC["Session Continuity"]
        CA["Checkpoint Approval"]
        AL["Audit Logging"]
    end

    Interaction --> Quality
    Quality --> Governance

    style Interaction fill:#326ce5,color:#fff
    style Quality fill:#2ecc71,color:#fff
    style Governance fill:#e74c3c,color:#fff
```

| # | 규칙 | 범주 | 핵심 가치 |
|---|------|------|----------|
| 1 | Question Format | 상호작용 | 구조화된 질문·답변 포맷 강제 |
| 2 | Content Validation | 품질 | 파일 쓰기 전 생성 콘텐츠 구문 검증 |
| 3 | Error Handling | 품질 | 예외 상황 표준 처리 |
| 4 | Overconfidence Prevention | 상호작용 | AI 확신도 제어 |
| 5 | Session Continuity | 거버넌스 | 세션 간 컨텍스트 보존 |
| 6 | Workflow Changes | 상호작용 | 워크플로 변경 명시적 승인 |
| 7 | Checkpoint Approval | 거버넌스 | Stage 전환 게이트 |
| 8 | Audit Logging | 거버넌스 | ISO 8601 타임스탬프 감사 로그 |
| 9 | No Duplication | 품질 | 단일 진실 원천(SSOT) |
| 10 | Methodology First | 품질 | 도구 독립성 |
| 11 | Reproducible | 품질 | 모델 간 결과 일관성 |

:::info 왜 Common Rules 가 중요한가
Common Rules는 Kiro, Q Developer, Cursor, Cline, Claude Code, GitHub Copilot 등에서 공통으로 따를 질문·승인·검증·기록 절차를 정의합니다. `AGENTS.md`는 이런 지침을 프로젝트에 전달하는 파일입니다. 공통 절차를 적용하더라도 산출물의 품질은 도구와 모델별로 평가해야 합니다.
:::

---

## 2. 규칙 1: Question Format

### 무엇
AI 에이전트가 사람에게 질문할 때 **항상 글자(A, B, C …) 선택지 + `[Answer]:` 태그** 포맷을 강제합니다. v0.1.7 의 `common/question-format-guide.md` 는 "Other" 를 **마지막 선택지로 반드시 포함**하고(필수), 의미 있는 선택지는 **최소 2개 + Other, 최대 5개 + Other** 범위로 두도록 규정합니다. 선택지 수를 채우기 위한 가짜 옵션은 만들지 않습니다.

### 왜
- **재현성**: 자유 형식 답변은 모델별·세션별로 해석이 달라짐. 글자 선택지는 해석 모호성 제거
- **속도**: 사람이 긴 자유 응답을 작성할 필요 없음. 한 글자 선택으로 진행
- **감사**: 질문·답변 쌍이 구조화되어 감사 로그·재실행에 활용 가능

### 어떻게

**질문 템플릿:**
```markdown
Q1. Payment Service 의 인증 방식을 어떻게 설정하시겠습니까?

A. OAuth2 + JWT (Refresh Token 포함)
B. API Key (헤더 기반)
C. mTLS (서비스 간 인증)
D. AWS IAM + SigV4
E. Other (please specify)

[Answer]:
```

**사람이 작성하는 응답:**
```markdown
[Answer]: A
```

또는 자유 기술이 필요한 경우:
```markdown
[Answer]: E - Cognito User Pool + JWT (기존 조직 표준 준수)
```

### 엔터프라이즈 적용 팁
- 의미 있는 선택지는 **최대 5개 + Other** 까지만 둡니다. 너무 많으면 의사결정 피로를 유발합니다
- 마지막 선택지는 항상 "Other (please specify)" 로 두어 자유 응답 경로를 보장합니다
- PR 본문·Slack 채널에 질문 블록을 복사해 **팀 합의 후 `[Answer]:` 작성**하는 패턴 권장

---

## 3. 규칙 2: Content Validation

### 무엇
v0.1.7 의 `common/content-validation.md` 가 정의하는 공식 규칙은, AI 가 파일을 쓰기 **전에** 생성한 콘텐츠(ASCII 다이어그램, Mermaid, JSON, YAML, Markdown)의 **구문을 검증**해 파싱 오류를 예방하는 것입니다. 검증에 실패하면 텍스트 대체본(fallback)으로 전환하고 워크플로를 중단하지 않으며, 간소화된 콘텐츠를 사용했음을 사용자에게 알립니다.

### 왜
- 잘못된 Mermaid·YAML·JSON 은 산출물 파일을 깨뜨려 이후 단계가 읽지 못하게 만듦
- 쓰기 전에 구문을 검사하면 파싱 오류를 재작업 없이 예방
- 복잡한 시각 요소에 텍스트 대체본을 함께 제공하면 렌더링 실패에도 정보가 보존됨

### 어떻게

공식 규칙의 검증 체크리스트(파일 생성 전):
```markdown
## Pre-Creation Validation Checklist
- [ ] 임베드된 코드 블록(Mermaid, JSON, YAML) 구문 검증
- [ ] 특수 문자 이스케이프 확인
- [ ] Markdown 구문 정확성 확인
- [ ] 콘텐츠 파싱 호환성 테스트
- [ ] 복잡한 요소에 대한 텍스트 대체본 포함
```

### 엔터프라이즈 적용 팁

아래 항목(본 가이드의 추가 제안)은 공식 Content Validation 규칙에는 없는, 조직 차원의 **별도 품질 게이트** 제안입니다. 공식 규칙(구문 검증·대체본)과 혼동하지 않도록 구분해 적용합니다.

산출물의 요구사항 완전성(FR/NFR 누락·모순)을 사람에게 보고하는 자체 검증 리포트 예시:
```markdown
## Content Validation Report (조직 확장 예시)

- [x] 모든 기능 요구사항에 Acceptance Criteria 포함
- [x] 비기능 요구사항(NFR)에 측정 가능한 지표 명시 (P99 latency, 가용성 등)
- [ ] **FAIL**: FR-004 의 에러 처리 경로가 명시되지 않음
- [x] 용어가 온톨로지/Ubiquitous Language 와 일치
- [x] 외부 의존성(DB, SQS 등) 명시
- [ ] **FAIL**: NFR-002 에서 "충분히 빠름" 이라는 모호한 표현 발견

**Failed Checks**: 2
**Action Required**: 사용자 확인 후 재작성 필요
```

- 각 산출물 유형별 요구사항 검증 체크리스트를 온톨로지 또는 조직 확장(extensions)에 저장
- CI 파이프라인에 조직 자체 `aidlc-validate` 단계를 추가해 리포트를 PR 코멘트로 게시
- 실패 항목을 GitHub Issue 로 자동 생성하고 해결 전까지 승인 게이트에서 차단

---

## 4. 규칙 3: Error Handling

### 무엇
AIDLC 실행 중 발생한 모든 예외(파일 누락, 도구 오류, 사용자 응답 없음 등)를 **구조화된 에러 리포트**로 기록하고, **재시도 또는 사용자 개입 여부**를 명시적으로 결정합니다.

### 왜
- Silent failure 는 감사 추적을 불가능하게 만듦
- 에러 발생 시점에 따라 **자동 재시도 / 사용자 개입 / 세션 종료** 중 적절한 대응 필요
- 에러 패턴 분석으로 AIDLC 자체를 개선

### 어떻게

**에러 리포트 포맷:**
```yaml
error:
  id: ERR-2026-04-18-001
  timestamp: 2026-04-18T10:23:45Z
  stage: inception.requirements_analysis
  type: missing_context
  message: "Workspace Detection 결과가 세션에 없음"
  severity: medium
  recovery:
    auto_retry: false
    user_action_required: true
    suggested_fix: "Workspace Detection stage 를 먼저 실행하세요"
  context:
    session_id: sess-20260418-abc123
    prior_stage: workspace_detection
```

**에러 분류:**
| Severity | 예시 | 대응 |
|----------|------|------|
| Low | 옵션 응답 외 자유 기술 | AI 가 자동 해석 후 확인 질문 |
| Medium | 필수 선행 stage 미실행 | 사용자에게 stage 역순 실행 안내 |
| High | 도구 호출 실패 (MCP 서버 다운 등) | 세션 일시 중지, 로그 수집 |
| Critical | 온톨로지 계약 위반 (예: 허용되지 않은 도메인 용어 사용) | 즉시 중단, 사람 개입 |

### 엔터프라이즈 적용 팁
- 에러 리포트를 **CloudWatch Logs Insights** 로 전송해 패턴 분석
- High/Critical 에러는 PagerDuty 연동
- 월 1회 에러 리뷰 미팅으로 AIDLC 자체 개선

---

## 5. 규칙 4: Overconfidence Prevention

### 무엇
AI 응답에 **확신도(confidence)** 를 명시하고, 확신도가 낮은 경우 **사용자에게 추가 컨텍스트를 요청**하도록 강제합니다.

### 왜
- LLM 은 종종 잘못된 답을 매우 자신 있는 어조로 생성함 (hallucination)
- 확신도 표기는 사용자가 **어디를 집중 검토할지** 판단하는 신호
- 조직 내 AI 의사결정 신뢰 수준을 투명하게 관리

### 어떻게

**확신도 표기:**
```markdown
## 제안: Payment Service 인증 아키텍처

**Confidence**: High (90%)

Cognito User Pool + JWT 를 권장합니다. 이유는...

---

## 제안: DynamoDB 테이블 설계

**Confidence**: Medium (60%)
**Reason for lower confidence**: Payment 도메인의 읽기/쓰기 비율 정보가 없어 
GSI 설계가 최적이 아닐 수 있습니다.

**Additional Context Needed**:
- 일일 트랜잭션 수?
- 조회 패턴 (사용자별? 시간대별?)

[Answer]:
```

### 엔터프라이즈 적용 팁
- **Low confidence (< 50%) 응답은 자동으로 Checkpoint Approval 게이트에서 일시 중지**
- Confidence 분포를 통계로 관리해 AI 개선 우선순위 식별
- 확신도는 AI 가 스스로 선언한 값이므로 자동 채택의 근거로 쓰지 않습니다. 금융·의료 등 규제 산업에서 중요한 결정은 선언된 확신도와 무관하게 사람의 승인을 거칩니다

---

## 6. 규칙 5: Session Continuity

### 무엇
AIDLC 세션이 중단·재개되더라도 **영속화된 컨텍스트(질문·답변·산출물)를 다시 불러올** 수 있도록 상태를 저장합니다. v0.1.7 의 `common/session-continuity.md` 는 재개 시 먼저 `aidlc-docs/aidlc-state.md` 를 읽고 이전 단계의 산출물을 다시 로드하도록 규정합니다. 복원되는 것은 파일로 저장된 상태·답변·산출물이며, 모델의 실시간 추론 상태(context window)는 복원 대상이 아닙니다.

### 왜
- 엔터프라이즈 프로젝트는 여러 날·여러 팀에 걸쳐 실행됨
- 세션 종료 시 컨텍스트 유실 = 중복 질문 · 재작업 · 정보 손실
- 팀원 간 핸드오프 시 "어디까지 했지?" 파악 가능해야 함

### 어떻게

**세션 상태 파일 (`aidlc-docs/aidlc-state.md`):**
```markdown
# AIDLC Session State

**Session ID**: sess-20260418-payment-service
**Started**: 2026-04-17T09:00:00Z
**Last Active**: 2026-04-18T10:30:00Z
**Owner**: yjeong@example.com

## Progress

| Stage | Status | Artifacts | Approved By | Approved At |
|-------|--------|-----------|-------------|-------------|
| workspace_detection | complete | `aidlc-docs/aidlc-state.md` | yjeong | 2026-04-17T09:15:00Z |
| requirements_analysis | complete | `requirements.md` | yjeong | 2026-04-17T11:00:00Z |
| user_stories | complete | `user-stories.md` | yjeong | 2026-04-17T14:00:00Z |
| workflow_planning | in_progress | - | - | - |

## Pending Questions

Q3. Authentication 방식 — 2026-04-18T10:30:00Z 에 질문, 답변 대기 중
```

### 엔터프라이즈 적용 팁
- 세션 상태는 **Git 으로 버전 관리** (PR 기반 협업 가능)
- S3 + Versioning 으로 세션 상태 백업 (감사용)
- 30일 이상 비활성 세션은 자동 아카이브

---

## 7. 규칙 6: Workflow Changes

### 무엇
AI 가 **워크플로 순서를 임의로 추가·건너뛰기·수정하지 못하도록** 합니다. 변경은 **반드시 사용자의 명시적 승인** 을 거쳐야 합니다.

### 왜
- AI 가 "효율적이라고 판단해" stage 를 건너뛰면 감사 추적 붕괴
- 조직 규제(예: 금융 감독 규정)는 특정 stage 의무 실행 요구
- 워크플로 변경 이력은 조직 학습 자산

### 어떻게

**워크플로 변경 요청 템플릿:**
```markdown
## Workflow Change Request

**Current Workflow**: workspace_detection → requirements_analysis → user_stories → workflow_planning

**Proposed Change**: user_stories 를 건너뛰고 바로 workflow_planning 으로 진행

**Reason**: 이미 `user-stories.md` 가 존재하며, 재검토 불필요

**Impact**:
- Session 소요 시간 1시간 단축
- 단, 최신 요구사항 변경 반영 누락 리스크

**Approval Required**: A. 승인 / B. 거부 / C. 조건부 승인 (추가 검토 후)

[Answer]:
```

### 엔터프라이즈 적용 팁
- **Skip 불가 stage 목록** 을 조직 확장(extensions)에 정의 (예: 금융은 security-review 건너뛰기 금지)
- 변경 이력을 월별 거버넌스 리뷰에서 검토
- "이례적 변경(outlier)" 패턴은 워크플로 개선 시그널

---

## 8. 규칙 7: Checkpoint Approval

### 무엇
주요 stage 완료 시점에 **사람의 명시적 승인** 을 요구합니다. "Checkpoint Approval" 이라는 단일 공식 규칙 파일은 `common/` 에 없으며, 승인은 각 stage 규칙 안에 개별적으로 정의되어 있습니다. v0.1.7 에서 Requirements Analysis 와 User Stories 는 산출물 생성 후 명시적 승인 단계(예: `inception/user-stories.md` 의 Step 13·21 "Wait for Explicit Approval")를 두는 반면, Workspace Detection 은 "승인 없이 자동 진행"으로 규정됩니다. 따라서 승인 경계는 stage 마다 다르며, "모든 전환마다 승인" 은 일반화된 표현입니다.

### 왜
- Stage 를 되돌리는 것 자체는 가능하지만, 이미 생성된 하위 산출물을 다시 작업해야 합니다. 예를 들어 requirements_analysis 로 되돌아가면 그 뒤의 user_stories·design 산출물을 갱신해야 합니다
- 승인은 **품질 게이트 + 거버넌스 증거** 로 동시에 기능
- Human in the loop 원칙의 구체적 구현

### 어떻게

**승인 템플릿:**
```markdown
## Checkpoint Approval Gate

**Completing Stage**: requirements_analysis
**Next Stage**: user_stories

**Artifacts Produced**:
- `requirements.md` (1,234 lines)
- `.aidlc/validation-report.md` (Content Validation 통과)
- `.aidlc/audit/stage-requirements-analysis.md`

**Review Checklist**:
- [x] 모든 비즈니스 요구사항 포함
- [x] NFR 측정 가능
- [x] 이해관계자 리뷰 완료

**Approver**: yjeong@example.com
**Approval Decision**:

A. Approve (다음 stage 진행)
B. Reject (현재 stage 재작업 필요)
C. Approve with comments

[Answer]:
```

### 엔터프라이즈 적용 팁
- **다중 승인자 패턴**: 아키텍트 + 보안 + PM 3인 승인 필수인 경우 멀티시그 게이트 구현
- 승인 기록은 **감사 로그(규칙 8)** 와 자동 연동
- 승인 없이 다음 stage 실행 시도 시 에러 발생 (규칙 3 에 의해 처리)

---

## 9. 규칙 8: Audit Logging

### 무엇
AIDLC 실행 중 발생한 모든 이벤트(질문, 답변, 승인, 에러)를 **ISO 8601 타임스탬프 + 원본 텍스트 보존** 형식으로 감사 로그에 기록합니다.

### 왜
- 금융·의료 등 규제 산업은 의사결정 근거의 완전한 재현 가능성 요구
- 사고 발생 시 원인 분석
- AIDLC 자체 개선을 위한 데이터 축적

### 어떻게

**감사 로그 포맷 (`audit.md`):**
````markdown
## Event: Checkpoint Approval Granted

**Event ID**: evt-2026-04-18-042
**Timestamp**: 2026-04-18T10:45:12.345Z
**Session**: sess-20260418-payment-service
**Actor**: yjeong@example.com
**Stage Transition**: requirements_analysis → user_stories

**Original User Response** (원본 보존):
```
[Answer]: A
```

**AI Interpretation**: Approve (다음 stage 진행)

**Artifacts Hash**:
- requirements.md: sha256:abc123...
- validation-report.md: sha256:def456...

---

## Event: Question Asked

**Event ID**: evt-2026-04-18-041
**Timestamp**: 2026-04-18T10:42:00.000Z
**Session**: sess-20260418-payment-service
**Stage**: requirements_analysis
**Question Text** (원본 보존):
```
Q15. Payment Service 의 데이터 저장소로 무엇을 선택하시겠습니까?
A. DynamoDB
B. Aurora PostgreSQL
...
```
````

**감사 로그 원칙:**
1. **Append-only (작성 정책)**: 작성 측이 기존 로그를 수정하지 않고 새 이벤트만 추가합니다. 이는 운영 규칙일 뿐이며, 기술적 변조 방지는 아래 저장소 설정으로 강제합니다
2. **원본 보존**: AI 의 해석/요약이 아닌 사용자·AI 의 **원본 텍스트** 저장
3. **ISO 8601 타임스탬프**: 밀리초 precision + UTC 표기
4. **Artifact Hashing**: 산출물 SHA-256 로 무결성 검증

### 엔터프라이즈 적용 팁
- append-only 작성 정책만으로는 수정·삭제를 막지 못하므로, 변조 방지는 **S3 + Object Lock(WORM)** 처럼 쓰기 후 변경이 불가능한 저장소로 강제합니다
- 금융권은 최소 7년, 의료는 10년 보관 정책 적용
- 상세 규격은 [Audit & Governance Logging](../operations/audit-governance.md) 참조

---

## 10. 규칙 9: No Duplication

### 무엇
AIDLC 산출물 간에 **동일 정보를 중복 생성하지 않습니다**. 한 곳(Single Source of Truth, SSOT)에만 정보를 두고, 다른 곳에서는 참조합니다.

### 왜
- 중복은 불일치로 이어짐 (한쪽만 업데이트되면 산출물 간 모순 발생)
- 모순된 산출물은 사람과 AI 모두에게 어느 값이 맞는지 혼란을 줌
- 동일 정보가 여러 곳에 있으면 변경 시 모든 사본을 함께 고쳐야 해 유지보수 부담이 커짐

### 어떻게

**중복 예시 (잘못된 패턴):**
```markdown
# requirements.md
- API latency P99 < 200ms

# design.md
- API latency P99 < 200ms
- 추가로 P95 < 100ms 필요

# nfr.md
- API P99 latency < 150ms  ← 불일치!
```

**올바른 패턴 (SSOT):**
```markdown
# nfr.md (SSOT)
- PAY-NFR-001: API latency P99 < 200ms, P95 < 100ms

# requirements.md
- 성능 요구사항: PAY-NFR-001 참조

# design.md
- 성능 목표: PAY-NFR-001 참조, HPA 임계값은 이 목표에서 역산
```

### 엔터프라이즈 적용 팁
- 모든 요구사항·NFR·결정에 **고유 ID 부여** (`PAY-NFR-001`)
- 산출물 간 참조는 **ID 기반 링크** 만 허용
- CI 에서 중복 문자열 검출 (>20 단어 동일 문장 발견 시 경고)

---

## 11. 규칙 10: Methodology First

### 무엇
AIDLC 는 **특정 도구·플랫폼에 종속되지 않는 방법론**으로 동작해야 합니다. 같은 산출물이 Kiro, Claude Code, Cursor 등 어디서든 생성 가능해야 합니다.

### 왜
- 도구 lock-in 은 조직의 민첩성을 저해
- 방법론 > 도구 순서여야 장기적 자산화 가능
- 산업 표준화(7개 지원 플랫폼)의 기반

### 어떻게

**도구 독립적 설계 원칙:**
1. 산출물은 **평문 Markdown + YAML** 만 사용
2. 특정 IDE 기능(예: Kiro 의 Spec 파일) 의존 금지 — Generic 템플릿 제공
3. MCP 서버 등 도구별 통합은 **별도 확장**으로 분리

**Bad (도구 종속):**
```markdown
# design.md
Kiro 의 `.kiro/spec/design.md` 참조
```

**Good (도구 독립):**
```markdown
# design.md
자세한 MCP 통합은 본 저장소의 `extensions/kiro-mcp/` 참조 (Kiro 사용 시에만)
```

### 엔터프라이즈 적용 팁
- 조직 표준 템플릿은 **모든 플랫폼에서 동작** 하도록 검증 (최소 2개 플랫폼 테스트)
- 팀별 도구 선호도 차이를 허용하되, 산출물 포맷은 통일
- 플랫폼 교체 시 산출물 마이그레이션이 **단순 파일 복사** 수준이어야 함

---

## 12. 규칙 11: Reproducible

### 무엇
동일한 입력(Workspace 상태 · Requirements · 질문 응답)에 대해, **동일 모델 + 동일 프롬프트**라면 **거의 동일한 산출물**을 생성해야 합니다.

### 왜
- 재현 불가능한 시스템은 감사·디버깅·개선 불가
- 팀 간 지식 전수 (같은 입력을 주면 같은 결과) 가능
- AIDLC 자체를 **신뢰 가능한 프로세스**로 만듦

### 어떻게

**재현성 확보 메커니즘:**
1. **구조화된 질문 포맷 (규칙 1)** — 답변 해석 일관성
2. **Temperature 0 또는 낮은 값** — LLM 출력 안정화
3. **Frozen model version** — `claude-opus-4-7` 처럼 명시적 버전 고정
4. **Seed 고정** (지원 모델) — 동일 seed 시 동일 출력

**재현성 테스트:**

아래 `aidlc run` 은 공식 CLI 가 아니라, 조직이 AIDLC 실행을 감싸 만드는 예시 러너입니다. "90% 이상 동일" 은 측정 기준을 함께 정의해야 의미가 있습니다. 아래 예시는 산출물 Markdown 을 줄 단위로 비교해 변경되지 않은 줄의 비율로 유사도를 계산합니다. 조직은 토큰 단위·의미 단위 등 자체 기준을 선택하고 문서화해야 합니다.

```bash
# 동일 입력으로 3회 실행 후 산출물 diff (aidlc run 은 조직 자체 러너 예시)
aidlc run --input requirements.md --session test-1
aidlc run --input requirements.md --session test-2
aidlc run --input requirements.md --session test-3

# 줄 단위 비교: 변경되지 않은 줄 비율 >= 90% 를 재현 성공으로 간주
diff .aidlc/test-1/requirements.md .aidlc/test-2/requirements.md
```

### 엔터프라이즈 적용 팁
- **모델 업그레이드 시 재현성 회귀 테스트** 필수 (골든 입력 세트 유지)
- 모델 교체로 인한 **산출물 drift > 20%** 시 롤백
- 규제 산업은 감사·재현 요구 기간에 맞춰 모델 버전 고정 기간을 정합니다. 3-5년은 이 가이드의 예시이며 NIST SP 800-218A의 권장이 아닙니다. SP 800-218A는 고정 기간을 정하지 않고, AI 모델의 사용 중단과 이전 버전 롤백 기준을 수립하도록 권고합니다.

---

## 13. 엔터프라이즈 적용 통합 가이드

### 13.1 Common Rules → 거버넌스 매핑

| 규칙 | ISO 27001 관련 | SOC 2 관련 | 한국 ISMS-P 관련 |
|------|----------------|-------------|------------------|
| Checkpoint Approval (7) | A.5.15 Access Control | CC6.2 | 2.8.3 변경관리 |
| Audit Logging (8) | A.8.15 Logging | CC7.2 | 2.9.4 로그관리 |
| Content Validation (2) | A.8.29 Security Testing | CC8.1 | 2.11.2 소프트웨어 검증 |
| Error Handling (3) | A.5.24 Incident Management | CC7.3 | 2.10.4 침해사고 대응 |

### 13.2 적용 로드맵

```mermaid
gantt
    title AIDLC Common Rules 도입 로드맵 (3개월)
    dateFormat  YYYY-MM-DD
    section 준비
    교육 및 파일럿 선정        :2026-04-01, 14d
    section Phase 1
    규칙 1,9,10 (상호작용·SSOT) :2026-04-15, 21d
    section Phase 2
    규칙 2,3,4 (품질 검증)       :2026-05-06, 21d
    section Phase 3
    규칙 5,6,7,8 (거버넌스)      :2026-05-27, 28d
    section Phase 4
    규칙 11 + 전사 확산          :2026-06-24, 14d
```

### 13.3 도구·플랫폼별 구현 상태 (2026-04 기준) {#133-도구플랫폼별-구현-상태-202604-기준}

아래 Full/Partial/Limited 는 측정된 적합성 점수가 아니라 2026-04 시점의 **미검증 추정**입니다. 버전별 설정 증거로 뒷받침되지 않았으므로 도입 판단의 근거로 삼기 전에 각 도구의 해당 버전에서 직접 확인해야 합니다. 각 셀은 특정 설정·버전에서 달라질 수 있습니다.

| 플랫폼 | 규칙 1-4 | 규칙 5-8 | 규칙 9-11 | 비고 |
|--------|---------|---------|-----------|------|
| **Kiro** | Full | Full | Full | v0.1.7 설정: steering 파일, Kiro IDE Vibe 모드 |
| **Claude Code** | Full | Full | Partial | reproducibility 는 seed 미지원 |
| **Cursor** | Partial | Partial | Partial | 확장 필요 |
| **Q Developer** | Full | Full | Full | AWS 통합 우수 |
| **Cline** | Partial | Partial | Full | CLI 중심 |
| **Copilot** | Partial | Limited | Limited | 상호작용 제한 |

[공식 v0.1.7 설정 가이드](https://github.com/awslabs/aidlc-workflows/blob/v0.1.7/README.md#kiro)는 규칙을 `.kiro/steering/aws-aidlc-rules/`에, 상세 규칙을 `.kiro/aws-aidlc-rule-details/`에 설치하도록 안내합니다. Kiro IDE에서는 이 워크플로를 **Vibe 모드**로 실행하고 spec 모드 전환 요청을 거절하도록 명시합니다. 이 문서화된 설정이 위 Kiro 점수를 검증하는 것은 아니며, 나머지 비고는 작성자의 추정입니다.

`AGENTS.md`는 instructions 파일이며, 자체 적합성 점수가 있는 에이전트나 플랫폼이 아닙니다. 같은 버전의 가이드는 이를 [Cursor](https://github.com/awslabs/aidlc-workflows/blob/v0.1.7/README.md#cursor-ide)와 [Cline](https://github.com/awslabs/aidlc-workflows/blob/v0.1.7/README.md#cline)의 대체 설정 방법으로 제공합니다. 파일을 읽는다는 사실만으로 해당 에이전트가 모든 규칙을 따른다고 확인할 수는 없습니다.

---

## 14. 참고 자료

### 공식 저장소
- [AWS Labs AIDLC Common Rules](https://github.com/awslabs/aidlc-workflows/tree/v0.1.7/aidlc-rules/aws-aidlc-rule-details/common) — 11개 규칙 원문
- [AWS Labs AIDLC Workflows (v0.1.7)](https://github.com/awslabs/aidlc-workflows) — 전체 저장소

### 관련 문서
- [10대 원칙과 실행 모델](./principles-and-model.md) — engineering-playbook 의 10대 원칙 (공식 5대 원칙 + 확장)
- [Adaptive Execution](./adaptive-execution.md) — 조건부 stage 실행 (규칙 6 Workflow Changes 와 연계)
- [Audit & Governance Logging](../operations/audit-governance.md) — 규칙 7, 8 의 운영 구현
- [하네스 엔지니어링](./harness-engineering.md) — 규칙 2 (Content Validation) 의 아키텍처적 강제

### 규제 매핑
- [ISO/IEC 27001:2022](https://www.iso.org/standard/27001)
- [AICPA SOC 2 Trust Services Criteria](https://www.aicpa-cima.com/)
- [KISA ISMS-P 인증기준](https://isms.kisa.or.kr/)
