"""Run from repository cwd; test exact bilingual document examples without SDKs.

No snippet/fixture files are imported. The seven named Python blocks and two JSON
fixtures must be unambiguous and semantically equal across locales. Six pure
modules execute in isolated module namespaces; the Airflow DAG is parsed only.
PyArrow in the reader test is a fake codec, never the installed SDK.
"""
from pathlib import Path
import ast
import asyncio
from contextlib import ExitStack, contextmanager
import copy
from datetime import datetime, timezone
import hashlib
import io
import inspect
import math
import os
import json
import re
import socket
import sys
import tempfile
import threading
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

RELATIVE_PATH = (
    "agentic-ai-platform/reference-architecture/model-lifecycle/"
    "continuous-training/trace-to-dataset.md"
)
DOCUMENTS = {
    "ko": Path("docs") / RELATIVE_PATH,
    "en": Path("i18n/en/docusaurus-plugin-content-docs/current") / RELATIVE_PATH,
}
MODULE_NAMES = (
    "trace_contract", "materialize", "register_parquet", "reward_contract",
    "judge_one", "batch_reward_labeling", "langfuse_to_s3",
)
EXECUTED_MODULES = MODULE_NAMES[:-1]
EXPORTS = {
    "trace_contract": (
        "Rejected", "candidate", "canonical", "digest", "fetch_generations",
        "load_policy", "require_approval",
    ),
    "materialize": ("write_snapshot",),
    "register_parquet": ("register_snapshot",),
    "reward_contract": ("aggregate", "parse_judge", "unit_score"),
    "judge_one": ("judge_one",),
    "batch_reward_labeling": ("read_candidates", "DispatchAuthorization", "guarded_transports", "evaluate_rows"),
}


def strict_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f"non-finite JSON constant: {value}")


def fences(text):
    """Read consecutive fenced ranges; never match code inside another fence."""
    opened, content = None, []
    for line_number, line in enumerate(text.splitlines(), 1):
        if opened:
            marker, language, first_line = opened
            if re.fullmatch(r" {0,3}" + re.escape(marker[0]) + r"{" + str(len(marker)) + r",}\s*", line):
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


def extract_document(text, source):
    modules, python_asts, fixtures, json_blocks = {}, [], {}, 0
    for language, code, line in fences(text):
        if language == "python":
            tree = ast.parse(code, filename=f"{source}:{line}")
            python_asts.append(ast.dump(tree, include_attributes=False))
            first = code.splitlines()[0] if code else ""
            marker = re.fullmatch(r"# ([a-z][a-z0-9_]*\.py)", first)
            if marker:
                name = marker[1][:-3]
                if name not in MODULE_NAMES:
                    raise ValueError(f"{source}: unexpected module {name}")
                if name in modules:
                    raise ValueError(f"{source}: ambiguous module {name}")
                modules[name] = {"code": code, "line": line}
        elif language == "json":
            json_blocks += 1
            value = json.loads(code, object_pairs_hook=strict_object,
                               parse_constant=reject_constant)
            if not isinstance(value, dict):
                raise ValueError(f"{source}:{line}: JSON fixture must be an object")
            if {"id", "traceId", "type", "metadata"} <= value.keys():
                kind = "observation"
            elif {"schema_version", "project_id", "revision", "valid_until", "approved"} <= value.keys():
                kind = "approval"
            else:
                raise ValueError(f"{source}:{line}: unrecognized JSON fixture")
            if kind in fixtures:
                raise ValueError(f"{source}: ambiguous {kind} JSON fixture")
            fixtures[kind] = value
    if set(modules) != set(MODULE_NAMES):
        raise ValueError(f"{source}: missing modules {sorted(set(MODULE_NAMES) - modules.keys())}")
    if len(python_asts) != 8:
        raise ValueError(f"{source}: expected seven named modules and one arithmetic block")
    if set(fixtures) != {"observation", "approval"} or json_blocks != 2:
        raise ValueError(f"{source}: missing or ambiguous observation/approval fixtures")
    return SimpleNamespace(source=str(source), sha256=hashlib.sha256(text.encode()).hexdigest(), modules=modules,
                           python_asts=python_asts, fixtures=fixtures)


def compare_documents(left, right):
    if left.python_asts != right.python_asts:
        raise ValueError("KO/EN executable Python semantics diverge")
    if left.fixtures != right.fixtures:
        raise ValueError("KO/EN JSON fixture semantics diverge")


def read_documents():
    # Cwd is the repository root, as used by npm test:examples.
    documents = {
        locale: extract_document(path.read_text(encoding="utf-8"), path)
        for locale, path in DOCUMENTS.items()
    }
    compare_documents(documents["ko"], documents["en"])
    return documents


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


def load_pure_modules(document, stack):
    modules = {name: ModuleType(name) for name in EXECUTED_MODULES}
    # Imports between examples resolve to this locale's exact extracted source.
    stack.enter_context(patch.dict(sys.modules, modules))
    api = SimpleNamespace()
    for name in EXECUTED_MODULES:
        module = modules[name]
        block = document.modules[name]
        module.__file__ = f"{document.source}#{name}.py"
        allowed = set(EXECUTED_MODULES) | {
            "hashlib", "json", "datetime", "io", "collections", "copy",
            "math", "asyncio", "os", "re", "threading",
        }
        for statement in ast.parse(block["code"]).body:
            if isinstance(statement, ast.Import):
                imports = [alias.name.split(".")[0] for alias in statement.names]
            elif isinstance(statement, ast.ImportFrom):
                imports = [(statement.module or "").split(".")[0]]
            else:
                continue
            if not set(imports) <= allowed:
                raise ValueError(f"{name}: unexpected top-level dependency {imports}")
        exec(compile(block["code"], module.__file__, "exec"), module.__dict__)
        for attribute in EXPORTS[name]:
            setattr(api, attribute, getattr(module, attribute))
    return api


