import { SlideWrapper, Card, Badge } from '@shared/components';
import { MonitorCog, Activity, Gauge, Zap } from 'lucide-react';

export default function Slide04() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">
        <Badge className="bg-red-500/20 text-red-300 text-2xl px-4 py-2">도전과제 1</Badge>
      </h2>
      <h3 className="text-4xl font-bold mb-8 text-center text-red-300">
        GPU 모니터링 및 리소스 스케줄링
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <MonitorCog className="w-10 h-10 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-2xl font-semibold mb-2 text-red-300">핵심 문제</h4>
              <p className="text-lg text-gray-300">
                GPU 리소스는 비용이 높고 예측 불가능한 워크로드 패턴으로 인해 수동 관리가 비효율적
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Activity className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">실시간 모니터링</h4>
            <p className="text-sm text-gray-400">
              GPU 사용률, 메모리, 온도 등 실시간 메트릭 수집 필요
            </p>
          </Card>

          <Card className="p-5">
            <Gauge className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">동적 할당</h4>
            <p className="text-sm text-gray-400">
              워크로드 요구사항에 따른 GPU 리소스 자동 할당
            </p>
          </Card>

          <Card className="p-5">
            <Zap className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">빠른 프로비저닝</h4>
            <p className="text-sm text-gray-400">
              트래픽 급증 시 GPU 노드 빠른 프로비저닝 (2-3분 이내)
            </p>
          </Card>
        </div>

        <Card className="p-6 bg-red-900/20 border-red-700">
          <h4 className="text-xl font-semibold mb-3 text-red-300">기존 인프라의 한계</h4>
          <ul className="text-base text-gray-400 space-y-2">
            <li>• VM 기반 인프라: 프로비저닝 시간 5-10분, 자동화 제한적</li>
            <li>• 수동 관리: 운영 복잡도 높고 비용 최적화 어려움</li>
            <li>• 리소스 낭비: 유휴 GPU 리소스로 인한 비용 증가</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
