import { SlideWrapper, Card } from '@shared/components';
import { Cpu, Route, Eye, Bot, Package } from 'lucide-react';

const challenges = [
  { title: 'GPU Management', desc: 'High cost, dynamic workloads, multi-tenant contention', icon: Cpu, color: 'rose' as const },
  { title: 'Intelligent Routing', desc: 'KV Cache awareness, cascade routing, multi-provider failover', icon: Route, color: 'blue' as const },
  { title: 'LLMOps Observability', desc: 'Token-level cost tracking, Agent trace debugging, quality monitoring', icon: Eye, color: 'purple' as const },
  { title: 'Agent Orchestration', desc: 'Autonomous behavior, prompt injection, state management', icon: Bot, color: 'amber' as const },
  { title: 'Model Supply Chain', desc: 'Version management, distributed training, evaluation pipelines', icon: Package, color: 'emerald' as const },
];

export default function Slide07() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">5 Critical Challenges</h2>
      <p className="text-gray-400 mb-6">Key obstacles to building production Agentic AI platforms</p>
      <div className="grid grid-cols-5 gap-3 flex-1 items-start">
        {challenges.map((c) => (
          <Card key={c.title} title={c.title} icon={<c.icon className="w-5 h-5" />} color={c.color} className="h-full">
            <p className="text-xs">{c.desc}</p>
          </Card>
        ))}
      </div>
    </SlideWrapper>
  );
}
