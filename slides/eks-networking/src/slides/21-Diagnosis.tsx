import { SlideWrapper, Card } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { SearchCheck } from 'lucide-react';

export default function DiagnosisSlide() {
  const nodes = [
    { id: 'sym', label: '"Enabled인데 데이터 없음"', x: 20, y: 110, width: 210, height: 50, color: 'rose' },
    { id: 'l1', label: '1. Agent publish', x: 330, y: 20, width: 160, height: 50, color: 'blue', description: 'status:200 로그?' },
    { id: 'l2', label: '2. Scope', x: 330, y: 110, width: 160, height: 50, color: 'purple', description: '계정 포함 여부' },
    { id: 'l3', label: '3. Monitor', x: 330, y: 200, width: 160, height: 50, color: 'amber', description: '리소스 쌍 커버?' },
    { id: 'fix1', label: '인증·권한·전송 경로', x: 580, y: 20, width: 210, height: 50, color: 'blue' },
    { id: 'fix2', label: 'Scope에 계정 추가', x: 580, y: 110, width: 210, height: 50, color: 'purple' },
    { id: 'fix3', label: 'local 리소스 범위 확인', x: 580, y: 200, width: 210, height: 50, color: 'amber' },
  ];

  const edges = [
    { from: 'sym', to: 'l1', label: '순서대로', color: 'blue' },
    { from: 'sym', to: 'l2', color: 'purple' },
    { from: 'sym', to: 'l3', color: 'amber' },
    { from: 'l1', to: 'fix1', color: 'blue', style: 'dashed' as const },
    { from: 'l2', to: 'fix2', color: 'purple', style: 'dashed' as const },
    { from: 'l3', to: 'fix3', color: 'amber', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <SearchCheck aria-hidden="true" className="w-12 h-12 text-amber-400" />
        3계층 진단: 데이터가 안 보일 때
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={820} height={270} />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card title="먼저 에이전트 전송 확인" color="blue">
          403 → Pod Identity 연결·IAM 정책 확인 / 타임아웃 → 프록시·VPC 엔드포인트 등 아웃바운드 경로.
          <span className="font-mono"> kubectl logs -n amazon-network-flow-monitor daemonset/aws-network-flow-monitor-agent --all-containers=true --tail=100</span>
        </Card>
        <Card title="service map만 빈 경우" color="cyan">
          publish는 정상인데 enrichment 실패 가능성 —
          <span className="font-mono"> Flow enrichment completed.</span> 로그는 집계 실행 흔적입니다. watcher 오류·RBAC·실제 매핑 값도 확인합니다.
        </Card>
      </div>
    </SlideWrapper>
  );
}
