import { SlideWrapper } from '@shared/components';
import { Activity, GitBranch, LineChart } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center gap-6">
          <Activity className="w-24 h-24 text-emerald-400" />
          <GitBranch className="w-20 h-20 text-purple-400" />
          <LineChart className="w-20 h-20 text-cyan-400" />
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
          운영 &amp; MLOps 파이프라인
        </h1>
        <p className="text-3xl text-gray-400">Block 4: Operations &amp; MLOps</p>
        <p className="text-xl text-gray-500 mt-4">AI 시스템의 안정적 운영과 지속적 개선</p>
      </div>
    </SlideWrapper>
  );
}
