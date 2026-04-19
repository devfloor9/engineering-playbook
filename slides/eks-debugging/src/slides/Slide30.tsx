import { SlideWrapper } from '../components/SlideWrapper';
import { CodeBlock } from '../components/CodeBlock';
import { motion } from 'framer-motion';

export default function Slide30() {
  return (
    <SlideWrapper accent="orange">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        종료 시퀀스 공식
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">terminationGracePeriodSeconds 계산법</p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-gray-900 rounded-2xl p-8 border border-[#ff9900]/30 text-center mb-6"
      >
        <p className="text-xl text-gray-400 mb-4">terminationGracePeriodSeconds =</p>
        <p className="text-3xl font-bold text-[#ff9900]">
          deregistration_delay + preStop_sleep + app_shutdown_buffer
        </p>
        <div className="mt-6 flex items-center justify-center gap-8 text-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">15s</p>
            <p className="text-sm text-gray-500">deregistration</p>
          </div>
          <p className="text-2xl text-gray-600">+</p>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">15s</p>
            <p className="text-sm text-gray-500">preStop sleep</p>
          </div>
          <p className="text-2xl text-gray-600">+</p>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">10s</p>
            <p className="text-sm text-gray-500">app shutdown</p>
          </div>
          <p className="text-2xl text-gray-600">=</p>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">40s</p>
            <p className="text-sm text-gray-500">총 grace period</p>
          </div>
        </div>
      </motion.div>

      <CodeBlock title="권장 YAML 설정" language="yaml" delay={0.4}>
{`spec:
  terminationGracePeriodSeconds: 40
  containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command:
          - /bin/sh
          - -c
          - |
            # ALB deregistration 감지 대기
            sleep 15
---
# Service annotation
metadata:
  annotations:
    alb.ingress.kubernetes.io/target-group-attributes:
      deregistration_delay.timeout_seconds=15`}
      </CodeBlock>
    </SlideWrapper>
  );
}
