import React from 'react';
import { SlideWrapper, Card, Badge } from '@shared/components';

const Slide04: React.FC = () => {
  return (
    <SlideWrapper slideNumber={4} title="Tier 1: kgateway">
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-4xl font-bold text-blue-400">kgateway</h2>
          <Badge color="blue">Kubernetes Gateway API</Badge>
          <Badge color="green">Envoy-based</Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Core Features">
            <ul className="space-y-3 text-lg text-gray-300">
              <li><strong className="text-blue-400">Gateway API v1.2.0+</strong> — Standard K8s routing</li>
              <li><strong className="text-blue-400">HTTPRoute/GRPCRoute</strong> — Flexible path/header matching</li>
              <li><strong className="text-blue-400">mTLS Termination</strong> — Cert-manager integration</li>
              <li><strong className="text-blue-400">Rate Limiting</strong> — Per-tenant quotas</li>
              <li><strong className="text-blue-400">Circuit Breaker</strong> — Automatic fault isolation</li>
            </ul>
          </Card>

          <Card title="Why kgateway?">
            <ul className="space-y-3 text-lg text-gray-300">
              <li><strong className="text-green-400">OSS + Enterprise</strong> — Recently open-sourced control plane</li>
              <li><strong className="text-green-400">High Performance</strong> — Envoy-based, battle-tested</li>
              <li><strong className="text-green-400">K8s Native</strong> — Gateway API standard compliance</li>
              <li><strong className="text-green-400">Extensible</strong> — Custom filters & policies</li>
            </ul>
          </Card>
        </div>

        <Card title="Key Responsibilities">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-800/30 rounded-lg">
              <div className="text-xl font-bold text-blue-300 mb-2">Traffic Control</div>
              <p className="text-gray-400">L7 routing, header matching, path rewriting</p>
            </div>
            <div className="p-4 bg-purple-800/30 rounded-lg">
              <div className="text-xl font-bold text-purple-300 mb-2">Security</div>
              <p className="text-gray-400">mTLS, OIDC/JWT validation, network policies</p>
            </div>
            <div className="p-4 bg-pink-800/30 rounded-lg">
              <div className="text-xl font-bold text-pink-300 mb-2">Reliability</div>
              <p className="text-gray-400">Retry, timeout, circuit breaker, health checks</p>
            </div>
          </div>
        </Card>

        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-lg text-gray-300">
            <strong className="text-blue-400">Deployment:</strong> Helm chart, 2 replicas for HA, Prometheus metrics enabled
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide04;
