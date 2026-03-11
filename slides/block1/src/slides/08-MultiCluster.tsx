import { SlideWrapper, FlowDiagram, Card } from '@shared/components';
import { Network } from 'lucide-react';

export default function MultiClusterSlide() {
  const nodes = [
    { id: 'hub', label: 'Hub Cluster', x: 350, y: 30, width: 140, height: 60, color: 'blue', description: 'ArgoCD 실행' },
    { id: 'dev', label: 'Dev Cluster', x: 100, y: 150, width: 120, height: 60, color: 'emerald' },
    { id: 'staging', label: 'Staging Cluster', x: 300, y: 150, width: 140, height: 60, color: 'amber' },
    { id: 'prod1', label: 'Prod-US', x: 500, y: 150, width: 120, height: 60, color: 'rose' },
    { id: 'prod2', label: 'Prod-EU', x: 680, y: 150, width: 120, height: 60, color: 'rose' },
  ];

  const edges = [
    { from: 'hub', to: 'dev', label: 'Deploy', color: 'emerald' },
    { from: 'hub', to: 'staging', label: 'Deploy', color: 'amber' },
    { from: 'hub', to: 'prod1', label: 'Deploy', color: 'rose' },
    { from: 'hub', to: 'prod2', label: 'Deploy', color: 'rose' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <Network className="w-10 h-10 text-cyan-400" />
        멀티 클러스터 관리
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={850} height={250} title="Hub-and-Spoke 아키텍처" />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card title="Cluster Generator" color="blue">
          <p className="text-xs mb-2">클러스터 레지스트리 기반 자동 배포</p>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>• 레이블 기반 그룹핑</li>
            <li>• 동적 클러스터 추가/제거</li>
            <li>• 환경별 자동 라우팅</li>
          </ul>
        </Card>

        <Card title="Git Directory Generator" color="emerald">
          <p className="text-xs mb-2">디렉토리 구조 기반 배포</p>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>• 환경별 overlays 자동 매핑</li>
            <li>• 클러스터별 오버라이드</li>
            <li>• 파일 기반 변경 감지</li>
          </ul>
        </Card>

        <Card title="Matrix Generator" color="amber">
          <p className="text-xs mb-2">클러스터 × 앱 조합 관리</p>
          <ul className="text-xs space-y-1 text-gray-400">
            <li>• 조건부 배포 규칙</li>
            <li>• 크로스 프로덕트 생성</li>
            <li>• 복잡한 토폴로지 지원</li>
          </ul>
        </Card>
      </div>

      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-bold mb-2 text-sm">ApplicationSets = 멀티클러스터 템플릿</h3>
        <p className="text-xs text-gray-400">
          하나의 ApplicationSet으로 수십~수백 개의 클러스터에 동일한 애플리케이션을 일관되게 배포하고,
          환경별 차이는 Generator 파라미터로 주입합니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
