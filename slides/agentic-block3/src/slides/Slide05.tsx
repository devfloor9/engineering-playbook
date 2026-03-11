import { SlideWrapper, CodeBlock } from '@shared/components';
import { Server } from 'lucide-react';

export default function Slide05() {
  const deploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen3-32b-fp8
  namespace: vllm
spec:
  replicas: 1
  template:
    spec:
      nodeSelector:
        karpenter.sh/instance-family: g6e
      containers:
        - name: vllm
          image: vllm/vllm-openai:v0.6.3
          args:
            - Qwen/Qwen3-32B-FP8
            - --gpu-memory-utilization=0.95
            - --max-model-len=32768
            - --enable-prefix-caching
            - --kv-cache-dtype=fp8
          resources:
            requests:
              nvidia.com/gpu: 1
            limits:
              nvidia.com/gpu: 1`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-6">
          <Server className="w-12 h-12 text-blue-400" />
          <h2 className="text-4xl font-bold text-blue-400">vLLM EKS 배포</h2>
        </div>

        <CodeBlock
          code={deploymentYaml}
          language="yaml"
          title="Deployment YAML - GPU 리소스 설정"
        />

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">핵심 파라미터</h3>
            <ul className="space-y-2 text-gray-300">
              <li><span className="text-cyan-400 font-mono">--gpu-memory-utilization</span>: KV 캐시 VRAM 비율</li>
              <li><span className="text-cyan-400 font-mono">--max-model-len</span>: 최대 시퀀스 길이</li>
              <li><span className="text-cyan-400 font-mono">--enable-prefix-caching</span>: 프리픽스 재사용</li>
              <li><span className="text-cyan-400 font-mono">--kv-cache-dtype</span>: FP8로 메모리 절감</li>
            </ul>
          </div>

          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">NodeSelector</h3>
            <ul className="space-y-2 text-gray-300">
              <li><span className="text-amber-400">g6e</span>: NVIDIA L40S GPU</li>
              <li>비용 효율적 추론</li>
              <li>13B-70B 파라미터 모델 최적</li>
              <li>Karpenter 자동 프로비저닝</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
