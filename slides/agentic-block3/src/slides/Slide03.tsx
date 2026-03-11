import { SlideWrapper, Card, Badge } from '@shared/components';
import { Rocket, Grid, Zap } from 'lucide-react';

export default function Slide03() {
  const features = [
    { label: 'PagedAttention', value: '60-80% 메모리 절감' },
    { label: 'Continuous Batching', value: '2-24배 처리량 향상' },
    { label: 'OpenAI API 호환', value: '쉬운 마이그레이션' },
    { label: '프로덕션 사용', value: 'Meta, Mistral AI, Cohere' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Rocket className="w-16 h-16 text-blue-400" />
          <h2 className="text-5xl font-bold text-blue-400">vLLM 개요</h2>
        </div>

        <Card color="blue" className="p-8 mb-8">
          <p className="text-2xl text-gray-300 leading-relaxed">
            vLLM은 <span className="text-cyan-400 font-semibold">PagedAttention 알고리즘</span>을 통해
            KV 캐시 메모리 낭비를 60-80% 줄이고,
            <span className="text-emerald-400 font-semibold"> 연속 배칭(Continuous Batching)</span>으로
            기존 대비 2-24배의 처리량 향상을 제공하는 고성능 LLM 추론 엔진입니다.
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {features.map((item, idx) => (
            <Card key={idx} className="p-6 hover:bg-gray-800/70 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg text-gray-300 mb-2">{item.label}</div>
                  <div className="text-2xl font-bold text-white">{item.value}</div>
                </div>
                <Zap className="w-12 h-12 text-amber-400 opacity-30" />
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Badge color="blue" size="lg">v0.6.3 / v0.7.x</Badge>
          <Badge color="purple" size="lg">Meta</Badge>
          <Badge color="cyan" size="lg">Mistral AI</Badge>
          <Badge color="emerald" size="lg">IBM</Badge>
        </div>
      </div>
    </SlideWrapper>
  );
}
