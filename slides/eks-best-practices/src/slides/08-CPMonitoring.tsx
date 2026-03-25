import { SlideWrapper, Card } from '@shared/components';
import { Activity, Eye, FileText, Lightbulb } from 'lucide-react';

export default function CPMonitoringSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <Activity className="w-12 h-12 text-cyan-400" />
        Control Plane Monitoring — 4 Channels
      </h1>

      <div className="grid grid-cols-2 gap-6">
        <Card title="CloudWatch Vended Metrics" icon={<Activity className="w-6 h-6" />} color="blue">
          <div className="space-y-1">
            <p className="text-emerald-400 text-xs font-bold">Auto &middot; Free &middot; v1.28+</p>
            <p>API Request Total / 4xx / 5xx / 429</p>
            <p>etcd Storage Size</p>
            <p>Scheduler Attempts</p>
            <p className="text-blue-400 text-xs mt-2">PCP: executing seats, mvcc db size</p>
          </div>
        </Card>

        <Card title="Prometheus Endpoint" icon={<Eye className="w-6 h-6" />} color="emerald">
          <div className="space-y-1">
            <p className="text-amber-400 text-xs font-bold">Manual Setup &middot; v1.28+</p>
            <p>KCM: workqueue_depth, retries</p>
            <p>KSH: pending_pods, duration</p>
            <p>etcd: detailed mvcc metrics</p>
            <p className="text-emerald-400 text-xs mt-2">AMP Agentless Scraper supported</p>
          </div>
        </Card>

        <Card title="Control Plane Logging" icon={<FileText className="w-6 h-6" />} color="amber">
          <div className="space-y-1">
            <p className="text-cyan-400 text-xs font-bold">Manual Enable &middot; CW Logs</p>
            <p>API / Audit / Auth / CM / Scheduler</p>
            <p className="mt-2">CRD API call pattern analysis:</p>
            <code className="text-xs text-gray-400 block bg-gray-800 p-1 rounded mt-1">
              filter requestURI like /customresourcedefinitions/
            </code>
          </div>
        </Card>

        <Card title="Cluster Insights" icon={<Lightbulb className="w-6 h-6" />} color="purple">
          <div className="space-y-1">
            <p className="text-emerald-400 text-xs font-bold">Auto &middot; Free</p>
            <p>Upgrade Readiness</p>
            <p>Configuration Issues</p>
            <p>Addon Compatibility</p>
            <p>Cluster Health Issues</p>
          </div>
        </Card>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        Recommended: Phase 1 CW Alarms &rarr; Phase 2 Prometheus &rarr; Phase 3 PCP &rarr; Phase 4 Continuous Optimization
      </div>
    </SlideWrapper>
  );
}
