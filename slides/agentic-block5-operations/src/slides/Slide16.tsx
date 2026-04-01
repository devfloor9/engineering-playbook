import { SlideWrapper } from '@shared/components';

export default function Slide16() {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center justify-center h-full px-16">
        <h2 className="text-6xl font-bold mb-12 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
          Key Takeaways
        </h2>

        <div className="grid grid-cols-2 gap-8 w-full max-w-6xl mb-12">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-8 rounded-lg border border-blue-500/30">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-3 text-blue-400">Dual-Layer Observability</h3>
            <p className="text-gray-300">
              Bifrost (infrastructure) + Langfuse (application) provides complete visibility.
              Gateway-level for SRE, SDK-level for ML/AI teams.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-8 rounded-lg border border-purple-500/30">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold mb-3 text-purple-400">RAGAS Evaluation</h3>
            <p className="text-gray-300">
              Automated RAG quality assessment with Faithfulness, Relevancy, Context Precision, and Recall metrics.
              CI/CD integration ensures quality gates.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 p-8 rounded-lg border border-green-500/30">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-2xl font-semibold mb-3 text-green-400">MLOps Pipeline</h3>
            <p className="text-gray-300">
              Kubeflow Pipelines + MLflow + vLLM + ArgoCD GitOps for end-to-end automation.
              Training to serving in unified Kubernetes platform.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 p-8 rounded-lg border border-yellow-500/30">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-2xl font-semibold mb-3 text-yellow-400">Cost Governance</h3>
            <p className="text-gray-300">
              2-tier cost tracking (Bifrost + Langfuse), budget alerts, and cascade routing optimization.
              30-70% savings with Karpenter Spot instances.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 p-8 rounded-lg border border-blue-500/30 w-full max-w-6xl">
          <h4 className="text-2xl font-semibold mb-4 text-center text-blue-300">Production Readiness</h4>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">✅</div>
              <p className="text-gray-300 font-semibold">SLOs Defined</p>
              <p className="text-sm text-gray-400">99.9% uptime, P99 &lt; 5s</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🚨</div>
              <p className="text-gray-300 font-semibold">Alerts Configured</p>
              <p className="text-sm text-gray-400">P0/P1 escalation paths</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📈</div>
              <p className="text-gray-300 font-semibold">Continuous Improvement</p>
              <p className="text-sm text-gray-400">Evaluate → Feedback → Iterate</p>
            </div>
          </div>
        </div>

        <p className="text-gray-400 mt-8 text-center">
          Ready for production-grade AI operations at scale
        </p>
      </div>
    </SlideWrapper>
  );
}
