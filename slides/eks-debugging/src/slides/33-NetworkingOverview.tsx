import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NetworkingOverview() {
  const nodes = [
    { id: 'issue', label: '네트워크 문제 감지', x: 340, y: 10, color: 'rose', width: 200, height: 50 },
    { id: 'cni', label: 'VPC CNI 점검', x: 50, y: 100, color: 'blue', width: 160, height: 50 },
    { id: 'dns', label: 'DNS 해석 확인', x: 260, y: 100, color: 'blue', width: 160, height: 50 },
    { id: 'svc', label: 'Service 연결', x: 470, y: 100, color: 'blue', width: 160, height: 50 },
    { id: 'np', label: 'NetworkPolicy', x: 680, y: 100, color: 'amber', width: 160, height: 50 },
    { id: 'cni_fix', label: 'IP 고갈 / ENI 제한\nPrefix Delegation', x: 20, y: 200, color: 'amber', width: 220, height: 55 },
    { id: 'dns_fix', label: 'CoreDNS OOM\nndots:5 / DNSCache', x: 260, y: 200, color: 'amber', width: 200, height: 55 },
    { id: 'svc_fix', label: 'Selector 불일치\nport/targetPort', x: 480, y: 200, color: 'amber', width: 180, height: 55 },
    { id: 'np_fix', label: 'AND vs OR 혼동\nDefault Deny', x: 680, y: 200, color: 'rose', width: 180, height: 55 },
    { id: 'gw', label: 'Gateway API', x: 260, y: 310, color: 'blue', width: 160, height: 50 },
    { id: 'netshoot', label: 'netshoot 디버깅', x: 500, y: 310, color: 'emerald', width: 170, height: 50 },
  ];

  const edges = [
    { from: 'issue', to: 'cni', label: 'Pod IP 미할당', color: 'rose' },
    { from: 'issue', to: 'dns', label: 'DNS 실패', color: 'blue' },
    { from: 'issue', to: 'svc', label: '연결 불가', color: 'blue' },
    { from: 'issue', to: 'np', label: '차단 의심', color: 'amber' },
    { from: 'cni', to: 'cni_fix', color: 'amber' },
    { from: 'dns', to: 'dns_fix', color: 'amber' },
    { from: 'svc', to: 'svc_fix', color: 'amber' },
    { from: 'np', to: 'np_fix', color: 'rose' },
    { from: 'svc_fix', to: 'gw', label: 'Ingress/LB', color: 'blue', dashed: true },
    { from: 'np_fix', to: 'netshoot', label: '패킷 분석', color: 'emerald', dashed: true },
  ];

  return (
    <SlideWrapper accent="blue">
      <div className="flex items-center gap-4 mb-6">
        <Network size={40} className="text-blue-400" />
        <div>
          <Badge color="blue">Part 5</Badge>
          <h1 className="text-5xl font-bold mt-1">네트워킹 디버깅 워크플로우</h1>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-400 mb-6"
      >
        VPC CNI → DNS → Service → NetworkPolicy 계층별 진단 흐름
      </motion.p>
      <FlowDiagram nodes={nodes} edges={edges} width={900} height={380} />
    </SlideWrapper>
  );
}
