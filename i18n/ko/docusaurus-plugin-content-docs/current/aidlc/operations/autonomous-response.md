---
title: 자율 대응
description: AI Agent 기반 자율 인시던트 대응 — Strands/Kagent 통합, Chaos Engineering + AI, 온톨로지 피드백 루프
created: "2026-04-07"
last_update:
  date: 2026-10-29
  author: YoungJoon Jeong
reading_time: 14
tags:
  - aidlc
  - operations
  - agentops
  - agentic-ai
  - scope:ops
sidebar_label: 자율 대응
---

import { ResponsePatterns, ChaosExperiments } from '@site/src/components/PredictiveOpsTables';
import { OperationPatternsComparison, AiopsMaturityModel } from '@site/src/components/AiopsIntroTables';

## 1. 개요

**자율 대응(Autonomous Response)**은 AI Agent가 인시던트를 감지하고, 컨텍스트를 수집·분석하여, 사전 정의된 가드레일 내에서 자율적으로 복구를 실행하는 운영 패러다임입니다.

### 자율 대응의 3단계

```
[감지 (Detection)]
  CloudWatch Alarm · DevOps Guru · K8s Event
         ↓
[판단 (Decision)]
  MCP로 컨텍스트 수집 → AI 근본 원인 분석 → 대응 방안 결정
         ↓
[실행 (Execution)]
  안전한 범위 내 자동 복구 OR 에스컬레이션
```

### 왜 자율 대응이 필요한가

- **MTTR 단축(목표)**: 반복되는 유형의 장애에서 감지부터 조치까지 걸리는 시간을 줄이는 것이 목표입니다. "수동 대응 평균 2시간 → AI 자율 대응 평균 5분"은 예시 수치입니다(실측 데이터가 아닌 가상 시나리오).
- **24/7 대응 보조**: 자동 처리 범위에 드는 야간·주말 알림을 에이전트가 처리해 당직자 부담을 줄이는 것이 목표입니다. 자동 처리 범위 밖의 알림과 최종 책임은 사람에게 남습니다.
- **일관성**: 표준화된 SOP로 대응 절차의 편차를 줄입니다. LLM의 판단도 실행마다 달라지거나 틀릴 수 있으므로, 위험도가 높은 조치에는 사람의 승인이 필요합니다.
- **학습 효과**: 대응 패턴을 학습해 정확도를 높이는 것이 목표입니다. 실제로 개선되었는지는 오탐률·누락률 같은 평가 지표로 확인해야 합니다.

---

## 2. 운영 자동화 패턴: Human-Directed, Programmatically-Executed

AIOps의 핵심은 **사람이 의도(Intent)와 가드레일을 정의하고, 시스템이 프로그래머틱하게 실행**하는 모델입니다.

### 2.1 세 가지 패턴 스펙트럼

**Prompt-Driven (Interactive)**
- 각 단계를 사람이 자연어로 지시
- AI가 단일 작업 수행
- 적합: 탐색적 디버깅, 새로운 유형의 장애
- 한계: Human-in-the-Loop, 반복 시나리오에서 비효율적

**Spec-Driven (Codified)**
- 운영 시나리오를 Spec으로 선언적 정의
- 시스템이 프로그래머틱하게 실행
- 적합: 반복적 배포, 정형화된 운영 절차
- 핵심: Spec 한 번 정의 → 재사용 시 작성 비용은 거의 없음(실행마다 컴퓨팅·API 비용은 발생)

**Agent-Driven (Autonomous)**
- AI Agent가 이벤트 감지 → 컨텍스트 수집 → 자율 대응
- Human-on-the-Loop (사람은 가드레일 설정)
- 적합: 인시던트 자동 대응, 비용 최적화, 예측 스케일링
- 핵심: 초 단위 대응, 컨텍스트 기반 지능형 판단

### 2.2 패턴 비교: EKS Pod CrashLoopBackOff 대응

<OperationPatternsComparison />

:::tip 실전에서의 패턴 조합
세 패턴은 배타적이 아니라 **상호 보완적**입니다. 새로운 장애 유형을 **Prompt-Driven**으로 탐색·분석한 뒤, 반복 가능한 패턴을 **Spec-Driven**으로 코드화하고, 최종적으로 **Agent-Driven**으로 자율화하는 점진적 성숙 과정을 거칩니다.
:::

---

## 3. AI Agent 인시던트 대응

### 3.1 기존 자동화의 한계

