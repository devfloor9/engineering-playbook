import { SlideWrapper, FlowDiagram } from '@shared/components';

export function Slide04() {
  const nodes = [
    { id: 'agent', label: 'NMA', x: 50, y: 50, width: 120, color: 'blue', description: 'DaemonSet' },
    { id: 'monitors', label: 'Monitors', x: 250, y: 50, width: 140, color: 'emerald', description: 'Runtime/Storage/Network' },
    { id: 'conditions', label: 'Node Conditions', x: 480, y: 30, width: 160, color: 'purple', description: 'Status Reports' },
    { id: 'events', label: 'Events', x: 480, y: 120, width: 160, color: 'amber', description: 'Problem Alerts' },
    { id: 'cloudwatch', label: 'CloudWatch', x: 710, y: 70, width: 140, color: 'cyan', description: 'Central Monitoring' },
  ];

  const edges = [
    { from: 'agent', to: 'monitors', label: 'Execute', color: 'blue' },
    { from: 'monitors', to: 'conditions', label: 'Update', color: 'emerald' },
    { from: 'monitors', to: 'events', label: 'Create', color: 'amber' },
    { from: 'conditions', to: 'cloudwatch', label: 'Export', color: 'purple' },
    { from: 'events', to: 'cloudwatch', label: 'Send', color: 'amber' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">아키텍처</h2>

      <FlowDiagram
        nodes={nodes}
        edges={edges}
        width={900}
        height={220}
        title="NMA 데이터 플로우"
      />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-900 rounded-lg p-4 border border-blue-500/30">
          <h4 className="text-blue-400 font-bold mb-2 text-sm">Agent Startup</h4>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Parse CLI Flags</li>
            <li>• Initialize Logger</li>
            <li>• Setup Signal Context</li>
            <li>• Configure REST Client</li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-emerald-500/30">
          <h4 className="text-emerald-400 font-bold mb-2 text-sm">Monitor Manager</h4>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Register Monitors</li>
            <li>• Execute System Checks</li>
            <li>• Update Conditions</li>
            <li>• Record Events</li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 border border-purple-500/30">
          <h4 className="text-purple-400 font-bold mb-2 text-sm">Observability</h4>
          <ul className="text-gray-400 text-xs space-y-1">
            <li>• Health Probe :8081</li>
            <li>• Metrics :8080</li>
            <li>• PProf :8082</li>
            <li>• Console Diagnostics</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-xl p-4 border border-cyan-500/30">
        <p className="text-sm text-gray-300">
          <span className="text-cyan-400 font-semibold">Controller Runtime Loop:</span> Node Exporter → Monitor Manager → System Checks → Update Node Conditions → Record Events → Export Metrics
        </p>
      </div>
    </SlideWrapper>
  );
}
