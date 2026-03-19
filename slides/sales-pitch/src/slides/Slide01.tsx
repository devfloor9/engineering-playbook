import { SlideWrapper } from '@shared/components';
import { Brain, Bot, Rocket } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center gap-6">
          <Brain className="w-20 h-20 text-blue-400" />
          <Bot className="w-24 h-24 text-purple-400" />
          <Rocket className="w-20 h-20 text-cyan-400" />
        </div>

        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
          AI를 위한 견고한 기반을 세우다
        </h1>
        <p className="text-2xl text-gray-300 max-w-3xl">
          Agentic AI 시대, 클라우드 네이티브 인프라가 승부를 가릅니다
        </p>

        <div className="bg-purple-500/20 rounded-2xl px-10 py-6 border-2 border-purple-400/60" style={{boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)'}}>
          <p className="text-3xl font-bold text-white">
            2026년 엔터프라이즈 <span className="text-purple-300">80%</span>가 AI 에이전트 도입 예정
          </p>
        </div>

        <div className="space-y-2 mt-4">
          <p className="text-2xl text-white font-semibold">Modern Agentic Applications Day</p>
          <p className="text-xl text-gray-300">2026.4.9 | 센터필드 18층 | 200명 한정</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
