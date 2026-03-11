import { SlideWrapper, FlowDiagram, Card } from '@shared/components';
import { Activity, BarChart3, Eye } from 'lucide-react';

export function Slide14() {
  const nodes = [
    { id: 'nma', label: 'NMA', x: 50, y: 100, width: 120, color: 'blue', description: 'Node Health' },
    { id: 'nth', label: 'NTH', x: 50, y: 200, width: 120, color: 'rose', description: 'Spot Handler' },
    { id: 'prom', label: 'Prometheus', x: 250, y: 80, width: 140, color: 'orange', description: 'Metrics' },
    { id: 'cw', label: 'CloudWatch', x: 250, y: 180, width: 140, color: 'cyan', description: 'AWS Native' },
    { id: 'grafana', label: 'Grafana', x: 470, y: 130, width: 140, color: 'emerald', description: 'Visualization' },
    { id: 'alert', label: 'Alerting', x: 680, y: 130, width: 120, color: 'amber', description: 'Notifications' },
  ];

  const edges = [
    { from: 'nma', to: 'prom', label: ':8080', color: 'blue' },
    { from: 'nma', to: 'cw', label: 'Events', color: 'blue' },
    { from: 'nth', to: 'cw', label: 'Logs', color: 'rose' },
    { from: 'prom', to: 'grafana', label: 'Query', color: 'orange' },
    { from: 'cw', to: 'grafana', label: 'Query', color: 'cyan' },
    { from: 'grafana', to: 'alert', label: 'Rules', color: 'emerald' },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">모니터링 통합</h2>

      <FlowDiagram
        nodes={nodes}
        edges={edges}
        width={850}
        height={330}
        title="통합 모니터링 아키텍처"
      />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card title="Prometheus 통합" icon={<Activity className="w-5 h-5" />} color="orange">
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">NMA 메트릭 수집</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 포트 8080에서 메트릭 노출</li>
              <li>• Node Exporter와 함께 사용</li>
              <li>• kube-state-metrics 보완</li>
              <li>• 커스텀 PromQL 쿼리</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs font-mono text-orange-400">
                scrape_configs: NMA :8080
              </p>
            </div>
          </div>
        </Card>

        <Card title="CloudWatch 통합" icon={<BarChart3 className="w-5 h-5" />} color="cyan">
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">AWS 네이티브 모니터링</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Node Conditions 메트릭</li>
              <li>• Events 로그</li>
              <li>• CloudWatch Alarms</li>
              <li>• Container Insights 연동</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs font-mono text-cyan-400">
                Namespace: ContainerInsights
              </p>
            </div>
          </div>
        </Card>

        <Card title="Grafana 대시보드" icon={<Eye className="w-5 h-5" />} color="emerald">
          <div className="space-y-2 text-sm">
            <p className="text-gray-400">통합 시각화</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 노드 상태 대시보드</li>
              <li>• Spot 중단 추적</li>
              <li>• 문제 노드 식별</li>
              <li>• 히스토리컬 분석</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs font-mono text-emerald-400">
                Data Sources: Prom + CW
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/30">
        <h4 className="text-purple-400 font-bold mb-3">다층 모니터링 스택</h4>
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-blue-400 font-semibold mb-1">L1: 상태 감지</p>
            <p className="text-gray-500 text-xs">NMA - 노드 문제 조기 감지</p>
          </div>
          <div>
            <p className="text-emerald-400 font-semibold mb-1">L2: 메트릭 수집</p>
            <p className="text-gray-500 text-xs">Prometheus - 상세 성능 데이터</p>
          </div>
          <div>
            <p className="text-rose-400 font-semibold mb-1">L3: 자동 대응</p>
            <p className="text-gray-500 text-xs">Node Auto Repair - 자동 교체</p>
          </div>
          <div>
            <p className="text-purple-400 font-semibold mb-1">L4: 통합 대시보드</p>
            <p className="text-gray-500 text-xs">Grafana - 종합 모니터링</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
