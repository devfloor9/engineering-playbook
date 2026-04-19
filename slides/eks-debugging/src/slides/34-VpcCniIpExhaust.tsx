import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { AlertTriangle, Cpu, Network } from 'lucide-react';

export default function VpcCniIpExhaust() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Networking</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">VPC CNI: IP 고갈 & ENI 제한</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="IP 고갈" icon={<AlertTriangle size={22} />} accent="amber" delay={0.1}>
          <p>서브넷의 사용 가능 IP가 부족하면 Pod에 IP 할당 실패</p>
          <p className="text-amber-400 mt-2 font-semibold">증상: Pod이 ContainerCreating 상태에서 멈춤</p>
        </Card>
        <Card title="ENI 제한" icon={<Cpu size={22} />} accent="amber" delay={0.2}>
          <p>인스턴스 타입별 ENI 수 및 ENI당 IP 수 제한</p>
          <p className="text-gray-400 mt-2">c5.xlarge: 4 ENI x 15 IP = 최대 58 Pod</p>
        </Card>
        <Card title="Prefix Delegation" icon={<Network size={22} />} accent="emerald" delay={0.3}>
          <p>ENI에 /28 prefix(16 IP) 할당으로 <span className="text-emerald-400 font-bold">IP 용량 16배 확대</span></p>
          <p className="text-gray-400 mt-2">c5.xlarge: 최대 110 Pod</p>
        </Card>
      </div>

      <CodeBlock title="IP 고갈 진단 및 Prefix Delegation 활성화" delay={0.4}>
{`# 서브넷별 사용 가능 IP 확인
aws ec2 describe-subnets --subnet-ids <subnet-id> \\
  --query 'Subnets[].{ID:SubnetId,AZ:AvailabilityZone,Available:AvailableIpAddressCount}'

# Prefix Delegation 활성화 (IP 용량 16배 확대)
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true

# 노드의 현재 ENI 사용량 확인
kubectl get nodes -o json | jq '.items[] | {name: .metadata.name, allocatable_pods: .status.allocatable.pods}'`}
      </CodeBlock>
    </SlideWrapper>
  );
}
