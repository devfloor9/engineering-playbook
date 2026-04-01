import { SlideWrapper, Card } from '@shared/components';

export default function Slide04() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">Application Monitoring</h2>
        <p className="text-xl text-gray-300 mb-8">
          Langfuse traces, agent step costs, and prompt management
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Trace Structure</h3>
            <div className="bg-gray-900/50 p-4 rounded text-xs font-mono space-y-1">
              <div className="text-blue-300">Trace: User Question (3.2s, $0.034)</div>
              <div className="ml-4 text-green-300">├─ Span: Query Processing (0.1s)</div>
              <div className="ml-4 text-green-300">├─ Span: Vector Search (0.3s)</div>
              <div className="ml-4 text-yellow-300">├─ Generation: LLM Call 1</div>
              <div className="ml-8 text-gray-400">│  model: gpt-4o-mini</div>
              <div className="ml-8 text-gray-400">│  tokens: 1200→80 ($0.0024)</div>
              <div className="ml-4 text-green-300">├─ Span: Reranking (0.2s)</div>
              <div className="ml-4 text-yellow-300">└─ Generation: LLM Call 2</div>
              <div className="ml-8 text-gray-400">   model: gpt-4o</div>
              <div className="ml-8 text-gray-400">   tokens: 3500→450 ($0.0285)</div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Token Usage by Model</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-300">gpt-4o</span>
                  <span className="text-gray-400">42M tokens ($1,240)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-300">gpt-4o-mini</span>
                  <span className="text-gray-400">120M tokens ($180)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-300">claude-sonnet-4</span>
                  <span className="text-gray-400">8M tokens ($96)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-5 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Tracking Metrics</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Input/Output token count</li>
              <li>• Latency (TTFT, Total)</li>
              <li>• Cost per request</li>
              <li>• Tool call frequency</li>
              <li>• Chain iteration count</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold mb-3 text-blue-400">Agent Step Cost</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Reasoning: $0.008</li>
              <li>• Tool selection: $0.002</li>
              <li>• Tool execution: $0.001</li>
              <li>• Result synthesis: $0.012</li>
              <li className="border-t border-gray-700 pt-2 font-semibold">Total: $0.023/request</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-yellow-500/30">
            <h4 className="text-lg font-semibold mb-3 text-yellow-400">Quality Scores</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Faithfulness: 0.92</li>
              <li>• Relevancy: 0.88</li>
              <li>• User Rating: 4.6/5</li>
              <li>• Hallucination: 0.03</li>
              <li>• Completion Rate: 98.2%</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
