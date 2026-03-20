#!/usr/bin/env bash
set -euo pipefail

# Extract benchmark results from PVC to local directory
NAMESPACE="${NAMESPACE:-dynamo-system}"
PVC_NAME="${PVC_NAME:-dynamo-shared-storage}"
LOCAL_DIR="${1:-./_results}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "==> Extracting benchmark results to ${LOCAL_DIR}/${TIMESTAMP}"
mkdir -p "${LOCAL_DIR}/${TIMESTAMP}"

# Create temporary pod to access PVC
kubectl run results-extractor \
  --namespace "${NAMESPACE}" \
  --image=busybox:1.36 \
  --restart=Never \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "extractor",
        "image": "busybox:1.36",
        "command": ["sleep", "300"],
        "volumeMounts": [{
          "name": "results",
          "mountPath": "/results",
          "subPath": "results"
        }]
      }],
      "volumes": [{
        "name": "results",
        "persistentVolumeClaim": { "claimName": "'"${PVC_NAME}"'" }
      }],
      "tolerations": [{
        "key": "eks.amazonaws.com/compute-type",
        "operator": "Exists"
      }]
    }
  }'

echo "  Waiting for extractor pod..."
kubectl wait --for=condition=Ready pod/results-extractor -n "${NAMESPACE}" --timeout=60s

echo "  Copying results..."
kubectl cp "${NAMESPACE}/results-extractor:/results" "${LOCAL_DIR}/${TIMESTAMP}/"

echo "  Cleaning up..."
kubectl delete pod results-extractor -n "${NAMESPACE}" --grace-period=0

echo "==> Results extracted to: ${LOCAL_DIR}/${TIMESTAMP}"
ls -la "${LOCAL_DIR}/${TIMESTAMP}/"
