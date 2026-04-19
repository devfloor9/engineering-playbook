import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CheckCircle2, Cpu, AlertTriangle, Brain, Radio } from 'lucide-react';

export default function GpuChecklist() {
  return (
    <SlideWrapper accent="emerald">
      <Badge color="emerald">GPU/AI</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">GPU 진단 체크리스트</h1>

      <div className="grid grid-cols-2 gap-5">
        <Card title="Step 1: GPU 인식 확인" icon={<Cpu size={22} />} accent="purple" delay={0.1}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-purple-400 mt-1 shrink-0" /> Driver 설치 확인 (lsmod | grep nvidia)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-purple-400 mt-1 shrink-0" /> ClusterPolicy Ready 상태 확인</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-purple-400 mt-1 shrink-0" /> Driver DaemonSet Pod Running 확인</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-purple-400 mt-1 shrink-0" /> nvidia.com/gpu.present=true 레이블</li>
          </ul>
        </Card>
        <Card title="Step 2: 스케줄링 확인" icon={<AlertTriangle size={22} />} accent="amber" delay={0.2}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-amber-400 mt-1 shrink-0" /> Device Plugin Pod Running 확인</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-amber-400 mt-1 shrink-0" /> kubectl describe node에서 nvidia.com/gpu 리소스 확인</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-amber-400 mt-1 shrink-0" /> Auto Mode: devicePlugin=false 설정 여부</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-amber-400 mt-1 shrink-0" /> Pod GPU 요청이 노드 GPU 수 이하인지</li>
          </ul>
        </Card>
        <Card title="Step 3: vLLM OOM" icon={<Brain size={22} />} accent="rose" delay={0.3}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-rose-400 mt-1 shrink-0" /> gpu_memory_utilization 값 적절한지 (기본 0.9)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-rose-400 mt-1 shrink-0" /> max_model_len 과도하지 않은지</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-rose-400 mt-1 shrink-0" /> tensor-parallel-size = GPU 수 일치</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-rose-400 mt-1 shrink-0" /> 모델 크기가 GPU 메모리에 맞는지</li>
          </ul>
        </Card>
        <Card title="Step 4: NCCL Timeout (멀티노드)" icon={<Radio size={22} />} accent="blue" delay={0.4}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-blue-400 mt-1 shrink-0" /> SG에서 노드 간 모든 통신 허용</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-blue-400 mt-1 shrink-0" /> EFA Device Plugin 설치 (p4d/p5)</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-blue-400 mt-1 shrink-0" /> NCCL_SOCKET_IFNAME 올바른 인터페이스</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={18} className="text-blue-400 mt-1 shrink-0" /> WORLD_SIZE, RANK 환경변수 올바른지</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
