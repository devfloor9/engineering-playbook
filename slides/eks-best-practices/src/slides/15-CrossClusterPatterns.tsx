import { SlideWrapper, CompareTable } from '@shared/components';
import { Network } from 'lucide-react';

export default function CrossClusterPatternsSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Network className="w-12 h-12 text-amber-400" />
        Cross-Cluster Replication Patterns
      </h1>

      <p className="text-gray-400 mb-6">
        EKS does not offer managed Cross-Cluster Replication.
        Implement using <strong className="text-white">open-source tools and architecture patterns</strong>.
      </p>

      <CompareTable
        headers={['Aspect', 'API Proxy (Push)', 'Multi-cluster Controller', 'Agent Pull (Recommended)']}
        rows={[
          ['How It Works', 'Central → Cluster Push', 'Central Watch + CRD Sync', 'Cluster → Central Pull'],
          ['Scalability', 'Low (per connection)', 'Medium (~10 clusters)', 'High (hundreds of clusters)'],
          ['Complexity', 'Low', 'High', 'Medium'],
          ['Security', 'Weak (many credentials)', 'Weak (plaintext storage)', 'Strong (local agent auth)'],
          ['Fault Isolation', 'Low', 'Medium', 'High'],
          ['Drift Detection', 'None', 'Partial', 'Built-in'],
          ['Best For', 'PoC, small scale', 'Legacy environments', 'Production (recommended)'],
        ]}
        highlightCol={3}
      />

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-3xl mb-2">1</div>
          <p className="text-amber-400 font-bold text-sm">API Proxy</p>
          <p className="text-xs text-gray-500">Lightweight, intuitive, non-scalable</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-3xl mb-2">2</div>
          <p className="text-purple-400 font-bold text-sm">Kubefed (Maintenance Mode)</p>
          <p className="text-xs text-gray-500">Watch overflow limitations</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30 text-center">
          <div className="text-3xl mb-2">3</div>
          <p className="text-emerald-400 font-bold text-sm">Agent Pull (GitOps)</p>
          <p className="text-xs text-gray-500">Production recommended</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
