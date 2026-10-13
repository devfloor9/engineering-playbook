---
title: Connection Draining
description: 진행 중인 요청과 연결을 종료하는 패턴을 확인합니다.
created: "2026-02-12"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 5
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Connection Draining
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md) · [체크리스트와 참고 자료](./checklist-references.md)

## Connection Draining 패턴 {#33-connection-draining-패턴}

Connection Draining은 새 작업의 접수를 중단하고 진행 중인 요청을 기다린 뒤 연결을 닫는 종료 절차입니다. 대기 한도를 넘겨 연결을 강제로 끊는 경우는 정상 완료와 구분해야 합니다.

### HTTP Keep-Alive 연결 처리 {#http-keep-alive-연결-처리}

다음은 Node.js 24와 Express 5의 HTTP/1.1 종료 처리 예제입니다. 새 요청을 거부하는 미들웨어 뒤에 실제 라우트를 등록합니다. [Node.js의 `server.close()`](https://nodejs.org/docs/latest-v24.x/api/http.html#serverclosecallback)는 새 연결을 받지 않고 idle 연결을 닫으며, 진행 중인 요청·응답은 바로 파괴하지 않습니다. `socket.destroy()`는 I/O를 중단하므로 시간 초과 경로에서만 사용합니다.

```javascript
// Node.js 24 / Express 5: HTTP/1.1 shutdown integration example
const express = require('express');
const app = express();
const DRAIN_TIMEOUT_MS = 50_000; // 아래 Pod 종료 예산 조건을 먼저 확인
let isShuttingDown = false;

// 진행 중인 핸들러는 유지하고 새 요청은 업무 라우트로 전달하지 않음
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    res.statusCode = 503;
    res.end('Server shutting down');
    return;
  }
  next();
});
// 이 위치에 애플리케이션의 실제 라우트를 등록
const server = app.listen(8080);
const activeConnections = new Set();

server.on('connection', (conn) => {
  activeConnections.add(conn);
  conn.on('close', () => activeConnections.delete(conn));
});

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received`);
  let timedOut = false;

  const deadline = setTimeout(() => {
    timedOut = true;
    process.exitCode = 1;
    console.error(`HTTP drain timed out; aborting ${activeConnections.size} connections`);
    // 한도 초과 시에만 강제 종료하며 요청 완료로 기록하지 않음
    for (const conn of activeConnections) conn.destroy();
  }, DRAIN_TIMEOUT_MS);

  // 새 연결을 막고 idle keep-alive를 닫음; 진행 중인 HTTP 응답은 대기
  server.close((err) => {
    clearTimeout(deadline);
    if (err) {
      process.exitCode = 1;
      console.error('HTTP server close failed', err);
    } else if (!timedOut) {
      console.log('HTTP connections drained');
    }
    // 다른 자원은 소유자가 정리; process.exit(0)로 남은 작업을 끊지 않음
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
```

50초는 예제의 대기 한도입니다. 측정 결과나 권장값이 아니며, Pod의 기본 종료 유예 시간인 30초보다 깁니다. [Pod 종료 절차](https://v1-34.docs.kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination-flow)에서는 `preStop`도 `terminationGracePeriodSeconds`를 사용합니다. 종료 핸들러가 실행될 때 남은 시간에 맞춰 요청 대기와 후속 정리 시간을 정해야 합니다.

HTTP 응답이 끝나도 백그라운드 작업이나 DB commit은 진행 중일 수 있습니다. 이 작업은 애플리케이션에서 별도로 기다려야 합니다. HTTP/2와 WebSocket으로 전환된 연결도 별도 종료 처리가 필요합니다.

### WebSocket 연결 정리 {#websocket-연결-정리}

아래 코드는 클라이언트에 종료를 알리고 WebSocket closing handshake를 시작하는 부분입니다. [ws의 `server.close()`](https://github.com/websockets/ws/blob/8.18.3/doc/ws.md#serverclosecallback)는 기존 클라이언트 연결을 자동으로 닫지 않으므로 각 연결에 `close()`를 호출합니다.

실제 서비스에서는 이 단계 전에 새 메시지 접수를 중단하고 진행 중인 비동기 처리를 기다려야 합니다. 남은 종료 시간 안에 handshake가 끝나지 않으면 `terminate()`로 연결을 강제로 닫고 실패로 기록하는 처리도 필요합니다. 이 두 처리는 아래 예제에 포함하지 않았으며, close 콜백만으로 업무 처리가 끝났다고 판단할 수는 없습니다.

```javascript
// WebSocket graceful shutdown
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('message', (message) => {
    // 메시지 처리
  });
});

