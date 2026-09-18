"""Ragas 0.4.3 collections examples with explicit evaluators and strict gates."""

import argparse
import asyncio
import hashlib
import json
import math
import os
from collections.abc import Callable
from importlib.metadata import version
from pathlib import Path

os.environ.setdefault("RAGAS_DO_NOT_TRACK", "true")

from openai import AsyncOpenAI
from ragas.embeddings import OpenAIEmbeddings
from ragas.llms import llm_factory
from ragas.metrics.collections import (
    AnswerCorrectness,
    AnswerRelevancy,
    ContextPrecision,
    ContextRecall,
    Faithfulness,
)


LLM_MODEL = "gpt-4o-mini"
EMBEDDING_MODEL = "text-embedding-3-small"
BASE_URL = "https://api.openai.com/v1"
METRIC_INPUTS = {
    "faithfulness": ("user_input", "response", "retrieved_contexts"),
    "answer_relevancy": ("user_input", "response"),
    "context_precision": ("user_input", "reference", "retrieved_contexts"),
    "context_recall": ("user_input", "retrieved_contexts", "reference"),
    "answer_correctness": ("user_input", "response", "reference"),
}
# Illustrative thresholds, not Ragas defaults or measured acceptance criteria.
QUALITY_GATES = {
    "faithfulness": 0.8,
    "answer_relevancy": 0.75,
    "context_precision": 0.7,
    "context_recall": 0.7,
}
CASES = [
    {
        "user_input": "Where is the release guide?",
        "reference": "The release guide is in the engineering handbook.",
    },
    {
        "user_input": "Who reviews a release?",
        "reference": "A release is reviewed by the service owner.",
    },
]
DEMO_DOCUMENTS = {
    "Where is the release guide?": "The release guide is in the engineering handbook.",
    "Who reviews a release?": "A release is reviewed by the service owner.",
}


def demo_pipeline(question: str) -> dict:
    """Return deterministic fixtures; this is not a production RAG system."""
    context = DEMO_DOCUMENTS[question]
    return {"response": context, "retrieved_contexts": [context]}


def validate_samples(samples: list[dict]) -> None:
    if not isinstance(samples, list) or not samples:
        raise ValueError("Provide a nonempty list of evaluation samples.")
    for sample in samples:
        if not isinstance(sample, dict):
            raise ValueError("Each sample must be an object.")
        for field in ("user_input", "response", "reference"):
            if not isinstance(sample.get(field), str) or not sample[field].strip():
                raise ValueError(f"Each sample requires nonempty {field}.")
        contexts = sample.get("retrieved_contexts")
        if not isinstance(contexts, list) or not contexts or any(
            not isinstance(text, str) or not text.strip() for text in contexts
        ):
            raise ValueError("retrieved_contexts must be a nonempty list of text.")


def collect_samples(cases: list[dict], pipeline: Callable[[str], dict]) -> list[dict]:
    """Adapt a synchronous pipeline without passing references to the generator."""
    samples = []
    for case in cases:
        output = pipeline(case["user_input"])
        samples.append({
            "user_input": case["user_input"],
            "reference": case["reference"],
            "response": output["response"],
            "retrieved_contexts": output["retrieved_contexts"],
        })
    validate_samples(samples)
    return samples


def make_metrics(client: AsyncOpenAI, comprehensive: bool = False) -> dict:
    llm = llm_factory(LLM_MODEL, provider="openai", client=client, temperature=0)
    embeddings = OpenAIEmbeddings(client=client, model=EMBEDDING_MODEL)
    metrics = {
        "faithfulness": Faithfulness(llm=llm),
        "answer_relevancy": AnswerRelevancy(
            llm=llm, embeddings=embeddings, strictness=3
        ),
        "context_precision": ContextPrecision(llm=llm),
        "context_recall": ContextRecall(llm=llm),
    }
    if comprehensive:
        metrics["answer_correctness"] = AnswerCorrectness(
            llm=llm, embeddings=embeddings, weights=[0.75, 0.25], beta=1.0
        )
    return metrics


def evaluator_config(metric_names, revision: str = "default-prompts-v1") -> dict:
    """Change revision whenever prompts, metric settings, or model snapshots change."""
    return {
        "packages": {
            name: version(name)
            for name in (
                "ragas", "openai", "instructor", "pydantic",
                "langchain-community", "langchain-core", "langchain-openai",
            )
        },
        "base_url": BASE_URL,
        "llm": LLM_MODEL,
        "embeddings": EMBEDDING_MODEL,
        "temperature": 0,
        "strictness": 3,
        "correctness_weights": [0.75, 0.25],
        "correctness_beta": 1.0,
        "metrics": list(metric_names),
        "revision": revision,
    }


def cache_key(sample: dict, config: dict) -> str:
    content = json.dumps(
        {"sample": sample, "evaluator": config},
        sort_keys=True, ensure_ascii=False, allow_nan=False,
    )
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def finite_score(value) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
    )


