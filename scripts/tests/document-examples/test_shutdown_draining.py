"""Execute exact document code with fake psycopg/signal and Event-controlled workers."""
import argparse
import ast
import builtins
import contextlib
import hashlib
import json
from pathlib import Path
import re
import threading
import types
import unittest

DOCS = {
    "ko": "docs/eks-best-practices/operations-reliability/pod-lifecycle/shutdown-draining.md",
    "en": "i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/operations-reliability/pod-lifecycle/shutdown-draining.md",
}
WATCHDOG = 3  # Deadlock watchdog only; test sequencing uses Events, never sleeps.
OPTIONS = None
SOURCES = {}


def extract(root, locale, repo_layout):
    filename = root / (DOCS[locale] if repo_layout else f"{locale}.md")
    text = filename.read_text()
    lines = text.splitlines()
    headings = []
    fenced = False
    for index, line in enumerate(lines):
        if line.startswith("```"):
            fenced = not fenced
        elif not fenced and re.match(r"^#{1,6}\s", line):
            headings.append((index, line))
    assert not fenced, f"{filename}: unclosed fence"
    matches = [(index, line) for index, line in headings
               if "{#데이터베이스-연결-풀-정리}" in line]
    assert len(matches) == 1, f"{filename}: expected exactly one database section"
    start = matches[0][0]
    end = next((index for index, _ in headings if index > start), len(lines))
    blocks = list(re.finditer(r"^```([^\n]*)\n(.*?)^```[ \t]*$", "\n".join(lines[start + 1:end]),
                              re.M | re.S))
    assert len(blocks) == 1, f"{filename}: database section must have exactly one code block"
    assert blocks[0][1].strip() == "python", f"{filename}: unexpected code language"
    code = blocks[0][2]
    assert code.strip(), f"{filename}: empty Python block"
    ast.parse(code, filename=str(filename))
    print("EXTRACTION " + json.dumps({
        "locale": locale, "document": DOCS[locale], "actual_file": str(filename),
        "source_sha256": hashlib.sha256(text.encode()).hexdigest(),
        "code_sha256": hashlib.sha256(code.encode()).hexdigest(),
        "section_lines": [start + 1, end], "mutation": OPTIONS.mutation or None,
    }), flush=True)
    return code


def replace_once(code, old, new):
    assert code.count(old) == 1, f"Mutation site missing/ambiguous: {old!r}"
    return code.replace(old, new)


def mutate(code):
    mutation = OPTIONS.mutation
    if mutation in ("", "premature-pool-close"):
        return code
    if mutation == "early-closeall":
        return replace_once(code, "    global draining, pool_closed",
                            "    global draining, pool_closed\n    db_pool.closeall()")
    if mutation == "admission-bypass":
        return replace_once(code, "        if draining:", "        if False:")
    if mutation == "timeout-success":
        return replace_once(code, '            raise TimeoutError("Active database work did not finish")',
                            "            return")
    if mutation == "return-error-count-leak":
        return replace_once(code, "        finally:\n            with state:",
                            "        except BaseException:\n            raise\n        else:\n            with state:")
    if mutation == "no-transaction-context":
        return replace_once(code, "        with conn:", "        if True:")
    raise AssertionError(f"Unknown mutation {mutation}")


class InjectedError(Exception):
    pass


class FakePoolClosed(Exception):
    pass


class FakeExit(Exception):
    pass


class Trace:
    def __init__(self):
        self.lock = threading.Lock()
        self.entries = []

    def add(self, event):
        with self.lock:
            self.entries.append(event)

    def get(self):
        with self.lock:
            return list(self.entries)


class ObservedCondition:
    """Delegate actual synchronization; expose predicate-false arrival for the test."""
    def __init__(self):
        self.condition = threading.Condition()
        self.wait_seen = threading.Event()
        self.wait_calls = 0

    def __enter__(self):
        self.condition.__enter__()
        return self

    def __exit__(self, *args):
        return self.condition.__exit__(*args)

    def wait_for(self, predicate, timeout=None):
        self.wait_calls += 1

        def observed():
            value = predicate()
            if not value:
                self.wait_seen.set()
            return value

        return self.condition.wait_for(observed, timeout)

    def notify_all(self):
        self.condition.notify_all()


class FakeCursor:
    def __init__(self, connection):
        self.connection = connection
        self.pool = connection.pool

    def __enter__(self):
        self.pool.trace.add("cursor-enter")
        return self

    def __exit__(self, *_):
        self.pool.trace.add("cursor-close")

    def execute(self, sql):
        assert sql == "SELECT * FROM users", "Unexpected SQL in extracted example"
        self.pool.trace.add("execute")
        if self.pool.hold_next_execute:
            self.pool.hold_next_execute = False
            self.pool.execute_entered.set()
            assert self.pool.release_execute.wait(WATCHDOG), "Fixture worker was not released"
        if self.connection.closed:
            raise FakePoolClosed("Connection was closed during active work")
        if self.pool.query_error:
            raise self.pool.query_error

    def fetchall(self):
        self.pool.trace.add("fetch")
        return [("fixture-row",)]


