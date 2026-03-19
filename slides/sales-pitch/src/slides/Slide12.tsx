import { SlideWrapper, Card } from '@shared/components';
import { Rocket, Server, Bot, ArrowRightLeft } from 'lucide-react';

export default function Slide12() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <Rocket className="w-20 h-20 text-purple-400" />

        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent leading-tight">
          앱 현대화의 다음 단계는
          <br />
          Agentic AI입니다
        </h1>

        <p className="text-2xl text-gray-300 max-w-3xl">
          컨테이너, Kubernetes, 클라우드 네이티브 인프라 —
          <br />
          <span className="text-white font-semibold">앱 현대화를 잘 해온 기업이 Agentic AI도 잘 합니다</span>
        </p>

        <div className="grid grid-cols-3 gap-5 w-full max-w-4xl mt-4">
          <Card color="blue" className="p-5 text-center">
            <Server className="w-14 h-14 text-blue-400 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-blue-300 mb-2">LLMOps Track</h4>
            <p className="text-sm text-gray-300">EKS + GPU Operator + vLLM PoC</p>
            <p className="text-xs text-gray-500 mt-2">2주 PoC → 프로덕션 로드맵</p>
          </Card>

          <Card color="emerald" className="p-5 text-center">
            <Bot className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-emerald-300 mb-2">AgentOps Track</h4>
            <p className="text-sm text-gray-300">AgentCore + Hosted MCP PoC</p>
            <p className="text-xs text-gray-500 mt-2">매니지드 에이전트 운영</p>
          </Card>

          <Card color="purple" className="p-5 text-center">
            <ArrowRightLeft className="w-14 h-14 text-purple-400 mx-auto mb-3" />
            <h4 className="text-xl font-bold text-purple-300 mb-2">Migration Track</h4>
            <p className="text-sm text-gray-300">AWS Transform 어세스먼트</p>
            <p className="text-xs text-gray-500 mt-2">레거시 → AI-ready 전환</p>
          </Card>
        </div>

        <div className="rounded-2xl px-10 py-6 border-2 border-white/20 mt-4" style={{background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(16,185,129,0.25), rgba(139,92,246,0.25))', boxShadow: '0 0 50px rgba(99, 102, 241, 0.2), 0 0 100px rgba(16, 185, 129, 0.1)'}}>
          <p className="text-2xl font-bold text-white mb-2">
            4월 9일, 센터필드 18층에서 만나세요
          </p>
          <p className="text-lg text-white/80">
            200명 한정 | 지금 등록하세요
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
