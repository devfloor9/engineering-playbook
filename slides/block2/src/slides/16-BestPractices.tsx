import { SlideWrapper, Card, Badge } from '@shared/components';
import { CheckCircle2, AlertTriangle, Target, Zap } from 'lucide-react';

export function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">운영 베스트 프랙티스</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card title="프로덕션 배포" icon={<CheckCircle2 className="w-5 h-5" />} color="emerald">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 mb-3">
                <Badge color="emerald" size="sm">단계적 접근</Badge>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li><span className="text-emerald-400">1단계</span>: Dev 환경에 배포 및 테스트</li>
                <li><span className="text-emerald-400">2단계</span>: Staging에서 부하 테스트</li>
                <li><span className="text-emerald-400">3단계</span>: Production 일부 노드 적용</li>
                <li><span className="text-emerald-400">4단계</span>: 전체 클러스터 롤아웃</li>
              </ul>
            </div>
          </Card>

          <Card title="알림 임계값 조정" icon={<Target className="w-5 h-5" />} color="amber">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 mb-3">
                <Badge color="amber" size="sm">환경별 최적화</Badge>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• <span className="text-amber-400">Dev</span>: 느슨한 임계값 (학습용)</li>
                <li>• <span className="text-amber-400">Staging</span>: 프로덕션 수준</li>
                <li>• <span className="text-amber-400">Prod</span>: 엄격한 임계값</li>
                <li>• <span className="text-amber-400">Critical</span>: 즉시 알림</li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-5 border border-blue-500/30">
          <div className="flex items-start gap-3 mb-4">
            <Zap className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-blue-400 font-bold mb-2">자동 복구 활성화</h4>
              <p className="text-sm text-gray-400">
                초기에는 모니터링만 활성화하고, 충분한 데이터를 수집한 후 Node Auto Repair를 점진적으로 활성화합니다.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-cyan-400 font-semibold mb-1">Week 1-2</p>
              <p className="text-gray-500">모니터링만, 알림 튜닝</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-cyan-400 font-semibold mb-1">Week 3-4</p>
              <p className="text-gray-500">Dev에서 자동 복구 테스트</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-cyan-400 font-semibold mb-1">Week 5+</p>
              <p className="text-gray-500">Prod 자동 복구 활성화</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-rose-400 font-bold mb-3">정기적인 테스트</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• 월별 장애 시뮬레이션 (Chaos Engineering)</li>
                  <li>• Spot 중단 시나리오 테스트</li>
                  <li>• Node Drain 시간 측정</li>
                  <li>• 복구 프로세스 검증</li>
                  <li>• 알림 및 대시보드 확인</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-900/20 rounded-xl p-5 border border-purple-500/30">
            <h4 className="text-purple-400 font-bold mb-3">다른 도구와의 통합</h4>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-blue-400 font-semibold mb-1">AWS 네이티브</p>
                <p className="text-gray-500 text-xs">NMA + Container Insights + CloudWatch</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-emerald-400 font-semibold mb-1">오픈소스 스택</p>
                <p className="text-gray-500 text-xs">NMA + Prometheus + Grafana</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-purple-400 font-semibold mb-1">엔터프라이즈</p>
                <p className="text-gray-500 text-xs">NMA + Datadog/New Relic</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
          <h4 className="text-cyan-400 font-bold mb-2 text-sm">핵심 권장사항</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <ul className="space-y-1">
              <li>• NMA를 노드 상태 감지 레이어로 활용</li>
              <li>• Container Insights나 Prometheus로 메트릭 보완</li>
              <li>• Node Auto Repair와 함께 사용</li>
            </ul>
            <ul className="space-y-1">
              <li>• 환경별로 임계값 조정</li>
              <li>• Spot 인스턴스와 NTH 함께 사용</li>
              <li>• 정기적인 장애 시뮬레이션 수행</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
