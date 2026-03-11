import { SlideWrapper, FlowDiagram } from '@shared/components';

const nodes = [
  { id: 'cp', label: '컨트롤 플레인', x: 330, y: 10, width: 160, height: 45, color: 'blue', description: 'API Server, etcd' },
  { id: 'node', label: '노드', x: 330, y: 75, width: 160, height: 45, color: 'orange', description: 'kubelet, containerd' },
  { id: 'net', label: '네트워크', x: 330, y: 140, width: 160, height: 45, color: 'amber', description: 'VPC CNI, DNS' },
  { id: 'wl', label: '워크로드', x: 330, y: 205, width: 160, height: 45, color: 'rose', description: 'Pod, Deployment, HPA' },
  { id: 'stor', label: '스토리지', x: 330, y: 270, width: 160, height: 45, color: 'blue', description: 'EBS/EFS CSI' },
  { id: 'obs', label: '옵저버빌리티', x: 330, y: 335, width: 160, height: 45, color: 'emerald', description: '메트릭, 로그, 알림' },
];

const edges = [
  { from: 'cp', to: 'node', color: 'blue' },
  { from: 'node', to: 'net', color: 'orange' },
  { from: 'net', to: 'wl', color: 'amber' },
  { from: 'wl', to: 'stor', color: 'rose' },
  { from: 'stor', to: 'obs', color: 'blue' },
];

export function SixLayerIntroSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2 text-rose-400">6-Layer 디버깅 프레임워크</h2>
      <p className="text-gray-400 mb-4">Bottom-up 또는 Top-down으로 체계적 진단</p>
      <div className="flex-1 flex items-center">
        <div className="w-1/2">
          <FlowDiagram nodes={nodes} edges={edges} width={820} height={400} />
        </div>
        <div className="w-1/2 space-y-4 pl-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-blue-500/30">
            <h3 className="text-blue-400 font-bold mb-2">Top-down (증상 → 원인)</h3>
            <p className="text-gray-400 text-sm">서비스 장애, 성능 저하 등 즉각적 문제 대응에 적합</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-emerald-500/30">
            <h3 className="text-emerald-400 font-bold mb-2">Bottom-up (인프라 → 앱)</h3>
            <p className="text-gray-400 text-sm">예방적 점검, 클러스터 마이그레이션 후 검증에 적합</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
