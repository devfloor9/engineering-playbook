import { SlideWrapper, Card } from '@shared/components';

export default function Slide12() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-orange-400">SageMaker-EKS Integration</h2>
        <p className="text-xl text-gray-300 mb-8">
          Hybrid training-serving: Managed training + Flexible serving
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-blue-400">Pattern: SageMaker Training → EKS Serving</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
              <div className="space-y-2 text-sm font-mono">
                <div className="text-blue-300">1. SageMaker Training Job</div>
                <div className="ml-4 text-gray-400">↓ Managed distributed training</div>
                <div className="text-green-300">2. Model Registry</div>
                <div className="ml-4 text-gray-400">↓ S3 artifact storage</div>
                <div className="text-purple-300">3. EKS vLLM Deployment</div>
                <div className="ml-4 text-gray-400">↓ Load from S3, serve requests</div>
                <div className="text-yellow-300">4. Auto-scaling with Karpenter</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Zero infrastructure management for training</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Spot training: up to 90% cost savings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">EKS serving: fine-grained control + cost optimization</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">Model Registry Governance</h3>
            <div className="space-y-3">
              <div className="bg-gray-900/50 p-3 rounded border-l-4 border-blue-500">
                <p className="font-semibold text-blue-400 mb-1">Staging</p>
                <p className="text-xs text-gray-400">Pending manual approval, validation in progress</p>
              </div>

              <div className="bg-gray-900/50 p-3 rounded border-l-4 border-green-500">
                <p className="font-semibold text-green-400 mb-1">Production</p>
                <p className="text-xs text-gray-400">Approved, actively served in EKS</p>
              </div>

              <div className="bg-gray-900/50 p-3 rounded border-l-4 border-orange-500">
                <p className="font-semibold text-orange-400 mb-1">Archived</p>
                <p className="text-xs text-gray-400">Deprecated, moved to S3 Glacier</p>
              </div>

              <div className="bg-blue-500/10 p-3 rounded border border-blue-500/30 text-sm">
                <p className="font-semibold text-blue-300 mb-1">Approval Workflow</p>
                <p className="text-gray-400 text-xs">
                  Auto-approve if accuracy ≥ 0.95, manual review if 0.85-0.95, reject if &lt; 0.85
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-5 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Training (SageMaker)</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• ml.g5.2xlarge × 2 (Spot)</li>
              <li>• Automatic checkpointing</li>
              <li>• Hyperparameter tuning jobs</li>
              <li>• Distributed data parallel</li>
              <li>• Cost: ~$3.20/hr (Spot)</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-purple-500/30">
            <h4 className="text-lg font-semibold mb-3 text-purple-400">Storage (S3 + ECR)</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• S3: Model artifacts</li>
              <li>• ECR: Training/inference images</li>
              <li>• Cross-region replication</li>
              <li>• Lifecycle policies</li>
              <li>• Cost: ~$50/mo</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold mb-3 text-blue-400">Serving (EKS vLLM)</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• g5.xlarge × 2-8 (Spot)</li>
              <li>• HPA: 2-8 replicas</li>
              <li>• Karpenter auto-provisioning</li>
              <li>• Gateway load balancing</li>
              <li>• Cost: ~$1.20/hr per replica</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-orange-500/10 to-blue-500/10 p-5 rounded-lg border border-orange-500/30">
          <p className="text-gray-300">
            <strong className="text-orange-400">Best Practice:</strong> Use SageMaker for infrequent, large-scale training
            (no cluster management overhead), then deploy to EKS for high-throughput, cost-optimized serving with Karpenter Spot instances.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
