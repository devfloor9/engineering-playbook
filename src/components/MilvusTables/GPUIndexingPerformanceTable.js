import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GPUIndexingPerformanceTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const comparisons = [
    {
      indexType: isKo ? 'IVF_FLAT (1M 벡터)' : 'IVF_FLAT (1M vectors)',
      cpuTime: isKo ? '45분' : '45 min',
      gpuTime: isKo ? '8분' : '8 min',
      speedup: isKo ? '5.6배' : '5.6x'
    },
    {
      indexType: isKo ? 'HNSW (1M 벡터)' : 'HNSW (1M vectors)',
      cpuTime: isKo ? '120분' : '120 min',
      gpuTime: isKo ? '25분' : '25 min',
      speedup: isKo ? '4.8배' : '4.8x'
    },
    {
      indexType: isKo ? 'IVF_SQ8 (10M 벡터)' : 'IVF_SQ8 (10M vectors)',
      cpuTime: isKo ? '8시간' : '8 hours',
      gpuTime: isKo ? '90분' : '90 min',
      speedup: isKo ? '5.3배' : '5.3x'
    },
    {
      indexType: isKo ? 'SCANN (1M 벡터)' : 'SCANN (1M vectors)',
      cpuTime: isKo ? '60분' : '60 min',
      gpuTime: isKo ? '12분' : '12 min',
      speedup: isKo ? '5.0배' : '5.0x'
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
        {isKo ? 'GPU 인덱싱 성능 비교' : 'GPU Indexing Performance Comparison'}
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
                {isKo ? '인덱스 타입' : 'Index Type'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? 'CPU 빌드 시간' : 'CPU Build Time'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#059669',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '180px',
                background: '#f0fdf4'
              }}>
                {isKo ? 'GPU 빌드 시간 (A10G)' : 'GPU Build Time (A10G)'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '120px'
              }}>
                {isKo ? '속도 향상' : 'Speedup'}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comp, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.indexType}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.cpuTime}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#059669',
                  fontWeight: '600',
                  background: '#f0fdf4',
                  borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.gpuTime}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.speedup}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GPUIndexingPerformanceTable;
