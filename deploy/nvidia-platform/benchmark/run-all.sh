#!/usr/bin/env bash
set -euo pipefail

# Run all AIPerf benchmark modes sequentially
MODEL="${MODEL:-Qwen3-30B-A3B-FP8}"
CONCURRENCY_LIST="${CONCURRENCY:-1,2,4,8,16,32,64}"
ISL="${ISL:-1024}"
OSL="${OSL:-512}"
NAMESPACE="${NAMESPACE:-dynamo-system}"
TARGET="${TARGET:-}"

usage() {
  echo "Usage: run-all.sh [--model NAME] [--concurrency LIST] [--isl N] [--osl N] [--target URL]"
  echo ""
  echo "Options:"
  echo "  --model        Model name (default: Qwen3-30B-A3B-FP8)"
  echo "  --concurrency  Comma-separated concurrency levels (default: 1,2,4,8,16,32,64)"
  echo "  --isl          Input sequence length (default: 1024)"
  echo "  --osl          Output sequence length (default: 512)"
  echo "  --target       Target serving endpoint (auto-detected if omitted)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --model) MODEL="$2"; shift 2 ;;
    --concurrency) CONCURRENCY_LIST="$2"; shift 2 ;;
    --isl) ISL="$2"; shift 2 ;;
    --osl) OSL="$2"; shift 2 ;;
    --target) TARGET="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

echo "================================================"
echo "  AIPerf Benchmark Suite"
echo "  Model: ${MODEL}"
echo "  Concurrency: ${CONCURRENCY_LIST}"
echo "  ISL/OSL: ${ISL}/${OSL}"
echo "================================================"

# Apply each benchmark job with env overrides
for mode in sweep multi-turn seq-dist prefix-cache; do
  echo ""
  echo "==> [$(date +%H:%M:%S)] Starting: ${mode}"

  # Delete previous job if exists
  kubectl delete job "benchmark-${mode}" -n "${NAMESPACE}" --ignore-not-found

  # Apply with environment overrides
  kubectl apply -f "benchmark-${mode}.yaml"

  # Wait for completion
  kubectl wait --for=condition=complete "job/benchmark-${mode}" \
    -n "${NAMESPACE}" --timeout=30m || {
      echo "  WARN: ${mode} did not complete within timeout"
      kubectl logs "job/benchmark-${mode}" -n "${NAMESPACE}" --tail=20
    }

  echo "  [$(date +%H:%M:%S)] Completed: ${mode}"
done

echo ""
echo "================================================"
echo "  All benchmarks complete."
echo "  Use extract-results.sh to retrieve results."
echo "  Use pushgateway-push.sh to push to Grafana."
echo "================================================"
