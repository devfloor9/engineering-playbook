import { SlideWrapper, Card } from '@shared/components';

export default function Slide03() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">Infrastructure Monitoring</h2>
        <p className="text-xl text-gray-300 mb-8">
          GPU metrics, cluster resources, and cost allocation
        </p>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-xl font-semibold mb-3 text-green-400">DCGM Exporter</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">GPU Utilization</span>
                <span className="text-gray-200 font-mono">87%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Memory Used</span>
                <span className="text-gray-200 font-mono">38/40 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Temperature</span>
                <span className="text-gray-200 font-mono">72°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Power Draw</span>
                <span className="text-gray-200 font-mono">285W</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-3 text-blue-400">Kubecost</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">model-serving</span>
                <span className="text-gray-200 font-mono">$2,840/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">training</span>
                <span className="text-gray-200 font-mono">$1,560/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">observability</span>
                <span className="text-gray-200 font-mono">$380/mo</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="text-gray-300 font-semibold">Total</span>
                <span className="text-blue-300 font-mono font-semibold">$4,780/mo</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-3 text-purple-400">Prometheus</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Request Rate</span>
                <span className="text-gray-200 font-mono">1.2K req/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">P99 Latency</span>
                <span className="text-gray-200 font-mono">3.2s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Error Rate</span>
                <span className="text-gray-200 font-mono">0.12%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pod Count</span>
                <span className="text-gray-200 font-mono">24 active</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-orange-500/30">
            <h4 className="text-lg font-semibold mb-3 text-orange-400">Key Metrics</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• GPU Memory Utilization (target: 85-95%)</li>
              <li>• GPU SM (Streaming Multiprocessor) Active %</li>
              <li>• NVLink/PCIe Throughput (for multi-GPU)</li>
              <li>• CPU & RAM per node</li>
              <li>• Network I/O (model loading, KV cache transfer)</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-lg border border-red-500/30">
            <h4 className="text-lg font-semibold mb-3 text-red-400">Alert Thresholds</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• GPU Memory &gt; 95% for 5min → Warning</li>
              <li>• GPU Temperature &gt; 85°C → Critical</li>
              <li>• P99 Latency &gt; 10s → Warning</li>
              <li>• Error Rate &gt; 1% → Critical</li>
              <li>• Daily Cost &gt; $200/namespace → Warning</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
