#!/usr/bin/env python3
"""Run bounded fixture checks in task-owned Docker containers, then remove them."""

import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid

KIT = Path(__file__).resolve().parent
PYTHON = "python@sha256:9d2e5553305c7c7b0097999bb17187c69b921ccd6bc9d40e4bb5ebe652c00285"
K6 = "grafana/k6@sha256:9bd01d6941fca969cb61bb57d2da5ee9b385fe2aa8881df3798c196564d6ace6"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="new directory outside the repository")
    args = parser.parse_args()
    output = args.output.resolve()
    repository = KIT.parents[2]
    if output == repository or repository in output.parents:
        parser.error("write raw runs to a new directory outside the repository")
    output.mkdir(parents=True, exist_ok=False)
    output.chmod(0o777)
    token = "gateway-fixture-" + uuid.uuid4().hex[:12]
    label = "engineering-playbook.local-run=" + token
    commands = []
    resources = {"network": None, "backend": None}
    report = {"scope": "local-fixture", "gateway_api_conformance": False, "ranking": None,
              "started_at": datetime.now(timezone.utc).isoformat(), "run_label": label, "checks": []}

    def write(name, data):
        (output / name).write_text(json.dumps(data, indent=2) + "\n")

    def command(argv, name, expected=0, timeout=60):
        result = subprocess.run(argv, capture_output=True, text=True, timeout=timeout)
        (output / (name + ".stdout.txt")).write_text(result.stdout)
        (output / (name + ".stderr.txt")).write_text(result.stderr)
        commands.append({"name": name, "argv": argv, "exit_code": result.returncode})
        if expected is not None and result.returncode != expected:
            raise RuntimeError(f"{name}: exit {result.returncode}; see {name}.stderr.txt")
        return result

    def docker_run(image, name, *arguments):
        return ["docker", "run", "--rm", "--name", token + "-" + name, "--label", label,
                "--network", token, "--cpus", "1", "--memory", "512m", "--pids-limit", "64",
                "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
                "--user", "65534:65534", "-e", "PYTHONDONTWRITEBYTECODE=1",
                "--mount", f"type=bind,src={KIT},dst=/kit,readonly",
                "--mount", f"type=bind,src={output},dst=/results",
                image, *arguments]

    try:
        endpoint = (os.environ.get("DOCKER_HOST") if not os.environ.get("DOCKER_CONTEXT") else None) or command(
            ["docker", "context", "inspect", "--format", "{{.Endpoints.docker.Host}}"], "docker-endpoint").stdout.strip()
        if not endpoint.startswith("unix://"):
            raise RuntimeError("fixture execution requires a local Unix-socket Docker endpoint")
        report["docker_endpoint_transport"] = "unix"
        before = command(["docker", "ps", "-q", "--no-trunc"], "containers-before").stdout.split()
        report["preexisting_running_container_ids"] = before
        info = json.loads(command(["docker", "info", "--format",
                                   '{"server_version":"{{.ServerVersion}}","architecture":"{{.Architecture}}","cpus":{{.NCPU}},"memory_bytes":{{.MemTotal}}}'],
                                  "docker-info").stdout)
        report["docker"] = info
        if info["architecture"] not in ("aarch64", "arm64"):
            raise RuntimeError("these recorded fixture runs require an arm64 Docker engine")
        revision = command(["git", "-C", str(repository), "rev-parse", "HEAD"], "source-revision").stdout.strip()
        sut = {"backend_image": PYTHON, "command": ["python3", "/kit/fixture.py", "--bind", "0.0.0.0",
                                                   "--port", "8080", "--backend-id", "fixture-a"],
               "backend_cpus": 1, "backend_memory_bytes": 268435456,
               "generator_cpus": 1, "generator_memory_bytes": 536870912,
               "network": "internal", "network_alias": "fixture", "published_ports": [],
               "proxy": None, "controller": None}
        write("sut-config.json", sut)
        template = json.loads((KIT / "cases.fixture.json").read_text())
        template["provenance"].update(
            implementation_version="Python 3.13.15", generator_version="k6 v2.2.0",
            source_revision=revision,
            sut_config_sha256=hashlib.sha256((output / "sut-config.json").read_bytes()).hexdigest(),
            environment_notes=f"Internal Docker network, no published ports; backend 1 CPU/256 MiB; "
                              f"generator 1 CPU/512 MiB; Docker VM {info['cpus']} CPUs, "
                              f"{info['memory_bytes']} bytes RAM, shared with {len(before)} existing running containers.",
        )
        report["source_note"] = "source_revision is the repository baseline; harness_sha256 identifies the executed files."
        resources["network"] = token
        resources["network"] = command(["docker", "network", "create", "--internal", "--label", label, token],
                                       "network-create").stdout.strip()
        backend = ["docker", "run", "-d", "--name", token + "-backend", "--label", label,
                   "--network", token, "--network-alias", "fixture", "--cpus", "1", "--memory", "256m",
                   "--pids-limit", "64", "--read-only", "--cap-drop", "ALL", "--security-opt",
                   "no-new-privileges", "--user", "65534:65534", "-e", "PYTHONDONTWRITEBYTECODE=1",
                   "--mount", f"type=bind,src={KIT},dst=/kit,readonly", PYTHON, *sut["command"]]
        resources["backend"] = token + "-backend"
        resources["backend"] = command(backend, "backend-start").stdout.strip()
        # The bounded readiness request stays inside the fixture container.
        ready = """import time, urllib.request
for attempt in range(10):
    try:
        print(urllib.request.urlopen('http://127.0.0.1:8080/ready', timeout=2).read().decode())
        break
    except OSError:
        if attempt == 9:
            raise
        time.sleep(0.25)
"""
        command(["docker", "exec", resources["backend"], "python3", "-c", ready], "backend-ready")
        for image, name, version_args in ((PYTHON, "python-version", ["python3", "--version"]),
                                           (K6, "k6-version", ["version"])):
            command(docker_run(image, name, *version_args), name)

        def config(name, mutate=None):
            data = deepcopy(template)
            data["provenance"]["run_id"] = token + "-" + name
            if mutate:
                mutate(data)
            write(name + ".config.json", data)

        config("probe", lambda data: data["provenance"].update(
            generator_version="Python 3.13.15 http.client", generator_image=PYTHON))
        command(docker_run(PYTHON, "probe", "python3", "/kit/probe.py", "--config", "/results/probe.config.json",
                           "--output", "/results/probe.raw.json"), "probe")
        command([sys.executable, str(KIT / "results.py"), str(output / "probe.raw.json")], "probe-validated")
        report["checks"].append({"name": "probe", "expected": "valid", "passed": True})

        for name in ("load-1", "load-2", "load-3", "wrong-body", "dropped-arrivals", "override", "no-setup"):
            def mutate(data):
                if name == "wrong-body":
                    data["load"]["expected"]["body_contains"] = "this-response-must-not-match"
                if name == "dropped-arrivals":
                    data["load"].update(rate=20, duration_seconds=2, preallocated_vus=1, max_vus=1,
                                        timeout_ms=2000, grace_seconds=3,
                                        headers={"X-Fixture-Delay-Ms": "500"})
            config(name, mutate)
            cli = ["run", "--new-machine-readable-summary=false", "--summary-mode=full",
                   "-e", f"BENCHMARK_CONFIG=/results/{name}.config.json",
                   "-e", f"BENCHMARK_OUTPUT=/results/{name}.raw.json"]
            if name == "override":
                cli += ["--max-redirects", "1"]
            if name == "no-setup":
                cli += ["--no-setup", "--vus", "5"]
            cli += ["/kit/load.js"]
            execution = command(docker_run(K6, name, *cli), name, expected=None)
            negative = name in ("wrong-body", "dropped-arrivals", "override", "no-setup")
            raw = output / (name + ".raw.json")
            validation = command([sys.executable, str(KIT / "results.py"), str(raw)],
                                 name + "-validated", expected=None)
            passed = (execution.returncode != 0 and validation.returncode != 0) if negative else (
                execution.returncode == 0 and validation.returncode == 0)
            record = json.loads(raw.read_text()) if raw.exists() else {}
            metrics = record.get("raw", {}).get("metrics", {})
            def value(metric, field, default=0):
                return metrics.get(metric, {}).get("values", {}).get(field, default)
            observed = {"requests": value("http_reqs", "count"),
                        "dropped_arrivals": value("dropped_iterations", "count"),
                        "body_check_failures": value("bench_body_ok", "fails")}
            if negative:
                passed = passed and bool(record) and execution.returncode not in (125, 126, 127)
                if name == "wrong-body":
                    passed = passed and observed["requests"] > 0 and observed["body_check_failures"] > 0
                    passed = passed and all(value(metric, "rate") == 1 for metric in
                                            ("bench_status_ok", "bench_backend_ok", "bench_protocol_ok"))
                elif name == "dropped-arrivals":
                    passed = passed and observed["requests"] > 0 and observed["dropped_arrivals"] > 0
                else:
                    rejection = ("effective maxRedirects override is forbidden" if name == "override"
                                 else "validated setup data is required")
                    passed = passed and observed["requests"] == 0 and rejection in execution.stderr
            report["checks"].append({"name": name, "expected": "rejected" if negative else "valid",
                                     "execution_exit": execution.returncode,
                                     "validation_exit": validation.returncode,
                                     "observed": observed, "passed": bool(passed)})
            write("execution.json", report)
            if not passed:
                raise RuntimeError(f"{name}: unexpected execution/validation outcome")
        command([sys.executable, str(KIT / "results.py"),
                 *(str(output / f"load-{n}.raw.json") for n in range(1, 4))], "loads-validated")
        report["completed"] = True
    except Exception as error:
        report["completed"] = False
        report["error"] = str(error)
    finally:
        # Remove only names/IDs carrying this invocation's unique label.
        cleanup_errors = []
        owned = []
        try:
            owned = command(["docker", "ps", "-aq", "--no-trunc", "--filter", "label=" + label], "owned-containers").stdout.split()
        except Exception as error:
            cleanup_errors.append(str(error))
        for resource in owned:
            if resource != resources["backend"]:
                try:
                    removal = command(["docker", "container", "rm", "-f", resource],
                                      "transient-remove-" + resource, expected=None)
                    if removal.returncode and "No such container" not in removal.stderr:
                        raise RuntimeError(f"transient container cleanup failed: {resource}")
                except Exception as error:
                    cleanup_errors.append(str(error))
        for kind, resource in (("container", resources["backend"]), ("network", resources["network"])):
            if resource:
                try:
                    inspected = command(["docker", kind, "inspect", resource], kind + "-inspect", expected=None)
                    if inspected.returncode and ("No such" in inspected.stderr or "not found" in inspected.stderr):
                        continue
                    if inspected.returncode:
                        raise RuntimeError(f"{kind}: cannot inspect ownership during cleanup")
                    data = json.loads(inspected.stdout)[0]
                    labels = data.get("Config", {}).get("Labels", {}) if kind == "container" else data.get("Labels", {})
                    if labels.get("engineering-playbook.local-run") != token:
                        raise RuntimeError("resource ownership label mismatch")
                    command(["docker", kind, "rm", *(["-f"] if kind == "container" else []), resource], kind + "-remove")
                except Exception as error:
                    cleanup_errors.append(str(error))
        try:
            after = command(["docker", "ps", "-q", "--no-trunc"], "containers-after").stdout.split()
            report["preexisting_containers_still_running"] = set(report.get("preexisting_running_container_ids", [])) <= set(after)
        except Exception as error:
            report["preexisting_containers_still_running"] = None
            cleanup_errors.append(str(error))
        report["cleanup_errors"] = cleanup_errors
        report["finished_at"] = datetime.now(timezone.utc).isoformat()
        write("commands.json", commands)
        write("execution.json", report)
    print(json.dumps(report, indent=2))
    return 0 if report.get("completed") and not report["cleanup_errors"] and report["preexisting_containers_still_running"] else 1


if __name__ == "__main__":
    sys.exit(main())
