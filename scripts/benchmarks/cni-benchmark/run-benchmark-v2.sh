#!/bin/bash
set -euo pipefail

SCENARIO=${1:-"unknown"}
KUBE_CONTEXT=${KUBE_CONTEXT:-"yjeong-demo@cni-bench.ap-northeast-2.eksctl.io"}
RESULTS_DIR="$(dirname "$0")/results"
mkdir -p "$RESULTS_DIR"

echo "============================================"
echo "  CNI Benchmark v2: $SCENARIO"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================"

# Wait for core workloads
echo "[1/8] Waiting for workloads to be ready..."
kubectl wait --for=condition=ready pod -l app=iperf3-server -n bench --timeout=120s --context "$KUBE_CONTEXT"
kubectl wait --for=condition=ready pod -l app=iperf3-client -n bench --timeout=120s --context "$KUBE_CONTEXT"
kubectl wait --for=condition=ready pod -l app=fortio -n bench --timeout=120s --context "$KUBE_CONTEXT"

FORTIO=$(kubectl get pod -n bench -l app=fortio --context "$KUBE_CONTEXT" -o jsonpath='{.items[0].metadata.name}')
IPERF_CLIENT=$(kubectl get pod -n bench -l app=iperf3-client --context "$KUBE_CONTEXT" -o jsonpath='{.items[0].metadata.name}')
IPERF_SERVER_IP=$(kubectl get pod -n bench -l app=iperf3-server --context "$KUBE_CONTEXT" -o jsonpath='{.items[0].status.podIP}')
echo "  Fortio: $FORTIO"
echo "  iperf3 server IP: $IPERF_SERVER_IP"

# TCP Throughput
echo ""
echo "[2/8] TCP Throughput (iperf3, 30s, 8 streams)..."
TCP_RESULT=$(kubectl exec -n bench "$IPERF_CLIENT" --context "$KUBE_CONTEXT" -- iperf3 -c "$IPERF_SERVER_IP" -t 30 -P 8 -J 2>/dev/null)
TCP_GBPS=$(echo "$TCP_RESULT" | jq '.end.sum_received.bits_per_second / 1e9' 2>/dev/null || echo "0")
printf "  TCP Throughput: %.2f Gbps\n" "$TCP_GBPS"

# UDP Throughput
echo "[3/8] UDP Throughput (iperf3, 30s, target 10G)..."
UDP_RESULT=$(kubectl exec -n bench "$IPERF_CLIENT" --context "$KUBE_CONTEXT" -- iperf3 -c "$IPERF_SERVER_IP" -u -b 10G -t 30 -J 2>/dev/null)
UDP_GBPS=$(echo "$UDP_RESULT" | jq '.end.sum.bits_per_second / 1e9' 2>/dev/null || echo "0")
UDP_LOSS=$(echo "$UDP_RESULT" | jq '.end.sum.lost_percent' 2>/dev/null || echo "0")
printf "  UDP Throughput: %.2f Gbps (loss: %.2f%%)\n" "$UDP_GBPS" "$UDP_LOSS"

# Pod-to-Pod Latency
echo "[4/8] Pod-to-Pod Latency (iperf3 TCP, 1-byte, 10s)..."
RTT_RESULT=$(kubectl exec -n bench "$IPERF_CLIENT" --context "$KUBE_CONTEXT" -- iperf3 -c "$IPERF_SERVER_IP" -t 10 --length 1 -J 2>/dev/null)
MEAN_RTT=$(echo "$RTT_RESULT" | jq '.end.streams[0].sender.mean_rtt' 2>/dev/null || echo "0")
echo "  Mean RTT: ${MEAN_RTT} µs"

