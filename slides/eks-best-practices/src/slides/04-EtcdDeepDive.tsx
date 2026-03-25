import { SlideWrapper, CompareTable } from '@shared/components';
import { Database, AlertTriangle } from 'lucide-react';

export default function EtcdDeepDiveSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <Database className="w-12 h-12 text-purple-400" />
        etcd Deep Dive
      </h1>

      <CompareTable
        headers={['Characteristic', 'Description', 'CRD Impact']}
        rows={[
          ['DB Size Limit', 'Standard 10GB / XL+ 20GB', 'DB grows with CRD object count'],
          ['Request Size Limit', 'Single object max 1.5MB', 'Large CR specs may approach limit'],
          ['Watch Stream', 'Real-time change propagation', 'More CRD controllers = more load'],
          ['RAFT Consensus', 'Majority agreement for writes', 'Write-heavy CRD patterns cause latency'],
        ]}
        highlightCol={2}
      />

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-purple-400 font-bold mb-3">etcd DB Size Limits</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Standard Tier</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-amber-500 rounded-full" />
                </div>
                <span className="text-amber-400 font-mono text-sm">10GB</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">XL+ Tiers</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 rounded-full" />
                </div>
                <span className="text-emerald-400 font-mono text-sm">20GB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-amber-400 font-bold mb-2">Key Insight</h3>
              <p className="text-sm text-gray-300">
                In Standard tier, etcd DB Size is <strong className="text-white">always fixed at 10GB</strong>.
                Even if VAS scales up CPU/Memory, etcd capacity does not increase.
                This is the first bottleneck for CRD platforms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
