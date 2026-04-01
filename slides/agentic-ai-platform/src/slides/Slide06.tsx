import { SlideWrapper, Badge } from '@shared/components';
import { Shield, Lock, Key, Globe, Bot, Cpu, Database, Eye } from 'lucide-react';

const namespaces = [
  { name: 'ai-gateway', desc: 'Inference Gateway, Auth, Rate Limiting', color: 'blue' as const, icon: Globe },
  { name: 'ai-agents', desc: 'Agent Controller, Agent Pods, Tool Registry', color: 'purple' as const, icon: Bot },
  { name: 'ai-inference', desc: 'LLM Serving (vLLM/llm-d), GPU Nodes', color: 'amber' as const, icon: Cpu },
  { name: 'ai-data', desc: 'Vector DB, Cache, Storage', color: 'emerald' as const, icon: Database },
  { name: 'observability', desc: 'Tracing, Metrics, Dashboard', color: 'rose' as const, icon: Eye },
];

const security = [
  { tier: 'External', desc: 'OIDC / JWT Authentication', icon: Shield, color: 'text-blue-400' },
  { tier: 'Internal', desc: 'mTLS, RBAC, NetworkPolicy', icon: Lock, color: 'text-purple-400' },
  { tier: 'Data', desc: 'Encryption at rest, Secrets Mgmt', icon: Key, color: 'text-emerald-400' },
];

export default function Slide06() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Namespace & Security Architecture</h2>
      <p className="text-gray-400 mb-6">Isolation by concern + 3-tier defense-in-depth</p>
      <div className="grid grid-cols-2 gap-8 flex-1">
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-4">Namespace Isolation</h3>
          <div className="space-y-3">
            {namespaces.map((ns) => (
              <div key={ns.name} className="flex items-center gap-3 bg-gray-900 rounded-lg p-3 border border-gray-800">
                <Badge color={ns.color} size="sm"><ns.icon className="w-3.5 h-3.5" /></Badge>
                <div>
                  <p className="text-sm font-semibold text-white">{ns.name}</p>
                  <p className="text-xs text-gray-500">{ns.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-4">3-Tier Security</h3>
          <div className="space-y-4">
            {security.map((s) => (
              <div key={s.tier} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className={`font-bold ${s.color}`}>{s.tier}</span>
                </div>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-amber-500/30">
            <p className="text-xs text-amber-400 font-semibold">Agent-Specific Security</p>
            <p className="text-xs text-gray-500 mt-1">Tool poisoning prevention, per-tool scope limits, execution timeouts</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
