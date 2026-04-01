import { SlideWrapper, Card } from '@shared/components';
import { DollarSign, Timer, Target, Shield } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Single LLM Limitations</h2>
      <p className="text-gray-400 mb-6">Why a single large model is insufficient for enterprise</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <Card title="Cost Explosion" icon={<DollarSign className="w-5 h-5" />} color="rose">
          <p>70B+ models cost $30-98/hr per GPU node.</p>
          <p className="mt-2 text-rose-400 font-semibold">40-70% of agent calls are simple enough for SLMs.</p>
          <p className="mt-2 text-sm text-gray-500">Tool formatting, validation, routing — don't need frontier models.</p>
        </Card>
        <Card title="Performance Bottleneck" icon={<Timer className="w-5 h-5" />} color="amber">
          <p>LLM TTFT: 1-5 seconds.</p>
          <p>Domain-tuned SLM: ~50ms (10× faster).</p>
          <p className="mt-2 text-amber-400 font-semibold">Latency compounds in multi-step workflows.</p>
        </Card>
        <Card title="Accuracy Gaps" icon={<Target className="w-5 h-5" />} color="purple">
          <p>Hallucination is inherent to transformers.</p>
          <p className="mt-2">Poor at arithmetic, logic, and structured data.</p>
          <p className="mt-2 text-purple-400 font-semibold">Must delegate to rule engines and knowledge graphs.</p>
        </Card>
        <Card title="Governance Risks" icon={<Shield className="w-5 h-5" />} color="blue">
          <p>PII leakage to external APIs.</p>
          <p>No audit trails or per-team cost control.</p>
          <p className="mt-2 text-blue-400 font-semibold">Regulatory compliance gaps in finance/healthcare.</p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
