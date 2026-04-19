import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { Badge } from '../components/Badge';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ObservabilityArch() {
  const nodes = [
    // Data Sources
    { id: 'apps', label: 'Applications\n메트릭/로그/트레이스', x: 30, y: 10, color: 'blue', width: 180, height: 55 },
    { id: 'k8s', label: 'Kubernetes\n이벤트/메트릭', x: 250, y: 10, color: 'blue', width: 170, height: 55 },
    { id: 'nodes', label: 'Nodes\n시스템 메트릭', x: 460, y: 10, color: 'blue', width: 150, height: 55 },
    // Collection
    { id: 'adot', label: 'ADOT Collector\nOpenTelemetry', x: 30, y: 120, color: 'orange', width: 180, height: 55 },
    { id: 'cwa', label: 'CloudWatch Agent\nContainer Insights', x: 250, y: 120, color: 'orange', width: 200, height: 55 },
    { id: 'prom', label: 'Prometheus\nkube-state-metrics', x: 490, y: 120, color: 'purple', width: 190, height: 55 },
    // Storage
    { id: 'cw', label: 'CloudWatch\nLogs & Metrics', x: 30, y: 240, color: 'orange', width: 180, height: 55 },
    { id: 'amp', label: 'Amazon Managed\nPrometheus', x: 260, y: 240, color: 'orange', width: 200, height: 55 },
    { id: 'graf', label: 'Grafana\n대시보드', x: 510, y: 240, color: 'emerald', width: 150, height: 55 },
    // Alerts
    { id: 'alarm', label: 'CloudWatch Alarms', x: 80, y: 350, color: 'rose', width: 180, height: 45 },
    { id: 'am', label: 'Alertmanager', x: 310, y: 350, color: 'rose', width: 150, height: 45 },
    { id: 'sns', label: 'SNS / PagerDuty\n/ Slack', x: 520, y: 340, color: 'rose', width: 170, height: 55 },
  ];

  const edges = [
    { from: 'apps', to: 'adot', color: 'orange' },
    { from: 'apps', to: 'cwa', color: 'orange' },
    { from: 'k8s', to: 'prom', color: 'purple' },
    { from: 'nodes', to: 'cwa', color: 'orange' },
    { from: 'adot', to: 'cw', color: 'orange' },
    { from: 'adot', to: 'amp', color: 'orange' },
    { from: 'cwa', to: 'cw', color: 'orange' },
    { from: 'prom', to: 'amp', color: 'purple' },
    { from: 'amp', to: 'graf', color: 'emerald' },
    { from: 'cw', to: 'graf', color: 'emerald', dashed: true },
    { from: 'cw', to: 'alarm', color: 'rose' },
    { from: 'amp', to: 'am', color: 'rose' },
    { from: 'alarm', to: 'sns', color: 'rose' },
    { from: 'am', to: 'sns', color: 'rose' },
  ];

  return (
    <SlideWrapper accent="emerald">
      <div className="flex items-center gap-4 mb-4">
        <BarChart3 size={40} className="text-emerald-400" />
        <div>
          <Badge color="emerald">Part 9</Badge>
          <h1 className="text-5xl font-bold mt-1">옵저버빌리티 아키텍처</h1>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-400 mb-4"
      >
        Metrics / Logs / Traces 수집 → 분석 → 알림 파이프라인
      </motion.p>
      <FlowDiagram nodes={nodes} edges={edges} width={720} height={420} />
    </SlideWrapper>
  );
}
