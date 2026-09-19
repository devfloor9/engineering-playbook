---
title: Connection draining
description: Review patterns for terminating in-flight requests and connections.
created: "2026-02-12"
last_update:
  date: 2026-09-19
  author: devfloor9
reading_time: 9
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Connection draining
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md) · [Checklist and references](./checklist-references.md)

## Connection draining patterns {#33-connection-draining-패턴}

Connection draining stops admission of new work, waits for in-flight requests, and then closes connections. Forced closure after a deadline must be distinguished from successful completion.

### Handling HTTP Keep-Alive connections {#http-keep-alive-연결-처리}

The following HTTP/1.1 shutdown example targets Node.js 24 and Express 5. Register real routes after the middleware that rejects new requests. [Node.js `server.close()`](https://nodejs.org/docs/latest-v24.x/api/http.html#serverclosecallback) stops new connections and closes idle connections without immediately destroying active requests or responses. `socket.destroy()` stops I/O, so it is reserved for the timeout path.

```javascript
// Node.js 24 / Express 5: HTTP/1.1 shutdown integration example
const express = require('express');
const app = express();
const DRAIN_TIMEOUT_MS = 50_000; // Check the Pod shutdown-budget conditions below
let isShuttingDown = false;

// Keep active handlers; do not dispatch new requests to business routes
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    res.statusCode = 503;
    res.end('Server shutting down');
    return;
  }
  next();
});
// Register the application's real routes here
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
    // Force closure only after the deadline; do not report request completion
    for (const conn of activeConnections) conn.destroy();
  }, DRAIN_TIMEOUT_MS);

  // Stop new connections, close idle keep-alive, and wait for active HTTP responses
  server.close((err) => {
    clearTimeout(deadline);
    if (err) {
      process.exitCode = 1;
      console.error('HTTP server close failed', err);
    } else if (!timedOut) {
      console.log('HTTP connections drained');
    }
    // Other resource owners must clean up; do not cut off work with process.exit(0)
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
```

The 50-second limit is an example, not a measurement or recommendation. It exceeds the default Pod termination grace period of 30 seconds. In the [Pod termination flow](https://v1-34.docs.kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination-flow), `preStop` also consumes `terminationGracePeriodSeconds`. Allow for request draining and subsequent cleanup within the time remaining when the shutdown handler runs.

Background work or a database commit may continue after an HTTP response finishes. The application must wait for that work separately. HTTP/2 and connections upgraded to WebSocket also need their own shutdown handling.

### Cleaning up WebSocket connections {#websocket-연결-정리}

The code below notifies clients and starts the WebSocket closing handshake. Because [ws `server.close()`](https://github.com/websockets/ws/blob/8.18.3/doc/ws.md#serverclosecallback) does not automatically close existing client connections, it calls `close()` on each one.

A real service must first stop admitting messages and wait for active asynchronous processing. It also needs a deadline: if the handshake does not finish in time, call `terminate()` and record a forced closure. These two steps are not included below; the close callback alone cannot establish that business processing has finished.

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
    // Process messages
  });
});

function gracefulShutdown() {
  console.log(`Closing ${clients.size} WebSocket connections`);

  clients.forEach((ws) => {
    // Notify clients of shutdown
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

This example uses the grpc-go v1.75.0 API. To run it, generate the `MyService` types and server interface from the application's `.proto`, and make them available at `myapp/proto` in the Go module. Embedding `UnimplementedMyServiceServer` does not implement business RPCs; provide the actual methods as well.

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

    // Wait for SIGTERM
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit

    log.Println("Graceful shutdown initiated")

    // GracefulStop: wait for in-flight RPCs to complete
    done := make(chan struct{})
    go func() {
        s.GracefulStop()
        close(done)
    }()

    // Handle timeout
    select {
    case <-done:
        log.Println("gRPC server stopped gracefully")
    case <-time.After(50 * time.Second):
        log.Println("Graceful stop timeout, forcing stop")
        s.Stop() // Force termination: cancel active RPCs
        os.Exit(1)
    }
}
```

[`GracefulStop()`](https://github.com/grpc/grpc-go/blob/v1.75.0/server.go) rejects new connections and RPCs while waiting for active RPCs to finish. `Stop()` from the separate timeout path forcibly cancels active RPCs. The 50-second limit must fit the Pod shutdown budget described above, and forced shutdown must not be reported as a successful drain. RPC cancellation does not undo external work already performed; application cancellation and transaction policies are still required.

### Cleaning up database connection pools {#데이터베이스-연결-풀-정리}

[psycopg2 `closeall()`](https://www.psycopg.org/docs/pool.html) closes connections that the application is still using. Do not call it directly from the SIGTERM handler. The following integration fragment targets ordinary Python worker threads. It uses `ThreadedConnectionPool`; `active_transactions` counts only scopes that have entered `transaction()`. Every database operation must pass through that function. It does not share one pool across processes.

```python
# Python 3 / psycopg2 2.9: worker-thread integration fragment
import os
import signal
import threading
from contextlib import contextmanager
from psycopg2 import pool

# Connects at app initialization; configure a real DSN and separate I/O limits
db_pool = pool.ThreadedConnectionPool(
    minconn=1,
    maxconn=10,
    dsn=os.environ["DATABASE_DSN"],
    connect_timeout=5,
)
state = threading.Condition()
draining = False
pool_closed = False
# Counts transaction() scopes, not whole HTTP-handler or worker lifetimes
active_transactions = 0
shutdown_requested = False


def request_shutdown(signum, frame):
    global shutdown_requested
    # Request only; lock waits and pool cleanup belong in the main control flow
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
        # Commit on success, roll back on exception, then return the connection
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
    # Call from main after stopping admission AND awaiting admitted handlers/workers
    with state:
        if pool_closed:
            return
        draining = True
        if not state.wait_for(
            lambda: active_transactions == 0, timeout=timeout_seconds
        ):
            # Do not close in-use connections or report shutdown success
            raise TimeoutError("Active database work did not finish")
        db_pool.closeall()
        pool_closed = True


# Main: observe shutdown_requested, then stop new HTTP request/job admission.
# Await existing handlers/workers, including later DB calls, before close_pool_when_idle().
# Handle TimeoutError under the cancellation/failure policy below, not as success.
```

After observing the shutdown request, the application's main control flow must follow this order:

1. Stop admitting new HTTP requests and queued jobs.
2. Await handlers and workers that were already admitted, including work that has not reached its next database call. Background work associated with a completed HTTP response must be awaited separately.
3. Call `close_pool_when_idle()` only after confirming that no handler or worker can make another database call.

`active_transactions` does not track entire HTTP-request or job lifetimes. Setting the pool's `draining` flag before step 2 also rejects later database calls from existing handlers. The counter inside the function is an additional guard for completion of commit/rollback and connection return within `transaction()`. A [connection `with` block](https://www.psycopg.org/docs/usage.html#with-statement) commits on success and rolls back on exception, but does not close the connection itself.

If step 2 times out, confirm worker cancellation, rollback and connection return before closing the pool. The application must define how cancellation works. A `TimeoutError` from `close_pool_when_idle()` also leaves the pool open.

`wait_for` limits only the wait for entered transaction scopes to finish. Manage the total shutdown time separately, including handler and worker waits, connection/query/commit/rollback I/O and pool cleanup. Integration tests must establish that the application follows this order and finishes within the Pod grace period.
