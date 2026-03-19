import { SlideWrapper, Card } from '@shared/components';
import { Globe, Shield, Layers, DollarSign } from 'lucide-react';

export default function Slide12() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-amber-300">
        Gateway Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        2-Tier Gateway: Kgateway + Bifrost
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Globe className="w-10 h-10 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-amber-300">2단계 게이트웨이 아키텍처</h3>
              <p className="text-lg text-gray-300">
                Tier 1 Kgateway (인증/라우팅) + Tier 2 Bifrost (LLM 프로바이더 통합/비용 추적)
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Layers className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">Tier 1: Kgateway</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• In-memory JWT 인증 (~µs 지연, IAM Identity Center OIDC)</li>
              <li>• HTTP 라우팅 (헤더/경로 기반)</li>
              <li>• Rate Limiting (Token Bucket)</li>
              <li>• NLB 자동 프로비저닝 (ALB 제거로 50-75% LB 비용 절감)</li>
            </ul>
          </Card>

          <Card className="p-6">
            <DollarSign className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">Tier 2: Bifrost</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Go 기반 LLM 프로바이더 통합 (~11µs 오버헤드 at 5k RPS)</li>
              <li>• Fallback/Retry 로직</li>
              <li>• 계층적 비용 추적 (key/team/customer)</li>
              <li>• 100+ LLM 프로바이더 지원</li>
            </ul>
          </Card>
        </div>

        <Card color="amber" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-amber-300">Ingress 흐름</h4>
          <div className="flex items-center justify-between text-base text-gray-300">
            <div className="text-center">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <strong>CloudFront</strong>
              <p className="text-sm">CDN, DDoS 방어</p>
            </div>
            <div className="text-2xl text-gray-500">→</div>
            <div className="text-center">
              <Shield className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <strong>WAF</strong>
              <p className="text-sm">규칙 기반 필터링</p>
            </div>
            <div className="text-2xl text-gray-500">→</div>
            <div className="text-center">
              <Globe className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <strong>NLB</strong>
              <p className="text-sm">L4 로드밸런싱</p>
            </div>
            <div className="text-2xl text-gray-500">→</div>
            <div className="text-center">
              <Layers className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <strong>Kgateway</strong>
              <p className="text-sm">인증/라우팅</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4 text-center">
            * AWS Shield Advanced로 NLB 보호
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
