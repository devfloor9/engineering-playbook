import { SlideWrapper, Card } from '@shared/components';

export default function Slide13() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-red-400">Key Alerts & SLOs</h2>
        <p className="text-xl text-gray-300 mb-8">
          P99 latency, error rate, GPU utilization, budget thresholds
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-red-400">Critical Alerts (P0)</h3>
            <div className="space-y-3">
              <div className="bg-red-900/20 p-4 rounded border border-red-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-red-400">Error Rate &gt; 5%</span>
                  <span className="text-xs bg-red-500/30 px-2 py-1 rounded">P0</span>
                </div>
                <p className="text-xs text-gray-400">For 5 minutes → PagerDuty escalation</p>
              </div>

              <div className="bg-red-900/20 p-4 rounded border border-red-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-red-400">GPU OOM (Out of Memory)</span>
                  <span className="text-xs bg-red-500/30 px-2 py-1 rounded">P0</span>
                </div>
                <p className="text-xs text-gray-400">Immediate Pod restart + alert</p>
              </div>

              <div className="bg-red-900/20 p-4 rounded border border-red-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-red-400">vLLM Server Down</span>
                  <span className="text-xs bg-red-500/30 px-2 py-1 rounded">P0</span>
                </div>
                <p className="text-xs text-gray-400">All replicas unhealthy for 2 minutes</p>
              </div>

              <div className="bg-red-900/20 p-4 rounded border border-red-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-red-400">Daily Cost &gt; $500</span>
                  <span className="text-xs bg-red-500/30 px-2 py-1 rounded">P0</span>
                </div>
                <p className="text-xs text-gray-400">Budget exceeded → Auto-throttle + Slack alert</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-yellow-400">Warning Alerts (P1)</h3>
            <div className="space-y-3">
              <div className="bg-yellow-900/20 p-4 rounded border border-yellow-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-yellow-400">P99 Latency &gt; 10s</span>
                  <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded">P1</span>
                </div>
                <p className="text-xs text-gray-400">For 10 minutes → Slack notification</p>
              </div>

              <div className="bg-yellow-900/20 p-4 rounded border border-yellow-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-yellow-400">GPU Memory &gt; 95%</span>
                  <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded">P1</span>
                </div>
                <p className="text-xs text-gray-400">Scale up trigger + warning</p>
              </div>

              <div className="bg-yellow-900/20 p-4 rounded border border-yellow-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-yellow-400">RAGAS Score Drop &gt; 10%</span>
                  <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded">P1</span>
                </div>
                <p className="text-xs text-gray-400">Model quality degradation detected</p>
              </div>

              <div className="bg-yellow-900/20 p-4 rounded border border-yellow-500/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-yellow-400">Budget 80% Consumed</span>
                  <span className="text-xs bg-yellow-500/30 px-2 py-1 rounded">P1</span>
                </div>
                <p className="text-xs text-gray-400">Approaching daily/monthly limit</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold mb-3 text-blue-400">SLOs (Service Level Objectives)</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Availability: 99.9% uptime</li>
              <li>• P99 Latency: &lt; 5s</li>
              <li>• Error Rate: &lt; 0.5%</li>
              <li>• GPU Utilization: 80-95%</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Alert Channels</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• PagerDuty (P0 escalation)</li>
              <li>• Slack #ml-ops-alerts</li>
              <li>• Email (weekly digest)</li>
              <li>• Grafana dashboard</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-purple-500/30">
            <h4 className="text-lg font-semibold mb-3 text-purple-400">Auto-Remediation</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• GPU OOM → Pod restart</li>
              <li>• High latency → Scale up</li>
              <li>• Low traffic → Scale down</li>
              <li>• Budget exceeded → Throttle</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
