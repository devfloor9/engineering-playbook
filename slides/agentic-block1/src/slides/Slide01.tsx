import { SlideWrapper } from '@shared/components';
import { Brain, Layers, Network } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center gap-6">
          <Brain className="w-24 h-24 text-blue-400" />
          <Network className="w-20 h-20 text-purple-400" />
          <Layers className="w-20 h-20 text-cyan-400" />
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Agentic AI Platform
        </h1>
        <p className="text-4xl text-gray-300 max-w-3xl">
          설계 &amp; 아키텍처
        </p>
        <p className="text-2xl text-gray-500">
          Block 1: Design &amp; Architecture
        </p>
      </div>
    </SlideWrapper>
  );
}
