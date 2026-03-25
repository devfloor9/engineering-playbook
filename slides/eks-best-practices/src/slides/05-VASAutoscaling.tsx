import { SlideWrapper, CompareTable } from '@shared/components';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VASAutoscalingSlide() {
  const ladder = [
    { cpu: '2', color: 'bg-blue-500/30', width: 'w-1/7' },
    { cpu: '4', color: 'bg-blue-500/40', width: 'w-2/7' },
    { cpu: '8', color: 'bg-blue-500/50', width: 'w-3/7' },
    { cpu: '16', color: 'bg-blue-500/60', width: 'w-4/7' },
    { cpu: '32', color: 'bg-blue-500/70', width: 'w-5/7' },
    { cpu: '64', color: 'bg-amber-500/50', width: 'w-6/7' },
    { cpu: '96', color: 'bg-amber-500/70', width: 'w-full' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <TrendingUp className="w-12 h-12 text-blue-400" />
        VAS Autoscaling
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-blue-400 mb-4">Instance Bundle Ladder</h3>
          <div className="space-y-2">
            {ladder.map((item, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="text-gray-400 font-mono text-sm w-16 text-right">{item.cpu} vCPU</span>
                <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full ${item.width} flex items-center justify-end pr-2`}>
                    {i === 4 && <span className="text-xs text-white font-bold">Standard Max</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-gray-300 font-bold mb-2">Scaling Policy</h4>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-gray-400">Scale Up: CPU/Mem &gt;80% immediate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-gray-400">Scale Down: &lt;30% 1hr cooldown</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-blue-400 mb-4">VAS Evaluation Metrics (every 3 min)</h3>
          <CompareTable
            headers={['Signal Source', 'Metric']}
            rows={[
              ['EC2 Internal', 'CPU / Memory Utilization'],
              ['K8s Metrics', 'Inflight Requests'],
              ['K8s Metrics', 'Scheduler QPS'],
              ['K8s Metrics', 'etcd DB Size'],
              ['Data Plane', 'Worker Node Count'],
            ]}
          />
        </div>
      </div>
    </SlideWrapper>
  );
}
