import { SlideWrapper, Card, Badge } from '@shared/components';
import { AlertTriangle, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export default function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">AZ Rebalancing</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-3 text-amber-300">AZ Rebalancing 문제</h3>
              <p className="text-gray-300 mb-3">
                Auto Scaling Group은 AZ 간 인스턴스 수 불균형을 감지하면 자동으로 리밸런싱을 시도합니다.
                이 과정에서 의도치 않은 인스턴스 종료가 발생할 수 있습니다.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-6 h-6 text-rose-400" />
              <h4 className="font-semibold text-rose-300">기존 ASG 방식</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• AZ 간 인스턴스 수 차이 발생 시 자동 리밸런싱</li>
              <li>• 정상 인스턴스가 종료될 수 있음</li>
              <li>• PDB를 무시하고 종료 가능</li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h4 className="font-semibold text-emerald-300">Karpenter 방식</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Pod 요구사항에 따라 노드 프로비저닝</li>
              <li>• TSC가 AZ 분산을 보장</li>
              <li>• Disruption budget 준수</li>
            </ul>
          </Card>
        </div>

        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center justify-center gap-3">
            <Badge color="emerald">권장</Badge>
            <p className="text-blue-200">
              Karpenter + TSC 조합으로 AZ Rebalancing 문제 해결
            </p>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
