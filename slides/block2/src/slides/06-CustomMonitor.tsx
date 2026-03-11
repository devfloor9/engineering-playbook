import { SlideWrapper, CodeBlock } from '@shared/components';
import { Settings } from 'lucide-react';

export function Slide06() {
  const configCode = `monitorConfigs = []monitorConfig{
  {
    Monitor:       &runtime.RuntimeMonitor{},
    ConditionType: rules.ContainerRuntimeReady,
  },
  {
    Monitor:       storage.NewStorageMonitor(),
    ConditionType: rules.StorageReady,
  },
  {
    Monitor:       networking.NewNetworkMonitor(),
    ConditionType: rules.NetworkingReady,
  },
  {
    Monitor:       kernel.NewKernelMonitor(),
    ConditionType: rules.KernelReady,
  },
}`;

  const diagnosticCode = `diagnosticController := controllers.NewNodeDiagnosticController(
  mgr.GetClient(),
  hostname,
  runtimeContext,
)

// NodeDiagnostic CRD를 통한 온디맨드 진단 실행
// 운영자는 특정 노드에서 실시간으로 진단 명령 실행 가능`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">커스텀 모니터 구성</h2>

      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-blue-300">모니터 등록 구조</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            각 모니터는 해당하는 Node Condition과 연결되어 상태를 보고합니다.
          </p>
          <CodeBlock code={configCode} language="go" title="monitor-config.go" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-emerald-500/30">
            <h4 className="text-emerald-400 font-bold mb-3 text-sm">Node Condition 기반 보고</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <span className="text-emerald-400">ContainerRuntimeReady</span>: 컨테이너 런타임</li>
              <li>• <span className="text-emerald-400">StorageReady</span>: 스토리지 시스템</li>
              <li>• <span className="text-emerald-400">NetworkingReady</span>: 네트워킹</li>
              <li>• <span className="text-emerald-400">KernelReady</span>: 커널</li>
              <li>• <span className="text-emerald-400">AcceleratedHardwareReady</span>: GPU/Neuron</li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 border border-purple-500/30">
            <h4 className="text-purple-400 font-bold mb-3 text-sm">실시간 진단 기능</h4>
            <CodeBlock code={diagnosticCode} language="go" title="diagnostic-controller.go" />
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
