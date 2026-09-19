"""Offline contracts extracted from current KO/EN registry documents.

Run from repository cwd, or pass --root to a proposed-document root.
Stdlib only; no artifact-directory dependencies or SDK/network execution.
"""
import sys
sys.dont_write_bytecode = True

import argparse
import ast
from contextlib import ExitStack, contextmanager
import copy
import hashlib
import io
import json
from pathlib import Path
import re
import socket
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

ROOT = Path.cwd()
SUFFIX = Path("aidlc/enterprise/agent-versioning/prompt-model-registry.md")
PATHS = {"ko": Path("docs") / SUFFIX,
         "en": Path("i18n/en/docusaurus-plugin-content-docs/current") / SUFFIX}
MODULES = ("registry_label_check", "bedrock_prompt_version", "bedrock_prompt_setup")
ARN = "arn:aws:bedrock:us-east-1:123456789012:prompt/ABCDEFGHIJ"
CREATE_TOKEN = "create-" + "a" * 40
VERSION_TOKEN = "snapshot-" + "b" * 40


def extract(text):
    found = {}
    opened, language, body = None, None, []
    for line in text.splitlines():
        if opened:
            if re.fullmatch(re.escape(opened[0]) + "{" + str(len(opened)) + r",}\s*", line):
                if language == "python":
                    code = "\n".join(body) + "\n"
                    ast.parse(code)
                    name = body[0][2:-3] if body and re.fullmatch(r"# [a-z_]+\.py", body[0]) else None
                    if name in MODULES:
                        if name in found:
                            raise ValueError("ambiguous named example")
                        found[name] = code
                opened, body = None, []
            else:
                body.append(line)
        else:
            match = re.fullmatch(r"(`{3,}|~{3,})([^`]*)", line)
            if match:
                opened, language = match[1], match[2].strip()
    if opened:
        raise ValueError("unclosed fence")
    if set(found) != set(MODULES):
        raise ValueError("missing named example")
    return found


@contextmanager
def no_network():
    original_socket = socket.socket
    def local_only(family=socket.AF_INET, *args, **kwargs):
        if family in (socket.AF_INET, socket.AF_INET6):
            raise AssertionError("network forbidden")
        return original_socket(family, *args, **kwargs)
    def forbidden(*args, **kwargs):
        raise AssertionError("network forbidden")
    with patch("socket.socket", side_effect=local_only), \
         patch("socket.create_connection", side_effect=forbidden), \
         patch("socket.getaddrinfo", side_effect=forbidden):
        yield


def load(source, stack):
    modules = {name: ModuleType(name) for name in MODULES}
    stack.enter_context(patch.dict(sys.modules, modules))
    for name in MODULES:
        tree = ast.parse(source[name])
        for node in tree.body:
            if isinstance(node, ast.Import):
                assert {alias.name for alias in node.names} <= {"re"}
            elif isinstance(node, ast.ImportFrom):
                assert node.module == "bedrock_prompt_version"
            else:
                assert isinstance(node, (ast.FunctionDef, ast.ClassDef))
        exec(compile(tree, name + ".py", "exec"), modules[name].__dict__)
    return SimpleNamespace(
        snapshot=modules["bedrock_prompt_version"].snapshot_prompt,
        setup=modules["bedrock_prompt_setup"].create_initial_prompt_version,
        confirm=modules["registry_label_check"].confirm_registry_target)


class Bedrock:
    def __init__(self, version="7"):
        self.calls = []
        self.version = version
        self.draft = {"arn": ARN, "id": "ABCDEFGHIJ", "version": "DRAFT"}
        self.response = {"arn": ARN + ":" + version, "id": "ABCDEFGHIJ", "version": version}
        self.fail_create = self.fail_version = False
    def create_prompt(self, **kwargs):
        self.calls.append(("CreatePrompt", copy.deepcopy(kwargs)))
        if self.fail_create:
            raise OSError("create unavailable")
        return copy.deepcopy(self.draft)
    def create_prompt_version(self, **kwargs):
        self.calls.append(("CreatePromptVersion", copy.deepcopy(kwargs)))
        if self.fail_version:
            raise OSError("snapshot unavailable")
        return copy.deepcopy(self.response)
    def __getattr__(self, name):
        raise AssertionError("unexpected SDK or deployment operation: " + name)


