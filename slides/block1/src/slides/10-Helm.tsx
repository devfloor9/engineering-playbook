import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Box } from 'lucide-react';

export default function HelmSlide() {
  const helmAppCode = `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: prometheus
spec:
  source:
    repoURL: https://prometheus-community.github.io/helm-charts
    chart: prometheus
    targetRevision: 15.10.0
    helm:
      releaseName: prometheus
      values: |
        server:
          retention: 30d
        alertmanager:
          enabled: true`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <Box className="w-10 h-10 text-cyan-400" />
        Helm Chart 관리 전략
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold text-cyan-400 mb-4">ArgoCD + Helm 통합</h3>
          <CodeBlock code={helmAppCode} language="yaml" title="helm-application.yaml" />
        </div>

        <div className="space-y-4">
          <Card title="Helm Chart 소스" color="blue">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• Public Helm Repository (artifact hub)</li>
              <li>• Private OCI Registry (ECR)</li>
              <li>• Git Repository (Chart.yaml)</li>
            </ul>
          </Card>

          <Card title="Values 오버라이드" color="emerald">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• Inline values (Application에 직접)</li>
              <li>• Values 파일 (Git에서 참조)</li>
              <li>• 환경별 values-{'{env}'}.yaml</li>
            </ul>
          </Card>

          <Card title="버전 관리" color="amber">
            <ul className="text-sm space-y-2 text-gray-400">
              <li>• targetRevision으로 버전 고정</li>
              <li>• Semantic Versioning 준수</li>
              <li>• Renovate Bot으로 자동 PR</li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-purple-400 font-bold mb-2">권장 패턴</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <strong className="text-white">Public Charts:</strong> ArgoCD Application으로 직접 참조
          </div>
          <div>
            <strong className="text-white">Custom Charts:</strong> Git에 저장하고 Kustomize와 조합
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
