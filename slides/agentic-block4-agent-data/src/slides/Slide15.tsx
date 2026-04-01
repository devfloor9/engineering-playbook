import { SlideWrapper, Card, FlowDiagram } from '@shared/components';

export default function Slide15() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Agent Lifecycle Management
        </h2>

        <div className="mb-10">
          <FlowDiagram
            nodes={[
              { id: 'deploy', label: 'Deploy', color: 'blue' },
              { id: 'monitor', label: 'Monitor', color: 'green' },
              { id: 'evaluate', label: 'Evaluate', color: 'purple' },
              { id: 'iterate', label: 'Iterate', color: 'yellow' },
            ]}
            edges={[
              { from: 'deploy', to: 'monitor', label: 'Observe' },
              { from: 'monitor', to: 'evaluate', label: 'Measure' },
              { from: 'evaluate', to: 'iterate', label: 'Improve' },
              { from: 'iterate', to: 'deploy', label: 'Release' },
            ]}
          />
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card title="Deploy" color="blue">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Apply Agent CRD</li>
              <li>Tool registration</li>
              <li>Memory initialization</li>
              <li>Health checks</li>
              <li>Canary rollout</li>
            </ul>
          </Card>

          <Card title="Monitor" color="green">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Request latency</li>
              <li>Error rates</li>
              <li>Token usage</li>
              <li>Tool invocations</li>
              <li>User satisfaction</li>
            </ul>
          </Card>

          <Card title="Evaluate" color="purple">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Response quality</li>
              <li>Task completion</li>
              <li>RAG relevance</li>
              <li>Cost efficiency</li>
              <li>SLA compliance</li>
            </ul>
          </Card>

          <Card title="Iterate" color="yellow">
            <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside">
              <li>Prompt tuning</li>
              <li>Model upgrade</li>
              <li>Tool refinement</li>
              <li>Index optimization</li>
              <li>Scale adjustment</li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <Card title="Key Metrics">
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>First Response Time:</span>
                <span className="text-blue-400 font-semibold">&lt;2s</span>
              </div>
              <div className="flex justify-between">
                <span>Task Success Rate:</span>
                <span className="text-green-400 font-semibold">&gt;95%</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className="text-yellow-400 font-semibold">&lt;1%</span>
              </div>
              <div className="flex justify-between">
                <span>Availability:</span>
                <span className="text-purple-400 font-semibold">99.9%</span>
              </div>
            </div>
          </Card>

          <Card title="Continuous Improvement">
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span>A/B test new prompts</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span>Monitor user feedback</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span>Track cost per interaction</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span>Automated regression tests</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