class Registry:
    def __init__(self):
        self.calls = []
        self.prompt = SimpleNamespace(name="financial-analysis", version=5, is_fallback=False)
        self.failure = False
    def get_prompt(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        if self.failure:
            raise OSError("registry unavailable")
        return self.prompt
    def __getattr__(self, name):
        raise AssertionError("unexpected registry mutation: " + name)


class ExtractionTests(unittest.TestCase):
    def original(self):
        return (ROOT / PATHS["ko"]).read_text()
    def test_locale_executable_parity(self):
        left, right = (extract((ROOT / PATHS[locale]).read_text()) for locale in ("ko", "en"))
        self.assertEqual({k: ast.dump(ast.parse(v)) for k, v in left.items()},
                         {k: ast.dump(ast.parse(v)) for k, v in right.items()})
    def test_missing_module_rejected(self):
        with self.assertRaisesRegex(ValueError, "missing"):
            extract(self.original().replace("# bedrock_prompt_setup.py", "# missing marker", 1))
    def test_duplicate_module_rejected(self):
        text = self.original()
        with self.assertRaisesRegex(ValueError, "ambiguous"):
            extract(text + "\n```python\n" + extract(text)["bedrock_prompt_setup"] + "```\n")
    def test_unclosed_fence_rejected(self):
        with self.assertRaisesRegex(ValueError, "unclosed"):
            extract(self.original() + "\n```python\n")
    def test_internet_and_dns_are_blocked(self):
        with no_network():
            for action in (
                lambda: socket.socket(socket.AF_INET), lambda: socket.socket(socket.AF_INET6),
                lambda: socket.getaddrinfo("fixture.invalid", 443),
                lambda: socket.create_connection(("fixture.invalid", 443)),
            ):
                with self.assertRaises(AssertionError):
                    action()


class ContractMixin:
    @classmethod
    def setUpClass(cls):
        cls.stack = ExitStack()
        cls.addClassCleanup(cls.stack.close)
        cls.stack.enter_context(no_network())
        cls.api = load(extract((ROOT / PATHS[cls.locale]).read_text()), cls.stack)

    def snapshot(self, client, **kwargs):
        return self.api.snapshot(client, kwargs.pop("prompt_arn", ARN),
                                 description=kwargs.pop("description", "Reviewed snapshot"),
                                 client_token=kwargs.pop("client_token", VERSION_TOKEN), **kwargs)

    def setup(self, client, **kwargs):
        values = dict(model_id="approved-model-id", prompt_text="Reviewed financial instruction",
                      create_token=CREATE_TOKEN, snapshot_token=VERSION_TOKEN)
        values.update(kwargs)
        return self.api.setup(client, **values)

    def test_snapshot_retains_actual_version_and_arn(self):
        for version in ("7", "37"):
            client = Bedrock(version)
            result = self.snapshot(client)
            self.assertEqual(result, {"prompt_id": "ABCDEFGHIJ", "version": version,
                                      "version_arn": ARN + ":" + version})
            self.assertEqual(client.calls, [("CreatePromptVersion", {
                "promptIdentifier": ARN, "description": "Reviewed snapshot",
                "clientToken": VERSION_TOKEN})])

    def test_bad_or_versioned_identifier_never_calls_sdk(self):
        for value in (None, True, "financial-analysis", ARN.replace("ABCDEFGHIJ", "fin-analysis"),
                      ARN + ":1", ARN.replace("arn:aws:", "arn:aws-cn:")):
            with self.subTest(value=value):
                client = Bedrock()
                with self.assertRaises(ValueError):
                    self.snapshot(client, prompt_arn=value)
                self.assertEqual(client.calls, [])

    def test_invalid_tokens_never_call_sdk(self):
        for value in (None, 1, "a" * 32, "a" * 257, "a" * 33 + "!", "-" + "a" * 33):
            client = Bedrock()
            with self.assertRaises(ValueError):
                self.snapshot(client, client_token=value)
            self.assertEqual(client.calls, [])

    def test_invalid_descriptions_never_call_sdk(self):
        for value in ("", "x" * 201, None, True):
            client = Bedrock()
            with self.assertRaises(ValueError):
                self.snapshot(client, description=value)
            self.assertEqual(client.calls, [])

    def test_unversioned_or_mismatched_response_is_not_candidate(self):
        mutations = [
            {"arn": ARN}, {"arn": ARN + ":9"}, {"id": "KLMNOPQRST"},
            {"arn": ARN.replace("us-east-1", "us-west-2") + ":7"},
            {"arn": ARN.replace("123456789012", "210987654321") + ":7"},
        ]
        for change in mutations:
            client = Bedrock()
            client.response.update(change)
            with self.assertRaisesRegex(ValueError, "unexpected_prompt_version"):
                self.snapshot(client)

    def test_invalid_version_types_and_draft_are_rejected(self):
        for value in (None, True, 7, "DRAFT", "0", "-1", "1.0", "100000"):
            client = Bedrock()
            client.response["version"] = value
            with self.assertRaises(ValueError):
                self.snapshot(client)

    def test_snapshot_failure_is_not_reported_as_success(self):
        client = Bedrock()
        client.fail_version = True
        with self.assertRaises(OSError):
            self.snapshot(client)
        self.assertEqual([name for name, _ in client.calls], ["CreatePromptVersion"])

    def test_retry_preserves_callers_request_identity(self):
        client = Bedrock()
        first, second = self.snapshot(client), self.snapshot(client)
        self.assertEqual(first, second)
        self.assertEqual(client.calls[0], client.calls[1])
        # Two mock calls prove input reuse, not service-side exactly-once behavior.

    def test_setup_binds_default_variant_model_and_inference(self):
        client = Bedrock("37")
        result = self.setup(client)
        self.assertEqual(result["version_arn"], ARN + ":37")
        self.assertEqual([name for name, _ in client.calls], ["CreatePrompt", "CreatePromptVersion"])
        request = client.calls[0][1]
        variant = request["variants"][0]
        self.assertEqual(request["defaultVariant"], variant["name"])
        self.assertEqual(variant["modelId"], "approved-model-id")
        self.assertEqual(variant["templateType"], "TEXT")
        self.assertEqual(variant["templateConfiguration"]["text"]["text"],
                         "Reviewed financial instruction")
        self.assertEqual(variant["inferenceConfiguration"],
                         {"text": {"temperature": 0.2, "maxTokens": 1024}})
        self.assertEqual(request["clientToken"], CREATE_TOKEN)
        self.assertEqual(client.calls[1][1]["clientToken"], VERSION_TOKEN)

    def test_setup_validates_required_inputs_before_create(self):
        for change in ({"model_id": ""}, {"model_id": None}, {"prompt_text": ""},
                       {"prompt_text": []}, {"create_token": "short"},
                       {"snapshot_token": "short"}):
            client = Bedrock()
            with self.assertRaises(ValueError):
                self.setup(client, **change)
            self.assertEqual(client.calls, [])

    def test_setup_create_failure_does_not_request_snapshot(self):
        client = Bedrock()
        client.fail_create = True
        with self.assertRaises(OSError):
            self.setup(client)
        self.assertEqual([name for name, _ in client.calls], ["CreatePrompt"])

    def test_setup_snapshot_failure_leaves_partial_creation_visible(self):
        client = Bedrock()
        client.fail_version = True
        with self.assertRaises(OSError):
            self.setup(client)
        self.assertEqual([name for name, _ in client.calls], ["CreatePrompt", "CreatePromptVersion"])

    def test_bad_created_arn_never_calls_snapshot(self):
        client = Bedrock()
        client.draft["arn"] = ARN.replace("ABCDEFGHIJ", "financial-analysis")
        with self.assertRaises(ValueError):
            self.setup(client)
        self.assertEqual(len(client.calls), 1)

    def test_registry_confirmation_does_not_claim_traffic_recovery(self):
        client = Registry()
        result = self.api.confirm(client, prompt_name="financial-analysis", expected_version=5)
        self.assertEqual(result, {"prompt_name": "financial-analysis", "registry_version": 5,
                                  "traffic_recovery_verified": False})
        self.assertEqual(client.calls, [(("financial-analysis",), {
            "label": "production", "cache_ttl_seconds": 0, "fallback": None})])

    def test_registry_wrong_identity_version_and_fallback_rejected(self):
        for change in ({"name": "other"}, {"version": 6}, {"version": True},
                       {"version": "5"}, {"is_fallback": True}):
            client = Registry()
            for name, value in change.items():
                setattr(client.prompt, name, value)
            with self.assertRaises(ValueError):
                self.api.confirm(client, prompt_name="financial-analysis", expected_version=5)

    def test_registry_invalid_expectation_never_calls_client(self):
        for value in (None, True, 0, -1, "5", 5.0):
            client = Registry()
            with self.assertRaises(ValueError):
                self.api.confirm(client, prompt_name="financial-analysis", expected_version=value)
            self.assertEqual(client.calls, [])
        client = Registry()
        with self.assertRaises(ValueError):
            self.api.confirm(client, prompt_name="", expected_version=5)
        self.assertEqual(client.calls, [])

    def test_registry_unavailable_does_not_pass(self):
        client = Registry()
        client.failure = True
        with self.assertRaises(OSError):
            self.api.confirm(client, prompt_name="financial-analysis", expected_version=5)


class KOTests(ContractMixin, unittest.TestCase):
    locale = "ko"


class ENTests(ContractMixin, unittest.TestCase):
    locale = "en"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    ROOT = parser.parse_args().root
    suite = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(cls)
                               for cls in (ExtractionTests, KOTests, ENTests))
    output = io.StringIO()
    result = unittest.TextTestRunner(stream=output, verbosity=2).run(suite)
    print(json.dumps({
        "suite": "aidlc_registry_examples", "tests_run": result.testsRun,
        "failures": len(result.failures), "errors": len(result.errors),
        "sources": {locale: {"path": str(path),
                            "sha256": hashlib.sha256((ROOT / path).read_bytes()).hexdigest()}
                    for locale, path in PATHS.items()},
        "limits": "Extracted document helpers and in-memory API mocks; no cloud, SDK compatibility, cache propagation timing, deployment recovery or legal compliance acceptance.",
        **({"failure_details": output.getvalue()} if not result.wasSuccessful() else {}),
    }, sort_keys=True))
    raise SystemExit(not result.wasSuccessful())
