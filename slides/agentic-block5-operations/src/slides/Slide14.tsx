import { SlideWrapper, Card } from '@shared/components';

export default function Slide14() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-green-400">Production Readiness Checklist</h2>
        <p className="text-xl text-gray-300 mb-8">
          Infrastructure, serving, gateway, security, observability validation
        </p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Infrastructure</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">EKS cluster v1.32+ with Auto Mode or Karpenter</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">GPU Operator + DCGM Exporter deployed</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">NodePool for GPU workloads (Spot + On-Demand)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">VPC CNI with prefix delegation</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Persistent volume (EBS CSI) for model storage</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Model Serving</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">vLLM v0.7+ with prefix caching enabled</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">HPA configured (min 2, max 8 replicas)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Health check endpoints (/health, /v1/models)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Pod anti-affinity for high availability</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Resource limits (GPU, CPU, memory) set</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-green-400">Gateway & Security</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Bifrost Gateway with rate limiting (100 req/s)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">TLS termination with ACM certificate</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">API key authentication + tenant isolation</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Network policies (namespace isolation)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Secrets in AWS Secrets Manager (not K8s Secret)</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-yellow-400">Observability</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Prometheus + Grafana dashboards deployed</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Langfuse self-hosted with ClickHouse backend</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">RAGAS evaluation pipeline (CI/CD + daily cron)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">CloudWatch alarms (P0/P1 alerts configured)</span>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" checked readOnly className="mt-1" />
                <span className="text-gray-300">Cost tracking (Kubecost + Langfuse cost attribution)</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-5 rounded-lg border border-green-500/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h4 className="text-lg font-semibold mb-2 text-green-300">Final Validation</h4>
              <p className="text-gray-300 text-sm">
                Run load test (1000 req/s for 30 min), verify P99 latency &lt; 5s, error rate &lt; 0.5%,
                GPU utilization 80-95%, no OOM, all alerts functioning, cost attribution accurate per tenant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
