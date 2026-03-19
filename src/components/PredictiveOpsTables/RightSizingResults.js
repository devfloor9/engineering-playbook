import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RightSizingResults = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const results = [
    {
      metric: isKo ? 'CPU requests 합계' : isZh ? 'CPU requests 总计' : 'Total CPU requests',
      before: '32 vCPU',
      after: '18 vCPU',
      savings: '44%',
      color: '#ef4444'
    },
    {
      metric: isKo ? 'Memory requests 합계' : isZh ? 'Memory requests 总计' : 'Total memory requests',
      before: '64 GiB',
      after: '38 GiB',
      savings: '41%',
      color: '#f97316'
    },
    {
      metric: isKo ? '노드 수' : isZh ? '节点数' : 'Node count',
      before: isKo ? '8대' : isZh ? '8 个节点' : '8 nodes',
      after: isKo ? '5대' : isZh ? '5 个节点' : '5 nodes',
      savings: '37%',
      color: '#f59e0b'
    },
    {
      metric: isKo ? '월간 비용' : isZh ? '月度成本' : 'Monthly cost',
      before: '$1,200',
      after: '$720',
      savings: '40%',
      color: '#10b981'
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: 'var(--ifm-background-surface-color)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: '1.6'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
    color: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: '0.95rem',
    opacity: 0.95,
    fontWeight: '400'
  };

  const contentStyle = {
    padding: '1.5rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  };

  const cardStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    backgroundColor: 'var(--ifm-background-surface-color)',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  });

  const metricLabelStyle = {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: 'var(--ifm-font-color-base)',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    marginBottom: '1rem'
  };

  const comparisonStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  };

  const valueBoxStyle = (isAfter) => ({
    flex: 1,
    padding: '0.625rem',
    borderRadius: '6px',
    backgroundColor: isAfter ? '#d1fae5' : '#fee2e2',
    textAlign: 'center'
  });

  const valueStyle = {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--ifm-font-color-base)'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: 'var(--ifm-color-emphasis-600)',
    marginTop: '0.25rem'
  };

  const arrowStyle = {
    margin: '0 0.75rem',
    fontSize: '1.25rem',
    color: '#059669',
    fontWeight: '700'
  };

  const savingsBadgeStyle = (color, savings) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '1.125rem',
    fontWeight: '700',
    width: '100%',
    textAlign: 'center'
  });

  const footerStyle = {
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    color: 'var(--ifm-color-emphasis-700)',
    borderTop: '2px solid #fbbf24',
    lineHeight: '1.6'
  };

  const footerLabelStyle = {
    fontWeight: '700',
    color: 'var(--ifm-color-emphasis-700)'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>💰 {isKo ? 'AI Right-Sizing 효과' : isZh ? 'AI Right-Sizing 效果' : 'AI Right-Sizing Results'}</h2>
        <p style={subtitleStyle}>{isKo ? 'VPA + ML 기반 자동 리소스 최적화 결과' : isZh ? '基于 VPA + ML 的自动资源优化结果' : 'VPA + ML-based Automated Resource Optimization Results'}</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {results.map((item, index) => (
            <div key={index} style={cardStyle(item.color)}>
              <div style={metricLabelStyle}>{item.metric}</div>
              <div style={comparisonStyle}>
                <div style={valueBoxStyle(false)}>
                  <div style={valueStyle}>{item.before}</div>
                  <div style={labelStyle}>Before</div>
                </div>
                <div style={arrowStyle}>→</div>
                <div style={valueBoxStyle(true)}>
                  <div style={valueStyle}>{item.after}</div>
                  <div style={labelStyle}>After</div>
                </div>
              </div>
              <div style={savingsBadgeStyle(item.color)}>
                {item.savings} {isKo ? '절감' : isZh ? '节省' : 'saved'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>{isKo ? '핵심 효과:' : isZh ? '核心影响：' : 'Key Impact:'}</span> {isKo ? 'Container Insights 기반 실제 리소스 사용 패턴을 분석하여 과도하게 할당된 requests를 최적화함으로써 노드 수를 37% 감축하고 월간 비용을 40% 절감했습니다.' : isZh ? '通过分析基于 Container Insights 的实际资源使用模式，优化过度分配的 requests，将节点数减少了 37%，月度成本降低了 40%。' : 'By analyzing actual resource usage patterns based on Container Insights and optimizing over-allocated requests, we reduced node count by 37% and monthly costs by 40%.'}
      </div>
    </div>
  );
};

export default RightSizingResults;
