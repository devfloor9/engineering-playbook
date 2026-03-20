#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="dynamo-system"
CHART_VERSION="0.9.1"

echo "==> Installing Dynamo CRDs (including DynamoWorkerMetadata)"
kubectl apply -f crds/

echo "==> Installing Dynamo Platform ${CHART_VERSION}"

helm repo add nvidia-dynamo https://helm.ngc.nvidia.com/nvidia/dynamo --force-update
helm repo update

# etcd
helm upgrade --install dynamo-etcd nvidia-dynamo/etcd \
  --namespace "${NAMESPACE}" \
  -f values-eks.yaml \
  --wait --timeout 5m

# NATS
helm upgrade --install dynamo-nats nvidia-dynamo/nats \
  --namespace "${NAMESPACE}" \
  -f values-eks.yaml \
  --wait --timeout 5m

# Operator
helm upgrade --install dynamo-operator nvidia-dynamo/dynamo-operator \
  --namespace "${NAMESPACE}" \
  --version "${CHART_VERSION}" \
  -f values-eks.yaml \
  --wait --timeout 5m

echo "==> Dynamo Platform installed."
kubectl get pods -n "${NAMESPACE}"
kubectl get crd | grep nvidia
