import { SlideWrapper, Card, FlowDiagram } from '@shared/components';

export default function Slide06() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Agent-to-Agent Protocol (A2A)
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <Card title="Multi-Agent Collaboration">
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                A2A enables agents to delegate tasks, share information, and coordinate workflows
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li><strong>Task Delegation:</strong> Hand off subtasks</li>
                <li><strong>Result Sharing:</strong> Exchange findings</li>
                <li><strong>Workflow Orchestration:</strong> Sequential/parallel execution</li>
                <li><strong>Conflict Resolution:</strong> Consensus mechanisms</li>
              </ul>
            </div>
          </Card>

          <Card title="Communication Patterns">
            <div className="space-y-3 text-gray-300 text-sm">
              <div>
                <strong className="text-blue-400">Request-Response:</strong>
                <p className="text-gray-400 ml-4">Direct agent-to-agent calls</p>
              </div>
              <div>
                <strong className="text-green-400">Pub-Sub:</strong>
                <p className="text-gray-400 ml-4">Event-driven coordination</p>
              </div>
              <div>
                <strong className="text-purple-400">Message Queue:</strong>
                <p className="text-gray-400 ml-4">Asynchronous work distribution</p>
              </div>
              <div>
                <strong className="text-yellow-400">Shared State:</strong>
                <p className="text-gray-400 ml-4">Common knowledge base</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <FlowDiagram
            nodes={[
              { id: 'orchestrator', label: 'Orchestrator\nAgent', color: 'blue' },
              { id: 'research', label: 'Research\nAgent', color: 'green' },
              { id: 'analysis', label: 'Analysis\nAgent', color: 'purple' },
              { id: 'writer', label: 'Writer\nAgent', color: 'yellow' },
            ]}
            edges={[
              { from: 'orchestrator', to: 'research', label: 'Gather data' },
              { from: 'orchestrator', to: 'analysis', label: 'Analyze trends' },
              { from: 'research', to: 'writer', label: 'Results' },
              { from: 'analysis', to: 'writer', label: 'Insights' },
            ]}
          />
        </div>
      </div>
    </SlideWrapper>
  );
}
