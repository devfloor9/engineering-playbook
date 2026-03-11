import { SlideWrapper, Card, Badge } from '@shared/components';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function Slide20() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        핵심 정리 &amp; 다음 단계
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700">
          <div className="flex items-start gap-4 mb-4">
            <Sparkles className="w-10 h-10 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-blue-300">핵심 아키텍처 원칙</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base text-gray-300">모듈화: 독립적 배포 및 확장</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base text-gray-300">자동화: End-to-End 스케일링</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base text-gray-300">관측성: 전체 흐름 추적</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base text-gray-300">보안: 다층 보안 모델</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-5">
            <Badge className="mb-3 bg-amber-500/20 text-amber-300">핵심 솔루션</Badge>
            <ul className="text-base text-gray-400 space-y-2">
              <li>• EKS Auto Mode + Karpenter 자동화</li>
              <li>• Kgateway + vLLM 추론 스택</li>
              <li>• LangFuse + Prometheus 관측성</li>
              <li>• Kagent CRD 기반 에이전트 관리</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Badge className="mb-3 bg-purple-500/20 text-purple-300">비용 최적화</Badge>
            <ul className="text-base text-gray-400 space-y-2">
              <li>• Spot 인스턴스: 50-70% 절감</li>
              <li>• Consolidation: 20-30% 절감</li>
              <li>• 유휴 리소스 자동 정리</li>
              <li>• 테넌트별 비용 할당</li>
            </ul>
          </Card>
        </div>

        <Card className="p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700">
          <div className="flex items-center gap-4 mb-4">
            <ArrowRight className="w-10 h-10 text-pink-400" />
            <h3 className="text-2xl font-semibold text-pink-300">다음 단계</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-base text-gray-400">
            <div>
              <strong className="text-gray-300">Block 2:</strong>
              <p className="text-sm">Gateway &amp; Agents (Kgateway, Kagent, Milvus)</p>
            </div>
            <div>
              <strong className="text-gray-300">Block 3:</strong>
              <p className="text-sm">Model Serving (vLLM, GPU 관리, NeMo)</p>
            </div>
            <div>
              <strong className="text-gray-300">Block 4:</strong>
              <p className="text-sm">Operations &amp; MLOps (모니터링, CI/CD, 보안)</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
