import { SlideWrapper, Card } from '@shared/components';
import { Server, Cpu, Network, Box, HardDrive, BarChart3, AlertTriangle, Terminal, Wrench } from 'lucide-react';

const sections = [
  { icon: <AlertTriangle size={20} />, title: '인시던트 트리아지', desc: 'First 5 Minutes 체크리스트', color: 'rose' },
  { icon: <Cpu size={20} />, title: '컨트롤 플레인', desc: 'API Server, etcd, 인증/인가', color: 'blue' },
  { icon: <Server size={20} />, title: '노드 레이어', desc: 'kubelet, containerd, 리소스 압박', color: 'orange' },
  { icon: <Network size={20} />, title: '네트워크', desc: 'VPC CNI, DNS, Service', color: 'amber' },
  { icon: <Box size={20} />, title: '워크로드', desc: 'Pod 상태, Probe, HPA', color: 'rose' },
  { icon: <HardDrive size={20} />, title: '스토리지', desc: 'EBS CSI, EFS CSI, PV/PVC', color: 'blue' },
  { icon: <BarChart3 size={20} />, title: '옵저버빌리티', desc: '메트릭, 로그, 알림', color: 'emerald' },
  { icon: <Terminal size={20} />, title: 'kubectl 명령어', desc: '진단용 핵심 커맨드', color: 'cyan' },
  { icon: <Wrench size={20} />, title: '자동화 도구', desc: '진단 자동화 및 도구', color: 'purple' },
];

export function OverviewSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-rose-400">목차</h2>
      <div className="grid grid-cols-3 gap-4 flex-1">
        {sections.map((s, i) => (
          <Card key={i} title={s.title} icon={s.icon} color={s.color}>
            <p>{s.desc}</p>
          </Card>
        ))}
      </div>
    </SlideWrapper>
  );
}
