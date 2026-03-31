import { SlideWrapper } from '@shared/components';
import { Layers, Network, Route, Zap, DollarSign, Database, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const takeaways = [
  { icon: Layers, text: 'Multi-Model > Single LLM — cost, latency, accuracy, governance', color: 'text-blue-400' },
  { icon: CheckCircle, text: 'K8s native (DRA, Gateway API, Karpenter) = production baseline', color: 'text-emerald-400' },
  { icon: Network, text: '2-Tier Gateway separates infrastructure from LLM concerns', color: 'text-purple-400' },
  { icon: Zap, text: 'llm-d KV Cache-aware routing = 50% latency reduction', color: 'text-amber-400' },
  { icon: DollarSign, text: 'Cascade routing + Spot = 70–85% cost savings', color: 'text-rose-400' },
  { icon: Database, text: 'Semantic caching = 30% additional savings (threshold 0.85)', color: 'text-cyan-400' },
  { icon: ArrowRight, text: 'Start Auto Mode → Scale Karpenter → Enterprise Dynamo', color: 'text-orange-400' },
  { icon: Route, text: 'DRA GA in K8s 1.34 — MNG required now, Karpenter upcoming', color: 'text-gray-400' },
];

export default function Slide20() {
  return (
    <SlideWrapper className="items-center justify-center">
      <h2 className="text-3xl font-bold mb-8">Key Takeaways</h2>
      <div className="grid grid-cols-2 gap-4 max-w-4xl w-full mb-8">
        {takeaways.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 bg-gray-900 rounded-lg p-3 border border-gray-800"
          >
            <t.icon className={`w-5 h-5 mt-0.5 shrink-0 ${t.color}`} />
            <p className="text-sm text-gray-300">{t.text}</p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center"
      >
        <p className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
          Start building today.
        </p>
        <p className="text-sm text-gray-500">
          devfloor9.github.io/engineering-playbook
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
