import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const IndexComparisonTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const indexes = [
    {
      indexType: 'FLAT',
      searchSpeed: isKo ? '느림' : 'Slow',
      accuracy: '100%',
      memoryUsage: isKo ? '높음' : 'High',
      useCase: isKo ? '소규모 데이터, 정확도 중요' : 'Small datasets, accuracy critical',
      color: '#dc2626'
    },
    {
      indexType: 'IVF_FLAT',
      searchSpeed: isKo ? '빠름' : 'Fast',
      accuracy: isKo ? '높음' : 'High',
      memoryUsage: isKo ? '중간' : 'Medium',
      useCase: isKo ? '일반적인 사용 사례' : 'General use case',
      color: '#059669'
    },
    {
      indexType: 'IVF_SQ8',
      searchSpeed: isKo ? '매우 빠름' : 'Very fast',
      accuracy: isKo ? '중간' : 'Medium',
      memoryUsage: isKo ? '낮음' : 'Low',
      useCase: isKo ? '대규모 데이터, 메모리 제한' : 'Large datasets, memory limited',
      color: '#3b82f6'
    },
    {
      indexType: 'HNSW',
      searchSpeed: isKo ? '매우 빠름' : 'Very fast',
      accuracy: isKo ? '높음' : 'High',
      memoryUsage: isKo ? '높음' : 'High',
      useCase: isKo ? '실시간 검색, 고성능 필요' : 'Real-time search, high performance',
      color: '#8b5cf6'
    },
    {
      indexType: 'SCANN',
      searchSpeed: isKo ? '매우 빠름' : 'Very fast',
      accuracy: isKo ? '높음' : 'High',
      memoryUsage: isKo ? '중간' : 'Medium',
      useCase: isKo ? '속도와 정확도 균형 (Milvus 2.4+)' : 'Balance of speed and accuracy (Milvus 2.4+)',
      color: '#f59e0b'
    },
    {
      indexType: 'DISKANN',
      searchSpeed: isKo ? '빠름' : 'Fast',
      accuracy: isKo ? '높음' : 'High',
      memoryUsage: isKo ? '매우 낮음' : 'Very low',
      useCase: isKo ? '초대규모 데이터' : 'Ultra-large datasets',
      color: '#06b6d4'
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
        {isKo ? '주요 인덱스 타입 비교' : 'Main Index Type Comparison'}
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
                minWidth: '120px'
              }}>
                {isKo ? '인덱스 타입' : 'Index Type'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '100px'
              }}>
                {isKo ? '검색 속도' : 'Search Speed'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '80px'
              }}>
                {isKo ? '정확도' : 'Accuracy'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '100px'
              }}>
                {isKo ? '메모리 사용' : 'Memory Usage'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '250px'
              }}>
                {isKo ? '적합한 사용 사례' : 'Best Use Case'}
              </th>
            </tr>
          </thead>
          <tbody>
            {indexes.map((index, idx) => (
              <tr key={idx}>
                <td style={{
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  color: index.color,
                  fontSize: '13px',
                  borderBottom: idx < indexes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {index.indexType}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: idx < indexes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {index.searchSpeed}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: idx < indexes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {index.accuracy}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: idx < indexes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {index.memoryUsage}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: idx < indexes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {index.useCase}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndexComparisonTable;
