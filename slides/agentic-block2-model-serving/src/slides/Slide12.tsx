import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

export const Slide12: React.FC = () => {
  return (
    <SlideWrapper title="vLLM Deep Dive" subtitle="High-Performance LLM Inference Engine">
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card title="Core Technologies">
            <ul className="space-y-3 text-sm">
              <li>
                <strong className="text-blue-300">PagedAttention:</strong>
                <p className="text-xs text-gray-300">KV cache paging eliminates fragmentation → 2-24x throughput vs HF</p>
              </li>
              <li>
                <strong className="text-green-300">Continuous Batching:</strong>
                <p className="text-xs text-gray-300">New requests join mid-generation → maximize GPU utilization</p>
              </li>
              <li>
                <strong className="text-purple-300">Speculative Decoding:</strong>
                <p className="text-xs text-gray-300">Draft model predicts tokens → main model verifies in parallel</p>
              </li>
              <li>
                <strong className="text-orange-300">Prefix Caching:</strong>
                <p className="text-xs text-gray-300">Reuse KV cache for common prompts → reduce TTFT 80%</p>
              </li>
            </ul>
          </Card>
          <Card title="Parallelism Options">
            <ul className="space-y-2 text-sm">
              <li><strong>TP (Tensor Parallel):</strong> Split layers across GPUs</li>
              <li><strong>PP (Pipeline Parallel):</strong> Stage layers sequentially</li>
              <li><strong>DP (Data Parallel):</strong> Replicate model per GPU</li>
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Key Arguments">
            <div className="text-xs space-y-2">
              <p><code className="text-blue-300">--model</code> meta-llama/Llama-3-70B</p>
              <p><code className="text-green-300">--tensor-parallel-size 4</code></p>
              <p><code className="text-purple-300">--max-model-len 8192</code></p>
              <p><code className="text-orange-300">--gpu-memory-utilization 0.9</code></p>
              <p><code className="text-yellow-300">--enable-prefix-caching</code></p>
              <p><code className="text-pink-300">--max-num-seqs 256</code></p>
            </div>
          </Card>
          <Card title="Performance Metrics">
            <ul className="space-y-2 text-xs">
              <li>TTFT (Time To First Token): &lt;500ms target</li>
              <li>ITL (Inter-Token Latency): &lt;50ms target</li>
              <li>Throughput: ~200 tokens/s (H100, 70B model)</li>
              <li>GPU Utilization: 85-95% with continuous batching</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};
