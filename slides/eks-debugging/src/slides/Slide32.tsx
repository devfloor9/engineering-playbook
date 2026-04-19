import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function Slide32() {
  return (
    <SlideWrapper accent="emerald">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        Health Check Best Practice
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">워크로드 유형별 최적 설정 가이드</p>

      <CompareTable
        headers={['워크로드 유형', 'readiness period', 'ALB HC interval', 'minReadySeconds', 'terminationGrace']}
        rows={[
          ['Stateless API', '5s', '15s', '30s', '40s'],
          ['웹 프론트엔드', '5s', '15s', '30s', '40s'],
          ['배치 워커', '10s', '30s', '60s', '120s'],
          ['Long-lived 연결', '10s', '30s', '60s', '300s'],
          ['gRPC 서비스', '5s (grpc)', '15s (HTTP)', '30s', '40s'],
        ]}
        delay={0.1}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-gray-900 rounded-xl p-5 border border-emerald-500/20"
      >
        <p className="text-lg font-bold text-emerald-400 mb-3">배포 전 Health Check 체크리스트</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base text-gray-300">
          <p>1. ALB HC 경로 = readinessProbe 경로</p>
          <p>2. Probe timeout &lt; ALB HC timeout</p>
          <p>3. preStop hook + SIGTERM 핸들러</p>
          <p>4. terminationGrace &gt; deregistration + preStop</p>
          <p>5. minReadySeconds ≥ ALB HC interval × threshold</p>
          <p>6. PodDisruptionBudget (minAvailable: 50%)</p>
          <p>7. Security Group: ALB → Pod CIDR 허용</p>
          <p>8. 배치 API는 별도 Ingress로 분리</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <Badge color="emerald">Session 1 끝 &mdash; 10분 휴식</Badge>
        <p className="text-base text-gray-500 mt-2">
          Session 2: 네트워킹 / 스토리지 / 옵저버빌리티 / 실전 시나리오
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
