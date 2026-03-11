import { SlideWrapper } from '@shared/components';
import { Activity } from 'lucide-react';

export function Slide01() {
  return (
    <SlideWrapper className="justify-center items-center">
      <div className="text-center space-y-8">
        <div className="flex justify-center">
          <Activity className="w-24 h-24 text-blue-500" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          EKS Node Monitoring Agent
        </h1>
        <p className="text-2xl text-gray-400">
          노드 상태 자동 감지 및 복구
        </p>
        <div className="pt-8 text-gray-500 text-sm">
          Block 2 | EKS Operations & Observability
        </div>
      </div>
    </SlideWrapper>
  );
}
