import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TokenUsageMetricsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'llm_input_tokens_total',
      description: isKo ? '입력 토큰 총합' : 'Total input tokens',
      purpose: isKo ? '프롬프트 최적화' : 'Prompt optimization'
    },
    {
      metric: 'llm_output_tokens_total',
      description: isKo ? '출력 토큰 총합' : 'Total output tokens',
      purpose: isKo ? '응답 길이 분석' : 'Response length analysis'
    },
    {
      metric: 'llm_total_tokens_total',
      description: isKo ? '전체 토큰 총합' : 'Total tokens',
      purpose: isKo ? '비용 추적' : 'Cost tracking'
    },
    {
      metric: 'llm_cost_dollars_total',
      description: isKo ? '추정 비용 (USD)' : 'Estimated cost (USD)',
      purpose: isKo ? '예산 관리' : 'Budget management'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Token Usage 메트릭' : 'Token Usage Metrics'}
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
                minWidth: '220px'
              }}>
                {isKo ? '메트릭' : 'Metric'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '180px'
              }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '180px'
              }}>
                {isKo ? '모니터링 목적' : 'Monitoring Purpose'}
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
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenUsageMetricsTable;
