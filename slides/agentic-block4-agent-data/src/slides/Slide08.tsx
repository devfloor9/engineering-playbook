import { SlideWrapper, Card, CompareTable } from '@shared/components';

export default function Slide08() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Agent Memory Strategy
        </h2>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <Card title="Short-Term Memory (STM)">
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Immediate context within current conversation or task
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li><strong>Scope:</strong> Single session</li>
                <li><strong>Storage:</strong> In-memory, Redis cache</li>
                <li><strong>Duration:</strong> Minutes to hours</li>
                <li><strong>Size:</strong> Limited by context window</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-500/10 rounded">
                <p className="text-xs text-blue-200">Example: Current conversation history</p>
              </div>
            </div>
          </Card>

          <Card title="Long-Term Memory (LTM)">
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Persistent knowledge across sessions
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li><strong>Scope:</strong> Multi-session</li>
                <li><strong>Storage:</strong> Vector DB, PostgreSQL</li>
                <li><strong>Duration:</strong> Days to permanent</li>
                <li><strong>Size:</strong> Unlimited with retrieval</li>
              </ul>
              <div className="mt-4 p-3 bg-purple-500/10 rounded">
                <p className="text-xs text-purple-200">Example: User preferences, learned facts</p>
              </div>
            </div>
          </Card>
        </div>

        <CompareTable
          title="STM vs LTM Comparison"
          headers={['Aspect', 'Short-Term Memory', 'Long-Term Memory']}
          rows={[
            ['Latency', 'Microseconds', 'Milliseconds'],
            ['Capacity', '10-100 messages', 'Millions of records'],
            ['Cost', 'Very low', 'Storage costs'],
            ['Retrieval', 'Sequential', 'Semantic search'],
            ['Use Case', 'Dialog context', 'Knowledge base'],
          ]}
        />
      </div>
    </SlideWrapper>
  );
}
