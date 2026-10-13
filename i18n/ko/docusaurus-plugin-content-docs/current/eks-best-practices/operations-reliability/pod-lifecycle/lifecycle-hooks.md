---
title: Pod Lifecycle Hooks
description: PostStart와 PreStop의 실행 흐름과 예제를 확인합니다.
created: "2026-02-12"
last_update:
  date: "2026-09-17"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Pod Lifecycle Hooks
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md) · [체크리스트와 참고 자료](./checklist-references.md)

## Pod Lifecycle Hooks {#5-pod-lifecycle-hooks}

Lifecycle Hooks는 컨테이너의 특정 시점에 커스텀 로직을 실행합니다.

### PostStart Hook {#51-poststart-hook}

PostStart Hook은 컨테이너가 생성된 직후 실행됩니다.

**특징:**
- 컨테이너의 ENTRYPOINT와 **비동기적으로** 실행됩니다
- Hook이 실패하면 컨테이너가 종료됩니다
- Hook 완료를 기다리지 않고 컨테이너는 `Running` 상태가 됩니다

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: poststart-example
spec:
  containers:
  - name: app
    image: nginx
    lifecycle:
      postStart:
        exec:
          command:
          - /bin/sh
          - -c
          - |
            echo "Container started at $(date)" >> /var/log/lifecycle.log
            # 초기 설정 작업
            mkdir -p /app/cache
            chown -R nginx:nginx /app/cache
```

**사용 사례:**
- 애플리케이션 시작 알림 전송
- 초기 캐시 warming
- 메타데이터 기록

:::warning PostStart Hook 주의사항
PostStart Hook은 컨테이너 시작과 **비동기**로 실행되므로, Hook이 완료되기 전에 애플리케이션이 시작될 수 있습니다. 애플리케이션이 Hook의 작업에 의존한다면 Init Container를 사용하세요.
:::

### PreStop Hook {#52-prestop-hook}

PreStop Hook은 컨테이너 종료 요청 시, SIGTERM 전에 실행됩니다.

**특징:**
- **동기적으로** 실행됩니다 (완료될 때까지 SIGTERM 전송 지연)
- Hook 실행 시간은 `terminationGracePeriodSeconds`에 포함됩니다
- Hook 실패 여부와 무관하게 SIGTERM이 전송됩니다

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: prestop-example
spec:
  containers:
  - name: app
    image: myapp/app:v1
    lifecycle:
      preStop:
        exec:
          command:
          - /bin/sh
          - -c
          - |
            # 1. Endpoint 제거 대기
            sleep 5

            # 2. 애플리케이션 상태 저장
            curl -X POST http://localhost:8080/admin/save-state

            # 3. 로그 플러시
            kill -USR1 1  # 애플리케이션에 USR1 시그널 전송

            # 4. SIGTERM 전송 (PID 1)
            kill -TERM 1
  terminationGracePeriodSeconds: 60
```

**사용 사례:**
- Endpoint 제거 대기 (무중단 배포)
- 진행 중인 작업 상태 저장
- 외부 시스템에 종료 알림
- 로그 버퍼 플러시

### Hook 실행 메커니즘 {#53-hook-실행-메커니즘}

Kubernetes는 두 가지 방식으로 Hook을 실행합니다.

| 메커니즘 | 설명 | 장점 | 단점 |
|----------|------|------|------|
| **exec** | 컨테이너 내부에서 명령 실행 | 컨테이너 파일시스템 접근 가능 | 오버헤드 높음 |
| **httpGet** | HTTP GET 요청 전송 | 네트워크 기반, 가벼움 | 애플리케이션이 HTTP 지원 필요 |

#### exec Hook 예시 {#exec-hook-예시}

```yaml
lifecycle:
  preStop:
    exec:
      command:
      - /bin/bash
      - -c
      - |
        echo "Shutting down" | tee /var/log/shutdown.log
        /app/cleanup.sh
```

#### httpGet Hook 예시 {#httpget-hook-예시}

```yaml
lifecycle:
  preStop:
    httpGet:
      path: /shutdown
      port: 8080
      scheme: HTTP
      httpHeaders:
      - name: X-Shutdown-Token
        value: "secret-token"
```

:::warning Hook 실행은 "At Least Once"
Kubernetes는 Hook이 최소 한 번 실행되도록 보장하지만, 여러 번 실행될 수 있습니다. Hook 로직은 **멱등성(idempotent)**을 보장해야 합니다.
:::

---
