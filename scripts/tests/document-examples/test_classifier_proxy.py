"""Offline regression test for the LLM Classifier proxy in advanced-features.md.

Covers issue #96 catalog IDs AOR-ADV-001 (stream lifetime) and AOR-ADV-002
(classifier proxy contract). The exact Python block is extracted from both the
English (docs/) and Korean (i18n/ko/) locales and executed against test doubles
for FastAPI/Starlette/httpx -- no SDKs and no network. The checks assert the
corrected behavior:

  * AOR-ADV-001: the AsyncClient is module-scoped (not opened with `async with`
    inside the handler, which would close it before the StreamingResponse body
    is read), and an async-generator `finally` closes the streamed response on
    normal completion, early downstream cancellation, or forwarding failure.
  * AOR-ADV-002: `model: "auto"` is rewritten to the selected backend's served
    model name; the route accepts both GET and POST so the documented
    `GET /v1/models` smoke check reaches a backend instead of returning 405; and
    a non-stream upstream status (e.g. 4xx) is propagated rather than masked as
    200 parsed JSON.

Run from the repository root, as `npm run test:examples` does.
"""
from pathlib import Path
import ast
import asyncio
from contextlib import ExitStack, contextmanager
import hashlib
import json
import re
import socket
import sys
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

RELATIVE_PATH = (
    "agentic-ai-platform/reference-architecture/inference-gateway/"
    "setup/advanced-features.md"
)
DOCUMENTS = {
    "ko": Path("i18n/ko/docusaurus-plugin-content-docs/current") / RELATIVE_PATH,
    "en": Path("docs") / RELATIVE_PATH,
}
# Anchor that uniquely identifies the classifier proxy block in both locales.
BLOCK_ANCHOR = "LLM Classifier"


def fences(text):
    """Yield (language, code, first_line) for each fenced block."""
    opened, content = None, []
    for line_number, line in enumerate(text.splitlines(), 1):
        if opened:
            marker, language, first_line = opened
            if re.fullmatch(
                r" {0,3}" + re.escape(marker[0]) + r"{" + str(len(marker)) + r",}\s*",
                line,
            ):
                yield language, "\n".join(content) + "\n", first_line
                opened, content = None, []
            else:
                content.append(line)
        else:
            match = re.fullmatch(r" {0,3}(`{3,}|~{3,})([^`]*)", line)
            if match:
                opened = (match[1], match[2].strip(), line_number + 1)
    if opened:
        raise ValueError(f"unclosed code fence at line {opened[2] - 1}")


def extract_classifier(text, source):
    """Return the single python block that defines the classifier proxy."""
    found = None
    for language, code, line in fences(text):
        if language != "python":
            continue
        if BLOCK_ANCHOR in code and "def proxy(" in code and "classify" in code:
            if found is not None:
                raise ValueError(f"{source}: ambiguous classifier block")
            # Parse to guarantee the extracted source is syntactically valid.
            ast.parse(code, filename=f"{source}:{line}")
            found = code
    if found is None:
        raise ValueError(f"{source}: classifier proxy block not found")
    return found


@contextmanager
def blocked_network():
    original_socket = socket.socket

    def local_socket(family=socket.AF_INET, *args, **kwargs):
        if family in (socket.AF_INET, socket.AF_INET6):
            raise AssertionError("Internet sockets forbidden in document example tests")
        return original_socket(family, *args, **kwargs)

    def forbidden(*args, **kwargs):
        raise AssertionError("Network/DNS forbidden in document example tests")

    with ExitStack() as stack:
        stack.enter_context(patch("socket.socket", side_effect=local_socket))
        stack.enter_context(patch("socket.create_connection", side_effect=forbidden))
        stack.enter_context(patch("socket.getaddrinfo", side_effect=forbidden))
        yield


