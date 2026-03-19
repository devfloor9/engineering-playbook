import { SlideWrapper, Card, Badge } from '@shared/components';
import { Server, Cpu, Zap, BarChart3 } from 'lucide-react';

export default function Slide06() {
  return (
    <SlideWrapper>
      <div className="flex items-center gap-4 mb-4">
        <Badge color="blue" size="lg" className="text-2xl px-5 py-2">기둥 1</Badge>
        <h2 className="text-5xl font-bold text-blue-300">Cloud Native LLMOps</h2>
      </div>
      <p className="text-xl text-gray-400 mb-4">
        EKS — LLMOps를 완벽하게 지원하는 관리형 Kubernetes
      </p>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <Card color="blue" className="p-5">
            <Server className="w-12 h-12 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">EKS + GPU Operator + run.ai</h4>
            <p className="text-base text-gray-300">
              GPU Operator로 드라이버/런타임 자동 관리, run.ai로 GPU 워크로드 스케줄링 및
              리소스 할당을 최적화하여 운영 안정성 확보
            </p>
          </Card>

          <Card color="cyan" className="p-5">
            <Zap className="w-12 h-12 text-cyan-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-cyan-300">vLLM + llm-d 모델 서빙</h4>
            <p className="text-base text-gray-300">
              PagedAttention v2 기반 고성능 추론. llm-d의 Prefix-cache aware 라우팅으로
              TTFT 40% 단축, 처리량 2배 향상
            </p>
          </Card>

          <Card color="emerald" className="p-5">
            <Cpu className="w-12 h-12 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">MIG 파티셔닝 + DRA</h4>
            <p className="text-base text-gray-300">
              NVIDIA MIG로 하나의 GPU를 7개 워크로드에 분할. DRA로
              GPU 리소스를 Pod 단위로 동적 할당
            </p>
          </Card>

          <Card color="amber" className="p-5">
            <BarChart3 className="w-12 h-12 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">Karpenter 자동 스케일링</h4>
            <p className="text-base text-gray-300">
              GPU 인스턴스 자동 프로비저닝. Spot/On-Demand 혼합 전략으로
              비용 최적화. H100, L40S, Inferentia2 지원
            </p>
          </Card>
        </div>

        <div className="bg-blue-500/20 rounded-xl px-8 py-5 border-2 border-blue-400/60 text-center" style={{boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)'}}>
          <p className="text-2xl font-bold text-white">
            비용 최적화 + 운영 안정성 동시 달성 — 50 req/s 기준 월 <span className="text-blue-300">$4,900</span>
          </p>
          <p className="text-base text-gray-300 mt-2">
            GPU Operator + run.ai + MIG + Karpenter Spot + Semantic Caching
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
