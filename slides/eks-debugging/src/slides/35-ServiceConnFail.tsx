import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';

export default function ServiceConnFail() {
  const nodes = [
    { id: 'issue', label: 'Service 연결 실패', x: 330, y: 10, color: 'rose', width: 200, height: 50 },
    { id: 'ep', label: 'Endpoints 확인', x: 330, y: 90, color: 'blue', width: 200, height: 50 },
    { id: 'empty', label: 'Endpoints 비어있음', x: 80, y: 180, color: 'rose', width: 190, height: 50 },
    { id: 'exist', label: 'Endpoints 존재', x: 580, y: 180, color: 'emerald', width: 180, height: 50 },
    { id: 'sel', label: 'Selector 라벨 불일치', x: 0, y: 270, color: 'amber', width: 190, height: 50 },
    { id: 'ready', label: 'Pod Not Ready', x: 210, y: 270, color: 'amber', width: 160, height: 50 },
    { id: 'port', label: 'port/targetPort 불일치', x: 480, y: 270, color: 'amber', width: 200, height: 50 },
    { id: 'proxy', label: 'kube-proxy / SG', x: 700, y: 270, color: 'amber', width: 160, height: 50 },
  ];

  const edges = [
    { from: 'issue', to: 'ep', color: 'blue' },
    { from: 'ep', to: 'empty', label: '<none>', color: 'rose' },
    { from: 'ep', to: 'exist', label: 'IP 존재', color: 'emerald' },
    { from: 'empty', to: 'sel', color: 'amber' },
    { from: 'empty', to: 'ready', color: 'amber' },
    { from: 'exist', to: 'port', color: 'amber' },
    { from: 'exist', to: 'proxy', color: 'amber' },
  ];

  return (
    <SlideWrapper accent="rose">
      <Badge color="rose">Networking</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">Service 연결 실패 진단</h1>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={340} />

      <div className="mt-4">
        <CodeBlock title="핵심 진단 명령어" delay={0.3}>
{`# Endpoints 확인 (비어있으면 Selector 불일치)
kubectl get endpoints <service-name>

# Service selector와 Pod label 비교
kubectl get svc <svc> -o jsonpath='{.spec.selector}'
kubectl get pods --show-labels

# Pod이 실제 리스닝하는 포트 확인
kubectl get pod <pod> -o jsonpath='{.spec.containers[*].ports[*].containerPort}'`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
