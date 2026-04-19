import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { AlertTriangle, GitBranch, Tag, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutoHybrid() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Auto Mode</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">하이브리드 구성 시 주의점</h1>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <Card title="MNG 추가 시 충돌" icon={<AlertTriangle size={22} />} accent="rose" delay={0.1}>
          <p>Auto Mode + MNG 혼합 시 <span className="text-rose-400 font-bold">스케줄링 충돌</span> 가능</p>
          <p className="mt-2">Auto Mode NodePool과 MNG가 같은 Pod를 경쟁적으로 스케줄링</p>
          <p className="text-amber-400 mt-2">반드시 Taint/Toleration으로 분리</p>
        </Card>
        <Card title="레이블 전략" icon={<Tag size={22} />} accent="amber" delay={0.2}>
          <p>MNG 노드에 <span className="text-amber-400 font-bold">workload=gpu</span> 레이블 추가</p>
          <p className="mt-2">Pod의 nodeSelector로 명확한 타겟팅</p>
          <p className="text-gray-400 mt-1">Auto Mode 노드에는 일반 워크로드만</p>
        </Card>
        <Card title="테인트 분리" icon={<Shield size={22} />} accent="emerald" delay={0.3}>
          <p>GPU MNG: <code className="text-emerald-400">nvidia.com/gpu=true:NoSchedule</code></p>
          <p className="mt-2">GPU Pod만 Toleration으로 스케줄링</p>
          <p className="text-gray-400 mt-1">일반 Pod이 GPU 노드에 배치되는 것 방지</p>
        </Card>
        <Card title="하이브리드 패턴" icon={<GitBranch size={22} />} accent="blue" delay={0.4}>
          <p className="text-blue-400 font-bold">Auto Mode NodePool</p>
          <p>→ 웹 서버, API, 배치 작업</p>
          <p className="text-purple-400 font-bold mt-2">GPU MNG (Managed Node Group)</p>
          <p>→ vLLM, 학습 Job, GPU Operator</p>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
      >
        <p className="text-lg text-amber-300">
          <span className="font-bold">GPU MNG 생성 예시:</span>{' '}
          <code className="text-base">aws eks create-nodegroup --instance-types g5.2xlarge g5.4xlarge --taints nvidia.com/gpu=true:NoSchedule</code>
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
