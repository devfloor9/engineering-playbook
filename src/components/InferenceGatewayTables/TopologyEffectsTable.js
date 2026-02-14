import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TopologyEffectsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      id: 'cross-az-traffic',
      metric: isKo ? '크로스 AZ 트래픽' : isZh ? '跨 AZ 流量' : 'Cross-AZ Traffic',
      before: isKo ? '높음' : isZh ? '高' : 'High',
      after: isKo ? '최소화' : isZh ? '最小化' : 'Minimized',
      improvement: isKo ? '데이터 전송 비용 50% 절감' : isZh ? '数据传输成本降低 50%' : '50% data transfer cost savings',
      color: '#10b981'
    },
    {
      id: 'latency',
      metric: isKo ? '지연 시간' : isZh ? '延迟' : 'Latency',
      before: isKo ? '높음 (크로스 AZ)' : isZh ? '高（跨 AZ）' : 'High (cross-AZ)',
      after: isKo ? '낮음 (동일 AZ)' : isZh ? '低（同一 AZ）' : 'Low (same AZ)',
      improvement: isKo ? 'P99 지연 시간 30-40% 개선' : isZh ? 'P99 延迟改善 30-40%' : '30-40% P99 latency improvement',
      color: '#3b82f6'
    },
    {
      id: 'bandwidth',
      metric: isKo ? '네트워크 대역폭' : isZh ? '网络带宽' : 'Network Bandwidth',
      before: isKo ? '제한적' : isZh ? '受限' : 'Limited',
      after: isKo ? '최적화' : isZh ? '优化' : 'Optimized',
      improvement: isKo ? '처리량 20-30% 향상' : isZh ? '吞吐量提升 20-30%' : '20-30% throughput increase',
      color: '#8b5cf6'
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '🚀 Topology-Aware Routing 효과' : isZh ? '🚀 拓扑感知路由效果' : '🚀 Topology-Aware Routing Effects'}
      </div>

      <div style={{
        overflowX: 'auto',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '20%'
              }}>
                {isKo ? '지표' : isZh ? '指标' : 'Metric'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '20%'
              }}>
                {isKo ? '기존 방식' : isZh ? '传统方式' : 'Before'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '20%'
              }}>
                {isKo ? 'Topology-Aware' : isZh ? '拓扑感知' : 'Topology-Aware'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '40%'
              }}>
                {isKo ? '개선 효과' : isZh ? '改善效果' : 'Improvement'}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((item, index) => (
              <tr key={item.id} style={{
                background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-50)'
              }}>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  fontWeight: '600'
                }}>
                  {item.metric}
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  textAlign: 'center'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {item.before}
                  </span>
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                  textAlign: 'center'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {item.after}
                  </span>
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      borderRadius: '2px',
                      background: item.color
                    }}></div>
                    <span style={{ fontWeight: '500' }}>{item.improvement}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopologyEffectsTable;
