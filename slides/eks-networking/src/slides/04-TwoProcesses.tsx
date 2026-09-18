import { SlideWrapper, Card } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { Layers } from 'lucide-react';

export default function TwoProcessesSlide() {
  const nodes = [
    { id: 'kubelet', label: 'CRI runtime', x: 20, y: 90, width: 110, height: 50, color: 'gray' },
    { id: 'cni', label: 'CNI 바이너리', x: 200, y: 90, width: 140, height: 50, color: 'blue', description: 'Pod마다 호출' },
    { id: 'ipamd', label: 'ipamd (aws-node)', x: 420, y: 90, width: 160, height: 50, color: 'emerald', description: '상주 데몬' },
    { id: 'ec2', label: 'EC2 API', x: 660, y: 20, width: 110, height: 50, color: 'amber', description: 'ENI/IP 관리' },
    { id: 'pool', label: 'Warm Pool', x: 660, y: 160, width: 110, height: 50, color: 'purple', description: '여유 IP 캐시' },
  ];

  const edges = [
    { from: 'kubelet', to: 'cni', label: 'ADD/DEL', color: 'gray' },
    { from: 'cni', to: 'ipamd', label: 'gRPC: IP 요청', color: 'blue' },
    { from: 'ipamd', to: 'ec2', label: '비동기 백그라운드', color: 'amber', style: 'dashed' as const },
    { from: 'ipamd', to: 'pool', label: '즉시 반환', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <Layers aria-hidden="true" className="w-12 h-12 text-blue-400" />
        두 개의 프로세스, 하나의 플러그인
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={230} />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card title="CNI 바이너리" color="blue">
          kubelet의 요청을 받은 컨테이너 런타임이 Pod sandbox 생성/삭제 시 호출. veth pair 생성, 라우팅 규칙 설정 — <b>네트워크 배선 담당</b>
        </Card>
        <Card title="ipamd" color="emerald">
          노드당 상주 데몬(aws-node DaemonSet). ENI attach/detach와 IP 풀 관리 — <b>EC2 API 담당</b>
        </Card>
        <Card title="핵심: 경로 분리" color="purple">
          Warm Pool에 IP가 있으면 EC2 API 응답을 기다리지 않고 할당합니다. <b>풀이 소진되면 보충 지연·실패가 Pod 시작에 영향</b>을 줍니다.
        </Card>
      </div>
    </SlideWrapper>
  );
}