class ExtractionTests(unittest.TestCase):
    def original(self):
        return DOCUMENTS["ko"].read_text(encoding="utf-8")

    def test_current_docs_and_fixture_parity(self):
        docs = read_documents()
        self.assertEqual(len(docs["ko"].modules), 7)
        self.assertEqual(len(docs["en"].fixtures), 2)

    def test_missing_module_fails(self):
        text = self.original().replace("# trace_contract.py", "# missing marker", 1)
        with self.assertRaisesRegex(ValueError, "missing modules"):
            extract_document(text, "missing")

    def test_duplicate_module_fails(self):
        text = self.original()
        doc = extract_document(text, "original")
        text += "\n```python\n" + doc.modules["trace_contract"]["code"] + "```\n"
        with self.assertRaisesRegex(ValueError, "ambiguous module"):
            extract_document(text, "duplicate")

    def test_ambiguous_json_fixture_fails(self):
        text = self.original()
        doc = extract_document(text, "original")
        text += "\n```json\n" + json.dumps(doc.fixtures["observation"]) + "\n```\n"
        with self.assertRaisesRegex(ValueError, "ambiguous observation"):
            extract_document(text, "duplicate")

    def test_executable_semantic_drift_fails(self):
        text = self.original()
        changed = text.replace("0.5 * unit_score", "0.4 * unit_score", 1)
        self.assertNotEqual(text, changed)
        with self.assertRaisesRegex(ValueError, "Python semantics diverge"):
            compare_documents(extract_document(text, "original"),
                              extract_document(changed, "changed"))

    def test_fixture_drift_fails(self):
        text = self.original()
        changed = text.replace('"traceId": "trace_001"', '"traceId": "different"', 1)
        self.assertNotEqual(text, changed)
        with self.assertRaisesRegex(ValueError, "JSON fixture semantics diverge"):
            compare_documents(extract_document(text, "original"),
                              extract_document(changed, "changed"))

    def test_comment_change_preserves_semantic_parity(self):
        text = self.original()
        changed = text.replace("# trace_contract.py", "# trace_contract.py\n# Localized comment", 1)
        compare_documents(extract_document(text, "original"),
                          extract_document(changed, "comment"))

    def test_network_and_dns_are_blocked(self):
        with blocked_network():
            for action in (
                lambda: socket.socket(socket.AF_INET),
                lambda: socket.socket(socket.AF_INET6),
                lambda: socket.create_connection(("example.invalid", 443)),
                lambda: socket.getaddrinfo("example.invalid", 443),
            ):
                with self.subTest(action=action), self.assertRaises(AssertionError):
                    action()


# The fake clients and per-locale contract cases below contain no production-code copies.
class FakeResponse:
    def __init__(self, data, page, total, pages, status=200):
        self.status_code = status
        self.payload = {"data": data, "meta": {
            "page": page, "totalItems": total, "totalPages": pages, "limit": 100,
        }}

    def json(self):
        return self.payload


class FakeSession:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.requests = []

    def get(self, url, **kwargs):
        self.requests.append((url, kwargs))
        return next(self.responses)


class FakeHook:
    def __init__(self, fail_on_file=False):
        self.files = {}
        self.markers = {}
        self.fail_on_file = fail_on_file

    def load_file_obj(self, file_obj, key, bucket_name=None, replace=False):
        if self.fail_on_file:
            raise OSError("fixture upload failure")
        if not isinstance(file_obj, io.BytesIO) or file_obj.tell() != 0:
            raise AssertionError("upload needs a rewound in-memory file")
        self.files[(bucket_name, key)] = file_obj.read()

    def load_bytes(self, bytes_data, key, bucket_name=None, replace=False):
        self.markers[(bucket_name, key)] = bytes_data


