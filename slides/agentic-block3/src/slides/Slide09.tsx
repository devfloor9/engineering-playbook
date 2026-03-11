import { SlideWrapper, Card, Badge } from '@shared/components';
import { Settings, Sparkles, Zap } from 'lucide-react';

export default function Slide09() {
  const benefits = [
    'Karpenter 기반 GPU 노드 자동 프로비저닝',
    'NVIDIA GPU 드라이버 자동 설치 및 관리',
    'p5.48xlarge (H100 8x) 자동 선택',
    'NodeClass default로 최적 AMI 자동 선택',
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Settings className="w-16 h-16 text-emerald-400" />
          <h2 className="text-5xl font-bold text-emerald-400">llm-d EKS Auto Mode 통합</h2>
        </div>

        <Card color="emerald" className="p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Sparkles className="w-12 h-12 text-amber-400" />
            <h3 className="text-3xl font-semibold text-white">EKS Auto Mode 장점</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg">
                <Zap className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-8">
          <Card color="blue" className="p-6">
            <h3 className="text-2xl font-semibold text-cyan-400 mb-4">Karpenter NodePool</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <span className="text-purple-400 font-mono">instance-family: p5</span></li>
              <li>• <span className="text-cyan-400 font-mono">capacity-type: on-demand</span></li>
              <li>• GPU taint: <span className="text-amber-400 font-mono">nvidia.com/gpu</span></li>
              <li>• Consolidation: <span className="text-emerald-400 font-mono">WhenEmpty</span></li>
            </ul>
          </Card>

          <Card color="purple" className="p-6">
            <h3 className="text-2xl font-semibold text-purple-400 mb-4">GPU 인스턴스</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong className="text-emerald-400">p5.48xlarge</strong>: 8x H100 80GB</li>
              <li>• vCPU: 192, Memory: 2048 GiB</li>
              <li>• Network: 3200 Gbps EFA</li>
              <li>• 용도: 70B+ 파라미터 모델</li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Badge color="emerald" size="lg">EKS Auto Mode</Badge>
          <Badge color="blue" size="lg">Karpenter v1.0+</Badge>
          <Badge color="purple" size="lg">GPU Auto-provisioning</Badge>
        </div>
      </div>
    </SlideWrapper>
  );
}
