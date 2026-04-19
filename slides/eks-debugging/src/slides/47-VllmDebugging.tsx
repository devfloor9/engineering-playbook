import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { Brain, MemoryStick, Settings } from 'lucide-react';

export default function VllmDebugging() {
  return (
    <SlideWrapper accent="purple">
      <Badge color="purple">GPU/AI</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">vLLM 디버깅</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="gpu_memory_utilization" icon={<Settings size={22} />} accent="purple" delay={0.1}>
          <p>기본값 0.9 — GPU 메모리의 90% 사용</p>
          <p className="mt-2">OOM 발생 시 <span className="text-purple-400 font-bold">0.85 → 0.8</span> 단계적 감소</p>
          <p className="text-gray-400 mt-1">낭비 시 0.95까지 증가 가능</p>
        </Card>
        <Card title="OOM vs KV Cache" icon={<MemoryStick size={22} />} accent="rose" delay={0.2}>
          <p className="text-rose-400 font-bold">모델 로드 OOM</p>
          <p>→ 더 큰 GPU 또는 Quantization (AWQ/GPTQ)</p>
          <p className="text-amber-400 font-bold mt-3">"No available blocks"</p>
          <p>→ KV Cache 부족, max_model_len 감소</p>
        </Card>
        <Card title="Tensor Parallel" icon={<Brain size={22} />} accent="purple" delay={0.3}>
          <p>--tensor-parallel-size = <span className="text-purple-400 font-bold">Pod GPU 수</span>와 일치</p>
          <p className="mt-2">H100x8: TP=8 (70B 모델)</p>
          <p className="text-gray-400 mt-1">TP 수는 hidden dim 약수 (2,4,8)</p>
        </Card>
      </div>

      <CodeBlock title="vLLM 파라미터 튜닝 예시" language="yaml" delay={0.4}>
{`args:
  - --model=/models/llama-3.1-70b
  - --tensor-parallel-size=4        # GPU 수와 일치
  - --gpu-memory-utilization=0.85   # OOM 시 감소 (기본 0.9)
  - --max-model-len=8192            # KV Cache 크기 결정
  - --max-num-batched-tokens=8192   # 처리량/지연 균형
  - --max-num-seqs=256              # 동시 처리 시퀀스 수
  - --swap-space=4                  # CPU 메모리 스왑 공간 (GiB)

# 튜닝 순서: OOM → gpu_memory_utilization 감소 → max_model_len 감소 → max_num_seqs 감소`}
      </CodeBlock>
    </SlideWrapper>
  );
}