def valid_scores(scores, metric_names) -> bool:
    return (
        isinstance(scores, dict)
        and set(scores) == set(metric_names)
        and all(finite_score(score) for score in scores.values())
    )


async def score_samples(
    samples: list[dict], metrics: dict, cache: dict | None = None,
    revision: str = "default-prompts-v1",
) -> dict:
    validate_samples(samples)
    if not metrics or not set(metrics).issubset(METRIC_INPUTS):
        raise ValueError("Select known collections metrics.")
    config = evaluator_config(metrics, revision)
    rows = []
    for sample in samples:
        key = cache_key(sample, config)
        cached = cache.get(key) if cache is not None else None
        scores, errors = {}, {}
        if valid_scores(cached, metrics):
            scores = dict(cached)
        else:
            if cache is not None:
                cache.pop(key, None)
            for name, metric in metrics.items():
                try:
                    result = await metric.ascore(**{
                        field: sample[field] for field in METRIC_INPUTS[name]
                    })
                    if not finite_score(result.value):
                        raise ValueError("Metric returned a non-finite or nonnumeric score.")
                    scores[name] = float(result.value)
                except Exception as exc:
                    scores[name] = None
                    # Do not write provider responses or credentials into reports.
                    errors[name] = type(exc).__name__
            if cache is not None and not errors:
                cache[key] = dict(scores)
        rows.append({
            "sample": sample, "scores": scores, "errors": errors,
            "cached": valid_scores(cached, metrics),
        })
    summary = {}
    for name in metrics:
        values = [row["scores"][name] for row in rows]
        # Never hide failed samples by averaging only successful scores.
        summary[name] = (
            sum(values) / len(values) if all(map(finite_score, values)) else None
        )
    return {
        "config": config, "sample_count": len(samples), "metrics": summary,
        "failed_samples": sum(bool(row["errors"]) for row in rows), "rows": rows,
    }


def quality_failures(report: dict) -> list[str]:
    rows = report.get("rows")
    count = report.get("sample_count")
    if (
        not isinstance(rows, list) or not rows
        or type(count) is not int or count != len(rows)
    ):
        return ["Missing, empty, or incomplete evaluation rows."]
    names = report.get("config", {}).get("metrics", [])
    if not names or not set(QUALITY_GATES).issubset(names):
        return ["Required metrics are missing."]
    if any(
        not isinstance(row, dict) or row.get("errors") != {}
        or not valid_scores(row.get("scores"), names) for row in rows
    ):
        return ["At least one sample has missing or failed metric scores."]
    failures = []
    for name in names:
        aggregate = report.get("metrics", {}).get(name)
        actual = sum(row["scores"][name] for row in rows) / count
        if not finite_score(aggregate) or not math.isclose(aggregate, actual):
            failures.append(f"{name}: missing, non-finite, or inconsistent aggregate")
        elif name in QUALITY_GATES and actual < QUALITY_GATES[name]:
            failures.append(f"{name}: {actual:.3f} < {QUALITY_GATES[name]:.3f}")
    return failures


def save_json(path: Path, data: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n",
        encoding="utf-8",
    )


async def run(args) -> int:
    samples = (
        json.loads(args.samples.read_text(encoding="utf-8"))
        if args.samples else collect_samples(CASES, demo_pipeline)
    )
    validate_samples(samples)
    cache = None
    if args.cache:
        cache = (
            json.loads(args.cache.read_text(encoding="utf-8"))
            if args.cache.exists() else {}
        )
        if not isinstance(cache, dict):
            raise ValueError("The cache must be a JSON object.")
    async with AsyncOpenAI(
        api_key=os.environ["OPENAI_API_KEY"], base_url=BASE_URL,
        timeout=60, max_retries=0,
    ) as client:
        report = await score_samples(
            samples, make_metrics(client, args.comprehensive), cache, args.revision
        )
    save_json(args.output, report)
    if args.cache:
        save_json(args.cache, cache)
    failures = quality_failures(report)
    print(json.dumps({"metrics": report["metrics"], "failures": failures}, allow_nan=False))
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true", help="Allow paid evaluator API calls.")
    parser.add_argument("--comprehensive", action="store_true")
    parser.add_argument("--samples", type=Path, help="JSON array of recorded pipeline outputs.")
    parser.add_argument("--cache", type=Path)
    parser.add_argument("--revision", default="default-prompts-v1")
    parser.add_argument("--output", type=Path, default=Path("results/evaluation.json"))
    args = parser.parse_args()
    if not args.live:
        parser.error("Scoring requires --live; use test_smoke.py for offline checks.")
    if not os.environ.get("OPENAI_API_KEY", "").strip():
        parser.error("Set OPENAI_API_KEY before live evaluation.")
    return asyncio.run(run(args))


if __name__ == "__main__":
    raise SystemExit(main())
