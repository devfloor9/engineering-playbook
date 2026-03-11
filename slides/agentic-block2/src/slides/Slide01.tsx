import { SlideWrapper } from '@shared/components';
import { Network, Bot } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center gap-6">
          <Network className="w-24 h-24 text-blue-400" />
          <Bot className="w-20 h-20 text-emerald-400" />
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          게이트웨이 &amp; 에이전트
        </h1>
        <p className="text-3xl text-gray-300">Block 2: Gateway &amp; Agent Orchestration</p>
      </div>
    </SlideWrapper>
  );
}
