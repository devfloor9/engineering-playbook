import { SlideWrapper } from '@shared/components';
import { CheckCircle2 } from 'lucide-react';

const takeaways = [
  'Agentic AI requires multi-model orchestration, not a single LLM',
  'Platform built on 6 layers: Client → Gateway → Agent → Model → Data → Observability',
  '5 critical challenges: GPU, Routing, LLMOps, Agent Safety, Model Supply Chain',
  'Two deployment paths: AWS Native (fast start) vs EKS Open (full control)',
  'AWS Native: Bedrock + AgentCore for serverless, managed experience',
  'EKS Open: Karpenter + vLLM + Bifrost for open models & cost optimization',
  'Security: 3-tier (External/Internal/Data) + Agent-specific (HITL, scope limits)',
  'Progressive journey: Start with AWS Native, expand to EKS as needed',
];

export default function Slide18() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-4 text-center">Key Takeaways</h2>
      <p className="text-gray-400 mb-6 text-center">8 essential points from Design & Architecture</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        {takeaways.map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-900 rounded-lg p-4 border border-gray-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300">{item}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">Next: Block 2 — Model Serving & GPU Management</p>
      </div>
    </SlideWrapper>
  );
}
