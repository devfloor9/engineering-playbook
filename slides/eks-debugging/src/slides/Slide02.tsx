import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Target } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper accent="orange">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        왜 체계적 디버깅인가?
      </motion.h2>
      <p className="text-lg text-gray-400 mb-8">비체계적 vs 체계적 접근의 MTTR 차이</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="비체계적 디버깅" icon={<TrendingDown size={24} />} accent="rose" delay={0.1}>
          <ul className="space-y-2 text-base">
            <li>MTTR <span className="text-rose-400 font-bold">평균 4시간</span></li>
            <li>로그 무작위 검색</li>
            <li>"아마 이것일 거야" 추측 기반</li>
            <li>같은 문제 반복 발생</li>
          </ul>
        </Card>

        <Card title="체계적 디버깅" icon={<TrendingUp size={24} />} accent="emerald" delay={0.2}>
          <ul className="space-y-2 text-base">
            <li>MTTR <span className="text-emerald-400 font-bold">평균 30분</span></li>
            <li>레이어별 순차 점검</li>
            <li>Decision Tree 기반 판단</li>
            <li>Runbook으로 재발 방지</li>
          </ul>
        </Card>

        <Card title="핵심 원칙" icon={<Target size={24} />} accent="orange" delay={0.3}>
          <ul className="space-y-2 text-base">
            <li><Badge color="orange">1</Badge> 증상 → 레이어 분류</li>
            <li><Badge color="orange">2</Badge> 스코프 판별 (단일/다수)</li>
            <li><Badge color="orange">3</Badge> Decision Tree 따라가기</li>
            <li><Badge color="orange">4</Badge> 근본 원인 해결</li>
          </ul>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900 rounded-xl p-5 border border-[#ff9900]/20 text-center"
      >
        <p className="text-xl font-semibold text-[#ff9900]">
          MTTR 8배 단축 = 체계적 프레임워크 + 반복 훈련
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