EventBridge + Lambda 기반 자동화는 **규칙 기반**이므로 한계가 있습니다:

```
[기존 방식: 규칙 기반 자동화]
CloudWatch Alarm → EventBridge Rule → Lambda → 고정된 조치

문제점:
  ✗ "CPU > 80%이면 스케일아웃" — 원인이 메모리 누수일 수도 있음
  ✗ "Pod 재시작 > 5이면 알림" — 원인별 대응이 다름
  ✗ 복합 장애 대응 불가
  ✗ 새로운 패턴에 적응 불가
```

### 3.2 AI Agent 기반 자율 대응

<ResponsePatterns />

AI Agent는 **컨텍스트 기반 판단**으로 자율적으로 대응합니다.

```mermaid
graph TD
    subgraph Trigger["🔔 트리거"]
        CWA["CloudWatch<br/>Alarm"]
        DGA["DevOps Guru<br/>Insight"]
        K8SE["K8s<br/>Event"]
    end

    subgraph Agent["🤖 AI Agent"]
        COLLECT["데이터 수집<br/>(MCP 통합)"]
        ANALYZE["AI 분석<br/>(근본 원인)"]
        DECIDE["판단<br/>(자동/수동)"]
        ACT["실행<br/>(안전한 조치)"]
        REPORT["보고<br/>(Slack/Jira)"]
    end

    subgraph Actions["⚡ 대응 조치"]
        SCALE["스케일링<br/>조정"]
        RESTART["Pod<br/>재시작"]
        ROLLBACK["배포<br/>롤백"]
        ESCALATE["사람에게<br/>에스컬레이션"]
    end

    CWA --> COLLECT
    DGA --> COLLECT
    K8SE --> COLLECT
    COLLECT --> ANALYZE --> DECIDE
    DECIDE --> ACT --> REPORT
    ACT --> SCALE
    ACT --> RESTART
    ACT --> ROLLBACK
    ACT --> ESCALATE
```

### 3.3 Kagent 자동 인시던트 대응

**Kagent**은 Kubernetes Native AI Agent로, CRD를 통해 자동 대응을 정의합니다. 아래 매니페스트는 예시이며, `apiVersion`은 설치한 kagent 버전의 CRD와 일치시켜야 하고(버전에 따라 스키마가 달라짐), `model`에는 사용 리전에서 활성화한 실제 Bedrock 모델 ID를 지정해야 합니다.

systemPrompt에 적은 수치·조치 한도(HPA ±50%, replicas 50% 이상 영향 시 에스컬레이션, StatefulSet 변경 등)는 모델에게 주는 지침일 뿐이며 모델이 지키지 않을 수 있습니다. 정량적 한도와 금지 조치는 모델 밖에서 강제해야 합니다. 예를 들어 Kubernetes RBAC로 허용 동작을 제한하고, OPA/Gatekeeper나 Kyverno 같은 admission 정책으로 변경 폭(예: replica 변경 비율)과 대상(StatefulSet·NetworkPolicy)을 차단합니다.

```yaml
# Kagent: 자동 인시던트 대응 에이전트
# apiVersion은 설치한 kagent 버전의 CRD에 맞춰 지정 (스키마는 버전별로 다름)
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: incident-responder
  namespace: kagent-system
spec:
  description: "EKS 인시던트 자동 대응 에이전트"
  modelConfig:
    provider: bedrock
    model: anthropic.claude-3-5-sonnet-20241022-v2:0  # 리전에서 활성화한 실제 Bedrock 모델 ID
    region: ap-northeast-2
  systemPrompt: |
    당신은 EKS 인시던트 대응 에이전트입니다.

    ## 대응 원칙
    1. 안전 우선: 위험한 변경은 사람에게 에스컬레이션
    2. 근본 원인 우선: 증상이 아닌 원인에 대응
    3. 최소 개입: 필요한 최소한의 조치만 수행
    4. 모든 조치 기록: Slack과 JIRA에 자동 보고

    ## 자동 조치 허용 범위
    - Pod 재시작 (CrashLoopBackOff, 5회 이상)
    - HPA min/max 조정 (현재값의 ±50% 범위)
    - Deployment rollback (이전 버전으로)
    - 노드 drain (MemoryPressure/DiskPressure)

    ## 에스컬레이션 대상
    - 데이터 손실 가능성이 있는 조치
    - 50% 이상의 replicas 영향
    - StatefulSet 관련 변경
    - 네트워크 정책 변경

  tools:
    - name: kubectl
      type: kmcp
      config:
        allowedVerbs: ["get", "describe", "logs", "top", "rollout", "scale", "delete"]
        deniedResources: ["secrets", "configmaps"]
    - name: cloudwatch
      type: kmcp
      config:
        actions: ["GetMetricData", "DescribeAlarms", "GetInsight"]
    - name: slack
      type: mcp
      config:
        webhook_url: "${SLACK_WEBHOOK}"
        channel: "#incidents"

  triggers:
    - type: cloudwatch-alarm
      filter:
        severity: ["CRITICAL", "HIGH"]
    - type: kubernetes-event
      filter:
        reason: ["CrashLoopBackOff", "OOMKilled", "FailedScheduling"]
```

