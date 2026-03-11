import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide09() {
  const taintCode = `# Taint 적용 (노드)
kubectl taint nodes gpu-node-1 nvidia.com/gpu=present:NoSchedule

# Taint 제거
kubectl taint nodes gpu-node-1 nvidia.com/gpu=present:NoSchedule-`;

  const tolerationCode = `# Toleration 설정 (Pod)
apiVersion: v1
kind: Pod
metadata:
  name: gpu-job
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Equal
    value: present
    effect: NoSchedule

  nodeSelector:
    node.kubernetes.io/instance-type: g5.2xlarge

  containers:
  - name: trainer
    image: ml/trainer:v1.0
    resources:
      limits:
        nvidia.com/gpu: 1`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">Taints & Tolerations 설정</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="orange">전용 노드 그룹</Badge>
        <Badge color="purple">시스템 워크로드 격리</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold text-orange-400 mb-3">Taint 적용 (kubectl)</h2>
          <CodeBlock
            code={taintCode}
            language="bash"
            title="노드에 Taint 설정"
          />
        </div>

        <div>
          <h2 className="text-xl font-bold text-cyan-400 mb-3">Toleration 선언 (Pod)</h2>
          <CodeBlock
            code={tolerationCode}
            language="yaml"
            title="GPU Pod Toleration"
          />
        </div>
      </div>

      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-5">
        <h3 className="font-bold text-purple-400 mb-3">Operator 비교</h3>
        <div className="grid grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <span className="text-blue-400 font-bold">Equal:</span> key=value 정확히 일치
            <pre className="text-xs mt-2 text-gray-500">operator: Equal, value: "gpu"</pre>
          </div>
          <div>
            <span className="text-cyan-400 font-bold">Exists:</span> key만 존재하면 됨
            <pre className="text-xs mt-2 text-gray-500">operator: Exists (value 무시)</pre>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-purple-500/30">
          <span className="text-amber-400 font-bold">모든 Taint Tolerate:</span>
          <pre className="text-xs mt-2 text-gray-500">{"tolerations: [{operator: Exists}]"}</pre>
          <p className="text-xs text-gray-500 mt-1">DaemonSet에서 주로 사용</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
