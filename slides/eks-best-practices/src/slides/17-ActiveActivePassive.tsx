import { SlideWrapper, CompareTable } from '@shared/components';
import { ToggleLeft } from 'lucide-react';

export default function ActiveActivePassiveSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <ToggleLeft className="w-12 h-12 text-cyan-400" />
        Active-Active vs Active-Passive
      </h1>

      <CompareTable
        headers={['Aspect', 'Active-Active', 'Active-Passive']}
        rows={[
          ['Object Sync', 'Both clusters pull independently', 'Only active reconciles'],
          ['Failover Time', 'Near-zero (both serving)', 'Minutes (activate passive)'],
          ['Conflict Resolution', 'Needs Sync Windows or similar', 'No conflicts (single writer)'],
          ['Operational Complexity', 'High', 'Low'],
          ['Cost', 'High (both at full capacity)', 'Low (passive scaled down)'],
          ['Best For', 'Multi-region HA, global LB', 'DR, cost-sensitive HA'],
        ]}
      />

      <h3 className="text-xl font-bold text-white mt-8 mb-4">Recommended Mode by Workload Type</h3>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center">
          <h4 className="text-emerald-400 font-bold text-lg mb-2">Stateless</h4>
          <p className="text-gray-400 text-sm mb-3">API, Web</p>
          <div className="bg-emerald-500/20 rounded-lg py-2 px-4">
            <span className="text-emerald-300 font-bold">Active-Active</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">GitOps + Route 53</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-center">
          <h4 className="text-amber-400 font-bold text-lg mb-2">Stateful</h4>
          <p className="text-gray-400 text-sm mb-3">DB, Cache</p>
          <div className="bg-amber-500/20 rounded-lg py-2 px-4">
            <span className="text-amber-300 font-bold">Active-Passive</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">GitOps + Velero</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 text-center">
          <h4 className="text-blue-400 font-bold text-lg mb-2">AI/ML Inference</h4>
          <p className="text-gray-400 text-sm mb-3">vLLM, TGI</p>
          <div className="bg-blue-500/20 rounded-lg py-2 px-4">
            <span className="text-blue-300 font-bold">Active-Active</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">GitOps + S3 Model Sync</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
