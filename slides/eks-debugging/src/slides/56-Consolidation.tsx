import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Shrink, Shield, Tag } from 'lucide-react';

export default function Consolidation() {
  const nodes = [
    { id: 'start', label: 'Consolidation 루프', x: 340, y: 10, color: 'amber', width: 200, height: 45 },
    { id: 'idle', label: '유휴/저활용\n노드 감지', x: 340, y: 80, color: 'amber', width: 180, height: 50 },
    { id: 'replace', label: 'Pod 대체 가능?', x: 340, y: 160, color: 'blue', width: 160, height: 45 },
    { id: 'pdb', label: 'PDB 차단?', x: 120, y: 250, color: 'rose', width: 140, height: 45 },
    { id: 'anno', label: 'do-not-disrupt?', x: 340, y: 250, color: 'rose', width: 170, height: 45 },
    { id: 'policy', label: 'Policy 확인', x: 560, y: 250, color: 'blue', width: 140, height: 45 },
    { id: 'defer', label: '통합 연기', x: 80, y: 340, color: 'rose', width: 130, height: 45 },
    { id: 'exec', label: '새 노드 시작\n→ Pod 마이그레이션', x: 420, y: 340, color: 'emerald', width: 200, height: 50 },
  ];

  const edges = [
    { from: 'start', to: 'idle', color: 'amber' },
    { from: 'idle', to: 'replace', color: 'blue' },
    { from: 'replace', to: 'pdb', label: '확인', color: 'blue' },
    { from: 'replace', to: 'anno', color: 'blue' },
    { from: 'replace', to: 'policy', color: 'blue' },
    { from: 'pdb', to: 'defer', label: 'Yes', color: 'rose' },
    { from: 'anno', to: 'defer', label: 'Yes', color: 'rose' },
    { from: 'policy', to: 'exec', label: '통과', color: 'emerald' },
  ];

  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Karpenter</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">Consolidation 동작 원리</h1>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={410} />

      <div className="grid grid-cols-3 gap-4 mt-4">
        <Card title="PDB 차단" icon={<Shield size={20} />} accent="rose" delay={0.3}>
          <p>minAvailable 과도 → allowedDisruptions: 0</p>
          <p className="text-emerald-400 mt-1">해결: maxUnavailable: 1</p>
        </Card>
        <Card title="do-not-disrupt" icon={<Tag size={20} />} accent="amber" delay={0.4}>
          <p>Pod/NodeClaim annotation으로 통합 제외</p>
          <p className="text-gray-400 mt-1">장시간 배치 작업에 사용</p>
        </Card>
        <Card title="Policy 설정" icon={<Shrink size={20} />} accent="blue" delay={0.5}>
          <p><span className="text-blue-400">WhenEmpty:</span> 비어야 통합</p>
          <p><span className="text-blue-400">WhenUnderutilized:</span> 적극 통합</p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
