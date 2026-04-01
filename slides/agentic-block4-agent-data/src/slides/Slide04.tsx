import { SlideWrapper, Card } from '@shared/components';

export default function Slide04() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Kagent Architecture
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card title="Control Plane" color="blue">
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><strong className="text-blue-400">Controller:</strong> Reconciliation loop</li>
                <li><strong className="text-blue-400">Webhook:</strong> CRD validation</li>
                <li><strong className="text-blue-400">Metrics:</strong> Prometheus integration</li>
              </ul>
            </Card>

            <Card title="Custom Resources (CRDs)" color="yellow">
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><strong className="text-yellow-400">Agent:</strong> LLM config, tools, scaling</li>
                <li><strong className="text-yellow-400">Tool:</strong> API/retrieval/code functions</li>
                <li><strong className="text-yellow-400">Workflow:</strong> Multi-agent orchestration</li>
                <li><strong className="text-yellow-400">Memory:</strong> Redis/Postgres/Milvus</li>
              </ul>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Managed Resources" color="orange">
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><strong className="text-orange-400">Deployments:</strong> Agent pods</li>
                <li><strong className="text-orange-400">Services:</strong> Internal networking</li>
                <li><strong className="text-orange-400">HPA/KEDA:</strong> Auto-scaling</li>
                <li><strong className="text-orange-400">ConfigMaps/Secrets:</strong> Configuration</li>
              </ul>
            </Card>

            <Card title="Agent Runtime" color="green">
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><strong className="text-green-400">Pods:</strong> Agent instances</li>
                <li><strong className="text-green-400">Model Calls:</strong> LLM inference</li>
                <li><strong className="text-green-400">Tool Execution:</strong> Function calls</li>
                <li><strong className="text-green-400">Memory Access:</strong> State persistence</li>
              </ul>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          Operator watches CRDs → Creates K8s resources → Manages agent lifecycle
        </div>
      </div>
    </SlideWrapper>
  );
}
