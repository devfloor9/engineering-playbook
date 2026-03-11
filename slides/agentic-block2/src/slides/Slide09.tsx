import { SlideWrapper, CodeBlock } from '@shared/components';
import { FileCode } from 'lucide-react';

export default function Slide09() {
  const agentCRDCode = `apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: customer-support-agent
  namespace: ai-agents
spec:
  displayName: "고객 지원 에이전트"

  # 모델 설정
  model:
    provider: openai
    name: gpt-4-turbo
    temperature: 0.7
    maxTokens: 4096
    apiKeySecretRef:
      name: openai-api-key
      key: api-key

  # 시스템 프롬프트
  systemPrompt: |
    당신은 친절하고 전문적인 고객 지원 에이전트입니다.
    고객 문의에 정확하고 도움이 되는 답변을 제공하세요.

  # 사용할 도구 목록
  tools:
    - name: search-knowledge-base
    - name: create-ticket
    - name: get-customer-info

  # 메모리 설정
  memory:
    type: redis
    config:
      host: redis-master.ai-data.svc.cluster.local
      ttl: 3600

  # 스케일링 설정
  scaling:
    minReplicas: 2
    maxReplicas: 10
    metrics:
      - type: cpu
        target:
          averageUtilization: 70

  # 리소스 제한
  resources:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "1Gi"
      cpu: "500m"`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-3 mb-6">
          <FileCode className="w-12 h-12 text-blue-400" />
          <div>
            <h2 className="text-5xl font-bold text-blue-400">Agent CRD 정의</h2>
            <p className="text-xl text-gray-300">선언적 에이전트 관리</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">모델 설정</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Provider (openai, anthropic, bedrock)</li>
              <li>• 모델 이름 및 파라미터</li>
              <li>• API 키 Secret 참조</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-emerald-500/30">
            <h4 className="text-sm font-semibold text-emerald-300 mb-2">도구 통합</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Tool CRD 참조</li>
              <li>• API/Retrieval/Code 타입</li>
              <li>• 동적 도구 검색</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
            <h4 className="text-sm font-semibold text-purple-300 mb-2">운영 설정</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 자동 스케일링 (HPA/KEDA)</li>
              <li>• 메모리 (Redis/Postgres)</li>
              <li>• 관측성 (LangFuse/CloudWatch)</li>
            </ul>
          </div>
        </div>

        <CodeBlock
          code={agentCRDCode}
          language="yaml"
          title="Agent CRD 예시"
        />

        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
          <p className="text-sm text-cyan-300">
            <span className="font-semibold">선언적 관리:</span> YAML 파일로 에이전트 정의하면 Kagent Controller가 자동으로 Deployment, Service, HPA 등을 생성
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
