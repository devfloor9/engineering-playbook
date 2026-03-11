import { SlideWrapper } from '@shared/components';
import { Cpu, Zap } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <div className="flex items-center gap-6">
          <Cpu className="w-24 h-24 text-blue-400" />
          <Zap className="w-20 h-20 text-amber-400" />
        </div>
        <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          모델 서빙 &amp; 추론 최적화
        </h1>
        <p className="text-3xl text-gray-300">Block 3: Model Serving &amp; Inference</p>
      </div>
    </SlideWrapper>
  );
}
