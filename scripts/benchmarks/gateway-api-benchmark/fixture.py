#!/usr/bin/env python3
"""Deterministic echo backend. This is not a Gateway API implementation."""

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
import time
from urllib.parse import urlsplit


def integer(value, low, high):
    if not re.fullmatch(r"[0-9]+", str(value)) or not low <= int(value) <= high:
        raise ValueError(f"expected an integer in [{low}, {high}]")
    return int(value)


def response_status(value):
    value = integer(value, 200, 599)
    if value in (204, 205, 304):
        raise ValueError("this JSON fixture requires a response status that permits a body")
    return value


class Backend(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_):
        pass

    def do_GET(self):
        try:
            if self.headers.get("Transfer-Encoding") or int(self.headers.get("Content-Length", 0)):
                raise ValueError("GET request bodies are unsupported")
            for name in ("X-Fixture-Status", "X-Fixture-Delay-Ms"):
                if len(self.headers.get_all(name, [])) > 1:
                    raise ValueError(f"duplicate {name}")
            status = response_status(self.headers.get("X-Fixture-Status", self.server.fixture_status))
            delay_ms = integer(self.headers.get("X-Fixture-Delay-Ms", self.server.delay_ms), 0, 2000)
            parsed = urlsplit(self.path)
            body = {
                "fixture": True,
                "backend_id": self.server.backend_id,
                "method": "GET",
                "path": parsed.path,
                "query": parsed.query,
                "headers": {name.lower(): value for name, value in self.headers.items()},
                "delay_ms": delay_ms,
                "status": status,
            }
        except (ValueError, OverflowError) as error:
            status, delay_ms, body = 400, 0, {"fixture": True, "error": str(error)}
            self.close_connection = True
        time.sleep(delay_ms / 1000)
        self.send_json(status, body)

    def do_POST(self):
        self.close_connection = True
        self.send_json(405, {"fixture": True, "error": "only GET is supported"})

    def send_json(self, status, body):
        encoded = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
        # No clock-dependent Date header or response sequence number.
        self.send_response_only(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("X-Backend-ID", self.server.backend_id)
        if self.close_connection:
            self.send_header("Connection", "close")
        self.end_headers()
        try:
            self.wfile.write(encoded)
        except (BrokenPipeError, ConnectionResetError):
            pass


def make_server(bind="127.0.0.1", port=8080, backend_id="fixture-a", delay_ms=0, status=200):
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", backend_id):
        raise ValueError("backend ID must contain 1–64 letters, numbers, dots, underscores or hyphens")
    delay_ms, status = integer(delay_ms, 0, 2000), response_status(status)
    server = ThreadingHTTPServer((bind, integer(port, 0, 65535)), Backend)
    server.daemon_threads = True
    server.backend_id = backend_id
    server.delay_ms = delay_ms
    server.fixture_status = status
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--backend-id", required=True)
    parser.add_argument("--delay-ms", type=int, default=0)
    parser.add_argument("--status", type=int, default=200)
    args = parser.parse_args()
    try:
        server = make_server(args.bind, args.port, args.backend_id, args.delay_ms, args.status)
    except ValueError as error:
        parser.error(str(error))
    print(json.dumps({"evidence_scope": "local-fixture", "backend_id": args.backend_id,
                      "address": server.server_address, "gateway_api_conformance": False}), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
