import { SlideWrapper, Card } from '@shared/components';

export default function Slide15() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">Deployment Path</h2>
        <p className="text-xl text-gray-300 mb-8">
          Phase 0 → 1 → 2 → 3 progressive rollout timeline
        </p>

        <div className="space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                0
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-semibold text-blue-400">Phase 0: Foundation</h3>
                  <span className="text-sm bg-blue-500/20 px-3 py-1 rounded-full text-blue-300">Week 1-2</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Infrastructure</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• EKS cluster setup</li>
                      <li>• GPU Operator install</li>
                      <li>• Karpenter NodePools</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Observability</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Prometheus + Grafana</li>
                      <li>• DCGM Exporter</li>
                      <li>• Basic dashboards</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Security</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• VPC + Security Groups</li>
                      <li>• IAM roles (IRSA)</li>
                      <li>• Secrets Manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-semibold text-green-400">Phase 1: Model Serving</h3>
                  <span className="text-sm bg-green-500/20 px-3 py-1 rounded-full text-green-300">Week 3-4</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">vLLM Deployment</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• First model (gpt-4o-mini)</li>
                      <li>• HPA (2-8 replicas)</li>
                      <li>• Load balancer</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Gateway</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Bifrost Gateway</li>
                      <li>• Rate limiting</li>
                      <li>• API key auth</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Testing</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Load test (100 req/s)</li>
                      <li>• Latency validation</li>
                      <li>• Error rate check</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-semibold text-purple-400">Phase 2: LLMOps</h3>
                  <span className="text-sm bg-purple-500/20 px-3 py-1 rounded-full text-purple-300">Week 5-8</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Observability</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Langfuse self-hosted</li>
                      <li>• Agent Server SDK</li>
                      <li>• Cost tracking</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Evaluation</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• RAGAS pipeline</li>
                      <li>• CI/CD integration</li>
                      <li>• Daily cron job</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">MLflow</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Experiment tracking</li>
                      <li>• Model registry</li>
                      <li>• Artifact storage (S3)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-4">
              <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-semibold text-yellow-400">Phase 3: MLOps Automation</h3>
                  <span className="text-sm bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-300">Week 9-12</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Kubeflow Pipelines</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Training pipelines</li>
                      <li>• Auto-evaluation</li>
                      <li>• Registry integration</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">ArgoCD GitOps</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Declarative deployment</li>
                      <li>• Auto-sync from Git</li>
                      <li>• Rollback on failure</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300 mb-1">Production</p>
                    <ul className="text-gray-400 space-y-1">
                      <li>• Multi-model serving</li>
                      <li>• Auto-scaling (Karpenter)</li>
                      <li>• Full observability</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
