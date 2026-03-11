import { SlideWrapper, CompareTable, Badge } from '@shared/components';

export function Slide07() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Affinity vs Anti-Affinity vs Topology Spread</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="cyan">비교 분석</Badge>
        <Badge color="purple">실전 선택 기준</Badge>
      </div>

      <CompareTable
        headers={['비교 항목', 'Pod Anti-Affinity', 'Topology Spread Constraints']}
        rows={[
          ['목적', 'Pod 간 분리', 'Pod 균등 분산'],
          ['세밀함', 'Pod 단위 제어', '도메인 간 균형 제어'],
          ['복잡성', '낮음', '중간'],
          ['유연성', 'Hard/Soft 선택', 'maxSkew로 허용 범위 제어'],
          ['주요 사용', '같은 앱 replica 분리', '여러 앱의 전체 균형'],
          ['AZ 분산', '가능', '더 정교함 (minDomains)'],
          ['노드 분산', '가능', '더 정교함 (maxSkew)'],
        ]}
        highlightCol={2}
      />

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5">
          <h3 className="font-bold text-emerald-400 mb-3">권장 조합 패턴</h3>
          <div className="text-gray-300 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="text-blue-400">Level 1:</span> Topology Spread (AZ 균등)
            </p>
            <p className="flex items-center gap-2">
              <span className="text-cyan-400">Level 2:</span> Anti-Affinity (노드 분산)
            </p>
            <p className="text-xs text-gray-500 mt-3">
              두 메커니즘을 함께 사용하여 다층 고가용성 확보
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5">
          <h3 className="font-bold text-amber-400 mb-3">Hard vs Soft 선택 기준</h3>
          <div className="text-gray-300 space-y-2 text-sm">
            <p>• replica 수 ≤ 노드 수 → <span className="text-blue-400">Hard</span></p>
            <p>• replica 수 &gt; 노드 수 → <span className="text-cyan-400">Soft</span></p>
            <p>• 미션 크리티컬 → <span className="text-emerald-400">Hard (AZ 레벨)</span></p>
            <p>• 빠른 스케일링 → <span className="text-purple-400">Soft</span></p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
