import { SlideWrapper, Card, Badge } from '@shared/components';
import { Target, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

export function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">개요</h2>

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-xl font-bold text-blue-300 mb-3">EKS Node Monitoring Agent란?</h3>
          <p className="text-gray-300 leading-relaxed">
            AWS가 제공하는 노드 상태 모니터링 도구로, EKS 클러스터의 노드에서 발생하는 하드웨어 및 시스템 레벨 문제를 자동으로 감지하고 보고합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card title="해결하는 문제" icon={<AlertTriangle className="w-5 h-5" />} color="amber">
            <ul className="space-y-2">
              <li>• 하드웨어 장애 조기 감지 부족</li>
              <li>• 시스템 레벨 문제의 수동 모니터링</li>
              <li>• 노드 상태 변화의 지연된 대응</li>
              <li>• 문제 감지와 자동 복구의 통합 부재</li>
            </ul>
          </Card>

          <Card title="핵심 특징" icon={<CheckCircle2 className="w-5 h-5" />} color="emerald">
            <ul className="space-y-2">
              <li>• 로그 기반 실시간 문제 감지</li>
              <li>• 자동 이벤트 및 Condition 생성</li>
              <li>• CloudWatch 통합</li>
              <li>• EKS Add-on 지원</li>
            </ul>
          </Card>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Badge color="blue">2024 정식 출시</Badge>
          <Badge color="emerald">Node Auto Repair 연동</Badge>
          <Badge color="purple">DaemonSet 기반</Badge>
        </div>
      </div>
    </SlideWrapper>
  );
}
