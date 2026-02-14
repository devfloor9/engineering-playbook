import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringMetricsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'vllm_num_requests_running',
      description: isKo ? '현재 처리 중인 요청 수' : 'Number of currently processing requests',
      normalRange: isKo ? '워크로드에 따라 다름' : 'Varies by workload'
    },
    {
      metric: 'vllm_num_requests_waiting',
      description: isKo ? '대기 중인 요청 수' : 'Number of waiting requests',
      normalRange: '< 50'
    },
    {
      metric: 'vllm_gpu_cache_usage_perc',
      description: isKo ? 'GPU KV Cache 사용률' : 'GPU KV Cache utilization',
      normalRange: '60-90%'
    },
    {
      metric: 'vllm_avg_generation_throughput_toks_per_s',
      description: isKo ? '초당 생성 토큰 수' : 'Tokens generated per second',
      normalRange: isKo ? '모델/GPU에 따라 다름' : 'Varies by model/GPU'
    },
    {
      metric: 'vllm_avg_prompt_throughput_toks_per_s',
      description: isKo ? '초당 프롬프트 처리 토큰 수' : 'Prompt tokens processed per second',
      normalRange: isKo ? '모델/GPU에 따라 다름' : 'Varies by model/GPU'
    },
    {
      metric: 'vllm_e2e_request_latency_seconds',
      description: isKo ? '요청 전체 지연시간' : 'End-to-end request latency',
      normalRange: 'P95 < 30s'
    }
  ];

  return (
    <div style={{
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '280px'
              }}>
                {isKo ? '메트릭' : 'Metric'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '220px'
              }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '정상 범위' : 'Normal Range'}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index}>
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
                  color: '#6b7280',
                  fontWeight: '500',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.normalRange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitoringMetricsTable;
