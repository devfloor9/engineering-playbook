import { SlideWrapper, Badge } from '@shared/components';
import { motion } from 'framer-motion';

const phases = [
  { phase: '0', label: 'PoC', color: 'gray' as const, items: ['Bedrock or Auto Mode', '15 min setup, $0 infra', 'Validate model + workflow'] },
  { phase: '1', label: 'Production', color: 'blue' as const, items: ['Auto Mode + GPU Operator', 'llm-d + KEDA autoscaling', 'Langfuse tracing'] },
  { phase: '2', label: 'Scale', color: 'purple' as const, items: ['Karpenter + MIG (2a)', 'MNG + DRA (2b)', 'Disaggregated serving, 70% cost ↓'] },
  { phase: '3', label: 'Enterprise', color: 'emerald' as const, items: ['NVIDIA Dynamo', 'Flash Indexer + SLO autoscale', '128K+ context, 3-tier KV cache'] },
];

export default function Slide19() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">Deployment Path</h2>
      <p className="text-gray-400 mb-6">Progressive journey from prototype to enterprise scale</p>

      <div className="flex gap-4 flex-1 items-start">
        {phases.map((p, i) => (
          <motion.div
            key={p.phase}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="flex-1"
          >
            <div className="flex items-center gap-2 mb-3">
              <Badge color={p.color} size="lg">Phase {p.phase}</Badge>
              <span className="text-white font-bold">{p.label}</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 h-full">
              <ul className="space-y-2">
                {p.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-gray-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        {phases.map((p, i) => (
          <div key={p.phase} className="flex items-center gap-2">
            <Badge color={p.color} size="sm">{p.label}</Badge>
            {i < phases.length - 1 && <span className="text-gray-600 text-lg">→</span>}
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
}
