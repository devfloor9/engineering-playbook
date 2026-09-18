import { SlideWrapper, Card } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { Timer } from 'lucide-react';

export default function IpCooldownSlide() {
  const nodes = [
    { id: 'assigned', label: 'Assigned', x: 40, y: 90, width: 140, height: 50, color: 'blue', description: 'Pod 사용 중' },
    { id: 'cooldown', label: 'Cooling Down', x: 330, y: 90, width: 150, height: 50, color: 'amber', description: '기본 30초' },
    { id: 'free', label: 'Assignable', x: 620, y: 90, width: 140, height: 50, color: 'emerald', description: '재할당 가능' },
  ];

  const edges = [
    { from: 'assigned', to: 'cooldown', label: 'Pod 삭제', color: 'amber' },
    { from: 'cooldown', to: 'free', label: '쿨다운 경과', color: 'emerald' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Timer aria-hidden="true" className="w-12 h-12 text-amber-400" />
        IP 쿨다운: 삭제된 IP의 기본 재사용 대기 30초
      </h1>
      <p className="text-lg text-gray-400 mb-6">
        <span className="font-mono text-amber-300">IP_COOLDOWN_PERIOD</span> (v1.15.0+, 기본 30초)
      </p>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={200} />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card title="왜 필요한가" color="amber">
          Pod 삭제 후에도 kube-proxy의 iptables/IPVS 갱신은 비동기.
          즉시 재할당하면 <b>이전 Service의 트래픽이 새 Pod로 유입</b>될 수 있음
        </Card>
        <Card title="0으로 설정?" color="rose">
          지원되지만 공식 문서가 <b>강하게 비권장</b>.
          반대로 과대 설정 시 가용 IP가 쿨다운에 묶여 EC2 API 호출 증가
        </Card>
        <Card title="대략적인 용량 추정" color="blue">
          <span className="font-mono">초당 Pod 삭제율 × 쿨다운 기간</span>만큼의 IP가
          안정적인 삭제율일 때 대략 쿨다운 상태 → warm pool 계산에 반영 필요
        </Card>
      </div>
    </SlideWrapper>
  );
}