### 3.4 Strands Agent SOP: 복합 장애 대응

**Strands**는 Python 기반 OSS Agent 프레임워크로, 운영 절차(SOP, Standard Operating Procedure)를 시스템 프롬프트로 정의합니다. 아래 예시는 Strands Agents SDK의 실제 API를 따릅니다. 도구는 `@tool` 데코레이터로 직접 정의하며(`eks_tool` 등은 여기서 사용자가 구현해야 할 자리표시자입니다), 운영 절차는 `sop=`가 아니라 `system_prompt=`로 전달합니다. 실제 적용 시에는 SDK 버전을 고정하고 해당 버전의 API를 확인하세요.

```python
# Strands Agent: 복합 장애 자동 대응
from strands import Agent, tool

# 도구는 @tool 로 직접 정의 (아래는 자리표시자 — 실제 구현 필요)
@tool
def eks_tool(action: str) -> dict:
    ...
@tool
def cloudwatch_tool(query: str) -> dict:
    ...
@tool
def slack_tool(message: str) -> dict:
    ...
@tool
def jira_tool(summary: str) -> dict:
    ...

incident_agent = Agent(
    name="complex-incident-handler",
    model="bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0",
    tools=[eks_tool, cloudwatch_tool, slack_tool, jira_tool],
    system_prompt="""
    ## 복합 장애 대응 SOP

    ### Phase 1: 상황 파악 (30초 이내)
    1. CloudWatch 알람 및 DevOps Guru 인사이트 조회
    2. 관련 서비스의 Pod 상태 확인
    3. 노드 상태 및 리소스 사용률 확인
    4. 최근 배포 이력 확인 (10분 이내 변경 사항)

    ### Phase 2: 근본 원인 분석 (2분 이내)
    1. 로그에서 에러 패턴 추출
    2. 메트릭 상관 분석 (CPU, Memory, Network, Disk)
    3. 배포 변경과의 시간적 상관관계 분석
    4. 의존 서비스 상태 확인

    ### Phase 3: 자동 대응
    원인별 자동 조치(조치 전 각 원인의 상관 근거를 먼저 확인):

    **배포 관련 장애:**
    - 최근 10분 이내 배포가 있고, 그 배포 시점 이후 에러가 시작된 상관관계가 확인되면 → 자동 롤백
    - 롤백 후 상태 확인 → 정상화되면 완료

    **리소스 부족:**
    - CPU/Memory > 90% 이고 포화가 지속(일시 스파이크가 아님)으로 확인되면 → HPA 조정 또는 Karpenter 노드 추가
    - Disk > 85% → 불필요 로그/이미지 정리

    **의존 서비스 장애:**
    - RDS 연결 실패가 애플리케이션 에러와 시간적으로 일치하면 → 연결 풀 설정 확인, 필요시 재시작
    - SQS 지연 → DLQ 확인, 소비자 스케일아웃

    **원인 불명 또는 상관 근거 부족:**
    - 사람에게 에스컬레이션
    - 수집된 모든 데이터를 Slack에 공유

    ### Phase 4: 사후 처리
    1. 인시던트 타임라인 생성
    2. JIRA 인시던트 티켓 생성
    3. Slack #incidents 채널에 보고서 게시
    4. 학습 데이터로 저장 (피드백 루프)
    """
)
```

:::info AI Agent의 핵심 가치
EventBridge+Lambda를 넘어 AI 컨텍스트 기반 자율 대응이 가능합니다. **다양한 데이터 소스**(CloudWatch, EKS API, X-Ray, 배포 이력)를 **MCP로 통합 조회**하여, 규칙으로는 대응할 수 없는 복합 장애도 근본 원인을 분석하고 적절한 조치를 자동으로 수행합니다.
:::

