import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'nr', label: 'Node NotReady', x: 350, y: 10, color: 'rose', width: 180, height: 45 },
  { id: 'ec2', label: 'EC2 상태 확인', x: 350, y: 80, color: 'amber', width: 180, height: 45 },
  { id: 'stopped', label: '인스턴스 재시작/교체', x: 620, y: 80, color: 'emerald', width: 200, height: 45 },
  { id: 'kubelet', label: 'kubelet 상태 확인', x: 350, y: 155, color: 'amber', width: 180, height: 45 },
  { id: 'kubelet_fix', label: 'systemctl restart kubelet', x: 620, y: 155, color: 'emerald', width: 200, height: 45 },
  { id: 'containerd', label: 'containerd 상태 확인', x: 350, y: 230, color: 'amber', width: 180, height: 45 },
  { id: 'containerd_fix', label: 'systemctl restart containerd', x: 620, y: 230, color: 'emerald', width: 200, height: 45 },
  { id: 'resource', label: '리소스 압박 확인', x: 350, y: 305, color: 'amber', width: 180, height: 45 },
  { id: 'resource_fix', label: 'Disk/Memory/PID 조치', x: 620, y: 305, color: 'emerald', width: 200, height: 45 },
  { id: 'net', label: 'SG / NACL / VPC 점검', x: 350, y: 380, color: 'emerald', width: 180, height: 45 },
];

const edges = [
  { from: 'nr', to: 'ec2', color: 'rose' },
  { from: 'ec2', to: 'stopped', color: 'amber', label: 'Stopped' },
  { from: 'ec2', to: 'kubelet', color: 'gray', label: 'Running' },
  { from: 'kubelet', to: 'kubelet_fix', color: 'amber', label: 'Not Running' },
  { from: 'kubelet', to: 'containerd', color: 'gray', label: 'Running' },
  { from: 'containerd', to: 'containerd_fix', color: 'amber', label: 'Not Running' },
  { from: 'containerd', to: 'resource', color: 'gray', label: 'Running' },
  { from: 'resource', to: 'resource_fix', color: 'amber', label: 'Pressure' },
  { from: 'resource', to: 'net', color: 'gray', label: '정상' },
];

export default function Slide11() {
  return (
    <SlideWrapper accent="rose">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <Badge color="rose">Node</Badge>
        <h2 className="text-3xl font-bold">Node NotReady Decision Tree</h2>
      </motion.div>
      <p className="text-lg text-gray-400 mb-4">순차적으로 원인을 좁혀가는 진단 흐름</p>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={440} />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-base text-gray-500 text-center mt-3"
      >
        SSM 접속 필요 &mdash; 노드 IAM Role에 AmazonSSMManagedInstanceCore 정책 필수
      </motion.p>
    </SlideWrapper>
  );
}
