import { SlideWrapper, Card } from '@shared/components';
import { Zap, Route } from 'lucide-react';

export default function Slide13() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">vLLM + llm-d Inference Stack</h2>
      <p className="text-gray-400 mb-6">The engine (vLLM) + the intelligent scheduler (llm-d)</p>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <Card title="vLLM — Inference Engine" icon={<Zap className="w-5 h-5" />} color="amber" className="h-full">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">▸</span>
              <span>PagedAttention KV Cache optimization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">▸</span>
              <span>All Open Weight models (Llama, Qwen, DeepSeek)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">▸</span>
              <span>Continuous batching + speculative decoding</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">▸</span>
              <span>OpenAI-compatible API</span>
            </li>
          </ul>
          <div className="mt-4 p-2 bg-gray-950 rounded text-xs text-gray-500">
            Qwen3-32B: ~65GB BF16, TP=2 on H100 80GB
          </div>
        </Card>
        <Card title="llm-d — Intelligent Scheduler" icon={<Route className="w-5 h-5" />} color="blue" className="h-full">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">▸</span>
              <span>KV Cache-aware prefix routing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">▸</span>
              <span>Disaggregated Serving (Prefill/Decode split)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">▸</span>
              <span>Gateway API native (InferencePool CRD)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">▸</span>
              <span>NIXL KV transfer (network + NVLink)</span>
            </li>
          </ul>
          <div className="mt-4 p-2 bg-gray-950 rounded text-xs text-gray-500">
            TTFT: ~300ms (cache hit) vs 1s+ (cold)
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
