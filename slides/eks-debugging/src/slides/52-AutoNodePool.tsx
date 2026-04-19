import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { Box, Layers, Server } from 'lucide-react';

export default function AutoNodePool() {
  return (
    <SlideWrapper accent="orange">
      <Badge color="orange">Auto Mode</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">NodePool & NodeClaim</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="NodePool CRD" icon={<Layers size={22} />} accent="orange" delay={0.1}>
          <p>Auto Mode의 노드 그룹 정의</p>
          <p className="mt-2">인스턴스 타입, 용량 타입, AZ 제약 설정</p>
          <p className="text-[#ff9900] mt-2 font-semibold">Karpenter NodePool과 유사</p>
        </Card>
        <Card title="인스턴스 타입 선택" icon={<Server size={22} />} accent="orange" delay={0.2}>
          <p>requirements에서 허용 인스턴스 지정</p>
          <p className="mt-2">Spot + On-Demand 폴백 설정</p>
          <p className="text-gray-400 mt-1">다양한 타입으로 가용성 확보</p>
        </Card>
        <Card title="NodeClaim" icon={<Box size={22} />} accent="blue" delay={0.3}>
          <p>실제 노드 요청 (EC2 인스턴스 1:1)</p>
          <p className="mt-2">Phase: Pending → Launched → Ready</p>
          <p className="text-gray-400 mt-1">Instance ID, Node Name 매핑</p>
        </Card>
      </div>

      <CodeBlock title="NodePool / NodeClaim 진단" delay={0.4}>
{`# NodePool 목록 및 상태
kubectl get nodepools
kubectl describe nodepool default

# NodeClaim 목록 (실제 노드 요청)
kubectl get nodeclaims -o wide

# NodeClaim과 Node 매핑
kubectl get nodeclaims -o json | \\
  jq -r '.items[] | "\\(.metadata.name) → \\(.status.nodeName)"'

# 인스턴스 타입 선택 실패 시: Pod 리소스 vs NodePool requirements 확인
kubectl describe pod <pending-pod>
kubectl get nodepool <name> -o yaml | grep -A 10 requirements`}
      </CodeBlock>
    </SlideWrapper>
  );
}
