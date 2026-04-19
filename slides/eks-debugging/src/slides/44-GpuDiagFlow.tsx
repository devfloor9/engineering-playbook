import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GpuDiagFlow() {
  const nodes = [
    { id: 'start', label: 'GPU 문제 발생', x: 360, y: 10, color: 'rose', width: 180, height: 45 },
    { id: 'smi', label: 'nvidia-smi 실행?', x: 360, y: 80, color: 'purple', width: 180, height: 45 },
    { id: 'driver', label: 'Driver 설치 확인', x: 80, y: 80, color: 'amber', width: 180, height: 45 },
    { id: 'gpu', label: 'GPU 인식됨?', x: 360, y: 155, color: 'purple', width: 180, height: 45 },
    { id: 'cuda', label: 'CUDA 버전 호환?', x: 360, y: 230, color: 'purple', width: 180, height: 45 },
    { id: 'match', label: 'Driver/CUDA 매칭', x: 100, y: 230, color: 'amber', width: 180, height: 45 },
    { id: 'dp', label: 'Device Plugin 동작?', x: 360, y: 305, color: 'purple', width: 180, height: 45 },
    { id: 'cp', label: 'ClusterPolicy 확인', x: 80, y: 155, color: 'amber', width: 180, height: 45 },
    { id: 'dcgm', label: 'DCGM 메트릭 정상?', x: 650, y: 230, color: 'purple', width: 190, height: 45 },
    { id: 'workload', label: '워크로드 레벨 디버깅', x: 650, y: 305, color: 'emerald', width: 200, height: 45 },
  ];

  const edges = [
    { from: 'start', to: 'smi', color: 'purple' },
    { from: 'smi', to: 'driver', label: '실패', color: 'rose' },
    { from: 'smi', to: 'gpu', label: '성공', color: 'emerald' },
    { from: 'driver', to: 'cp', color: 'amber' },
    { from: 'gpu', to: 'cp', label: '미인식', color: 'rose' },
    { from: 'gpu', to: 'cuda', label: '인식됨', color: 'emerald' },
    { from: 'cuda', to: 'match', label: '불일치', color: 'amber' },
    { from: 'cuda', to: 'dp', label: '호환', color: 'emerald' },
    { from: 'dp', to: 'cp', label: '미동작', color: 'rose' },
    { from: 'dp', to: 'dcgm', label: '정상', color: 'emerald' },
    { from: 'dcgm', to: 'workload', label: '정상', color: 'emerald' },
  ];

  return (
    <SlideWrapper accent="purple">
      <div className="flex items-center gap-4 mb-4">
        <Cpu size={40} className="text-purple-400" />
        <div>
          <Badge color="purple">Part 7</Badge>
          <h1 className="text-5xl font-bold mt-1">GPU 진단 워크플로우</h1>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-400 mb-4"
      >
        nvidia-smi → Driver → CUDA → Device Plugin → DCGM 순서로 진단
      </motion.p>
      <FlowDiagram nodes={nodes} edges={edges} width={900} height={370} />
    </SlideWrapper>
  );
}
