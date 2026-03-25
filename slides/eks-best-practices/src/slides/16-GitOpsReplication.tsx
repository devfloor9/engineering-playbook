import { SlideWrapper, FlowDiagram, Card } from '@shared/components';
import { GitBranch } from 'lucide-react';

export default function GitOpsReplicationSlide() {
  const nodes = [
    { id: 'git', label: 'Git Repository', x: 250, y: 10, width: 160, height: 50, color: 'emerald', description: 'Single Source of Truth' },
    { id: 'flux_a', label: 'Flux / ArgoCD', x: 80, y: 120, width: 140, height: 45, color: 'blue', description: 'Agent (Cluster A)' },
    { id: 'flux_b', label: 'Flux / ArgoCD', x: 420, y: 120, width: 140, height: 45, color: 'blue', description: 'Agent (Cluster B)' },
    { id: 'res_a', label: 'K8s Resources', x: 80, y: 200, width: 140, height: 40, color: 'cyan' },
    { id: 'res_b', label: 'K8s Resources', x: 420, y: 200, width: 140, height: 40, color: 'cyan' },
  ];

  const edges = [
    { from: 'git', to: 'flux_a', label: 'Pull', color: 'emerald', style: 'dashed' as const },
    { from: 'git', to: 'flux_b', label: 'Pull', color: 'emerald', style: 'dashed' as const },
    { from: 'flux_a', to: 'res_a', label: 'Reconcile', color: 'blue' },
    { from: 'flux_b', to: 'res_b', label: 'Reconcile', color: 'blue' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <GitBranch className="w-12 h-12 text-emerald-400" />
        GitOps-Based Object Replication
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={650} height={260} />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card title="Key Benefits" icon={<GitBranch className="w-5 h-5" />} color="emerald">
          <ul className="space-y-1">
            <li>Drift Detection: auto-remediate if state diverges from Git</li>
            <li>Audit Trail: every change is a Git commit</li>
            <li>Fault Isolation: agents operate independently</li>
            <li>Declarative: define desired state, agents reconcile</li>
          </ul>
        </Card>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-blue-400 font-bold mb-2">ArgoCD Hub-and-Spoke</h3>
            <p className="text-sm text-gray-400">
              Install ArgoCD on management cluster. Cluster Generator in ApplicationSets for auto-deploy.
              Sync Windows to prevent Active-Active conflicts
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-amber-500/30">
            <h3 className="text-amber-400 font-bold mb-2">Custom MirrorController</h3>
            <p className="text-sm text-gray-400">
              When fine-grained replication control is needed. Selective label replication, object transformation, custom conflict resolution
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
