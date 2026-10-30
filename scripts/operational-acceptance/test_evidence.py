"""Fabricated local inputs test completeness gates, never live acceptance."""

from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("check_evidence", HERE / "check-evidence.py")
evidence = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(evidence)
NOW = datetime(2026, 10, 30, 20, 0, tzinfo=timezone.utc)


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(
            prefix="acceptance-unit-", dir=os.environ.get("KIROCREW_SCRATCH")
        )
        self.root = Path(self.directory.name).resolve()
        fixture = self.root / "unit-only.txt"
        fixture.write_text("Fabricated unit-test input. No deployment or approval.\n")
        self.reference = self.ref(fixture)

    def tearDown(self):
        self.directory.cleanup()

    def ref(self, path):
        return {"path": str(path.relative_to(self.root)),
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}

    def package(self, issue=80, ready=False):
        bundle = evidence.template(issue)
        bundle["environment"].update(target_alias="unit-test-target", region="unit-test-region",
                                     namespace="unit-test-only", deployment_manifest=self.reference.copy())
        bundle["authorization"].update(
            operator_role="fabricated unit-test role", rollback_owner_role="fabricated unit-test role",
            approved_at="2026-10-30T10:00:00Z", approval=self.reference.copy(),
            budget_limit=10, stop_threshold=8, cleanup_reserve=2,
        )
        bundle["protocol"].update(
            registered_at="2026-10-30T10:00:00Z", manifest=self.reference.copy(),
            minimum_samples=2, repetitions=2,
        )
        if ready:
            return bundle
        bundle["execution"].update(started_at="2026-10-30T11:00:00Z", finished_at="2026-10-30T12:00:00Z")
        for case in bundle["cases"]:
            case.update(status="pass", samples=2, repetitions=2, expected="unit-test only",
                        observed="unit-test only", raw=self.reference.copy())
        bundle["cost"].update(complete=True, report=self.reference.copy())
        bundle["operator_review"].update(
            accepted_at="2026-10-30T13:00:00Z", approver_roles=["fabricated unit-test role"],
            approval=self.reference.copy(),
        )
        return bundle

    def check(self, bundle, mode="evidence"):
        return evidence.validate(bundle, self.root, mode, now=NOW)

    def test_templates_are_blank_and_cannot_claim_acceptance(self):
        for issue in evidence.REQUIREMENTS:
            with self.subTest(issue=issue):
                bundle = evidence.template(issue)
                self.assertTrue(all(case["status"] == "not_run" for case in bundle["cases"]))
                with self.assertRaises(ValueError):
                    self.check(bundle)
                with self.assertRaises(ValueError):
                    self.check(bundle, "preflight")

    def test_complete_package_is_only_ready_for_review(self):
        for issue in (5, 7, 80):
            with self.subTest(issue=issue):
                result = self.check(self.package(issue))
                self.assertEqual(result["status"], "complete_for_operator_review")
                for field in ("authenticity_attested", "executes_requests", "closes_issue"):
                    self.assertIs(result[field], False)

    def test_preflight_requires_unexecuted_cases_and_approved_prerequisites(self):
        bundle = self.package(ready=True)
        self.assertEqual(self.check(bundle, "preflight")["status"], "ready_for_test_review")
        bundle["cases"][0]["status"] = "pass"
        with self.assertRaisesRegex(ValueError, "preflight"):
            self.check(bundle, "preflight")
        bundle = self.package(ready=True)
        bundle["authorization"]["approval"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "digest"):
            self.check(bundle, "preflight")

    def test_fixture_upstream_and_wrong_issue_scope_rejected(self):
        for scope in ("local-fixture", "upstream-reported", "unmeasured", "operator-deployment"):
            bundle = self.package()
            bundle["evidence_scope"] = scope
            with self.subTest(scope=scope), self.assertRaises(ValueError):
                self.check(bundle)

    def test_all_cases_required_once(self):
        for change in ("missing", "duplicate", "unknown"):
            bundle = self.package()
            if change == "missing":
                bundle["cases"].pop()
            elif change == "duplicate":
                bundle["cases"].append(deepcopy(bundle["cases"][0]))
            else:
                bundle["cases"][0]["id"] = "unrelated-case"
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, "exactly once"):
                self.check(bundle)

    def test_budget_bounds_and_invalid_numbers_rejected(self):
        for value in (True, 0, -1, float("nan"), float("inf"), "10"):
            bundle = self.package()
            bundle["authorization"]["budget_limit"] = value
            with self.subTest(value=value), self.assertRaises(ValueError):
                self.check(bundle)
        bundle = self.package()
        bundle["authorization"]["cleanup_reserve"] = 3
        with self.assertRaisesRegex(ValueError, "exceed budget"):
            self.check(bundle)

    def test_registered_sample_and_repetition_minimums_enforced(self):
        for key in ("samples", "repetitions"):
            for value in (None, True, 0, 1, 2.0, float("nan")):
                bundle = self.package()
                bundle["cases"][0][key] = value
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    self.check(bundle)

    def test_explicit_utc_and_chronological_approval_required(self):
        mutations = (
            ("authorization", "approved_at", "2026-10-30T10:00:00"),
            ("authorization", "approved_at", "2026-10-30T10:00:00+01:00"),
            ("authorization", "approved_at", "2026-10-31T10:00:00Z"),
            ("protocol", "registered_at", "2026-10-30T11:30:00Z"),
            ("execution", "finished_at", "2026-10-30T10:59:00Z"),
            ("operator_review", "accepted_at", "2026-10-30T11:59:00Z"),
            ("operator_review", "accepted_at", "2026-10-31T10:00:00Z"),
        )
        for section, key, value in mutations:
            bundle = self.package()
            bundle[section][key] = value
            with self.subTest(section=section, key=key, value=value), self.assertRaises(ValueError):
                self.check(bundle)

    def test_placeholder_missing_approval_and_incomplete_cost_rejected(self):
        for section, key, value in (
            ("environment", "target_alias", "REPLACE"),
            ("operator_review", "approver_roles", []),
            ("operator_review", "accepted_at", None),
            ("cost", "complete", False),
        ):
            bundle = self.package()
            bundle[section][key] = value
            with self.subTest(section=section, key=key), self.assertRaises(ValueError):
                self.check(bundle)
        for key in ("expected", "observed"):
            bundle = self.package()
            bundle["cases"][0][key] = ""
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.check(bundle)

    def test_unexecuted_failed_or_unsupported_required_cases_rejected(self):
        for status in ("not_run", "fail", "unsupported"):
            bundle = self.package()
            bundle["cases"][0].update(status=status, limitations=["unit-test only"])
            with self.subTest(status=status), self.assertRaises(ValueError):
                self.check(bundle)

    def test_optional_unsupported_requires_raw_evidence_and_limitation(self):
        bundle = self.package()
        case = next(case for case in bundle["cases"] if case["id"] == "grpc-streaming")
        case.update(status="unsupported", samples=None, repetitions=None)
        with self.assertRaises(ValueError):
            self.check(bundle)
        case["limitations"] = ["unit-test only: capability absent"]
        self.assertEqual(self.check(bundle)["status"], "complete_for_operator_review")
        case["raw"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "digest"):
            self.check(bundle)

    def test_artifact_missing_empty_changed_or_escaped_rejected(self):
        for name in ("missing.txt", "../unit-only.txt", str(self.root / "unit-only.txt")):
            bundle = self.package()
            bundle["cases"][0]["raw"]["path"] = name
            with self.subTest(path=name), self.assertRaises(ValueError):
                self.check(bundle)
        bundle = self.package()
        bundle["cases"][0]["raw"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.check(bundle)
        empty = self.root / "empty.txt"
        empty.touch()
        bundle["cases"][0]["raw"] = self.ref(empty)
        with self.assertRaisesRegex(ValueError, "1 byte"):
            self.check(bundle)

    def test_symlink_escape_rejected_before_read(self):
        outside = self.root.parent / (self.root.name + "-absent")
        link = self.root / "outside-link"
        link.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "outside evidence"):
            evidence.artifact({"path": link.name, "sha256": "0" * 64}, self.root, "raw")

    def test_umbrella_requires_valid_child_packages_not_issue_numbers(self):
        bundle = self.package(4)
        with self.assertRaisesRegex(ValueError, "issues 5 and 7"):
            self.check(bundle)
        for issue in (5, 7):
            path = self.root / f"issue-{issue}.json"
            path.write_text(json.dumps(self.package(issue)))
            bundle["dependencies"][str(issue)] = self.ref(path)
        self.assertEqual(self.check(bundle)["issue"], 4)
        child = self.package(7)
        child["cases"][0]["status"] = "not_run"
        path.write_text(json.dumps(child))
        bundle["dependencies"]["7"] = self.ref(path)
        with self.assertRaisesRegex(ValueError, "observed outcome"):
            self.check(bundle)

    def test_umbrella_wrong_issue_and_unexpected_dependencies_rejected(self):
        bundle = self.package(4)
        for issue in (5, 7):
            path = self.root / f"issue-{issue}.json"
            path.write_text(json.dumps(self.package(5)))
            bundle["dependencies"][str(issue)] = self.ref(path)
        with self.assertRaisesRegex(ValueError, "wrong issue"):
            self.check(bundle)
        bundle = self.package(5)
        bundle["dependencies"] = {"4": self.reference.copy()}
        with self.assertRaisesRegex(ValueError, "only issue 4"):
            self.check(bundle)

    def test_strict_json_rejects_duplicate_and_nonfinite_values(self):
        for value in ('{"issue": 5, "issue": 7}', '{"value": NaN}', '{"value": Infinity}'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                evidence.strict_json(value)

    def test_cli_prints_template_without_creating_files(self):
        before = set(self.root.iterdir())
        result = subprocess.run(
            [sys.executable, str(HERE / "check-evidence.py"), "--template", "80"],
            cwd=self.root, capture_output=True, text=True, timeout=10, check=True,
        )
        self.assertEqual(json.loads(result.stdout)["issue"], 80)
        self.assertEqual(set(self.root.iterdir()), before)
        path = self.root / "blank.json"
        path.write_text(result.stdout)
        result = subprocess.run(
            [sys.executable, str(HERE / "check-evidence.py"), str(path)],
            cwd=self.root, capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("evidence rejected:", result.stderr)


if __name__ == "__main__":
    unittest.main()
