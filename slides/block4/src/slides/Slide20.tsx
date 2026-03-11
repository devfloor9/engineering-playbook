import { SlideWrapper, Card } from '@shared/components';
import { Target, Layers, Shield, FlaskConical } from 'lucide-react';

export default function Slide20() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Key Takeaways</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-5 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-4">
            <Target className="w-7 h-7 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-300">Failure Domain 이해가 핵심</h3>
              <p className="text-gray-300 text-sm">
                Pod → Node → AZ → Region 각 계층마다 적절한 대응 전략 수립
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-emerald-500/10 border-emerald-500/30">
          <div className="flex items-start gap-4">
            <Layers className="w-7 h-7 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-emerald-300">Multi-AZ는 기본, TSC는 필수</h3>
              <p className="text-gray-300 text-sm">
                Topology Spread Constraints + Karpenter로 AZ 장애 내성 확보
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-purple-500/10 border-purple-500/30">
          <div className="flex items-start gap-4">
            <Shield className="w-7 h-7 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-purple-300">PDB + Circuit Breaker + Graceful Shutdown</h3>
              <p className="text-gray-300 text-sm">
                애플리케이션 레벨 레질리언시 패턴은 인프라만큼 중요
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-start gap-4">
            <FlaskConical className="w-7 h-7 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold mb-2 text-amber-300">Chaos Engineering으로 검증</h3>
              <p className="text-gray-300 text-sm">
                "모든 것이 정상일 때" 테스트하여 "장애 발생 시" 대비
              </p>
            </div>
          </div>
        </Card>

        <div className="text-center text-2xl font-bold text-gray-400 mt-4">
          장애는 반드시 발생한다 — <span className="text-blue-400">설계로 대비한다</span>
        </div>
      </div>
    </SlideWrapper>
  );
}
