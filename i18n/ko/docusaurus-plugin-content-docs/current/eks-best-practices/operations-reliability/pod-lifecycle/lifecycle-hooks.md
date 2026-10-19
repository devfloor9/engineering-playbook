---
title: Pod Lifecycle Hooks
description: PostStart와 PreStop의 실행 흐름과 예제를 확인합니다.
created: "2026-02-12"
last_update:
  date: 2026-10-15
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
- 컨테이너의 ENTRYPOINT와 **동시에**(병행하여) 실행됩니다
- Hook이 실패하면 컨테이너가 종료됩니다
- Hook이 완료되기 전에는 컨테이너가 `Running` 상태로 전환되지 않습니다. Hook 실행이 지나치게 길거나 멈추면 `Running` 전환이 지연됩니다

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
            #    전송 기한(--max-time)과 실패 처리(-f)를 두어, 저장이 멈추거나
            #    실패해도 terminationGracePeriodSeconds 안에서 다음 단계로 넘어갑니다.
            curl -sf --max-time 10 -X POST http://localhost:8080/admin/save-state \
              || echo "save-state failed or timed out; proceeding"

            # 3. 로그 플러시: USR1은 표준 의미가 없으며 애플리케이션이 정의한 동작입니다.
            #    (앱이 USR1을 로그 플러시로 처리하도록 구현한 경우에만 유효합니다.)
            kill -USR1 1

            # 4. SIGTERM 전송 (PID 1): kubelet이 preStop 완료 후 SIGTERM을 보내므로
            #    아래 수동 전송은 대개 중복이며, 앱이 즉시 종료를 원할 때만 사용합니다.
            kill -TERM 1
  terminationGracePeriodSeconds: 60
```

**사용 사례:**
- Endpoint 제거 대기 (무중단 배포)
- 진행 중인 작업 상태 저장
- 외부 시스템에 종료 알림
- 로그 버퍼 플러시

### Hook 실행 메커니즘 {#53-hook-실행-메커니즘}

Kubernetes는 Hook 핸들러를 세 가지 방식으로 실행합니다. 아래 표의 `exec`, `httpGet` 외에, 지정한 시간만큼 컨테이너를 멈추는 `sleep` 핸들러도 제공합니다.

**표 1. Hook 실행 메커니즘별 장단점 비교**

| 메커니즘 | 설명 | 장점 | 단점 |
|----------|------|------|------|
| **exec** | 컨테이너 내부에서 명령 실행 | 컨테이너 파일시스템 접근 가능 | 오버헤드 높음 |
| **httpGet** | HTTP GET 요청 전송 | 네트워크 기반, 가벼움 | 애플리케이션이 HTTP 지원 필요 |
| **sleep** | 지정한 시간만큼 컨테이너 일시 정지 | 외부 명령·엔드포인트 불필요 | 고정 지연만 제공(조건 대기 불가) |

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
