import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide07() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">TSC 동작 원리</h2>
      
      <div className="flex-1 flex items-center justify-center">
        <FlowDiagram
          title="6개 Pod → 3개 AZ 균등 분산"
          nodes={[
            { id: 'scheduler', label: 'Scheduler', x: 50, y: 50, width: 160, color: 'blue', description: 'Pod 배치 결정' },
            { id: 'tsc', label: 'TSC Check', x: 280, y: 50, width: 160, color: 'purple', description: 'maxSkew 검증' },
            
            { id: 'az1', label: 'AZ-1a (2 Pods)', x: 50, y: 180, width: 180, color: 'emerald' },
            { id: 'az2', label: 'AZ-1b (2 Pods)', x: 290, y: 180, width: 180, color: 'emerald' },
            { id: 'az3', label: 'AZ-1c (2 Pods)', x: 530, y: 180, width: 180, color: 'emerald' },
            
            { id: 'fail', label: 'AZ-1b 장애', x: 290, y: 290, width: 180, color: 'rose', description: '2 Pods 손실' },
            { id: 'rebalance', label: 'AZ-1a, 1c 유지', x: 140, y: 290, width: 220, color: 'cyan', description: '4 Pods 정상' },
          ]}
          edges={[
            { from: 'scheduler', to: 'tsc', label: 'Pod 배치 요청', color: 'blue' },
            { from: 'tsc', to: 'az1', label: '2 Pods', color: 'emerald' },
            { from: 'tsc', to: 'az2', label: '2 Pods', color: 'emerald' },
            { from: 'tsc', to: 'az3', label: '2 Pods', color: 'emerald' },
            { from: 'az2', to: 'fail', label: '장애 발생', color: 'rose', style: 'dashed' },
            { from: 'az1', to: 'rebalance', color: 'cyan', style: 'dashed' },
            { from: 'az3', to: 'rebalance', color: 'cyan', style: 'dashed' },
          ]}
          width={760}
          height={360}
        />
      </div>

      <div className="mt-6 text-center text-gray-400">
        단일 AZ 장애 시 67% 용량 유지 (4/6 Pods)
      </div>
    </SlideWrapper>
  );
}
