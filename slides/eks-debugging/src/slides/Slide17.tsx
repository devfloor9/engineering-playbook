import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { motion } from 'framer-motion';

export default function Slide17() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        OOMKilled 심층 분석
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">limits vs requests + 언어별 메모리 관리 전략</p>

      <CompareTable
        headers={['구분', 'requests', 'limits']}
        rows={[
          ['의미', '최소 보장 메모리 (스케줄링 기준)', '최대 사용 가능 메모리 (초과 시 OOMKill)'],
          ['설정 권장', '실제 사용량 기반 (p50)', '실제 피크 기반 (p99 + 20%)'],
          ['미설정 시', 'Best Effort QoS (가장 먼저 축출)', '무제한 사용 → 노드 OOM 위험'],
          ['QoS 영향', 'Guaranteed = requests == limits', 'Burstable = requests < limits'],
        ]}
        highlightCol={2}
        delay={0.1}
      />

      <div className="mt-6">
        <CompareTable
          title="언어별 메모리 관리 주의사항"
          headers={['언어/런타임', '핵심 설정', '주의사항']}
          rows={[
            ['JVM (Java/Kotlin)', '-Xmx = limits의 75%', 'Off-heap, Metaspace 별도 고려. limits 512Mi면 -Xmx384m'],
            ['Go', 'GOMEMLIMIT 설정', '1.19+ 소프트 메모리 제한 지원. GC 임계값 조정'],
            ['Node.js', '--max-old-space-size', '기본 V8 힙 ~1.5GB. limits에 맞춰 명시 설정'],
            ['Python', '메모리 누수 프로파일링', 'tracemalloc / memory_profiler 사용'],
          ]}
          delay={0.3}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 bg-gray-900 rounded-xl p-4 border border-rose-500/20 text-center"
      >
        <p className="text-lg text-rose-400 font-semibold">
          OOMKilled = 컨테이너 limits 초과. 노드 OOM = requests 합계가 노드 용량 초과
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
