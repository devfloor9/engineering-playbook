import { SlideWrapper, CodeBlock } from '@shared/components';
import { Layers } from 'lucide-react';

export default function KustomizeSlide() {
  const baseCode = `# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
commonLabels:
  app: my-app`;

  const overlayCode = `# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
  - ../../base
patchesStrategicMerge:
  - replica-patch.yaml
configMapGenerator:
  - name: env-config
    literals:
      - ENV=production
      - LOG_LEVEL=info`;

  const patchCode = `# overlays/production/replica-patch.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 10`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-4">
        <Layers className="w-10 h-10 text-orange-400" />
        Kustomize 오버레이 패턴
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-2">Base (공통)</h3>
          <CodeBlock code={baseCode} language="yaml" title="base/kustomization.yaml" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-emerald-400 mb-2">Overlay (환경별)</h3>
          <CodeBlock code={overlayCode} language="yaml" title="overlays/production/kustomization.yaml" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-amber-400 mb-2">Patch (수정)</h3>
          <CodeBlock code={patchCode} language="yaml" title="replica-patch.yaml" />
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">디렉토리 구조</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="font-mono text-xs text-gray-400 space-y-1">
            <div>k8s/</div>
            <div>├── base/</div>
            <div>│   ├── kustomization.yaml</div>
            <div>│   ├── deployment.yaml</div>
            <div>│   └── service.yaml</div>
            <div>└── overlays/</div>
            <div>    ├── dev/</div>
            <div>    ├── staging/</div>
            <div>    └── production/</div>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-500/10 rounded p-3 border border-blue-500/30">
              <div className="text-blue-400 font-bold text-xs mb-1">장점</div>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• 중복 제거 (DRY 원칙)</li>
                <li>• 환경별 차이만 관리</li>
                <li>• 템플릿 엔진 불필요</li>
              </ul>
            </div>

            <div className="bg-emerald-500/10 rounded p-3 border border-emerald-500/30">
              <div className="text-emerald-400 font-bold text-xs mb-1">패턴</div>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Base: 공통 리소스</li>
                <li>• Overlay: 환경별 차이</li>
                <li>• Patch: 선택적 수정</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
