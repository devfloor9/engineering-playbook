import { SlideWrapper, FlowDiagram, Card } from '@shared/components';

export default function Slide12() {
  const nodes = [
    { id: 'client', label: 'Client Apps', x: 350, y: 20, width: 100, height: 40, color: 'gray' },
    { id: 'bedrock', label: 'Amazon Bedrock', description: 'Serverless LLM API', x: 200, y: 100, width: 150, height: 50, color: 'amber' },
    { id: 'agentcore', label: 'AgentCore', description: 'Agent orchestration', x: 450, y: 100, width: 150, height: 50, color: 'purple' },
    { id: 'mcp', label: 'MCP Tools', x: 350, y: 200, width: 100, height: 40, color: 'blue' },
  ];
  const edges = [
    { from: 'client', to: 'bedrock', color: 'gray' },
    { from: 'client', to: 'agentcore', color: 'gray' },
    { from: 'agentcore', to: 'bedrock', color: 'purple' },
    { from: 'agentcore', to: 'mcp', color: 'blue' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-2">AWS Native Approach (Bedrock)</h2>
      <p className="text-gray-400 mb-4">Fully managed services, zero GPU management</p>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div>
          <FlowDiagram nodes={nodes} edges={edges} width={400} height={260} />
        </div>
        <div className="space-y-3">
          <Card title="Pros" color="emerald" className="text-sm">
            <ul className="space-y-1 text-xs">
              <li>• No GPU provisioning or management</li>
              <li>• Fast time-to-market (~1 week)</li>
              <li>• Pay-per-token pricing</li>
              <li>• Enterprise-grade security</li>
            </ul>
          </Card>
          <Card title="Cons" color="rose" className="text-sm">
            <ul className="space-y-1 text-xs">
              <li>• Limited to Bedrock model catalog</li>
              <li>• No open-weight model hosting</li>
              <li>• Less control over latency/cost tuning</li>
              <li>• Vendor lock-in concerns</li>
            </ul>
          </Card>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Best for: Fast prototypes, standard models, serverless preference
      </div>
    </SlideWrapper>
  );
}
