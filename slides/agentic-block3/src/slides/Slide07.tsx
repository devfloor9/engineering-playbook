import { SlideWrapper, Card, Badge } from '@shared/components';
import { Network, Route, Zap } from 'lucide-react';

export default function Slide07() {
  const features = [
    { label: 'KV Cache-Aware', desc: '프리픽스 인식 라우팅' },
    { label: '분산 추론 스케줄러', desc: 'Envoy 기반 Gateway' },
    { label: 'Apache 2.0', desc: 'Red Hat 주도 오픈소스' },
    { label: 'Gateway API', desc: 'Kubernetes 네이티브' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Network className="w-16 h-16 text-cyan-400" />
          <h2 className="text-5xl font-bold text-cyan-400">llm-d 개요</h2>
        </div>

        <Card color="cyan" className="p-8 mb-8">
          <p className="text-2xl text-gray-300 leading-relaxed">
            llm-d는 Red Hat이 주도하는 <span className="text-cyan-400 font-semibold">Kubernetes 네이티브 분산 추론 스택</span>입니다.
            <span className="text-purple-400 font-semibold"> vLLM 추론 엔진</span>,
            <span className="text-emerald-400 font-semibold"> Envoy 기반 Inference Gateway</span>, 그리고
            <span className="text-amber-400 font-semibold"> Kubernetes Gateway API</span>를 결합하여
            대규모 언어 모델의 <span className="text-blue-400 font-semibold">지능적인 추론 라우팅</span>을 제공합니다.
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {features.map((item, idx) => (
            <Card key={idx} className="p-6 hover:bg-gray-800/70 transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold text-white">{item.label}</div>
              </div>
              <div className="text-gray-300 ml-16">{item.desc}</div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Badge color="cyan" size="lg">llm-d v0.4</Badge>
          <Badge color="blue" size="lg">Red Hat</Badge>
          <Badge color="purple" size="lg">Apache 2.0</Badge>
        </div>
      </div>
    </SlideWrapper>
  );
}
