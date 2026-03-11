import { SlideWrapper, Card } from '@shared/components';
import { Database, Gauge, Settings } from 'lucide-react';

export default function Slide12() {
  const optimizations = [
    {
      category: 'GPU 메모리 관리',
      icon: Database,
      items: [
        'gpu-memory-utilization: 0.90-0.95',
        'max-model-len: 실제 워크로드에 맞게 조정',
        'max-num-seqs: 동시 처리 시퀀스 수 제한',
      ],
      color: 'cyan',
    },
    {
      category: 'KV Cache 최적화',
      icon: Gauge,
      items: [
        'enable-prefix-caching: 공통 프리픽스 재사용',
        'kv-cache-dtype: fp8 (2배 메모리 절감)',
        'Chunked Prefill: 메모리 효율 향상',
      ],
      color: 'purple',
    },
    {
      category: '동적 Expert 로딩',
      icon: Settings,
      items: [
        'Expert 활성화 패턴 모니터링',
        '사용 빈도 낮은 Expert Offload',
        'Token Capacity Factor 조정',
      ],
      color: 'emerald',
    },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold text-emerald-400 mb-8">MoE 리소스 최적화</h2>

        <div className="space-y-6">
          {optimizations.map((opt, idx) => (
            <Card key={idx} className={`p-6 bg-gradient-to-r from-${opt.color}-900/40 to-blue-900/40`}>
              <div className="flex items-start gap-6">
                <div className={`w-14 h-14 rounded-xl bg-${opt.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <opt.icon className={`w-8 h-8 text-${opt.color}-400`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4">{opt.category}</h3>
                  <ul className="space-y-2">
                    {opt.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-3 text-lg text-gray-300">
                        <span className={`text-${opt.color}-400`}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-8 p-6 bg-gradient-to-r from-amber-900/40 to-purple-900/40">
          <h3 className="text-2xl font-semibold text-amber-400 mb-4">전체 Expert 메모리 로드 필요</h3>
          <p className="text-lg text-gray-300">
            MoE 모델은 활성화되는 파라미터는 적지만, <span className="text-purple-400 font-semibold">전체 Expert를 메모리에 로드</span>해야 합니다.
            따라서 <span className="text-cyan-400 font-semibold">충분한 GPU 메모리 확보</span>가 중요하며,
            <span className="text-emerald-400 font-semibold"> 텐서 병렬화</span>를 통해 메모리를 분산해야 합니다.
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
