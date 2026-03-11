import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { FileCode } from 'lucide-react';

export default function ApplicationSlide() {
  const appCode = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo
    targetRevision: HEAD
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <FileCode className="w-10 h-10 text-cyan-400" />
        ArgoCD Application 구조
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <CodeBlock code={appCode} language="yaml" title="application.yaml" />
        </div>

        <div className="space-y-4">
          <Card title="Source" color="blue">
            <p className="text-xs mb-2">Git 저장소 위치 정의</p>
            <ul className="text-xs space-y-1 text-gray-400">
              <li>• repoURL: Git 저장소 URL</li>
              <li>• targetRevision: 브랜치/태그</li>
              <li>• path: 매니페스트 경로</li>
            </ul>
          </Card>

          <Card title="Destination" color="emerald">
            <p className="text-xs mb-2">배포 대상 클러스터 정의</p>
            <ul className="text-xs space-y-1 text-gray-400">
              <li>• server: 클러스터 API 엔드포인트</li>
              <li>• namespace: 배포할 네임스페이스</li>
            </ul>
          </Card>

          <Card title="SyncPolicy" color="amber">
            <p className="text-xs mb-2">동기화 정책 설정</p>
            <ul className="text-xs space-y-1 text-gray-400">
              <li>• automated: 자동 동기화 활성화</li>
              <li>• prune: 삭제된 리소스 정리</li>
              <li>• selfHeal: Drift 자동 복구</li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-purple-400 font-bold mb-2 text-sm">Application = 배포 단위</h3>
        <p className="text-xs text-gray-400">
          하나의 Application은 하나의 마이크로서비스, Helm 차트, 또는 인프라 컴포넌트를 나타냅니다.
          멀티클러스터 배포는 ApplicationSets로 확장됩니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
