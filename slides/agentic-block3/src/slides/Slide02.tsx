import { SlideWrapper, Card } from '@shared/components';
import { Target, Layers, Gauge } from 'lucide-react';

export default function Slide02() {
  const challenges = [
    { icon: Target, title: 'KV 캐시 메모리', desc: '60-80% 메모리 낭비' },
    { icon: Layers, title: '정적 배칭', desc: 'GPU 부분 활용' },
    { icon: Gauge, title: '처리량 병목', desc: '낮은 동시성' },
  ];

  const solutions = [
    'vLLM: PagedAttention + Continuous Batching',
    'llm-d: Prefix-Aware 분산 라우팅',
    'MoE: Mixture of Experts 효율적 활성화',
    'GPU DRA: 동적 리소스 할당',
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold text-blue-400 mb-8">LLM 모델 서빙 개요</h2>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-3xl font-semibold text-purple-400 mb-6">핵심 과제</h3>
            <div className="space-y-4">
              {challenges.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                  <item.icon className="w-8 h-8 text-amber-400" />
                  <div>
                    <div className="text-xl font-semibold text-white">{item.title}</div>
                    <div className="text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-semibold text-cyan-400 mb-6">솔루션 스택</h3>
            <div className="space-y-3">
              {solutions.map((sol, idx) => (
                <Card key={idx} className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-lg text-white">{sol}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto text-center text-gray-500 text-lg">
          고성능 LLM 추론을 위한 포괄적 아키텍처
        </div>
      </div>
    </SlideWrapper>
  );
}
