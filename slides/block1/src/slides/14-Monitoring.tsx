import { SlideWrapper, Card } from '@shared/components';
import { Activity, Bell, Eye } from 'lucide-react';

export default function MonitoringSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <Activity className="w-10 h-10 text-cyan-400" />
        모니터링 & 알림
      </h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <Card title="ArgoCD 메트릭" icon={<Eye className="w-6 h-6" />} color="blue">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• 동기화 상태 (Synced / OutOfSync)</li>
              <li>• Health 상태 (Healthy / Degraded)</li>
              <li>• 동기화 소요 시간</li>
              <li>• API 응답 시간</li>
            </ul>
          </Card>

          <Card title="Application 메트릭" icon={<Activity className="w-6 h-6" />} color="emerald">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• Pod Restart 횟수</li>
              <li>• CPU/Memory 사용률</li>
              <li>• 배포 성공/실패율</li>
              <li>• Rollback 빈도</li>
            </ul>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="알림 채널" icon={<Bell className="w-6 h-6" />} color="amber">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• Slack: 동기화 성공/실패</li>
              <li>• PagerDuty: Critical 장애</li>
              <li>• Email: 일일 리포트</li>
              <li>• CloudWatch: AWS 통합 알림</li>
            </ul>
          </Card>

          <Card title="Notification Triggers" color="purple">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• OutOfSync 상태 지속</li>
              <li>• Health Degraded/Failed</li>
              <li>• 동기화 재시도 반복</li>
              <li>• Policy 위반 감지</li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">대시보드 구성</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-500/10 rounded p-3 border border-blue-500/30">
            <div className="text-blue-400 font-bold mb-2">Grafana</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• ArgoCD 메트릭 시각화</li>
              <li>• Application 상태 집계</li>
              <li>• 히스토리 트렌드 분석</li>
            </ul>
          </div>

          <div className="bg-emerald-500/10 rounded p-3 border border-emerald-500/30">
            <div className="text-emerald-400 font-bold mb-2">Prometheus</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 메트릭 수집 및 저장</li>
              <li>• Alert Rules 정의</li>
              <li>• PromQL 쿼리</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 rounded p-3 border border-amber-500/30">
            <div className="text-amber-400 font-bold mb-2">ArgoCD UI</div>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 실시간 동기화 상태</li>
              <li>• Resource Tree 시각화</li>
              <li>• Diff 뷰어</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