function gracefulShutdown() {
  console.log(`Closing ${clients.size} WebSocket connections`);

  clients.forEach((ws) => {
    // 클라이언트에게 종료 알림
    ws.send(JSON.stringify({ type: 'server_shutdown' }));
    ws.close(1001, 'Server shutting down');
  });

  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
```

### gRPC Graceful Shutdown {#grpc-graceful-shutdown}

다음 예제는 grpc-go v1.75.0 API를 사용합니다. 실행하려면 애플리케이션의 `.proto`에서 `MyService` 타입과 서버 인터페이스를 생성하고, Go 모듈에서 `myapp/proto` 경로로 가져올 수 있어야 합니다. `UnimplementedMyServiceServer`를 포함하는 것만으로는 업무 RPC가 구현되지 않으므로 실제 메서드 구현도 필요합니다.

```go
package main

import (
    "log"
    "net"
    "os"
    "os/signal"
    "syscall"
    "time"

    "google.golang.org/grpc"
    pb "myapp/proto"
)

type server struct {
    pb.UnimplementedMyServiceServer
}

func main() {
    lis, err := net.Listen("tcp", ":9090")
    if err != nil {
        log.Fatalf("Failed to listen: %v", err)
    }

    s := grpc.NewServer()
    pb.RegisterMyServiceServer(s, &server{})

    go func() {
        log.Println("gRPC server starting on :9090")
        if err := s.Serve(lis); err != nil && err != grpc.ErrServerStopped {
            log.Fatalf("Failed to serve: %v", err)
        }
    }()

    // SIGTERM 대기
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit

    log.Println("Graceful shutdown initiated")

    // GracefulStop: 진행 중인 RPC 완료 대기
    done := make(chan struct{})
    go func() {
        s.GracefulStop()
        close(done)
    }()

    // Timeout 처리
    select {
    case <-done:
        log.Println("gRPC server stopped gracefully")
    case <-time.After(50 * time.Second):
        log.Println("Graceful stop timeout, forcing stop")
        s.Stop() // 강제 종료: 활성 RPC 취소
        os.Exit(1)
    }
}
```

[`GracefulStop()`](https://github.com/grpc/grpc-go/blob/v1.75.0/server.go)은 새 연결과 RPC를 막고 진행 중인 RPC 완료를 기다립니다. 별도 타이머의 `Stop()`은 활성 RPC를 취소하는 강제 종료입니다. 50초 한도는 앞의 Pod 종료 예산 조건을 충족해야 하며, 강제 종료를 정상 drain으로 기록해서는 안 됩니다. RPC 취소가 이미 수행한 외부 작업을 되돌리는 것은 아니므로 애플리케이션의 취소·트랜잭션 정책도 필요합니다.

### 데이터베이스 연결 풀 정리 {#데이터베이스-연결-풀-정리}

[psycopg2의 `closeall()`](https://www.psycopg.org/docs/pool.html)은 애플리케이션이 사용 중인 연결까지 닫습니다. 따라서 SIGTERM 핸들러에서 바로 호출하지 않습니다. 아래는 일반 Python worker thread를 사용하는 애플리케이션의 통합 코드 조각입니다. `ThreadedConnectionPool`을 사용하며, `active_transactions`는 진입한 `transaction()` 범위만 집계합니다. 모든 DB 작업이 이 함수를 거쳐야 하며, 여러 프로세스가 같은 pool을 공유하는 예제가 아닙니다.

```python
# Python 3 / psycopg2 2.9: worker-thread integration fragment
import os
import signal
import threading
from contextlib import contextmanager
from psycopg2 import pool

# 앱 초기화 시 연결하므로 실제 DSN과 연결/쿼리 제한을 별도로 설정
db_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=os.environ["DATABASE_DSN"],
    connect_timeout=5,
)
state = threading.Condition()
draining = False
pool_closed = False
# transaction() 범위만 집계; HTTP 핸들러나 worker 전체 수명은 집계하지 않음
active_transactions = 0
shutdown_requested = False


