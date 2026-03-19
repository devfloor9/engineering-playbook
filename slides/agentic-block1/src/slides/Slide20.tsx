import { SlideWrapper, Card } from '@shared/components';
import { Server, Layers } from 'lucide-react';

export default function Slide20() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-amber-300">
        EKS 클러스터 구성
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        컨트롤 플레인 × 데이터 플레인
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Server className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-blue-300">Control Plane 옵션</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• <strong>Standard:</strong> $0.10/hr, 일반 워크로드</li>
              <li>• <strong>PCP (tier-xl):</strong> 고정 요금, 대규모 프로덕션</li>
              <li>• <strong>PCP (tier-4xl+):</strong> 초대규모 학습 환경</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Layers className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-emerald-300">Data Plane 옵션</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• <strong>Managed Node Groups:</strong> 안정성 우선</li>
              <li>• <strong>Karpenter:</strong> 유연한 스케일링</li>
              <li>• <strong>Auto Mode:</strong> 완전 관리형, Spot 최적화</li>
            </ul>
          </Card>
        </div>

        <Card color="amber" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-amber-300">규모별 권장 조합</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-300">소규모 PoC:</strong>
              <p className="text-sm text-gray-400">Standard CP + Auto Mode DP</p>
            </div>
            <div>
              <strong className="text-gray-300">중규모 프로덕션:</strong>
              <p className="text-sm text-gray-400">Standard CP + Karpenter DP</p>
            </div>
            <div>
              <strong className="text-gray-300">대규모 엔터프라이즈:</strong>
              <p className="text-sm text-gray-400">PCP (tier-xl) + Auto Mode DP</p>
            </div>
            <div>
              <strong className="text-gray-300">초대규모 학습:</strong>
              <p className="text-sm text-gray-400">PCP (tier-4xl+) + Karpenter DP</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-blue-900/20 border-blue-700">
          <h4 className="text-lg font-semibold mb-2 text-blue-300">결정 요소</h4>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <strong>Spot 사용:</strong> Auto Mode 우선
            </div>
            <div>
              <strong>세밀한 제어:</strong> Karpenter 우선
            </div>
            <div>
              <strong>단순성:</strong> Auto Mode 우선
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
