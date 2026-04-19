import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { motion } from 'framer-motion';

export default function Slide26() {
  return (
    <SlideWrapper accent="orange">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        4가지 Health Check 메커니즘 비교
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">각각 독립적으로 실행되는 서로 다른 체크</p>

      <CompareTable
        headers={['구분', 'K8s Probe', 'ALB Health Check', 'NLB Health Check', 'Ingress-NGINX']}
        rows={[
          ['실행 주체', 'kubelet', 'ALB', 'NLB', 'nginx process'],
          ['체크 위치', 'Pod 내부 (노드)', '외부 → Pod IP', '외부 → Pod IP', 'L7 프록시 내부'],
          ['실패 시 동작', 'Endpoints 제거', 'TG deregister', 'TG deregister', 'upstream 제거+재시도'],
          ['체크 방식', 'HTTP/TCP/exec', 'HTTP(S)', 'TCP or HTTP', '실제 트래픽 결과'],
          ['설정 위치', 'Pod spec', 'Service annotation', 'Service annotation', 'Ingress annotation'],
        ]}
        delay={0.1}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-gray-900 rounded-xl p-5 border border-[#ff9900]/20"
      >
        <p className="text-lg font-bold text-[#ff9900] mb-3">핵심 포인트</p>
        <div className="grid grid-cols-3 gap-4 text-base">
          <div>
            <p className="text-gray-200 font-semibold">독립 실행</p>
            <p className="text-gray-400 text-sm">K8s Probe와 ALB HC는 서로의 결과를 모름</p>
          </div>
          <div>
            <p className="text-gray-200 font-semibold">경로 불일치 가능</p>
            <p className="text-gray-400 text-sm">Probe /healthz vs ALB / 으로 설정될 수 있음</p>
          </div>
          <div>
            <p className="text-gray-200 font-semibold">타이밍 차이</p>
            <p className="text-gray-400 text-sm">Probe 빠름(10s) vs ALB 느림(15-30s)</p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
