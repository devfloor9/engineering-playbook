import { SlideWrapper, Card } from '@shared/components';
import { ArrowDownRight, Database, DollarSign, Minimize } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">Cost Optimization: 4 Levers</h2>
      <p className="text-gray-400 mb-6">Combined savings: $50K/month → $5–7K/month</p>
      <div className="grid grid-cols-4 gap-4 flex-1 items-start">
        <Card title="Cascade Routing" icon={<ArrowDownRight className="w-5 h-5" />} color="emerald">
          <p className="text-3xl font-extrabold text-emerald-400 my-2">73%</p>
          <p>Route cheap → medium → premium by complexity</p>
        </Card>
        <Card title="Semantic Cache" icon={<Database className="w-5 h-5" />} color="blue">
          <p className="text-3xl font-extrabold text-blue-400 my-2">30%</p>
          <p>Threshold 0.85 similarity — 30% hit rate in production</p>
        </Card>
        <Card title="Spot Instances" icon={<DollarSign className="w-5 h-5" />} color="amber">
          <p className="text-3xl font-extrabold text-amber-400 my-2">67%</p>
          <p>Karpenter-managed Spot for inference workloads</p>
        </Card>
        <Card title="Right-sizing" icon={<Minimize className="w-5 h-5" />} color="purple">
          <p className="text-3xl font-extrabold text-purple-400 my-2">98×</p>
          <p>7B model: g5.xlarge ($1/hr) vs p5.48xlarge ($98/hr)</p>
        </Card>
      </div>
      <div className="mt-4 text-center bg-gray-900 rounded-lg p-3 border border-emerald-500/30">
        <span className="text-emerald-400 font-bold">Combined Effect: </span>
        <span className="text-gray-300">$50,000/mo (all GPT-4) → $5,000–$7,000/mo (optimized stack)</span>
      </div>
    </SlideWrapper>
  );
}
