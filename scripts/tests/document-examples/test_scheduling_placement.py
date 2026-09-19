"""Exercise the actual KO/EN placement_report on in-memory snapshots only."""
import ast
import copy
import json
import os
from pathlib import Path
import re
import unittest

CATALOG = json.loads(Path(__file__).with_name("scheduling-locators.json").read_text())
ROOT = Path(os.environ.get("SCHEDULING_DOC_ROOT", Path.cwd()))


def extract(locale):
    locator = next(row for row in CATALOG["locators"] if row["key"] == "placement")
    filename = ROOT / CATALOG["documents"][locale]
    blocks, counts = [], {}
    heading, active = "", None
    for number, line in enumerate(filename.read_text().splitlines(), 1):
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if active:
            if (marker and marker[1][0] == active["marker"][0]
                    and len(marker[1]) >= len(active["marker"]) and not marker[2].strip()):
                blocks.append({**active, "code": "\n".join(active["lines"]) + "\n"})
                active = None
            else:
                active["lines"].append(line)
        elif marker:
            counts[heading] = counts.get(heading, 0) + 1
            active = {"heading": heading, "ordinal": counts[heading], "line": number,
                      "language": marker[2].strip(), "marker": marker[1], "lines": []}
        elif re.match(r"^#{1,6} ", line):
            heading = line
    assert active is None, "Unclosed Markdown fence"
    matches = [block for block in blocks if block["heading"] == locator["headings"][locale]
               and block["ordinal"] == locator["ordinal"]]
    assert len(matches) == 1, f"{locale}: missing or ambiguous placement fence"
    assert matches[0]["language"] == "python", f"{locale}: expected Python placement fence"
    return matches[0]["code"]


def pure_function(code):
    """Constrain execution to the reviewed dict/list transform before compiling."""
    tree = ast.parse(code)
    assert len(tree.body) == 1 and isinstance(tree.body[0], ast.FunctionDef)
    function = tree.body[0]
    assert function.name == "placement_report"
    assert [arg.arg for arg in function.args.args] == ["pod_list", "node_list"]
    assert not (function.decorator_list or function.args.defaults or function.args.kwonlyargs
                or function.args.vararg or function.args.kwarg or function.returns)
    allowed = {
        ast.Module, ast.FunctionDef, ast.arguments, ast.arg, ast.Expr, ast.Constant,
        ast.Assign, ast.DictComp, ast.ListComp, ast.comprehension, ast.Name,
        ast.Load, ast.Store, ast.Subscript, ast.For, ast.Return, ast.List, ast.Dict,
        ast.Call, ast.Attribute, ast.BoolOp, ast.Or, ast.And, ast.Compare, ast.Eq,
        ast.Is, ast.IsNot, ast.NotEq, ast.UnaryOp, ast.Not, ast.IfExp, ast.GeneratorExp,
    }
    assert sum(isinstance(node, ast.FunctionDef) for node in ast.walk(tree)) == 1
    for node in ast.walk(tree):
        assert type(node) in allowed, f"Unreviewed Python syntax: {type(node).__name__}"
        if isinstance(node, ast.Name):
            assert not node.id.startswith("__"), "Private/global access is not a pure transform"
        if isinstance(node, ast.Attribute):
            assert node.attr in {"get", "append"} and isinstance(node.ctx, ast.Load)
        if isinstance(node, ast.Call):
            assert not node.keywords
            assert ((isinstance(node.func, ast.Name) and node.func.id == "next")
                    or (isinstance(node.func, ast.Attribute) and node.func.attr in {"get", "append"}))
    namespace = {"__builtins__": {"next": next}}
    exec(compile(tree, "<reviewed-document-placement>", "exec"), namespace)
    return namespace["placement_report"]


def snapshot():
    pod = {
        "metadata": {"name": "app", "namespace": "test",
                     "ownerReferences": [{"kind": "ReplicaSet", "name": "rs"}]},
        "spec": {"nodeName": "n1", "nodeSelector": {"topology.kubernetes.io/zone": "requested-zone"}},
    }
    node = {
        "metadata": {"name": "n1", "labels": {"topology.kubernetes.io/zone": "actual-zone",
                     "karpenter.sh/nodepool": "observed-pool",
                     "eks.amazonaws.com/nodegroup": "observed-group"}},
        "spec": {"providerID": "aws:///actual-zone/i-fixture"},
        "status": {"conditions": [{"type": "Ready", "status": "True"},
                                   {"type": "MemoryPressure", "status": "False"}]},
    }
    return {"items": [pod]}, {"items": [node]}


def report(function, pods, nodes):
    before = copy.deepcopy((pods, nodes))
    rows = function(pods, nodes)
    assert (pods, nodes) == before, "The report must not mutate either input snapshot"
    assert isinstance(rows, list) and len(rows) == len(pods["items"]), "Do not drop unknown entries"
    return rows


def known_placement(function):
    pods, nodes = snapshot()
    row = report(function, pods, nodes)[0]
    assert row["zone"] == "actual-zone", "Requested selector is not observed placement"
    assert row["nodeReady"] == "True", "Ready must be found by type, not condition position"
    assert row["providerID"] == "aws:///actual-zone/i-fixture"
    assert row["placement"] == "node_found"
    return row


