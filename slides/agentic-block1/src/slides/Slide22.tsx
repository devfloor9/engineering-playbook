import { SlideWrapper, Card } from '@shared/components';
import { Cloud, Server, Network } from 'lucide-react';

export default function Slide22() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        EKS + AgentCore 하이브리드 전략
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Network className="w-10 h-10 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-purple-300">역할 분담: 각자의 강점 활용</h3>
              <p className="text-lg text-gray-300">
                EKS는 추론/Core Agent/데이터 담당, AgentCore는 MCP Gateway/A2A/경량 Agent 담당
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700">
            <Server className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-2xl font-semibold mb-3 text-blue-300">EKS 클러스터</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• <strong>LLM Inference:</strong> vLLM + llm-d 분산 추론</li>
              <li>• <strong>Core Agents:</strong> AICC (고객센터), 도메인 전문 Agent</li>
              <li>• <strong>Knowledge Feature Store:</strong> Milvus + Neo4j + Redis</li>
              <li>• <strong>Custom Guardrails:</strong> NeMo Framework</li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700">
            <Cloud className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-2xl font-semibold mb-3 text-purple-300">Bedrock AgentCore</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• <strong>MCP Gateway:</strong> Stateful, 인증 내장</li>
              <li>• <strong>A2A Hub:</strong> Agent-to-Agent 통신</li>
              <li>• <strong>AG-UI Streaming:</strong> 실시간 UI 업데이트</li>
              <li>• <strong>Lightweight Agents:</strong> 서버리스 경량 Agent</li>
            </ul>
          </Card>
        </div>

        <Card color="purple" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-purple-300">표준 프로토콜 기반 통합</h4>
          <div className="grid grid-cols-3 gap-4 text-base text-gray-300">
            <div className="text-center">
              <div className="bg-blue-900/30 rounded-lg p-3 mb-2">
                <strong className="text-blue-300">MCP</strong>
              </div>
              <p className="text-sm text-gray-400">Model Context Protocol</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-900/30 rounded-lg p-3 mb-2">
                <strong className="text-purple-300">A2A</strong>
              </div>
              <p className="text-sm text-gray-400">Agent-to-Agent Protocol</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-900/30 rounded-lg p-3 mb-2">
                <strong className="text-pink-300">AG-UI</strong>
              </div>
              <p className="text-sm text-gray-400">Agent-UI Protocol</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
