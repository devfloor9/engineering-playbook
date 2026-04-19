import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { Activity, Eye, Target } from 'lucide-react';

export default function ContainerInsights() {
  return (
    <SlideWrapper accent="emerald">
      <Badge color="emerald">Observability</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">Container Insights & Application Signals</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="Enhanced 모니터링" icon={<Activity size={22} />} accent="emerald" delay={0.1}>
          <p>CloudWatch Agent가 노드/Pod/컨테이너 메트릭 자동 수집</p>
          <p className="text-emerald-400 mt-2 font-semibold">CPU, 메모리, 네트워크, 디스크 I/O</p>
          <p className="text-gray-400 mt-1">Fluent Bit으로 로그 수집 통합</p>
        </Card>
        <Card title="Application Signals" icon={<Eye size={22} />} accent="emerald" delay={0.2}>
          <p>ADOT 기반 <span className="text-emerald-400 font-bold">분산 추적 자동화</span></p>
          <p className="mt-2">X-Ray 트레이스 + CloudWatch 메트릭 통합</p>
          <p className="text-gray-400 mt-1">서비스 맵, 레이턴시, 에러율 자동 계산</p>
        </Card>
        <Card title="SLI/SLO 기반 알림" icon={<Target size={22} />} accent="blue" delay={0.3}>
          <p>가용성: <span className="text-blue-400 font-bold">99.9% SLO</span></p>
          <p className="mt-2">레이턴시 P99, 에러율 기반 SLI 측정</p>
          <p className="text-gray-400 mt-1">Error Budget 소진율로 알림 트리거</p>
        </Card>
      </div>

      <CodeBlock title="Container Insights 설정 및 핵심 PromQL" delay={0.4}>
{`# Container Insights Add-on 설치
aws eks create-addon --cluster-name $CLUSTER \\
  --addon-name amazon-cloudwatch-observability

# CPU Throttling 감지 (25% 이상 → 성능 저하)
sum(rate(container_cpu_cfs_throttled_periods_total{namespace="prod"}[5m]))
/ sum(rate(container_cpu_cfs_periods_total{namespace="prod"}[5m])) > 0.25

# OOMKilled 감지
kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} > 0

# Node 메모리 85% 초과 경고
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 85`}
      </CodeBlock>
    </SlideWrapper>
  );
}
