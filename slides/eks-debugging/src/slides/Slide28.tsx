import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'start', label: '503 발생', x: 360, y: 10, color: 'rose', width: 160, height: 42 },
  { id: 'pod', label: 'Pod Ready 확인', x: 360, y: 70, color: 'amber', width: 160, height: 42 },
  { id: 'ep', label: 'Endpoints 존재?', x: 360, y: 140, color: 'amber', width: 160, height: 42 },
  { id: 'tg', label: 'TG Target Healthy?', x: 360, y: 210, color: 'amber', width: 160, height: 42 },
  { id: 'path', label: 'HC Path 일치?', x: 170, y: 280, color: 'amber', width: 150, height: 42 },
  { id: 'timeout', label: 'Timeout 설정?', x: 370, y: 280, color: 'amber', width: 150, height: 42 },
  { id: 'sg', label: 'Security Group', x: 570, y: 280, color: 'amber', width: 150, height: 42 },
  // Fixes
  { id: 'fix_probe', label: 'Probe 설정 수정', x: 600, y: 70, color: 'emerald', width: 160, height: 42 },
  { id: 'fix_path', label: 'healthcheck-path 통일', x: 170, y: 350, color: 'emerald', width: 150, height: 42 },
  { id: 'fix_timeout', label: 'timeout 증가', x: 370, y: 350, color: 'emerald', width: 150, height: 42 },
  { id: 'fix_sg', label: 'SG 인바운드 추가', x: 570, y: 350, color: 'emerald', width: 150, height: 42 },
];

const edges = [
  { from: 'start', to: 'pod', color: 'rose' },
  { from: 'pod', to: 'fix_probe', color: 'amber', label: 'Not Ready' },
  { from: 'pod', to: 'ep', color: 'gray', label: 'Ready' },
  { from: 'ep', to: 'fix_probe', color: 'amber', label: '없음' },
  { from: 'ep', to: 'tg', color: 'gray', label: '존재' },
  { from: 'tg', to: 'path', color: 'rose', label: 'unhealthy' },
  { from: 'tg', to: 'sg', color: 'gray', label: 'healthy' },
  { from: 'path', to: 'fix_path', color: 'emerald' },
  { from: 'timeout', to: 'fix_timeout', color: 'emerald' },
  { from: 'sg', to: 'fix_sg', color: 'emerald' },
  { from: 'path', to: 'timeout', dashed: true, color: 'gray' },
];

export default function Slide28() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        패턴 1: Probe OK + ALB 503
      </motion.h2>
      <p className="text-lg text-gray-400 mb-4">Pod Ready인데 사용자에게 503이 보이는 경우</p>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={400} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 flex items-center gap-3 justify-center"
      >
        <Badge color="rose">가장 흔한 원인</Badge>
        <span className="text-base text-gray-400">
          readinessProbe path (/healthz) != ALB HC path (/ 기본값)
        </span>
      </motion.div>
    </SlideWrapper>
  );
}
