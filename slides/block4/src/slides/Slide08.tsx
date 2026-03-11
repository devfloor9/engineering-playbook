import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide08() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Pod Anti-Affinity vs TSC</h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <CompareTable
          headers={['항목', 'Pod Anti-Affinity', 'Topology Spread Constraints']}
          rows={[
            ['분산 방식', '특정 Pod와 떨어뜨리기', 'AZ/노드 간 균등 분산'],
            ['세밀도', '이진 (같이 / 떨어짐)', 'maxSkew로 조정 가능'],
            ['확장성', 'replica 증가 시 복잡도 증가', 'replica 수와 무관'],
            ['AZ 분산', '간접적 (nodeSelector 필요)', '직접적 (topologyKey 사용)'],
            ['설정 복잡도', '높음 (matchExpression)', '중간 (선언적)'],
            ['권장 사용', '특수한 워크로드 격리', 'Multi-AZ HA 구성'],
          ]}
          highlightCol={2}
        />

        <div className="mt-6 p-5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-center text-lg text-blue-200">
            ✅ <span className="font-bold">권장:</span> TSC를 기본 전략으로 사용하고, 
            특수한 격리 요구사항이 있을 때만 Anti-Affinity 추가
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
