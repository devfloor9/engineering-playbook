import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';

export default function GatewayApiDebug() {
  const nodes = [
    { id: 'gc', label: 'GatewayClass', x: 50, y: 30, color: 'blue', width: 160, height: 50 },
    { id: 'gw', label: 'Gateway', x: 280, y: 30, color: 'blue', width: 160, height: 50 },
    { id: 'route', label: 'HTTPRoute', x: 510, y: 30, color: 'blue', width: 160, height: 50 },
    { id: 'svc', label: 'Service', x: 740, y: 30, color: 'emerald', width: 130, height: 50 },
    { id: 'gc_chk', label: 'Accepted 조건\ncontroller 매칭', x: 30, y: 130, color: 'amber', width: 200, height: 55 },
    { id: 'gw_chk', label: 'Programmed 조건\nLB 프로비저닝', x: 260, y: 130, color: 'amber', width: 200, height: 55 },
    { id: 'rt_chk', label: 'ResolvedRefs 조건\nparentRef 매칭', x: 490, y: 130, color: 'amber', width: 200, height: 55 },
    { id: 'svc_chk', label: 'Endpoints\nHealth Check', x: 730, y: 130, color: 'amber', width: 150, height: 55 },
  ];

  const edges = [
    { from: 'gc', to: 'gw', color: 'blue' },
    { from: 'gw', to: 'route', color: 'blue' },
    { from: 'route', to: 'svc', color: 'emerald' },
    { from: 'gc', to: 'gc_chk', color: 'amber', dashed: true },
    { from: 'gw', to: 'gw_chk', color: 'amber', dashed: true },
    { from: 'route', to: 'rt_chk', color: 'amber', dashed: true },
    { from: 'svc', to: 'svc_chk', color: 'amber', dashed: true },
  ];

  return (
    <SlideWrapper accent="blue">
      <Badge color="blue">Networking</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">Gateway API 디버깅</h1>

      <FlowDiagram nodes={nodes} edges={edges} width={920} height={210} />

      <div className="mt-6">
        <CodeBlock title="Gateway API 상태 점검 순서" delay={0.3}>
{`# 1. GatewayClass 상태 확인 (Accepted 조건)
kubectl get gatewayclass
kubectl describe gatewayclass <name>

# 2. Gateway 상태 확인 (Programmed 조건 = LB 프로비저닝)
kubectl get gateway -A
kubectl describe gateway <name> -n <ns>

# 3. HTTPRoute 상태 확인 (ResolvedRefs = parentRef/backendRef 매칭)
kubectl get httproute -A
kubectl describe httproute <name> -n <ns>

# 4. 최종 Target Group Health 확인
aws elbv2 describe-target-health --target-group-arn <tg-arn>`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
