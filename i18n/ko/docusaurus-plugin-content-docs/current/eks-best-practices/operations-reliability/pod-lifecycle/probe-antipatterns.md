---
title: Probe 안티패턴
description: 불필요한 재시작과 잘못된 헬스체크 구성을 점검합니다.
created: "2026-02-12"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 2
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Probe 안티패턴
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md) · [체크리스트와 참고 자료](./checklist-references.md)

## Probe 안티패턴과 함정 {#25-probe-안티패턴과-함정}

### 안티패턴 1: Liveness Probe에 외부 의존성 포함 {#-안티패턴-1-liveness-probe에-외부-의존성-포함}

**문제:**

```yaml
livenessProbe:
  httpGet:
    path: /health  # DB, Redis 연결 확인 포함
    port: 8080
```

**결과:**
- DB 장애 시 모든 Pod이 동시 재시작 → Cascading Failure
- 일시적인 네트워크 지연으로도 Pod 재시작

**올바른 설정:**

```yaml
# Liveness: 애플리케이션 자체 상태만
livenessProbe:
  httpGet:
    path: /healthz  # 내부 상태만 확인
    port: 8080

# Readiness: 외부 의존성 포함
readinessProbe:
  httpGet:
    path: /ready  # DB, Redis 등 확인
    port: 8080
```

### 안티패턴 2: Startup Probe 없이 높은 initialDelaySeconds {#-안티패턴-2-startup-probe-없이-높은-initialdelayseconds}

**문제:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 120  # 2분 대기
  periodSeconds: 10
```

**결과:**
- 앱이 30초에 시작 완료해도 90초 동안 헬스체크 없음
- 프로세스가 완전히 종료(크래시)되면 kubelet이 initialDelay와 무관하게 컨테이너를 재시작하지만, 프로세스가 죽지 않고 멈춘(hang) 상태는 initialDelay가 끝나기 전까지 최대 2분간 감지되지 않음

**올바른 설정:**

```yaml
# Startup Probe로 시작 보호
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 12  # 최대 120초 대기
  periodSeconds: 10

# Liveness는 Startup 성공 후 즉시 활성화
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 0  # Startup 성공 후 바로 시작
  periodSeconds: 10
```

### 안티패턴 3: 외부 의존성을 확인하는 엔드포인트를 Liveness와 Readiness에 공유 {#-안티패턴-3-liveness와-readiness에-같은-엔드포인트}

**문제:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080

readinessProbe:
  httpGet:
    path: /health  # 동일한 엔드포인트
    port: 8080
```

**결과:**
- `/health`가 외부 의존성을 확인하면 Liveness가 실패하여 불필요한 재시작
- 내부 상태만 확인하는 엔드포인트라면 공유해도 문제없지만, 역할 구분이 모호하여 디버깅 어려움

**올바른 설정:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz  # 내부 상태만
    port: 8080

readinessProbe:
  httpGet:
    path: /ready  # 외부 의존성 포함
    port: 8080
```

### 안티패턴 4: 너무 공격적인 failureThreshold {#-안티패턴-4-너무-공격적인-failurethreshold}

**문제:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 5
  failureThreshold: 1  # 단 1번 실패로 재시작
```

**결과:**
- 일시적인 네트워크 지연, GC pause 등으로 불필요한 재시작
- 재시작 루프 발생 가능

**올바른 설정:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  periodSeconds: 10
  failureThreshold: 3  # 연속 3회 실패(약 30초, 3 x 10s)를 감지 예산으로 두고 재시작
  timeoutSeconds: 5
```

### 안티패턴 5: 과도하게 긴 timeoutSeconds {#-안티패턴-5-과도하게-긴-timeoutseconds}

**문제:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 30  # 30초 대기
  periodSeconds: 10
```

**결과:**
- 정상 Probe는 즉시 응답하지만, 멈추거나 느린 대상은 최대 30초까지 타임아웃을 기다리므로 장애 감지가 그만큼 늦어짐

**올바른 설정:**

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  timeoutSeconds: 5  # 5초 이내 응답 필요
  periodSeconds: 10
  failureThreshold: 3
```