class EvaluationStubs:
    """Local SDK/protocol-shape stubs; all request bodies stay in memory."""
    def __init__(self, case):
        self.case = case
        self.sent, self.headers, self.client_options = [], [], []
        self.before_headers = self.before_body = self.before_chunk = None
        self.after_send = self.after_ragas = self.before_retry = None
        self.emit_trace = True
        self.status = 200
        self.now = case.now
        self.metric_calls, self.retry_calls, self.transport_options = [], [], []

    async def call(self, callback, *args):
        if callback is not None:
            result = callback(*args)
            if inspect.isawaitable(result):
                return await result
            return result

    def call_sync(self, callback, *args):
        if callback is not None:
            result = callback(*args)
            if inspect.isawaitable(result):
                result.close()
                raise AssertionError("A synchronous fixture callback cannot await")
            return result

    def write_policy(self, value):
        # Match the documented atomic replacement requirement.
        pending = self.policy_path.with_suffix(".new")
        pending.write_text(json.dumps(value), encoding="utf-8")
        pending.replace(self.policy_path)

    def revoke(self, *args):
        self.write_policy({**self.case.policy, "approved": {}})

    def __enter__(self):
        self.stack = ExitStack()
        folder = self.stack.enter_context(tempfile.TemporaryDirectory(prefix="trace-dispatch-"))
        self.policy_path = Path(folder) / "approval.json"
        self.write_policy(self.case.policy)
        self.stack.enter_context(patch.dict(os.environ, {
            "APPROVAL_FILE": str(self.policy_path),
            "LANGFUSE_PROJECT_ID": self.case.policy["project_id"],
            "JUDGE_BASE_URL": "https://judge.example.invalid/v1",
            "EMBEDDING_BASE_URL": "https://embedding.example.invalid/v1",
            "JUDGE_API_KEY": "fixture-only", "EMBEDDING_API_KEY": "fixture-only",
            "EMBEDDING_MODEL": "fixture-embedding",
        }))
        env = self

        class AsyncBase:
            async def __aenter__(self):
                return self
            async def __aexit__(self, *args):
                await self.aclose()
            async def aclose(self):
                pass

        class Body(AsyncBase):
            def __init__(self, kind, chunks=(b'{"fixture":"approved"}',)):
                self.kind, self.chunks = kind, chunks
            async def __aiter__(self):
                for index, chunk in enumerate(self.chunks):
                    await env.call(env.before_chunk, self.kind, index)
                    yield chunk

        class SyncBody:
            def __init__(self, kind, chunks=(b'{"fixture":"approved"}',)):
                self.kind, self.chunks = kind, chunks
            def __iter__(self):
                for index, chunk in enumerate(self.chunks):
                    env.call_sync(env.before_chunk, self.kind, index)
                    yield chunk
            def close(self):
                pass

        class Response:
            def __init__(self, status):
                self.status_code, self.closed = status, False
            async def aread(self):
                return b"{}"
            async def aclose(self):
                self.closed = True
            def read(self):
                return b"{}"
            def close(self):
                self.closed = True

        class Inner(AsyncBase):
            async def handle_async_request(self, request):
                await env.call(env.before_headers, request)
                trace = request.extensions.get("trace") if env.emit_trace else None
                if trace:
                    await trace("http11.send_request_headers.started", {"request": request})
                env.headers.append(request.kind)
                await env.call(env.before_body, request)
                if trace:
                    await trace("http11.send_request_body.started", {"request": request})
                async for chunk in request.stream:
                    env.sent.append((request.kind, chunk))
                await env.call(env.after_send, request)
                return Response(env.status)

        class SyncInner:
            def handle_request(self, request):
                env.call_sync(env.before_headers, request)
                trace = request.extensions.get("trace") if env.emit_trace else None
                if trace:
                    trace("http11.send_request_headers.started", {"request": request})
                env.headers.append(request.kind)
                env.call_sync(env.before_body, request)
                if trace:
                    trace("http11.send_request_body.started", {"request": request})
                for chunk in request.stream:
                    env.sent.append((request.kind, chunk))
                env.call_sync(env.after_send, request)
                return Response(env.status)
            def close(self):
                pass

        class Client:
            def __init__(self, **kwargs):
                self.transport = kwargs["transport"]
                env.client_options.append(("sync", kwargs))
            def __enter__(self):
                return self
            def __exit__(self, *args):
                self.transport.close()
            def send(self, request):
                return self.transport.handle_request(request)

        class AsyncClient(AsyncBase):
            def __init__(self, **kwargs):
                self.transport = kwargs.get("transport", Inner())
                env.client_options.append(("async", kwargs))
            async def send(self, request):
                return await self.transport.handle_async_request(request)
            async def aclose(self):
                await self.transport.aclose()

        async def sdk_request(client, kind, retries):
            for attempt in range(retries + 1):
                try:
                    response = await client.send(env.request(kind))
                    if response.status_code >= 500:
                        raise OSError("fixture transient response")
                    return response
                except Exception:
                    if attempt == retries:
                        raise
                    # Simulate the SDK returning to HTTPX after retry backoff.
                    env.retry_calls.append(kind)
                    await env.call(env.before_retry, kind)

        def sdk_request_sync(client, kind, retries):
            for attempt in range(retries + 1):
                try:
                    response = client.send(env.request_sync(kind))
                    if response.status_code >= 500:
                        raise OSError("fixture transient response")
                    return response
                except Exception:
                    if attempt == retries:
                        raise
                    env.retry_calls.append(kind)
                    env.call_sync(env.before_retry, kind)

        class Chat:
            def __init__(self, **kwargs):
                self.options = kwargs
                env.llm_model = self
            async def request(self, kind):
                await sdk_request(self.options["http_async_client"], kind,
                                  self.options["max_retries"])
            def request_sync(self, kind):
                return sdk_request_sync(self.options["http_client"], kind,
                                        self.options["max_retries"])

        class Embeddings(Chat):
            def __init__(self, **kwargs):
                self.options = kwargs
                env.embedding_model = self
            def embed_query(self, text):
                env.metric_calls.append("sync embed_query")
                return self.embed_documents([text], from_query=True)[0]
            def embed_documents(self, texts, from_query=False):
                if not from_query:
                    env.metric_calls.append("sync embed_documents")
                # The pinned check_embedding_ctx_length=False path calls the
                # synchronous OpenAI resource. No async embedding substitution.
                sdk_request_sync(self.options["http_client"], "ragas_embedding",
                                 self.options["max_retries"])
                return [[1.0, 0.0] for _ in texts]

        class OpenAI(AsyncBase):
            def __init__(self, **kwargs):
                self.options = kwargs
                self.chat = SimpleNamespace(completions=SimpleNamespace(create=self.create))
            async def create(self, **kwargs):
                await sdk_request(self.options["http_client"], "custom_judge",
                                  self.options["max_retries"])
                return SimpleNamespace(choices=[SimpleNamespace(
                    finish_reason="stop",
                    message=SimpleNamespace(content='{"score":0.85,"reasoning":"fixture"}'),
                )])

        async def relevance(row, llm, embeddings):
            # Faithful control-flow fixture for Ragas 0.3.9 ResponseRelevancy:
            # await question generation, then synchronous embeddings and cosine
            # mean. Exact pinned method bodies are checked separately offline.
            env.metric_calls.append("await question generation")
            await llm.request("ragas_llm")
            answers = [SimpleNamespace(question=row["user_input"], noncommittal=0)
                       for _ in range(3)]
            query = embeddings.embed_query(row["user_input"])
            vectors = embeddings.embed_documents([answer.question for answer in answers])
            norm = lambda vector: math.sqrt(sum(value * value for value in vector))
            similarities = [sum(x * y for x, y in zip(query, vector))
                            / (norm(query) * norm(vector)) for vector in vectors]
            score = sum(similarities) / len(similarities)
            return score * int(not all(answer.noncommittal for answer in answers))

        async def aevaluate(dataset, *, llm, embeddings, **kwargs):
            scores = [{"faithfulness": .92,
                       "answer_relevancy": await relevance(row, llm, embeddings),
                       "context_precision": .85}
                      for row in dataset.samples]
            await env.call(env.after_ragas)
            return SimpleNamespace(scores=scores)

        self.httpx = ModuleType("httpx")
        self.httpx.__version__ = "0.28.1"
        self.httpx.AsyncBaseTransport = self.httpx.AsyncByteStream = AsyncBase
        self.httpx.BaseTransport = type("BaseTransport", (), {})
        self.httpx.SyncByteStream = type("SyncByteStream", (), {})
        def async_transport(**kwargs):
            env.transport_options.append(("async", kwargs))
            return Inner()
        def sync_transport(**kwargs):
            env.transport_options.append(("sync", kwargs))
            return SyncInner()
        self.httpx.AsyncHTTPTransport = async_transport
        self.httpx.HTTPTransport = sync_transport
        self.httpx.Limits = lambda **kwargs: kwargs
        self.httpx.AsyncClient, self.httpx.Client = AsyncClient, Client
        self.core = ModuleType("httpcore")
        self.core.__version__ = "1.0.9"
        modules = {"httpx": self.httpx, "httpcore": self.core}
        for name in ("openai", "langchain_openai", "ragas", "ragas.llms",
                     "ragas.embeddings", "ragas.metrics", "ragas.run_config"):
            modules[name] = ModuleType(name)
        modules["openai"].AsyncOpenAI = OpenAI
        modules["langchain_openai"].ChatOpenAI = Chat
        modules["langchain_openai"].OpenAIEmbeddings = Embeddings
        modules["ragas"].aevaluate = aevaluate
        modules["ragas"].SingleTurnSample = lambda **kwargs: kwargs
        modules["ragas"].EvaluationDataset = lambda **kwargs: SimpleNamespace(**kwargs)
        modules["ragas.llms"].LangchainLLMWrapper = lambda value: value
        modules["ragas.embeddings"].LangchainEmbeddingsWrapper = lambda value: value
        for metric in ("Faithfulness", "AnswerRelevancy", "ContextPrecision"):
            setattr(modules["ragas.metrics"], metric, lambda: object())
        modules["ragas.run_config"].RunConfig = lambda **kwargs: kwargs
        self.stack.enter_context(patch.dict(sys.modules, modules))
        self.Body, self.Inner = Body, Inner
        self.SyncBody, self.SyncInner = SyncBody, SyncInner
        return self

    def __exit__(self, *args):
        self.stack.close()

    def request(self, kind, chunks=(b'{"fixture":"approved"}',)):
        return SimpleNamespace(kind=kind, stream=self.Body(kind, chunks), extensions={})

    def request_sync(self, kind, chunks=(b'{"fixture":"approved"}',)):
        return SimpleNamespace(kind=kind, stream=self.SyncBody(kind, chunks), extensions={})

    def authorization(self):
        return self.case.api.DispatchAuthorization(
            [self.case.row()], self.policy_path, self.case.policy["project_id"],
            clock=lambda: self.now,
        )

    def transport(self):
        return self.case.api.guarded_transports(self.httpx, self.authorization())

    async def evaluate(self):
        return await self.case.api.evaluate_rows([self.case.row()], clock=lambda: self.now)


