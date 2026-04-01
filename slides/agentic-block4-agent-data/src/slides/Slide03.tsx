import { SlideWrapper, Card, Badge } from '@shared/components';

export default function Slide03() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Kagent Overview
        </h2>

        <div className="mb-8">
          <Badge color="yellow">Kubernetes-Native Agent Management</Badge>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <Card title="What is Kagent?">
            <div className="space-y-4 text-gray-300">
              <p>
                CRD-based operator pattern for managing AI agents in Kubernetes
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Declarative agent definitions (YAML)</li>
                <li>Automated lifecycle management</li>
                <li>Native K8s scaling (HPA/KEDA)</li>
                <li>Multi-agent orchestration</li>
              </ul>
            </div>
          </Card>

          <Card title="Why Kubernetes?">
            <div className="space-y-4 text-gray-300">
              <p>
                Natural fit for multi-model agent ecosystems
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Dynamic scaling based on traffic</li>
                <li>Service mesh integration</li>
                <li>Observability tooling</li>
                <li>Resource isolation & quotas</li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            <strong>⚠️ Note:</strong> Kagent is a reference architecture pattern. Production alternatives include
            <strong> Bedrock AgentCore, KubeAI, LangGraph Platform</strong>
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
