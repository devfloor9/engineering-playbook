import { SlideWrapper, Card } from '@shared/components';

export default function Slide07() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">Hybrid Monitoring Strategy</h2>
        <p className="text-xl text-gray-300 mb-8">
          Gateway (non-invasive) + Agent Server (SDK) for complete coverage
        </p>

        <div className="mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">Recommended Architecture</h3>
            <div className="bg-gray-900/50 p-6 rounded-lg font-mono text-sm">
              <div className="space-y-2">
                <div className="text-blue-300">Client (Web/Mobile)</div>
                <div className="ml-4 text-gray-400">↓ HTTP Request</div>
                <div className="text-green-300">Bifrost Gateway (Infrastructure Layer)</div>
                <div className="ml-4 text-gray-500">• Rate limiting, caching, routing</div>
                <div className="ml-4 text-gray-500">• Basic request/response logging</div>
                <div className="ml-4 text-gray-500">• Cost tracking by tenant</div>
                <div className="ml-4 text-gray-400">↓ Forward to Agent Server</div>
                <div className="text-purple-300">Agent Server (Application Layer)</div>
                <div className="ml-4 text-gray-500">• Langfuse SDK integration</div>
                <div className="ml-4 text-gray-500">• Detailed agent step traces</div>
                <div className="ml-4 text-gray-500">• Prompt versioning & A/B tests</div>
                <div className="ml-4 text-gray-400">↓ LLM API Calls</div>
                <div className="text-yellow-300">LLM Providers (OpenAI, Anthropic, Bedrock)</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold mb-3 text-blue-400">Gateway Layer</h4>
            <p className="text-xs text-gray-400 mb-3">Infrastructure metrics for SRE</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Throughput (req/s)</li>
              <li>• P99 latency</li>
              <li>• Error rate by status</li>
              <li>• Rate limit hits</li>
              <li>• Cache hit rate</li>
              <li>• Cost by tenant</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-purple-500/30">
            <h4 className="text-lg font-semibold mb-3 text-purple-400">Agent Server Layer</h4>
            <p className="text-xs text-gray-400 mb-3">Application traces for ML/AI team</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Agent reasoning steps</li>
              <li>• Tool call frequency</li>
              <li>• Token usage per step</li>
              <li>• Prompt effectiveness</li>
              <li>• Quality scores</li>
              <li>• User feedback</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Data Flow</h4>
            <p className="text-xs text-gray-400 mb-3">Async, non-blocking</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Gateway → Prometheus</li>
              <li>• Gateway → Grafana</li>
              <li>• Agent → Langfuse</li>
              <li>• Both → S3 (audit log)</li>
              <li>• Both → CloudWatch</li>
              <li>• No client blocking</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-5 rounded-lg border border-blue-500/30">
          <h4 className="text-lg font-semibold mb-2 text-blue-300">Best Practice</h4>
          <p className="text-gray-300">
            Start with Gateway-level monitoring for quick setup, then add SDK-level tracking to Agent Server as complexity grows.
            Never expose Langfuse credentials to client applications — always keep SDK integration server-side.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
