import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Server, Users } from 'lucide-react';

export default function Slide18() {
  const pytorchJobYaml = `apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: nemo-distributed-training
  namespace: nemo
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      template:
        spec:
          containers:
          - name: pytorch
            image: nvcr.io/nvidia/nemo:24.07
            command:
            - python
            - -m
            - nemo.collections.llm.recipes.finetune
            env:
            - name: NCCL_DEBUG
              value: "INFO"
            resources:
              limits:
                nvidia.com/gpu: 8
    Worker:
      replicas: 3`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-6">
          <Server className="w-12 h-12 text-purple-400" />
          <h2 className="text-4xl font-bold text-purple-400">NeMo EKS 배포</h2>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <CodeBlock
              code={pytorchJobYaml}
              language="yaml"
              title="PyTorchJob - 분산 학습"
            />
          </div>

          <div className="space-y-6">
            <Card color="purple" className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-10 h-10 text-purple-400" />
                <h3 className="text-2xl font-semibold text-white">Gang Scheduling</h3>
              </div>
              <p className="text-gray-300 mb-4">
                분산 학습에서 모든 Worker Pod이 동시에 시작되어야 합니다.
                Kubeflow Training Operator가 Gang Scheduling을 자동 처리합니다.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Master 1개 + Worker 3개 = 총 4개 Pod</li>
                <li>• 모든 Pod 준비 완료 후 학습 시작</li>
                <li>• NCCL 통신으로 gradient 동기화</li>
              </ul>
            </Card>

            <Card color="cyan" className="p-6">
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">환경 변수</h3>
              <div className="space-y-2 font-mono text-sm text-gray-300">
                <div><span className="text-purple-400">NCCL_DEBUG</span>: INFO</div>
                <div><span className="text-cyan-400">NCCL_IB_DISABLE</span>: 0</div>
                <div><span className="text-emerald-400">FI_PROVIDER</span>: efa</div>
                <div><span className="text-amber-400">FI_EFA_USE_DEVICE_RDMA</span>: 1</div>
              </div>
            </Card>

            <Card color="blue" className="p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-3">GPU 리소스</h3>
              <div className="space-y-2 text-gray-300">
                <div>• Master: 8× GPU (p5.48xlarge)</div>
                <div>• Worker: 각 8× GPU</div>
                <div>• 총 32 GPU (4 노드)</div>
                <div>• EFA 네트워크: 4× per node</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
