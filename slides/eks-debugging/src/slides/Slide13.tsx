import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { Monitor, Cpu, Settings } from 'lucide-react';

export default function Slide13() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        노드 모니터링 에이전트
      </motion.h2>
      <p className="text-lg text-gray-400 mb-8">Auto Mode vs Standard Mode 노드 관리 차이</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="EKS Auto Mode" icon={<Settings size={24} />} accent="blue" delay={0.1}>
          <div className="space-y-3">
            <Badge color="blue">AWS 완전 관리</Badge>
            <ul className="space-y-2 text-base mt-2">
              <li>노드 프로비저닝 자동화</li>
              <li>kubelet/containerd 관리 불필요</li>
              <li>SSH/SSM 접속 불가</li>
              <li>노드 문제 시 자동 교체</li>
              <li className="text-blue-400 font-semibold">디버깅: kubectl debug node/ 사용</li>
            </ul>
          </div>
        </Card>

        <Card title="Standard Mode (Manual)" icon={<Cpu size={24} />} accent="orange" delay={0.2}>
          <div className="space-y-3">
            <Badge color="orange">직접 관리</Badge>
            <ul className="space-y-2 text-base mt-2">
              <li>Managed Node Group / Karpenter</li>
              <li>SSM 접속으로 직접 디버깅</li>
              <li>kubelet/containerd 로그 확인 가능</li>
              <li>커스텀 AMI 사용 가능</li>
              <li className="text-[#ff9900] font-semibold">디버깅: SSM + journalctl</li>
            </ul>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-gray-900 rounded-xl p-5 border border-blue-500/20"
      >
        <div className="flex items-center gap-3 mb-3">
          <Monitor size={20} className="text-blue-400" />
          <p className="text-lg font-semibold text-blue-400">공통 모니터링 도구</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-base text-gray-300">
          <div>
            <p className="font-semibold">eks-node-viewer</p>
            <p className="text-sm text-gray-500">터미널 노드 리소스 시각화</p>
          </div>
          <div>
            <p className="font-semibold">Container Insights</p>
            <p className="text-sm text-gray-500">CloudWatch 기반 메트릭</p>
          </div>
          <div>
            <p className="font-semibold">Prometheus + Grafana</p>
            <p className="text-sm text-gray-500">PromQL 기반 커스텀 대시보드</p>
          </div>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