### 3.5 Amazon Q Developer 통합

Amazon Q Developer는 자연어 인터페이스로 운영을 단순화합니다:

```
[사용자 질문]
"이 클러스터에서 OOM이 발생하는 Pod를 찾아줘"

[Amazon Q Developer 응답]
발견된 OOM 이벤트:
- payment-service-7d8f9c4b-xyz (namespace: payment)
  └─ 최근 3회 OOMKilled (지난 1시간)
  └─ 메모리 limits: 512Mi, 실제 사용: 520Mi
  └─ 권장: memory limits를 1Gi로 증가

실행된 명령:
$ kubectl get events --all-namespaces --field-selector reason=OOMKilled
$ kubectl top pod -n payment payment-service-7d8f9c4b-xyz

다음 조치를 원하시나요?
1. memory limits 자동 조정 (VPA 적용)
2. 상세 메모리 프로파일링 시작
3. 관련 로그 전체 분석
```

---

## 4. Tribal Knowledge 활용

AI Agent는 팀의 **운영 히스토리(Tribal Knowledge)**를 학습하여 복구를 자동화합니다.

### 4.1 과거 인시던트 학습

```python
# 과거 인시던트 대응 패턴 학습
from strands import Agent

knowledge_base = {
    "incident_patterns": [
        {
            "symptom": "payment-service 500 에러 급증",
            "root_cause": "RDS 연결 풀 고갈",
            "solution": "maxPoolSize 증가 또는 연결 누수 수정",
            "frequency": 5,
            "last_occurrence": "2026-03-15"
        },
        {
            "symptom": "API Gateway 504 타임아웃",
            "root_cause": "Lambda cold start + VPC ENI 할당 지연",
            "solution": "Provisioned Concurrency 활성화",
            "frequency": 3,
            "last_occurrence": "2026-02-20"
        }
    ]
}

# AI Agent가 과거 패턴 참조
tribal_agent = Agent(
    name="tribal-knowledge-responder",
    model="bedrock/anthropic.claude-sonnet",
    tools=[eks_tool, knowledge_base_tool],
    sop="""
    ## Tribal Knowledge 기반 대응

    1. 현재 증상 분석
    2. 과거 유사 패턴 검색
    3. 검증된 해결책 우선 적용
    4. 새로운 패턴이면 탐색 후 Knowledge Base 업데이트
    """
)
```

### 4.2 지식 베이스 자동 업데이트

```yaml
# 인시던트 대응 후 자동 학습
apiVersion: batch/v1
kind: Job
metadata:
  name: update-knowledge-base
spec:
  backoffLimit: 3                 # 실패 시 재시도 횟수
  template:
    spec:
      restartPolicy: Never        # Job Pod는 Never 또는 OnFailure 필수
      containers:
        - name: learner
          image: my-registry/incident-learner:latest
          command: ["python", "/app/learn.py"]
          env:
            - name: INCIDENT_ID
              value: "INC-2026-04-07-001"
            - name: KNOWLEDGE_BASE_S3
              value: "s3://my-bucket/tribal-knowledge.json"
```

---

## 5. Kiro 프로그래머틱 디버깅

### 5.1 디렉팅 vs 프로그래머틱 대응 비교

```
[디렉팅 기반 대응] — 수동, 반복적, 비용 높음
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  운영자: "payment-service 500 에러 발생"
  AI:     "어떤 Pod에서 발생하나요?"
  운영자: "payment-xxx Pod"
  AI:     "로그를 보여주세요"
  운영자: (kubectl logs 실행 후 복사-붙여넣기)
  AI:     "DB 연결 오류 같습니다. RDS 상태를 확인해주세요"
  ...반복...

  총 소요: 15-30분, 수동 작업 다수

[프로그래머틱 대응] — 자동, 체계적, 비용 효율적
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  알림: "payment-service 500 에러 발생"

  Kiro Spec:
    1. EKS MCP로 Pod 상태 조회
    2. 에러 로그 수집 및 분석
    3. 관련 AWS 서비스 (RDS, SQS) 상태 확인
    4. 근본 원인 진단
    5. 자동 수정 코드 생성
    6. PR 생성 및 검증

  총 소요: 2-5분, 자동화
```

### 5.2 Kiro + MCP 디버깅 워크플로우

