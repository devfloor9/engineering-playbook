"""C036 document examples: stdlib, no network, no SDK/artifact dependency."""
import sys
sys.dont_write_bytecode = True

import argparse
import ast
from contextlib import contextmanager, redirect_stdout
import copy
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
PATHS = {
    "ko": Path("docs") / SUFFIX,
    "en": Path("i18n/en/docusaurus-plugin-content-docs/current") / SUFFIX,
}


def extract(text):
    """Reject missing/ambiguous examples and malformed fences."""
    found = {}
    opened, language, body = None, None, []
    for line in text.splitlines():
        if opened:
            if re.fullmatch(re.escape(opened[0]) + "{" + str(len(opened)) + r",}\s*", line):
                if language == "python":
                    source = "\n".join(body) + "\n"
                    tree = ast.parse(source)
                    names = []
                    if any(
                        isinstance(node, ast.Assign)
                        and any(isinstance(t, ast.Name) and t.id == "candidate" for t in node.targets)
                        and isinstance(node.value, ast.Call)
                        and isinstance(node.value.func, ast.Attribute)
                        and node.value.func.attr == "create_prompt"
                        for node in tree.body
                    ):
                        names.append("create")
                    if body and body[0] == "# langfuse_prompt_promotion.py":
                        names.append("promote")
                    for name in names:
                        if name in found:
                            raise ValueError("ambiguous example: " + name)
                        found[name] = source
                opened, body = None, []
            else:
                body.append(line)
        else:
            match = re.fullmatch(r"(`{3,}|~{3,})([^`]*)", line)
            if match:
                opened, language = match[1], match[2].strip()
    if opened:
        raise ValueError("unclosed fence")
    if set(found) != {"create", "promote"}:
        raise ValueError("missing example")
    return found


@contextmanager
def no_network():
    def forbidden(*args, **kwargs):
        raise AssertionError("network forbidden")
    with patch("socket.socket", side_effect=forbidden), \
         patch("socket.create_connection", side_effect=forbidden), \
         patch("socket.getaddrinfo", side_effect=forbidden):
        yield


def candidate(version=17, name="financial-analysis", **values):
    result = SimpleNamespace(
        name=name, version=version, is_fallback=False, prompt="candidate text"
    )
    for key, value in values.items():
        setattr(result, key, value)
    return result


class FakeClient:
    """Keyword-only signatures mirror the pinned SDK public methods."""
    def __init__(self, created=None):
        self.created = created if created is not None else candidate()
        self.calls = []
        self.create_error = None
        self.update_error = None
        self.updated = object()

    def get_prompt(self, name, *, label):
        self.calls.append(("get", {"name": name, "label": label}))
        return candidate(version=5, prompt="existing text")

    def create_prompt(self, *, name, prompt, labels):
        self.calls.append(("create", {"name": name, "prompt": prompt, "labels": labels}))
        if self.create_error:
            raise self.create_error
        return self.created

    def update_prompt(self, *, name, version, new_labels):
        self.calls.append(("update", {"name": name, "version": version, "new_labels": new_labels}))
        if self.update_error:
            raise self.update_error
        return self.updated


def run_create(source, client):
    sdk = ModuleType("langfuse")
    sdk.Langfuse = lambda: client
    namespace = {}
    with patch.dict(sys.modules, {"langfuse": sdk}), redirect_stdout(io.StringIO()):
        exec(compile(source, "<document-create>", "exec"), namespace)
    return namespace["candidate"]


def load_promotion(source):
    tree = ast.parse(source)
    if len(tree.body) != 1 or not isinstance(tree.body[0], ast.FunctionDef):
        raise ValueError("promotion must define exactly one function")
    if tree.body[0].name != "promote_evaluated_prompt":
        raise ValueError("missing promotion function")
    namespace = {}
    exec(compile(tree, "<document-promotion>", "exec"), namespace)
    return namespace["promote_evaluated_prompt"]


