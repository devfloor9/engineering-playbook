import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function IncidentDetection() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Observability</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">인시던트 디텍팅 4가지 패턴</h1>

      <CompareTable
        headers={['패턴', '방식', '장점', '한계', '도구']}
        highlightCol={0}
        rows={[
          ['임계값 기반', '미리 정의한 값 초과 시 알림', '구현 간단, 예측 가능', 'False Positive 많음', 'CloudWatch Alarms, PrometheusRule'],
          ['이상 탐지', 'ML 기반 정상 패턴 학습', '동적 환경에 적합', '학습 기간 2주 필요', 'CloudWatch Anomaly Detection'],
          ['복합 알람', '여러 알람 AND/OR 조합', 'False Positive 대폭 감소', '설정 복잡도 높음', 'CloudWatch Composite Alarms'],
          ['로그 메트릭 필터', '로그 패턴 → 메트릭 변환', '커스텀 이벤트 탐지', '실시간성 제한', 'CloudWatch Metric Filters'],
        ]}
        delay={0.2}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 bg-gray-900 rounded-xl p-5 border border-amber-500/30"
      >
        <h3 className="text-xl font-bold text-amber-400 mb-3">인시던트 디텍팅 성숙도 모델</h3>
        <div className="grid grid-cols-4 gap-4 text-lg">
          {[
            { level: 'L1', name: '기본', mttd: '< 30분', desc: '수동 모니터링' },
            { level: 'L2', name: '표준', mttd: '< 10분', desc: '임계값 + 로그 필터' },
            { level: 'L3', name: '고급', mttd: '< 5분', desc: '이상 탐지 + 복합 알람' },
            { level: 'L4', name: '자동화', mttd: '< 1분', desc: '자동 감지 + 자동 복구' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-amber-400 font-bold text-2xl">{item.level}</div>
              <div className="text-gray-200 font-semibold">{item.name}</div>
              <div className="text-emerald-400 font-bold">{item.mttd}</div>
              <div className="text-gray-400 text-base">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
