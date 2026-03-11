import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide16() {
  const configCode = `apiVersion: v1
kind: ConfigMap
metadata:
  name: descheduler-policy
  namespace: kube-system
data:
  policy.yaml: |
    apiVersion: "descheduler/v1alpha1"
    kind: "DeschedulerPolicy"
    strategies:
      # 1. 노드 리소스 불균형 해소
      LowNodeUtilization:
        enabled: true
        params:
          nodeResourceUtilizationThresholds:
            thresholds:
              cpu: 20
              memory: 20
            targetThresholds:
              cpu: 50
              memory: 50

      # 2. Affinity/Tolerations 위반 수정
      RemovePodsViolatingNodeAffinity:
        enabled: true
        params:
          nodeAffinityType:
          - requiredDuringSchedulingIgnoredDuringExecution

      RemovePodsViolatingNodeTaints:
        enabled: true

      # 3. Pod Anti-Affinity 위반 수정
      RemovePodsViolatingInterPodAntiAffinity:
        enabled: true

      # 4. Topology Spread 위반 수정
      RemovePodsViolatingTopologySpreadConstraint:
        enabled: true`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">Descheduler 정책 설정</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="cyan">ConfigMap 기반</Badge>
        <Badge color="purple">4가지 전략</Badge>
        <Badge color="emerald">CronJob 실행</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <CodeBlock
            code={configCode}
            language="yaml"
            title="Descheduler 정책 ConfigMap"
          />
        </div>

        <div className="col-span-2 space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-bold text-blue-400 mb-2 text-sm">1. LowNodeUtilization</h3>
            <p className="text-gray-400 text-xs mb-1">CPU/Memory 사용률이 낮은 노드(20% 미만)에서 Pod를 Evict</p>
            <p className="text-gray-400 text-xs">→ 사용률 높은 노드(50% 목표)로 재배치하여 통합</p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <h3 className="font-bold text-emerald-400 mb-2 text-sm">2. RemovePodsViolatingNodeAffinity</h3>
            <p className="text-gray-400 text-xs mb-1">노드 레이블 변경으로 Node Affinity 조건 위반 시 Pod Evict</p>
            <p className="text-gray-400 text-xs">예: 노드에서 "gpu" 레이블 제거 → GPU Pod 재배치</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <h3 className="font-bold text-amber-400 mb-2 text-sm">3. RemovePodsViolatingInterPodAntiAffinity</h3>
            <p className="text-gray-400 text-xs mb-1">같은 노드에 Anti-Affinity Pod들이 함께 있으면 Evict</p>
            <p className="text-gray-400 text-xs">→ 장애 도메인 분리 강제</p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <h3 className="font-bold text-purple-400 mb-2 text-sm">4. RemovePodsViolatingTopologySpreadConstraint</h3>
            <p className="text-gray-400 text-xs mb-1">Topology Spread maxSkew 위반 시 Pod Evict</p>
            <p className="text-gray-400 text-xs">→ AZ/노드 간 균등 분산 복원</p>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <h3 className="font-bold text-cyan-400 mb-2 text-sm">실행 방식: CronJob</h3>
            <p className="text-gray-400 text-xs">• 주기: 5분~1시간 (워크로드 특성에 따라 조정)</p>
            <p className="text-gray-400 text-xs">• PDB 존중: minAvailable 유지하며 Evict</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
