import { SlideWrapper, Card } from '@shared/components';
import { Cpu, Layers, Lock } from 'lucide-react';

export default function Slide04() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold text-center mb-2 text-amber-300">
        고객이 직면한 Pain Points
      </h2>
      <p className="text-xl text-gray-400 text-center mb-6">
        디지털 전환은 했지만, AI 워크로드는 차원이 다릅니다
      </p>

      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-6">
          <Card color="amber" className="p-6">
            <Cpu className="w-14 h-14 text-amber-400 mb-4" />
            <h4 className="text-2xl font-semibold mb-3 text-amber-300">
              GPU 스케일링의 벽
            </h4>
            <p className="text-base text-gray-300 mb-4">
              컨테이너화는 했는데 AI 워크로드 운영이 다릅니다.
              GPU 할당, MIG 파티셔닝, 노드 프로비저닝 — 전통적 DevOps로는 한계.
            </p>
            <div className="bg-amber-500/20 rounded-lg px-4 py-3 border-2 border-amber-400/50">
              <p className="text-sm text-white font-bold">
                GPU 유휴율 평균 <span className="text-amber-300">60%</span> — 최적화 없이는 비용 폭증
              </p>
            </div>
          </Card>

          <Card color="rose" className="p-6">
            <Layers className="w-14 h-14 text-rose-400 mb-4" />
            <h4 className="text-2xl font-semibold mb-3 text-rose-300">
              인프라 복잡성 폭증
            </h4>
            <p className="text-base text-gray-300 mb-4">
              AI 에이전트 하나에 15+ 컴포넌트가 필요합니다.
              LLM, 벡터DB, 게이트웨이, 모니터링, 캐시 — 관리 포인트 급증.
            </p>
            <div className="bg-rose-500/20 rounded-lg px-4 py-3 border-2 border-rose-400/50">
              <p className="text-sm text-white font-bold">
                AI 인프라 관리에 엔지니어 시간의 <span className="text-rose-300">40%</span> 소비
              </p>
            </div>
          </Card>

          <Card color="purple" className="p-6">
            <Lock className="w-14 h-14 text-purple-400 mb-4" />
            <h4 className="text-2xl font-semibold mb-3 text-purple-300">
              규제 & 데이터 주권
            </h4>
            <p className="text-base text-gray-300 mb-4">
              금융, 의료, 통신 산업의 데이터 주권 요구.
              온프레미스 데이터 + 클라우드 AI 인프라의 하이브리드 구성 필수.
            </p>
            <div className="bg-purple-500/20 rounded-lg px-4 py-3 border-2 border-purple-400/50">
              <p className="text-sm text-white font-bold">
                국내 기업 <span className="text-purple-300">72%</span>가 하이브리드 AI 인프라 요구
              </p>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
