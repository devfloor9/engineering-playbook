import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide04() {
  const code = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: gpu-workload
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-training
  template:
    metadata:
      labels:
        app: ml-training
    spec:
      nodeSelector:
        node.kubernetes.io/instance-type: g5.2xlarge
        workload-type: gpu
      containers:
      - name: trainer
        image: ml/trainer:v2.0
        resources:
          requests:
            nvidia.com/gpu: 1`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">nodeSelector: 가장 간단한 노드 선택</h1>

      <div className="mb-6 flex items-center gap-4">
        <Badge color="emerald">기본 메커니즘</Badge>
        <Badge color="amber">레이블 기반 정확 일치</Badge>
        <Badge color="rose">AND 조건만 지원</Badge>
      </div>

      <CodeBlock
        code={code}
        language="yaml"
        title="nodeSelector 예시: GPU 노드 지정"
      />

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5">
          <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <span className="text-2xl">✅</span> 장점
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• 간단하고 직관적인 문법</li>
            <li>• 빠른 설정 가능</li>
            <li>• 명확한 노드 타입 지정</li>
          </ul>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-5">
          <h3 className="font-bold text-rose-400 mb-3 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> 제한사항
          </h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• OR, NOT 조건 사용 불가</li>
            <li>• 비교 연산자 미지원</li>
            <li>• 복잡한 조건은 Node Affinity 사용</li>
          </ul>
        </div>
      </div>
    </SlideWrapper>
  );
}
