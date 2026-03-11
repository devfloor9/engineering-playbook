import { SlideWrapper, Card, Badge } from '@shared/components';
import { Zap, FlaskConical, Target } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Chaos Engineering</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-purple-500/10 border-purple-500/30">
          <div className="flex items-start gap-4">
            <FlaskConical className="w-8 h-8 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">카오스 엔지니어링이란?</h3>
              <p className="text-gray-300">
                프로덕션 환경에서 시스템의 레질리언시를 검증하는 실천적 방법론
              </p>
              <p className="text-gray-400 mt-2 text-sm">
                "모든 것이 정상일 때" 테스트하여 "장애가 발생했을 때" 대비
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Zap className="w-7 h-7 text-amber-400 mb-3" />
            <h4 className="font-semibold mb-2 text-amber-300">AWS FIS</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• Pod 삭제</li>
              <li>• AZ 장애 시뮬레이션</li>
              <li>• 네트워크 지연 주입</li>
            </ul>
            <Badge color="amber" className="mt-3">관리형</Badge>
          </Card>

          <Card className="p-5">
            <FlaskConical className="w-7 h-7 text-blue-400 mb-3" />
            <h4 className="font-semibold mb-2 text-blue-300">Litmus Chaos</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• CNCF 인큐베이팅</li>
              <li>• Kubernetes 네이티브</li>
              <li>• ChaosCenter UI</li>
            </ul>
            <Badge color="blue" className="mt-3">오픈소스</Badge>
          </Card>

          <Card className="p-5">
            <Target className="w-7 h-7 text-cyan-400 mb-3" />
            <h4 className="font-semibold mb-2 text-cyan-300">Chaos Mesh</h4>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• CNCF 인큐베이팅</li>
              <li>• 다양한 장애 유형</li>
              <li>• NetworkChaos</li>
            </ul>
            <Badge color="cyan" className="mt-3">오픈소스</Badge>
          </Card>
        </div>

        <Card className="p-4 bg-rose-500/10 border-rose-500/30">
          <p className="text-center text-sm text-rose-200">
            ⚠️ 프로덕션 환경에서 실행 시 반드시 Stop Condition 설정 (CloudWatch Alarm 기반)
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
