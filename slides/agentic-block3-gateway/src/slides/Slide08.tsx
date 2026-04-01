import React from 'react';
import { SlideWrapper, Card, Badge } from '@shared/components';

const Slide08: React.FC = () => {
  return (
    <SlideWrapper slideNumber={8} title="llm-d Inference Gateway">
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-4xl font-bold text-orange-400">llm-d</h2>
          <Badge color="orange">Disaggregated Serving</Badge>
          <Badge color="green">KV Cache-aware</Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card title="What is llm-d?">
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">
                <strong className="text-orange-400">llm-d</strong> is an inference gateway for self-hosted vLLM clusters that performs <strong>KV cache-aware Pod selection</strong>.
              </p>
              <div className="p-4 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                <div className="font-bold text-orange-300 mb-2">Key Innovation</div>
                <p className="text-sm">Routes requests to Pods that already have relevant KV cache, avoiding redundant prefill computation</p>
              </div>
              <ul className="space-y-2 text-base">
                <li>• <strong>EPP (Enhanced Pod Picking)</strong> — Gateway API integration</li>
                <li>• <strong>Prefix-aware routing</strong> — Matches request to cached prefixes</li>
                <li>• <strong>NIXL transport</strong> — Fast KV cache transfer between Pods</li>
                <li>• <strong>Auto Mode compatible</strong> — Works with EKS Auto Mode</li>
              </ul>
            </div>
          </Card>

          <Card title="Architecture">
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-xl font-bold text-blue-400">Client Request</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-12 bg-orange-600/30 rounded flex items-center justify-center border border-orange-500/50">
                    <span className="text-orange-300 font-bold">llm-d Gateway</span>
                  </div>
                  <div className="text-gray-400 text-sm">KV Cache Metadata Check</div>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    <div className="h-16 bg-green-600/30 rounded flex items-center justify-center border border-green-500/50">
                      <div className="text-center">
                        <div className="text-xs text-green-300">vLLM Pod 1</div>
                        <div className="text-xs text-gray-400">Cached ✓</div>
                      </div>
                    </div>
                    <div className="h-16 bg-gray-700/30 rounded flex items-center justify-center border border-gray-600/50">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">vLLM Pod 2</div>
                        <div className="text-xs text-gray-500">No cache</div>
                      </div>
                    </div>
                    <div className="h-16 bg-gray-700/30 rounded flex items-center justify-center border border-gray-600/50">
                      <div className="text-center">
                        <div className="text-xs text-gray-400">vLLM Pod 3</div>
                        <div className="text-xs text-gray-500">No cache</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm">Routes to Pod 1 → 80% faster</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Performance Impact">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-red-900/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Without llm-d</div>
              <div className="text-3xl font-bold text-red-400">100% Prefill</div>
              <div className="text-sm text-gray-500 mt-2">Every request recomputes KV cache</div>
            </div>
            <div className="p-4 bg-green-900/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">With llm-d</div>
              <div className="text-3xl font-bold text-green-400">80% Faster</div>
              <div className="text-sm text-gray-500 mt-2">Reuses existing KV cache</div>
            </div>
            <div className="p-4 bg-blue-900/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Use Case</div>
              <div className="text-xl font-bold text-blue-400">Multi-turn</div>
              <div className="text-sm text-gray-500 mt-2">Conversations, RAG, long context</div>
            </div>
          </div>
        </Card>

        <div className="p-4 bg-orange-900/30 border border-orange-500/30 rounded-lg">
          <p className="text-lg text-gray-300">
            <strong className="text-orange-400">Integration:</strong> llm-d sits between Bifrost/agentgateway and vLLM Pods — transparent to clients
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide08;