class _TraceContractMixin:
    @classmethod
    def setUpClass(cls):
        cls.document = read_documents()[cls.locale]
        cls.stack = ExitStack()
        cls.addClassCleanup(cls.stack.close)
        cls.stack.enter_context(blocked_network())
        cls.api = load_pure_modules(cls.document, cls.stack)

    def setUp(self):
        self.observation = copy.deepcopy(self.document.fixtures["observation"])
        self.policy = copy.deepcopy(self.document.fixtures["approval"])
        self.start = datetime(2026, 9, 18, tzinfo=timezone.utc)
        self.end = datetime(2026, 9, 19, tzinfo=timezone.utc)
        self.now = self.end

    def row(self):
        return self.api.candidate(self.observation, self.policy, self.start, self.end, self.now)

    def test_selected_fields_only(self):
        self.observation.update(input="RAW PRIVATE INPUT", output="RAW OUTPUT", userId="PRIVATE")
        self.observation["metadata"]["secret"] = "DO NOT EXPORT"
        row = self.row()
        self.assertNotIn("RAW", self.api.canonical(row).decode())
        self.assertNotIn("PRIVATE", self.api.canonical(row).decode())
        self.assertNotIn("DO NOT EXPORT", self.api.canonical(row).decode())
        self.assertEqual(row["observation_id"], "generation_001")
        self.assertEqual(row["source_model"], "application-model-v1")

    def test_consent_flag_cannot_authorize(self):
        self.policy["approved"] = {}
        self.observation["metadata"]["user_consent"] = True
        self.observation["tags"] = ["training-eligible"]
        with self.assertRaisesRegex(self.api.Rejected, "not_currently_approved"):
            self.row()

    def test_exact_content_approval(self):
        for field, changed in [("response", "Different content"),
                               ("retrieved_contexts", ["Different context"]),
                               ("reference", "Generated answer as reference")]:
            with self.subTest(field=field):
                obj = copy.deepcopy(self.observation)
                obj["metadata"]["training_sample"][field] = changed
                with self.assertRaisesRegex(self.api.Rejected, "approval_content"):
                    self.api.candidate(obj, self.policy, self.start, self.end, self.now)

    def test_identity_and_reference_binding(self):
        for key in ["trace_id", "source_model", "reference_id", "redaction_version", "source_project"]:
            with self.subTest(key=key):
                row = self.row()
                row[key] = "different"
                with self.assertRaises(self.api.Rejected):
                    self.api.require_approval(row, self.policy, self.now)

    def test_revocation_and_expiry_rechecked(self):
        row = self.row()
        self.policy["approved"].clear()
        with self.assertRaises(self.api.Rejected):
            self.api.require_approval(row, self.policy, self.now)
        self.policy = copy.deepcopy(self.document.fixtures["approval"])
        self.policy["approved"]["generation_001"]["expires_at"] = "2026-09-19T00:00:00Z"
        with self.assertRaises(self.api.Rejected):
            self.api.require_approval(row, self.policy, self.now)

    def test_policy_expiry_and_project(self):
        with tempfile.TemporaryDirectory(prefix="trace-example-") as temporary:
            path = Path(temporary) / "policy.json"
            path.write_text(json.dumps(self.policy))
            self.assertEqual(self.api.load_policy(path, "example-project", self.now)["revision"], "approval-v1")
            with self.assertRaises(self.api.Rejected):
                self.api.load_policy(path, "other-project", self.now)
            self.policy["valid_until"] = self.now.isoformat()
            path.write_text(json.dumps(self.policy))
            with self.assertRaises(self.api.Rejected):
                self.api.load_policy(path, "example-project", self.now)

    def test_time_window_and_completed_generation(self):
        for changes in [
            {"startTime": "2026-09-18T03:15:00"},
            {"startTime": "2026-09-19T00:00:00Z"},
            {"endTime": None}, {"endTime": "2026-09-18T02:00:00Z"},
            {"endTime": "2026-09-20T00:00:00Z"},
        ]:
            with self.subTest(changes=changes):
                obj = {**self.observation, **changes}
                with self.assertRaises(self.api.Rejected):
                    self.api.candidate(obj, self.policy, self.start, self.end, self.now)

    def test_missing_rag_fields_are_not_filled(self):
        for field, invalid in [("reference", ""), ("retrieved_contexts", []),
                               ("retrieved_contexts", "not-a-list"),
                               ("user_input", None)]:
            with self.subTest(field=field, invalid=invalid):
                obj = copy.deepcopy(self.observation)
                obj["metadata"]["training_sample"][field] = invalid
                with self.assertRaises(self.api.Rejected):
                    self.api.candidate(obj, self.policy, self.start, self.end, self.now)

    def test_oversized_sample_rejected(self):
        self.observation["metadata"]["training_sample"]["user_input"] = "x" * 12_001
        with self.assertRaisesRegex(self.api.Rejected, "character_limit"):
            self.row()

    def test_complete_pagination_and_transport_parameters(self):
        session = FakeSession([
            FakeResponse([{"id": "a"}], 1, 2, 2),
            FakeResponse([{"id": "b"}], 2, 2, 2),
        ])
        result = self.api.fetch_generations(session, "https://example.invalid", self.start, self.end)
        self.assertEqual([row["id"] for row in result], ["a", "b"])
        self.assertEqual(session.requests[0][1]["params"]["limit"], 100)
        self.assertEqual(session.requests[0][1]["params"]["fromStartTime"], self.start.isoformat())
        self.assertFalse(session.requests[0][1]["allow_redirects"])
        self.assertEqual(session.requests[0][1]["timeout"], (5, 30))

    def test_pagination_omission_and_duplicate_fail(self):
        for responses in [
            [FakeResponse([{"id": "a"}], 1, 2, 1)],
            [FakeResponse([{"id": "a"}, {"id": "a"}], 1, 2, 1)],
            [FakeResponse([{"id": "a"}], 2, 1, 1)],
        ]:
            with self.subTest(responses=responses), self.assertRaises(self.api.Rejected):
                self.api.fetch_generations(FakeSession(responses), "https://example.invalid",
                                  self.start, self.end)

    def test_pagination_change_and_cap_fail(self):
        for responses in [
            [FakeResponse([{"id": "a"}], 1, 2, 2),
             FakeResponse([{"id": "b"}], 2, 3, 2)],
            [FakeResponse([], 1, 10001, 101)],
            [FakeResponse([], 1, 1, 101)],
        ]:
            with self.subTest(responses=responses), self.assertRaises(self.api.Rejected):
                self.api.fetch_generations(FakeSession(responses), "https://example.invalid",
                                  self.start, self.end)

    def test_export_http_failure_and_empty_response(self):
        with self.assertRaises(self.api.Rejected):
            self.api.fetch_generations(FakeSession([FakeResponse([], 1, 0, 0, 401)]),
                              "https://example.invalid", self.start, self.end)
        result = self.api.fetch_generations(FakeSession([FakeResponse([], 1, 0, 0)]),
                                   "https://example.invalid", self.start, self.end)
        self.assertEqual(result, [])

    def test_s3_file_contract_and_completion_marker(self):
        hook = FakeHook()
        result = self.api.write_snapshot([self.row()], hook, "fixture-bucket", self.policy,
                                {"start": self.start.isoformat(), "end": self.end.isoformat()},
                                encode=self.api.canonical)
        self.assertEqual(len(hook.files), 1)
        self.assertEqual(len(hook.markers), 1)
        manifest = json.loads(hook.markers[("fixture-bucket", result["manifest_key"])])
        self.assertEqual(manifest["row_count"], 1)
        self.assertNotIn("/data/", result["manifest_key"])
        self.assertNotIn("application-model-v1", next(iter(hook.files))[1])
        # canonical is an injected codec fixture, not a Parquet implementation.

    def test_snapshot_retry_identity_and_approval_revision(self):
        rows, interval = [self.row()], {"start": "s", "end": "e"}
        a = self.api.write_snapshot(rows, FakeHook(), "bucket", self.policy, interval, encode=self.api.canonical)
        b = self.api.write_snapshot(rows, FakeHook(), "bucket", self.policy, interval, encode=self.api.canonical)
        self.assertEqual(a, b)
        policy = {**self.policy, "revision": "updated"}
        c = self.api.write_snapshot(rows, FakeHook(), "bucket", policy, interval, encode=self.api.canonical)
        self.assertNotEqual(a["manifest_key"], c["manifest_key"])

    def test_upload_failure_has_no_completion_marker(self):
        hook = FakeHook(fail_on_file=True)
        with self.assertRaises(OSError):
            self.api.write_snapshot([self.row()], hook, "bucket", self.policy, {}, encode=self.api.canonical)
        self.assertEqual(hook.markers, {})

    def test_no_empty_or_duplicate_snapshot(self):
        for rows in [[], [self.row(), self.row()]]:
            with self.subTest(rows=len(rows)), self.assertRaises(self.api.Rejected):
                self.api.write_snapshot(rows, FakeHook(), "bucket", self.policy, {}, encode=self.api.canonical)

    def test_reward_arithmetic(self):
        value = self.api.aggregate({"faithfulness": .92, "answer_relevancy": .88,
                           "context_precision": .85}, .85)
        self.assertAlmostEqual(value["ragas_reward"], .894)
        self.assertAlmostEqual(value["final_reward"], .8764)

    def test_invalid_scores_never_become_zero(self):
        for invalid in [float("nan"), float("inf"), -float("inf"), -.01, 1.01, True, "0.9", None]:
            with self.subTest(invalid=repr(invalid)), self.assertRaises(self.api.Rejected):
                self.api.unit_score(invalid)

    def test_judge_json_contract(self):
        self.assertEqual(self.api.parse_judge('{"score":0.85,"reasoning":"bounded fixture"}'), .85)
        for invalid in [
            '[]', '{"score":0.5}', '{"score":0.2,"score":0.8,"reasoning":"x"}',
            '{"score":NaN,"reasoning":"x"}', '{"score":true,"reasoning":"x"}',
            '{"score":"0.8","reasoning":"x"}', '{"score":0.5,"reasoning":"x","extra":1}',
            '{"score":0.5,"reasoning":""}', '```json\\n{"score":0.5}\\n```',
            'x' * 4097,
        ]:
            with self.subTest(invalid=invalid[:70]), self.assertRaises(self.api.Rejected):
                self.api.parse_judge(invalid)

    def test_missing_metric_does_not_broadcast_or_default(self):
        with self.assertRaises(KeyError):
            self.api.aggregate({"faithfulness": .9, "answer_relevancy": .8}, .8)
        with self.assertRaises(self.api.Rejected):
            self.api.aggregate({"faithfulness": float("nan"), "answer_relevancy": .8,
                       "context_precision": .9}, .8)

    def test_async_judge_alias_and_completion_state(self):
        calls = []
        async def create(**kwargs):
            calls.append(kwargs)
            return SimpleNamespace(choices=[SimpleNamespace(
                finish_reason="stop",
                message=SimpleNamespace(content='{"score":0.75,"reasoning":"fixture"}'),
            )])
        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
        self.assertEqual(asyncio.run(self.api.judge_one(client, self.row())), .75)
        self.assertEqual(calls[0]["model"], "qwen3-judge")
        self.assertIn("retrieved_contexts", calls[0]["messages"][1]["content"])
        async def truncated(**kwargs):
            return SimpleNamespace(choices=[SimpleNamespace(
                finish_reason="length",
                message=SimpleNamespace(content='{"score":0.75,"reasoning":"fixture"}'),
            )])
        client.chat.completions.create = truncated
        with self.assertRaises(self.api.Rejected):
            asyncio.run(self.api.judge_one(client, self.row()))

    def test_candidate_reader_rejects_extra_private_columns_and_bad_hash(self):
        payload = b"fake-codec-not-parquet"
        parquet = ModuleType("pyarrow.parquet")
        arrow = ModuleType("pyarrow")
        arrow.parquet = parquet
        row = self.row()
        parquet.read_table = lambda stream: SimpleNamespace(to_pylist=lambda: [row])
        key = "trace-candidates/" + "a" * 64 + "/data/part.parquet"
        manifest = {
            "kind": "trace_candidates", "dataset_id": "a" * 64, "bucket": "bucket",
            "data_prefix": "trace-candidates/" + "a" * 64 + "/data/",
            "row_count": 1,
            "objects": [{"key": key, "rows": 1,
                         "sha256": hashlib.sha256(payload).hexdigest()}],
        }
        client = SimpleNamespace(get_object=lambda **kwargs: {"Body": io.BytesIO(payload)})
        hook = SimpleNamespace(get_conn=lambda: client)
        with patch.dict(sys.modules, {"pyarrow": arrow, "pyarrow.parquet": parquet}):
            self.assertEqual(self.api.read_candidates(hook, "bucket", manifest), [row])
            row["raw_user_email"] = "not-approved@example.invalid"
            with self.assertRaisesRegex(self.api.Rejected, "unexpected_candidate_columns"):
                self.api.read_candidates(hook, "bucket", manifest)
            del row["raw_user_email"]
            manifest["objects"][0]["sha256"] = "0" * 64
            with self.assertRaisesRegex(self.api.Rejected, "hash_mismatch"):
                self.api.read_candidates(hook, "bucket", manifest)

    def test_glue_partition_error_is_not_success(self):
        calls = []
        class Exists(Exception):
            pass
        glue = SimpleNamespace(
            exceptions=SimpleNamespace(AlreadyExistsException=Exists),
            create_table=lambda **kwargs: calls.append(kwargs),
            batch_create_partition=lambda **kwargs: {
                "Errors": [{"ErrorDetail": {"ErrorCode": "AccessDeniedException"}}],
            },
        )
        manifest = {"dataset_id": "a" * 64, "bucket": "bucket",
                    "data_prefix": "trace-candidates/x/data/",
                    "objects": [{"date": "2026-09-18", "model_key": "a",
                                 "key": "trace-candidates/x/data/date=2026-09-18/model_key=a/part.parquet"}]}
        with self.assertRaisesRegex(ValueError, "partition_registration_failed"):
            self.api.register_snapshot(glue, "training_data", manifest)
        table = calls[0]["TableInput"]
        self.assertEqual(table["TableType"], "EXTERNAL_TABLE")
        self.assertNotIn("ICEBERG", json.dumps(table))

    def glue_retry_fixture(self):
        class Exists(Exception):
            pass
        class Glue:
            exceptions = SimpleNamespace(AlreadyExistsException=Exists)
            def __init__(self):
                self.table, self.partitions = None, {}
            def create_table(self, DatabaseName, TableInput):
                if self.table is not None:
                    raise Exists()
                self.table = copy.deepcopy(TableInput)
            def get_table(self, **kwargs):
                return {"Table": copy.deepcopy(self.table)}
            def batch_create_partition(self, DatabaseName, TableName, PartitionInputList):
                errors = []
                for item in PartitionInputList:
                    key = tuple(item["Values"])
                    if key in self.partitions:
                        errors.append({"PartitionValues": list(key),
                                       "ErrorDetail": {"ErrorCode": "AlreadyExistsException"}})
                    else:
                        self.partitions[key] = copy.deepcopy(item)
                return {"Errors": errors}
            def get_partition(self, PartitionValues, **kwargs):
                return {"Partition": copy.deepcopy(self.partitions[tuple(PartitionValues)])}
        manifest = {"dataset_id": "a" * 64, "bucket": "bucket",
                    "data_prefix": "trace-candidates/x/data/",
                    "objects": [{"date": "2026-09-18", "model_key": "a",
                                 "key": "trace-candidates/x/data/date=2026-09-18/model_key=a/part.parquet"}]}
        glue = Glue()
        self.api.register_snapshot(glue, "training_data", manifest)
        return glue, manifest

    def test_glue_identical_retry_is_accepted(self):
        glue, manifest = self.glue_retry_fixture()
        self.assertEqual(self.api.register_snapshot(glue, "training_data", manifest),
                         "trace_candidates_" + "a" * 64)

    def test_glue_stale_table_rejected_on_retry(self):
        mutations = [
            lambda t: t.update(TableType="VIRTUAL_VIEW"),
            lambda t: t.update(Name="different"),
            lambda t: t.update(PartitionKeys=[]),
            lambda t: t["Parameters"].update(classification="iceberg"),
            lambda t: t["Parameters"].update(EXTERNAL="FALSE"),
            lambda t: t["Parameters"].update(table_type="ICEBERG"),
            lambda t: t["StorageDescriptor"].update(Location="s3://other/data/"),
            lambda t: t["StorageDescriptor"].update(Columns=[]),
            lambda t: t["StorageDescriptor"].update(InputFormat="wrong-input"),
            lambda t: t["StorageDescriptor"].update(OutputFormat="wrong-output"),
            lambda t: t["StorageDescriptor"]["SerdeInfo"].update(SerializationLibrary="wrong-serde"),
            lambda t: t["StorageDescriptor"]["SerdeInfo"].update(Parameters={"altered": "true"}),
            lambda t: t["StorageDescriptor"]["SerdeInfo"].update(Name="altered"),
            lambda t: t["StorageDescriptor"].update(AdditionalLocations=["s3://other/data/"]),
            lambda t: t["StorageDescriptor"].update(SchemaReference={"SchemaVersionId": "other"}),
            lambda t: t["StorageDescriptor"].update(Parameters={"altered": "true"}),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(index=index):
                glue, manifest = self.glue_retry_fixture()
                mutate(glue.table)
                with self.assertRaisesRegex(ValueError, "existing_snapshot_table_mismatch"):
                    self.api.register_snapshot(glue, "training_data", manifest)

    def test_glue_stale_partition_rejected_on_retry(self):
        mutations = [
            lambda p: p.update(Values=["wrong-date", "a"]),
            lambda p: p["StorageDescriptor"].update(Location="s3://other/data/"),
            lambda p: p["StorageDescriptor"].update(Columns=[]),
            lambda p: p["StorageDescriptor"].update(InputFormat="wrong-input"),
            lambda p: p["StorageDescriptor"].update(OutputFormat="wrong-output"),
            lambda p: p["StorageDescriptor"]["SerdeInfo"].update(SerializationLibrary="wrong-serde"),
            lambda p: p["StorageDescriptor"]["SerdeInfo"].update(Parameters={"altered": "true"}),
            lambda p: p["StorageDescriptor"]["SerdeInfo"].update(Name="altered"),
            lambda p: p["StorageDescriptor"].update(AdditionalLocations=["s3://other/data/"]),
            lambda p: p["StorageDescriptor"].update(SchemaReference={"SchemaVersionId": "other"}),
            lambda p: p["StorageDescriptor"].update(Parameters={"altered": "true"}),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(index=index):
                glue, manifest = self.glue_retry_fixture()
                mutate(glue.partitions[("2026-09-18", "a")])
                with self.assertRaisesRegex(ValueError, "existing_snapshot_partition_mismatch"):
                    self.api.register_snapshot(glue, "training_data", manifest)


    def test_dispatch_current_approval_and_unreadable_file(self):
        for invalid in ("revoked", "expired", "missing", "malformed"):
            with self.subTest(invalid=invalid), EvaluationStubs(self) as env:
                gate = env.authorization()
                gate.check()
                if invalid == "revoked":
                    env.revoke()
                elif invalid == "expired":
                    env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                elif invalid == "missing":
                    env.policy_path.unlink()
                else:
                    env.policy_path.write_text("{", encoding="utf-8")
                with self.assertRaises(self.api.Rejected):
                    gate.check()
                self.assertTrue(gate.stopped)

    def test_dispatch_denial_does_not_auto_resume(self):
        with EvaluationStubs(self) as env:
            gate = env.authorization()
            env.revoke()
            with self.assertRaises(self.api.Rejected):
                gate.check()
            env.write_policy(self.policy)
            with self.assertRaisesRegex(self.api.Rejected, "authorization_stopped"):
                gate.check()

    def test_dispatch_authorized_ragas_embedding_and_custom_judge(self):
        with EvaluationStubs(self) as env:
            rows = asyncio.run(env.evaluate())
            self.assertEqual([kind for kind, _ in env.sent],
                             ["ragas_llm", "ragas_embedding", "ragas_embedding", "custom_judge"])
            self.assertAlmostEqual(rows[0]["final_reward"], .898)
            self.assertEqual(env.metric_calls, ["await question generation",
                                               "sync embed_query", "sync embed_documents"])
            for kind, options in env.transport_options:
                self.assertEqual(options["retries"], 0)
                self.assertIs(options["http2"], False)
                self.assertEqual(options["limits"]["max_connections"],
                                 1 if kind == "sync" else 3)
            self.assertEqual([kind for kind, _ in env.client_options], ["sync", "async"])
            for _, options in env.client_options:
                self.assertIs(options["trust_env"], False)
                self.assertIs(options["follow_redirects"], False)

    def test_dispatch_revoked_during_ragas_never_sends_custom_judge(self):
        with EvaluationStubs(self) as env:
            env.after_ragas = env.revoke
            with self.assertRaises(self.api.Rejected):
                asyncio.run(env.evaluate())
            self.assertEqual([kind for kind, _ in env.sent],
                             ["ragas_llm", "ragas_embedding", "ragas_embedding"])
            self.assertNotIn("custom_judge", env.headers)

    def test_dispatch_ragas_embedding_rechecks_after_llm_revocation(self):
        with EvaluationStubs(self) as env:
            env.after_send = lambda request: env.revoke() if request.kind == "ragas_llm" else None
            with self.assertRaises(self.api.Rejected):
                asyncio.run(env.evaluate())
            self.assertEqual([kind for kind, _ in env.sent], ["ragas_llm"])
            self.assertNotIn("ragas_embedding", env.headers)

    def test_dispatch_rechecks_after_connection_wait(self):
        for invalid in ("revoked", "expired"):
            with self.subTest(invalid=invalid), EvaluationStubs(self) as env:
                async def waited(request):
                    await asyncio.sleep(0)
                    if invalid == "revoked":
                        env.revoke()
                    else:
                        env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                env.before_headers = waited
                transport, _ = env.transport()
                with self.assertRaises(self.api.Rejected):
                    asyncio.run(transport.handle_async_request(env.request("after-connect-wait")))
                self.assertEqual(env.headers, [])
                self.assertEqual(env.sent, [])

    def test_dispatch_queued_request_rechecks_after_slot_wait(self):
        with EvaluationStubs(self) as env:
            async def exercise():
                full, release = asyncio.Event(), asyncio.Event()
                started = 0
                async def after_send(request):
                    nonlocal started
                    started += 1
                    if started == 3:
                        full.set()
                    await release.wait()
                env.after_send = after_send
                transport, _ = env.transport()
                tasks = [asyncio.create_task(transport.handle_async_request(
                    env.request(f"inflight-{i}"))) for i in range(3)]
                await asyncio.wait_for(full.wait(), 1)
                queued = asyncio.create_task(transport.handle_async_request(env.request("queued")))
                await asyncio.sleep(0)
                env.revoke()
                release.set()
                result = await asyncio.gather(*tasks, queued, return_exceptions=True)
                self.assertIsInstance(result[-1], self.api.Rejected)
                self.assertEqual(len(env.sent), 3)  # Earlier authorized requests were already in flight.
                self.assertNotIn("queued", env.headers)
            asyncio.run(exercise())

    def test_dispatch_rechecks_before_body_and_after_body_producer_wait(self):
        for phase in ("before_body", "before_first_chunk", "before_second_chunk"):
            with self.subTest(phase=phase), EvaluationStubs(self) as env:
                if phase == "before_body":
                    env.before_body = env.revoke
                else:
                    target = 0 if phase == "before_first_chunk" else 1
                    async def producer(kind, index):
                        await asyncio.sleep(0)
                        if index == target:
                            env.revoke()
                    env.before_chunk = producer
                transport, _ = env.transport()
                with self.assertRaises(self.api.Rejected):
                    asyncio.run(transport.handle_async_request(
                        env.request("body-wait", (b"first", b"second"))))
                self.assertEqual(len(env.sent), 1 if phase == "before_second_chunk" else 0)

    def test_dispatch_every_sdk_path_rechecks_after_retry_backoff(self):
        for path in ("ragas_llm", "ragas_embedding", "custom_judge"):
            with self.subTest(path=path), EvaluationStubs(self) as env:
                def sent(request):
                    env.status = 503 if request.kind == path else 200
                env.after_send = sent
                def backoff(kind):
                    if kind == path:
                        env.revoke()
                env.before_retry = backoff
                with self.assertRaises((self.api.Rejected, OSError)):
                    asyncio.run(env.evaluate())
                self.assertIn(path, env.retry_calls)
                self.assertEqual(sum(kind == path for kind, _ in env.sent), 1)
                self.assertEqual(env.headers.count(path), 1)

    def test_dispatch_missing_trace_hook_cannot_release_body(self):
        with EvaluationStubs(self) as env:
            env.emit_trace = False
            transport, _ = env.transport()
            with self.assertRaisesRegex(self.api.Rejected, "missing_httpcore_dispatch_hook"):
                asyncio.run(transport.handle_async_request(env.request("no-trace")))
            self.assertEqual(env.sent, [])

    def test_dispatch_sync_llm_fallback_uses_guarded_client(self):
        for invalid in (None, "revoked", "expired"):
            with self.subTest(invalid=invalid), EvaluationStubs(self) as env:
                def fallback():
                    if invalid == "revoked":
                        env.revoke()
                    elif invalid == "expired":
                        env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                    env.llm_model.request_sync("ragas_sync_llm")
                env.after_ragas = fallback
                if invalid:
                    with self.assertRaises(self.api.Rejected):
                        asyncio.run(env.evaluate())
                    self.assertNotIn("ragas_sync_llm", env.headers)
                else:
                    asyncio.run(env.evaluate())
                    self.assertEqual(env.headers.count("ragas_sync_llm"), 1)

    def test_dispatch_async_embedding_also_uses_guarded_client(self):
        for revoked in (False, True):
            with self.subTest(revoked=revoked), EvaluationStubs(self) as env:
                async def extra_embedding():
                    if revoked:
                        env.revoke()
                    await env.embedding_model.request("ragas_async_embedding")
                env.after_ragas = extra_embedding
                if revoked:
                    with self.assertRaises(self.api.Rejected):
                        asyncio.run(env.evaluate())
                    self.assertNotIn("ragas_async_embedding", env.headers)
                else:
                    asyncio.run(env.evaluate())
                    self.assertEqual(env.headers.count("ragas_async_embedding"), 1)

    def test_dispatch_sync_rechecks_after_connection_wait(self):
        for invalid in ("revoked", "expired"):
            with self.subTest(invalid=invalid), EvaluationStubs(self) as env:
                def waited(request):
                    if invalid == "revoked":
                        env.revoke()
                    else:
                        env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                env.before_headers = waited
                _, transport = env.transport()
                with self.assertRaises(self.api.Rejected):
                    transport.handle_request(env.request_sync("sync-after-connect"))
                self.assertEqual(env.headers, [])
                self.assertEqual(env.sent, [])

    def test_dispatch_sync_queued_request_rechecks_after_slot_wait(self):
        for invalid in ("revoked", "expired"):
            with self.subTest(invalid=invalid), EvaluationStubs(self) as env:
                occupied, queued, release = (threading.Event() for _ in range(3))
                _, transport = env.transport()
                original_slots = transport.slots
                class ObservedSlots:
                    def __enter__(self):
                        if threading.current_thread().name == "queued-dispatch":
                            queued.set()
                        return original_slots.__enter__()
                    def __exit__(self, *args):
                        return original_slots.__exit__(*args)
                transport.slots = ObservedSlots()
                def after_send(request):
                    occupied.set()
                    if not release.wait(2):
                        raise AssertionError("test did not release the sync response")
                env.after_send = after_send
                outcomes = {}
                def request(name):
                    try:
                        outcomes[name] = transport.handle_request(env.request_sync(name))
                    except BaseException as exc:
                        outcomes[name] = exc
                first = threading.Thread(target=request, args=("inflight",), daemon=True)
                second = threading.Thread(target=request, args=("queued",),
                                          name="queued-dispatch", daemon=True)
                first.start()
                try:
                    self.assertTrue(occupied.wait(2))
                    second.start()
                    self.assertTrue(queued.wait(2))
                    if invalid == "revoked":
                        env.revoke()
                    else:
                        env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                finally:
                    release.set()
                    first.join(2)
                    if second.ident is not None:
                        second.join(2)
                self.assertFalse(first.is_alive() or second.is_alive())
                self.assertNotIsInstance(outcomes["inflight"], BaseException)
                self.assertIsInstance(outcomes["queued"], self.api.Rejected)
                self.assertEqual([kind for kind, _ in env.sent], ["inflight"])
                self.assertNotIn("queued", env.headers)

    def test_dispatch_sync_rechecks_body_and_producer_waits(self):
        for invalid in ("revoked", "expired"):
            for phase in ("before_body", "before_first_chunk", "before_second_chunk"):
                with self.subTest(invalid=invalid, phase=phase), EvaluationStubs(self) as env:
                    def invalidate(*args):
                        if invalid == "revoked":
                            env.revoke()
                        else:
                            env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                    if phase == "before_body":
                        env.before_body = invalidate
                    else:
                        target = 0 if phase == "before_first_chunk" else 1
                        def producer(kind, index):
                            if index == target:
                                invalidate()
                        env.before_chunk = producer
                    _, transport = env.transport()
                    with self.assertRaises(self.api.Rejected):
                        transport.handle_request(env.request_sync(
                            "sync-body", (b"first", b"second")))
                    expected = [("sync-body", b"first")] if phase == "before_second_chunk" else []
                    self.assertEqual(env.sent, expected)

    def test_dispatch_sync_sdk_retry_rechecks_revocation_and_expiry(self):
        for path in ("ragas_embedding", "ragas_sync_llm"):
            for invalid in ("revoked", "expired"):
                with self.subTest(path=path, invalid=invalid), EvaluationStubs(self) as env:
                    if path == "ragas_sync_llm":
                        env.after_ragas = lambda: env.llm_model.request_sync(path)
                    def sent(request):
                        env.status = 503 if request.kind == path else 200
                    def backoff(kind):
                        if kind == path:
                            if invalid == "revoked":
                                env.revoke()
                            else:
                                env.now = datetime(2026, 9, 20, tzinfo=timezone.utc)
                    env.after_send, env.before_retry = sent, backoff
                    with self.assertRaises(self.api.Rejected):
                        asyncio.run(env.evaluate())
                    self.assertIn(path, env.retry_calls)
                    self.assertEqual(env.headers.count(path), 1)
                    self.assertEqual(sum(kind == path for kind, _ in env.sent), 1)

    def test_dispatch_sync_missing_trace_cannot_release_body(self):
        with EvaluationStubs(self) as env:
            env.emit_trace = False
            _, transport = env.transport()
            with self.assertRaisesRegex(self.api.Rejected, "missing_httpcore_dispatch_hook"):
                transport.handle_request(env.request_sync("sync-no-trace"))
            self.assertEqual(env.sent, [])

    def test_dispatch_sync_budget_remains_available_with_three_async_inflight(self):
        with EvaluationStubs(self) as env:
            async def exercise():
                full, release = asyncio.Event(), asyncio.Event()
                active, peak = 0, 0
                async def hold_async_response():
                    nonlocal active
                    if active == 3:
                        full.set()
                    await release.wait()
                    active -= 1
                def after_send(request):
                    nonlocal active, peak
                    active += 1
                    peak = max(peak, active)
                    if request.kind.startswith("async-"):
                        return hold_async_response()
                    active -= 1
                env.after_send = after_send
                transport, sync = env.transport()
                tasks = [asyncio.create_task(transport.handle_async_request(
                    env.request(f"async-{i}"))) for i in range(3)]
                await asyncio.wait_for(full.wait(), 1)
                try:
                    # Deliberately synchronous on this event loop, matching Ragas.
                    response = sync.handle_request(env.request_sync("sync-embedding"))
                    self.assertEqual(response.status_code, 200)
                finally:
                    release.set()
                    await asyncio.gather(*tasks)
                self.assertEqual(peak, 4)
                self.assertEqual(active, 0)
                self.assertEqual(len(env.sent), 4)
            asyncio.run(exercise())

    def test_dispatch_denial_is_terminal_across_sync_and_async(self):
        for first in ("sync", "async"):
            with self.subTest(first=first), EvaluationStubs(self) as env:
                async_transport, sync_transport = env.transport()
                env.revoke()
                with self.assertRaises(self.api.Rejected):
                    if first == "sync":
                        sync_transport.handle_request(env.request_sync("denied-sync"))
                    else:
                        asyncio.run(async_transport.handle_async_request(env.request("denied-async")))
                env.write_policy(self.policy)
                with self.assertRaisesRegex(self.api.Rejected, "authorization_stopped"):
                    if first == "sync":
                        asyncio.run(async_transport.handle_async_request(env.request("later-async")))
                    else:
                        sync_transport.handle_request(env.request_sync("later-sync"))
                self.assertEqual(env.headers, [])
                self.assertEqual(env.sent, [])


    def test_dispatch_unverified_versions_fail_before_sdk_clients(self):
        for dependency in ("httpx", "core"):
            with self.subTest(dependency=dependency), EvaluationStubs(self) as env:
                getattr(env, dependency).__version__ = "unverified"
                with self.assertRaisesRegex(self.api.Rejected, "unverified_evaluation_transport_version"):
                    asyncio.run(env.evaluate())
                self.assertEqual(env.client_options, [])
                self.assertEqual(env.sent, [])


class KOTraceTests(_TraceContractMixin, unittest.TestCase):
    locale = "ko"


class ENTraceTests(_TraceContractMixin, unittest.TestCase):
    locale = "en"


if __name__ == "__main__":
    class CountingResult(unittest.TextTestResult):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.counts = {"ko": 0, "en": 0, "extraction_parity_network": 0}

        def startTest(self, case):
            self.counts[getattr(case, "locale", "extraction_parity_network")] += 1
            super().startTest(case)

    classes = (ExtractionTests, KOTraceTests, ENTraceTests)
    suite = unittest.TestSuite(
        unittest.defaultTestLoader.loadTestsFromTestCase(case) for case in classes
    )
    result = unittest.TextTestRunner(verbosity=2, resultclass=CountingResult).run(suite)
    print(json.dumps({
        "suite": "document_trace_materialization",
        "tests_run": result.testsRun,
        "cases_run": result.counts,
        "failures": len(result.failures), "errors": len(result.errors),
        "source_documents": {
            locale: {"path": str(path),
                     "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
            for locale, path in DOCUMENTS.items()
        },
        "limits": "Pure/stub contracts; Airflow is parsed only; no real Parquet codec, Ragas/OpenAI SDK stack, model or controller execution.",
    }, sort_keys=True))
    raise SystemExit(not result.wasSuccessful())
