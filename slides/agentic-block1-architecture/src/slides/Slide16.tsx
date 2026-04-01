import { SlideWrapper, Card } from '@shared/components';
import { AlertTriangle, Lock, Clock } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Agent-Specific Security</h2>
      <p className="text-gray-400 mb-6">Unique challenges in autonomous agent systems</p>
      <div className="grid grid-cols-3 gap-6 flex-1">
        <Card title="Tool Poisoning Defense" icon={<AlertTriangle className="w-5 h-5" />} color="rose">
          <p className="mb-3 text-sm">Malicious inputs can trick agents into calling unintended tools.</p>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded p-2 text-xs">
            <p className="text-rose-400 font-semibold mb-1">Mitigation:</p>
            <ul className="space-y-1 text-gray-400">
              <li>• NeMo Guardrails input filtering</li>
              <li>• Tool whitelist per agent</li>
              <li>• Prompt injection detection</li>
            </ul>
          </div>
        </Card>
        <Card title="Scope Limits" icon={<Lock className="w-5 h-5" />} color="purple">
          <p className="mb-3 text-sm">Agents must have least-privilege access to tools and data.</p>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-xs">
            <p className="text-purple-400 font-semibold mb-1">Enforcement:</p>
            <ul className="space-y-1 text-gray-400">
              <li>• RBAC for tool permissions</li>
              <li>• Data partition isolation</li>
              <li>• Network policy restrictions</li>
            </ul>
          </div>
        </Card>
        <Card title="Human-in-the-Loop (HITL)" icon={<Clock className="w-5 h-5" />} color="blue">
          <p className="mb-3 text-sm">High-risk actions require human approval gates.</p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-xs">
            <p className="text-blue-400 font-semibold mb-1">Examples:</p>
            <ul className="space-y-1 text-gray-400">
              <li>• Financial transactions &gt; $10K</li>
              <li>• Data deletion operations</li>
              <li>• External API writes</li>
            </ul>
          </div>
        </Card>
      </div>
      <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-amber-500/30">
        <p className="text-sm text-amber-400 font-semibold">PII Leakage Prevention</p>
        <p className="text-sm text-gray-400 mt-1">Output filtering strips SSN, credit cards, emails before returning to user.</p>
      </div>
    </SlideWrapper>
  );
}
