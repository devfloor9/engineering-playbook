import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'start', label: 'Pod 이상 감지', x: 350, y: 10, color: 'rose', width: 170, height: 42 },
  { id: 'status', label: 'Pod 상태 확인', x: 350, y: 70, color: 'amber', width: 170, height: 42 },
  // Branches
  { id: 'crash', label: 'CrashLoopBackOff', x: 80, y: 145, color: 'rose', width: 160, height: 42 },
  { id: 'img', label: 'ImagePullBackOff', x: 270, y: 145, color: 'amber', width: 160, height: 42 },
  { id: 'oom', label: 'OOMKilled', x: 460, y: 145, color: 'rose', width: 140, height: 42 },
  { id: 'pending', label: 'Pending', x: 630, y: 145, color: 'amber', width: 140, height: 42 },
  // Solutions
  { id: 'crash_fix', label: '로그/CMD/config/OOM 확인', x: 80, y: 220, color: 'emerald', width: 160, height: 42 },
  { id: 'img_fix', label: 'ECR인증/레지스트리/태그', x: 270, y: 220, color: 'emerald', width: 160, height: 42 },
  { id: 'oom_fix', label: 'limits 증가/메모리 분석', x: 460, y: 220, color: 'emerald', width: 140, height: 42 },
  { id: 'pend_fix', label: '리소스/affinity/PVC', x: 630, y: 220, color: 'emerald', width: 140, height: 42 },
  // Additional
  { id: 'notready', label: 'Running 0/1 Ready', x: 170, y: 300, color: 'amber', width: 170, height: 42 },
  { id: 'term', label: 'Terminating', x: 530, y: 300, color: 'amber', width: 140, height: 42 },
  { id: 'notready_fix', label: 'readinessProbe 점검', x: 170, y: 370, color: 'emerald', width: 170, height: 42 },
  { id: 'term_fix', label: 'Finalizer/preStop 확인', x: 530, y: 370, color: 'emerald', width: 140, height: 42 },
];

const edges = [
  { from: 'start', to: 'status', color: 'rose' },
  { from: 'status', to: 'crash', color: 'rose' },
  { from: 'status', to: 'img', color: 'amber' },
  { from: 'status', to: 'oom', color: 'rose' },
  { from: 'status', to: 'pending', color: 'amber' },
  { from: 'crash', to: 'crash_fix', color: 'emerald' },
  { from: 'img', to: 'img_fix', color: 'emerald' },
  { from: 'oom', to: 'oom_fix', color: 'emerald' },
  { from: 'pending', to: 'pend_fix', color: 'emerald' },
  { from: 'status', to: 'notready', color: 'amber', dashed: true },
  { from: 'status', to: 'term', color: 'amber', dashed: true },
  { from: 'notready', to: 'notready_fix', color: 'emerald' },
  { from: 'term', to: 'term_fix', color: 'emerald' },
];

export default function Slide15() {
  return (
    <SlideWrapper accent="rose">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <Badge color="rose">Part 3</Badge>
        <h2 className="text-3xl font-bold">Pod 상태별 디버깅 플로우</h2>
      </motion.div>
      <p className="text-lg text-gray-400 mb-4">kubectl get pods 결과에서 시작하는 진단 맵</p>

      <FlowDiagram nodes={nodes} edges={edges} width={870} height={420} />
    </SlideWrapper>
  );
}
