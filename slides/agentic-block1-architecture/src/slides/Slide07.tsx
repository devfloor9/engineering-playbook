import { SlideWrapper, Card } from '@shared/components';
import { Bot, Workflow, Wrench, Database } from 'lucide-react';

export default function Slide07() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Agent Layer</h2>
      <p className="text-gray-400 mb-6">Autonomous execution and orchestration</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <Card title="LangGraph Workflow" icon={<Workflow className="w-5 h-5" />} color="purple">
          <ul className="space-y-2 text-sm">
            <li>• Multi-step agent workflows</li>
            <li>• Conditional branching</li>
            <li>• State checkpointing</li>
            <li>• Human-in-the-loop gates</li>
          </ul>
        </Card>
        <Card title="MCP / A2A Protocols" icon={<Bot className="w-5 h-5" />} color="blue">
          <ul className="space-y-2 text-sm">
            <li>• <span className="text-blue-400">MCP</span>: Agent ↔ Tool connections</li>
            <li>• <span className="text-purple-400">A2A</span>: Agent ↔ Agent communication</li>
            <li>• Standardized schemas</li>
            <li>• Multi-agent collaboration</li>
          </ul>
        </Card>
        <Card title="Tool Registry" icon={<Wrench className="w-5 h-5" />} color="amber">
          <ul className="space-y-2 text-sm">
            <li>• Centralized tool catalog</li>
            <li>• API, Search, Code, A2A tools</li>
            <li>• Per-agent scope limits</li>
            <li>• Execution timeouts</li>
          </ul>
        </Card>
        <Card title="Memory Manager" icon={<Database className="w-5 h-5" />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li>• Short-term: Redis session state</li>
            <li>• Long-term: Vector DB for context</li>
            <li>• Conversation history</li>
            <li>• Tool call audit trail</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
