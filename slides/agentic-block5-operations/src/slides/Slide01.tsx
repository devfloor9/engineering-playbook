import { SlideWrapper } from '@shared/components';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex flex-col items-center justify-center h-full text-center px-16">
        <h1 className="text-7xl font-bold mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Operations & MLOps
        </h1>
        <p className="text-3xl text-gray-300 mb-12">
          Block 5: Production-Ready ML Lifecycle Management
        </p>
        <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-blue-500/30">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-blue-400">Observability</h3>
            <p className="text-sm text-gray-400">Dual-layer monitoring with Bifrost & Langfuse</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-purple-500/30">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-purple-400">Evaluation</h3>
            <p className="text-sm text-gray-400">RAGAS-powered RAG quality assessment</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-green-500/30">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="text-xl font-semibold mb-2 text-green-400">MLOps</h3>
            <p className="text-sm text-gray-400">Kubeflow + MLflow + ArgoCD GitOps</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-lg border border-orange-500/30">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-xl font-semibold mb-2 text-orange-400">Cost Governance</h3>
            <p className="text-sm text-gray-400">Multi-tier tracking and optimization</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
