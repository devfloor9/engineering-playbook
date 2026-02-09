#!/bin/bash
# Generate 100 dummy services for kube-proxy/eBPF scaling test
# Each service has a nginx deployment with 1 replica

NAMESPACE="bench"
COUNT=${1:-100}

echo "Generating $COUNT dummy services in namespace $NAMESPACE..."

for i in $(seq 1 $COUNT); do
  cat <<EOF | kubectl apply -f - --context "${KUBE_CONTEXT:-}" 2>/dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: svc-dummy-$(printf '%03d' $i)
  namespace: $NAMESPACE
  labels:
    app: svc-dummy-$(printf '%03d' $i)
    tier: dummy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: svc-dummy-$(printf '%03d' $i)
  template:
    metadata:
      labels:
        app: svc-dummy-$(printf '%03d' $i)
        tier: dummy
    spec:
      containers:
      - name: nginx
        image: nginx:1.27-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 5m
            memory: 16Mi
          limits:
            cpu: 50m
            memory: 32Mi
---
apiVersion: v1
kind: Service
metadata:
  name: svc-dummy-$(printf '%03d' $i)
  namespace: $NAMESPACE
  labels:
    tier: dummy
spec:
  selector:
    app: svc-dummy-$(printf '%03d' $i)
  ports:
  - port: 80
    targetPort: 80
EOF

  if (( i % 10 == 0 )); then
    echo "  Created $i/$COUNT services..."
  fi
done

echo ""
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment -n $NAMESPACE -l tier=dummy --timeout=300s --context "${KUBE_CONTEXT:-}" 2>/dev/null

TOTAL=$(kubectl get svc -n $NAMESPACE --context "${KUBE_CONTEXT:-}" --no-headers 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "Total services in namespace $NAMESPACE: $TOTAL"
