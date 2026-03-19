import { SlideWrapper, Card } from '@shared/components';
import { Cloud, Network, Zap, Radio } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-orange-400">Bedrock AgentCore</h2>
        <p className="text-xl text-gray-300 mb-6">EKS를 보완하는 관리형 에이전트 서비스 레이어</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card color="orange" className="p-6">
            <Cloud className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-orange-300">EKS + AgentCore 하이브리드</h3>
            <p className="text-gray-300 mb-3">
              핵심 추론은 EKS, 관리형 서비스는 AgentCore로 역할 분리
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <span className="text-blue-400 font-semibold">EKS:</span> LLM 추론, 코어 에이전트, Knowledge Feature Store</li>
              <li>• <span className="text-orange-400 font-semibold">AgentCore:</span> MCP Gateway, A2A Hub, AG-UI, 경량 에이전트</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Network className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-blue-300">AgentCore 핵심 기능</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-sm font-semibold text-orange-400 mb-1">MCP Gateway (Stateful)</div>
                <div className="text-xs text-gray-300">인증 내장, 장기 세션 관리, 외부 도구 연결</div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-sm font-semibold text-blue-400 mb-1">A2A Hub</div>
                <div className="text-xs text-gray-300">에이전트 검색/발견, 프레임워크 무관 위임</div>
              </div>
              <div className="p-3 bg-gray-800/50 rounded">
                <div className="text-sm font-semibold text-emerald-400 mb-1">AG-UI Proxy</div>
                <div className="text-xs text-gray-300">SSE/WebSocket 스트리밍, 세션 격리 (microVM)</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Zap className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">경량 에이전트</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 서버리스 실행 (zero ops)</li>
              <li>• FAQ, 라우팅 에이전트</li>
              <li>• 자동 스케일링</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Radio className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">Managed Memory</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 세션 컨텍스트 자동 관리</li>
              <li>• 장기 대화 지속</li>
              <li>• microVM 격리</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Cloud className="w-8 h-8 text-cyan-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-cyan-300">관측성</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• CloudWatch Gen AI 통합</li>
              <li>• 엔드투엔드 트레이싱</li>
              <li>• 토큰 사용량 추적</li>
            </ul>
          </Card>
        </div>

        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-orange-500/30">
          <p className="text-sm text-orange-300">
            <span className="font-semibold">핵심 원칙:</span> GPU 제어와 데이터 주권이 필요한 워크로드는 EKS, 관리형 프로토콜 서비스는 AgentCore
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
