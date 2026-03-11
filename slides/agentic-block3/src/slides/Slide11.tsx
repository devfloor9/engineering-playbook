import { SlideWrapper, Card, Badge } from '@shared/components';
import { Layers, Grid, Share2 } from 'lucide-react';

export default function Slide11() {
  const strategies = [
    {
      icon: Layers,
      title: 'Tensor Parallelism (TP)',
      desc: '레이어 내 파라미터를 여러 GPU에 분산',
      use: '단일 노드 내에서 대규모 모델 배포',
      color: 'purple',
    },
    {
      icon: Share2,
      title: 'Expert Parallelism (EP)',
      desc: 'MoE 모델의 Expert를 여러 GPU에 분산',
      use: 'MoE 전용, 텐서 병렬화와 함께 사용',
      color: 'cyan',
    },
    {
      icon: Grid,
      title: 'Pipeline Parallelism (PP)',
      desc: '모델 레이어를 순차적으로 여러 GPU에 분산',
      use: '다중 노드 배포, 텐서 병렬 최대 사용 후',
      color: 'emerald',
    },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold text-blue-400 mb-8">MoE 배포 전략</h2>

        <div className="space-y-6 mb-8">
          {strategies.map((strategy, idx) => (
            <Card key={idx} className={`p-6 bg-gradient-to-r from-${strategy.color}-900/40 to-blue-900/40`}>
              <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-xl bg-${strategy.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <strategy.icon className={`w-10 h-10 text-${strategy.color}-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">{strategy.title}</h3>
                  <p className="text-lg text-gray-300 mb-3">{strategy.desc}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-800 text-gray-300">적용 시점</Badge>
                    <span className="text-gray-400">{strategy.use}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-gradient-to-r from-amber-900/40 to-purple-900/40">
          <h3 className="text-2xl font-semibold text-amber-400 mb-4">병렬화 조합 예시</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-300">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="font-semibold text-purple-400 mb-2">Mixtral 8x7B (47B)</div>
              <div className="text-sm">TP=2 (2× GPU) + EP 자동</div>
              <div className="text-xs text-gray-500 mt-1">p4d.24xlarge (A100 2개)</div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="font-semibold text-cyan-400 mb-2">Mixtral 8x22B (141B)</div>
              <div className="text-sm">TP=4 (4× GPU) + EP 자동</div>
              <div className="text-xs text-gray-500 mt-1">p5.48xlarge (H100 4개)</div>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
