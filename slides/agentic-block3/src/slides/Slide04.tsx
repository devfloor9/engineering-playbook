import { SlideWrapper, Card, FlowDiagram } from '@shared/components';
import { Layers, Repeat, Database } from 'lucide-react';

export default function Slide04() {
  const flowSteps = [
    { label: '요청 도착', color: 'blue' },
    { label: '동적 배치 추가', color: 'purple' },
    { label: 'KV 블록 할당', color: 'cyan' },
    { label: '병렬 처리', color: 'emerald' },
    { label: '완료 시 즉시 제거', color: 'amber' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold text-purple-400 mb-8">vLLM 핵심 기술</h2>

        <div className="grid grid-cols-2 gap-8">
          <Card className="p-8 bg-gradient-to-br from-purple-900/40 to-blue-900/40">
            <div className="flex items-center gap-4 mb-6">
              <Repeat className="w-12 h-12 text-purple-400" />
              <h3 className="text-3xl font-semibold text-white">Continuous Batching</h3>
            </div>
            <ul className="space-y-3 text-lg text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>배치 경계 제거: iteration 수준에서 동적 관리</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>완료된 요청 즉시 제거, 새 요청 추가</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>GPU 항상 최대 용량으로 작동</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">✓</span>
                <span>평균 지연 시간 및 처리량 개선</span>
              </li>
            </ul>
          </Card>

          <Card className="p-8 bg-gradient-to-br from-cyan-900/40 to-emerald-900/40">
            <div className="flex items-center gap-4 mb-6">
              <Database className="w-12 h-12 text-cyan-400" />
              <h3 className="text-3xl font-semibold text-white">KV Cache 최적화</h3>
            </div>
            <ul className="space-y-3 text-lg text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1">✓</span>
                <span>PagedAttention: 비연속 블록 저장</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1">✓</span>
                <span>메모리 단편화 제거</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1">✓</span>
                <span>동적 메모리 할당으로 GPU 활용률 극대화</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-amber-400 mt-1">✓</span>
                <span>FP8 KV Cache: 2배 메모리 절감 (v0.6+)</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-8">
          <FlowDiagram steps={flowSteps} title="Continuous Batching 처리 흐름" />
        </div>
      </div>
    </SlideWrapper>
  );
}