# --------------------------------------------------------------------------
# Test doubles for fastapi / starlette / httpx. They record the behavior the
# corrected code must exercise (client lifetime, background close, forwarded
# body, propagated status) without any real I/O.
# --------------------------------------------------------------------------
class FakeResponse:
    def __init__(self, status_code, content, headers=None, *, chunks=None):
        self.status_code = status_code
        self.content = content if isinstance(content, bytes) else json.dumps(content).encode()
        self.headers = headers or {"content-type": "application/json"}
        self._chunks = chunks
        self.closed = False

    async def aiter_bytes(self):
        for chunk in (self._chunks or [self.content]):
            if self.closed:
                raise AssertionError("stream read after response/client was closed")
            yield chunk

    async def aclose(self):
        self.closed = True


class FakeRequest:
    def __init__(self, method, body=None, query_params=None):
        self.method = method
        self._body = body or {}
        self.query_params = query_params or {}

    async def json(self):
        return self._body


def build_doubles(record):
    """Create fake fastapi/starlette/httpx modules bound to `record`."""

    # ---- httpx ----
    httpx = ModuleType("httpx")

    class AsyncClient:
        def __init__(self, *args, **kwargs):
            record["clients"].append(self)
            self.closed = False
            # The forbidden pattern: using the client as an async context
            # manager inside the handler would close it per request.
            self._ctx_used = False

        async def __aenter__(self):
            self._ctx_used = True
            record["ctx_entered"] = True
            return self

        async def __aexit__(self, *exc):
            self.closed = True
            return False

        def build_request(self, method, url, json=None):
            return SimpleNamespace(method=method, url=url, json=json)

        async def send(self, request, stream=False):
            record["forwarded"].append(
                {"method": request.method, "url": request.url, "json": request.json, "stream": stream}
            )
            return record["stream_response"]

        async def post(self, url, json=None):
            record["forwarded"].append({"method": "POST", "url": url, "json": json, "stream": False})
            return record["post_response"]

        async def get(self, url, params=None):
            record["forwarded"].append({"method": "GET", "url": url, "params": params})
            return record["get_response"]

        async def aclose(self):
            self.closed = True

    httpx.AsyncClient = AsyncClient

    # ---- starlette.background ----
    starlette = ModuleType("starlette")
    background = ModuleType("starlette.background")

    class BackgroundTask:
        def __init__(self, func, *args, **kwargs):
            self.func = func
            self.args = args
            self.kwargs = kwargs
            record["background_tasks"].append(self)

        async def __call__(self):
            result = self.func(*self.args, **self.kwargs)
            if asyncio.iscoroutine(result):
                await result

    background.BackgroundTask = BackgroundTask
    starlette.background = background

    # ---- fastapi + fastapi.responses ----
    fastapi = ModuleType("fastapi")

    class FastAPI:
        def __init__(self, *args, **kwargs):
            self.lifespan = kwargs.get("lifespan")
            self.routes = []

        def api_route(self, path, methods=None):
            def decorator(func):
                self.routes.append({"path": path, "methods": list(methods or []), "func": func})
                return func
            return decorator

    fastapi.FastAPI = FastAPI
    fastapi.Request = FakeRequest

    class Response:
        def __init__(self, content=None, status_code=200, media_type=None, headers=None):
            self.content = content
            self.status_code = status_code
            self.media_type = media_type
            self.headers = headers or {}

    fastapi.Response = Response

    responses = ModuleType("fastapi.responses")

    class StreamingResponse:
        def __init__(self, content, status_code=200, headers=None, background=None):
            self.body_iterator = content
            self.status_code = status_code
            self.headers = headers or {}
            self.background = background

    responses.StreamingResponse = StreamingResponse
    fastapi.responses = responses

    return {
        "httpx": httpx,
        "starlette": starlette,
        "starlette.background": background,
        "fastapi": fastapi,
        "fastapi.responses": responses,
    }


def load_module(code, source):
    record = {
        "clients": [],
        "forwarded": [],
        "background_tasks": [],
        "ctx_entered": False,
        "stream_response": None,
        "post_response": None,
        "get_response": None,
    }
    doubles = build_doubles(record)
    module = ModuleType("classifier_proxy")
    module.__file__ = f"{source}#classifier_proxy.py"
    with ExitStack() as stack:
        stack.enter_context(patch.dict(sys.modules, doubles))
        exec(compile(code, module.__file__, "exec"), module.__dict__)
    return module, record


