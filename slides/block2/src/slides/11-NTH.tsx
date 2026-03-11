import { SlideWrapper, Card, Badge } from '@shared/components';
import { Zap, Bell, Shield } from 'lucide-react';

export function Slide11() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">Node Termination Handler</h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-rose-900/30 to-orange-900/30 rounded-xl p-6 border border-rose-500/30">
          <div className="flex items-start gap-4">
            <Bell className="w-8 h-8 text-rose-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-rose-300 mb-2">AWS Node Termination Handler (NTH)</h3>
              <p className="text-gray-300 leading-relaxed">
                EC2 인스턴스 종료 이벤트를 사전에 감지하여 Pod를 안전하게 이동시키는 도구입니다.
                Spot 인스턴스 중단, 예약된 유지보수, EC2 상태 이벤트를 처리합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card title="Spot 중단" icon={<Zap className="w-5 h-5" />} color="rose">
            <div className="space-y-2">
              <p className="text-xs text-gray-500">2분 사전 알림</p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>• EC2 메타데이터 모니터링</li>
                <li>• Spot 중단 알림 감지</li>
                <li>• 노드 Cordon</li>
                <li>• Pod Graceful 종료</li>
                <li>• Drain 실행</li>
              </ul>
              <Badge color="rose" size="sm">높은 우선순위</Badge>
            </div>
          </Card>

          <Card title="예약된 유지보수" icon={<Shield className="w-5 h-5" />} color="amber">
            <div className="space-y-2">
              <p className="text-xs text-gray-500">사전 계획된 이벤트</p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>• EC2 유지보수 일정</li>
                <li>• 리부팅 알림</li>
                <li>• 하드웨어 교체</li>
                <li>• 계획된 다운타임</li>
                <li>• 사전 재배치</li>
              </ul>
              <Badge color="amber" size="sm">계획 가능</Badge>
            </div>
          </Card>

          <Card title="상태 이벤트" icon={<Bell className="w-5 h-5" />} color="orange">
            <div className="space-y-2">
              <p className="text-xs text-gray-500">인스턴스 헬스 문제</p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>• 하드웨어 장애</li>
                <li>• 네트워크 문제</li>
                <li>• 인스턴스 상태 확인 실패</li>
                <li>• 시스템 상태 확인 실패</li>
                <li>• 자동 복구 트리거</li>
              </ul>
              <Badge color="orange" size="sm">반응형</Badge>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-emerald-500/30">
            <h4 className="text-emerald-400 font-bold mb-3">NTH의 이점</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• ✅ 서비스 중단 최소화</li>
              <li>• ✅ Pod 안전한 재배치</li>
              <li>• ✅ Spot 인스턴스 비용 절감</li>
              <li>• ✅ 자동화된 장애 대응</li>
              <li>• ✅ Graceful shutdown 보장</li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-blue-500/30">
            <h4 className="text-blue-400 font-bold mb-3">배포 모드</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-blue-300 font-medium">IMDS Mode (기본)</p>
                <p className="text-gray-500 text-xs">각 노드에서 EC2 메타데이터 폴링</p>
              </div>
              <div>
                <p className="text-cyan-300 font-medium">Queue Processor Mode</p>
                <p className="text-gray-500 text-xs">SQS + EventBridge로 중앙 집중식 처리</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
