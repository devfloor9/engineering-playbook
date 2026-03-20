#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="gpu-operator"
RELEASE="gpu-operator"
CHART_VERSION="v24.9.0"

echo "==> Installing NVIDIA GPU Operator ${CHART_VERSION}"

helm repo add nvidia https://helm.ngc.nvidia.com/nvidia --force-update
helm repo update

helm upgrade --install "${RELEASE}" nvidia/gpu-operator \
  --namespace "${NAMESPACE}" \
  --create-namespace \
  --version "${CHART_VERSION}" \
  -f values-eks.yaml \
  --wait --timeout 10m

echo "==> GPU Operator installed. Verifying..."
kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=gpu-operator
