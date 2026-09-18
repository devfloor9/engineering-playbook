import { SlideWrapper, Card } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { Route } from 'lucide-react';

export default function DatapathSlide() {
  const nodes = [
    { id: 'app', label: 'App (Pod)', x: 20, y: 30, width: 120, height: 50, color: 'blue', description: '10.0.1.20' },
    { id: 'gw', label: '169.254.1.1', x: 20, y: 150, width: 120, height: 50, color: 'rose', description: '더미 GW + 정적 ARP' },
    { id: 'veth', label: 'eni3a52ce78d95', x: 230, y: 90, width: 160, height: 50, color: 'cyan', description: 'host veth' },
    { id: 'rule', label: 'ip rule', x: 470, y: 90, width: 100, height: 50, color: 'purple', description: '정책 라우팅' },
    { id: 'rtmain', label: 'main 테이블', x: 640, y: 20, width: 130, height: 50, color: 'emerald', description: 'ingress: Pod IP/32' },
    { id: 'rteni', label: 'ENI별 테이블', x: 640, y: 160, width: 130, height: 50, color: 'amber', description: 'egress: 서브넷 GW' },
  ];

  const edges = [
    { from: 'app', to: 'gw', label: 'default route', color: 'rose', style: 'dashed' as const },
    { from: 'app', to: 'veth', label: 'veth pair', color: 'blue' },
    { from: 'veth', to: 'rule', color: 'cyan' },
    { from: 'rule', to: 'rtmain', label: 'VPC → Pod', color: 'emerald' },
    { from: 'rule', to: 'rteni', label: 'Pod → VPC', color: 'amber' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Route aria-hidden="true" className="w-12 h-12 text-cyan-400" />
        L3 Routed Mode 데이터패스
      </h1>
      <p className="text-lg text-gray-400 mb-6">
        Linux IPv4 기본 경로: L2 브리지 없이 host veth와 정책 라우팅으로 전달
      </p>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={240} />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card title="169.254.1.1은 Pod의 더미 next hop" color="rose">
          CNI가 host veth의 MAC을 가리키는 <b>정적 ARP 엔트리(PERM)</b>를 미리 심음
          → Pod는 해당 next hop을 ARP 질의 없이 호스트로 해석
        </Card>
        <Card title="egress에 ENI별 테이블이 필요한 이유" color="amber">
          VPC 내부 통신은 <b>소스 Pod IP가 할당된 ENI</b>를 사용합니다. VPC 외부 목적지는 기본 SNAT 설정에 따라 primary ENI·노드 IP 경로를 사용할 수 있습니다.
        </Card>
      </div>
    </SlideWrapper>
  );
}
