import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const MonitoringMetricsTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const metrics = [{
    metric: 'vllm:num_requests_running',
    description: isKo ? '실행 배치에 있는 요청 수 (Gauge)' : 'Requests in execution batches (Gauge)',
    normalRange: isKo ? '워크로드에 따라 다름' : 'Varies by workload'
  }, {
    metric: 'vllm:num_requests_waiting',
    description: isKo ? '스케줄링 대기 중인 요청 수 (Gauge)' : 'Requests waiting to be scheduled (Gauge)',
    normalRange: isKo ? 'SLO 선택값 (예: 지속적으로 높으면 용량 부족 신호)' : 'Workload SLO choice (sustained high values signal capacity pressure)'
  }, {
    metric: 'vllm:kv_cache_usage_perc',
    description: isKo ? 'KV Cache 사용률, 0~1 비율 (1 = 100%)' : 'KV cache usage as a 0–1 ratio (1 = 100%)',
    normalRange: isKo ? 'SLO 선택값 (예: 0.9 지속 시 선점/대기 증가)' : 'Workload SLO choice (e.g. ~0.9 sustained raises preemption/queueing)'
  }, {
    metric: 'rate(vllm:generation_tokens_total[1m])',
    description: isKo ? 'generation 토큰 Counter의 초당 생성률' : 'Per-second rate of the generation-token counter',
    normalRange: isKo ? '모델/GPU에 따라 다름' : 'Varies by model/GPU'
  }, {
    metric: 'rate(vllm:prompt_tokens_total[1m])',
    description: isKo ? 'prompt 토큰 Counter의 초당 처리율' : 'Per-second rate of the prompt-token counter',
    normalRange: isKo ? '모델/GPU에 따라 다름' : 'Varies by model/GPU'
  }, {
    metric: 'histogram_quantile(0.95, vllm:e2e_request_latency_seconds_bucket)',
    description: isKo ? 'e2e 요청 지연 Histogram의 P95 (초)' : 'P95 of the e2e request-latency histogram (seconds)',
    normalRange: isKo ? 'SLO 선택값 (예: P95 < 30s)' : 'Workload SLO choice (e.g. P95 < 30s)'
  }];
  return <div style={{
    maxWidth: '100%',
    margin: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    overflowX: 'auto'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? '주요 모니터링 메트릭' : 'Key Monitoring Metrics'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-background-surface-color)'
          }}>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '280px'
            }}>
                {isKo ? '메트릭' : 'Metric'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '220px'
            }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '140px'
            }}>
                {isKo ? '정상 범위' : 'Normal Range'}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => <tr key={index}>
                <td style={{
              padding: '12px 16px',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: '500',
              color: '#059669',
              borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {metric.metric}
                </td>
                <td style={{
              padding: '12px 16px',
              color: 'var(--ifm-font-color-base)',
              borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {metric.description}
                </td>
                <td style={{
              padding: '12px 16px',
              color: 'var(--ifm-color-emphasis-600)',
              fontWeight: '500',
              borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {metric.normalRange}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default MonitoringMetricsTable;