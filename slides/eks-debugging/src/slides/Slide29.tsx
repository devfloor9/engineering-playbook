import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { motion } from 'framer-motion';

const nodes = [
  // Timeline nodes
  { id: 't0', label: 'T+0s: Pod Terminating', x: 50, y: 20, color: 'rose', width: 200, height: 40 },
  { id: 'prestop', label: 'preStop hook 실행', x: 50, y: 80, color: 'amber', width: 200, height: 40 },
  { id: 'sigterm', label: 'SIGTERM 전송', x: 50, y: 140, color: 'amber', width: 200, height: 40 },
  { id: 'shutdown', label: '앱 프로세스 종료', x: 50, y: 200, color: 'amber', width: 200, height: 40 },
  { id: 'sigkill', label: 'SIGKILL (grace 만료)', x: 50, y: 260, color: 'rose', width: 200, height: 40 },

  // ALB timeline
  { id: 'alb_start', label: 'T+0s: deregistration 시작', x: 350, y: 20, color: 'orange', width: 220, height: 40 },
  { id: 'alb_drain', label: 'connection draining...', x: 350, y: 110, color: 'orange', width: 220, height: 40 },
  { id: 'alb_done', label: 'T+300s: deregistration 완료', x: 350, y: 200, color: 'orange', width: 220, height: 40 },

  // Problem
  { id: 'problem', label: '502 Bad Gateway!', x: 670, y: 110, color: 'rose', width: 170, height: 50 },
  { id: 'cause', label: '앱 종료 but ALB draining', x: 670, y: 190, color: 'rose', width: 170, height: 40 },
];

const edges = [
  { from: 't0', to: 'prestop', color: 'amber' },
  { from: 'prestop', to: 'sigterm', color: 'amber' },
  { from: 'sigterm', to: 'shutdown', color: 'amber' },
  { from: 'shutdown', to: 'sigkill', color: 'rose' },
  { from: 'alb_start', to: 'alb_drain', color: 'orange' },
  { from: 'alb_drain', to: 'alb_done', color: 'orange' },
  { from: 'alb_drain', to: 'problem', color: 'rose', dashed: true },
  { from: 'problem', to: 'cause', color: 'rose' },
];

export default function Slide29() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        패턴 2: Graceful Shutdown 시 502
      </motion.h2>
      <p className="text-lg text-gray-400 mb-4">Pod 종료와 ALB deregistration 타이밍 불일치</p>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={310} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 grid grid-cols-2 gap-4"
      >
        <div className="bg-gray-900 rounded-xl p-4 border border-rose-500/20">
          <p className="text-lg font-bold text-rose-400 mb-2">문제</p>
          <p className="text-base text-gray-300">
            앱이 T+1s에 종료되지만, ALB는 T+300s까지 connection draining 중.
            이 간격에서 <span className="text-rose-400 font-bold">502 발생</span>.
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-lg font-bold text-emerald-400 mb-2">해결</p>
          <ul className="text-base text-gray-300 space-y-1">
            <li>1. deregistration_delay = <span className="text-emerald-400">15s</span> (기본 300s에서 축소)</li>
            <li>2. preStop: sleep <span className="text-emerald-400">15</span> (deregistration 대기)</li>
            <li>3. SIGTERM 핸들러 구현 (graceful shutdown)</li>
          </ul>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
