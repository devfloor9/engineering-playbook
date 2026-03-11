import { SlideWrapper, Card, FlowDiagram } from '@shared/components';
import { GitBranch, Cpu } from 'lucide-react';

export default function Slide11() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        MLOps 파이프라인 개요
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">EKS 기반 CI/CD for ML</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Kubeflow Pipelines + MLflow + KServe로 구성된 완전 자동화 ML 라이프사이클
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• 데이터 준비부터 배포까지 자동화</li>
            <li>• GPU 리소스 동적 프로비저닝</li>
            <li>• 모델 버전 관리 및 거버넌스</li>
            <li>• 프로덕션 모니터링 통합</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">핵심 컴포넌트</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <strong className="text-blue-300">Kubeflow Pipelines</strong>
              <p className="text-xs text-gray-400 mt-1">재사용 가능 컴포넌트 기반 워크플로우</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
              <strong className="text-emerald-300">MLflow</strong>
              <p className="text-xs text-gray-400 mt-1">실험 추적 및 모델 레지스트리</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
              <strong className="text-purple-300">KServe</strong>
              <p className="text-xs text-gray-400 mt-1">프로덕션 모델 서빙</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-gray-800/50">
        <h3 className="text-xl font-bold text-white mb-4">ML 라이프사이클</h3>
        <FlowDiagram
          steps={[
            { label: "데이터 준비", icon: "📊" },
            { label: "피처 엔지니어링", icon: "🔧" },
            { label: "모델 학습", icon: "🧠" },
            { label: "모델 평가", icon: "✅" },
            { label: "모델 등록", icon: "📦" },
            { label: "배포", icon: "🚀" },
          ]}
        />
      </Card>
    </SlideWrapper>
  );
}
