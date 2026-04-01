import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

const Slide09: React.FC = () => {
  return (
    <SlideWrapper slideNumber={9} title="Bifrost vs llm-d Gateway">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-6">
          Different Routing Levels — Not Competitors
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Bifrost (Provider Routing)">
            <div className="space-y-4">
              <div className="p-4 bg-purple-900/30 border-l-4 border-purple-500 rounded-lg">
                <div className="font-bold text-purple-300 mb-2">Routing Level</div>
                <p className="text-gray-300">Provider / Model selection</p>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>OpenAI GPT-4</span>
                  <span className="text-blue-400">External API</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>Anthropic Claude</span>
                  <span className="text-blue-400">External API</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>AWS Bedrock</span>
                  <span className="text-blue-400">External API</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>Self-hosted vLLM</span>
                  <span className="text-orange-400">→ llm-d</span>
                </div>
              </div>

              <div className="p-4 bg-purple-900/30 rounded-lg">
                <div className="font-bold text-purple-300 mb-2">Features</div>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• Cascade routing (cheap→premium)</li>
                  <li>• Semantic caching</li>
                  <li>• Budget control</li>
                  <li>• Multi-provider abstraction</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card title="llm-d (Pod Routing)">
            <div className="space-y-4">
              <div className="p-4 bg-orange-900/30 border-l-4 border-orange-500 rounded-lg">
                <div className="font-bold text-orange-300 mb-2">Routing Level</div>
                <p className="text-gray-300">Pod / Instance selection within vLLM cluster</p>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="p-3 bg-green-800/50 rounded flex items-center justify-between">
                  <span>vLLM Pod 1</span>
                  <span className="text-green-400">KV Cache Hit ✓</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>vLLM Pod 2</span>
                  <span className="text-gray-500">No cache</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>vLLM Pod 3</span>
                  <span className="text-gray-500">No cache</span>
                </div>
                <div className="p-3 bg-gray-800/50 rounded flex items-center justify-between">
                  <span>vLLM Pod 4</span>
                  <span className="text-gray-500">No cache</span>
                </div>
              </div>

              <div className="p-4 bg-orange-900/30 rounded-lg">
                <div className="font-bold text-orange-300 mb-2">Features</div>
                <ul className="space-y-1 text-sm text-gray-300">
                  <li>• KV cache-aware routing</li>
                  <li>• Prefix matching</li>
                  <li>• NIXL KV transfer</li>
                  <li>• Disaggregated serving</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Combined Architecture">
          <div className="flex items-center justify-between gap-4 p-6 bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400 mb-2">Client</div>
              <div className="text-sm text-gray-400">Request</div>
            </div>
            <div className="text-gray-500">→</div>
            <div className="text-center p-4 bg-blue-600/30 rounded">
              <div className="text-xl font-bold text-blue-300">kgateway</div>
              <div className="text-xs text-gray-400">L7 routing</div>
            </div>
            <div className="text-gray-500">→</div>
            <div className="text-center p-4 bg-purple-600/30 rounded">
              <div className="text-xl font-bold text-purple-300">Bifrost</div>
              <div className="text-xs text-gray-400">Provider selection</div>
            </div>
            <div className="text-gray-500">→</div>
            <div className="text-center p-4 bg-orange-600/30 rounded">
              <div className="text-xl font-bold text-orange-300">llm-d</div>
              <div className="text-xs text-gray-400">Pod selection</div>
            </div>
            <div className="text-gray-500">→</div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400 mb-2">vLLM</div>
              <div className="text-sm text-gray-400">Inference</div>
            </div>
          </div>
        </Card>

        <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <p className="text-lg text-gray-300">
            <strong className="text-blue-400">Key Insight:</strong> Bifrost and llm-d operate at different abstraction levels — use both for optimal performance
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide09;
