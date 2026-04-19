import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { RefreshCw, Network } from 'lucide-react';

export default function Slide31() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        패턴 3-4: Rolling Update 503 + NLB Local
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">배포 중 일시적 장애와 NLB 트래픽 불균형</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="패턴 3: Rolling Update 일시적 503" icon={<RefreshCw size={24} />} accent="amber" delay={0.1}>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-amber-400">타이밍 불일치</p>
            <div className="bg-gray-950 rounded-lg p-3 text-sm font-mono text-gray-300 space-y-1">
              <p>T+10s: K8s Ready (Probe 성공)</p>
              <p>T+10s: K8s가 구 Pod 트래픽 중지</p>
              <p className="text-rose-400">T+10~30s: ALB HC 아직 미통과 = 503</p>
              <p>T+30s: ALB HC 2회 성공 = 트래픽 시작</p>
            </div>
            <div className="mt-3">
              <p className="text-base font-semibold text-emerald-400">해결:</p>
              <ul className="text-base space-y-1 mt-1">
                <li><Badge color="emerald">1</Badge> minReadySeconds: 30</li>
                <li className="text-sm text-gray-500 ml-6">ALB HC interval(15s) x threshold(2)</li>
                <li><Badge color="emerald">2</Badge> maxUnavailable: 1</li>
                <li><Badge color="emerald">3</Badge> PDB minAvailable: 50%</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="패턴 4: NLB + externalTrafficPolicy: Local" icon={<Network size={24} />} accent="amber" delay={0.2}>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-amber-400">트래픽 불균형</p>
            <div className="bg-gray-950 rounded-lg p-3 text-sm font-mono text-gray-300 space-y-1">
              <p>노드 1: Pod A, Pod B = HC 성공</p>
              <p className="text-rose-400">노드 2: Pod 없음 = HC 실패, TG 제거</p>
              <p>노드 3: Pod C = HC 성공</p>
              <p className="text-amber-400">결과: 노드 1이 2배 트래픽</p>
            </div>
            <div className="mt-3">
              <div className="bg-gray-950 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-300 mb-1">정책 선택 기준:</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li><span className="text-amber-400">Local</span>: Client IP 보존 필요 + 노드당 최소 1 Pod</li>
                  <li><span className="text-blue-400">Cluster</span>: 균등 분배 우선 + X-Forwarded-For 사용</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
