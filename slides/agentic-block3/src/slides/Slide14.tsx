import { SlideWrapper, Card, Badge, FlowDiagram } from '@shared/components';
import { Sparkles, Layers } from 'lucide-react';

export default function Slide14() {
  const flowSteps = [
    { label: 'Pod 생성', color: 'emerald' },
    { label: 'ResourceClaim', color: 'cyan' },
    { label: 'DRA Controller', color: 'blue' },
    { label: 'Allocated', color: 'purple' },
    { label: 'Pod Running', color: 'amber' },
  ];

  const features = [
    'GPU 분할: MIG, time-slicing',
    '우선순위 기반 할당',
    'Pod 수준 리소스 조율',
    '자동 복구 메커니즘',
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Sparkles className="w-16 h-16 text-cyan-400" />
          <h2 className="text-5xl font-bold text-cyan-400">DRA (Dynamic Resource Allocation)</h2>
        </div>

        <Card color="cyan" className="p-8 mb-8">
          <p className="text-2xl text-gray-300 leading-relaxed">
            Kubernetes 1.32+에서 <span className="text-cyan-400 font-semibold">v1beta1 API</span>로 전환,
            1.33+에서 <span className="text-emerald-400 font-semibold">GA(Generally Available)</span> 상태로
            <span className="text-purple-400 font-semibold"> 프로덕션 준비 완료</span>.
            <span className="text-amber-400 font-semibold">유연한 GPU 관리</span>를 위한 차세대 리소스 할당 API입니다.
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-purple-400 mb-4">주요 기능</h3>
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  {idx + 1}
                </div>
                <span className="text-lg text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <Card color="purple" className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-10 h-10 text-purple-400" />
              <h3 className="text-2xl font-semibold text-white">API 진화</h3>
            </div>
            <div className="space-y-3 text-gray-300">
              <div className="p-3 bg-gray-800 rounded">
                <Badge color="blue" className="mb-2">K8s 1.26-1.30</Badge>
                <div className="text-sm">Alpha (v1alpha2)</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <Badge color="purple" className="mb-2">K8s 1.31</Badge>
                <div className="text-sm">Beta (v1alpha2, 기본 활성화)</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <Badge color="cyan" className="mb-2">K8s 1.32+</Badge>
                <div className="text-sm">v1beta1 API 전환</div>
              </div>
              <div className="p-3 bg-gray-800 rounded">
                <Badge color="emerald" className="mb-2">K8s 1.33+</Badge>
                <div className="text-sm">GA 상태, 프로덕션 준비</div>
              </div>
            </div>
          </Card>
        </div>

        <FlowDiagram steps={flowSteps} title="DRA ResourceClaim 라이프사이클" />
      </div>
    </SlideWrapper>
  );
}
