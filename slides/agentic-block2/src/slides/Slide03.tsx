import { SlideWrapper, Card } from '@shared/components';
import { Network, Layers, Zap, Shield } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-blue-400">2-Tier Gateway 아키텍처</h2>
        <p className="text-xl text-gray-300 mb-6">Kgateway (인증/라우팅) + Bifrost (LLM 통합) 분리 설계</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card color="blue" className="p-6">
            <Network className="w-10 h-10 text-blue-400 mb-3" />
            <h3 className="text-2xl font-semibold mb-3 text-blue-300">Tier 1: Kgateway</h3>
            <p className="text-sm text-gray-300 mb-3">Kubernetes Gateway API 기반 트래픽 제어</p>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <span className="text-blue-400 font-semibold">In-memory JWT 검증</span> (~µs, IAM Identity Center OIDC)</li>
              <li>• HTTPRoute 기반 모델별 라우팅</li>
              <li>• Rate Limiting (테넌트별 할당량)</li>
              <li>• 가중치 기반 트래픽 분배 (Blue/Green)</li>
            </ul>
          </Card>

          <Card color="emerald" className="p-6">
            <Zap className="w-10 h-10 text-emerald-400 mb-3" />
            <h3 className="text-2xl font-semibold mb-3 text-emerald-300">Tier 2: Bifrost</h3>
            <p className="text-sm text-gray-300 mb-3">Go 기반 고성능 LLM Gateway (~11µs @5k RPS)</p>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>• <span className="text-emerald-400 font-semibold">100+ LLM 프로바이더</span> 통합 (OpenAI 호환)</li>
              <li>• Fallback &amp; Retry (모델 간 자동 전환)</li>
              <li>• 계층적 비용 추적 (key/team/customer)</li>
              <li>• Langfuse 연동 (OpenTelemetry)</li>
            </ul>
          </Card>
        </div>

        <Card className="p-5 mb-4">
          <Layers className="w-8 h-8 text-purple-400 mb-3" />
          <h4 className="text-lg font-semibold mb-3 text-purple-300">Ingress 흐름 (ALB 제거)</h4>
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="px-3 py-2 bg-blue-900/50 rounded-lg text-blue-300 font-semibold">CloudFront</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-red-900/50 rounded-lg text-red-300 font-semibold">WAF</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-amber-900/50 rounded-lg text-amber-300 font-semibold">NLB (auto)</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-blue-900/50 rounded-lg text-blue-300 font-semibold">Kgateway</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-emerald-900/50 rounded-lg text-emerald-300 font-semibold">Bifrost</span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-2 bg-purple-900/50 rounded-lg text-purple-300 font-semibold">vLLM/llm-d</span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
            <Shield className="w-6 h-6 text-blue-400 mb-2" />
            <p className="text-sm text-blue-300">
              <span className="font-semibold">AWS Shield Advanced</span>로 NLB 엔드포인트 DDoS 보호
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-emerald-500/30">
            <p className="text-sm text-emerald-300">
              <span className="font-semibold">LB 비용 50-75% 절감:</span> ALB 제거, NLB는 kgateway Service가 자동 프로비저닝
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
