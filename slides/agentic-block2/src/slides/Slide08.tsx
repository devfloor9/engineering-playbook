import { SlideWrapper, Card } from '@shared/components';
import { Bot, Cog, Package, GitBranch } from 'lucide-react';

export default function Slide08() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-emerald-400">Kagent 개요</h2>
        <p className="text-xl text-gray-300 mb-6">Kubernetes Operator 기반 AI Agent 관리</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card color="emerald" className="p-6">
            <Bot className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-emerald-300">Kagent란?</h3>
            <p className="text-gray-300 mb-3">
              Kubernetes 네이티브 방식으로 AI 에이전트를 관리하기 위한 참조 아키텍처
            </p>
            <p className="text-gray-300">
              Custom Resource Definition(CRD)을 통해 에이전트, 도구, 워크플로우를 선언적으로 정의하고, Operator가 자동으로 배포 및 관리
            </p>
          </Card>

          <Card className="p-6">
            <Cog className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-blue-300">주요 기능</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span><span className="text-blue-300 font-semibold">선언적 관리:</span> YAML 기반 에이전트 정의</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-1">•</span>
                <span><span className="text-cyan-300 font-semibold">도구 레지스트리:</span> CRD로 중앙 관리</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span><span className="text-emerald-300 font-semibold">자동 스케일링:</span> HPA/KEDA 통합</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">•</span>
                <span><span className="text-purple-300 font-semibold">멀티 에이전트:</span> 복잡한 워크플로우 지원</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Package className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">Operator 패턴</h4>
            <p className="text-sm text-gray-300">
              Controller가 CRD를 감시하고 Kubernetes 리소스(Deployment, Service, HPA)를 자동으로 생성 및 관리
            </p>
          </Card>

          <Card className="p-5">
            <GitBranch className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">GitOps 지원</h4>
            <p className="text-sm text-gray-300">
              선언적 YAML 정의로 Git 기반 버전 관리 및 자동 배포 파이프라인 구축 가능
            </p>
          </Card>

          <Card color="blue" className="p-5">
            <h4 className="text-sm font-semibold mb-2 text-blue-300">대안 솔루션</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• <span className="text-blue-400">KubeAI:</span> Kubernetes AI Platform</li>
              <li>• <span className="text-emerald-400">Seldon Core:</span> MLOps Platform</li>
              <li>• <span className="text-purple-400">KServe:</span> Serverless Inference</li>
            </ul>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-amber-500/30">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">참고:</span> Kagent는 참조 아키텍처이며, 프로덕션 환경에서는 KubeAI, Seldon Core 등 검증된 대안 고려
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