class FakeConnection:
    def __init__(self, pool):
        self.pool = pool
        self.closed = False

    def __enter__(self):
        if self.closed:
            raise FakePoolClosed("Closed connection")
        self.pool.trace.add("transaction-enter")
        return self

    def __exit__(self, error_type, *_):
        action = "rollback" if error_type else "commit"
        self.pool.trace.add(action)
        error = self.pool.rollback_error if error_type else self.pool.commit_error
        if error:
            raise error
        return False

    def cursor(self):
        return FakeCursor(self)


class FakePool:
    def __init__(self, namespace):
        self.namespace = namespace
        self.trace = Trace()
        self.borrowed = set()
        self.closed = False
        self.close_calls = 0
        self.checkout_calls = 0
        self.return_calls = 0
        self.active_at_return = []
        self.active_at_close = []
        self.borrowed_at_close = []
        self.hold_next_execute = False
        self.execute_entered = threading.Event()
        self.release_execute = threading.Event()
        self.checkout_error = self.return_error = self.query_error = None
        self.commit_error = self.rollback_error = None
        self.configuration = None

    def getconn(self):
        self.checkout_calls += 1
        self.trace.add("checkout")
        if self.checkout_error:
            raise self.checkout_error
        if self.closed:
            raise FakePoolClosed("Pool already closed")
        connection = FakeConnection(self)
        self.borrowed.add(connection)
        return connection

    def putconn(self, connection):
        self.return_calls += 1
        self.trace.add("return-start")
        self.active_at_return.append(self.namespace.get("active_transactions"))
        if self.return_error:
            raise self.return_error
        self.borrowed.remove(connection)
        self.trace.add("return-done")

    def closeall(self):
        # Like the documented API, this deliberately also closes borrowed connections.
        # Tests, not the double, detect premature closure.
        self.close_calls += 1
        self.trace.add("closeall")
        self.active_at_close.append(self.namespace.get("active_transactions"))
        self.borrowed_at_close.append(len(self.borrowed))
        for connection in self.borrowed:
            connection.closed = True
        self.closed = True


class Harness:
    def __init__(self, code):
        self.namespace = {"__name__": "extracted_database_example"}
        self.pool = FakePool(self.namespace)
        self.conditions = []
        self.handlers = {}
        self.exits = []
        self.imported = []

        def condition():
            value = ObservedCondition()
            self.conditions.append(value)
            return value

        def pool_factory(*args, **kwargs):
            self.pool.configuration = (args, kwargs)
            return self.pool

        def register(number, handler):
            assert number == 15, "Only the fake SIGTERM registration is allowed"
            assert number not in self.handlers, "Duplicate signal handler"
            self.handlers[number] = handler

        def forbidden(*_args, **_kwargs):
            raise AssertionError("Real I/O/dynamic evaluation is forbidden in extracted code")

        def fake_exit(code):
            self.exits.append(code)
            raise FakeExit(code)

        fake_pool_module = types.SimpleNamespace(
            ThreadedConnectionPool=pool_factory, SimpleConnectionPool=pool_factory)
        modules = {
            "os": types.SimpleNamespace(environ={"DATABASE_DSN": "inert-offline-fixture"}),
            "signal": types.SimpleNamespace(SIGTERM=15, signal=register),
            "threading": types.SimpleNamespace(Condition=condition),
            "contextlib": types.SimpleNamespace(contextmanager=contextlib.contextmanager),
            "psycopg2": types.SimpleNamespace(pool=fake_pool_module),
            "sys": types.SimpleNamespace(exit=fake_exit),
        }

        def fake_import(name, *_args, **_kwargs):
            assert name in modules, f"Import would escape the offline harness: {name}"
            self.imported.append(name)
            return modules[name]

        safe_builtins = dict(vars(builtins))
        safe_builtins.update(__import__=fake_import, open=forbidden, eval=forbidden, exec=forbidden)
        self.namespace["__builtins__"] = safe_builtins
        exec(compile(code, "extracted_database_example.py", "exec"), self.namespace)
        assert self.handlers.keys() == {15}, "Signal callback was not extracted/exercised"
        assert len(self.conditions) == 1, "Expected exactly one document-owned condition"
        self.condition = self.conditions[0]
        for name in ["transaction", "query_database", "close_pool_when_idle", "request_shutdown"]:
            assert callable(self.namespace.get(name)), f"Untested extraction: {name} missing"

    def query(self):
        return self.namespace["query_database"]()

    def close(self, timeout=0):
        return self.namespace["close_pool_when_idle"](timeout)

    def signal_callback(self):
        self.handlers[15](15, None)  # Direct callback only; no operating-system signal.


