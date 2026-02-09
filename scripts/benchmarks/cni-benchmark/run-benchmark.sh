#!/usr/bin/env bash
set -euo pipefail

# CNI Performance Benchmark Runner
# Usage: ./run-benchmark.sh <scenario_name>
# Example: ./run-benchmark.sh scenario-a-vpccni

SCENARIO="${1:?Usage: $0 <scenario_name>}"
RESULTS_DIR="$(dirname "$0")/results"
RESULT_FILE="${RESULTS_DIR}/${SCENARIO}.json"
mkdir -p "$RESULTS_DIR"

echo "============================================"
echo "  CNI Benchmark: ${SCENARIO}"
echo "  $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "============================================"

# Wait for all pods to be ready
echo "[1/6] Waiting for workloads to be ready..."
kubectl wait --for=condition=ready pod -l app=iperf3-server -n bench --timeout=120s
kubectl wait --for=condition=ready pod -l app=iperf3-client -n bench --timeout=120s
kubectl wait --for=condition=ready pod -l app=httpbin -n bench --timeout=120s
kubectl wait --for=condition=ready pod -l app=fortio -n bench --timeout=120s

IPERF_SERVER_IP=$(kubectl get pod -n bench -l app=iperf3-server -o jsonpath='{.items[0].status.podIP}')
IPERF_CLIENT=$(kubectl get pod -n bench -l app=iperf3-client -o jsonpath='{.items[0].metadata.name}')
FORTIO_POD=$(kubectl get pod -n bench -l app=fortio -o jsonpath='{.items[0].metadata.name}')

echo "  iperf3 server IP: ${IPERF_SERVER_IP}"
echo ""

# --- Test 1: TCP Throughput ---
echo "[2/6] TCP Throughput (iperf3, 30s, 8 streams)..."
TCP_RESULT=$(kubectl exec -n bench "${IPERF_CLIENT}" -- \
  iperf3 -c "${IPERF_SERVER_IP}" -t 30 -P 8 -J 2>/dev/null)
