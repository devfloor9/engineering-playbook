import { SlideWrapper, CodeBlock } from '@shared/components';
import { Fingerprint } from 'lucide-react';

export default function PodIdentitySlide() {
  const code = `# Create Pod Identity Association
aws eks create-pod-identity-association \\
    --cluster-name prod \\
    --namespace app-system \\
    --service-account app-controller \\
    --role-arn arn:aws:iam::<account-id>:role/controller-role`;

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Fingerprint className="w-12 h-12 text-emerald-400" />
        EKS Pod Identity (IRSA v2)
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-emerald-400 mb-4">CASE B: In-Cluster Pods</h3>
          <CodeBlock language="bash" code={code} />

          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <h3 className="text-emerald-400 font-bold mb-3">Improvements over IRSA v1</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>No IAM OIDC Provider needed</li>
              <li>Global 100-provider limit resolved</li>
              <li>Automatic Session Tags (ABAC support)</li>
              <li>Cross-account Role Chaining</li>
              <li>Up to 5,000 associations per cluster</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
            <h3 className="text-white font-bold mb-3">Session Tags (Automatic)</h3>
            <div className="space-y-2 text-sm font-mono">
              {[
                'eks-cluster-name',
                'kubernetes-namespace',
                'kubernetes-pod-name',
                'kubernetes-service-account',
              ].map((tag, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-800 rounded p-2">
                  <span className="text-emerald-400">{tag}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
            <h3 className="text-white font-bold mb-3">Trust Policy (Simplified)</h3>
            <div className="bg-gray-800 rounded p-3 text-sm font-mono text-gray-300">
              <span className="text-purple-400">Service:</span> pods.eks.amazonaws.com
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Single service principal only (no complex IRSA v1 Conditions)
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
