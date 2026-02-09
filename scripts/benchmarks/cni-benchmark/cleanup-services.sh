#!/bin/bash
# Cleanup dummy services
NAMESPACE="bench"
echo "Deleting dummy services..."
kubectl delete deployment -n $NAMESPACE -l tier=dummy --context "${KUBE_CONTEXT:-}"
kubectl delete service -n $NAMESPACE -l tier=dummy --context "${KUBE_CONTEXT:-}"
echo "Done."
