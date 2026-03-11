import { SlideWrapper, Card } from '@shared/components';
import { Target, Layers, GitBranch, Globe } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Overview: 레질리언시란?</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-4">
            <Target className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-300">정의</h3>
              <p className="text-gray-300">
                시스템이 장애에 직면했을 때 정상 상태로 복구하거나, 
                장애 영향을 최소화하면서 서비스를 유지하는 능력
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Layers className="w-7 h-7 text-emerald-400 mb-3" />
            <h4 className="font-semibold mb-2 text-emerald-300">Multi-AZ</h4>
            <p className="text-sm text-gray-400">AZ 장애 내성</p>
          </Card>
          <Card className="p-5">
            <GitBranch className="w-7 h-7 text-purple-400 mb-3" />
            <h4 className="font-semibold mb-2 text-purple-300">Cell Architecture</h4>
            <p className="text-sm text-gray-400">Blast Radius 격리</p>
          </Card>
          <Card className="p-5">
            <Globe className="w-7 h-7 text-amber-400 mb-3" />
            <h4 className="font-semibold mb-2 text-amber-300">Multi-Region</h4>
            <p className="text-sm text-gray-400">리전 장애 내성</p>
          </Card>
        </div>

        <Card className="p-5 bg-amber-500/10 border-amber-500/30">
          <p className="text-center text-lg text-amber-200">
            ⚡ 핵심 원칙: <span className="font-bold">장애는 반드시 발생한다</span> — 설계로 대비한다
          </p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
