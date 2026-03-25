import { SlideWrapper, Badge } from '@shared/components';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TakeawaysSlide() {
  const takeaways = [
    {
      title: 'PCP XL+ for etcd Expansion',
      desc: 'Expand etcd DB to 20GB to address the first bottleneck for CRD platforms. Get Event Sharding + 99.99% SLA',
      color: 'blue',
    },
    {
      title: '4-Channel Monitoring Rollout',
      desc: 'CloudWatch Vended Metrics → Prometheus Endpoint → Control Plane Logging → Cluster Insights',
      color: 'cyan',
    },
    {
      title: 'CRD Controller Optimization',
      desc: 'SharedInformer, paginated List, Exponential Backoff. CP Load = Types x Size x Pattern',
      color: 'purple',
    },
    {
      title: 'Access Entry + Pod Identity',
      desc: 'Move away from aws-auth ConfigMap → API mode. External systems use IAM+Access Entry, Pods use Pod Identity',
      color: 'emerald',
    },
    {
      title: 'Agent Pull Model (GitOps)',
      desc: 'Flux/ArgoCD agents independently Pull & Reconcile from Git. Scales to hundreds of clusters with built-in Drift Detection',
      color: 'amber',
    },
    {
      title: 'HA = GitOps + Companion Stack',
      desc: 'GitOps + Route 53 + Velero + ESO for Cross-Cluster HA. Choose Active-Active/Passive per workload type',
      color: 'rose',
    },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-10 flex items-center gap-4">
        <Lightbulb className="w-12 h-12 text-amber-400" />
        Key Takeaways
      </h1>

      <div className="grid grid-cols-2 gap-5">
        {takeaways.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-900 rounded-xl p-5 border border-gray-700/50 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3 mb-2">
              <CheckCircle className={`w-5 h-5 text-${item.color}-400 flex-shrink-0 mt-1`} />
              <h3 className={`text-base font-bold text-${item.color}-400`}>{item.title}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed pl-8">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Badge color="blue">EKS 1.32+</Badge>
        <Badge color="emerald">Provisioned Control Plane (GA)</Badge>
        <Badge color="amber">ArgoCD 2.13+ / Flux v2.4+</Badge>
      </div>
    </SlideWrapper>
  );
}
