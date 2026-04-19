import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Clock, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpotDrift() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Karpenter</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">Spot 중단 & Drift 처리</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="2분 경고" icon={<Clock size={22} />} accent="amber" delay={0.1}>
          <p>Spot Interruption Notice: <span className="text-amber-400 font-bold">2분 전 경고</span></p>
          <p className="mt-2">Karpenter가 즉시 대체 노드 시작</p>
          <p className="text-gray-400 mt-1">Cordon → Graceful Shutdown → 새 노드 재스케줄</p>
          <p className="text-emerald-400 mt-2">terminationGracePeriodSeconds: 60 권장</p>
        </Card>
        <Card title="AMI 업데이트 (Drift)" icon={<RefreshCw size={22} />} accent="blue" delay={0.2}>
          <p>NodePool 정의와 실제 노드가 불일치 시 <span className="text-blue-400 font-bold">Drift 감지</span></p>
          <p className="mt-2">AMI 변경, NodePool requirements 변경, SG 변경</p>
          <p className="text-gray-400 mt-1">자동으로 새 NodeClaim 생성 → 교체</p>
        </Card>
        <Card title="교체 순서" icon={<ArrowRightLeft size={22} />} accent="emerald" delay={0.3}>
          <p className="font-semibold">1. Drift 감지</p>
          <p className="font-semibold">2. 새 NodeClaim 생성 (새 AMI)</p>
          <p className="font-semibold">3. Pod 마이그레이션</p>
          <p className="font-semibold">4. 기존 노드 종료</p>
          <p className="text-amber-400 mt-2">budgets: nodes: "10%" 로 동시 교체 제한</p>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900 rounded-xl p-6 border border-amber-500/30"
      >
        <h3 className="text-xl font-bold text-amber-400 mb-3">Spot 중단 대응 전략</h3>
        <div className="grid grid-cols-3 gap-6 text-lg">
          <div>
            <p className="text-gray-300 font-semibold">capacity-type</p>
            <p className="text-gray-400">spot + on-demand 폴백</p>
          </div>
          <div>
            <p className="text-gray-300 font-semibold">budgets</p>
            <p className="text-gray-400">nodes: "20%" 동시 중단 제한</p>
          </div>
          <div>
            <p className="text-gray-300 font-semibold">preStop hook</p>
            <p className="text-gray-400">graceful shutdown 보장</p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
