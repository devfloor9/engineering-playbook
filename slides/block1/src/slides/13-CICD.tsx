import { SlideWrapper, FlowDiagram } from '@shared/components';
import { GitPullRequest } from 'lucide-react';

export default function CICDSlide() {
  const nodes = [
    { id: 'dev', label: 'Developer', x: 50, y: 100, width: 100, height: 50, color: 'blue' },
    { id: 'ci', label: 'CI Pipeline', x: 200, y: 100, width: 120, height: 50, color: 'emerald', description: 'Build & Test' },
    { id: 'registry', label: 'Container Registry', x: 380, y: 100, width: 160, height: 50, color: 'amber', description: 'ECR' },
    { id: 'gitops', label: 'GitOps Repo', x: 600, y: 100, width: 130, height: 50, color: 'purple' },
    { id: 'argocd', label: 'ArgoCD', x: 380, y: 200, width: 100, height: 50, color: 'cyan' },
    { id: 'eks', label: 'EKS', x: 600, y: 200, width: 80, height: 50, color: 'rose' },
  ];

  const edges = [
    { from: 'dev', to: 'ci', label: '1. Push Code', color: 'blue' },
    { from: 'ci', to: 'registry', label: '2. Build Image', color: 'emerald' },
    { from: 'ci', to: 'gitops', label: '3. Update Tag', color: 'purple' },
    { from: 'gitops', to: 'argocd', label: '4. Webhook', color: 'purple', style: 'dashed' as const },
    { from: 'argocd', to: 'eks', label: '5. Deploy', color: 'cyan' },
    { from: 'argocd', to: 'registry', label: '6. Pull Image', color: 'amber', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <GitPullRequest className="w-10 h-10 text-blue-400" />
        CI/CD 파이프라인 통합
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={300} />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-900 rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-blue-400 font-bold mb-4">CI 파이프라인 역할</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">1.</span>
              <div>
                <strong className="text-white">Code → Image:</strong> 애플리케이션 빌드 및 컨테이너 이미지 생성
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">2.</span>
              <div>
                <strong className="text-white">Test:</strong> 유닛/통합 테스트 실행
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">3.</span>
              <div>
                <strong className="text-white">Security Scan:</strong> 이미지 취약점 스캔 (Trivy, Snyk)
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">4.</span>
              <div>
                <strong className="text-white">Push:</strong> ECR에 이미지 푸시
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">5.</span>
              <div>
                <strong className="text-white">Update GitOps:</strong> 매니페스트의 이미지 태그 업데이트
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-emerald-500/30">
          <h3 className="text-emerald-400 font-bold mb-4">CD (ArgoCD) 역할</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">1.</span>
              <div>
                <strong className="text-white">Watch Git:</strong> GitOps 저장소 변경 감지
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">2.</span>
              <div>
                <strong className="text-white">Sync:</strong> 선언된 상태를 클러스터에 적용
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">3.</span>
              <div>
                <strong className="text-white">Health Check:</strong> 배포 상태 모니터링
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">4.</span>
              <div>
                <strong className="text-white">Rollback:</strong> 실패 시 자동 롤백
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">5.</span>
              <div>
                <strong className="text-white">Multi-cluster:</strong> 여러 환경에 동시 배포
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        책임 분리: CI는 빌드/테스트, CD(ArgoCD)는 배포/동기화
      </div>
    </SlideWrapper>
  );
}
