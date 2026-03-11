import { SlideWrapper, Card, Badge } from '@shared/components';
import { MonitorCog, Route, DollarSign, Settings } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
        4가지 핵심 도전과제
      </h2>
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <MonitorCog className="w-10 h-10 text-red-400 flex-shrink-0" />
              <div>
                <Badge color="red" size="lg">도전과제 1</Badge>
                <h3 className="text-2xl font-semibold mb-2 text-red-300">GPU 모니터링 및 리소스 스케줄링</h3>
                <p className="text-base text-gray-300">
                  동적 GPU 리소스 할당, 실시간 모니터링, 자동 스케일링
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Route className="w-10 h-10 text-cyan-400 flex-shrink-0" />
              <div>
                <Badge color="cyan" size="lg">도전과제 2</Badge>
                <h3 className="text-2xl font-semibold mb-2 text-cyan-300">동적 라우팅 및 스케일링</h3>
                <p className="text-base text-gray-300">
                  Agentic AI 요청의 지능적 라우팅과 자동 확장
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <DollarSign className="w-10 h-10 text-blue-400 flex-shrink-0" />
              <div>
                <Badge color="blue" size="lg">도전과제 3</Badge>
                <h3 className="text-2xl font-semibold mb-2 text-blue-300">토큰/세션 모니터링 및 비용 컨트롤</h3>
                <p className="text-base text-gray-300">
                  세밀한 수준의 사용량 추적과 비용 최적화
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Settings className="w-10 h-10 text-emerald-400 flex-shrink-0" />
              <div>
                <Badge color="emerald" size="lg">도전과제 4</Badge>
                <h3 className="text-2xl font-semibold mb-2 text-emerald-300">FM 파인튜닝과 자동화</h3>
                <p className="text-base text-gray-300">
                  Foundation Model 파인튜닝 파이프라인 자동화
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
