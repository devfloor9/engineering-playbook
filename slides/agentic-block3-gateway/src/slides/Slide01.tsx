import React from 'react';
import { SlideWrapper } from '@shared/components';

const Slide01: React.FC = () => {
  return (
    <SlideWrapper slideNumber={1} title="Block 3: Gateway & Routing">
      <div className="flex flex-col items-center justify-center h-full space-y-12">
        <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          Inference Gateway & LLM Routing
        </h1>

        <div className="text-3xl text-gray-300 space-y-4 text-center max-w-4xl">
          <p>Building enterprise-grade AI gateway infrastructure</p>
          <p className="text-2xl text-gray-400">2-Tier Architecture for Cost & Performance</p>
        </div>

        <div className="mt-12 flex gap-8">
          <div className="px-6 py-3 bg-blue-600/30 rounded-lg border border-blue-500/50">
            <span className="text-xl text-blue-300">Intelligent Routing</span>
          </div>
          <div className="px-6 py-3 bg-purple-600/30 rounded-lg border border-purple-500/50">
            <span className="text-xl text-purple-300">Cost Optimization</span>
          </div>
          <div className="px-6 py-3 bg-pink-600/30 rounded-lg border border-pink-500/50">
            <span className="text-xl text-pink-300">Multi-Provider</span>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide01;
