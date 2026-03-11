import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide13() {
  const priorityClassCode = `apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: business-critical
value: 1000000  # 높을수록 우선순위 높음
globalDefault: false
description: "Revenue-impacting services"`;

  const tierCode = `# Tier 1: System Critical
value: 999999000

# Tier 2: Business Critical
value: 1000000

# Tier 3: High Priority
value: 100000

# Tier 4: Standard (기본값)
value: 10000
globalDefault: true

# Tier 5: Low Priority (Batch)
value: 1000
preemptionPolicy: Never`;

  const usageCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  template:
    spec:
      priorityClassName: business-critical
      containers:
      - name: payment
        image: payment-service:v2.0`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">PriorityClass: 우선순위 정의</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="purple">우선순위 기반 스케줄링</Badge>
        <Badge color="rose">Preemption 제어</Badge>
        <Badge color="cyan">리소스 부족 대응</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <CodeBlock
          code={priorityClassCode}
          language="yaml"
          title="PriorityClass 정의"
        />
        <CodeBlock
          code={tierCode}
          language="yaml"
          title="프로덕션 4-Tier 체계"
        />
        <CodeBlock
          code={usageCode}
          language="yaml"
          title="Deployment 적용"
        />
      </div>

      <div className="grid grid-cols-5 gap-3 text-sm">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <h3 className="font-bold text-rose-400 mb-2 text-xs">Tier 1</h3>
          <p className="text-gray-300 text-xs mb-1">System Critical</p>
          <p className="text-gray-500 text-xs">999,999,000</p>
          <p className="text-gray-600 text-xs mt-2">DNS, CNI</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <h3 className="font-bold text-orange-400 mb-2 text-xs">Tier 2</h3>
          <p className="text-gray-300 text-xs mb-1">Business Critical</p>
          <p className="text-gray-500 text-xs">1,000,000</p>
          <p className="text-gray-600 text-xs mt-2">Payment</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-bold text-amber-400 mb-2 text-xs">Tier 3</h3>
          <p className="text-gray-300 text-xs mb-1">High Priority</p>
          <p className="text-gray-500 text-xs">100,000</p>
          <p className="text-gray-600 text-xs mt-2">API</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-bold text-blue-400 mb-2 text-xs">Tier 4</h3>
          <p className="text-gray-300 text-xs mb-1">Standard</p>
          <p className="text-gray-500 text-xs">10,000</p>
          <p className="text-gray-600 text-xs mt-2">기본값</p>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
          <h3 className="font-bold text-gray-400 mb-2 text-xs">Tier 5</h3>
          <p className="text-gray-300 text-xs mb-1">Low Priority</p>
          <p className="text-gray-500 text-xs">1,000</p>
          <p className="text-gray-600 text-xs mt-2">Batch</p>
        </div>
      </div>

      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-purple-400 mb-2">preemptionPolicy</h3>
        <div className="grid grid-cols-2 gap-4 text-gray-300">
          <div>
            <span className="text-rose-400">PreemptLowerPriority (기본):</span> 낮은 우선순위 Pod Evict
          </div>
          <div>
            <span className="text-cyan-400">Never:</span> 다른 Pod를 Preempt하지 않음 (Batch 작업용)
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
