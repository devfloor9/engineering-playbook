import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Route, Filter } from 'lucide-react';

export default function Slide04() {
  const httpRouteCode = `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: model-header-routing
spec:
  parentRefs:
    - name: ai-inference-gateway
  rules:
    # GPT-4 모델 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "gpt-4"
      backendRefs:
        - name: vllm-gpt4-service
          port: 8000
          weight: 100

    # Claude-3 모델 라우팅
    - matches:
        - path:
            type: PathPrefix
            value: /v1/chat/completions
          headers:
            - name: x-model-id
              value: "claude-3"
      backendRefs:
        - name: vllm-claude3-service
          port: 8000
          weight: 100`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-cyan-400">동적 라우팅</h2>
        <p className="text-xl text-gray-300 mb-6">헤더/경로 기반 모델 라우팅</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-5">
            <Route className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-3 text-blue-300">헤더 기반 라우팅</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <span className="font-mono text-cyan-400">x-model-id</span> 헤더로 모델 선택</li>
              <li>• <span className="font-mono text-cyan-400">x-customer-tier</span> 헤더로 우선순위 지정</li>
              <li>• 복합 조건 매칭 지원</li>
              <li>• 프리미엄/일반 백엔드 분리</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Filter className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-3 text-emerald-300">경로 기반 라우팅</h4>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <span className="font-mono text-emerald-400">/v1/chat/completions</span> {"→"} Chat 서비스</li>
              <li>• <span className="font-mono text-emerald-400">/v1/embeddings</span> {"→"} Embedding 서비스</li>
              <li>• <span className="font-mono text-emerald-400">/v1/completions</span> {"→"} Legacy 서비스</li>
              <li>• PathPrefix/Exact 매칭 옵션</li>
            </ul>
          </Card>
        </div>

        <CodeBlock
          code={httpRouteCode}
          language="yaml"
          title="HTTPRoute 설정 예시"
        />

        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
          <p className="text-sm text-cyan-300">
            <span className="font-semibold">유연한 라우팅:</span> 헤더, 경로, 메서드, 쿼리 파라미터 등 다양한 조건으로 라우팅 규칙 정의 가능
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
