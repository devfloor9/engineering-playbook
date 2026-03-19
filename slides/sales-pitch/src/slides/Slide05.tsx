import { SlideWrapper, Card } from '@shared/components';
import { Server, Bot, ArrowRightLeft } from 'lucide-react';

export default function Slide05() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
        AWS 비전: Agentic AI 시대의 인프라 뉴노멀
      </h2>
      <p className="text-xl text-gray-400 text-center mb-6">
        클라우드 네이티브 인프라가 탄탄해야 AI 에이전트도 제대로 작동합니다
      </p>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <Card color="blue" className="p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/20 rounded-full p-3">
                <Server className="w-12 h-12 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-400 font-semibold">기둥 1</p>
                <h4 className="text-2xl font-bold text-blue-300">Cloud Native LLMOps</h4>
              </div>
            </div>
            <ul className="text-base text-gray-300 space-y-2 flex-1">
              <li>EKS + GPU Operator + run.ai</li>
              <li>vLLM + llm-d 모델 서빙</li>
              <li>MIG/DRA + Karpenter 최적화</li>
              <li>비용 최적화 & 운영 안정성</li>
            </ul>
            <div className="mt-4 bg-blue-500/10 rounded-lg px-3 py-2 border border-blue-500/20">
              <p className="text-sm text-blue-300">50 req/s 기준 월 $4,900</p>
            </div>
          </Card>

          <Card color="emerald" className="p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-500/20 rounded-full p-3">
                <Bot className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-400 font-semibold">기둥 2</p>
                <h4 className="text-2xl font-bold text-emerald-300">AgentOps</h4>
              </div>
            </div>
            <ul className="text-base text-gray-300 space-y-2 flex-1">
              <li>Bedrock AgentCore 런타임</li>
              <li>Hosted MCP 서버</li>
              <li>DevOps Agent (매니지드)</li>
              <li>매니지드 에이전트 생태계</li>
            </ul>
            <div className="mt-4 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
              <p className="text-sm text-emerald-300">운영 복잡도 80% 감소</p>
            </div>
          </Card>

          <Card color="purple" className="p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-500/20 rounded-full p-3">
                <ArrowRightLeft className="w-12 h-12 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-purple-400 font-semibold">기둥 3</p>
                <h4 className="text-2xl font-bold text-purple-300">하이브리드 & 마이그레이션</h4>
              </div>
            </div>
            <ul className="text-base text-gray-300 space-y-2 flex-1">
              <li>VMware → AWS 마이그레이션</li>
              <li>Hybrid Nodes 통합 관리</li>
              <li>AWS Transform 어세스먼트</li>
              <li>레거시 → AI-ready 전환</li>
            </ul>
            <div className="mt-4 bg-purple-500/10 rounded-lg px-3 py-2 border border-purple-500/20">
              <p className="text-sm text-purple-300">TCO 40-60% 절감</p>
            </div>
          </Card>
        </div>

        <div className="rounded-xl px-8 py-4 border-2 border-white/20 text-center" style={{background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(16,185,129,0.15), rgba(139,92,246,0.15))', boxShadow: '0 0 40px rgba(99, 102, 241, 0.15)'}}>
          <p className="text-lg text-white font-semibold">
            <span className="text-blue-300 font-bold">EKS 기반 LLMOps</span> +{' '}
            <span className="text-emerald-300 font-bold">매니지드 에이전트(AgentCore + Hosted MCP)</span> +{' '}
            <span className="text-purple-300 font-bold">마이그레이션(Transform)</span> 통합 경로
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
