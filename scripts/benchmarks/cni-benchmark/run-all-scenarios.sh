#!/usr/bin/env bash
set -euo pipefail

# Full CNI Benchmark Pipeline
# Creates cluster, runs all 5 scenarios, collects results
# Usage: ./run-all-scenarios.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REGION="ap-northeast-2"
CLUSTER_NAME="cni-bench"
HELM_CILIUM_VERSION="1.16.5"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

# ============================================================
# Step 1: Create EKS cluster (Scenario A: VPC CNI baseline)
# ============================================================
create_cluster() {
  log "Creating EKS cluster: ${CLUSTER_NAME}..."
  eksctl create cluster -f "${SCRIPT_DIR}/cluster.yaml"
  log "Cluster created. Deploying workloads..."
  kubectl apply -f "${SCRIPT_DIR}/workloads.yaml"
  sleep 30
  kubectl wait --for=condition=ready pod --all -n bench --timeout=180s
  log "Workloads ready."
}

# ============================================================
# Step 2: Run Scenario A - VPC CNI (default)
# ============================================================
run_scenario_a() {
  log "=== SCENARIO A: VPC CNI + kube-proxy (baseline) ==="
  bash "${SCRIPT_DIR}/run-benchmark.sh" "scenario-a-vpccni"
}

# ============================================================
# Step 3: Switch to Cilium + kube-proxy (Scenario B)
# ============================================================
run_scenario_b() {
  log "=== SCENARIO B: Cilium + kube-proxy ==="
  log "Removing VPC CNI..."
  kubectl delete daemonset -n kube-system aws-node --ignore-not-found

  log "Installing Cilium (kube-proxy retained)..."
  helm repo add cilium https://helm.cilium.io/ 2>/dev/null || true
  helm repo update cilium
  helm install cilium cilium/cilium --version "${HELM_CILIUM_VERSION}" \
    --namespace kube-system \
    --set kubeProxyReplacement=false \
    --set cni.exclusive=true \
    --set ipam.mode=cluster-pool \
    --set ipam.operator.clusterPoolIPv4PodCIDRList="{10.244.0.0/16}" \
    --set routingMode=tunnel \
    --set tunnelProtocol=vxlan \
    --set hubble.enabled=false \
    --set operator.replicas=1 \
    --wait --timeout=300s

  log "Restarting workloads..."
  kubectl rollout restart -n bench deploy
  sleep 30
  kubectl wait --for=condition=ready pod --all -n bench --timeout=180s

  bash "${SCRIPT_DIR}/run-benchmark.sh" "scenario-b-cilium-kp"
}

# ============================================================
# Step 4: Switch to Cilium kube-proxy-less (Scenario C)
# ============================================================
run_scenario_c() {
  log "=== SCENARIO C: Cilium kube-proxy-less ==="
  local API_SERVER
  API_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' | sed 's|https://||')
  local API_HOST="${API_SERVER%%:*}"
  local API_PORT="${API_SERVER##*:}"
  [ "$API_PORT" = "$API_HOST" ] && API_PORT="443"

  log "Removing kube-proxy..."
  kubectl -n kube-system delete ds kube-proxy --ignore-not-found
  kubectl -n kube-system delete cm kube-proxy --ignore-not-found

  log "Upgrading Cilium to kube-proxy-less..."
  helm upgrade cilium cilium/cilium --version "${HELM_CILIUM_VERSION}" \
    --namespace kube-system \
    --set kubeProxyReplacement=true \
    --set k8sServiceHost="${API_HOST}" \
    --set k8sServicePort="${API_PORT}" \
    --set cni.exclusive=true \
    --set ipam.mode=cluster-pool \
    --set ipam.operator.clusterPoolIPv4PodCIDRList="{10.244.0.0/16}" \
    --set routingMode=tunnel \
    --set tunnelProtocol=vxlan \
    --set hubble.enabled=false \
    --set operator.replicas=1 \
    --wait --timeout=300s

  log "Restarting workloads..."
  kubectl rollout restart -n bench deploy
  sleep 30
  kubectl wait --for=condition=ready pod --all -n bench --timeout=180s

  bash "${SCRIPT_DIR}/run-benchmark.sh" "scenario-c-kpless"
}

# ============================================================
# Step 5: Switch to Cilium ENI mode (Scenario D)
# ============================================================
run_scenario_d() {
  log "=== SCENARIO D: Cilium ENI mode ==="
  local API_SERVER
  API_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' | sed 's|https://||')
  local API_HOST="${API_SERVER%%:*}"
  local API_PORT="${API_SERVER##*:}"
  [ "$API_PORT" = "$API_HOST" ] && API_PORT="443"

  log "Upgrading Cilium to ENI mode..."
  helm upgrade cilium cilium/cilium --version "${HELM_CILIUM_VERSION}" \
    --namespace kube-system \
    --set kubeProxyReplacement=true \
    --set k8sServiceHost="${API_HOST}" \
    --set k8sServicePort="${API_PORT}" \
    --set cni.exclusive=true \
    --set ipam.mode=eni \
    --set eni.enabled=true \
    --set eni.awsEnablePrefixDelegation=true \
    --set routingMode=native \
    --set hubble.enabled=false \
    --set operator.replicas=1 \
    --wait --timeout=300s

  log "Restarting Cilium agents and workloads..."
  kubectl -n kube-system rollout restart ds/cilium
  kubectl -n kube-system rollout status ds/cilium --timeout=180s
  kubectl rollout restart -n bench deploy
  sleep 30
  kubectl wait --for=condition=ready pod --all -n bench --timeout=180s

  bash "${SCRIPT_DIR}/run-benchmark.sh" "scenario-d-eni"
}

