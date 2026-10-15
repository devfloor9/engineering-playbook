---
title: Pod 종료 시퀀스
description: 종료 요청부터 컨테이너 종료까지의 흐름을 확인합니다.
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
sidebar_label: Pod 종료 시퀀스
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md) · [체크리스트와 참고 자료](./checklist-references.md)

## Graceful Shutdown 완벽 가이드 {#3-graceful-shutdown-완벽-가이드}

Graceful Shutdown은 Pod 종료 시 진행 중인 요청을 안전하게 완료하고, 새로운 요청 수신을 중단하는 패턴입니다. 무중단 배포와 데이터 무결성의 핵심입니다.

### Pod 종료 시퀀스 상세 {#31-pod-종료-시퀀스-상세}

Kubernetes에서 Pod 종료는 다음 순서로 진행됩니다.

**그림 1. Pod 종료 요청부터 컨테이너 종료까지의 시퀀스**

```mermaid
sequenceDiagram
    participant User as 사용자/시스템
    participant API as API Server
    participant EP as Endpoint Controller
    participant Kubelet as kubelet
    participant Container as Container
    participant App as Application

    User->>API: kubectl delete pod
    API->>API: Pod 상태 → Terminating

    par Endpoint 제거 (비동기)
        API->>EP: Pod 삭제 이벤트
        EP->>EP: Service Endpoints에서<br/>Pod IP 제거
        Note over EP: kube-proxy가 iptables 업데이트<br/>(최대 몇 초 소요)
    and preStop Hook 실행 (비동기)
        API->>Kubelet: Pod 종료 요청
        Kubelet->>Container: preStop Hook 실행
        Note over Container: sleep 5<br/>(Endpoints 제거 대기)
    end

    Container->>App: SIGTERM 전송
    App->>App: 새 요청 수신 중단
    App->>App: 진행 중인 요청 완료
    Note over App: Graceful Shutdown<br/>(최대 terminationGracePeriodSeconds - preStop 시간)

    alt Graceful 종료 성공
        App->>Kubelet: exit 0
        Kubelet->>API: Pod 종료 완료
    else Timeout 초과
        Kubelet->>Container: SIGKILL (강제 종료)
        Container->>API: Pod 강제 종료됨
    end

    API->>API: Pod 삭제
```

**타이밍 세부 사항:**

아래 타이밍은 `terminationGracePeriodSeconds: 60`과 preStop `sleep 5`를 가정한 예시이며, 실제 시각은 설정한 grace period와 preStop 대기 시간에 따라 달라집니다.

1. **T+0초**: `kubectl delete pod` 또는 롤링 업데이트로 Pod 삭제 요청
2. **T+0초**: API Server가 Pod에 `deletionTimestamp`를 설정(`kubectl`에서는 `Terminating`으로 표시됨)
3. **T+0초**: **비동기적으로** 두 작업 동시 시작:
   - Endpoint Controller가 Service Endpoints에서 Pod IP 제거
   - kubelet이 preStop Hook 실행
4. **T+0~5초**: preStop Hook의 `sleep 5` 실행 (Endpoints 제거 대기)
5. **T+5초**: preStop Hook 완료 후 kubelet이 컨테이너 런타임에 PID 1로 SIGTERM 전송을 요청
6. **T+5초**: 애플리케이션이 SIGTERM 수신, Graceful Shutdown 시작
7. **T+5~60초**: 애플리케이션이 진행 중인 요청 완료, 정리 작업 수행
8. **T+60초**: `terminationGracePeriodSeconds` 도달 시 SIGKILL (강제 종료)

:::tip preStop sleep이 필요한 이유
Endpoint 제거와 preStop Hook 실행은 **비동기**로 발생합니다. preStop에 sleep을 두면(예: 5초), Endpoint Controller와 kube-proxy가 iptables를 업데이트할 시간을 벌어 새로운 트래픽이 종료 중인 Pod으로 유입될 가능성을 줄입니다. 다만 고정된 5초가 전파 완료를 보장하지는 않으며, 필요한 지연 시간은 EndpointSlice와 kube-proxy의 갱신 지연에 따라 더 크거나 작을 수 있으므로 환경에 맞게 조정합니다. 이 패턴 없이는 종료 중인 Pod으로 트래픽이 계속 전송되어 502/503 에러가 발생할 수 있습니다.
:::