def request_shutdown(signum, frame):
    global shutdown_requested
    # 핸들러는 요청만 표시; 락 대기나 pool 정리는 main 제어 흐름에서 수행
    shutdown_requested = True


signal.signal(signal.SIGTERM, request_shutdown)


@contextmanager
def transaction():
    global active_transactions
    with state:
        if draining:
            raise RuntimeError("Database work is shutting down")
        active_transactions += 1

    conn = None
    try:
        conn = db_pool.getconn()
        # 정상 종료는 commit, 예외는 rollback; 이 처리가 끝나야 연결을 반환
        with conn:
            yield conn
    finally:
        try:
            if conn is not None:
                db_pool.putconn(conn)
        finally:
            with state:
                active_transactions -= 1
                state.notify_all()


def query_database():
    with transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users")
            return cur.fetchall()


def close_pool_when_idle(timeout_seconds=50):
    global draining, pool_closed
    # 새 접수 중단과 기존 핸들러/worker 완료를 확인한 main 제어 흐름에서 호출
    with state:
        if pool_closed:
            return
        draining = True
        if not state.wait_for(
            lambda: active_transactions == 0, timeout=timeout_seconds
        ):
            # 사용 중인 연결을 닫거나 종료 성공을 보고하지 않음
            raise TimeoutError("Active database work did not finish")
        db_pool.closeall()
        pool_closed = True


# main: shutdown_requested 확인 -> 새 HTTP 요청/작업 접수 중단.
# 기존 핸들러/worker의 후속 DB 호출까지 끝난 뒤 close_pool_when_idle() 호출.
# TimeoutError는 아래의 취소·실패 정책으로 처리; 성공으로 바꾸지 않음.
```

애플리케이션의 main 제어 흐름은 종료 요청을 확인한 뒤 다음 순서를 지켜야 합니다.

1. 새 HTTP 요청과 작업 큐의 새 작업 접수를 중단합니다.
2. 이미 접수한 핸들러와 worker가 끝날 때까지 기다립니다. 아직 DB 호출에 도달하지 않았거나, 나중에 다시 DB를 호출할 작업도 포함합니다. HTTP 응답이 끝났어도 연결된 백그라운드 작업은 따로 기다려야 합니다.
3. 더 이상 DB를 호출할 핸들러나 worker가 없음을 확인한 뒤 `close_pool_when_idle()`을 호출합니다.

`active_transactions`는 HTTP 요청이나 job의 전체 수명을 추적하지 않습니다. 2번 전에 pool의 `draining`을 설정하면 기존 핸들러의 후속 DB 호출도 거부됩니다. 함수 안의 집계는 `transaction()`의 commit 또는 rollback과 연결 반환이 끝났는지 확인하는 추가 보호 장치입니다. [연결의 `with` 문](https://www.psycopg.org/docs/usage.html#with-statement)은 정상 종료 시 commit, 예외 시 rollback을 수행하지만 연결 자체를 닫지는 않습니다.

2번에서 시간이 초과되면 pool을 바로 닫지 말고, worker의 취소·rollback·연결 반환을 확인해야 합니다. 취소 방법은 애플리케이션이 정해야 합니다. `close_pool_when_idle()`에서 `TimeoutError`가 발생해도 pool은 열린 상태로 남습니다.

`wait_for`는 진입한 transaction 범위가 끝나기를 기다리는 시간만 제한합니다. 핸들러와 worker 대기, 연결·쿼리·commit·rollback의 I/O, pool 정리까지 포함한 총 종료 시간은 별도로 관리해야 합니다. 실제 애플리케이션에서 이 순서가 지켜지고 Pod의 유예 시간 안에 끝나는지는 통합 테스트로 확인해야 합니다.
