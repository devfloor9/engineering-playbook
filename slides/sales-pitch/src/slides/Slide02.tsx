import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide02() {
  const nodes = [
    { id: 'mono', label: '모놀리스', x: 10, y: 55, width: 200, height: 80, color: 'gray' },
    { id: 'micro', label: '마이크로서비스', x: 270, y: 55, width: 210, height: 80, color: 'blue' },
    { id: 'container', label: '컨테이너/EKS', x: 540, y: 55, width: 210, height: 80, color: 'emerald' },
    { id: 'agentic', label: 'Agentic AI', x: 810, y: 55, width: 200, height: 80, color: 'purple' },
  ];

  const edges = [
    { from: 'mono', to: 'micro', color: 'gray' },
    { from: 'micro', to: 'container', color: 'blue' },
    { from: 'container', to: 'agentic', color: 'emerald' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        앱 현대화의 진화
      </h2>
      <p className="text-lg text-gray-400 text-center mb-4">
        각 단계가 다음 단계의 기반 — 앱 현대화는 AI의 전제 조건
      </p>

      <div className="flex-1 flex flex-col items-center justify-center space-y-5">
        <div className="w-full max-w-5xl">
          <FlowDiagram nodes={nodes} edges={edges} width={1020} height={190} />
        </div>

        <div className="grid grid-cols-4 gap-5 w-full max-w-5xl">
          <div className="bg-gray-900 rounded-xl p-5 border-2 border-gray-600/40 text-center">
            <p className="text-base text-gray-400 mb-1">Phase 1</p>
            <p className="text-xl font-bold text-gray-300">단일 배포</p>
            <p className="text-xs text-gray-500 mt-1">하나의 서버, 하나의 코드베이스</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border-2 border-blue-500/40 text-center">
            <p className="text-base text-blue-400 mb-1">Phase 2</p>
            <p className="text-xl font-bold text-blue-300">서비스 분리</p>
            <p className="text-xs text-gray-500 mt-1">독립 배포, API 기반 통신</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border-2 border-emerald-500/40 text-center">
            <p className="text-base text-emerald-400 mb-1">Phase 3</p>
            <p className="text-xl font-bold text-emerald-300">오케스트레이션</p>
            <p className="text-xs text-gray-500 mt-1">K8s 자동 스케일링, 자가 복구</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border-2 border-purple-500/40 text-center">
            <p className="text-base text-purple-400 mb-1">Phase 4</p>
            <p className="text-xl font-bold text-purple-300">AI 자율 운영</p>
            <p className="text-xs text-gray-500 mt-1">에이전트가 판단하고 실행</p>
          </div>
        </div>

        <div className="bg-emerald-500/20 rounded-xl px-8 py-4 border-2 border-emerald-400/60" style={{boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)'}}>
          <p className="text-xl text-white font-bold">
            컨테이너 도입 기업의 AI 전환 성공률 <span className="text-emerald-300">3.2배</span> 높음
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
