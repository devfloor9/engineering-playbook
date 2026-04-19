import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { motion } from 'framer-motion';

export default function Slide27() {
  return (
    <SlideWrapper accent="orange">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        타이밍 매트릭스
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">기본 설정값 비교 &mdash; 불일치가 장애를 만드는 지점</p>

      <CompareTable
        headers={['설정', 'K8s Probe', 'ALB HC', 'NLB HC', 'Ingress-NGINX']}
        rows={[
          ['기본 interval', '10s', '15s', '30s', '- (실제 트래픽)'],
          ['기본 timeout', '1s', '5s', '6s', '60s (proxy_read_timeout)'],
          ['실패 threshold', '3', '2 (unhealthy)', '3', '-'],
          ['성공 threshold', '1', '2 (healthy)', '3', '-'],
          ['체크 주체', 'kubelet', 'ALB', 'NLB', 'nginx'],
          ['실패 시 동작', 'Endpoints 제거', 'TG deregister', 'TG deregister', 'upstream 제거'],
          ['체크 경로', '/healthz 등', '/ 또는 커스텀', 'TCP or HTTP', '실제 요청 경로'],
        ]}
        highlightCol={2}
        delay={0.1}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 grid grid-cols-2 gap-4"
      >
        <div className="bg-gray-900 rounded-xl p-4 border border-rose-500/20">
          <p className="text-lg font-semibold text-rose-400">불일치 위험 #1</p>
          <p className="text-base text-gray-300 mt-1">
            ALB가 K8s보다 <span className="text-rose-400 font-bold">느리게</span> 체크 (15s vs 10s) &mdash;
            K8s Ready지만 ALB는 아직 Unhealthy
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-rose-500/20">
          <p className="text-lg font-semibold text-rose-400">불일치 위험 #2</p>
          <p className="text-base text-gray-300 mt-1">
            Probe timeout 1s로 통과하지만, ALB 5s timeout 내에 앱이 응답 못함 (DB 쿼리 지연)
          </p>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