```mermaid
graph TD
    subgraph Trigger2["🔔 이슈 감지"]
        ALERT["CloudWatch<br/>Alarm"]
        GURU["DevOps Guru<br/>Insight"]
    end

    subgraph Kiro2["🤖 Kiro (프로그래머틱)"]
        SPEC["Spec 기반<br/>진단 계획"]
        MCP_Q["MCP 통합<br/>데이터 수집"]
        ANALYZE2["AI 분석<br/>근본 원인"]
        FIX["수정 코드<br/>자동 생성"]
        PR["PR 생성<br/>+ 검증"]
    end

    subgraph Deploy2["🚀 배포"]
        REVIEW["AI 리뷰<br/>+ 승인"]
        ARGO2["Argo CD<br/>자동 배포"]
        VERIFY["배포 후<br/>검증"]
    end

    ALERT --> SPEC
    GURU --> SPEC
    SPEC --> MCP_Q --> ANALYZE2 --> FIX --> PR
    PR --> REVIEW --> ARGO2 --> VERIFY
    VERIFY -.->|문제 지속| SPEC

    style Kiro2 fill:#e3f2fd,stroke:#2196f3
```

### 5.3 구체적 시나리오: OOMKilled 자동 대응

아래 기록은 흐름을 설명하기 위한 가상 시나리오이며, 도구 호출의 이름과 인자는 실제 EKS MCP 서버의 도구 명세와 다를 수 있습니다. 1시간 메트릭 구간만으로는 2시간 주기의 증가 패턴을 확정할 수 없습니다. 실제 대응에서는 충분히 긴 관찰 구간의 메모리 추이와 heap 프로파일, 연결 수 같은 근거로 Redis 연결 누수를 확인한 뒤에 코드 패치 PR을 생성해야 합니다. memory limits 상향은 원인을 확인하기 전에도 적용할 수 있는 임시 조치입니다.

```
[Kiro 프로그래머틱 디버깅: OOMKilled]

1. 감지: payment-service Pod OOMKilled 이벤트

2. Kiro Spec 실행:
   → EKS MCP: get_events(namespace="payment", reason="OOMKilled")
   → EKS MCP: get_pod_logs(pod="payment-xxx", previous=true)
   → CloudWatch MCP: query_metrics("pod_memory_utilization", last="1h")

3. AI 분석:
   "payment-service의 메모리 사용량이 시작 후 2시간마다
    256Mi씩 증가하는 메모리 누수 패턴 감지.
    로그에서 Redis 연결이 제대로 종료되지 않는 것 확인."

4. 자동 수정:
   - memory limits 256Mi → 512Mi (임시 조치)
   - Redis 연결 풀 정리 코드 패치 생성
   - 메모리 프로파일링 설정 추가

5. PR 생성:
   Title: "fix: payment-service Redis connection leak"
   - deployment.yaml: memory limits 조정
   - redis_client.go: defer conn.Close() 추가
   - monitoring: 메모리 사용량 대시보드 추가
```

:::tip 프로그래머틱 디버깅의 핵심
Kiro + EKS MCP를 통해 이슈를 **프로그래머틱하게 분석·해결**합니다. 디렉팅 방식의 수동 대응 대비 **비용 효율적이고 빠른 자동화**가 가능하며, 동일한 이슈가 반복될 때 학습된 Spec을 재사용할 수 있습니다.
:::

---

## 6. Chaos Engineering + AI

### 6.1 AWS FIS EKS 액션 타입

AWS Fault Injection Service(FIS)는 EKS 전용 장애 주입 액션을 제공합니다:

<ChaosExperiments />

### 6.2 AI 기반 장애 패턴 학습

Chaos Engineering 실험 결과를 AI가 학습하여 대응 능력을 향상시킵니다.

```python
# FIS 실험 후 AI 학습 데이터 수집
from strands import Agent

chaos_analyzer = Agent(
    name="chaos-pattern-analyzer",
    model="bedrock/anthropic.claude-sonnet",
    sop="""
    ## Chaos Engineering 결과 분석

    1. FIS 실험 결과 수집
       - 주입된 장애 유형
       - 시스템 반응 시간
       - 복구 시간
       - 영향 범위

    2. 패턴 분석
       - 장애 전파 경로 맵핑
       - 취약 지점 식별
       - 복구 병목 지점 파악

    3. 대응 규칙 변경안 작성 (사람의 검토·승인 전에는 적용하지 않음)
       - 기존 SOP에 학습 내용 추가
       - 새로운 패턴에 대한 대응 규칙 생성
       - 에스컬레이션 임계값 조정

    4. 보고서 생성
       - 실험 요약
       - 발견된 취약점
       - 권장 개선 사항
    """
)
```

