import { SlideWrapper, Card, Badge } from '@shared/components';
import { TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Graceful Degradation</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-4">
            <TrendingDown className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-300">점진적 성능 저하 전략</h3>
              <p className="text-gray-300">
                시스템 부하가 증가하거나 일부 장애가 발생했을 때, 완전 중단이 아닌 
                <span className="text-blue-300 font-bold"> 핵심 기능만 유지</span>하며 점진적으로 성능을 낮춤
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h4 className="font-semibold text-emerald-300">Level 1: 정상</h4>
            </div>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• 모든 기능 제공</li>
              <li>• 실시간 추천</li>
              <li>• 고해상도 이미지</li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <h4 className="font-semibold text-amber-300">Level 2: 저하</h4>
            </div>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• 핵심 기능만 제공</li>
              <li>• 캐시된 추천</li>
              <li>• 저해상도 이미지</li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-6 h-6 text-rose-400" />
              <h4 className="font-semibold text-rose-300">Level 3: 최소</h4>
            </div>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>• 읽기 전용 모드</li>
              <li>• 추천 비활성화</li>
              <li>• 정적 콘텐츠만</li>
            </ul>
          </Card>
        </div>

        <Card className="p-4 bg-purple-500/10 border-purple-500/30">
          <div className="flex items-center justify-center gap-3">
            <Badge color="purple">패턴</Badge>
            <p className="text-purple-200">
              Feature Flag, Rate Limiting, Fallback Response 조합
            </p>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
