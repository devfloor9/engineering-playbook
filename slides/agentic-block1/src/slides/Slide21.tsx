import { SlideWrapper, Card } from '@shared/components';
import { GitBranch, Shield, Gauge, DollarSign } from 'lucide-react';

export default function Slide21() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-purple-300">
        환경 분리 전략
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        Production vs Staging/Dev
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6 bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-700">
            <h4 className="text-2xl font-semibold mb-4 text-red-300">Production</h4>
            <ul className="text-base text-gray-300 space-y-3">
              <li className="flex items-start gap-2">
                <GitBranch className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span><strong>EKS Cluster:</strong> Dedicated (독립 클러스터)</span>
              </li>
              <li className="flex items-start gap-2">
                <Gauge className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <span><strong>Observability:</strong> Langfuse (Self-hosted)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span><strong>GPU:</strong> Full H100/L40s</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>Ingress:</strong> CloudFront → WAF → NLB → kgateway</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span><strong>Guardrails:</strong> NeMo 강제 적용</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Cost Tracking:</strong> Bifrost 계층적 추적</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700">
            <h4 className="text-2xl font-semibold mb-4 text-blue-300">Staging/Dev</h4>
            <ul className="text-base text-gray-300 space-y-3">
              <li className="flex items-start gap-2">
                <GitBranch className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span><strong>EKS Cluster:</strong> Shared (공유 클러스터)</span>
              </li>
              <li className="flex items-start gap-2">
                <Gauge className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span><strong>Observability:</strong> LangSmith (LangGraph Studio)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <span><strong>GPU:</strong> Reduced, Spot 인스턴스</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span><strong>Ingress:</strong> NLB → kgateway (WAF 선택)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span><strong>Guardrails:</strong> Optional</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
                <span><strong>Cost Tracking:</strong> Basic</span>
              </li>
            </ul>
          </Card>
        </div>

        <Card color="purple" className="p-5">
          <h4 className="text-xl font-semibold mb-3 text-purple-300">핵심 차이점</h4>
          <div className="grid grid-cols-3 gap-4 text-base text-gray-300">
            <div>
              <strong className="text-gray-300">리소스 격리:</strong>
              <p className="text-sm text-gray-400">Prod는 독립 클러스터로 워크로드 간섭 방지</p>
            </div>
            <div>
              <strong className="text-gray-300">비용 최적화:</strong>
              <p className="text-sm text-gray-400">Dev/Staging은 Spot + 공유로 50-70% 절감</p>
            </div>
            <div>
              <strong className="text-gray-300">관측성 도구:</strong>
              <p className="text-sm text-gray-400">환경 특성에 맞춘 최적 도구 선택</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
