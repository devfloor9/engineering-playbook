import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function Slide12() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        노드 리소스 압박 진단
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">DiskPressure / MemoryPressure / PIDPressure</p>

      <CompareTable
        headers={['Condition', '임계값', '진단 명령어 (SSM)', '해결 방법']}
        rows={[
          [
            'DiskPressure',
            '사용 가능 디스크 < 10%',
            'df -h',
            'crictl rmi --prune (미사용 이미지 정리)',
          ],
          [
            'MemoryPressure',
            '사용 가능 메모리 < 100Mi',
            'free -m',
            '저우선순위 Pod 축출 또는 노드 교체',
          ],
          [
            'PIDPressure',
            '사용 가능 PID < 5%',
            'ps aux | wc -l',
            'kernel.pid_max 증가, PID leak 컨테이너 재시작',
          ],
        ]}
        delay={0.2}
      />

      <div className="grid grid-cols-2 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-xl p-4 border border-amber-500/20"
        >
          <p className="text-lg font-semibold text-amber-400 mb-2">진단 시작</p>
          <code className="text-sm text-emerald-300 font-mono">
            kubectl describe node &lt;node-name&gt;
          </code>
          <p className="text-sm text-gray-400 mt-2">
            Conditions 섹션에서 True인 Pressure 항목 확인
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-xl p-4 border border-amber-500/20"
        >
          <p className="text-lg font-semibold text-amber-400 mb-2">예방 조치</p>
          <ul className="text-base text-gray-300 space-y-1">
            <li><Badge color="amber">1</Badge> eks-node-viewer로 실시간 모니터링</li>
            <li><Badge color="amber">2</Badge> Karpenter ttlSecondsAfterEmpty 설정</li>
            <li><Badge color="amber">3</Badge> 리소스 requests/limits 적절 설정</li>
          </ul>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}
