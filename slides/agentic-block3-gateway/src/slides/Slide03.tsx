import React from 'react';
import { SlideWrapper, FlowDiagram } from '@shared/components';

const Slide03: React.FC = () => {
  const architecture = {
    nodes: [
      { id: 'client', label: 'Clients', type: 'input' },
      { id: 'tier1', label: 'Tier 1\nkgateway', type: 'process', color: '#3b82f6' },
      { id: 'tier2a', label: 'Tier 2-A\nBifrost', type: 'process', color: '#8b5cf6' },
      { id: 'tier2b', label: 'Tier 2-B\nagentgateway', type: 'process', color: '#ec4899' },
      { id: 'external', label: 'External LLM', type: 'output', color: '#10b981' },
      { id: 'selfhosted', label: 'Self-hosted vLLM', type: 'output', color: '#f59e0b' },
    ],
    edges: [
      { from: 'client', to: 'tier1', label: 'HTTPS' },
      { from: 'tier1', to: 'tier2a', label: 'External Route' },
      { from: 'tier1', to: 'tier2b', label: 'Self-hosted Route' },
      { from: 'tier2a', to: 'external', label: 'OpenAI/Anthropic/Bedrock' },
      { from: 'tier2b', to: 'selfhosted', label: 'vLLM Pods' },
    ],
  };

  return (
    <SlideWrapper slideNumber={3} title="2-Tier Architecture Overview">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-6">
          Separation of Concerns
        </h2>

        <FlowDiagram {...architecture} />

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-blue-900/30 border border-blue-500/50 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-300 mb-4">Tier 1: Infrastructure Layer</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Kubernetes Gateway API standard</li>
              <li>• mTLS, rate limiting, circuit breaker</li>
              <li>• Network policies & load balancing</li>
              <li>• Envoy-based performance</li>
            </ul>
          </div>

          <div className="p-6 bg-purple-900/30 border border-purple-500/50 rounded-lg">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">Tier 2: LLM Abstraction</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• 100+ provider integration</li>
              <li>• Semantic caching & cascade routing</li>
              <li>• Token tracking & cost control</li>
              <li>• MCP/A2A protocol support</li>
            </ul>
          </div>
        </div>

        <div className="text-center text-xl text-gray-300 mt-6">
          <strong className="text-blue-400">Result:</strong> Each tier optimizes for its domain, independent evolution
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide03;
