import { SlideWrapper } from '@shared/components';
import { Shield, Zap } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center gap-6">
          <Shield className="w-24 h-24 text-blue-400" />
          <Zap className="w-20 h-20 text-amber-400" />
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          EKS 고가용성 아키텍처
        </h1>
        <p className="text-3xl text-gray-400 max-w-3xl">
          Block 4: Resiliency & High Availability
        </p>
        <div className="mt-8 text-xl text-gray-500">
          장애는 반드시 발생한다 — 설계로 대비한다
        </div>
      </div>
      <div className="text-center text-gray-600 text-sm">
        Engineering Playbook | EKS Resiliency Guide
      </div>
    </SlideWrapper>
  );
}
