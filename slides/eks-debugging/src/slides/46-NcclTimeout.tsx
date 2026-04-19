import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { Radio, Shield, Cpu, Settings } from 'lucide-react';

export default function NcclTimeout() {
  return (
    <SlideWrapper accent="purple">
      <Badge color="purple">GPU/AI</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">NCCL Timeout 디버깅</h1>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <Card title="멀티노드 통신" icon={<Radio size={22} />} accent="purple" delay={0.1}>
          <p>분산 학습 시 노드 간 NCCL 타임아웃 발생</p>
          <p className="text-purple-400 mt-2 font-semibold">Pod 간 통신 확인이 최우선</p>
        </Card>
        <Card title="EFA 설정" icon={<Cpu size={22} />} accent="purple" delay={0.2}>
          <p>p4d/p5 인스턴스: EFA Device Plugin 설치 필수</p>
          <p className="text-gray-400 mt-2">vpc.amazonaws.com/efa 리소스 요청 필요</p>
        </Card>
        <Card title="Security Group" icon={<Shield size={22} />} accent="amber" delay={0.3}>
          <p>동일 SG 내부 <span className="text-amber-400 font-bold">모든 트래픽 허용</span> 필요</p>
          <p className="text-gray-400 mt-2">SG self-referencing rule 확인</p>
        </Card>
        <Card title="환경변수 설정" icon={<Settings size={22} />} accent="emerald" delay={0.4}>
          <p>NCCL_SOCKET_IFNAME, NCCL_IB_DISABLE 등</p>
          <p className="text-gray-400 mt-2">WORLD_SIZE, RANK 매칭 필수</p>
        </Card>
      </div>

      <CodeBlock title="NCCL 디버그 환경변수" language="yaml" delay={0.5}>
{`env:
  - name: NCCL_DEBUG
    value: "INFO"            # 디버그 로그 활성화
  - name: NCCL_DEBUG_SUBSYS
    value: "ALL"
  - name: NCCL_SOCKET_IFNAME
    value: "eth0"            # VPC CNI 기본 인터페이스
  - name: NCCL_IB_DISABLE
    value: "1"               # EKS에서 InfiniBand 비활성화

# Pod 간 통신 테스트
# kubectl exec -it <pod> -- nc -zv <target-pod-ip> 12345`}
      </CodeBlock>
    </SlideWrapper>
  );
}