TCP_GBPS=$(echo "$TCP_RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"{d['end']['sum_received']['bits_per_second'] / 1e9:.2f}\")
" 2>/dev/null || echo "N/A")
echo "  TCP Throughput: ${TCP_GBPS} Gbps"

# --- Test 2: UDP Throughput ---
echo "[3/6] UDP Throughput (iperf3, 30s, target 10G)..."
UDP_RESULT=$(kubectl exec -n bench "${IPERF_CLIENT}" -- \
  iperf3 -c "${IPERF_SERVER_IP}" -t 30 -u -b 10G -J 2>/dev/null)
UDP_GBPS=$(echo "$UDP_RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"{d['end']['sum']['bits_per_second'] / 1e9:.2f}\")
" 2>/dev/null || echo "N/A")
UDP_LOSS=$(echo "$UDP_RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"{d['end']['sum']['lost_percent']:.2f}\")
" 2>/dev/null || echo "N/A")
echo "  UDP Throughput: ${UDP_GBPS} Gbps (loss: ${UDP_LOSS}%)"

# --- Test 3: Latency (TCP_RR style via iperf3) ---
echo "[4/6] Pod-to-Pod Latency (iperf3 TCP, 1-byte, 10s)..."
# Use iperf3 with small payload to measure RTT-like latency
LAT_RESULT=$(kubectl exec -n bench "${IPERF_CLIENT}" -- \
  iperf3 -c "${IPERF_SERVER_IP}" -t 10 --length 1 -J 2>/dev/null)
LAT_US=$(echo "$LAT_RESULT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
# mean_rtt is in microseconds in iperf3 streams
streams = d['end']['streams']
if streams:
    sender = streams[0]['sender']
    mean_rtt = sender.get('mean_rtt', 0)
    print(f'{mean_rtt}')
else:
    print('N/A')
" 2>/dev/null || echo "N/A")
echo "  Mean RTT: ${LAT_US} µs"

# --- Test 4: HTTP Performance (Fortio) ---
echo "[5/6] HTTP Performance (Fortio → httpbin)..."

# QPS 1000
echo "  Testing QPS=1000..."
FORTIO_1K=$(kubectl exec -n bench "${FORTIO_POD}" -- \
  fortio load -qps 1000 -t 30s -c 32 -json - \
  http://httpbin.bench.svc.cluster.local/get 2>/dev/null)
HTTP_1K_QPS=$(echo "$FORTIO_1K" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f\"{d['ActualQPS']:.1f}\")
" 2>/dev/null || echo "N/A")
HTTP_1K_P50=$(echo "$FORTIO_1K" | python3 -c "
import sys, json
d = json.load(sys.stdin)
percs = d.get('DurationHistogram', {}).get('Percentiles', [])
p50 = next((p['Value'] for p in percs if p['Percentile'] == 50), 'N/A')
print(f'{float(p50)*1000:.2f}' if p50 != 'N/A' else 'N/A')
" 2>/dev/null || echo "N/A")
HTTP_1K_P99=$(echo "$FORTIO_1K" | python3 -c "
import sys, json
d = json.load(sys.stdin)
percs = d.get('DurationHistogram', {}).get('Percentiles', [])
p99 = next((p['Value'] for p in percs if p['Percentile'] == 99), 'N/A')
print(f'{float(p99)*1000:.2f}' if p99 != 'N/A' else 'N/A')
" 2>/dev/null || echo "N/A")
echo "  QPS=1000: actual=${HTTP_1K_QPS} p50=${HTTP_1K_P50}ms p99=${HTTP_1K_P99}ms"

# QPS 5000
echo "  Testing QPS=5000..."
FORTIO_5K=$(kubectl exec -n bench "${FORTIO_POD}" -- \
  fortio load -qps 5000 -t 30s -c 64 -json - \
  http://httpbin.bench.svc.cluster.local/get 2>/dev/null)
HTTP_5K_QPS=$(echo "$FORTIO_5K" | python3 -c "
import sys, json; d = json.load(sys.stdin); print(f\"{d['ActualQPS']:.1f}\")
" 2>/dev/null || echo "N/A")
HTTP_5K_P99=$(echo "$FORTIO_5K" | python3 -c "
import sys, json
d = json.load(sys.stdin)
percs = d.get('DurationHistogram', {}).get('Percentiles', [])
p99 = next((p['Value'] for p in percs if p['Percentile'] == 99), 'N/A')
print(f'{float(p99)*1000:.2f}' if p99 != 'N/A' else 'N/A')
" 2>/dev/null || echo "N/A")
echo "  QPS=5000: actual=${HTTP_5K_QPS} p99=${HTTP_5K_P99}ms"

# QPS max (uncapped)
echo "  Testing QPS=max..."
FORTIO_MAX=$(kubectl exec -n bench "${FORTIO_POD}" -- \
  fortio load -qps 0 -t 30s -c 64 -json - \
  http://httpbin.bench.svc.cluster.local/get 2>/dev/null)
HTTP_MAX_QPS=$(echo "$FORTIO_MAX" | python3 -c "
import sys, json; d = json.load(sys.stdin); print(f\"{d['ActualQPS']:.1f}\")
" 2>/dev/null || echo "N/A")
HTTP_MAX_P99=$(echo "$FORTIO_MAX" | python3 -c "
import sys, json
d = json.load(sys.stdin)
percs = d.get('DurationHistogram', {}).get('Percentiles', [])
p99 = next((p['Value'] for p in percs if p['Percentile'] == 99), 'N/A')
print(f'{float(p99)*1000:.2f}' if p99 != 'N/A' else 'N/A')
" 2>/dev/null || echo "N/A")
echo "  QPS=max: actual=${HTTP_MAX_QPS} p99=${HTTP_MAX_P99}ms"

# --- Test 5: DNS Resolution ---
echo "[6/6] DNS Resolution..."
DNS_RESULT=$(kubectl exec -n bench "${IPERF_CLIENT}" -- \
  sh -c 'for i in $(seq 1 200); do
    START=$(date +%s%N)
    getent hosts httpbin.bench.svc.cluster.local > /dev/null 2>&1
    END=$(date +%s%N)
    echo $(( (END - START) / 1000000 ))
  done' 2>/dev/null | sort -n)
DNS_P50=$(echo "$DNS_RESULT" | awk -v n="$(echo "$DNS_RESULT" | wc -l)" 'NR==int(n*0.50+0.5){print}' | head -1)
DNS_P99=$(echo "$DNS_RESULT" | awk -v n="$(echo "$DNS_RESULT" | wc -l)" 'NR==int(n*0.99+0.5){print}')
echo "  DNS p50: ${DNS_P50:-N/A}ms  p99: ${DNS_P99:-N/A}ms"

# --- Collect CNI resource usage ---
echo ""
echo "--- CNI Resource Usage ---"
kubectl top pods -n kube-system -l k8s-app=cilium 2>/dev/null || \
kubectl top pods -n kube-system -l k8s-app=aws-node 2>/dev/null || \
echo "  (metrics-server not available)"

# --- Write JSON results ---
cat > "${RESULT_FILE}" <<RESULT_EOF
{
  "scenario": "${SCENARIO}",
  "timestamp": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "cluster": "$(kubectl config current-context 2>/dev/null || echo 'unknown')",
  "network": {
    "tcp_throughput_gbps": ${TCP_GBPS:-0},
    "udp_throughput_gbps": ${UDP_GBPS:-0},
    "udp_loss_percent": ${UDP_LOSS:-0},
    "mean_rtt_us": ${LAT_US:-0}
  },
  "http": {
    "qps_1000": {
      "actual_qps": ${HTTP_1K_QPS:-0},
      "p50_ms": ${HTTP_1K_P50:-0},
      "p99_ms": ${HTTP_1K_P99:-0}
    },
    "qps_5000": {
      "actual_qps": ${HTTP_5K_QPS:-0},
      "p99_ms": ${HTTP_5K_P99:-0}
    },
    "qps_max": {
      "actual_qps": ${HTTP_MAX_QPS:-0},
      "p99_ms": ${HTTP_MAX_P99:-0}
    }
  },
  "dns": {
    "p50_ms": ${DNS_P50:-0},
    "p99_ms": ${DNS_P99:-0}
  }
}
RESULT_EOF

echo ""
echo "============================================"
echo "  Results saved to: ${RESULT_FILE}"
echo "============================================"