3단계의 결과는 변경안이며 자동으로 운영에 반영하지 않습니다. 장애가 반복되었다는 사실만으로 인과관계나 규칙의 정확성이 증명되지 않으므로, 변경안은 근거가 된 실험과 음성 사례 검증 결과와 함께 기록합니다. 사람이 검토·승인한 변경만 버전 관리된 SOP에 반영하고, 문제가 생기면 이전 버전으로 되돌릴 수 있어야 합니다. 자동 조치의 권한 범위를 넓히는 변경은 특히 이 승인 절차를 거쳐야 합니다.

### 6.3 FIS 실험 예시: Pod 삭제 with SLO 보호

```json
{
  "description": "EKS Pod 장애 주입 with SLO 보호",
  "targets": {
    "eks-payment-pods": {
      "resourceType": "aws:eks:pod",
      "selectionMode": "COUNT(2)",
      "parameters": {
        "clusterIdentifier": "my-cluster",
        "namespace": "payment",
        "selectorType": "labelSelector",
        "selectorValue": "app=payment-service"
      }
    }
  },
  "actions": {
    "delete-pod-safely": {
      "actionId": "aws:eks:pod-delete",
      "parameters": {
        "kubernetesServiceAccount": "fis-experiment-role",
        "duration": "PT1M",
        "gracePeriod": "30"
      },
      "targets": {
        "Pods": "eks-payment-pods"
      }
    }
  },
  "stopConditions": [
    {
      "source": "aws:cloudwatch:alarm",
      "value": "arn:aws:cloudwatch:ap-northeast-2:ACCOUNT_ID:alarm:PaymentService-ErrorRate-SLO"
    },
    {
      "source": "aws:cloudwatch:alarm",
      "value": "arn:aws:cloudwatch:ap-northeast-2:ACCOUNT_ID:alarm:PaymentService-Latency-P99-SLO"
    }
  ]
}
```

`aws:eks:pod` 타깃은 리소스 ARN이나 태그로 지정할 수 없고, 반드시 `clusterIdentifier`·`namespace`와 `selectorType`/`selectorValue` 같은 리소스 파라미터로 지정합니다. 삭제할 Pod 수는 액션 파라미터가 아니라 타깃의 `selectionMode`(`COUNT(2)` 등)로 제한합니다.

**안전 장치**:
- **PodDisruptionBudget**: 일반적인 자발적 중단에는 최소 가용성 기준으로 쓰이지만, FIS `aws:eks:pod-delete`는 PDB를 준수하지 않으므로 PDB만으로 가용성이 보장되지 않습니다. 영향 범위는 `selectionMode`로 제한해야 합니다.
- **stopConditions**: SLO 위반 시 추가 장애 주입을 중단합니다(이미 발생한 영향을 즉시 복구하지는 않음).
- **점진적 확장**: 1개 → 10% → 25% 단계별 확장

:::tip Chaos Engineering + AI 피드백 루프
FIS로 장애를 주입하고, AI가 시스템 반응 패턴을 학습하면, AI Agent의 자동 대응 능력이 지속적으로 향상됩니다. "장애 주입 → 관찰 → 학습 → 대응 개선"의 피드백 루프가 자율 운영의 핵심입니다.
:::

---

## 7. 피드백 루프 — 운영에서 온톨로지로

### 7.1 Outer Loop: 운영 → 온톨로지

자율 대응 과정에서 학습한 패턴을 **온톨로지**로 피드백하여 지속적으로 개선합니다.

```
[Inner Loop: 실시간 인시던트 대응]
  감지 → 분석 → 복구 (초~분 단위)

[Outer Loop: 온톨로지 피드백]
  운영 패턴 → 온톨로지 업데이트 → 하네스 개선 (일~주 단위)
```

**피드백 항목**:

| 항목 | 수집 데이터 | 온톨로지 반영 |
|------|-----------|-------------|
| **장애 패턴** | 근본 원인, 증상, 복구 방법 | 새로운 대응 규칙 추가 |
| **복구 시간** | MTTR, 자동/수동 대응 비율 | 자동화 우선순위 조정 |
| **취약 지점** | 반복 장애 서비스/컴포넌트 | 아키텍처 개선 권고 |
| **대응 정확도** | AI 판단 정확도, 에스컬레이션율 | 모델 재학습, 임계값 조정 |

