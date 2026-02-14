import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LatencyMetricsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'agent_request_duration_seconds',
      description: isKo ? '전체 요청 처리 시간' : 'Total request processing time',
      target: 'P95 < 5s',
      threshold: 'P99 > 10s'
    },
    {
      metric: 'llm_inference_duration_seconds',
      description: isKo ? 'LLM 추론 시간' : 'LLM inference time',
      target: 'P95 < 3s',
      threshold: 'P99 > 8s'
    },
    {
      metric: 'tool_execution_duration_seconds',
      description: isKo ? '도구 실행 시간' : 'Tool execution time',
      target: 'P95 < 1s',
      threshold: 'P99 > 3s'
    },
    {
      metric: 'vector_search_duration_seconds',
      description: isKo ? '벡터 검색 시간' : 'Vector search time',
      target: 'P95 < 200ms',
      threshold: 'P99 > 500ms'
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
        {isKo ? 'Latency 메트릭' : 'Latency Metrics'}
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
                minWidth: '260px'
              }}>
                {isKo ? '메트릭' : 'Metric'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '200px'
              }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '100px'
              }}>
                {isKo ? '목표값' : 'Target'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '120px'
              }}>
                {isKo ? '알림 임계값' : 'Alert Threshold'}
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
                  color: '#059669',
                  fontWeight: '600',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.target}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.threshold}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LatencyMetricsTable;
