import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { AlertTriangle, Unplug, Clock, ShieldOff } from 'lucide-react';

export default function Slide25() {
  return (
    <SlideWrapper accent="rose">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <Badge color="rose">Part 4</Badge>
        <h2 className="text-3xl font-bold">Health Check 불일치 &mdash; 왜 위험한가</h2>
      </motion.div>
      <p className="text-lg text-gray-400 mb-6">K8s Probe와 LB Health Check의 독립적 실행이 만드는 장애</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
        <Card title="503 Service Unavailable" icon={<ShieldOff size={22} />} accent="rose" delay={0.1}>
          <p className="text-base">Probe 성공인데 ALB HC 실패</p>
          <p className="text-sm text-gray-500 mt-1">경로 불일치, SG 차단</p>
        </Card>
        <Card title="502 Bad Gateway" icon={<Unplug size={22} />} accent="rose" delay={0.15}>
          <p className="text-base">Graceful Shutdown 타이밍 불일치</p>
          <p className="text-sm text-gray-500 mt-1">종료 중 Pod에 트래픽 전송</p>
        </Card>
        <Card title="일시적 503" icon={<Clock size={22} />} accent="amber" delay={0.2}>
          <p className="text-base">Rolling Update 중 새 Pod 미준비</p>
          <p className="text-sm text-gray-500 mt-1">ALB HC 통과 전 트래픽</p>
        </Card>
        <Card title="504 Timeout" icon={<AlertTriangle size={22} />} accent="amber" delay={0.25}>
          <p className="text-base">Ingress timeout과 백엔드 불일치</p>
          <p className="text-sm text-gray-500 mt-1">파일 업로드, 배치 API</p>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900 rounded-xl p-6 border border-rose-500/20"
      >
        <p className="text-xl font-bold text-rose-400 mb-3">실제 인시던트 시나리오</p>
        <div className="grid grid-cols-3 gap-4 text-base text-gray-300">
          <div>
            <p className="font-semibold text-gray-200">상황</p>
            <p>readinessProbe: /healthz</p>
            <p>ALB HC: / (기본값)</p>
          </div>
          <div>
            <p className="font-semibold text-gray-200">결과</p>
            <p>K8s: Pod Ready (Endpoints OK)</p>
            <p>ALB: Unhealthy (404 반환)</p>
          </div>
          <div>
            <p className="font-semibold text-gray-200">영향</p>
            <p>사용자에게 503 에러</p>
            <p className="text-rose-400 font-semibold">MTTR 2시간 (원인 찾기 어려움)</p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
