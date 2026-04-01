import { SlideWrapper, Card } from '@shared/components';

export default function Slide02() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-12">
          What is an AI Agent?
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <Card title="Autonomy">
            <div className="space-y-3">
              <p className="text-gray-300">
                Operates independently to achieve goals
              </p>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Self-directed decision making</li>
                <li>Goal-oriented behavior</li>
                <li>Adaptive responses</li>
              </ul>
            </div>
          </Card>

          <Card title="Tool Use">
            <div className="space-y-3">
              <p className="text-gray-300">
                Leverages external tools and APIs
              </p>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>API integrations</li>
                <li>Database queries</li>
                <li>External services</li>
              </ul>
            </div>
          </Card>

          <Card title="Reasoning Loop">
            <div className="space-y-3">
              <p className="text-gray-300">
                Iterative thought process
              </p>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Plan → Execute → Observe</li>
                <li>Learn from outcomes</li>
                <li>Refine strategies</li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xl text-center text-gray-300">
            <span className="text-blue-400 font-semibold">Agent = LLM + Memory + Tools + Autonomy</span>
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
