import { SlideWrapper, Card } from '@shared/components';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function Slide20() {
  const keyPoints = [
    {
      title: 'vLLM',
      points: [
        'PagedAttention: 60-80% 메모리 절감',
        'Continuous Batching: 2-24배 처리량',
        'FP8 KV Cache, Multi-LoRA (v0.6+)',
      ],
    },
    {
      title: 'llm-d',
      points: [
        'Prefix-Aware 지능형 라우팅',
        'Kubernetes Gateway API 통합',
        'EKS Auto Mode GPU 자동 프로비저닝',
      ],
    },
    {
      title: 'MoE',
      points: [
        'Expert Parallelism + Tensor Parallelism',
        '전체 Expert 메모리 로드 필요',
        'Mixtral, DeepSeek 효율적 추론',
      ],
    },
    {
      title: 'GPU 관리',
      points: [
        'DRA (K8s 1.33+ GA): 유연한 파티셔닝',
        'DCGM 메트릭 기반 자동 스케일링',
        'Karpenter 노드 자동 프로비저닝',
      ],
    },
    {
      title: 'NeMo',
      points: [
        'PyTorch + NCCL 분산 학습',
        'LoRA/PEFT 효율적 파인튜닝',
        'TensorRT-LLM 최적화 추론',
      ],
    },
  ];

  const nextSteps = [
    'Block 4: 게이트웨이 & 에이전트 라우팅',
    'LiteLLM 통합 게이트웨이',
    '멀티 모델 A/B 테스팅',
    'Agentic 워크플로우 오케스트레이션',
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          핵심 정리 &amp; 다음 단계
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {keyPoints.slice(0, 3).map((section, idx) => (
            <Card key={idx} color="blue" className="p-6">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.points.map((point, pidx) => (
                  <li key={pidx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {keyPoints.slice(3, 5).map((section, idx) => (
            <Card key={idx} color="purple" className="p-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.points.map((point, pidx) => (
                  <li key={pidx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card color="emerald" className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <ArrowRight className="w-12 h-12 text-emerald-400" />
            <h3 className="text-3xl font-bold text-emerald-400">다음 단계</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {nextSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <span className="text-lg text-gray-300">{step}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
