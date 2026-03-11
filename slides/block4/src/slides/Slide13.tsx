import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide13() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">PDB 전략 패턴</h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <CompareTable
          headers={['설정', '동작', '적합한 상황']}
          rows={[
            ['minAvailable: 2', '항상 최소 2개 Pod 유지', 'replica 수가 적은 서비스 (3-5개)'],
            ['minAvailable: "50%"', '전체의 50% 이상 유지', 'replica 수가 많은 서비스'],
            ['maxUnavailable: 1', '동시에 최대 1개만 중단', '롤링 업데이트 중 안정성 중시'],
            ['maxUnavailable: "25%"', '전체의 25%까지 동시 중단 허용', '빠른 배포가 필요한 경우'],
          ]}
        />

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-200 text-center">
              ⚠️ <span className="font-bold">주의:</span> PDB가 너무 엄격하면 (minAvailable = replica 수) 
              노드 드레인이 영구적으로 차단될 수 있음
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200 text-center">
              ✅ <span className="font-bold">권장:</span> Karpenter Disruption Budget과 함께 사용하여 
              노드 수준 + Pod 수준 보호
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
