import { SlideWrapper, FlowDiagram } from '@shared/components';
import { Layers, Share2 } from 'lucide-react';

export default function Slide08() {
  const flowSteps = [
    { label: 'Client Request', color: 'emerald' },
    { label: 'Inference Gateway', color: 'cyan' },
    { label: 'Prefix Analysis', color: 'blue' },
    { label: 'KV Cache Check', color: 'purple' },
    { label: 'Intelligent Routing', color: 'amber' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Layers className="w-12 h-12 text-blue-400" />
          <h2 className="text-4xl font-bold text-blue-400">llm-d 아키텍처</h2>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="p-8 bg-gray-800 rounded-xl border border-blue-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-10 h-10 text-cyan-400" />
              <h3 className="text-2xl font-semibold text-white">Router 계층</h3>
            </div>
            <ul className="space-y-3 text-lg text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">▸</span>
                <span><strong>Inference Gateway</strong>: Envoy 기반 라우터</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">▸</span>
                <span><strong>InferenceModel CRD</strong>: 모델 ↔ Pool 매핑</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">▸</span>
                <span><strong>InferencePool CRD</strong>: vLLM Pod 그룹 관리</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">▸</span>
                <span><strong>Prefix-Aware</strong>: KV 캐시 상태 인식</span>
              </li>
            </ul>
          </div>

          <div className="p-8 bg-gray-800 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Layers className="w-10 h-10 text-purple-400" />
              <h3 className="text-2xl font-semibold text-white">Backend 계층</h3>
            </div>
            <ul className="space-y-3 text-lg text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-purple-400 mt-1">▸</span>
                <span><strong>vLLM Pods</strong>: 다중 추론 인스턴스</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1">▸</span>
                <span><strong>Tensor Parallelism</strong>: GPU 분산 (TP=2)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">▸</span>
                <span><strong>KV Cache Pool</strong>: Pod별 독립 캐시</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">▸</span>
                <span><strong>Karpenter</strong>: GPU 노드 자동 프로비저닝</span>
              </li>
            </ul>
          </div>
        </div>

        <FlowDiagram steps={flowSteps} title="Request Flow: Client → Gateway → vLLM Backend" />

        <div className="mt-6 text-center text-gray-400 text-lg">
          Router + vLLM Backend 구성으로 KV Cache-Aware 지능형 라우팅
        </div>
      </div>
    </SlideWrapper>
  );
}
