import { SlideWrapper, CompareTable } from '@shared/components';
import { Shield } from 'lucide-react';

export default function AuthNOverviewSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Shield className="w-12 h-12 text-emerald-400" />
        EKS API Server Authentication Methods
      </h1>

      <p className="text-gray-400 mb-6">
        EKS API Server is accessed not only by kubectl users but also by various{' '}
        <strong className="text-white">Non-Standard Callers</strong>: CI/CD, monitoring, automation tools, and more.
      </p>

      <CompareTable
        headers={['#', 'Auth Method', 'Best For', 'Recommendation']}
        rows={[
          ['1', 'IAM (aws-iam-authenticator)', 'AWS infra systems, kubectl', 'Top Priority'],
          ['2', 'EKS Pod Identity (IRSA v2)', 'Pods inside EKS cluster', 'Best for Pod workloads'],
          ['3', 'K8s ServiceAccount Token', 'In-cluster automation, CI/CD', 'Usable externally too'],
          ['4', 'External OIDC Identity Provider', 'Enterprise IdP (Okta, Azure AD)', 'Best for SSO'],
          ['5', 'x509 Client Certificate', 'Certificate-based legacy systems', 'Limited (no CRL)'],
        ]}
        highlightCol={3}
      />

      <div className="mt-8 grid grid-cols-4 gap-4">
        {[
          { label: 'AWS External Systems', method: 'IAM + Access Entry', color: 'blue' },
          { label: 'In-Cluster Pods', method: 'Pod Identity', color: 'emerald' },
          { label: 'Enterprise Users', method: 'OIDC Provider', color: 'amber' },
          { label: 'External CI/CD', method: 'TokenRequest API', color: 'purple' },
        ].map((item, i) => (
          <div key={i} className={`bg-gray-900 rounded-lg p-4 border border-${item.color}-500/30 text-center`}>
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-${item.color}-400 font-bold text-sm`}>{item.method}</p>
          </div>
        ))}
      </div>
    </SlideWrapper>
  );
}
