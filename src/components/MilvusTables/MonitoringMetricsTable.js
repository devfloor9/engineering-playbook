import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringMetricsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'milvus_proxy_search_latency',
      description: isKo ? '검색 지연 시간' : 'Search latency',
      threshold: '< 100ms'
    },
    {
      metric: 'milvus_querynode_search_nq',
      description: isKo ? '초당 검색 쿼리 수' : 'Queries per second',
      threshold: isKo ? '모니터링' : 'Monitor'
    },
    {
      metric: 'milvus_datanode_flush_duration',
      description: isKo ? '데이터 플러시 시간' : 'Data flush time',
      threshold: '< 5s'
    },
    {
      metric: 'milvus_indexnode_build_duration',
      description: isKo ? '인덱스 빌드 시간' : 'Index build time',
      threshold: isKo ? '모니터링' : 'Monitor'
    },
    {
      metric: 'milvus_proxy_collection_loaded',
      description: isKo ? '로드된 컬렉션 수 (Milvus 2.4+)' : 'Loaded collections (Milvus 2.4+)',
      threshold: isKo ? '모니터링' : 'Monitor'
    },
    {
      metric: 'milvus_querynode_segment_num',
      description: isKo ? 'Query Node 세그먼트 수 (Milvus 2.4+)' : 'Query Node segments (Milvus 2.4+)',
      threshold: isKo ? '모니터링' : 'Monitor'
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
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
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
                minWidth: '120px'
              }}>
                {isKo ? '임계값' : 'Threshold'}
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

export default MonitoringMetricsTable;
