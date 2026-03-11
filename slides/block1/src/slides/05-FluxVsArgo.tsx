import { SlideWrapper, CompareTable } from '@shared/components';
import { Scale } from 'lucide-react';

export default function FluxVsArgoSlide() {
  const headers = ['항목', 'Flux CD', 'ArgoCD', 'EKS Capability'];
  const rows = [
    ['아키텍처', 'Pull-only', 'Pull-only', 'AWS 관리형 Pull'],
    ['UI', '없음 (CLI만)', 'Web UI 제공', 'AWS Console 통합'],
    ['멀티클러스터', 'Kustomize 활용', 'ApplicationSets', 'Hub-and-Spoke 네이티브'],
    ['Helm 지원', '네이티브', '네이티브', '네이티브 + ECR 통합'],
    ['설치 복잡도', '낮음', '중간', '제로 (완전 관리형)'],
    ['HA 구성', '직접 설정', '직접 설정 (Redis)', '자동 (Multi-AZ)'],
    ['인증', 'Git provider', 'Dex, OIDC', 'AWS Identity Center'],
    ['Secret 관리', 'SOPS, Sealed', 'ESO, Vault', 'Secrets Manager 네이티브'],
    ['Progressive Delivery', 'Flagger', 'Argo Rollouts', 'Argo Rollouts 지원'],
    ['커뮤니티', 'CNCF', 'CNCF', 'AWS + CNCF'],
    ['비용', '무료 (리소스)', '무료 (리소스)', 'Capability 요금'],
    ['권장 사용처', '간단한 구조', '대규모 멀티클러스터', 'AWS 중심 환경'],
  ];

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <Scale className="w-10 h-10 text-purple-400" />
        Flux vs ArgoCD vs EKS Capability 비교
      </h1>

      <CompareTable headers={headers} rows={rows} highlightCol={3} />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-900 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-blue-400 font-bold mb-2 text-sm">Flux 선택 시</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• CLI 중심 워크플로우</li>
            <li>• Kustomize 선호</li>
            <li>• 작은 팀, 단순 구조</li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-emerald-500/30">
          <h3 className="text-emerald-400 font-bold mb-2 text-sm">Self-managed ArgoCD 선택 시</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Web UI 필요</li>
            <li>• 멀티클러스터 확장</li>
            <li>• 완전한 커스터마이징</li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-amber-500/30">
          <h3 className="text-amber-400 font-bold mb-2 text-sm">EKS Capability 선택 시 (권장)</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 운영 오버헤드 제로</li>
            <li>• AWS 네이티브 통합</li>
            <li>• 프로덕션 HA 자동</li>
          </ul>
        </div>
      </div>
    </SlideWrapper>
  );
}
