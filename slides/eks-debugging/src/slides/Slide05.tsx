import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { Timer, Search, Wrench } from 'lucide-react';

export default function Slide05() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        First 5 Minutes 체크리스트
      </motion.h2>
      <p className="text-lg text-gray-400 mb-8">인시던트 발생 시 초동 대응 타임라인</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="30초: 초기 진단" icon={<Timer size={24} />} accent="amber" delay={0.1}>
          <div className="space-y-3">
            <Badge color="amber">즉시</Badge>
            <ul className="space-y-2 text-base mt-2">
              <li className="font-mono text-emerald-300 text-sm">aws eks describe-cluster</li>
              <li>클러스터 상태 확인</li>
              <li className="font-mono text-emerald-300 text-sm">kubectl get nodes</li>
              <li>노드 상태 확인</li>
              <li className="font-mono text-emerald-300 text-sm">kubectl get pods -A | grep -v Running</li>
              <li>비정상 Pod 확인</li>
            </ul>
          </div>
        </Card>

        <Card title="2분: 스코프 판별" icon={<Search size={24} />} accent="amber" delay={0.2}>
          <div className="space-y-3">
            <Badge color="amber">영향 범위 파악</Badge>
            <ul className="space-y-2 text-base mt-2">
              <li>최근 이벤트 확인 (전체 NS)</li>
              <li>Pod 상태 집계</li>
              <li>노드별 비정상 Pod 분포</li>
              <li className="mt-3 text-amber-400 font-semibold">단일 Pod? 같은 노드? 같은 AZ?</li>
            </ul>
          </div>
        </Card>

        <Card title="5분: 초동 대응" icon={<Wrench size={24} />} accent="amber" delay={0.3}>
          <div className="space-y-3">
            <Badge color="amber">상세 진단</Badge>
            <ul className="space-y-2 text-base mt-2">
              <li className="font-mono text-emerald-300 text-sm">kubectl describe pod</li>
              <li>문제 Pod 상세 정보</li>
              <li className="font-mono text-emerald-300 text-sm">kubectl logs --previous</li>
              <li>이전 컨테이너 로그</li>
              <li className="font-mono text-emerald-300 text-sm">kubectl top nodes/pods</li>
              <li>리소스 사용량 확인</li>
            </ul>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-base text-gray-500"
      >
        가장 중요한 것은 <span className="text-amber-400 font-semibold">스코프 판별</span>과{' '}
        <span className="text-amber-400 font-semibold">초동 대응</span>입니다
      </motion.div>
    </SlideWrapper>
  );
}
