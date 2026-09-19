: "${CONTEXT:?Set an explicitly verified kubeconfig context}"
: "${NAMESPACE:?Set an explicitly reviewed namespace}"
# Every kubectl command in a separately validated runbook must include:
# kubectl --context "$CONTEXT" --namespace "$NAMESPACE" ...
