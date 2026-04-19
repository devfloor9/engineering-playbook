import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { CodeBlock } from '../components/CodeBlock';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'notready', label: 'Pod 0/1 Ready', x: 330, y: 10, color: 'rose', width: 170, height: 42 },
  { id: 'check', label: 'readinessProbe 확인', x: 330, y: 70, color: 'amber', width: 170, height: 42 },
  { id: 'path', label: 'path 불일치?', x: 100, y: 145, color: 'amber', width: 150, height: 42 },
  { id: 'delay', label: 'initialDelay 부족?', x: 300, y: 145, color: 'amber', width: 160, height: 42 },
  { id: 'timeout', label: 'timeout 부족?', x: 510, y: 145, color: 'amber', width: 150, height: 42 },
  { id: 'app', label: '앱 실제 실패?', x: 700, y: 145, color: 'amber', width: 140, height: 42 },
  { id: 'fix_path', label: '/healthz로 통일', x: 100, y: 215, color: 'emerald', width: 150, height: 42 },
  { id: 'fix_delay', label: 'startupProbe 추가', x: 300, y: 215, color: 'emerald', width: 160, height: 42 },
  { id: 'fix_timeout', label: 'timeoutSeconds 증가', x: 510, y: 215, color: 'emerald', width: 150, height: 42 },
  { id: 'fix_app', label: '로그/의존서비스 점검', x: 700, y: 215, color: 'emerald', width: 140, height: 42 },
];

const edges = [
  { from: 'notready', to: 'check', color: 'rose' },
  { from: 'check', to: 'path', color: 'amber' },
  { from: 'check', to: 'delay', color: 'amber' },
  { from: 'check', to: 'timeout', color: 'amber' },
  { from: 'check', to: 'app', color: 'amber' },
  { from: 'path', to: 'fix_path', color: 'emerald' },
  { from: 'delay', to: 'fix_delay', color: 'emerald' },
  { from: 'timeout', to: 'fix_timeout', color: 'emerald' },
  { from: 'app', to: 'fix_app', color: 'emerald' },
];

export default function Slide20() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        Probe 실패 루프 디버깅
      </motion.h2>
      <p className="text-lg text-gray-400 mb-4">Running 0/1 Ready &mdash; 트래픽을 받지 못하는 상태</p>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={270} />

      <div className="mt-4">
        <CodeBlock title="권장 Probe 설정 (Spring Boot 예시)" language="yaml" delay={0.4}>
{`startupProbe:          # 앱 시작 완료 확인
  httpGet:
    path: /actuator/health
    port: 8080
  failureThreshold: 30   # 최대 300초 대기
  periodSeconds: 10
readinessProbe:        # 트래픽 수신 준비
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  timeoutSeconds: 3
livenessProbe:         # 데드락 감지 (외부 의존성 제외!)
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  timeoutSeconds: 5`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
