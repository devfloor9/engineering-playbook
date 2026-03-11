import { SlideWrapper, Card } from '@shared/components';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';

export default function AddonsSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <Package className="w-10 h-10 text-purple-400" />
        클러스터 애드온 관리
      </h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="Core Addons (EKS 필수)" icon={<CheckCircle className="w-6 h-6" />} color="blue">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              <span>CoreDNS (DNS 해석)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              <span>kube-proxy (네트워킹)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              <span>VPC CNI (AWS VPC 통합)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              <span>EBS CSI Driver (영구 스토리지)</span>
            </li>
          </ul>
        </Card>

        <Card title="Platform Addons (운영)" icon={<Package className="w-6 h-6" />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">•</span>
              <span>AWS Load Balancer Controller</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">•</span>
              <span>External Secrets Operator</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">•</span>
              <span>Metrics Server</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">•</span>
              <span>Cert-Manager</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Addon 관리 전략</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-amber-400 font-bold mb-2">1. 버전 고정</div>
            <p className="text-gray-400 text-xs">
              특정 버전 명시로 예기치 않은 업그레이드 방지
            </p>
          </div>
          <div>
            <div className="text-amber-400 font-bold mb-2">2. 자동화 테스트</div>
            <p className="text-gray-400 text-xs">
              Dev 환경에서 버전 검증 후 단계적 롤아웃
            </p>
          </div>
          <div>
            <div className="text-amber-400 font-bold mb-2">3. Blue/Green</div>
            <p className="text-gray-400 text-xs">
              새 클러스터에서 테스트 후 트래픽 전환
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>주의:</strong> CoreDNS, kube-proxy 버전은 Kubernetes 버전과 호환성 필수 확인
        </p>
      </div>
    </SlideWrapper>
  );
}
