import { SlideWrapper, Card } from '@shared/components';
import { Container, HardDrive, Network, Cpu, Zap } from 'lucide-react';

export function Slide05() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">시스템 모니터 종류</h2>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Container Runtime" icon={<Container className="w-5 h-5" />} color="blue">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-300">Docker / containerd</p>
            <ul className="text-gray-400 space-y-1">
              <li>• 런타임 서비스 상태</li>
              <li>• 소켓 연결성</li>
              <li>• API 응답성</li>
              <li>• 컨테이너 생성/관리 능력</li>
            </ul>
            <div className="mt-2 text-xs text-emerald-400">
              Condition: ContainerRuntimeReady
            </div>
          </div>
        </Card>

        <Card title="Storage System" icon={<HardDrive className="w-5 h-5" />} color="emerald">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-emerald-300">Disk & Filesystem</p>
            <ul className="text-gray-400 space-y-1">
              <li>• 디스크 공간 사용률</li>
              <li>• I/O 성능</li>
              <li>• 파일시스템 에러</li>
              <li>• 읽기/쓰기 지연</li>
            </ul>
            <div className="mt-2 text-xs text-emerald-400">
              Condition: StorageReady
            </div>
          </div>
        </Card>

        <Card title="Networking" icon={<Network className="w-5 h-5" />} color="purple">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-purple-300">Network Interfaces</p>
            <ul className="text-gray-400 space-y-1">
              <li>• 네트워크 인터페이스 상태</li>
              <li>• DNS 연결성</li>
              <li>• 패킷 손실</li>
              <li>• CNI 플러그인 동작</li>
            </ul>
            <div className="mt-2 text-xs text-emerald-400">
              Condition: NetworkingReady
            </div>
          </div>
        </Card>

        <Card title="Kernel" icon={<Cpu className="w-5 h-5" />} color="amber">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-amber-300">Kernel & System</p>
            <ul className="text-gray-400 space-y-1">
              <li>• 커널 모듈 상태</li>
              <li>• dmesg 로그 분석</li>
              <li>• OOM (Out of Memory)</li>
              <li>• 커널 소프트 락업</li>
            </ul>
            <div className="mt-2 text-xs text-emerald-400">
              Condition: KernelReady
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 bg-gradient-to-r from-rose-900/30 to-orange-900/30 rounded-xl p-5 border border-rose-500/30">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-400 font-bold mb-2">Accelerated Hardware (조건부)</h4>
            <p className="text-sm text-gray-300">
              하드웨어 감지 시 자동 활성화: <span className="text-orange-400">NVIDIA GPU</span> 및 <span className="text-orange-400">AWS Neuron</span> 칩 모니터링
            </p>
            <div className="mt-2 text-xs text-emerald-400">
              Condition: AcceleratedHardwareReady
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
