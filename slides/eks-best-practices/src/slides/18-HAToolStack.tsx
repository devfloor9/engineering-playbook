import { SlideWrapper, CompareTable, FlowDiagram } from '@shared/components';
import { Wrench } from 'lucide-react';

export default function HAToolStackSlide() {
  const nodes = [
    { id: 'git', label: 'Git Repo', x: 20, y: 10, width: 100, height: 40, color: 'emerald' },
    { id: 'sm', label: 'Secrets Mgr', x: 150, y: 10, width: 110, height: 40, color: 'amber' },
    { id: 's3', label: 'S3 + CRR', x: 290, y: 10, width: 100, height: 40, color: 'amber' },
    { id: 'r53', label: 'Route 53', x: 420, y: 10, width: 100, height: 40, color: 'amber' },

    { id: 'a_gitops', label: 'GitOps Agent', x: 20, y: 90, width: 110, height: 35, color: 'blue' },
    { id: 'a_eso', label: 'ESO', x: 160, y: 90, width: 70, height: 35, color: 'purple' },
    { id: 'a_velero', label: 'Velero', x: 260, y: 90, width: 80, height: 35, color: 'cyan' },

    { id: 'b_gitops', label: 'GitOps Agent', x: 20, y: 160, width: 110, height: 35, color: 'blue' },
    { id: 'b_eso', label: 'ESO', x: 160, y: 160, width: 70, height: 35, color: 'purple' },
    { id: 'b_velero', label: 'Velero', x: 260, y: 160, width: 80, height: 35, color: 'cyan' },
  ];

  const edges = [
    { from: 'git', to: 'a_gitops', color: 'emerald' },
    { from: 'git', to: 'b_gitops', color: 'emerald' },
    { from: 'sm', to: 'a_eso', color: 'amber', style: 'dashed' as const },
    { from: 'sm', to: 'b_eso', color: 'amber', style: 'dashed' as const },
    { from: 'a_velero', to: 's3', color: 'cyan' },
    { from: 's3', to: 'b_velero', color: 'cyan', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Wrench className="w-12 h-12 text-cyan-400" />
        HA Companion Tool Stack
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-300 mb-2">Combined Architecture</h3>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
            <div className="text-xs text-gray-500 mb-1">Cluster A &darr;</div>
            <FlowDiagram nodes={nodes} edges={edges} width={540} height={210} />
            <div className="text-xs text-gray-500 mt-1">Cluster B &darr;</div>
          </div>
        </div>

        <div>
          <CompareTable
            headers={['Tool', 'Role']}
            rows={[
              ['Flux / ArgoCD', 'K8s object replication (GitOps)'],
              ['Route 53', 'DNS failover / load balancing'],
              ['Global Accelerator', 'Anycast IP global routing'],
              ['Velero', 'Stateful backup/restore (PV, etcd)'],
              ['External Secrets Operator', 'Secret synchronization'],
              ['Crossplane / ACK', 'AWS resource definition sync'],
            ]}
          />

          <div className="mt-4 bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-bold mb-2 text-sm">Implementation Priority</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">P0</span>
                <span className="text-gray-400">GitOps agents + Git repo design</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">P1</span>
                <span className="text-gray-400">ESO + Route 53 Health Checks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-bold">P2</span>
                <span className="text-gray-400">Velero + S3 Cross-Region Replication</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-bold">P3</span>
                <span className="text-gray-400">Crossplane/ACK (if needed)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
