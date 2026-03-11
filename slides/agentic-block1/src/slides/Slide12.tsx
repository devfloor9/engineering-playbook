import { SlideWrapper, Card } from '@shared/components';
import { Globe, Shield, Gauge, Filter } from 'lucide-react';

export default function Slide12() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-amber-300">
        Gateway Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        Kgateway + 인증/Rate Limiting
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Globe className="w-10 h-10 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-amber-300">역할: AI 추론 트래픽의 단일 진입점</h3>
              <p className="text-lg text-gray-300">
                Kubernetes Gateway API 기반 인증, 라우팅, Rate Limiting 통합
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Shield className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">인증/인가</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• OIDC/JWT 토큰 검증</li>
              <li>• Cognito/Okta 통합</li>
              <li>• API Key 관리</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Gauge className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">Rate Limiting</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Token Bucket 알고리즘</li>
              <li>• 테넌트별 할당량</li>
              <li>• 요청 속도 제한</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Filter className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">트래픽 라우팅</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• 모델별 라우팅</li>
              <li>• 가중치 기반 분배</li>
              <li>• Canary 배포 지원</li>
            </ul>
          </Card>
        </div>

        <Card className="p-6 bg-amber-900/20 border-amber-700">
          <h4 className="text-xl font-semibold mb-3 text-amber-300">핵심 기능</h4>
          <div className="grid grid-cols-2 gap-4 text-base text-gray-400">
            <div>
              <strong className="text-gray-300">HTTPRoute 설정:</strong>
              <p className="text-sm">헤더 기반 라우팅 (x-model-id)</p>
            </div>
            <div>
              <strong className="text-gray-300">LiteLLM 통합:</strong>
              <p className="text-sm">100+ LLM 프로바이더 추상화</p>
            </div>
            <div>
              <strong className="text-gray-300">고가용성:</strong>
              <p className="text-sm">Multi-replica, Load Balancing</p>
            </div>
            <div>
              <strong className="text-gray-300">관측성:</strong>
              <p className="text-sm">요청 추적 및 메트릭 수집</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
