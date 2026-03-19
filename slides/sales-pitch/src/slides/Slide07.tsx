import { SlideWrapper, Card, Badge } from '@shared/components';
import { Bot, Settings, GitBranch, ArrowDown } from 'lucide-react';

export default function Slide07() {
  return (
    <SlideWrapper>
      <div className="flex items-center gap-4 mb-4">
        <Badge color="emerald" size="lg" className="text-2xl px-5 py-2">기둥 2</Badge>
        <h2 className="text-5xl font-bold text-emerald-300">AgentOps</h2>
      </div>
      <p className="text-xl text-gray-400 mb-4">
        잘 구축된 컨테이너 인프라 위에서 AI 에이전트 운영 체계를 구축합니다
      </p>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-600/30">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="bg-rose-500/10 rounded-xl px-6 py-4 border border-rose-500/30 mb-2">
                <p className="text-4xl font-bold text-rose-300">15+ Pod</p>
                <p className="text-sm text-gray-400">셀프 호스팅</p>
              </div>
              <p className="text-sm text-gray-500">LLM, Vector DB, Gateway, Cache, Monitor...</p>
            </div>
            <ArrowDown className="w-14 h-14 text-emerald-400 rotate-[-90deg]" />
            <div className="text-center">
              <div className="bg-emerald-500/10 rounded-xl px-6 py-4 border border-emerald-500/30 mb-2">
                <p className="text-4xl font-bold text-emerald-300">AgentCore</p>
                <p className="text-sm text-gray-400">매니지드 서비스</p>
              </div>
              <p className="text-sm text-gray-500">Bedrock AgentCore + MCP 통합</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card color="emerald" className="p-5">
            <Bot className="w-12 h-12 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Bedrock AgentCore</h4>
            <p className="text-sm text-gray-300">
              에이전트 런타임, 메모리, 도구 호출을 매니지드로 제공. MCP 프로토콜 네이티브 지원
            </p>
          </Card>

          <Card color="cyan" className="p-5">
            <Settings className="w-12 h-12 text-cyan-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-cyan-300">DevOps → AgentOps</h4>
            <p className="text-sm text-gray-300">
              CI/CD, 모니터링, 스케일링 — 기존 DevOps 역량을 AI 에이전트 운영으로 자연스럽게 확장
            </p>
          </Card>

          <Card color="blue" className="p-5">
            <GitBranch className="w-12 h-12 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">AI 도구 연계</h4>
            <p className="text-sm text-gray-300">
              Kiro 등 AI 개발 도구와 연계하여 자연어 기반 인프라 자동화 및 에이전트 개발 가속
            </p>
          </Card>
        </div>

        <div className="bg-emerald-500/20 rounded-xl px-8 py-4 border-2 border-emerald-400/60 text-center" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)'}}>
          <p className="text-2xl font-bold text-white">
            셀프 호스팅 15+ Pod → AgentCore 매니지드 = 운영 복잡도 <span className="text-emerald-300">80%</span> 감소
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