def mixed_placement(function):
    pods, nodes = snapshot()
    pods["items"].extend([
        {"metadata": {"name": "pending"}},  # No spec or nodeName.
        {"metadata": {"name": "vanished"}, "spec": {"nodeName": "missing-node"}},
    ])
    rows = report(function, pods, nodes)
    assert [row["pod"] for row in rows] == ["app", "pending", "vanished"]
    assert [row["placement"] for row in rows] == ["node_found", "unscheduled", "node_missing"]
    return rows


class SchedulingPlacementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.codes = {locale: extract(locale) for locale in ("ko", "en")}
        cls.functions = {locale: pure_function(code) for locale, code in cls.codes.items()}

    def test_01_observed_zone_and_ready_condition_identity(self):
        for locale, function in self.functions.items():
            with self.subTest(locale=locale):
                known_placement(function)

    def test_02_empty_and_unscheduled_snapshots_are_explicit(self):
        for locale, function in self.functions.items():
            with self.subTest(locale=locale):
                self.assertEqual(report(function, {"items": []}, {"items": []}), [])
                for spec in (None, {}, {"nodeName": ""}):
                    pod = {"metadata": {"name": "pending"}}
                    if spec is not None:
                        pod["spec"] = spec
                    row = report(function, {"items": [pod]}, {"items": []})[0]
                    self.assertEqual(row["placement"], "unscheduled")
                    self.assertIsNone(row["zone"])
                    self.assertEqual(row["nodeReady"], "Unknown")
                    self.assertEqual(row["namespace"], "default")
                    self.assertEqual(row["owners"], [])

    def test_03_missing_node_is_not_reported_as_ready_or_unscheduled(self):
        for locale, function in self.functions.items():
            with self.subTest(locale=locale):
                pods, _ = snapshot()
                row = report(function, pods, {"items": []})[0]
                self.assertEqual((row["node"], row["placement"]), ("n1", "node_missing"))
                self.assertEqual(row["nodeReady"], "Unknown")
                self.assertIsNone(row["zone"])
                self.assertIsNone(row["providerID"])

    def test_04_missing_zone_and_provider_remain_unknown(self):
        for locale, function in self.functions.items():
            with self.subTest(locale=locale):
                pods, nodes = snapshot()
                nodes["items"][0]["metadata"].pop("labels")
                nodes["items"][0].pop("spec")
                row = report(function, pods, nodes)[0]
                self.assertEqual(row["placement"], "node_found")
                self.assertIsNone(row["zone"])
                self.assertIsNone(row["providerID"])
                self.assertIsNone(row["nodepoolLabel"])
                self.assertIsNone(row["nodegroupLabel"])

    def test_05_false_missing_and_unknown_ready_are_not_success(self):
        for locale, function in self.functions.items():
            for status in ({"conditions": [{"type": "Ready", "status": "False"}]},
                           {"conditions": [{"type": "Ready", "status": "Unknown"}]},
                           {"conditions": [{"type": "Ready"}]}, {}, None):
                with self.subTest(locale=locale, status=status):
                    pods, nodes = snapshot()
                    if status is None:
                        nodes["items"][0].pop("status")
                    else:
                        nodes["items"][0]["status"] = status
                    row = report(function, pods, nodes)[0]
                    expected = "False" if status and status.get("conditions", [{}])[0].get("status") == "False" else "Unknown"
                    self.assertEqual(row["nodeReady"], expected)

    def test_06_mixed_entries_order_owners_and_observed_labels_are_preserved(self):
        for locale, function in self.functions.items():
            with self.subTest(locale=locale):
                rows = mixed_placement(function)
                self.assertEqual(rows[0]["owners"], [{"kind": "ReplicaSet", "name": "rs"}])
                self.assertEqual(rows[0]["nodepoolLabel"], "observed-pool")
                self.assertEqual(rows[0]["nodegroupLabel"], "observed-group")
                self.assertNotIn("ownerAutoscaler", rows[0])
                self.assertNotIn("ownershipConfirmed", rows[0])
                self.assertEqual(rows[2]["node"], "missing-node")

    def test_07_negative_controls_detect_wrong_join_ready_and_dropped_unknowns(self):
        for locale, code in self.codes.items():
            mutants = [
                ('labels.get("topology.kubernetes.io/zone")',
                 'pod["spec"]["nodeSelector"].get("topology.kubernetes.io/zone")', known_placement),
                ('c.get("type") == "Ready"', 'c.get("type") == "MemoryPressure"', known_placement),
                ('return result', 'return [row for row in result if row["placement"] == "node_found"]', mixed_placement),
            ]
            for before, after, oracle in mutants:
                with self.subTest(locale=locale, mutation=before):
                    self.assertEqual(code.count(before), 1, "Negative-control mutation site")
                    function = pure_function(code.replace(before, after))
                    with self.assertRaises(AssertionError):
                        oracle(function)

    def test_08_nonpure_code_is_rejected_before_execution(self):
        for code in [
            "import os\n",
            "def placement_report(pod_list, node_list):\n    return open('never-opened')\n",
            "def placement_report(pod_list, node_list):\n    return __import__('os')\n",
            "def placement_report(pod_list, node_list):\n    return pod_list.__class__\n",
        ]:
            with self.subTest(code=code):
                with self.assertRaises(AssertionError):
                    pure_function(code)


if __name__ == "__main__":
    unittest.main(verbosity=2)
