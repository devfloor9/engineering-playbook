import { SlideWrapper, Card } from '@shared/components';
import { Cloud, Server, GitMerge } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
        SageMaker + EKS 통합
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-8 h-8 text-orange-400" />
            <h3 className="text-2xl font-bold text-white">SageMaker 강점</h3>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-1">▸</span>
              <div>
                <strong>관리형 학습</strong>
                <p className="text-sm text-gray-300">인프라 관리 부담 제로</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-1">▸</span>
              <div>
                <strong>분산 학습</strong>
                <p className="text-sm text-gray-300">대규모 데이터셋 처리</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 mt-1">▸</span>
              <div>
                <strong>Model Registry</strong>
                <p className="text-sm text-gray-300">중앙 모델 거버넌스</p>
              </div>
            </li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">EKS 강점</h3>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">▸</span>
              <div>
                <strong>유연한 서빙</strong>
                <p className="text-sm text-gray-300">세밀한 제어 가능</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">▸</span>
              <div>
                <strong>비용 최적화</strong>
                <p className="text-sm text-gray-300">Spot + Karpenter</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">▸</span>
              <div>
                <strong>Kubernetes 네이티브</strong>
                <p className="text-sm text-gray-300">기존 인프라 활용</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <Card color="gray" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitMerge className="w-8 h-8 text-emerald-400" />
          <h3 className="text-2xl font-bold text-white">하이브리드 아키텍처</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-orange-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🎓</div>
            <div className="text-sm font-bold text-orange-300 mb-1">학습</div>
            <div className="text-xs text-gray-300">SageMaker Training</div>
          </div>
          <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm font-bold text-purple-300 mb-1">레지스트리</div>
            <div className="text-xs text-gray-300">SageMaker Model Registry</div>
          </div>
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🚀</div>
            <div className="text-sm font-bold text-blue-300 mb-1">서빙</div>
            <div className="text-xs text-gray-300">EKS KServe</div>
          </div>
        </div>
      </Card>
    </SlideWrapper>
  );
}
