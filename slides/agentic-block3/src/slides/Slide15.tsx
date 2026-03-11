import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Network, Zap } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Network className="w-16 h-16 text-purple-400" />
          <h2 className="text-5xl font-bold text-purple-400">GPU 토폴로지 인식 스케줄링</h2>
        </div>

        <Card className="p-8 bg-gradient-to-br from-purple-900/40 to-blue-900/40 mb-8">
          <p className="text-xl text-gray-300 leading-relaxed">
            Kubernetes 1.33+의 <span className="text-cyan-400 font-semibold">Topology-Aware Routing</span>으로
            GPU 간 물리적 연결을 인식하여 <span className="text-purple-400 font-semibold">최적 경로 선택</span>.
            <span className="text-emerald-400 font-semibold"> NVLink/NVSwitch</span> 활용으로
            <span className="text-amber-400 font-semibold">지연 시간 최소화</span> 및
            <span className="text-blue-400 font-semibold">처리량 극대화</span>.
          </p>
        </Card>

        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-cyan-400 mb-4">네트워크 토폴로지 계층</h3>
          <CompareTable
            headers={["계층", "대역폭", "지연", "용도"]}
            rows={[
              ["NVSwitch (같은 노드)", "최대 600GB/s", "최소", "p5/H100 노드 내 통신"],
              ["NVLink (같은 노드)", "최대 200GB/s", "최소", "A100/H100 노드 내 통신"],
              ["EFA/InfiniBand (노드 간)", "최대 100GB/s", "낮음", "분산 학습 노드 간"],
              ["Ethernet (노드 간)", "최대 10-100GB/s", "중간", "일반 네트워크"],
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-r from-cyan-900/40 to-emerald-900/40">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-10 h-10 text-cyan-400" />
              <h4 className="text-2xl font-semibold text-white">자동 경로 선택</h4>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• 토폴로지 분석 (자동 감지)</li>
              <li>• 최적 알고리즘 선택</li>
              <li>• 채널 구성 최적화</li>
              <li>• NCCL 통합</li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-purple-900/40 to-amber-900/40">
            <div className="flex items-center gap-3 mb-4">
              <Network className="w-10 h-10 text-purple-400" />
              <h4 className="text-2xl font-semibold text-white">Service 설정</h4>
            </div>
            <div className="space-y-2 text-gray-300 font-mono text-sm">
              <div>service.kubernetes.io/</div>
              <div className="ml-4">topology-mode: "Auto"</div>
              <div>trafficDistribution:</div>
              <div className="ml-4">PreferClose</div>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
