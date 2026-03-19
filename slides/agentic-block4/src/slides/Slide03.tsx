import { SlideWrapper, Card, Badge } from '@shared/components';
import { Eye, TrendingUp, Split } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Hybrid Observability
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card color="blue" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">Production: Langfuse</h3>
          </div>
          <Badge color="blue" size="lg" className="mb-3">Self-hosted</Badge>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>데이터 주권</strong>: EKS 내 self-hosted 배포</li>
            <li>• LLM 호출 체인 전체 Trace</li>
            <li>• 토큰 사용량 &amp; 비용 분석</li>
            <li>• Bifrost → Langfuse (OpenTelemetry)</li>
            <li>• 프롬프트 버전 관리 &amp; A/B 테스트</li>
          </ul>
        </Card>

        <Card color="emerald" className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">Dev/Staging: LangSmith</h3>
          </div>
          <Badge color="emerald" size="lg" className="mb-3">LangGraph Studio</Badge>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>LangGraph Studio 네이티브</strong> 연동</li>
            <li>• 시각적 에이전트 워크플로우 디버깅</li>
            <li>• 실시간 프롬프트 실험</li>
            <li>• 데이터셋 &amp; 평가 파이프라인</li>
            <li>• 빠른 프로토타이핑 최적화</li>
          </ul>
        </Card>
      </div>

      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Split className="w-8 h-8 text-purple-400" />
          <h3 className="text-xl font-bold text-white">환경별 관측성 분리 전략</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-3">
            <div className="text-blue-300 font-bold text-sm mb-1">Production</div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Langfuse: 데이터 주권, 비용 통제</li>
              <li>• DCGM → AMP → AMG: GPU 인프라 모니터링</li>
              <li>• Kubecost: Pod-level 비용 귀속</li>
            </ul>
          </div>
          <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3">
            <div className="text-emerald-300 font-bold text-sm mb-1">Dev / Staging</div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• LangSmith: LangGraph Studio 연동</li>
              <li>• 시각적 디버깅 &amp; 실험</li>
              <li>• Guardrails 선택적 적용</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card color="blue" className="p-4">
        <p className="text-blue-300 text-center">
          <strong>핵심 원칙:</strong> Prod은 데이터 주권 (Langfuse self-hosted), Dev는 개발자 생산성 (LangSmith + LangGraph Studio)
        </p>
      </Card>
    </SlideWrapper>
  );
}
