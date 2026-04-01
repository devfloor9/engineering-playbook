import { SlideWrapper, Card } from '@shared/components';

export default function Slide10() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-yellow-400">LLMOps Cost Governance</h2>
        <p className="text-xl text-gray-300 mb-8">
          2-Tier cost tracking: Bifrost (infrastructure) + Langfuse (application)
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-blue-400">Tier 1: Bifrost (Infrastructure)</h3>
            <div className="space-y-3">
              <div className="bg-gray-900/50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Total API Calls</span>
                  <span className="text-2xl font-bold text-blue-300">2.4M</span>
                </div>
                <p className="text-xs text-gray-400">Last 30 days</p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Total Tokens</span>
                  <span className="text-2xl font-bold text-green-300">180M</span>
                </div>
                <p className="text-xs text-gray-400">Input: 120M | Output: 60M</p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border border-yellow-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Total Cost</span>
                  <span className="text-2xl font-bold text-yellow-300">$1,840</span>
                </div>
                <p className="text-xs text-gray-400">By tenant: A($680) | B($540) | C($620)</p>
              </div>

              <div className="bg-blue-500/10 p-3 rounded border border-blue-500/30 text-sm">
                <p className="text-blue-300 font-semibold mb-1">Tracked at Gateway Level</p>
                <p className="text-gray-400 text-xs">x-tenant-id header → cost attribution</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">Tier 2: Langfuse (Application)</h3>
            <div className="space-y-3">
              <div className="bg-gray-900/50 p-4 rounded">
                <p className="font-semibold text-purple-300 mb-2">Cost by Model</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">gpt-4o</span>
                    <span className="text-gray-200">$1,240 (67%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">gpt-4o-mini</span>
                    <span className="text-gray-200">$180 (10%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">claude-sonnet-4</span>
                    <span className="text-gray-200">$420 (23%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded">
                <p className="font-semibold text-green-300 mb-2">Cost by Use Case</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Agent reasoning</span>
                    <span className="text-gray-200">$890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RAG synthesis</span>
                    <span className="text-gray-200">$620</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Evaluation</span>
                    <span className="text-gray-200">$330</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 p-3 rounded border border-purple-500/30 text-sm">
                <p className="text-purple-300 font-semibold mb-1">Detailed Application Context</p>
                <p className="text-gray-400 text-xs">Agent step-level attribution, prompt versioning</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-5 rounded-lg border border-orange-500/30">
            <h4 className="text-lg font-semibold mb-3 text-orange-400">Budget Alerts</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Daily budget: $100/tenant</li>
              <li>• Warning at 80% ($80)</li>
              <li>• Critical at 100% ($100)</li>
              <li>• Auto-throttle at 120%</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Cost Optimization</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Cascade routing (cheap→premium)</li>
              <li>• Semantic caching (30% hit rate)</li>
              <li>• Prompt compression (20% tokens saved)</li>
              <li>• Model selection per task</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold mb-3 text-blue-400">Anomaly Detection</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Spike &gt;2x daily average → Alert</li>
              <li>• Unusual model usage pattern</li>
              <li>• Tokens per request anomaly</li>
              <li>• Tenant quota violation</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
