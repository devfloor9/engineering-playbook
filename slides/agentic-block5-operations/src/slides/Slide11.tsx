import { SlideWrapper, Card } from '@shared/components';

export default function Slide11() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">MLOps Pipeline</h2>
        <p className="text-xl text-gray-300 mb-8">
          Kubeflow Pipelines + MLflow + KServe on EKS
        </p>

        <div className="mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">End-to-End ML Lifecycle</h3>
            <div className="bg-gray-900/50 p-6 rounded-lg">
              <div className="grid grid-cols-6 gap-2 text-center text-sm">
                <div>
                  <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-500/50 mb-2">
                    <div className="text-2xl mb-1">📊</div>
                    <p className="font-semibold text-blue-400">Data Prep</p>
                  </div>
                  <p className="text-xs text-gray-400">S3 ingestion</p>
                </div>
                <div className="flex items-center justify-center text-blue-400 text-xl">→</div>
                <div>
                  <div className="bg-green-500/20 rounded-lg p-3 border border-green-500/50 mb-2">
                    <div className="text-2xl mb-1">🔧</div>
                    <p className="font-semibold text-green-400">Feature Eng</p>
                  </div>
                  <p className="text-xs text-gray-400">Transform</p>
                </div>
                <div className="flex items-center justify-center text-green-400 text-xl">→</div>
                <div>
                  <div className="bg-yellow-500/20 rounded-lg p-3 border border-yellow-500/50 mb-2">
                    <div className="text-2xl mb-1">🎯</div>
                    <p className="font-semibold text-yellow-400">Training</p>
                  </div>
                  <p className="text-xs text-gray-400">GPU nodes</p>
                </div>
                <div className="flex items-center justify-center text-yellow-400 text-xl">→</div>
              </div>
              <div className="grid grid-cols-6 gap-2 text-center text-sm mt-4">
                <div>
                  <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-500/50 mb-2">
                    <div className="text-2xl mb-1">📈</div>
                    <p className="font-semibold text-purple-400">Evaluation</p>
                  </div>
                  <p className="text-xs text-gray-400">Metrics</p>
                </div>
                <div className="flex items-center justify-center text-purple-400 text-xl">→</div>
                <div>
                  <div className="bg-orange-500/20 rounded-lg p-3 border border-orange-500/50 mb-2">
                    <div className="text-2xl mb-1">📦</div>
                    <p className="font-semibold text-orange-400">Registry</p>
                  </div>
                  <p className="text-xs text-gray-400">MLflow</p>
                </div>
                <div className="flex items-center justify-center text-orange-400 text-xl">→</div>
                <div>
                  <div className="bg-pink-500/20 rounded-lg p-3 border border-pink-500/50 mb-2">
                    <div className="text-2xl mb-1">🚀</div>
                    <p className="font-semibold text-pink-400">Deploy</p>
                  </div>
                  <p className="text-xs text-gray-400">vLLM</p>
                </div>
                <div className="flex items-center justify-center text-pink-400 text-xl">→</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card>
            <h3 className="text-xl font-semibold mb-3 text-blue-400">Kubeflow Pipelines</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Reusable Components</p>
                  <p className="text-xs text-gray-400">Python decorator-based definition</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Argo Workflows</p>
                  <p className="text-xs text-gray-400">Kubernetes-native orchestration</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">GPU Scheduling</p>
                  <p className="text-xs text-gray-400">Karpenter auto-provisioning</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-3 text-purple-400">MLflow Registry</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-purple-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Experiment Tracking</p>
                  <p className="text-xs text-gray-400">Params, metrics, artifacts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Model Versioning</p>
                  <p className="text-xs text-gray-400">Staging → Production lifecycle</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">S3 Artifacts</p>
                  <p className="text-xs text-gray-400">Centralized model storage</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-3 text-green-400">vLLM Serving</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">High Throughput</p>
                  <p className="text-xs text-gray-400">PagedAttention, continuous batching</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Prefix Caching</p>
                  <p className="text-xs text-gray-400">30-40% latency reduction</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">▸</span>
                <div>
                  <p className="font-semibold text-gray-200">Multi-GPU</p>
                  <p className="text-xs text-gray-400">Tensor parallelism for large models</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-5 rounded-lg border border-blue-500/30">
          <p className="text-gray-300">
            <strong className="text-blue-400">Key Benefit:</strong> Unified Kubernetes platform for training + serving.
            No vendor lock-in, full GitOps control, cost-optimized GPU usage with Karpenter Spot instances.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
