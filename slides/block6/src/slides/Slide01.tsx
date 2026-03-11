import { SlideWrapper } from '@shared/components';
import { Compass } from 'lucide-react';

export function Slide01() {
  return (
    <SlideWrapper className="items-center justify-center">
      <div className="text-center space-y-8">
        <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-4">
          <Compass className="w-16 h-16 text-blue-400" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Block 6
        </h1>
        <h2 className="text-4xl font-semibold text-gray-200">
          Pod Scheduling 전략
        </h2>
        <div className="flex flex-col gap-3 text-gray-400 text-lg mt-12">
          <p>Kubernetes Pod 스케줄링 메커니즘</p>
          <p>Affinity, Taints, Tolerations, PDB</p>
          <p>Priority & Preemption, Descheduler</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
