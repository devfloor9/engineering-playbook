import { SlideWrapper, FlowDiagram } from '@shared/components';
import { Lock } from 'lucide-react';

export default function AuthZBestPracticesSlide() {
  const nodes = [
    { id: 'ext', label: 'AWS External Systems', x: 20, y: 20, width: 155, height: 50, color: 'blue' },
    { id: 'pod', label: 'In-Cluster Pods', x: 20, y: 90, width: 155, height: 50, color: 'emerald' },
    { id: 'user', label: 'Enterprise Users', x: 20, y: 160, width: 155, height: 50, color: 'amber' },
    { id: 'cicd', label: 'External CI/CD', x: 20, y: 230, width: 155, height: 50, color: 'purple' },
    { id: 'authn', label: 'Authentication', x: 280, y: 90, width: 130, height: 50, color: 'cyan' },
    { id: 'authz', label: 'Authorization', x: 280, y: 180, width: 130, height: 50, color: 'rose' },
    { id: 'api', label: 'kube-apiserver', x: 500, y: 130, width: 140, height: 50, color: 'gray' },
  ];

  const edges = [
    { from: 'ext', to: 'authn', label: 'IAM Role', color: 'blue' },
    { from: 'pod', to: 'authn', label: 'SA Token', color: 'emerald' },
    { from: 'user', to: 'authn', label: 'OIDC', color: 'amber' },
    { from: 'cicd', to: 'authn', label: 'TokenRequest', color: 'purple' },
    { from: 'authn', to: 'authz', color: 'cyan' },
    { from: 'authz', to: 'api', label: 'Policy + RBAC', color: 'rose' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Lock className="w-12 h-12 text-rose-400" />
        Authorization Best Practices
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={680} height={300} />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-900 rounded-xl p-5 border border-blue-500/30">
          <h3 className="text-blue-400 font-bold mb-2">Least Privilege</h3>
          <p className="text-sm text-gray-400">
            Restrict Access Policy scope to namespace. Use custom RBAC for fine-grained verb/resource control
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-emerald-500/30">
          <h3 className="text-emerald-400 font-bold mb-2">Short-Lived Credentials</h3>
          <p className="text-sm text-gray-400">
            Projected SA Token (24h), IAM Token (auto-refresh). Never use legacy SA tokens
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5 border border-amber-500/30">
          <h3 className="text-amber-400 font-bold mb-2">Audit Trail</h3>
          <p className="text-sm text-gray-400">
            Enable audit logs, track Access Entry changes via CloudTrail, automate with IaC
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Access Policy + Custom RBAC operates as a <strong className="text-gray-300">Union</strong>
      </div>
    </SlideWrapper>
  );
}
