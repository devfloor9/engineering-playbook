import { SlideWrapper, Card } from '@shared/components';
import { BookOpen, Server, Shield, RefreshCw } from 'lucide-react';

export default function OverviewSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-12 flex items-center gap-4">
        <BookOpen className="w-12 h-12 text-blue-400" />
        Overview
      </h1>

      <div className="grid grid-cols-3 gap-6">
        <Card title="Control Plane Deep Dive" icon={<Server className="w-6 h-6" />} color="blue">
          <ul className="space-y-2">
            <li>Internal CP Architecture</li>
            <li>etcd &amp; VAS Autoscaling</li>
            <li>Provisioned Control Plane (PCP)</li>
            <li>CRD Impact Analysis &amp; Monitoring</li>
            <li>CRD Design Best Practices</li>
          </ul>
        </Card>

        <Card title="API Server AuthN/AuthZ" icon={<Shield className="w-6 h-6" />} color="emerald">
          <ul className="space-y-2">
            <li>5 Authentication Methods</li>
            <li>IAM + Access Entry</li>
            <li>Pod Identity (IRSA v2)</li>
            <li>Auth Mode Migration</li>
            <li>Authorization Best Practices</li>
          </ul>
        </Card>

        <Card title="Cross-Cluster HA" icon={<RefreshCw className="w-6 h-6" />} color="amber">
          <ul className="space-y-2">
            <li>3 Replication Pattern Comparison</li>
            <li>GitOps Agent-based Pull</li>
            <li>Active-Active vs Passive</li>
            <li>Companion Tool Stack</li>
            <li>Recommended Combinations</li>
          </ul>
        </Card>
      </div>

      <div className="mt-10 text-center text-gray-500 text-sm">
        19 slides &middot; ~30 min &middot; EKS 1.32+
      </div>
    </SlideWrapper>
  );
}
