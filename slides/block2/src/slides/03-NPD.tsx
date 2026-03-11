import { SlideWrapper, Card } from '@shared/components';
import { Activity, Layers, Zap } from 'lucide-react';

export function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">Node Problem Detector 개요</h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/30">
          <p className="text-lg text-gray-300 leading-relaxed">
            NMA는 Kubernetes의 Node Problem Detector 패턴을 기반으로 구축되어,
            노드의 다양한 시스템 컴포넌트를 지속적으로 모니터링합니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card title="포괄적 모니터링" icon={<Layers className="w-5 h-5" />} color="blue">
            <ul className="space-y-2 text-sm">
              <li>• Container Runtime</li>
              <li>• Storage System</li>
              <li>• Networking</li>
              <li>• Kernel</li>
              <li>• Accelerated Hardware</li>
            </ul>
          </Card>

          <Card title="Kubernetes 통합" icon={<Activity className="w-5 h-5" />} color="emerald">
            <ul className="space-y-2 text-sm">
              <li>• controller-runtime 사용</li>
              <li>• Node Conditions 보고</li>
              <li>• Events 생성</li>
              <li>• CRD 기반 진단</li>
            </ul>
          </Card>

          <Card title="다양한 환경 지원" icon={<Zap className="w-5 h-5" />} color="purple">
            <ul className="space-y-2 text-sm">
              <li>• EKS Auto Mode</li>
              <li>• Legacy RBAC</li>
              <li>• Standard Mode</li>
              <li>• 특별한 인증 플로우</li>
            </ul>
          </Card>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700/50 mt-6">
          <h4 className="text-sm font-semibold text-amber-400 mb-3">중요 권장사항</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-400 font-medium mb-2">권장하는 사용법</p>
              <ul className="text-gray-400 space-y-1">
                <li>• 노드 상태 감지 레이어로 활용</li>
                <li>• Container Insights로 메트릭 보완</li>
                <li>• Node Auto Repair와 함께 사용</li>
              </ul>
            </div>
            <div>
              <p className="text-rose-400 font-medium mb-2">피해야 할 사용법</p>
              <ul className="text-gray-400 space-y-1">
                <li>• NMA만으로 전체 모니터링 의존</li>
                <li>• 급격한 하드웨어 장애 대응 기대</li>
                <li>• 메트릭 수집 도구로 사용</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
