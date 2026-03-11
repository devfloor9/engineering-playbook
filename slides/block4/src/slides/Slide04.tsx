import { SlideWrapper, Card } from '@shared/components';
import { Shield, Server, CheckCircle2 } from 'lucide-react';

export default function Slide04() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">EKS 컨트롤 플레인 HA</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-300">AWS 관리형 고가용성</h3>
              <p className="text-gray-300 mb-4">
                EKS 컨트롤 플레인은 기본적으로 3개 AZ에 걸쳐 Multi-AZ로 배포되며, 
                AWS가 자동으로 관리합니다.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  API 서버, etcd, 스케줄러가 모두 Multi-AZ 구성
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  단일 AZ 장애 시에도 컨트롤 플레인 정상 동작
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  99.95% SLA 제공 (EKS Extended Support 기간 제외)
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <Server className="w-7 h-7 text-purple-400 mb-3" />
            <h4 className="font-semibold mb-2 text-purple-300">사용자 책임</h4>
            <p className="text-sm text-gray-400">데이터 플레인(노드, Pod) 고가용성 설계</p>
          </Card>
          <Card className="p-5">
            <Shield className="w-7 h-7 text-emerald-400 mb-3" />
            <h4 className="font-semibold mb-2 text-emerald-300">AWS 책임</h4>
            <p className="text-sm text-gray-400">컨트롤 플레인 Multi-AZ 배포 및 복구</p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
