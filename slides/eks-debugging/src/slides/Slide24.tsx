import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { motion } from 'framer-motion';

export default function Slide24() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        Rollout Strategy 비교
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">maxUnavailable / maxSurge 조합에 따른 배포 동작</p>

      <CompareTable
        headers={['전략', 'maxUnavailable', 'maxSurge', '동작', '적합한 상황']}
        rows={[
          ['안전 우선', '0', '1', '새 Pod 먼저 생성 후 구 Pod 제거', '무중단 필수, 여유 리소스 있음'],
          ['균형', '1', '1', '1개씩 교체 (기본값)', '대부분의 워크로드'],
          ['빠른 배포', '25%', '25%', '동시 교체 (Deployment 기본)', '빠른 롤아웃 필요'],
          ['최소 리소스', '1', '0', '구 Pod 먼저 제거 후 새 Pod 생성', '리소스 제한적, 순간 중단 허용'],
          ['대규모', '10%', '30%', '빠른 스케일업 + 점진적 제거', '대규모 Deployment (100+ Pods)'],
        ]}
        delay={0.1}
      />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 rounded-xl p-5 border border-blue-500/20"
        >
          <p className="text-lg font-bold text-blue-400 mb-3">minReadySeconds</p>
          <p className="text-base text-gray-300">
            새 Pod가 Ready 후 추가 대기 시간.
            ALB Health Check 통과를 기다리는 데 사용.
          </p>
          <p className="text-base text-blue-400 font-semibold mt-2">
            권장: ALB HC interval x threshold = 30s
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-xl p-5 border border-blue-500/20"
        >
          <p className="text-lg font-bold text-blue-400 mb-3">progressDeadlineSeconds</p>
          <p className="text-base text-gray-300">
            롤아웃 진행 제한 시간 (기본 600초).
            초과 시 Deployment 상태 = ProgressDeadlineExceeded.
          </p>
          <p className="text-base text-blue-400 font-semibold mt-2">
            롤백: kubectl rollout undo
          </p>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}
