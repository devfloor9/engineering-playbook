import { SlideWrapper, Card } from '@shared/components';

export default function Slide09() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Memory Types in AI Agents
        </h2>

        <div className="grid grid-cols-3 gap-6">
          <Card title="Episodic Memory" color="blue">
            <div className="space-y-4">
              <div className="h-32 flex items-center justify-center">
                <div className="text-6xl">📖</div>
              </div>
              <p className="text-sm text-gray-300">
                Specific events and experiences
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-400">
                <li>Past conversations</li>
                <li>User interactions</li>
                <li>Task outcomes</li>
                <li>Feedback received</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-500/10 rounded">
                <p className="text-xs text-blue-200">
                  "Last week, user asked about GPU scheduling"
                </p>
              </div>
            </div>
          </Card>

          <Card title="Semantic Memory" color="purple">
            <div className="space-y-4">
              <div className="h-32 flex items-center justify-center">
                <div className="text-6xl">🧠</div>
              </div>
              <p className="text-sm text-gray-300">
                General knowledge and facts
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-400">
                <li>Domain knowledge</li>
                <li>Product documentation</li>
                <li>Best practices</li>
                <li>Company policies</li>
              </ul>
              <div className="mt-4 p-3 bg-purple-500/10 rounded">
                <p className="text-xs text-purple-200">
                  "Kubernetes pods run containers"
                </p>
              </div>
            </div>
          </Card>

          <Card title="Procedural Memory" color="green">
            <div className="space-y-4">
              <div className="h-32 flex items-center justify-center">
                <div className="text-6xl">⚙️</div>
              </div>
              <p className="text-sm text-gray-300">
                How-to knowledge and skills
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm text-gray-400">
                <li>Tool usage patterns</li>
                <li>Workflow steps</li>
                <li>Problem-solving strategies</li>
                <li>Successful techniques</li>
              </ul>
              <div className="mt-4 p-3 bg-green-500/10 rounded">
                <p className="text-xs text-green-200">
                  "To scale: check metrics → adjust replicas"
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-gray-300">
            Effective agents combine all three memory types for context-aware, intelligent behavior
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
