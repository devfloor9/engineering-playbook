import { SlideWrapper } from '@shared/components';
import { Activity } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center">
        <Activity className="w-32 h-32 text-emerald-400 mb-8" />
        <h1 className="text-7xl font-bold text-white mb-4">Block 5</h1>
        <h2 className="text-5xl font-semibold text-emerald-400 mb-8">
          Pod Health & Graceful Shutdown
        </h2>
        <div className="text-2xl text-gray-400 space-y-2 text-center">
          <p>EKS Pod 헬스체크 & 라이프사이클 관리</p>
          <p className="text-xl text-gray-500">Kubernetes Probe, Graceful Shutdown, Pod Lifecycle</p>
        </div>
      </div>
      <div className="text-center text-gray-600 text-sm">
        EKS 1.30+ | Kubernetes 1.30+ | AWS Load Balancer Controller v2.7+
      </div>
    </SlideWrapper>
  );
}
