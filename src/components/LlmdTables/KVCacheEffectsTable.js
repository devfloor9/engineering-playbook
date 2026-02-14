import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KVCacheEffectsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: isKo ? 'TTFT (Time To First Token)' : 'TTFT (Time To First Token)',
      cacheMiss: isKo ? '높음 (전체 prefill 필요)' : 'High (full prefill required)',
      cacheHit: isKo ? '낮음 (prefill 스킵)' : 'Low (prefill skipped)',
      improvement: isKo ? '50-80% 단축' : '50-80% reduction'
    },
    {
      metric: isKo ? 'GPU 연산량' : 'GPU Computation',
      cacheMiss: isKo ? '전체 prompt 처리' : 'Full prompt processing',
      cacheHit: isKo ? '새로운 토큰만 처리' : 'Only new tokens processed',
      improvement: isKo ? '연산 절약' : 'Computation savings'
    },
    {
      metric: isKo ? '처리량 (Throughput)' : 'Throughput',
      cacheMiss: isKo ? '기본' : 'Baseline',
      cacheHit: isKo ? '향상' : 'Improved',
      improvement: isKo ? '1.5-3x 향상' : '1.5-3x improvement'
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
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'KV Cache-aware 라우팅의 효과' : 'Effects of KV Cache-aware Routing'}
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
                minWidth: '200px'
              }}>
                {isKo ? '지표' : 'Metric'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '160px'
              }}>
                {isKo ? 'Cache Miss (기존 방식)' : 'Cache Miss (Traditional)'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#059669',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '160px',
                background: '#f0fdf4'
              }}>
                {isKo ? 'Cache Hit (llm-d)' : 'Cache Hit (llm-d)'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '개선 효과' : 'Improvement'}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.metric}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.cacheMiss}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#059669',
                  fontWeight: '500',
                  background: '#f0fdf4',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.cacheHit}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {metric.improvement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KVCacheEffectsTable;
