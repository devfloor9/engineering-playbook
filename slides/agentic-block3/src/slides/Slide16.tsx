import { SlideWrapper, Card, Badge } from '@shared/components';
import { Activity, BarChart3, Gauge } from 'lucide-react';

export default function Slide16() {
  const metrics = [
    { name: 'DCGM_FI_DEV_GPU_UTIL', desc: 'GPU 코어 사용률 (%)', use: 'HPA 트리거' },
    { name: 'DCGM_FI_DEV_MEM_COPY_UTIL', desc: '메모리 대역폭 사용률', use: '메모리 병목' },
    { name: 'DCGM_FI_DEV_FB_USED', desc: '프레임버퍼 사용량 (MB)', use: 'OOM 방지' },
    { name: 'DCGM_FI_DEV_POWER_USAGE', desc: '전력 사용량 (W)', use: '비용 모니터링' },
    { name: 'DCGM_FI_DEV_GPU_TEMP', desc: 'GPU 온도 (°C)', use: '열 관리' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Activity className="w-16 h-16 text-emerald-400" />
          <h2 className="text-5xl font-bold text-emerald-400">DCGM 모니터링</h2>
        </div>

        <Card className="p-8 bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BarChart3 className="w-12 h-12 text-cyan-400" />
            <h3 className="text-3xl font-semibold text-white">NVIDIA DCGM Exporter</h3>
          </div>
          <p className="text-xl text-gray-300 leading-relaxed">
            <span className="text-emerald-400 font-semibold">Data Center GPU Manager (DCGM)</span>는
            GPU 메트릭을 <span className="text-cyan-400 font-semibold">Prometheus</span>로 수집하여
            <span className="text-purple-400 font-semibold"> Grafana 대시보드</span>에서 시각화.
            <span className="text-amber-400 font-semibold">실시간 GPU 상태 모니터링</span> 및
            자동 스케일링 트리거로 활용.
          </p>
        </Card>

        <div className="space-y-3 mb-8">
          {metrics.map((metric, idx) => (
            <Card key={idx} className="p-4 bg-gray-800/50 hover:bg-gray-800/70 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Gauge className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-lg font-mono text-cyan-400">{metric.name}</div>
                    <div className="text-sm text-gray-400">{metric.desc}</div>
                  </div>
                </div>
                <Badge className="bg-emerald-600">{metric.use}</Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 text-center">
            <div className="text-3xl font-bold text-blue-400">DaemonSet</div>
            <div className="text-sm text-gray-400 mt-2">모든 GPU 노드에 배포</div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 text-center">
            <div className="text-3xl font-bold text-purple-400">15s interval</div>
            <div className="text-sm text-gray-400 mt-2">메트릭 수집 주기</div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-cyan-900/40 to-emerald-900/40 text-center">
            <div className="text-3xl font-bold text-cyan-400">Port 9400</div>
            <div className="text-sm text-gray-400 mt-2">Prometheus endpoint</div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
