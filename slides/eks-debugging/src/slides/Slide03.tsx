import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'cp', label: '컨트롤 플레인', x: 380, y: 10, color: 'blue', width: 160, height: 50, icon: '🎛️' },
  { id: 'node', label: '노드', x: 380, y: 80, color: 'orange', width: 160, height: 50, icon: '🖥️' },
  { id: 'net', label: '네트워크', x: 380, y: 150, color: 'amber', width: 160, height: 50, icon: '🌐' },
  { id: 'wl', label: '워크로드', x: 380, y: 220, color: 'rose', width: 160, height: 50, icon: '📦' },
  { id: 'stor', label: '스토리지', x: 380, y: 290, color: 'blue', width: 160, height: 50, icon: '💾' },
  { id: 'obs', label: '옵저버빌리티', x: 380, y: 360, color: 'emerald', width: 160, height: 50, icon: '📊' },
  // Details
  { id: 'cp_d', label: 'API Server, etcd, Add-on', x: 620, y: 10, color: 'blue', width: 220, height: 50 },
  { id: 'node_d', label: 'kubelet, containerd, Karpenter', x: 620, y: 80, color: 'orange', width: 220, height: 50 },
  { id: 'net_d', label: 'VPC CNI, DNS, NetworkPolicy', x: 620, y: 150, color: 'amber', width: 220, height: 50 },
  { id: 'wl_d', label: 'Pod, Probe, HPA, Deployment', x: 620, y: 220, color: 'rose', width: 220, height: 50 },
  { id: 'stor_d', label: 'EBS CSI, EFS CSI, PV/PVC', x: 620, y: 290, color: 'blue', width: 220, height: 50 },
  { id: 'obs_d', label: '메트릭, 로그, 알림, 대시보드', x: 620, y: 360, color: 'emerald', width: 220, height: 50 },
];

const edges = [
  { from: 'cp', to: 'node', color: 'blue' },
  { from: 'node', to: 'net', color: 'orange' },
  { from: 'net', to: 'wl', color: 'amber' },
  { from: 'wl', to: 'stor', color: 'rose' },
  { from: 'stor', to: 'obs', color: 'blue' },
  { from: 'cp', to: 'cp_d', dashed: true, color: 'blue' },
  { from: 'node', to: 'node_d', dashed: true, color: 'orange' },
  { from: 'net', to: 'net_d', dashed: true, color: 'amber' },
  { from: 'wl', to: 'wl_d', dashed: true, color: 'rose' },
  { from: 'stor', to: 'stor_d', dashed: true, color: 'blue' },
  { from: 'obs', to: 'obs_d', dashed: true, color: 'emerald' },
];

export default function Slide03() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        EKS 디버깅 6-Layer 프레임워크
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">상위 레이어부터 하위 레이어로 순차 점검</p>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={420} />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-base text-gray-500 text-center mt-4"
      >
        각 레이어는 독립적으로 디버깅 가능하지만, 상위 레이어 장애가 하위에 전파될 수 있음
      </motion.p>
    </SlideWrapper>
  );
}
