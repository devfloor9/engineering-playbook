import { SlideWrapper, FlowDiagram } from '@shared/components';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Failure Domain 계층 구조</h2>
      
      <div className="flex-1 flex items-center justify-center">
        <FlowDiagram
          title="Region → AZ → Node → Pod"
          nodes={[
            { id: 'region', label: 'Region', x: 50, y: 50, width: 180, color: 'rose', description: '리전 전체 장애' },
            { id: 'az', label: 'AZ', x: 300, y: 50, width: 150, color: 'orange', description: 'AZ 단위 장애' },
            { id: 'node', label: 'Node', x: 520, y: 50, width: 140, color: 'amber', description: '노드 장애' },
            { id: 'pod', label: 'Pod', x: 720, y: 50, width: 120, color: 'emerald', description: 'Pod 장애' },
            
            { id: 's1', label: 'Multi-Region', x: 50, y: 150, width: 180, color: 'blue', description: 'Global Accelerator' },
            { id: 's2', label: 'Multi-AZ', x: 300, y: 150, width: 150, color: 'blue', description: 'Topology Spread' },
            { id: 's3', label: 'Node HA', x: 520, y: 150, width: 140, color: 'blue', description: 'Karpenter' },
            { id: 's4', label: 'Pod HA', x: 720, y: 150, width: 120, color: 'blue', description: 'PDB, Probe' },
          ]}
          edges={[
            { from: 'region', to: 'az', color: 'gray' },
            { from: 'az', to: 'node', color: 'gray' },
            { from: 'node', to: 'pod', color: 'gray' },
            { from: 'region', to: 's1', color: 'blue', style: 'dashed' },
            { from: 'az', to: 's2', color: 'blue', style: 'dashed' },
            { from: 'node', to: 's3', color: 'blue', style: 'dashed' },
            { from: 'pod', to: 's4', color: 'blue', style: 'dashed' },
          ]}
          width={900}
          height={280}
        />
      </div>

      <div className="mt-6 text-center text-gray-400 text-lg">
        각 계층마다 적절한 대응 전략이 필요
      </div>
    </SlideWrapper>
  );
}
