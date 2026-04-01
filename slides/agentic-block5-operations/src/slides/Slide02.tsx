import { SlideWrapper, Card } from '@shared/components';

export default function Slide02() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">Dual-Layer Observability</h2>
        <p className="text-xl text-gray-300 mb-8">
          Infrastructure & Application monitoring separation for complete visibility
        </p>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-blue-400">Infrastructure Layer</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-xl">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Bifrost Gateway</p>
                  <p className="text-sm text-gray-400">Request routing, rate limiting, caching</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-xl">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">DCGM + Prometheus</p>
                  <p className="text-sm text-gray-400">GPU metrics, utilization tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-xl">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Kubecost</p>
                  <p className="text-sm text-gray-400">Resource cost allocation by namespace</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">Application Layer</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Langfuse</p>
                  <p className="text-sm text-gray-400">LLM traces, token usage, prompt management</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Agent Step Tracking</p>
                  <p className="text-sm text-gray-400">Tool calls, reasoning chains, latency per step</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Cost Attribution</p>
                  <p className="text-sm text-gray-400">Model-level, tenant-level billing</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-lg border border-blue-500/30">
          <h4 className="text-lg font-semibold mb-3 text-blue-300">Why Dual-Layer?</h4>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Infrastructure issues (GPU OOM) vs Application issues (prompt quality)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Different stakeholders: SRE team vs ML/AI team
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Separate scaling concerns: cluster resources vs trace volume
            </li>
          </ul>
        </div>
      </div>
    </SlideWrapper>
  );
}
