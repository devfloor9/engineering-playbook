import { SlideWrapper, Card } from '@shared/components';

export default function Slide05() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">Gateway-Level Monitoring</h2>
        <p className="text-xl text-gray-300 mb-8">
          Non-invasive observability without SDK dependency
        </p>

        <div className="mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-blue-400">Bifrost Gateway Architecture</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-900/50 p-4 rounded">
                <h4 className="text-lg font-semibold mb-3 text-green-400">Request Capture</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• HTTP headers & body</li>
                  <li>• Model selection</li>
                  <li>• Request timestamp</li>
                  <li>• Client metadata</li>
                  <li>• Rate limit status</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 p-4 rounded">
                <h4 className="text-lg font-semibold mb-3 text-purple-400">Response Capture</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Response status code</li>
                  <li>• Token usage (header)</li>
                  <li>• Latency breakdown</li>
                  <li>• Error messages</li>
                  <li>• Fallback triggers</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 p-4 rounded">
                <h4 className="text-lg font-semibold mb-3 text-yellow-400">Cost Tracking</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Model pricing table</li>
                  <li>• Token × price calculation</li>
                  <li>• Tenant attribution</li>
                  <li>• Budget alerts</li>
                  <li>• Cost anomaly detection</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 p-6 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Advantages</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>No code changes</strong> — Works with any LLM client</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Centralized</strong> — Single point of observability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Low latency</strong> — &lt;10ms overhead (async logging)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Multi-tenant</strong> — Isolate by API key or header</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6 rounded-lg border border-orange-500/30">
            <h4 className="text-lg font-semibold mb-3 text-orange-400">Limitations</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">⚠</span>
                <span><strong>Coarse-grained</strong> — No agent step detail</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">⚠</span>
                <span><strong>Limited context</strong> — No tool call traces</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">⚠</span>
                <span><strong>No prompt versioning</strong> — Raw request only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">⚠</span>
                <span><strong>Single-hop only</strong> — No nested chain visibility</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
