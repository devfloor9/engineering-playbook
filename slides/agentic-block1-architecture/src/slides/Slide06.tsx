import { SlideWrapper, Card } from '@shared/components';
import { Globe, Shield, Gauge } from 'lucide-react';

export default function Slide06() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Client & Gateway Layer</h2>
      <p className="text-gray-400 mb-6">Entry point and traffic management</p>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <Card title="API Gateway" icon={<Globe className="w-5 h-5" />} color="blue">
          <ul className="space-y-2 text-sm">
            <li>• <span className="text-blue-400">REST/gRPC</span> endpoints</li>
            <li>• OpenAPI-compatible</li>
            <li>• SDK for Python/JS/Go</li>
            <li>• Web UI dashboard</li>
          </ul>
        </Card>
        <Card title="Authentication" icon={<Shield className="w-5 h-5" />} color="purple">
          <ul className="space-y-2 text-sm">
            <li>• <span className="text-purple-400">OIDC/JWT</span> validation</li>
            <li>• API key management</li>
            <li>• Team-based RBAC</li>
            <li>• Audit logging</li>
          </ul>
        </Card>
        <Card title="Rate Limiting" icon={<Gauge className="w-5 h-5" />} color="amber">
          <ul className="space-y-2 text-sm">
            <li>• <span className="text-amber-400">Token-based</span> quotas</li>
            <li>• Per-user/per-team limits</li>
            <li>• Burst allowance</li>
            <li>• Cost budget enforcement</li>
          </ul>
        </Card>
      </div>
      <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-gray-800">
        <p className="text-sm text-gray-400"><span className="text-blue-400 font-semibold">kgateway</span> (Gateway API) handles traffic management. <span className="text-purple-400 font-semibold">Bifrost</span> routes to models.</p>
      </div>
    </SlideWrapper>
  );
}
