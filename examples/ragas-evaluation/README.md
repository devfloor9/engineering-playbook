# Ragas 0.4.3 evaluation example

This example uses Python 3.11 and the `ragas.metrics.collections` API throughout.
It explicitly configures an OpenAI evaluator LLM and native embeddings, supplies a
pipeline adapter, and rejects failed or non-finite scores at the quality gate.

From the repository root:

```bash
python3.11 -m venv /tmp/ragas-evaluation-venv
source /tmp/ragas-evaluation-venv/bin/activate
python -m pip install -r examples/ragas-evaluation/requirements.txt
cd examples/ragas-evaluation
python test_smoke.py
```

The requirements pin the complete environment verified on Python 3.11.14 on macOS.
In particular, Ragas 0.4.3 still imports VertexAI classes from
`langchain-community`; 0.4.2 removed an imported module, so this example pins the
verified 0.3.31 release even though the application uses native OpenAI providers.
Recheck the full import and scoring path when upgrading dependencies.

The smoke checks use dummy credentials and HTTPX's mock transport with sockets
blocked. They exercise all five actual collections metrics through the native
OpenAI and Instructor clients, plus adapter validation, failure aggregation,
quality gates, and cache invalidation. Synthetic scores test code paths only.
The same checks run on Python 3.11 in Linux CI. They do not measure RAG quality or
confirm live model access. Ragas 0.4.3 may emit an upstream `ResourceWarning` while reading its local
analytics identifier; telemetry is disabled for these checks.

## Run evaluation

Set `OPENAI_API_KEY` through your environment before executing the commands below.
The defaults are `gpt-4o-mini` and `text-embedding-3-small` at
`https://api.openai.com/v1`. Both models require access. The CLI requires `--live`
because evaluator calls are paid; the example does not bundle credentials.

```bash
# Evaluate two fixtures with four metrics; this does not benchmark your RAG system.
python ragas_eval.py --live --output results/basic.json

# Add answer correctness using the same evaluator LLM and embeddings.
python ragas_eval.py --live --comprehensive --output results/comprehensive.json
```

To evaluate your pipeline, supply a synchronous `pipeline(question: str) -> dict`
returning `response` and `retrieved_contexts`. `collect_samples(cases, pipeline)`
combines that output with `user_input` and `reference` from each test case.
References are never passed to the pipeline. `demo_pipeline` implements the
contract with deterministic documents to make the examples runnable without an
undefined chain. Replace both the fixtures and adapter for real evaluation.

Alternatively, save recorded pipeline outputs as a JSON array:

```json
[
  {
    "user_input": "Where is the release guide?",
    "response": "The release guide is in the engineering handbook.",
    "retrieved_contexts": [
      "The release guide is in the engineering handbook."
    ],
    "reference": "The release guide is in the engineering handbook."
  }
]
```

```bash
python ragas_eval.py --live --comprehensive --samples samples.json \
  --cache results/eval-cache.json --revision default-prompts-v1 \
  --output results/evaluation.json
```

Empty data, missing fields, and invalid context lists fail before evaluator
requests. Each metric exception or non-finite result becomes `null` plus an error
type in `rows`. If one sample fails, that metric's mean is also `null`; successful
rows cannot conceal it. Reports use strict JSON and include the evaluator
configuration. They also contain the input data, so treat them according to your
test dataset's sharing rules.

Exit code 0 means complete, finite scores passed the illustrative gates.
Exit code 1 means evaluation or gates failed. The CLI saves a report before
returning 1 for metric/gate failures; input or credential errors can fail before
any report exists. Missing `--live` or credentials return an argument error (2).
The four score thresholds are examples to calibrate against your own dataset;
answer correctness must be valid but has no separate threshold here.

Cache keys include all sample fields, metric names, provider/model configuration,
metric parameters, package versions, and a revision. Only successful complete
scores are reusable. Input order and duplicates are preserved. Change the
revision or clear the cache when model aliases, prompts, or metric settings
change. This is a single-process JSON cache without locking or expiration.
The example does not implement Kubernetes deployment, S3 storage, or workflow
installation.

## Primary sources

- [Ragas 0.4 migration guide](https://docs.ragas.io/en/stable/howtos/migrations/migrate_from_v03_to_v04/)
- [Ragas 0.4.3 collections implementation](https://github.com/vibrantlabsai/ragas/tree/v0.4.3/src/ragas/metrics/collections)
- [Ragas 0.4.3 LLM factory and import dependencies](https://github.com/vibrantlabsai/ragas/blob/v0.4.3/src/ragas/llms/base.py)
- [Ragas 0.4.3 native OpenAI embeddings](https://github.com/vibrantlabsai/ragas/blob/v0.4.3/src/ragas/embeddings/openai_provider.py)
