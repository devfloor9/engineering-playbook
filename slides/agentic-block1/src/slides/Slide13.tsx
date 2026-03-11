import { SlideWrapper, Card } from '@shared/components';
import { Bot, Settings, Package, Workflow } from 'lucide-react';

export default function Slide13() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-emerald-300">
        Agent Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        Kagent Controller + Tool Registry
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Bot className="w-10 h-10 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-emerald-300">역할: AI 에이전트 라이프사이클 관리</h3>
              <p className="text-lg text-gray-300">
                Kubernetes Operator 패턴으로 에이전트 CRD를 선언적으로 정의하고 관리
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Settings className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">Kagent Controller</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Agent CRD 조정 (Reconcile)</li>
              <li>• Deployment/Service 자동 생성</li>
              <li>• HPA 자동 구성</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Package className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">Tool Registry</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Tool CRD로 도구 정의</li>
              <li>• API/Function/Retrieval 유형</li>
              <li>• 에이전트 간 도구 공유</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Workflow className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">Agent Runtime</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 상태 관리 (메모리)</li>
              <li>• 도구 비동기 실행</li>
              <li>• 오류 복구 및 재시도</li>
            </ul>
          </Card>
        </div>

        <Card color="emerald" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-emerald-300">Agent CRD 예시</h4>
          <div className="grid grid-cols-2 gap-4 text-base text-gray-300">
            <div>
              <strong className="text-gray-300">모델 설정:</strong>
              <p className="text-sm">provider, name, temperature, maxTokens</p>
            </div>
            <div>
              <strong className="text-gray-300">도구 연결:</strong>
              <p className="text-sm">Tool CRD 참조 (search, API call 등)</p>
            </div>
            <div>
              <strong className="text-gray-300">메모리 설정:</strong>
              <p className="text-sm">Redis 기반 세션 메모리 (TTL, maxHistory)</p>
            </div>
            <div>
              <strong className="text-gray-300">스케일링:</strong>
              <p className="text-sm">minReplicas, maxReplicas, 리소스 제한</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
