import { SlideWrapper, Card, Badge } from '@shared/components';
import { CheckCircle2, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

export function Slide17() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-blue-400">Key Takeaways</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card title="NMA 핵심 역할" icon={<CheckCircle2 className="w-5 h-5" />} color="blue">
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 노드 상태 자동 감지 (Container, Storage, Network, Kernel)</li>
              <li>• Node Conditions 및 Events 생성</li>
              <li>• CloudWatch 통합으로 중앙 집중식 모니터링</li>
              <li>• Node Auto Repair 트리거 역할</li>
              <li>• 경량 DaemonSet (CPU 10m, Memory 30Mi)</li>
            </ul>
          </Card>

          <Card title="NTH 핵심 역할" icon={<AlertTriangle className="w-5 h-5" />} color="rose">
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Spot 인스턴스 중단 2분 전 감지</li>
              <li>• 예약된 유지보수 및 상태 이벤트 처리</li>
              <li>• Node Cordon 및 Pod Drain 자동화</li>
              <li>• Graceful shutdown 보장</li>
              <li>• 서비스 무중단 노드 교체</li>
            </ul>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-xl p-6 border border-emerald-500/30">
          <div className="flex items-start gap-4">
            <Lightbulb className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-emerald-300 mb-3">중요한 이해</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-emerald-400 font-semibold mb-2">NMA는 무엇이 아닌가?</p>
                  <ul className="text-gray-400 space-y-1">
                    <li>• 메트릭 수집 도구 아님</li>
                    <li>• Container Insights 대체 불가</li>
                    <li>• 급격한 장애는 감지 제한적</li>
                    <li>• 완전한 네트워크 단절 감지 불가</li>
                  </ul>
                </div>
                <div>
                  <p className="text-cyan-400 font-semibold mb-2">올바른 사용법</p>
                  <ul className="text-gray-400 space-y-1">
                    <li>• 노드 상태 감지 레이어로 사용</li>
                    <li>• Prometheus로 메트릭 보완</li>
                    <li>• Node Auto Repair와 연동</li>
                    <li>• 다층 모니터링 스택 구성</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
            <h4 className="text-purple-400 font-bold mb-3 text-sm flex items-center gap-2">
              <Badge color="purple">배포</Badge>
              두 가지 모드
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span className="text-purple-400">Manual DaemonSet</span>: 유연한 설정</li>
              <li><span className="text-purple-400">EKS Auto</span>: AMI 내장, 높은 가용성</li>
            </ul>
          </div>

          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
            <h4 className="text-amber-400 font-bold mb-3 text-sm flex items-center gap-2">
              <Badge color="amber">통합</Badge>
              모니터링 스택
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><span className="text-amber-400">L1</span>: NMA (상태 감지)</li>
              <li><span className="text-amber-400">L2</span>: Prometheus (메트릭)</li>
              <li><span className="text-amber-400">L3</span>: Auto Repair (복구)</li>
              <li><span className="text-amber-400">L4</span>: Grafana (시각화)</li>
            </ul>
          </div>

          <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
            <h4 className="text-cyan-400 font-bold mb-3 text-sm flex items-center gap-2">
              <Badge color="cyan">비용</Badge>
              최적화
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>• Spot 인스턴스 90% 절감</li>
              <li>• NMA 경량 ($50-100/월)</li>
              <li>• 메트릭 필터링</li>
              <li>• 로그 보존 기간 조정</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-5 border border-blue-500/30 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-300">성공적인 운영을 위한 권장사항</h3>
          </div>
          <p className="text-gray-300 text-sm">
            단계적 롤아웃 → 임계값 조정 → 자동 복구 신중히 활성화 → 정기적 테스트 → 다층 모니터링 스택 구축
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
