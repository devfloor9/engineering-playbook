import { SlideWrapper, CodeBlock } from '@shared/components';
import { Key } from 'lucide-react';

export default function AccessEntrySlide() {
  const code = `# 1. Set Authentication Mode
aws eks update-cluster-config --name prod \\
    --access-config '{"authenticationMode": "API_AND_CONFIG_MAP"}'

# 2. Create Access Entry
aws eks create-access-entry \\
    --cluster-name prod \\
    --principal-arn arn:aws:iam::012345678910:role/ci-role \\
    --type STANDARD

# 3. Associate Access Policy (namespace scope)
aws eks associate-access-policy \\
    --cluster-name prod \\
    --principal-arn arn:aws:iam::012345678910:role/ci-role \\
    --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSViewPolicy \\
    --access-scope '{"type":"namespace","namespaces":["monitoring"]}'`;

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Key className="w-12 h-12 text-blue-400" />
        IAM + Access Entry
      </h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold text-blue-400 mb-4">CASE A: External Systems on AWS</h3>
          <CodeBlock language="bash" code={code} />
        </div>

        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
            <h3 className="text-blue-400 font-bold mb-3">Advantages</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>IaC compatible (CloudFormation, Terraform)</li>
              <li>Fine-grained control via IAM Condition Keys</li>
              <li>Namespace / Cluster scope restriction</li>
              <li>CloudTrail audit trail</li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
            <h3 className="text-white font-bold mb-3">5 EKS Access Policies</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-rose-400">ClusterAdmin</span>
              <span className="text-gray-500">Full cluster admin</span>
              <span className="text-amber-400">Admin</span>
              <span className="text-gray-500">Namespace admin</span>
              <span className="text-emerald-400">Edit</span>
              <span className="text-gray-500">Create/modify resources</span>
              <span className="text-blue-400">View</span>
              <span className="text-gray-500">Read-only</span>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
