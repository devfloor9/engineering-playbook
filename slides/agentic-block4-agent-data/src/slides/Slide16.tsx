import { SlideWrapper, Card } from '@shared/components';

export default function Slide16() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-12">
          Key Takeaways
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <Card title="Agent Infrastructure">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="text-blue-400 text-xl">1.</span>
                <span><strong>Kubernetes-native:</strong> CRDs enable declarative agent management</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">2.</span>
                <span><strong>MCP/A2A:</strong> Standard protocols for tools and collaboration</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-purple-400 text-xl">3.</span>
                <span><strong>Security first:</strong> Tool validation, scoping, and OIDC auth</span>
              </li>
            </ul>
          </Card>

          <Card title="Memory & Data">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="text-yellow-400 text-xl">4.</span>
                <span><strong>Multi-layered memory:</strong> Context window + Redis + Vector DB</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-orange-400 text-xl">5.</span>
                <span><strong>Milvus at scale:</strong> Distributed, hybrid search, billion+ vectors</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="text-red-400 text-xl">6.</span>
                <span><strong>RAG pipeline:</strong> Ground LLMs in factual knowledge</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-12 space-y-6">
          <Card title="Production Considerations">
            <div className="grid grid-cols-3 gap-6 text-sm text-gray-300">
              <div>
                <h4 className="text-blue-400 font-semibold mb-2">Observability</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Distributed tracing</li>
                  <li>Metrics & alerts</li>
                  <li>Audit logging</li>
                </ul>
              </div>
              <div>
                <h4 className="text-green-400 font-semibold mb-2">Scaling</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>HPA/KEDA autoscaling</li>
                  <li>Multi-tenant isolation</li>
                  <li>Resource quotas</li>
                </ul>
              </div>
              <div>
                <h4 className="text-purple-400 font-semibold mb-2">Reliability</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Canary deployments</li>
                  <li>Backup & recovery</li>
                  <li>Circuit breakers</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="text-center p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-2xl text-white font-semibold mb-2">
              Build Intelligent, Observable, Scalable Agent Systems
            </p>
            <p className="text-gray-400">
              with Kubernetes orchestration and vector-powered memory
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
