import { SlideWrapper, Card, Badge } from '@shared/components';
import { RotateCcw, Zap, Clock } from 'lucide-react';

export default function Slide10() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Zonal Shift (ARC)</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-4">
            <RotateCcw className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-300">AWS Application Recovery Controller</h3>
              <p className="text-gray-300">
                특정 AZ에 문제가 감지되었을 때 해당 AZ로의 트래픽을 자동 또는 수동으로 전환하는 기능
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-6 h-6 text-amber-400" />
              <h4 className="font-semibold text-amber-300">Zonal Autoshift</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• AWS가 AZ 장애를 자동 감지</li>
              <li>• 자동으로 트래픽 전환</li>
              <li>• 운영 부담 최소화</li>
            </ul>
            <Badge color="emerald" className="mt-3">자동화</Badge>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <h4 className="font-semibold text-purple-300">Manual Zonal Shift</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 운영자가 수동으로 전환</li>
              <li>• 최대 3일간 유지 (연장 가능)</li>
              <li>• 계획된 유지보수에 활용</li>
            </ul>
            <Badge color="blue" className="mt-3">수동</Badge>
          </Card>
        </div>

        <Card className="p-4 bg-gray-800 border border-gray-700">
          <code className="text-sm text-emerald-400 block">
            aws arc-zonal-shift start-zonal-shift \<br/>
            &nbsp;&nbsp;--resource-identifier arn:aws:eks:...:cluster/prod \<br/>
            &nbsp;&nbsp;--away-from us-east-1b \<br/>
            &nbsp;&nbsp;--expires-in 3h
          </code>
        </Card>
      </div>
    </SlideWrapper>
  );
}
