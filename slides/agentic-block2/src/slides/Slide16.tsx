import { SlideWrapper, Card } from '@shared/components';
import { Network, Radio, Monitor } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-blue-400">표준 프로토콜: MCP + A2A + AG-UI</h2>
        <p className="text-xl text-gray-300 mb-6">에이전트 확장성을 위한 3대 표준 프로토콜</p>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card color="blue" className="p-6">
            <Network className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-blue-300">MCP</h3>
            <p className="text-xs text-gray-400 mb-3">Model Context Protocol</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-blue-400">도구 연결 표준</p>
              <ul className="space-y-1">
                <li>• 에이전트 ↔ 도구 간 통신</li>
                <li>• 도구 동적 검색 &amp; 등록</li>
                <li>• 컨텍스트 전달 표준화</li>
                <li>• Stateful 세션 관리</li>
              </ul>
            </div>
            <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
              AgentCore: 관리형 MCP Gateway (인증 내장)
            </div>
          </Card>

          <Card color="emerald" className="p-6">
            <Radio className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-emerald-300">A2A</h3>
            <p className="text-xs text-gray-400 mb-3">Agent-to-Agent Protocol</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-emerald-400">에이전트 간 통신</p>
              <ul className="space-y-1">
                <li>• 에이전트 검색 &amp; 발견</li>
                <li>• 프레임워크 무관 위임</li>
                <li>• 태스크 분배 &amp; 결과 수집</li>
                <li>• 능력 기반 라우팅</li>
              </ul>
            </div>
            <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
              AgentCore: 관리형 A2A Hub (discovery/delegation)
            </div>
          </Card>

          <Card color="purple" className="p-6">
            <Monitor className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-purple-300">AG-UI</h3>
            <p className="text-xs text-gray-400 mb-3">Agent-to-Frontend Streaming</p>
            <div className="space-y-2 text-sm text-gray-300">
              <p className="font-semibold text-purple-400">프론트엔드 스트리밍</p>
              <ul className="space-y-1">
                <li>• SSE / WebSocket 지원</li>
                <li>• 실시간 토큰 스트리밍</li>
                <li>• 세션 격리 (microVM)</li>
                <li>• 멀티턴 대화 관리</li>
              </ul>
            </div>
            <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
              AgentCore: 관리형 AG-UI Proxy
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h4 className="text-lg font-semibold mb-3 text-cyan-300">프로토콜 통합 흐름</h4>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="px-3 py-2 bg-purple-900/50 rounded-lg text-purple-300 font-semibold">Frontend (AG-UI)</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-emerald-900/50 rounded-lg text-emerald-300 font-semibold">Agent (A2A)</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-blue-900/50 rounded-lg text-blue-300 font-semibold">Tools (MCP)</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-amber-900/50 rounded-lg text-amber-300 font-semibold">LLM / DB / API</span>
          </div>
        </Card>

        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">설계 원칙:</span> EKS에서 직접 구현하거나 AgentCore 관리형 런타임으로 즉시 활용 가능
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
