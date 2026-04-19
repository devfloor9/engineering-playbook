import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';

export default function SchedulingFail() {
  const nodes = [
    { id: 'pending', label: 'Pod Pending', x: 350, y: 10, color: 'rose', width: 160, height: 45 },
    { id: 'log', label: 'Karpenter 로그 확인', x: 350, y: 80, color: 'blue', width: 190, height: 45 },
    { id: 'incompat', label: 'incompatible\nrequirements', x: 80, y: 170, color: 'amber', width: 170, height: 50 },
    { id: 'launch', label: 'instance launch\nfailed', x: 350, y: 170, color: 'amber', width: 170, height: 50 },
    { id: 'other', label: '서브넷/SG 문제', x: 620, y: 170, color: 'amber', width: 160, height: 50 },
    { id: 'label', label: '레이블/테인트\n불일치 수정', x: 0, y: 270, color: 'emerald', width: 160, height: 50 },
    { id: 'type', label: '인스턴스 타입\n다양화', x: 180, y: 270, color: 'emerald', width: 160, height: 50 },
    { id: 'spot', label: 'Spot 용량 부족\n→ On-Demand 폴백', x: 280, y: 270, color: 'emerald', width: 200, height: 50 },
    { id: 'iam', label: 'IAM 권한\n확인', x: 500, y: 270, color: 'emerald', width: 140, height: 50 },
    { id: 'subnet', label: '서브넷 태그\nkarpenter.sh/discovery', x: 660, y: 270, color: 'emerald', width: 200, height: 50 },
  ];

  const edges = [
    { from: 'pending', to: 'log', color: 'blue' },
    { from: 'log', to: 'incompat', label: 'incompatible', color: 'amber' },
    { from: 'log', to: 'launch', label: 'launch fail', color: 'amber' },
    { from: 'log', to: 'other', label: 'subnet/SG', color: 'amber' },
    { from: 'incompat', to: 'label', color: 'emerald' },
    { from: 'incompat', to: 'type', color: 'emerald' },
    { from: 'launch', to: 'spot', color: 'emerald' },
    { from: 'launch', to: 'iam', color: 'emerald' },
    { from: 'other', to: 'subnet', color: 'emerald' },
  ];

  return (
    <SlideWrapper accent="rose">
      <Badge color="rose">Karpenter</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">스케줄링 실패 디버깅</h1>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={340} />

      <div className="mt-4">
        <CodeBlock title="스케줄링 실패 진단" delay={0.3}>
{`# Karpenter 로그에서 원인 확인
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter --tail=100 \\
  | grep "launch instances\\|incompatible"

# Pod requirements vs NodePool requirements 비교
kubectl get pod <pod> -o yaml | grep -A 10 "nodeSelector\\|affinity"
kubectl get nodepool <name> -o yaml | grep -A 20 "requirements"`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