class LocaleChecks:
    locale = None

    def setUp(self):
        self.source = extract((ROOT / PATHS[self.locale]).read_text())
        self.promote = load_promotion(self.source["promote"])
        self.client = FakeClient()

    def approved(self, obj=None, **changes):
        kwargs = {
            "candidate": obj if obj is not None else self.client.created,
            "approved_name": "financial-analysis",
            "approved_version": 17,
        }
        kwargs.update(changes)
        return self.promote(self.client, **kwargs)

    def assert_rejected(self, obj=None, **changes):
        with self.assertRaises((ValueError, AttributeError)):
            self.approved(obj, **changes)
        self.assertFalse(any(name == "update" for name, _ in self.client.calls))

    def test_creation_keeps_exact_return_object(self):
        self.assertIs(run_create(self.source["create"], self.client), self.client.created)
        self.assertEqual(self.client.created.version, 17)

    def test_creation_staging_only_and_preserves_prompt(self):
        run_create(self.source["create"], self.client)
        self.assertEqual([name for name, _ in self.client.calls], ["get", "create"])
        request = self.client.calls[1][1]
        self.assertEqual(request["labels"], ["staging"])
        self.assertEqual(request["name"], "financial-analysis")
        self.assertEqual(request["prompt"], {
            "ko": "당신은 보수적 투자 자문가입니다...",
            "en": "You are a conservative investment advisor...",
        }[self.locale])

    def test_creation_failure_propagates_without_promotion(self):
        self.client.create_error = RuntimeError("create failed")
        with self.assertRaisesRegex(RuntimeError, "create failed"):
            run_create(self.source["create"], self.client)
        self.assertFalse(any(name == "update" for name, _ in self.client.calls))

    def test_actual_returned_version_survives_intervening_writer(self):
        obj = run_create(self.source["create"], self.client)
        self.client.created = candidate(version=18)
        result = self.approved(obj)
        self.assertIs(result, self.client.updated)
        self.assertEqual(self.client.calls[-1], ("update", {
            "name": "financial-analysis", "version": 17, "new_labels": ["production"]
        }))

    def test_version_six_is_not_assumed(self):
        self.assert_rejected(approved_version=6)

    def test_wrong_name_rejected(self):
        self.assert_rejected(approved_name="another-prompt")

    def test_missing_approval_arguments_cannot_mutate(self):
        with self.assertRaises(TypeError):
            self.promote(self.client, candidate=self.client.created)
        self.assertEqual(self.client.calls, [])

    def test_invalid_approval_name(self):
        for name in (None, "", "   ", 17, False):
            with self.subTest(name=name):
                self.assert_rejected(approved_name=name)

    def test_invalid_approval_version(self):
        for version in (None, 0, -1, True, False, "17", 17.0):
            with self.subTest(version=version):
                self.assert_rejected(approved_version=version)

    def test_invalid_candidate_version(self):
        for version in (None, 0, -1, True, "17", 17.0):
            with self.subTest(version=version):
                self.assert_rejected(candidate(version=version))

    def test_wrong_returned_candidate_name(self):
        self.assert_rejected(candidate(name="another-prompt"))

    def test_fallback_cannot_be_promoted(self):
        self.assert_rejected(candidate(is_fallback=True))

    def test_missing_candidate_fields_fail_before_update(self):
        for field in ("name", "version", "is_fallback"):
            obj = candidate()
            delattr(obj, field)
            with self.subTest(field=field):
                self.assert_rejected(obj)

    def test_update_failure_is_not_swallowed_or_retried(self):
        self.client.update_error = TimeoutError("response unavailable")
        with self.assertRaisesRegex(TimeoutError, "response unavailable"):
            self.approved()
        self.assertEqual(len(self.client.calls), 1)

    def test_promotion_does_not_refetch_mutable_label(self):
        self.approved()
        self.assertEqual([name for name, _ in self.client.calls], ["update"])

    def test_loading_helper_performs_no_api_calls(self):
        load_promotion(self.source["promote"])
        self.assertEqual(self.client.calls, [])


class KoreanTests(LocaleChecks, unittest.TestCase):
    locale = "ko"


class EnglishTests(LocaleChecks, unittest.TestCase):
    locale = "en"


class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.text = (ROOT / PATHS["en"]).read_text()

    def test_missing_example_fails(self):
        with self.assertRaisesRegex(ValueError, "missing"):
            extract("```python\nx = 1\n```\n")

    def test_ambiguous_creation_fails(self):
        source = extract(self.text)["create"]
        with self.assertRaisesRegex(ValueError, "ambiguous"):
            extract(self.text + "\n```python\n" + source + "```\n")

    def test_ambiguous_promotion_fails(self):
        source = extract(self.text)["promote"]
        with self.assertRaisesRegex(ValueError, "ambiguous"):
            extract(self.text + "\n```python\n" + source + "```\n")

    def test_unclosed_fence_fails(self):
        with self.assertRaisesRegex(ValueError, "unclosed"):
            extract(self.text + "\n```python\n")

    def test_locale_helper_ast_parity(self):
        sources = {locale: extract((ROOT / path).read_text()) for locale, path in PATHS.items()}
        self.assertEqual(
            ast.dump(ast.parse(sources["ko"]["promote"])),
            ast.dump(ast.parse(sources["en"]["promote"])),
        )

    def test_network_guard_active(self):
        with self.assertRaisesRegex(AssertionError, "network forbidden"):
            socket.create_connection(("127.0.0.1", 1))


def main():
    global ROOT
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path)
    args = parser.parse_args()
    if args.root:
        ROOT = args.root.resolve()
    elif not all((ROOT / rel).is_file() for rel in PATHS.values()):
        for parent in Path(__file__).resolve().parents:
            if all((parent / rel).is_file() for rel in PATHS.values()):
                ROOT = parent
                break
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    stream = io.StringIO()
    with no_network():
        result = unittest.TextTestRunner(stream=stream, verbosity=2).run(suite)
    print(json.dumps({
        "tests": result.testsRun,
        "failures": len(result.failures),
        "errors": len(result.errors),
        "status": "passed" if result.wasSuccessful() else "failed",
        "details": [] if result.wasSuccessful() else [
            text for _, text in result.failures + result.errors
        ],
    }))
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