# HTTP Performance - httpbin (simple echo)
echo "[5/8] HTTP Performance - httpbin (Fortio, echo server)..."
for QPS in 1000 5000 0; do
  QPS_LABEL=$( [ "$QPS" = "0" ] && echo "max" || echo "$QPS" )
  echo "  Testing QPS=$QPS_LABEL..."
  HTTP_RAW=$(kubectl exec -n bench "$FORTIO" --context "$KUBE_CONTEXT" -- fortio load -qps "$QPS" -c 16 -t 30s http://httpbin.bench.svc.cluster.local/get 2>&1)
  ACTUAL_QPS=$(echo "$HTTP_RAW" | grep "All done" | awk '{print $NF}' | tr -d '[:space:]')
  P50=$(echo "$HTTP_RAW" | grep "target 50%" | head -1 | awk '{printf "%.2f", $3 * 1000}')
  P99=$(echo "$HTTP_RAW" | grep "target 99%" | head -1 | awk '{printf "%.2f", $3 * 1000}')
  echo "  QPS=$QPS_LABEL: actual=$ACTUAL_QPS p50=${P50}ms p99=${P99}ms"

  eval "HTTPBIN_QPS_${QPS_LABEL}_ACTUAL=$ACTUAL_QPS"
  eval "HTTPBIN_QPS_${QPS_LABEL}_P50=$P50"
  eval "HTTPBIN_QPS_${QPS_LABEL}_P99=$P99"
done

# HTTP Performance - Conduit API (real CRUD app)
echo "[6/8] HTTP Performance - Conduit API (Fortio, CRUD app)..."
CONDUIT_AVAILABLE=$(kubectl get svc conduit-api -n bench --context "$KUBE_CONTEXT" 2>/dev/null && echo "yes" || echo "no")
if [ "$CONDUIT_AVAILABLE" = "yes" ]; then
  for QPS in 1000 5000 0; do
    QPS_LABEL=$( [ "$QPS" = "0" ] && echo "max" || echo "$QPS" )
    echo "  Testing QPS=$QPS_LABEL (GET /articles)..."
    API_RAW=$(kubectl exec -n bench "$FORTIO" --context "$KUBE_CONTEXT" -- fortio load -qps "$QPS" -c 16 -t 30s http://conduit-api.bench.svc.cluster.local:3000/articles 2>&1)
    API_ACTUAL=$(echo "$API_RAW" | grep "All done" | awk '{print $NF}' | tr -d '[:space:]')
    API_P50=$(echo "$API_RAW" | grep "target 50%" | head -1 | awk '{printf "%.2f", $3 * 1000}')
    API_P99=$(echo "$API_RAW" | grep "target 99%" | head -1 | awk '{printf "%.2f", $3 * 1000}')
    echo "  QPS=$QPS_LABEL: actual=$API_ACTUAL p50=${API_P50}ms p99=${API_P99}ms"

    eval "API_QPS_${QPS_LABEL}_ACTUAL=$API_ACTUAL"
    eval "API_QPS_${QPS_LABEL}_P50=$API_P50"
    eval "API_QPS_${QPS_LABEL}_P99=$API_P99"
  done
else
  echo "  [SKIP] conduit-api service not found. Deploy with: kubectl apply -f realworld-app.yaml"
  API_QPS_1000_ACTUAL="N/A"; API_QPS_1000_P50="N/A"; API_QPS_1000_P99="N/A"
  API_QPS_5000_ACTUAL="N/A"; API_QPS_5000_P50="N/A"; API_QPS_5000_P99="N/A"
  API_QPS_max_ACTUAL="N/A"; API_QPS_max_P50="N/A"; API_QPS_max_P99="N/A"
fi

# DNS Resolution
echo "[7/8] DNS Resolution..."
DNS_RESULT=$(kubectl exec -n bench "$IPERF_CLIENT" --context "$KUBE_CONTEXT" -- \
  sh -c 'for i in $(seq 1 200); do
    START=$(date +%s%N)
    getent hosts httpbin.bench.svc.cluster.local > /dev/null 2>&1
    END=$(date +%s%N)
    echo $(( (END - START) / 1000000 ))
  done' 2>/dev/null | sort -n)
DNS_P50=$(echo "$DNS_RESULT" | awk -v n="$(echo "$DNS_RESULT" | wc -l)" 'NR==int(n*0.5){print}')
DNS_P99=$(echo "$DNS_RESULT" | awk -v n="$(echo "$DNS_RESULT" | wc -l)" 'NR==int(n*0.99){print}')
echo "  DNS p50: ${DNS_P50}ms  p99: ${DNS_P99}ms"

# Service Count & CNI Resources
echo "[8/8] Service Count & CNI Resources..."
SVC_COUNT=$(kubectl get svc -n bench --context "$KUBE_CONTEXT" --no-headers 2>/dev/null | wc -l | tr -d ' ')
echo "  Total services in namespace: $SVC_COUNT"
echo ""
echo "--- CNI Resource Usage ---"
kubectl top pods -n kube-system --context "$KUBE_CONTEXT" -l k8s-app=cilium 2>/dev/null || \
kubectl top pods -n kube-system --context "$KUBE_CONTEXT" -l app.kubernetes.io/name=aws-node 2>/dev/null || \
echo "  (kubectl top unavailable)"

# Save results JSON
RESULT_FILE="$RESULTS_DIR/${SCENARIO}.json"
cat > "$RESULT_FILE" <<JSONEOF
{
  "scenario": "$SCENARIO",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "cluster": "$KUBE_CONTEXT",
  "service_count": $SVC_COUNT,
  "network": {
    "tcp_throughput_gbps": $(printf "%.2f" "$TCP_GBPS"),
    "udp_throughput_gbps": $(printf "%.2f" "$UDP_GBPS"),
    "udp_loss_percent": $(printf "%.2f" "$UDP_LOSS"),
    "mean_rtt_us": $MEAN_RTT
  },
  "http_httpbin": {
    "qps_1000": { "actual_qps": ${HTTPBIN_QPS_1000_ACTUAL:-0}, "p50_ms": ${HTTPBIN_QPS_1000_P50:-0}, "p99_ms": ${HTTPBIN_QPS_1000_P99:-0} },
    "qps_5000": { "actual_qps": ${HTTPBIN_QPS_5000_ACTUAL:-0}, "p99_ms": ${HTTPBIN_QPS_5000_P99:-0} },
    "qps_max": { "actual_qps": ${HTTPBIN_QPS_max_ACTUAL:-0}, "p99_ms": ${HTTPBIN_QPS_max_P99:-0} }
  },
  "http_conduit": {
    "qps_1000": { "actual_qps": "${API_QPS_1000_ACTUAL:-N/A}", "p50_ms": "${API_QPS_1000_P50:-N/A}", "p99_ms": "${API_QPS_1000_P99:-N/A}" },
    "qps_5000": { "actual_qps": "${API_QPS_5000_ACTUAL:-N/A}", "p99_ms": "${API_QPS_5000_P99:-N/A}" },
    "qps_max": { "actual_qps": "${API_QPS_max_ACTUAL:-N/A}", "p99_ms": "${API_QPS_max_P99:-N/A}" }
  },
  "dns": {
    "p50_ms": ${DNS_P50:-0},
    "p99_ms": ${DNS_P99:-0}
  }
}
JSONEOF

echo ""
echo "============================================"
echo "  Results saved to: $RESULT_FILE"
echo "============================================"
