import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Wrench, Database, Code } from 'lucide-react';

export default function Slide10() {
  const toolCRDCode = `apiVersion: kagent.dev/v1alpha1
kind: Tool
metadata:
  name: search-knowledge-base
  labels:
    category: retrieval
spec:
  type: retrieval
  displayName: "지식 베이스 검색"
  description: |
    회사의 지식 베이스에서 관련 문서를 검색합니다.

  # Retrieval 설정
  retrieval:
    vectorStore:
      type: milvus
      host: milvus-proxy.ai-data.svc.cluster.local
      port: 19530
      collection: support-knowledge
    embedding:
      provider: openai
      model: text-embedding-3-small
    search:
      topK: 5
      scoreThreshold: 0.7

  # 입력 파라미터
  parameters:
    - name: query
      type: string
      required: true
      description: "검색할 질문 또는 키워드"`;

  const apiToolCode = `apiVersion: kagent.dev/v1alpha1
kind: Tool
metadata:
  name: create-ticket
  labels:
    category: api
spec:
  type: api
  displayName: "티켓 생성"

  # API 설정
  api:
    endpoint: http://ticketing-service/api/v1/tickets
    method: POST
    timeout: 30s
    authentication:
      type: bearer
      secretRef:
        name: ticketing-api-token

  parameters:
    - name: title
      type: string
      required: true
    - name: priority
      type: string
      enum: ["low", "medium", "high"]`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-purple-400">Tool Registry</h2>
        <p className="text-xl text-gray-400 mb-6">CRD 기반 도구 관리</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <Database className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">Retrieval</h4>
            <p className="text-sm text-gray-400 mb-2">벡터 DB 기반 검색</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Milvus 벡터 스토어</li>
              <li>• 임베딩 모델 설정</li>
              <li>• topK, 임계값 조정</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Wrench className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">API</h4>
            <p className="text-sm text-gray-400 mb-2">외부 서비스 호출</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• REST API 엔드포인트</li>
              <li>• 인증 (Bearer, API Key)</li>
              <li>• 재시도 및 타임아웃</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Code className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">Code</h4>
            <p className="text-sm text-gray-400 mb-2">코드 실행 도구</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Python/JavaScript 실행</li>
              <li>• 샌드박스 환경</li>
              <li>• 의존성 관리</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <CodeBlock
            code={toolCRDCode}
            language="yaml"
            title="Retrieval Tool 예시"
          />
          <CodeBlock
            code={apiToolCode}
            language="yaml"
            title="API Tool 예시"
          />
        </div>

        <div className="mt-4 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
          <p className="text-sm text-purple-300">
            <span className="font-semibold">중앙 관리:</span> Tool CRD로 도구를 정의하면 여러 에이전트가 재사용 가능하며, 버전 관리와 접근 제어가 용이
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
