import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Bell, AlertTriangle } from 'lucide-react';

export default function Slide17() {
  const alertCode = `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: agent-alerts
  namespace: monitoring
spec:
  groups:
    - name: AI Agent Alerts
      rules:
        - alert: AgentHighLatency
          expr: histogram_quantile(0.99,
                 sum(rate(agent_request_duration_seconds_bucket[5m]))
                 by (le, agent_name)) > 10
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Agent P99 latency > 10s"

        - alert: AgentHighErrorRate
          expr: sum(rate(agent_errors_total[5m]))
                / sum(rate(agent_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: critical`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
        알림 및 인시던트 대응
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-amber-400" />
            <h3 className="text-xl font-bold text-white">알림 채널</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
              <div className="text-sm text-purple-300 font-bold">Slack</div>
              <div className="text-xs text-gray-400 mt-1">
                실시간 알림 + 상황 요약
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <div className="text-sm text-blue-300 font-bold">PagerDuty</div>
              <div className="text-xs text-gray-400 mt-1">
                Critical 알림 + On-call 라우팅
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
              <div className="text-sm text-emerald-300 font-bold">SNS/Email</div>
              <div className="text-xs text-gray-400 mt-1">
                일일 리포트 + 트렌드 분석
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <h3 className="text-xl font-bold text-white">자동 대응</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">▸</span>
              <div>
                <strong>Rate Limit 초과</strong>
                <p className="text-xs text-gray-400">다른 모델로 자동 폴백</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">▸</span>
              <div>
                <strong>높은 오류율</strong>
                <p className="text-xs text-gray-400">이전 버전으로 롤백</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">▸</span>
              <div>
                <strong>모델 드리프트</strong>
                <p className="text-xs text-gray-400">자동 재학습 트리거</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <CodeBlock
        code={alertCode}
        language="yaml"
        title="prometheus-alert-rules.yaml"
      />
    </SlideWrapper>
  );
}
