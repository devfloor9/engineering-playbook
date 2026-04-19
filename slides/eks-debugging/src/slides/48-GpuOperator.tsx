import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';

export default function GpuOperator() {
  const nodes = [
    { id: 'cp', label: 'ClusterPolicy', x: 340, y: 10, color: 'purple', width: 180, height: 50 },
    { id: 'driver', label: 'NVIDIA Driver', x: 80, y: 100, color: 'purple', width: 160, height: 50 },
    { id: 'toolkit', label: 'Container Toolkit', x: 280, y: 100, color: 'purple', width: 180, height: 50 },
    { id: 'dp', label: 'Device Plugin', x: 500, y: 100, color: 'purple', width: 160, height: 50 },
    { id: 'dcgm', label: 'DCGM Exporter', x: 700, y: 100, color: 'emerald', width: 160, height: 50 },
    { id: 'gfd', label: 'GPU Feature\nDiscovery', x: 80, y: 200, color: 'blue', width: 160, height: 50 },
    { id: 'validator', label: 'Operator\nValidator', x: 300, y: 200, color: 'blue', width: 160, height: 50 },
    { id: 'status', label: 'Node: nvidia.com/gpu', x: 530, y: 200, color: 'emerald', width: 200, height: 50 },
  ];

  const edges = [
    { from: 'cp', to: 'driver', color: 'purple' },
    { from: 'cp', to: 'toolkit', color: 'purple' },
    { from: 'cp', to: 'dp', color: 'purple' },
    { from: 'cp', to: 'dcgm', color: 'emerald' },
    { from: 'driver', to: 'gfd', color: 'blue' },
    { from: 'toolkit', to: 'validator', color: 'blue' },
    { from: 'dp', to: 'status', color: 'emerald' },
  ];

  return (
    <SlideWrapper accent="purple">
      <Badge color="purple">GPU/AI</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">GPU Operator 컴포넌트 구조</h1>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={270} />

      <div className="mt-5">
        <CodeBlock title="GPU Operator 진단" delay={0.3}>
{`# ClusterPolicy 상태
kubectl get clusterpolicy -A
kubectl describe clusterpolicy gpu-cluster-policy

# 각 컴포넌트 Pod 상태
kubectl get pods -n gpu-operator

# Driver Pod 로그 (설치 실패 시)
kubectl logs -n gpu-operator nvidia-driver-daemonset-<pod-id>
# 에러: "Kernel headers not found" → AMI에 kernel-devel 필요
# 에러: "nouveau driver is loaded" → nouveau 블랙리스트 필요

# Device Plugin 로그
kubectl logs -n gpu-operator nvidia-device-plugin-daemonset-<pod-id>
# 정상: "Detected NVIDIA devices: 8"`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