def spawn(callback):
    errors, results = [], []

    def run():
        try:
            results.append(callback())
        except BaseException as error:
            errors.append(error)

    worker = threading.Thread(target=run, daemon=True)
    worker.start()
    return worker, results, errors


class PoolCases(unittest.TestCase):
    locale = None

    def setUp(self):
        self.h = Harness(mutate(SOURCES[self.locale]))

    def wait(self, event):
        self.assertTrue(event.wait(WATCHDOG), "Event barrier was not reached")

    def join(self, worker):
        worker.join(WATCHDOG)
        self.assertFalse(worker.is_alive(), "Fixture worker did not finish")

    def test_commit_return_close_order(self):
        h = self.h
        self.assertEqual(h.query(), [("fixture-row",)])
        h.close()
        trace = h.pool.trace.get()
        self.assertIn("commit", trace, "Document transaction scope did not commit")
        self.assertLess(trace.index("cursor-close"), trace.index("commit"))
        self.assertLess(trace.index("commit"), trace.index("return-start"))
        self.assertLess(trace.index("return-done"), trace.index("closeall"))
        self.assertEqual(h.pool.active_at_return, [1])
        self.assertEqual(h.pool.active_at_close, [0])
        self.assertEqual(h.pool.borrowed_at_close, [0])

    def test_query_error_rolls_back_before_return(self):
        h = self.h
        error = InjectedError("query failure")
        h.pool.query_error = error
        with self.assertRaises(InjectedError) as caught:
            h.query()
        self.assertIs(caught.exception, error)
        trace = h.pool.trace.get()
        self.assertNotIn("commit", trace)
        self.assertLess(trace.index("rollback"), trace.index("return-start"))
        self.assertEqual(h.namespace["active_transactions"], 0)
        h.close()
        self.assertLess(h.pool.trace.get().index("return-done"), h.pool.trace.get().index("closeall"))

    def test_checkout_error_does_not_leak_count(self):
        h = self.h
        error = InjectedError("checkout failure")
        h.pool.checkout_error = error
        with self.assertRaises(InjectedError) as caught:
            h.query()
        self.assertIs(caught.exception, error)
        self.assertEqual(h.pool.return_calls, 0)
        self.assertEqual(h.namespace["active_transactions"], 0)

    def test_return_error_does_not_leak_count_or_suppress_error(self):
        h = self.h
        error = InjectedError("return failure")
        h.pool.return_error = error
        with self.assertRaises(InjectedError) as caught:
            h.query()
        self.assertIs(caught.exception, error)
        self.assertIn("commit", h.pool.trace.get())
        self.assertEqual(h.pool.return_calls, 1)
        self.assertEqual(h.namespace["active_transactions"], 0)
        self.assertEqual(h.pool.close_calls, 0)

    def test_commit_and_rollback_errors_remain_errors(self):
        for mode in ["commit", "rollback"]:
            with self.subTest(mode=mode):
                h = Harness(mutate(SOURCES[self.locale]))
                error = InjectedError(mode + " failure")
                setattr(h.pool, mode + "_error", error)
                if mode == "rollback":
                    h.pool.query_error = InjectedError("preceding query failure")
                with self.assertRaises(InjectedError) as caught:
                    h.query()
                self.assertIs(caught.exception, error)
                self.assertEqual(h.pool.return_calls, 1)
                self.assertEqual(h.namespace["active_transactions"], 0)

    def test_active_transaction_waits_for_commit_and_return(self):
        h = self.h
        h.pool.hold_next_execute = True
        worker, _, errors = spawn(h.query)
        cleanup = None
        try:
            self.wait(h.pool.execute_entered)
            cleanup, _, cleanup_errors = spawn(lambda: h.close(50))
            self.wait(h.condition.wait_seen)
            with h.namespace["state"]:
                self.assertTrue(h.namespace["draining"])
                self.assertEqual(h.namespace["active_transactions"], 1)
                self.assertEqual(h.pool.close_calls, 0)
                self.assertEqual(h.pool.return_calls, 0)
            with self.assertRaisesRegex(RuntimeError, "shutting down"):
                h.query()
            self.assertEqual(h.pool.checkout_calls, 1)
        finally:
            h.pool.release_execute.set()
            self.join(worker)
            if cleanup:
                self.join(cleanup)
        self.assertFalse(errors)
        self.assertFalse(cleanup_errors)
        self.assertEqual(h.pool.close_calls, 1)
        trace = h.pool.trace.get()
        self.assertLess(trace.index("commit"), trace.index("return-done"))
        self.assertLess(trace.index("return-done"), trace.index("closeall"))

    def test_timeout_keeps_pool_open_and_allows_later_cleanup(self):
        h = self.h
        h.pool.hold_next_execute = True
        worker, _, errors = spawn(h.query)
        try:
            self.wait(h.pool.execute_entered)
            with self.assertRaises(TimeoutError):
                h.close(0)  # Deterministic predicate-false timeout, no wall-clock sleep.
            self.assertTrue(h.namespace["draining"])
            self.assertFalse(h.pool.closed)
            self.assertEqual(h.pool.close_calls, 0)
            with self.assertRaisesRegex(RuntimeError, "shutting down"):
                h.query()
            self.assertEqual(h.pool.checkout_calls, 1)
        finally:
            h.pool.release_execute.set()
            self.join(worker)
        self.assertFalse(errors)
        h.close(0)
        self.assertEqual(h.pool.close_calls, 1)

    def test_admission_gate_and_repeated_cleanup(self):
        h = self.h
        h.close()
        h.close()
        with self.assertRaisesRegex(RuntimeError, "shutting down"):
            h.query()
        self.assertEqual(h.pool.close_calls, 1)
        self.assertEqual(h.pool.checkout_calls, 0)
        self.assertEqual(h.namespace["active_transactions"], 0)

    def test_signal_callback_only_requests_shutdown(self):
        h = self.h
        h.signal_callback()
        h.signal_callback()
        self.assertTrue(h.namespace["shutdown_requested"])
        self.assertFalse(h.namespace["draining"])
        self.assertEqual(h.pool.close_calls, 0)
        self.assertEqual(h.condition.wait_calls, 0)
        self.assertEqual(h.exits, [])

    def delayed_handler(self):
        """Caller fixture only: this lifetime controller is not supplied by the docs."""
        admitted = threading.Event()
        permit_later_db_call = threading.Event()

        def handler():
            admitted.set()
            assert permit_later_db_call.wait(WATCHDOG), "Delayed handler not released"
            return self.h.query()

        worker, results, errors = spawn(handler)
        self.wait(admitted)
        return worker, results, errors, permit_later_db_call

    def test_delayed_handler_lifetime_order(self):
        h = self.h
        worker, results, errors, release = self.delayed_handler()
        try:
            # The caller has stopped admission; an already-admitted handler remains.
            self.assertEqual(h.namespace["active_transactions"], 0)
            self.assertFalse(h.namespace["draining"])
            if OPTIONS.mutation == "premature-pool-close":
                h.close(0)  # Negative control: wrong caller ordering, source unchanged.
            release.set()
            self.join(worker)
            self.assertFalse(errors, f"Premature pool closure rejected a later DB call: {errors}")
            self.assertEqual(results, [[("fixture-row",)]])
            h.close(0)
            trace = h.pool.trace.get()
            self.assertLess(trace.index("return-done"), trace.index("closeall"))
        finally:
            release.set()
            self.join(worker)

    def test_premature_pool_close_rejects_existing_handlers_later_db_call(self):
        h = self.h
        worker, _, errors, release = self.delayed_handler()
        try:
            self.assertEqual(h.namespace["active_transactions"], 0)
            h.close(0)
            release.set()
            self.join(worker)
            self.assertEqual(len(errors), 1)
            self.assertIsInstance(errors[0], RuntimeError)
            self.assertIn("shutting down", str(errors[0]))
            self.assertEqual(h.pool.checkout_calls, 0)
        finally:
            release.set()
            self.join(worker)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--mutation", default="")
    parser.add_argument("--case", default="")
    OPTIONS = parser.parse_args()
    root = OPTIONS.root.resolve()
    repo_files = [(root / file).exists() for file in DOCS.values()]
    flat_files = [(root / f"{locale}.md").exists() for locale in DOCS]
    assert all(repo_files) or (not any(repo_files) and all(flat_files)), (
        "Root must have both canonical document paths or both locale snapshots; partial extraction is forbidden")
    for locale in DOCS:
        SOURCES[locale] = extract(root, locale, all(repo_files))
    suite = unittest.TestSuite()
    for locale in DOCS:
        case_class = type(f"PoolCases_{locale}", (PoolCases,), {"locale": locale})
        for method in unittest.defaultTestLoader.getTestCaseNames(case_class):
            if not OPTIONS.case or OPTIONS.case in method:
                suite.addTest(case_class(method))
    assert suite.countTestCases() > 0, f"No cases selected by {OPTIONS.case!r}"
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print("RESULT " + json.dumps({
        "tests": result.testsRun, "failures": len(result.failures), "errors": len(result.errors),
        "skipped": len(result.skipped), "mutation": OPTIONS.mutation or None,
        "limit": "Fake pool/cursor/connection and direct callback only; no PostgreSQL, real signal or infrastructure. Delayed-handler owner is a test fixture, not a production integration.",
    }), flush=True)
    raise SystemExit(0 if result.wasSuccessful() and result.testsRun and not result.skipped else 1)
