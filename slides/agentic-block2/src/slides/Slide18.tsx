import { SlideWrapper, Card, Badge } from '@shared/components';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function Slide18() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-8 text-cyan-400">핵심 정리 &amp; 다음 단계</h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-2xl font-semibold mb-4 text-blue-300 flex items-center gap-2">
              <CheckCircle className="w-8 h-8" />
              핵심 포인트
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge color="blue" size="lg">Gateway</Badge>
                <p className="text-sm text-gray-300">
                  Kgateway로 헤더/경로 기반 동적 라우팅, 가중치 분배, 카나리 배포
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="emerald" size="lg">Agent</Badge>
                <p className="text-sm text-gray-300">
                  Kagent CRD로 에이전트를 선언적으로 관리, HPA/KEDA 자동 스케일링
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="purple" size="lg">Workflow</Badge>
                <p className="text-sm text-gray-300">
                  Workflow CRD로 멀티 에이전트 오케스트레이션, 병렬 실행 지원
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="cyan" size="lg">Vector DB</Badge>
                <p className="text-sm text-gray-300">
                  Milvus 분산 아키텍처로 대규모 RAG, LangChain/LlamaIndex 통합
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="orange" size="lg">AgentCore</Badge>
                <p className="text-sm text-gray-300">
                  Bedrock 완전 관리형 런타임, MCP 프로토콜, EKS MCP 서버 통합
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-2xl font-semibold mb-4 text-purple-300 flex items-center gap-2">
              <ArrowRight className="w-8 h-8" />
              다음 단계
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">장애 대응 강화</h4>
                <p className="text-xs text-gray-300">
                  폴백, 재시도, 서킷 브레이커로 고가용성 확보
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-emerald-500/30">
                <h4 className="text-sm font-semibold text-emerald-300 mb-2">하이브리드 전략</h4>
                <p className="text-xs text-gray-300">
                  Kagent (고빈도) + AgentCore (저빈도)로 비용 최적화
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">관측성 통합</h4>
                <p className="text-xs text-gray-300">
                  LangFuse + CloudWatch Gen AI Observability로 포괄적 모니터링
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">인덱스 최적화</h4>
                <p className="text-xs text-gray-300">
                  Milvus SCANN 인덱스, GPU 가속 인덱싱으로 성능 향상
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="p-6 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-cyan-900/30 rounded-xl border border-blue-500/30">
          <h3 className="text-xl font-semibold text-blue-300 mb-3">아키텍처 결정</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-1">Gateway API 표준</div>
              <div className="text-gray-300 text-xs">벤더 중립적, 이식성 확보</div>
            </div>
            <div>
              <div className="text-emerald-400 font-semibold mb-1">Kubernetes 네이티브</div>
              <div className="text-gray-300 text-xs">CRD 기반 선언적 관리</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold mb-1">관측성 우선</div>
              <div className="text-gray-300 text-xs">Prometheus, LangFuse 통합</div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
