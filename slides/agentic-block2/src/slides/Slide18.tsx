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
                <Badge color="blue" size="lg">2-Tier GW</Badge>
                <p className="text-sm text-gray-300">
                  Kgateway (인증/라우팅) + Bifrost (LLM 통합/비용 추적) 분리 설계
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="emerald" size="lg">Agent</Badge>
                <p className="text-sm text-gray-300">
                  Kagent CRD로 에이전트 선언적 관리, 멀티 에이전트 오케스트레이션
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="cyan" size="lg">Protocols</Badge>
                <p className="text-sm text-gray-300">
                  MCP (도구 연결) + A2A (에이전트 통신) + AG-UI (프론트엔드 스트리밍)
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="purple" size="lg">Vector DB</Badge>
                <p className="text-sm text-gray-300">
                  Milvus 분산 아키텍처로 대규모 RAG, Knowledge Feature Store 통합
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Badge color="orange" size="lg">Hybrid</Badge>
                <p className="text-sm text-gray-300">
                  EKS (GPU/데이터 주권) + AgentCore (관리형 MCP/A2A/AG-UI) 하이브리드
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
                <h4 className="text-sm font-semibold text-blue-300 mb-2">Bifrost 고가용성</h4>
                <p className="text-xs text-gray-300">
                  Fallback 체인, Retry, 서킷 브레이커로 LLM 게이트웨이 HA 확보
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-emerald-500/30">
                <h4 className="text-sm font-semibold text-emerald-300 mb-2">AgentCore 프로덕션 적용</h4>
                <p className="text-xs text-gray-300">
                  MCP Gateway + A2A Hub으로 에이전트 간 협업 자동화
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">Hybrid Observability</h4>
                <p className="text-xs text-gray-300">
                  Prod: Langfuse (데이터 주권), Dev: LangSmith (LangGraph Studio 연동)
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Knowledge Feature Store</h4>
                <p className="text-xs text-gray-300">
                  Vector RAG + GraphRAG (Neo4j)로 온톨로지 기반 지식 검색 고도화
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="p-6 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-cyan-900/30 rounded-xl border border-blue-500/30">
          <h3 className="text-xl font-semibold text-blue-300 mb-3">아키텍처 결정</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-400 font-semibold mb-1">2-Tier Gateway</div>
              <div className="text-gray-300 text-xs">인증/라우팅과 LLM 통합 관심사 분리</div>
            </div>
            <div>
              <div className="text-emerald-400 font-semibold mb-1">표준 프로토콜</div>
              <div className="text-gray-300 text-xs">MCP + A2A + AG-UI로 확장성 확보</div>
            </div>
            <div>
              <div className="text-purple-400 font-semibold mb-1">하이브리드 전략</div>
              <div className="text-gray-300 text-xs">EKS 코어 + AgentCore 관리형 서비스</div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
