import React from 'react';
import { SlideWrapper, FlowDiagram } from '@shared/components';

const Slide15: React.FC = () => {
  const fullArchitecture = {
    nodes: [
      { id: 'client', label: 'Client', type: 'input' },
      { id: 'kgateway', label: 'kgateway\n(Tier 1)', type: 'process', color: '#3b82f6' },
      { id: 'bifrost', label: 'Bifrost\n(Tier 2-A)', type: 'process', color: '#8b5cf6' },
      { id: 'agentgw', label: 'agentgateway\n(Tier 2-B)', type: 'process', color: '#ec4899' },
      { id: 'llmd', label: 'llm-d', type: 'process', color: '#f59e0b' },
      { id: 'external', label: 'External LLM', type: 'output', color: '#10b981' },
      { id: 'vllm', label: 'vLLM Pods', type: 'output', color: '#6366f1' },
    ],
    edges: [
      { from: 'client', to: 'kgateway', label: 'HTTPS' },
      { from: 'kgateway', to: 'bifrost', label: '/v1/chat (external)' },
      { from: 'kgateway', to: 'agentgw', label: '/v1/chat (self-hosted)' },
      { from: 'bifrost', to: 'external', label: 'OpenAI/Anthropic/Bedrock' },
      { from: 'agentgw', to: 'llmd', label: 'KV-aware routing' },
      { from: 'llmd', to: 'vllm', label: 'Pod selection' },
    ],
  };

  return (
    <SlideWrapper slideNumber={15} title="Full Architecture">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-6">
          Client → kgateway → Bifrost/agentgateway → llm-d → vLLM
        </h2>

        <FlowDiagram {...fullArchitecture} />

        <div className="grid grid-cols-5 gap-3 mt-8">
          <div className="p-4 bg-blue-900/30 rounded-lg">
            <div className="font-bold text-blue-300 mb-2 text-center">Layer 1</div>
            <div className="text-sm text-gray-300 text-center">kgateway</div>
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• mTLS</li>
              <li>• Rate limit</li>
              <li>• Network policy</li>
            </ul>
          </div>

          <div className="p-4 bg-purple-900/30 rounded-lg">
            <div className="font-bold text-purple-300 mb-2 text-center">Layer 2-A</div>
            <div className="text-sm text-gray-300 text-center">Bifrost</div>
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• Cascade routing</li>
              <li>• Semantic cache</li>
              <li>• Budget control</li>
            </ul>
          </div>

          <div className="p-4 bg-pink-900/30 rounded-lg">
            <div className="font-bold text-pink-300 mb-2 text-center">Layer 2-B</div>
            <div className="text-sm text-gray-300 text-center">agentgateway</div>
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• MCP/A2A</li>
              <li>• Tool validation</li>
              <li>• Sessions</li>
            </ul>
          </div>

          <div className="p-4 bg-orange-900/30 rounded-lg">
            <div className="font-bold text-orange-300 mb-2 text-center">Layer 3</div>
            <div className="text-sm text-gray-300 text-center">llm-d</div>
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• KV cache aware</li>
              <li>• Pod selection</li>
              <li>• NIXL transfer</li>
            </ul>
          </div>

          <div className="p-4 bg-indigo-900/30 rounded-lg">
            <div className="font-bold text-indigo-300 mb-2 text-center">Layer 4</div>
            <div className="text-sm text-gray-300 text-center">vLLM</div>
            <ul className="text-xs text-gray-400 mt-2 space-y-1">
              <li>• GPU inference</li>
              <li>• PagedAttention</li>
              <li>• KV cache</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="p-4 bg-gray-800/50 border border-gray-600/30 rounded-lg">
            <div className="font-bold text-blue-400 mb-3">Traffic Flow</div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center">
                <span className="text-blue-400 mr-2">1.</span>
                <span>Client request → kgateway (HTTPS)</span>
              </div>
              <div className="flex items-center">
                <span className="text-purple-400 mr-2">2.</span>
                <span>kgateway → Bifrost or agentgateway</span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-400 mr-2">3.</span>
                <span>agentgateway → llm-d (if self-hosted)</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 mr-2">4.</span>
                <span>llm-d → vLLM Pod (KV cache hit)</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-400 mr-2">5.</span>
                <span>Response → Client</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 border border-gray-600/30 rounded-lg">
            <div className="font-bold text-green-400 mb-3">Observability</div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Network Layer</span>
                <span className="text-blue-400">Hubble</span>
              </div>
              <div className="flex justify-between">
                <span>LLM Layer</span>
                <span className="text-purple-400">Langfuse</span>
              </div>
              <div className="flex justify-between">
                <span>System Layer</span>
                <span className="text-orange-400">Prometheus</span>
              </div>
              <div className="flex justify-between">
                <span>Tracing</span>
                <span className="text-pink-400">OTEL</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-800/50 border border-gray-600/30 rounded-lg">
            <div className="font-bold text-yellow-400 mb-3">Cost Optimization</div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Cascade routing</span>
                <span className="text-green-400">73%↓</span>
              </div>
              <div className="flex justify-between">
                <span>Semantic cache</span>
                <span className="text-green-400">30%↓</span>
              </div>
              <div className="flex justify-between">
                <span>KV cache reuse</span>
                <span className="text-green-400">80%↓</span>
              </div>
              <div className="flex justify-between">
                <span>Graviton4 ARM</span>
                <span className="text-green-400">40%↓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border border-blue-500/30 rounded-lg">
          <p className="text-xl text-center text-gray-200">
            <strong className="text-blue-400">Each layer</strong> optimizes for its domain →
            <strong className="text-purple-400"> independent scaling</strong> →
            <strong className="text-pink-400"> maximum efficiency</strong>
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide15;
