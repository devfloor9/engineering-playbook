import { SlideWrapper, Card } from '@shared/components';
import { Network, Cpu, Zap } from 'lucide-react';

export default function Slide10() {
  const models = [
    { name: 'Mixtral 8x7B', params: '47B total, ~13B active', experts: '8 experts, Top-2' },
    { name: 'Mixtral 8x22B', params: '141B total, ~39B active', experts: '8 experts, Top-2' },
    { name: 'DeepSeek-MoE', params: '16B total, ~2.8B active', experts: '64 experts, Top-6' },
    { name: 'Qwen-MoE', params: '14.3B total, ~2.7B active', experts: '60 experts, Top-4' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Network className="w-16 h-16 text-purple-400" />
          <h2 className="text-5xl font-bold text-purple-400">MoE 모델 서빙 개요</h2>
        </div>

        <Card className="p-8 bg-gradient-to-br from-purple-900/40 to-blue-900/40 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Cpu className="w-12 h-12 text-cyan-400" />
            <h3 className="text-3xl font-semibold text-white">Mixture of Experts (MoE)</h3>
          </div>
          <p className="text-xl text-gray-300 leading-relaxed">
            MoE 모델은 여러 개의 <span className="text-purple-400 font-semibold">"Expert" 네트워크</span>와
            <span className="text-cyan-400 font-semibold"> "Router(Gate)" 네트워크</span>로 구성됩니다.
            입력 토큰마다 <span className="text-amber-400 font-semibold">Top-K Expert만 활성화</span>하여
            전체 파라미터의 일부만 사용하므로, <span className="text-emerald-400 font-semibold">연산 효율성이 높고 추론 속도가 빠릅니다</span>.
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {models.map((model, idx) => (
            <Card key={idx} className="p-6 bg-gray-800/50 hover:bg-gray-800/70 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-amber-400" />
                <h4 className="text-2xl font-bold text-white">{model.name}</h4>
              </div>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">Parameters:</span>
                  <span className="text-cyan-400 font-semibold">{model.params}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Architecture:</span>
                  <span className="text-purple-400 font-semibold">{model.experts}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-500 text-lg">
          전체 파라미터 중 일부만 활성화하여 효율적인 추론
        </div>
      </div>
    </SlideWrapper>
  );
}
