import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { motion } from 'framer-motion';

export default function Slide04() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        Top-down vs Bottom-up 접근
      </motion.h2>
      <p className="text-lg text-gray-400 mb-8">상황에 따라 적합한 디버깅 방향 선택</p>

      <CompareTable
        headers={['구분', 'Top-down (증상 → 원인)', 'Bottom-up (인프라 → 앱)']}
        rows={[
          ['시작점', '사용자 보고 증상 / 알림', '컨트롤 플레인부터 순차 점검'],
          ['적합한 상황', '프로덕션 인시던트, 장애 대응', '예방적 점검, 마이그레이션 후 검증'],
          ['장점', '빠른 장애 해결, 사용자 영향 최소화', '숨은 문제 사전 발견, 전체 상태 파악'],
          ['단점', '근본 원인 놓칠 수 있음', '시간 소요가 큼'],
          ['소요 시간', '분 단위 (긴급 대응)', '시간 단위 (정기 점검)'],
          ['권장 대상', 'SRE 온콜 엔지니어', '플랫폼 팀, 클러스터 관리자'],
        ]}
        highlightCol={1}
        delay={0.2}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gray-900 rounded-xl p-4 border border-blue-500/20 text-center"
      >
        <p className="text-lg text-blue-400 font-semibold">
          프로덕션 인시던트에서는 Top-down 접근을 권장합니다
        </p>
        <p className="text-base text-gray-400 mt-1">
          먼저 증상을 파악하고, 해당 레이어의 디버깅 섹션으로 이동하세요
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
