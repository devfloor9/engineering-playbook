import { SlideWrapper, FlowDiagram } from '@shared/components';
import { Server } from 'lucide-react';

export default function CPArchitectureSlide() {
  const nodes = [
    { id: 'nlb', label: 'NLB', x: 20, y: 90, width: 80, height: 50, color: 'amber', description: 'API Endpoint' },
    { id: 'cpi1', label: 'CPI (AZ-a)', x: 160, y: 20, width: 140, height: 50, color: 'blue', description: 'apiserver + etcd' },
    { id: 'cpi2', label: 'CPI (AZ-b)', x: 160, y: 90, width: 140, height: 50, color: 'blue', description: 'apiserver + etcd' },
    { id: 'cpi3', label: 'CPI (AZ-c)', x: 160, y: 160, width: 140, height: 50, color: 'blue', description: 'apiserver + etcd' },
    { id: 'etcd', label: 'etcd Cluster', x: 380, y: 90, width: 130, height: 50, color: 'purple', description: 'RAFT Consensus' },
    { id: 'worker', label: 'Worker Nodes', x: 580, y: 90, width: 130, height: 50, color: 'emerald', description: 'Customer VPC' },
  ];

  const edges = [
    { from: 'nlb', to: 'cpi1', color: 'amber' },
    { from: 'nlb', to: 'cpi2', color: 'amber' },
    { from: 'nlb', to: 'cpi3', color: 'amber' },
    { from: 'cpi2', to: 'etcd', label: 'Colocation', color: 'purple', style: 'dashed' as const },
    { from: 'etcd', to: 'worker', label: 'ENI', color: 'emerald' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <Server className="w-12 h-12 text-blue-400" />
        EKS Control Plane Architecture
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={750} height={230} />

      <div className="grid grid-cols-3 gap-4 mt-10">
        <div className="bg-gray-900 rounded-lg p-4 border border-blue-500/30">
          <h3 className="text-blue-400 font-bold mb-2">Control Plane Instances</h3>
          <p className="text-sm text-gray-400">
            Distributed across 3 AZs. apiserver + etcd colocated on the same instance
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-purple-500/30">
          <h3 className="text-purple-400 font-bold mb-2">etcd (The Heart)</h3>
          <p className="text-sm text-gray-400">
            Stores all K8s state. Standard 10GB / XL+ 20GB. RAFT consensus requires majority for writes
          </p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-amber-500/30">
          <h3 className="text-amber-400 font-bold mb-2">NLB Endpoint</h3>
          <p className="text-sm text-gray-400">
            Single API Server endpoint exposed to customers. Connected via Route53 DNS records
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
