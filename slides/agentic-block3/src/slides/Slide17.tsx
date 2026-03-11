import { SlideWrapper, Card, Badge } from '@shared/components';
import { Layers, Zap, Network } from 'lucide-react';

export default function Slide17() {
  const components = [
    { name: 'NeMo Core', desc: '모델 학습 프레임워크', icon: Layers, color: 'blue' },
    { name: 'NeMo Guardrails', desc: '안전한 LLM 애플리케이션', icon: Zap, color: 'purple' },
    { name: 'NeMo Retriever', desc: 'RAG 임베딩 및 검색', icon: Network, color: 'cyan' },
  ];

  const features = [
    'PyTorch 기반 분산 학습',
    'NCCL을 통한 multi-GPU 통신',
    'LoRA/PEFT 효율적 파인튜닝',
    'TensorRT-LLM 변환 및 최적화',
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Layers className="w-16 h-16 text-blue-400" />
          <h2 className="text-5xl font-bold text-blue-400">NeMo Framework</h2>
        </div>

        <Card color="blue" className="p-8 mb-8">
          <p className="text-2xl text-gray-300 leading-relaxed">
            NVIDIA NeMo는 <span className="text-blue-400 font-semibold">대규모 언어 모델(LLM)</span>의
            학습, 파인튜닝, 최적화를 위한 <span className="text-purple-400 font-semibold">엔드투엔드 프레임워크</span>입니다.
            <span className="text-cyan-400 font-semibold"> PyTorch</span> 기반으로
            <span className="text-emerald-400 font-semibold"> NCCL</span>을 통한
            <span className="text-amber-400 font-semibold">분산 학습</span>을 지원합니다.
          </p>
        </Card>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {components.map((comp, idx) => (
            <Card key={idx} color={comp.color as any} className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-${comp.color}-500/20 flex items-center justify-center`}>
                  <comp.icon className={`w-10 h-10 text-${comp.color}-400`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{comp.name}</h4>
                  <p className="text-sm text-gray-300">{comp.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card color="purple" className="p-6">
            <h3 className="text-2xl font-semibold text-purple-400 mb-4">주요 기능</h3>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card color="cyan" className="p-6">
            <h3 className="text-2xl font-semibold text-cyan-400 mb-4">사용 사례</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• 도메인 특화 모델 파인튜닝</li>
              <li>• 사전학습 (Pre-training)</li>
              <li>• LoRA 어댑터 학습</li>
              <li>• TensorRT-LLM 최적화 추론</li>
            </ul>
          </Card>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Badge color="blue" size="lg">NeMo 24.07</Badge>
          <Badge color="purple" size="lg">PyTorch</Badge>
          <Badge color="cyan" size="lg">NCCL</Badge>
        </div>
      </div>
    </SlideWrapper>
  );
}