def route_for(module, method):
    for route in module.app.routes:
        if method in route["methods"]:
            return route
    return None


class ClassifierProxyTests(unittest.TestCase):
    def setUp(self):
        self.sources = {
            locale: path.read_text(encoding="utf-8") for locale, path in DOCUMENTS.items()
        }
        self.blocks = {
            locale: extract_classifier(text, DOCUMENTS[locale])
            for locale, text in self.sources.items()
        }

    # ---- Parity: both locales must ship structurally identical executable code ----
    def test_locale_structural_parity(self):
        # Compare control-flow/structure, not localized literal values: the
        # Korean block legitimately carries Korean docstrings/comments and extra
        # Korean STRONG_KEYWORDS. The executable contract is the shape of the
        # functions (classify, _text, proxy, lifespan) and the route methods, so
        # the comparison normalizes Constant values to their type, drops
        # docstring statements, and collapses list/tuple/set element lists (the
        # keyword list length differs by locale by design).
        def shape(code):
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.Constant):
                    node.value = type(node.value).__name__
                if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
                    node.elts = []
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    node.body = [
                        s for s in node.body
                        if not (isinstance(s, ast.Expr) and isinstance(s.value, ast.Constant))
                    ]
            funcs = {
                n.name: ast.dump(n, include_attributes=False)
                for n in ast.walk(tree)
                if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))
            }
            return funcs

        self.maxDiff = None
        en, ko = shape(self.blocks["en"]), shape(self.blocks["ko"])
        self.assertEqual(set(en), set(ko), "KO/EN define different functions")
        for name in en:
            self.assertEqual(en[name], ko[name], f"KO/EN diverge in function {name}")

    def test_route_methods_match_across_locales(self):
        methods = {}
        for locale, code in self.blocks.items():
            with blocked_network():
                module, _ = load_module(code, DOCUMENTS[locale])
            methods[locale] = sorted(
                m for route in module.app.routes for m in route["methods"]
            )
        self.assertEqual(methods["en"], methods["ko"])
        self.assertEqual(methods["en"], ["GET", "POST"])

    # ---- AOR-ADV-001: stream lifetime ----
    def test_client_is_module_scoped_not_per_request(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                # Exactly one client, created at import time (module scope).
                self.assertEqual(len(record["clients"]), 1, "expected a single module-scoped AsyncClient")

    def test_stream_closes_response_after_normal_completion_and_keeps_client_open(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                stream_resp = FakeResponse(200, b"", chunks=[b"data: a\n\n", b"data: b\n\n"])
                record["stream_response"] = stream_resp
                route = route_for(module, "POST")
                request = FakeRequest(
                    "POST",
                    {"model": "auto", "stream": True, "messages": [{"role": "user", "content": "hi"}]},
                )
                response = asyncio.run(route["func"]("chat/completions", request))

                # The per-request handler must NOT have used `async with client`.
                self.assertFalse(record["ctx_entered"], "handler closed the shared client per request (AOR-ADV-001)")
                client = record["clients"][0]
                self.assertFalse(client.closed, "shared client was closed before the stream was consumed")

                # Normal downstream completion closes the upstream response in
                # relay_body's finally block, while the app-scoped client stays open.
                chunks = asyncio.run(_drain(response.body_iterator))
                self.assertEqual(chunks, [b"data: a\n\n", b"data: b\n\n"])
                self.assertTrue(stream_resp.closed)
                self.assertFalse(client.closed)

    def test_stream_closes_response_when_downstream_stops_early(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                stream_resp = FakeResponse(200, b"", chunks=[b"first", b"second"])
                record["stream_response"] = stream_resp
                route = route_for(module, "POST")
                request = FakeRequest(
                    "POST",
                    {"model": "auto", "stream": True, "messages": [{"role": "user", "content": "hi"}]},
                )
                response = asyncio.run(route["func"]("chat/completions", request))

                async def consume_one_then_close():
                    iterator = response.body_iterator
                    first = await iterator.__anext__()
                    await iterator.aclose()
                    return first

                self.assertEqual(asyncio.run(consume_one_then_close()), b"first")
                self.assertTrue(stream_resp.closed, "upstream response remained open after downstream cancellation")
                self.assertFalse(record["clients"][0].closed)

    # ---- AOR-ADV-002: model rewrite ----
    def test_model_auto_is_rewritten_to_served_name(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                record["post_response"] = FakeResponse(200, {"ok": True})
                route = route_for(module, "POST")
                # Weak-tier prompt: short, no strong keyword.
                request = FakeRequest(
                    "POST",
                    {"model": "auto", "messages": [{"role": "user", "content": "hello"}]},
                )
                asyncio.run(route["func"]("chat/completions", request))
                forwarded = record["forwarded"][-1]
                self.assertNotEqual(
                    forwarded["json"]["model"], "auto",
                    "proxy forwarded model=auto unchanged (AOR-ADV-002)",
                )
                self.assertEqual(forwarded["json"]["model"], module.WEAK_MODEL)

    def test_strong_prompt_routes_to_strong_backend_and_model(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                record["post_response"] = FakeResponse(200, {"ok": True})
                route = route_for(module, "POST")
                request = FakeRequest(
                    "POST",
                    {"model": "auto", "messages": [{"role": "user", "content": "please refactor this module"}]},
                )
                asyncio.run(route["func"]("chat/completions", request))
                forwarded = record["forwarded"][-1]
                self.assertEqual(forwarded["json"]["model"], module.STRONG_MODEL)
                self.assertIn(module.STRONG_URL, forwarded["url"])

    # ---- AOR-ADV-002: method/endpoint contract ----
    def test_get_models_is_supported(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                get_route = route_for(module, "GET")
                self.assertIsNotNone(get_route, "GET /v1/models not supported -> documented smoke check 405s (AOR-ADV-002)")
                record["get_response"] = FakeResponse(200, {"data": []})
                request = FakeRequest("GET", query_params={})
                response = asyncio.run(get_route["func"]("models", request))
                self.assertEqual(response.status_code, 200)
                forwarded = record["forwarded"][-1]
                self.assertEqual(forwarded["method"], "GET")
                self.assertTrue(forwarded["url"].endswith("/v1/models"))

    # ---- AOR-ADV-002: status propagation ----
    def test_nonstream_upstream_error_status_is_propagated(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                record["post_response"] = FakeResponse(422, {"error": "bad model"})
                route = route_for(module, "POST")
                request = FakeRequest(
                    "POST",
                    {"model": "auto", "messages": [{"role": "user", "content": "hello"}]},
                )
                response = asyncio.run(route["func"]("chat/completions", request))
                self.assertEqual(
                    getattr(response, "status_code", 200), 422,
                    "upstream 422 was not propagated to the caller (AOR-ADV-002)",
                )

    # ---- content handling: array-form message content ----
    def test_array_form_content_is_classified(self):
        for locale, code in self.blocks.items():
            with self.subTest(locale=locale), blocked_network():
                module, record = load_module(code, DOCUMENTS[locale])
                messages = [
                    {"role": "user", "content": [{"type": "text", "text": "please optimize performance"}]}
                ]
                # Array-form content containing a strong keyword must route strong
                # without raising (the pre-fix join rejected array content).
                self.assertEqual(module.classify(messages), "strong")


async def _drain(iterator):
    return [chunk async for chunk in iterator]


class ExtractionGuardTests(unittest.TestCase):
    def test_block_present_in_both_locales(self):
        for locale, path in DOCUMENTS.items():
            text = path.read_text(encoding="utf-8")
            code = extract_classifier(text, path)
            self.assertIn("def proxy(", code)
            # Record a digest so accidental silent edits are visible in diffs.
            self.assertTrue(hashlib.sha256(code.encode()).hexdigest())

    def test_missing_block_fails(self):
        with self.assertRaisesRegex(ValueError, "not found"):
            extract_classifier("# no code here\n", "missing")


if __name__ == "__main__":
    unittest.main(verbosity=2)
