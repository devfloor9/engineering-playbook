import { SlideWrapper, Card, FlowDiagram } from '@shared/components';
import { Zap, DollarSign } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        SageMaker 활용 시나리오
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">패턴 1: 학습 → 서빙 분리</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            SageMaker에서 학습, EKS에서 서빙 (가장 일반적)
          </p>
          <FlowDiagram
            steps={[
              { label: "SageMaker Training", icon: "🎓" },
              { label: "Model Registry", icon: "📦" },
              { label: "EKS KServe", icon: "🚀" },
            ]}
          />
          <div className="mt-3 text-xs text-gray-300">
            사용 사례: 대규모 분산 학습 + 세밀한 서빙 제어
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">비용 최적화</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-gray-800 border border-orange-500/30 rounded p-2">
              <div className="text-sm text-orange-300 font-bold">학습</div>
              <div className="text-xs text-gray-300 mt-1">
                Spot Instances (최대 90% 절감)
              </div>
            </div>
            <div className="bg-gray-800 border border-blue-500/30 rounded p-2">
              <div className="text-sm text-blue-300 font-bold">서빙</div>
              <div className="text-xs text-gray-300 mt-1">
                Karpenter + Spot (최대 70% 절감)
              </div>
            </div>
            <div className="bg-gray-800 border border-emerald-500/30 rounded p-2">
              <div className="text-sm text-emerald-300 font-bold">스토리지</div>
              <div className="text-xs text-gray-300 mt-1">
                S3 Intelligent-Tiering
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card color="gray" className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">멀티 리전 배포</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-3">
            <div className="text-center text-2xl mb-2">🇺🇸</div>
            <div className="text-sm font-bold text-blue-300 text-center mb-1">us-west-2</div>
            <div className="text-xs text-gray-300 text-center">Primary Training</div>
          </div>
          <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3">
            <div className="text-center text-2xl mb-2">🇰🇷</div>
            <div className="text-sm font-bold text-purple-300 text-center mb-1">ap-northeast-2</div>
            <div className="text-xs text-gray-300 text-center">EKS Serving (Seoul)</div>
          </div>
          <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3">
            <div className="text-center text-2xl mb-2">🇪🇺</div>
            <div className="text-sm font-bold text-emerald-300 text-center mb-1">eu-west-1</div>
            <div className="text-xs text-gray-300 text-center">EKS Serving (Ireland)</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-center text-gray-300">
          S3 Cross-Region Replication으로 모델 자동 복제
        </div>
      </Card>
    </SlideWrapper>
  );
}
