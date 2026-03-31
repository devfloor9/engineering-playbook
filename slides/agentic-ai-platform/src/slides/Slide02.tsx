import { SlideWrapper, Card } from '@shared/components';
import { DollarSign, Timer, AlertTriangle, Shield } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">Why Single LLM Fails in Enterprise</h2>
      <p className="text-gray-400 mb-6">4 critical limitations driving the shift to multi-model</p>
      <div className="grid grid-cols-2 gap-4 flex-1">
        <Card title="Cost" icon={<DollarSign className="w-5 h-5" />} color="rose">
          <p>$30–98/hr per GPU node (p5.48xlarge).</p>
          <p className="mt-2 text-amber-400 font-semibold">40–70% of agent LLM calls are replaceable with cheaper SLMs.</p>
        </Card>
        <Card title="Performance" icon={<Timer className="w-5 h-5" />} color="amber">
          <p>LLM TTFT: 1–5 seconds.</p>
          <p>Domain SLM: ~50 ms (10× faster).</p>
          <p className="mt-2">Latency compounds across multi-step agent workflows.</p>
        </Card>
        <Card title="Accuracy" icon={<AlertTriangle className="w-5 h-5" />} color="purple">
          <p>Hallucination is endemic to transformers.</p>
          <p className="mt-2">Fails on arithmetic, logic, and structured outputs — needs tool delegation.</p>
        </Card>
        <Card title="Governance" icon={<Shield className="w-5 h-5" />} color="blue">
          <p>PII leakage to external APIs.</p>
          <p>No audit trails, no per-team cost control.</p>
          <p className="mt-2">Regulatory compliance gaps.</p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
