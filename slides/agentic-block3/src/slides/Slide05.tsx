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
      terminationGracePeriodSeconds: 300
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
            - --shutdown-timeout=240
          resources:
            requests:
              nvidia.com/gpu: 1
            limits:
              nvidia.com/gpu: 1
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: qwen3-32b-fp8-pdb
  namespace: vllm
spec:
  maxUnavailable: 1
  selector:
    matchLabels:
      app: qwen3-32b-fp8`;

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
          title="Deployment YAML - Graceful Drain 설정"
        />

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-400 mb-3">핵심 파라미터</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-cyan-400 font-mono">--gpu-memory-utilization</span>: KV 캐시 VRAM</li>
              <li><span className="text-cyan-400 font-mono">--enable-prefix-caching</span>: 프리픽스 재사용</li>
              <li><span className="text-cyan-400 font-mono">--shutdown-timeout=240</span>: Graceful drain</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">Graceful Shutdown</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-amber-400">terminationGracePeriod: 300s</span></li>
              <li>진행 중인 요청 완료 대기</li>
              <li>Karpenter consolidation 대응</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">PodDisruptionBudget</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-400">maxUnavailable: 1</span></li>
              <li>동시 중단 Pod 제한</li>
              <li>가용성 보장</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
