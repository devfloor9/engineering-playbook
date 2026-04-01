import { SlideWrapper, FlowDiagram, Badge } from '@shared/components';

export default function Slide15() {
  const nodes = [
    { id: 'client', label: 'Client', x: 20, y: 80, width: 100, height: 45, color: 'gray' },
    { id: 'kgw', label: 'kgateway (Tier 1)', description: 'TLS, OAuth, Rate Limit', x: 170, y: 80, width: 180, height: 50, color: 'blue' },
    { id: 'bifrost', label: 'Bifrost (Tier 2)', description: 'Token control, Cascade, Cache', x: 430, y: 30, width: 180, height: 50, color: 'purple' },
    { id: 'agent', label: 'agentgateway', description: 'MCP / A2A', x: 430, y: 130, width: 180, height: 50, color: 'amber' },
    { id: 'llm', label: 'vLLM / llm-d', x: 680, y: 30, width: 120, height: 45, color: 'emerald' },
    { id: 'mcp', label: 'MCP Servers', x: 680, y: 130, width: 120, height: 45, color: 'orange' },
  ];
  const edges = [
    { from: 'client', to: 'kgw', color: 'gray' },
    { from: 'kgw', to: 'bifrost', label: '/v1/chat/*', color: 'purple' },
    { from: 'kgw', to: 'agent', label: '/mcp/*', color: 'amber' },
    { from: 'bifrost', to: 'llm', color: 'emerald' },
    { from: 'agent', to: 'mcp', color: 'orange' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">2-Tier LLM Gateway Architecture</h2>
      <p className="text-gray-400 mb-4">Separate infrastructure concerns from LLM-specific routing</p>
      <div className="flex-1 flex items-center">
        <FlowDiagram nodes={nodes} edges={edges} width={820} height={200} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
        <div className="bg-gray-900 rounded-lg p-3 border border-blue-500/30">
          <p className="text-blue-400 font-bold">Tier 1: kgateway (OSS)</p>
          <p className="text-gray-500">Gateway API, mTLS, OIDC/JWT</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-purple-500/30">
          <p className="text-purple-400 font-bold">Tier 2: Bifrost (OSS)</p>
          <p className="text-gray-500">Token rate limit, cascade, failover, semantic cache</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-emerald-500/30">
          <p className="text-emerald-400 font-bold">Result</p>
          <p className="text-gray-500">Enterprise features at zero license cost</p>
        </div>
      </div>
      <div className="mt-2 flex justify-center">
        <Badge color="amber" size="sm">kgateway Enterprise needed only for Istio Ambient Mesh integration</Badge>
      </div>
    </SlideWrapper>
  );
}
