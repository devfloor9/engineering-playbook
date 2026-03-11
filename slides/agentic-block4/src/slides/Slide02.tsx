import { SlideWrapper, Card, FlowDiagram } from '@shared/components';
import { Target, Zap } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
        운영 &amp; MLOps 개요
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">왜 필요한가?</h3>
          </div>
          <ul className="space-y-2 text-gray-300">
            <li>• AI 시스템의 복잡한 추론 과정 추적</li>
            <li>• 토큰 사용량 및 비용 관리</li>
            <li>• 모델 품질 지속적 평가</li>
            <li>• 프로덕션 안정성 확보</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h3 className="text-2xl font-bold text-white">핵심 구성 요소</h3>
          </div>
          <ul className="space-y-2 text-gray-300">
            <li>• Agent 모니터링 (LangFuse)</li>
            <li>• RAG 평가 (RAGAS)</li>
            <li>• MLOps 파이프라인 (Kubeflow)</li>
            <li>• SageMaker-EKS 통합</li>
          </ul>
        </Card>
      </div>

      <FlowDiagram
        steps={[
          { label: "모니터링", icon: "👁️" },
          { label: "평가", icon: "📊" },
          { label: "학습", icon: "🧠" },
          { label: "배포", icon: "🚀" },
          { label: "운영", icon: "⚙️" },
        ]}
      />
    </SlideWrapper>
  );
}
