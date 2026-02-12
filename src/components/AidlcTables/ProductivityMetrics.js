import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ProductivityMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const categories = [
    {
      name: isKo ? '생산성' : 'Productivity',
      color: '#3b82f6',
      metrics: [
        {
          name: isKo ? '코드 생성 속도' : 'Code Generation Speed',
          before: isKo ? '100 LOC/일' : '100 LOC/day',
          after: isKo ? '500 LOC/일' : '500 LOC/day',
          improvement: '+400%',
          positive: true
        },
        {
          name: isKo ? 'PR 리뷰 시간' : 'PR Review Time',
          before: isKo ? '4시간' : '4 hours',
          after: isKo ? '30분' : '30 min',
          improvement: '-87%',
          positive: true
        },
        {
          name: isKo ? '배포 빈도' : 'Deployment Frequency',
          before: isKo ? '주 1회' : '1x/week',
          after: isKo ? '일 5회' : '5x/day',
          improvement: '+5x',
          positive: true
        }
      ]
    },
    {
      name: isKo ? '품질' : 'Quality',
      color: '#059669',
      metrics: [
        {
          name: isKo ? '버그 밀도' : 'Bug Density',
          before: isKo ? '15건/1K LOC' : '15/1K LOC',
          after: isKo ? '3건/1K LOC' : '3/1K LOC',
          improvement: '-80%',
          positive: true
        },
        {
          name: isKo ? '테스트 커버리지' : 'Test Coverage',
          before: '45%',
          after: '85%',
          improvement: '+89%',
          positive: true
        },
        {
          name: isKo ? '보안 취약점' : 'Security Vulnerabilities',
          before: isKo ? '수동 스캔' : 'Manual Scan',
          after: isKo ? 'AI 실시간 스캔' : 'AI Real-time Scan',
          improvement: isKo ? '자동화' : 'Automated',
          positive: true
        }
      ]
    },
    {
      name: isKo ? '운영' : 'Operations',
      color: '#8b5cf6',
      metrics: [
        {
          name: 'MTTR',
          before: isKo ? '4시간' : '4 hours',
          after: isKo ? '45분' : '45 min',
          improvement: '-81%',
          positive: true
        },
        {
          name: isKo ? '변경 실패율' : 'Change Failure Rate',
          before: '15%',
          after: '3%',
          improvement: '-80%',
          positive: true
        },
        {
          name: isKo ? 'SLO 달성률' : 'SLO Achievement',
          before: '95%',
          after: '99.5%',
          improvement: '+4.7%',
          positive: true
        }
      ]
    }
  ];

  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '8px 8px 0 0',
      marginBottom: '1.5rem'
    },
    title: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.5rem',
      fontWeight: '600'
    },
    subtitle: {
      margin: 0,
      fontSize: '0.875rem',
      opacity: 0.9
    },
    categoriesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    categorySection: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    categoryHeader: {
      display: 'inline-block',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontSize: '1rem',
      fontWeight: '600',
      color: 'white',
      marginBottom: '1rem'
    },
    metricsTable: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    metricRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr',
      gap: '1rem',
      alignItems: 'center',
      padding: '0.75rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.875rem'
    },
    metricName: {
      fontWeight: '500',
      color: '#111827'
    },
    metricValue: {
      color: '#4b5563'
    },
    beforeValue: {
      color: '#6b7280'
    },
    afterValue: {
      color: '#059669',
      fontWeight: '500'
    },
    improvement: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
      fontSize: '0.8125rem',
      fontWeight: '600'
    },
    improvementBar: {
      width: '4px',
      height: '16px',
      borderRadius: '2px',
      flexShrink: 0
    },
    improvementPositive: {
      color: '#059669'
    },
    columnHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr',
      gap: '1rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '0.5rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📈 {isKo ? 'AIDLC 생산성 지표' : 'AIDLC Productivity Metrics'}</h2>
        <p style={styles.subtitle}>{isKo ? 'AI 도입 전후 비교' : 'Before and After AI Adoption'}</p>
      </div>
      <div style={styles.categoriesContainer}>
        {categories.map((category, idx) => (
          <div key={idx} style={styles.categorySection}>
            <div style={{
              ...styles.categoryHeader,
              background: category.color
            }}>
              {category.name}
            </div>
            <div style={styles.columnHeader}>
              <div>{isKo ? '지표' : 'Metric'}</div>
              <div>{isKo ? '도입 전' : 'Before'}</div>
              <div>{isKo ? '도입 후' : 'After'}</div>
              <div>{isKo ? '개선도' : 'Improvement'}</div>
            </div>
            <div style={styles.metricsTable}>
              {category.metrics.map((metric, metricIdx) => (
                <div key={metricIdx} style={styles.metricRow}>
                  <div style={styles.metricName}>{metric.name}</div>
                  <div style={styles.beforeValue}>{metric.before}</div>
                  <div style={styles.afterValue}>{metric.after}</div>
                  <div style={{
                    ...styles.improvement,
                    ...(metric.positive ? styles.improvementPositive : {})
                  }}>
                    <div style={{
                      ...styles.improvementBar,
                      background: metric.positive ? '#059669' : '#dc2626'
                    }} />
                    {metric.improvement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductivityMetrics;
