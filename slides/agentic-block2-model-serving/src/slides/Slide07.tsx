import React from 'react';
import { SlideWrapper, CompareTable } from '@shared/components';

export const Slide07: React.FC = () => {
  const timeline = [
    { version: 'K8s 1.26', status: 'Alpha', api: 'v1alpha2', flag: 'Required', notes: 'Initial release, experimental' },
    { version: 'K8s 1.31', status: 'Beta', api: 'v1alpha2', flag: 'Default ON', notes: 'Production-ready' },
    { version: 'K8s 1.32', status: 'Beta', api: 'v1beta1', flag: 'Default OFF', notes: 'New implementation (KEP #4381)' },
    { version: 'K8s 1.33', status: 'Beta', api: 'v1beta1', flag: 'Default ON', notes: 'Performance improvements' },
    { version: 'K8s 1.34', status: 'GA', api: 'v1', flag: 'Always ON', notes: 'Stable, prioritized alternatives' }
  ];

  return (
    <SlideWrapper title="DRA Timeline" subtitle="Dynamic Resource Allocation Evolution">
      <CompareTable
        headers={['Version', 'Status', 'API', 'Feature Gate', 'Notes']}
        data={timeline.map(t => [t.version, t.status, t.api, t.flag, t.notes])}
      />
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-green-900/30 rounded-lg">
          <h3 className="font-bold text-green-300 mb-2">DRA Benefits</h3>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <li>• Fractional GPU allocation (0.5 GPU)</li>
            <li>• MIG/MPS/Time-Slicing selection</li>
            <li>• Topology-aware scheduling (NVLink, NUMA)</li>
            <li>• CEL-based device selection</li>
            <li>• Multi-resource coordination</li>
            <li>• P6e-GB200 native support</li>
          </ul>
        </div>
        <div className="p-4 bg-blue-900/30 rounded-lg text-sm">
          <strong>Recommendation:</strong> Use K8s 1.34+ for production DRA deployments (GA status).
        </div>
      </div>
    </SlideWrapper>
  );
};
