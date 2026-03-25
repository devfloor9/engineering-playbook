import { SlideWrapper, FlowDiagram } from '@shared/components';
import { AlertTriangle } from 'lucide-react';

export default function CRDImpactSlide() {
  const nodes = [
    { id: '429', label: '429 Throttling', x: 20, y: 20, width: 130, height: 45, color: 'rose' },
    { id: 'inflight', label: 'Inflight Limit Hit', x: 220, y: 20, width: 150, height: 45, color: 'amber' },
    { id: 'apf', label: 'CRD List APF Overuse', x: 440, y: 20, width: 160, height: 45, color: 'orange' },

    { id: 'slow', label: 'Slow List Response', x: 20, y: 90, width: 130, height: 45, color: 'rose' },
    { id: 'json', label: 'JSON Serialization', x: 220, y: 90, width: 150, height: 45, color: 'amber' },
    { id: 'crd_json', label: 'CRD + JSON Encoding', x: 440, y: 90, width: 160, height: 45, color: 'orange' },

    { id: 'db', label: 'etcd DB Warning', x: 20, y: 160, width: 130, height: 45, color: 'rose' },
    { id: 'obj', label: 'CRD Object Buildup', x: 220, y: 160, width: 150, height: 45, color: 'amber' },
    { id: 'cleanup', label: 'No Cleanup + Large Spec', x: 440, y: 160, width: 160, height: 45, color: 'orange' },
  ];

  const edges = [
    { from: '429', to: 'inflight', color: 'rose' },
    { from: 'inflight', to: 'apf', color: 'amber' },
    { from: 'slow', to: 'json', color: 'rose' },
    { from: 'json', to: 'crd_json', color: 'amber' },
    { from: 'db', to: 'obj', color: 'rose' },
    { from: 'obj', to: 'cleanup', color: 'amber' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-400" />
        CRD Impact on Control Plane
      </h1>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-rose-400 mb-4">Symptom &rarr; Cause &rarr; Root Factor</h3>
        <FlowDiagram nodes={nodes} edges={edges} width={650} height={220} />
      </div>

      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6">
        <h3 className="text-rose-400 font-bold mb-3 text-lg">CRD Load Formula</h3>
        <div className="text-center">
          <p className="text-2xl font-mono text-white">
            CP Load = <span className="text-blue-400">CRD Types</span> &times; <span className="text-emerald-400">Object Size</span> &times; <span className="text-amber-400">Controller Pattern</span>
          </p>
          <p className="text-sm text-gray-400 mt-3">
            All three factors must be managed. Even few CRD types can cause issues if objects are large or controllers are inefficient
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-sm">
          <span className="text-blue-400 font-bold">etcd Impact:</span>{' '}
          <span className="text-gray-400">DB Size, Watch Stream, Request Size, List Cost</span>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 text-sm">
          <span className="text-emerald-400 font-bold">API Server Impact:</span>{' '}
          <span className="text-gray-400">JSON vs Protobuf, APF Seat Consumption, Watch Cache</span>
        </div>
      </div>
    </SlideWrapper>
  );
}
