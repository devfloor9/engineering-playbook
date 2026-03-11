import { SlideWrapper, CompareTable, Badge } from '@shared/components';

export function Slide17() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-blue-400">스케줄링 전략 조합</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="emerald">실전 조합 패턴</Badge>
        <Badge color="purple">워크로드별 선택</Badge>
      </div>

      <CompareTable
        headers={['워크로드 유형', '노드 선택', 'Pod 분산', 'PDB', 'Priority', '기타']}
        rows={[
          ['미션 크리티컬 API', 'Node Affinity (On-Demand)', 'Hard Anti-Affinity (노드) + TSC (AZ)', 'minAvailable: 80%', 'business-critical', 'Descheduler'],
          ['일반 웹 서비스', 'Node Affinity (Spot 허용)', 'Soft Anti-Affinity', 'minAvailable: 50%', 'standard', '-'],
          ['GPU ML 학습', 'nodeSelector (GPU)', '-', 'maxUnavailable: 1', 'high-priority', 'Taints (전용)'],
          ['Batch 작업', 'Spot 전용', '-', '-', 'low-priority (Never)', 'Taints (격리)'],
          ['Stateful DB', 'On-Demand 전용', 'Hard Anti-Affinity (노드)', 'maxUnavailable: 1', 'high-priority', 'PVC AZ 고려'],
          ['캐시 레이어', 'Node Affinity', 'Pod Affinity (앱과 동일 노드)', 'minAvailable: 1', 'standard', 'DaemonSet 가능'],
        ]}
      />

      <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="font-bold text-emerald-400 mb-2">고가용성 패턴</h3>
          <p className="text-gray-400 text-xs mb-1">• Topology Spread (AZ 균등)</p>
          <p className="text-gray-400 text-xs mb-1">• Hard Anti-Affinity (노드 분산)</p>
          <p className="text-gray-400 text-xs mb-1">• PDB minAvailable 80%</p>
          <p className="text-gray-400 text-xs">• On-Demand 전용 노드</p>
        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="font-bold text-cyan-400 mb-2">비용 최적화 패턴</h3>
          <p className="text-gray-400 text-xs mb-1">• Spot 인스턴스 활용</p>
          <p className="text-gray-400 text-xs mb-1">• Soft Anti-Affinity (유연성)</p>
          <p className="text-gray-400 text-xs mb-1">• Low Priority (Batch)</p>
          <p className="text-gray-400 text-xs">• Karpenter 자동 통합</p>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-bold text-purple-400 mb-2">전용 리소스 패턴</h3>
          <p className="text-gray-400 text-xs mb-1">• Taints (전용 노드 격리)</p>
          <p className="text-gray-400 text-xs mb-1">• Tolerations (허용 Pod만)</p>
          <p className="text-gray-400 text-xs mb-1">• nodeSelector (인스턴스 타입)</p>
          <p className="text-gray-400 text-xs">• 예: GPU, High-Memory</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
