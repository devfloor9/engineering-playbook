#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="monitoring"
RELEASE="prometheus"
CHART_VERSION="65.8.0"

echo "==> Installing kube-prometheus-stack ${CHART_VERSION}"

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm repo update

helm upgrade --install "${RELEASE}" prometheus-community/kube-prometheus-stack \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --version "${CHART_VERSION}" \
  -f values-eks.yaml \
  --wait --timeout 10m

echo "==> Importing Grafana dashboards..."
for dashboard in dashboards/*.json; do
  name=$(basename "${dashboard}" .json)
  kubectl create configmap "grafana-dashboard-${name}" \
    --from-file="${dashboard}" \
    -n "${NAMESPACE}" \
    --dry-run=client -o yaml | \
    kubectl label --local -f - grafana_dashboard=1 -o yaml | \
    kubectl apply -f -
done

echo "==> Monitoring stack installed."
kubectl get pods -n "${NAMESPACE}"
