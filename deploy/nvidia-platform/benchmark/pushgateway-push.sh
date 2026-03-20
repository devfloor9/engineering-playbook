#!/usr/bin/env bash
set -euo pipefail

# Push AIPerf benchmark results to Prometheus Pushgateway
PUSHGATEWAY_URL="${PUSHGATEWAY_URL:-http://prometheus-pushgateway.monitoring:9091}"
RESULTS_DIR="${1:?Usage: pushgateway-push.sh <results-dir>}"
JOB_NAME="${2:-aiperf-benchmark}"

echo "==> Pushing results from ${RESULTS_DIR} to ${PUSHGATEWAY_URL}"

for result_file in "${RESULTS_DIR}"/**/results.json; do
  dir=$(dirname "${result_file}")
  mode=$(basename "$(dirname "${dir}")")
  variant=$(basename "${dir}")

  # Extract metrics from JSON
  model=$(jq -r '.model // "unknown"' "${result_file}")
  ttft_p50=$(jq -r '.ttft_p50 // 0' "${result_file}")
  ttft_p99=$(jq -r '.ttft_p99 // 0' "${result_file}")
  tps=$(jq -r '.throughput_tps // 0' "${result_file}")
  concurrency=$(jq -r '.concurrency // 0' "${result_file}")

  cat <<METRICS | curl --data-binary @- "${PUSHGATEWAY_URL}/metrics/job/${JOB_NAME}/mode/${mode}/variant/${variant}"
# TYPE benchmark_ttft_p50 gauge
benchmark_ttft_p50{model="${model}",mode="${mode}",concurrency="${concurrency}"} ${ttft_p50}
# TYPE benchmark_ttft_p99 gauge
benchmark_ttft_p99{model="${model}",mode="${mode}",concurrency="${concurrency}"} ${ttft_p99}
# TYPE benchmark_throughput_tps gauge
benchmark_throughput_tps{model="${model}",mode="${mode}",concurrency="${concurrency}"} ${tps}
METRICS

  echo "  Pushed: mode=${mode} variant=${variant}"
done

echo "==> Done."
