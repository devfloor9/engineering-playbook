import { SlideWrapper, CompareTable } from '@shared/components';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CRDBestPracticesSlide() {
  const practices = [
    { title: 'Minimize Object Size', desc: 'Keep CR spec small. Offload large data to external storage references', color: 'blue' },
    { title: 'Manage CRD Count', desc: 'Consolidate similar resources. Clean up unused CRDs to reduce Watch load', color: 'emerald' },
    { title: 'Stay on Latest K8s', desc: 'K8s 1.33+ Streaming List dramatically improves large List performance', color: 'amber' },
    { title: 'Cluster Separation', desc: 'Separate core CRD cluster from workload execution cluster', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <CheckCircle className="w-12 h-12 text-emerald-400" />
        CRD Design Best Practices
      </h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {practices.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gray-900 rounded-xl p-5 border border-${p.color}-500/30`}
          >
            <h3 className={`text-${p.color}-400 font-bold mb-2`}>{p.title}</h3>
            <p className="text-sm text-gray-400">{p.desc}</p>
          </motion.div>
        ))}
      </div>

      <h3 className="text-xl font-bold text-white mb-4">Controller Pattern Optimization</h3>
      <CompareTable
        headers={['Pattern', 'Correct Usage', 'Anti-Pattern']}
        rows={[
          ['Watch resourceVersion', 'Use resourceVersion correctly', 'resourceVersion="" (full re-list)'],
          ['List Calls', 'Always use pagination', 'Fetch entire list at once'],
          ['Informer', 'SharedInformer pattern', 'Independent Watch per controller'],
          ['Reconnection', 'Exponential Backoff', 'Immediate retry (thundering herd)'],
        ]}
        highlightCol={1}
      />
    </SlideWrapper>
  );
}