# ============================================================
# Step 6: Cilium ENI + full tuning (Scenario E)
# ============================================================
run_scenario_e() {
  log "=== SCENARIO E: Cilium ENI + full tuning ==="
  local API_SERVER
  API_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' | sed 's|https://||')
  local API_HOST="${API_SERVER%%:*}"
  local API_PORT="${API_SERVER##*:}"
  [ "$API_PORT" = "$API_HOST" ] && API_PORT="443"

  log "Upgrading Cilium with full tuning..."
  helm upgrade cilium cilium/cilium --version "${HELM_CILIUM_VERSION}" \
    --namespace kube-system \
    --set kubeProxyReplacement=true \
    --set k8sServiceHost="${API_HOST}" \
    --set k8sServicePort="${API_PORT}" \
    --set cni.exclusive=true \
    --set ipam.mode=eni \
    --set eni.enabled=true \
    --set eni.awsEnablePrefixDelegation=true \
    --set routingMode=native \
    --set bpf.hostLegacyRouting=false \
    --set bpf.masquerade=true \
    --set bpf.ctGlobalAnyMax=524288 \
    --set bpf.ctGlobalTCPMax=1048576 \
    --set loadBalancer.mode=dsr \
    --set loadBalancer.acceleration=native \
    --set socketLB.enabled=true \
    --set bandwidthManager.enabled=true \
    --set bandwidthManager.bbr=true \
    --set hubble.enabled=false \
    --set operator.replicas=1 \
    --wait --timeout=300s

  log "Restarting Cilium agents and workloads..."
  kubectl -n kube-system rollout restart ds/cilium
  kubectl -n kube-system rollout status ds/cilium --timeout=180s
  kubectl rollout restart -n bench deploy
  sleep 30
  kubectl wait --for=condition=ready pod --all -n bench --timeout=180s

  bash "${SCRIPT_DIR}/run-benchmark.sh" "scenario-e-eni-tuned"
}

# ============================================================
# Step 7: Collect all results into summary
# ============================================================
collect_results() {
  log "=== Collecting Results ==="
  local RESULTS_DIR="${SCRIPT_DIR}/results"
  python3 - "${RESULTS_DIR}" <<'PYEOF'
import json, sys, os, glob

results_dir = sys.argv[1]
files = sorted(glob.glob(f"{results_dir}/scenario-*.json"))

if not files:
    print("No result files found.")
    sys.exit(1)

scenarios = []
for f in files:
    with open(f) as fh:
        scenarios.append(json.load(fh))

# Print summary table
header = f"{'Metric':<30}"
for s in scenarios:
    name = s['scenario'].replace('scenario-', '').upper()[:12]
    header += f" {name:>12}"
print(header)
print("-" * len(header))

rows = [
    ("TCP Throughput (Gbps)", lambda s: f"{s['network']['tcp_throughput_gbps']:.2f}"),
    ("UDP Throughput (Gbps)", lambda s: f"{s['network']['udp_throughput_gbps']:.2f}"),
    ("UDP Loss (%)", lambda s: f"{s['network']['udp_loss_percent']:.2f}"),
    ("Mean RTT (µs)", lambda s: f"{s['network']['mean_rtt_us']}"),
    ("HTTP QPS@1K actual", lambda s: f"{s['http']['qps_1000']['actual_qps']:.0f}"),
    ("HTTP QPS@1K p50 (ms)", lambda s: f"{s['http']['qps_1000']['p50_ms']:.2f}"),
    ("HTTP QPS@1K p99 (ms)", lambda s: f"{s['http']['qps_1000']['p99_ms']:.2f}"),
    ("HTTP QPS@5K actual", lambda s: f"{s['http']['qps_5000']['actual_qps']:.0f}"),
    ("HTTP QPS@5K p99 (ms)", lambda s: f"{s['http']['qps_5000']['p99_ms']:.2f}"),
    ("HTTP QPS max actual", lambda s: f"{s['http']['qps_max']['actual_qps']:.0f}"),
    ("HTTP QPS max p99 (ms)", lambda s: f"{s['http']['qps_max']['p99_ms']:.2f}"),
    ("DNS p50 (ms)", lambda s: f"{s['dns']['p50_ms']}"),
    ("DNS p99 (ms)", lambda s: f"{s['dns']['p99_ms']}"),
]

for label, fn in rows:
    row = f"{label:<30}"
    for s in scenarios:
        try:
            row += f" {fn(s):>12}"
        except Exception:
            row += f" {'N/A':>12}"
    print(row)

# Save combined JSON
with open(f"{results_dir}/all-results.json", "w") as f:
    json.dump(scenarios, f, indent=2)
print(f"\nCombined results saved to: {results_dir}/all-results.json")
PYEOF
}

# ============================================================
# Step 8: Cleanup
# ============================================================
cleanup() {
  log "Deleting cluster..."
  eksctl delete cluster --name "${CLUSTER_NAME}" --region "${REGION}" --wait
  log "Cleanup complete."
}

# ============================================================
# Main
# ============================================================
main() {
  log "Starting CNI Benchmark Pipeline"
  log "================================"

  create_cluster
  run_scenario_a
  run_scenario_b
  run_scenario_c
  run_scenario_d
  run_scenario_e
  collect_results

  log ""
  log "All benchmarks complete!"
  log "Results directory: ${SCRIPT_DIR}/results/"
  log ""
  log "To delete the cluster: eksctl delete cluster --name ${CLUSTER_NAME} --region ${REGION}"
}

main "$@"
