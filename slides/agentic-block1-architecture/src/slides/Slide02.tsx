import { SlideWrapper, Card } from '@shared/components';
import { Brain, Wrench, GitBranch } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Why Agentic AI?</h2>
      <p className="text-gray-400 mb-8">The evolution from passive LLMs to autonomous agents</p>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <Card title="Agent Autonomy" icon={<Brain className="w-5 h-5" />} color="purple">
          <p className="mb-3">LLMs now make decisions independently without step-by-step human guidance.</p>
          <p className="text-sm text-purple-400 font-semibold">→ Plan, execute, adapt autonomously</p>
        </Card>
        <Card title="Tool Use" icon={<Wrench className="w-5 h-5" />} color="blue">
          <p className="mb-3">Agents call external APIs, databases, and code execution environments.</p>
          <p className="text-sm text-blue-400 font-semibold">→ Extend beyond text generation</p>
        </Card>
        <Card title="Multi-Step Reasoning" icon={<GitBranch className="w-5 h-5" />} color="emerald">
          <p className="mb-3">Complex tasks broken into subtasks with conditional logic and loops.</p>
          <p className="text-sm text-emerald-400 font-semibold">→ Solve problems requiring planning</p>
        </Card>
      </div>
      <div className="mt-6 text-center text-sm text-gray-500">
        Agentic AI = LLM + Autonomy + Tools + Workflow Orchestration
      </div>
    </SlideWrapper>
  );
}
