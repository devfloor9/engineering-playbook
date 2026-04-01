import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

const Slide16: React.FC = () => {
  return (
    <SlideWrapper slideNumber={16} title="Key Takeaways">
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-8 text-center">
          Key Takeaways
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Card title="1. 2-Tier Architecture">
            <div className="space-y-3 text-gray-300">
              <p>
                <strong className="text-blue-400">Tier 1 (kgateway):</strong> Kubernetes-native traffic control, mTLS, rate limiting
              </p>
              <p>
                <strong className="text-purple-400">Tier 2 (Bifrost/agentgateway):</strong> LLM-specific routing, caching, cost optimization
              </p>
              <div className="p-3 bg-blue-900/30 rounded text-sm">
                Separation of concerns → Independent evolution
              </div>
            </div>
          </Card>

          <Card title="2. Cost Optimization">
            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between items-center p-3 bg-green-900/30 rounded">
                <span>Cascade Routing</span>
                <span className="text-green-400 font-bold">73% savings</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-900/30 rounded">
                <span>Semantic Cache</span>
                <span className="text-green-400 font-bold">30% savings</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-900/30 rounded">
                <span>KV Cache Reuse</span>
                <span className="text-green-400 font-bold">80% faster</span>
              </div>
            </div>
          </Card>

          <Card title="3. Gateway Layers">
            <div className="space-y-3">
              <div className="p-3 bg-blue-800/30 rounded">
                <div className="font-bold text-blue-300 mb-1">kgateway (OSS)</div>
                <div className="text-sm text-gray-400">Infrastructure routing, recently open-sourced</div>
              </div>
              <div className="p-3 bg-purple-800/30 rounded">
                <div className="font-bold text-purple-300 mb-1">Bifrost &gt; LiteLLM</div>
                <div className="text-sm text-gray-400">50x faster, choose based on needs</div>
              </div>
              <div className="p-3 bg-orange-800/30 rounded">
                <div className="font-bold text-orange-300 mb-1">llm-d</div>
                <div className="text-sm text-gray-400">KV cache-aware Pod selection</div>
              </div>
            </div>
          </Card>

          <Card title="4. AI-Native Protocols">
            <div className="space-y-3">
              <div className="p-3 bg-pink-800/30 rounded">
                <div className="font-bold text-pink-300 mb-1">MCP (Model Context Protocol)</div>
                <div className="text-sm text-gray-400">Agent ↔ Tool communication</div>
              </div>
              <div className="p-3 bg-blue-800/30 rounded">
                <div className="font-bold text-blue-300 mb-1">A2A (Agent-to-Agent)</div>
                <div className="text-sm text-gray-400">Multi-agent collaboration</div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                → Requires <strong className="text-pink-400">agentgateway</strong> stateful data plane
              </div>
            </div>
          </Card>
        </div>

        <Card title="5. Production Deployment Checklist">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Gateway API CRDs installed</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">kgateway Helm chart deployed</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Bifrost/LiteLLM configured</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Semantic cache (Redis) running</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">HTTPRoute rules configured</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Langfuse observability integrated</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Budget controls set</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-gray-800/50 rounded">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Alert rules configured</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="p-6 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-blue-500/30 rounded-lg">
          <div className="text-center space-y-3">
            <div className="text-3xl font-bold text-blue-300">
              Enterprise-grade AI Gateway Architecture
            </div>
            <div className="text-xl text-gray-300">
              Cost-optimized • Scalable • Observable • Production-ready
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide16;
