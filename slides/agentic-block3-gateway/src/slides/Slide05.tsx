import React from 'react';
import { SlideWrapper, Card, Badge } from '@shared/components';

const Slide05: React.FC = () => {
  return (
    <SlideWrapper slideNumber={5} title="Tier 2: Bifrost">
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-4xl font-bold text-purple-400">Bifrost</h2>
          <Badge color="purple">Go/Rust</Badge>
          <Badge color="green">50x faster than LiteLLM</Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Core Capabilities">
            <ul className="space-y-3 text-lg text-gray-300">
              <li><strong className="text-purple-400">100+ Providers</strong> — OpenAI, Anthropic, Bedrock, Azure, GCP</li>
              <li><strong className="text-purple-400">Token Rate Limiting</strong> — Per-tenant token/min quotas</li>
              <li><strong className="text-purple-400">Semantic Cache</strong> — Embedding-based similar query caching</li>
              <li><strong className="text-purple-400">Cascade Routing</strong> — Cheap→medium→premium failover</li>
              <li><strong className="text-purple-400">Budget Control</strong> — Per-key monthly spending limits</li>
            </ul>
          </Card>

          <Card title="Performance Advantage">
            <div className="space-y-4">
              <div className="p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-2">50x Throughput</div>
                <p className="text-gray-300">Go/Rust vs Python-based LiteLLM</p>
              </div>
              <div className="p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 mb-2">1/10 Memory</div>
                <p className="text-gray-300">Efficient resource utilization</p>
              </div>
              <div className="p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-2">Kubernetes Native</div>
                <p className="text-gray-300">Helm chart, HPA-ready</p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Key Features">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-purple-800/30 rounded-lg text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm text-purple-300">Cost Tracking</div>
            </div>
            <div className="p-4 bg-blue-800/30 rounded-lg text-center">
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-sm text-blue-300">Auto Failover</div>
            </div>
            <div className="p-4 bg-green-800/30 rounded-lg text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm text-green-300">Observability</div>
            </div>
            <div className="p-4 bg-pink-800/30 rounded-lg text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-sm text-pink-300">Virtual Keys</div>
            </div>
          </div>
        </Card>

        <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg">
          <p className="text-lg text-gray-300">
            <strong className="text-purple-400">Alternative:</strong> LiteLLM for Python ecosystem (LangChain/LlamaIndex) — same API, broader provider support
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide05;
