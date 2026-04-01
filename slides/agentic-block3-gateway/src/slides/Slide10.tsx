import React from 'react';
import { SlideWrapper, CompareTable } from '@shared/components';

const Slide10: React.FC = () => {
  const comparison = {
    title: 'kgateway OSS vs Enterprise',
    headers: ['Feature', 'OSS', 'Enterprise'],
    rows: [
      ['Gateway API Standard', 'Full support', 'Full support'],
      ['HTTPRoute/GRPCRoute', 'Yes', 'Yes'],
      ['mTLS Termination', 'Yes', 'Yes'],
      ['Rate Limiting', 'Basic', 'Advanced + token-aware'],
      ['Circuit Breaker', 'Yes', 'Yes + custom policies'],
      ['Metrics & Observability', 'Prometheus', 'Prometheus + custom dashboards'],
      ['Multi-cluster', 'Manual setup', 'Federated control plane'],
      ['GraphQL/WebSocket', 'Community plugins', 'Native support'],
      ['Advanced Routing', 'Basic filters', 'AI-specific filters (content-based)'],
      ['Support', 'Community', 'Enterprise SLA'],
      ['License', 'Apache 2.0', 'Commercial'],
    ],
  };

  return (
    <SlideWrapper slideNumber={10} title="kgateway OSS vs Enterprise">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-6">
          Recent Open-Sourcing
        </h2>

        <div className="p-6 bg-blue-900/30 border border-blue-500/30 rounded-lg mb-6">
          <p className="text-xl text-gray-300">
            <strong className="text-blue-400">2025 Update:</strong> kgateway control plane was recently open-sourced. The OSS version provides full Gateway API compliance and is suitable for most AI inference workloads.
          </p>
        </div>

        <CompareTable {...comparison} />

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-green-900/30 border border-green-500/30 rounded-lg">
            <h3 className="text-2xl font-bold text-green-300 mb-4">OSS Recommendation</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Startups & SMBs</strong> — Full features, $0 licensing</li>
              <li>• <strong>Cloud-native teams</strong> — K8s expertise in-house</li>
              <li>• <strong>Standard workloads</strong> — HTTPRoute + rate limiting sufficient</li>
              <li>• <strong>Self-managed</strong> — Community support acceptable</li>
            </ul>
          </div>

          <div className="p-6 bg-purple-900/30 border border-purple-500/30 rounded-lg">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">Enterprise Recommendation</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong>Large enterprises</strong> — Multi-cluster, multi-region</li>
              <li>• <strong>Advanced features</strong> — Token-aware rate limiting, GraphQL</li>
              <li>• <strong>SLA requirements</strong> — Need 24/7 support</li>
              <li>• <strong>Compliance</strong> — Audit trails, advanced security</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-lg text-center">
          <p className="text-lg text-gray-300">
            <strong className="text-blue-400">Migration Path:</strong> Start with OSS, upgrade to Enterprise only when needed
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide10;
