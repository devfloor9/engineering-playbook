import { SlideWrapper, CompareTable } from '@shared/components';
import { GitBranch } from 'lucide-react';

export default function Slide17() {
  const comparison = [
    {
      category: "배포 모델",
      kagent: "Self-hosted (EKS)",
      agentcore: "완전 관리형 (Serverless)"
    },
    {
      category: "운영 복잡도",
      kagent: "높음 (직접 관리)",
      agentcore: "낮음 (AWS 관리)"
    },
    {
      category: "비용 구조",
      kagent: "인프라 비용 (Pod, Node)",
      agentcore: "사용량 기반 과금"
    },
    {
      category: "커스터마이징",
      kagent: "높음 (완전 제어)",
      agentcore: "제한적 (AWS 정책)"
    },
    {
      category: "모델 선택",
      kagent: "제한 없음 (vLLM, TGI)",
      agentcore: "Bedrock 모델만"
    },
    {
      category: "스케일링",
      kagent: "HPA/KEDA (수동 설정)",
      agentcore: "자동 (무한 확장)"
    },
    {
      category: "관측성",
      kagent: "LangFuse/Prometheus",
      agentcore: "CloudWatch Gen AI"
    },
    {
      category: "적합 시나리오",
      kagent: "높은 제어, 커스텀 모델",
      agentcore: "빠른 프로토타입, 운영 간소화"
    }
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="w-12 h-12 text-purple-400" />
          <div>
            <h2 className="text-5xl font-bold text-purple-400">Kagent vs AgentCore</h2>
            <p className="text-xl text-gray-300">하이브리드 접근 전략 비교</p>
          </div>
        </div>

        <CompareTable
          data={comparison}
          leftHeader="Kagent (Self-hosted)"
          rightHeader="Bedrock AgentCore (Managed)"
        />

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="p-5 bg-gray-800/50 rounded-lg border border-blue-500/30">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">Kagent 선택 시</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• 커스텀 모델 (오픈소스 LLM) 사용 필요</li>
              <li>• 완전한 인프라 제어 요구</li>
              <li>• 비용 최적화 (고빈도 호출)</li>
              <li>• 데이터 주권 및 프라이빗 배포</li>
            </ul>
          </div>

          <div className="p-5 bg-gray-800/50 rounded-lg border border-orange-500/30">
            <h4 className="text-lg font-semibold text-orange-300 mb-3">AgentCore 선택 시</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• 빠른 프로토타입 및 MVP 구축</li>
              <li>• 운영 부담 최소화</li>
              <li>• 서버리스 오토스케일링 필요</li>
              <li>• Bedrock 모델 품질 충분</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-5 bg-gray-800/50 rounded-lg border border-purple-500/30">
          <h4 className="text-lg font-semibold text-purple-300 mb-3">하이브리드 전략 (권장)</h4>
          <p className="text-sm text-gray-300 mb-2">
            비용이 중요한 고빈도 호출은 <span className="text-blue-400 font-semibold">Kagent + vLLM</span>으로,
            복잡한 추론이 필요한 저빈도 호출은 <span className="text-orange-400 font-semibold">Bedrock AgentCore</span>로 라우팅
          </p>
          <div className="mt-3 p-3 bg-gray-800/50 rounded text-xs font-mono text-gray-300">
            Kgateway {"→"} 헤더 기반 라우팅 {"→"} Kagent (90%) / AgentCore (10%)
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
