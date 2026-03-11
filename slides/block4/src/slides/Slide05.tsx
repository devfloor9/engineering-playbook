import { SlideWrapper, Card, Badge } from '@shared/components';
import { Box, Cpu, DollarSign } from 'lucide-react';

export default function Slide05() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">노드 그룹 HA 전략</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Box className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-300">Karpenter Multi-AZ 설정</h3>
              <p className="text-gray-300">
                NodePool의 requirements에 여러 AZ를 지정하여 노드를 고르게 분산
              </p>
            </div>
          </div>
          <div className="pl-12 space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Badge color="emerald">topology.kubernetes.io/zone</Badge>
              <span>3개 AZ에 걸쳐 노드 프로비저닝</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="blue">karpenter.sh/capacity-type</Badge>
              <span>Spot + On-Demand 혼합 전략</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Cpu className="w-7 h-7 text-purple-400 mb-3" />
            <h4 className="font-semibold mb-2 text-purple-300">Disruption Budget</h4>
            <p className="text-sm text-gray-400">동시에 20% 이상의 노드가 중단되지 않도록 제한</p>
            <code className="text-xs text-emerald-400 mt-2 block">budgets: ["20%"]</code>
          </Card>
          <Card className="p-5">
            <DollarSign className="w-7 h-7 text-amber-400 mb-3" />
            <h4 className="font-semibold mb-2 text-amber-300">Spot 인스턴스</h4>
            <p className="text-sm text-gray-400">15개 이상의 다양한 인스턴스 타입 지정</p>
            <code className="text-xs text-emerald-400 mt-2 block">c6i, c7i, m6i</code>
          </Card>
          <Card className="p-5">
            <Box className="w-7 h-7 text-cyan-400 mb-3" />
            <h4 className="font-semibold mb-2 text-cyan-300">Consolidation</h4>
            <p className="text-sm text-gray-400">비용 최적화와 가용성 균형</p>
            <code className="text-xs text-emerald-400 mt-2 block">WhenEmptyOrUnderutilized</code>
          </Card>
        </div>

        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <p className="text-sm text-amber-200 text-center">
            ⚠️ 미션 크리티컬 워크로드의 base capacity는 반드시 On-Demand로 운영
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
