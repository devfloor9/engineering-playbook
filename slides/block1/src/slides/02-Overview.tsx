import { SlideWrapper, Card } from '@shared/components';
import { BookOpen, GitBranch, Cloud, Lock, Zap, AlertTriangle } from 'lucide-react';

export default function OverviewSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-12 flex items-center gap-4">
        <BookOpen className="w-12 h-12 text-blue-400" />
        목차
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <Card title="GitOps 기초" icon={<GitBranch className="w-6 h-6" />} color="blue">
          <ul className="space-y-2">
            <li>• GitOps 철학과 원칙</li>
            <li>• ArgoCD vs Flux 비교</li>
            <li>• EKS Capabilities 소개</li>
          </ul>
        </Card>

        <Card title="아키텍처 & 구조" icon={<Cloud className="w-6 h-6" />} color="emerald">
          <ul className="space-y-2">
            <li>• GitOps 워크플로우</li>
            <li>• Application & Kustomize</li>
            <li>• 멀티클러스터 관리</li>
          </ul>
        </Card>

        <Card title="운영 자동화" icon={<Zap className="w-6 h-6" />} color="amber">
          <ul className="space-y-2">
            <li>• Addon 관리 전략</li>
            <li>• Progressive Delivery</li>
            <li>• CI/CD 통합</li>
          </ul>
        </Card>

        <Card title="보안 & 복구" icon={<Lock className="w-6 h-6" />} color="purple">
          <ul className="space-y-2">
            <li>• Secret 관리 (ESO)</li>
            <li>• 모니터링 & 알림</li>
            <li>• 장애 복구 & 롤백</li>
          </ul>
        </Card>
      </div>

      <div className="mt-12 flex items-center gap-3 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">
          전통적 수동 운영의 문제: 환경 불일치, 이력 부재, 복잡성 증가, 검증 프로세스 부족
        </p>
      </div>
    </SlideWrapper>
  );
}