### 7.2 AgenticOps → AIDLC 순환

```mermaid
graph LR
    A[AgenticOps<br/>자율 대응] --> B[패턴 수집]
    B --> C[온톨로지<br/>업데이트]
    C --> D[하네스<br/>개선]
    D --> E[배포]
    E --> A

    style C fill:#fff4e6,stroke:#f57c00
    style D fill:#e8f5e9,stroke:#388e3c
```

**실전 예시**:

```yaml
# 온톨로지 피드백 자동화
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ontology-feedback
spec:
  schedule: "0 2 * * 0"  # 매주 일요일 02:00
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: feedback-collector
              image: my-registry/ontology-feedback:latest
              env:
                - name: INCIDENT_DB
                  value: "dynamodb://incidents-table"
                - name: ONTOLOGY_REPO
                  value: "git://ontology-repo.git"
                - name: FEEDBACK_THRESHOLD
                  value: "5"  # 5회 이상 반복 시 온톨로지 추가
```

**자세한 내용**: [온톨로지 엔지니어링](../methodology/ontology-engineering.md), [하네스 엔지니어링](../methodology/harness-engineering.md)

---

## 8. AIOps 성숙도 모델

<AiopsMaturityModel />

### 성숙도 레벨과 자율 대응

아래 5단계(Level 0-4) 모델은 외부 표준이 아니라 이 문서가 제안하는 분류입니다. 각 레벨의 구현 방법 예시는 위 `AiopsMaturityModel` 컴포넌트의 정의와 일치시킵니다.

| 레벨 | 자율 대응 수준 | 구현 방법 |
|------|-------------|----------|
| **Level 0** | 수동 대응 | 사람이 직접 kubectl 실행 |
| **Level 1** | 알림 기반 | CloudWatch Alarm → 사람 호출 |
| **Level 2** | 반응형 자동화 | EventBridge → Lambda → 고정 스크립트 |
| **Level 3** | 예측형 자동화 | ML 예측 + 선제 조치 |
| **Level 4** | 자율 운영 | AI Agent 컨텍스트 기반 자율 대응 |

:::warning 점진적 도입 권장
Level 0에서 Level 4로 한 번에 도약하려 하지 마세요. 각 레벨에서 충분한 운영 경험과 데이터를 축적한 후 다음 레벨로 전환하는 것이 성공 확률이 높습니다. 특히 Level 3 → Level 4 전환은 **AI 자율 복구의 안전성 검증**이 핵심입니다.
:::

---

## 9. 마무리

### 핵심 요약

1. **운영 자동화 패턴**: Prompt-Driven → Spec-Driven → Agent-Driven 점진적 전환
2. **AI Agent 프레임워크**: Kagent (K8s Native), Strands (Python OSS), Q Developer (AWS 관리형)
3. **Tribal Knowledge**: 과거 인시던트 학습으로 대응 자동화
4. **Kiro 프로그래머틱 디버깅**: MCP 기반 자동 진단·수정·PR 생성
5. **Chaos Engineering + AI**: FIS 실험 → AI 학습 → 대응 능력 향상
6. **Outer Loop 피드백**: 운영 패턴 → 온톨로지 업데이트 → 하네스 개선

### 다음 단계

| 단계 | 액션 | 참고 문서 |
|------|------|----------|
| 1 | 관찰성 스택 구축 | [관찰성 스택](./observability-stack.md) |
| 2 | ML 예측 스케일링 도입 | [예측 운영](./predictive-operations.md) |
| 3 | Kagent/Strands Agent 배포 | 본 문서 섹션 3 |
| 4 | Chaos Engineering 실험 | 본 문서 섹션 6 |
| 5 | 온톨로지 피드백 루프 구축 | [온톨로지 엔지니어링](../methodology/ontology-engineering.md) |

### 참고 자료

- [Kagent - Kubernetes AI Agent](https://github.com/kagent-dev/kagent)
- [Strands Agents SDK](https://github.com/strands-agents/sdk-python)
- [AWS Fault Injection Service](https://docs.aws.amazon.com/fis/latest/userguide/what-is.html)
- [Amazon Q Developer for Operations](https://aws.amazon.com/q/developer/operate/)
- [Kiro IDE](https://kiro.dev/)
