import { SlideWrapper, FlowDiagram } from '@shared/components';
import { Workflow } from 'lucide-react';

export default function ArchitectureSlide() {
  const nodes = [
    { id: 'dev', label: 'Developer', x: 50, y: 50, width: 120, height: 60, color: 'blue' },
    { id: 'git', label: 'Git Repo', x: 250, y: 50, width: 120, height: 60, color: 'purple', description: 'Single Source of Truth' },
    { id: 'argocd', label: 'ArgoCD', x: 450, y: 50, width: 140, height: 60, color: 'emerald', description: 'GitOps Controller' },
    { id: 'eks', label: 'EKS Cluster', x: 650, y: 50, width: 130, height: 60, color: 'amber' },
    { id: 'webhook', label: 'Webhook', x: 250, y: 150, width: 100, height: 50, color: 'cyan' },
    { id: 'sync', label: 'Sync Loop', x: 450, y: 150, width: 100, height: 50, color: 'rose' },
  ];

  const edges = [
    { from: 'dev', to: 'git', label: '1. Push', color: 'blue' },
    { from: 'git', to: 'webhook', label: '2. Trigger', color: 'purple', style: 'dashed' as const },
    { from: 'webhook', to: 'argocd', label: '3. Notify', color: 'cyan' },
    { from: 'argocd', to: 'git', label: '4. Pull', color: 'emerald', style: 'dashed' as const },
    { from: 'argocd', to: 'eks', label: '5. Apply', color: 'emerald' },
    { from: 'argocd', to: 'sync', label: '6. Monitor', color: 'rose', style: 'dashed' as const },
    { from: 'sync', to: 'eks', label: '7. Health Check', color: 'rose', style: 'dashed' as const },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <Workflow className="w-12 h-12 text-emerald-400" />
        GitOps 아키텍처
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={850} height={260} />

      <div className="grid grid-cols-3 gap-4 mt-12">
        <div className="bg-gray-900 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-blue-400 font-bold mb-2">Git Repository</h3>
          <p className="text-sm text-gray-400">
            모든 인프라 및 애플리케이션 매니페스트를 YAML로 저장
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-emerald-500/30">
          <h3 className="text-emerald-400 font-bold mb-2">ArgoCD Controller</h3>
          <p className="text-sm text-gray-400">
            Git 변경사항을 감지하고 클러스터 상태를 자동 조정
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-amber-500/30">
          <h3 className="text-amber-400 font-bold mb-2">EKS Cluster</h3>
          <p className="text-sm text-gray-400">
            선언된 상태를 실제 리소스로 실행하고 유지
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        Pull 기반 모델: 클러스터가 Git에서 변경사항을 가져옴 (Push 모델 대비 보안 강화)
      </div>
    </SlideWrapper>
  );
}
