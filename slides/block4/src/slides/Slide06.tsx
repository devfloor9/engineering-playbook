import { SlideWrapper, CodeBlock } from '@shared/components';

export default function Slide06() {
  const code = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: critical-app
spec:
  replicas: 6
  template:
    spec:
      topologySpreadConstraints:
      # Hard: AZ 간 균등 분산 (반드시 보장)
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: DoNotSchedule
        labelSelector:
          matchLabels:
            app: critical-app
        minDomains: 3
      # Soft: 노드 간 분산 (가능한 한 보장)
      - maxSkew: 2
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: critical-app`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-center">Topology Spread Constraints</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <CodeBlock code={code} language="yaml" title="deployment.yaml" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-blue-300 mb-2">maxSkew: 1 (Hard)</h4>
            <p className="text-gray-400">
              가장 엄격한 균등 분산. 6개 replica를 3 AZ에 배포하면 각 AZ에 정확히 2개씩 배치
            </p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-2">minDomains: 3</h4>
            <p className="text-gray-400">
              최소 3개 AZ에 분산. 단일 AZ 장애 시에도 다른 2개 AZ에서 서비스 유지
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
