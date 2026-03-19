import { SlideWrapper, CompareTable } from '@shared/components';
import { GitBranch } from 'lucide-react';

export default function Slide17() {
  const comparison = [
    {
      category: "워크로드",
      kagent: "코어 에이전트 (AICC, 복잡 워크플로우)",
      agentcore: "MCP Gateway, A2A Hub, AG-UI, 경량 에이전트"
    },
    {
      category: "추론 엔진",
      kagent: "vLLM + llm-d (GPU 직접 제어)",
      agentcore: "Bedrock 모델 (서버리스)"
    },
    {
      category: "데이터",
      kagent: "Knowledge Feature Store (Neo4j, Milvus)",
      agentcore: "Managed Memory (세션 컨텍스트)"
    },
    {
      category: "Guardrails",
      kagent: "NeMo Guardrails (커스텀)",
      agentcore: "Bedrock Guardrails (관리형)"
    },
    {
      category: "관측성",
      kagent: "Langfuse (self-hosted, 데이터 주권)",
      agentcore: "CloudWatch Gen AI"
    },
    {
      category: "프로토콜",
      kagent: "MCP/A2A 자체 구현",
      agentcore: "MCP/A2A/AG-UI 관리형 런타임"
    },
    {
      category: "스케일링",
      kagent: "HPA/KEDA + Karpenter",
      agentcore: "서버리스 자동 (무한 확장)"
    },
    {
      category: "적합 시나리오",
      kagent: "GPU 제어, 데이터 주권, 온톨로지 통합",
      agentcore: "프로토콜 서비스, 경량 에이전트, 빠른 확장"
    }
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="w-12 h-12 text-purple-400" />
          <div>
            <h2 className="text-5xl font-bold text-purple-400">EKS + AgentCore 하이브리드</h2>
            <p className="text-xl text-gray-300">역할 분리 기반 하이브리드 전략</p>
          </div>
        </div>

        <CompareTable
          data={comparison}
          leftHeader="EKS (Kagent)"
          rightHeader="AgentCore (Managed)"
        />

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="p-5 bg-gray-800/50 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">EKS 담당 (GPU + 데이터 주권)</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• LLM 추론 (vLLM + llm-d, KV Cache 최적화)</li>
              <li>• 코어 에이전트 (AICC, 복잡 워크플로우)</li>
              <li>• Knowledge Feature Store (Neo4j + Milvus)</li>
              <li>• 커스텀 NeMo Guardrails</li>
            </ul>
          </div>

          <div className="p-5 bg-gray-800/50 rounded-lg border border-orange-500/30">
            <h4 className="text-lg font-semibold text-orange-300 mb-3">AgentCore 담당 (관리형 서비스)</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• MCP Gateway (Stateful, 인증 내장)</li>
              <li>• A2A Hub (에이전트 검색/위임)</li>
              <li>• AG-UI Proxy (SSE/WebSocket 스트리밍)</li>
              <li>• 경량 FAQ/라우팅 에이전트 (서버리스)</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
