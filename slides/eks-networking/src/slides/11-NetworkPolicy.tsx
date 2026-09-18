import { SlideWrapper, Card } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { Shield } from 'lucide-react';

export default function NetworkPolicySlide() {
  const nodes = [
    { id: 'np', label: 'NetworkPolicy', x: 20, y: 90, width: 150, height: 50, color: 'blue', description: '사용자 정의' },
    { id: 'ctrl', label: 'NP Controller', x: 250, y: 90, width: 160, height: 50, color: 'purple', description: 'EKS 컨트롤 플레인' },
    { id: 'crd', label: 'PolicyEndpoints', x: 490, y: 90, width: 160, height: 50, color: 'amber', description: 'CRD (해석 결과)' },
    { id: 'agent', label: 'NP Agent (eBPF)', x: 620, y: 200, width: 160, height: 50, color: 'emerald', description: '노드 DaemonSet' },
  ];

  const edges = [
    { from: 'np', to: 'ctrl', label: 'watch', color: 'blue' },
    { from: 'ctrl', to: 'crd', label: '해석 결과', color: 'purple' },
    { from: 'crd', to: 'agent', label: 'watch → host veth attach', color: 'emerald' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Shield aria-hidden="true" className="w-12 h-12 text-purple-400" />
        NetworkPolicy: 컨트롤러 + eBPF 에이전트 (v1.14.0+)
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={820} height={280} />

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card title="eBPF 정책 적용" color="emerald">
          정책은 Pod host veth에 attach된 <b>eBPF 프로브</b>로 적용
          — enableNetworkPolicy 활성화와 지원 노드 조건을 확인합니다.
        </Card>
        <Card title="진단 분기점" color="amber">
          NetworkPolicy와 함께 <b>PolicyEndpoint 리소스</b> 확인
          — 컨트롤러의 해석 결과가 도달했는지가 관건
        </Card>
        <Card title="적용 범위 제약" color="rose">
          Pod eth0만 대상. host networking Pod &middot; Windows &middot; Fargate 미적용.
          BPF 상태는 <span className="font-mono">aws-eks-na-cli</span>, 허용·거부 흐름은 정책 이벤트 로그로 확인
        </Card>
      </div>
    </SlideWrapper>
  );
}
