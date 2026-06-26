import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const DetailedMetrics = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const metrics = [{
    metric: isKo ? '코드 생성 속도' : 'Code Generation Speed',
    description: isKo ? '기능당 코드 작성 시간' : 'Code writing time per feature',
    before: isKo ? '8시간' : '8 hours',
    after: isKo ? '2시간' : '2 hours',
    improvement: '75% ↓',
    color: '#3b82f6'
  }, {
    metric: isKo ? 'PR 리뷰 시간' : 'PR Review Time',
    description: isKo ? 'PR 제출→승인 소요 시간' : 'Time from PR submission to approval',
    before: isKo ? '24시간' : '24 hours',
    after: isKo ? '4시간' : '4 hours',
    improvement: '83% ↓',
    color: '#3b82f6'
  }, {
    metric: isKo ? '배포 빈도' : 'Deployment Frequency',
    description: isKo ? '프로덕션 배포 횟수/주' : 'Production deployments per week',
    before: isKo ? '2회' : '2 times',
    after: isKo ? '10회' : '10 times',
    improvement: '5x ↑',
    color: '#3b82f6'
  }, {
    metric: 'MTTR',
    description: isKo ? '장애 평균 복구 시간' : 'Mean time to recovery',
    before: isKo ? '45분' : '45 min',
    after: isKo ? '12분' : '12 min',
    improvement: '73% ↓',
    color: '#059669'
  }, {
    metric: 'Change Failure Rate',
    description: isKo ? '배포 실패율' : 'Deployment failure rate',
    before: '15%',
    after: '3%',
    improvement: '80% ↓',
    color: '#059669'
  }, {
    metric: isKo ? '테스트 커버리지' : 'Test Coverage',
    description: isKo ? '코드 테스트 범위' : 'Code test coverage',
    before: '45%',
    after: '85%',
    improvement: '89% ↑',
    color: '#059669'
  }, {
    metric: isKo ? '보안 취약점' : 'Security Vulnerabilities',
    description: isKo ? '프로덕션 보안 이슈/분기' : 'Production security issues per quarter',
    before: isKo ? '8건' : '8 issues',
    after: isKo ? '1건' : '1 issue',
    improvement: '87% ↓',
    color: '#dc2626'
  }];
  const doraMetrics = [{
    metric: isKo ? '배포 빈도' : 'Deployment Frequency',
    contribution: isKo ? 'Managed Argo CD + AI 자동 승인' : 'Managed Argo CD + AI Auto-approval',
    method: isKo ? '수동 게이트 제거' : 'Remove manual gates',
    icon: '🚀'
  }, {
    metric: isKo ? '변경 리드 타임' : 'Lead Time for Changes',
    contribution: isKo ? 'Kiro Spec → 코드 자동 생성' : 'Kiro Spec → Auto Code Generation',
    method: isKo ? '개발 단계 가속' : 'Accelerate development phase',
    icon: '⚡'
  }, {
    metric: isKo ? '변경 실패율' : 'Change Failure Rate',
    contribution: 'AI Quality Gates',
    method: isKo ? '배포 전 다중 검증' : 'Multi-layer validation before deploy',
    icon: '🛡️'
  }, {
    metric: isKo ? '서비스 복구 시간' : 'Time to Restore Service',
    contribution: isKo ? 'AI Agent 자동 대응' : 'AI Agent Auto-response',
    method: isKo ? '수동 진단 제거' : 'Remove manual diagnosis',
    icon: '🔧'
  }];
  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '8px 8px 0 0'
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
    section: {
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      margin: '0 0 1.25rem 0',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--ifm-font-color-base)',
      borderBottom: '2px solid var(--ifm-color-emphasis-200)',
      paddingBottom: '0.75rem'
    },
    metricsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    metricCard: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr',
      gap: '1rem',
      padding: '1rem',
      background: 'var(--ifm-background-surface-color)',
      borderRadius: '6px',
      borderLeft: '4px solid',
      fontSize: '0.875rem',
      alignItems: 'center'
    },
    metricName: {
      fontWeight: '600',
      color: 'var(--ifm-font-color-base)'
    },
    metricDescription: {
      color: 'var(--ifm-color-emphasis-600)',
      fontSize: '0.8125rem'
    },
    metricValue: {
      color: 'var(--ifm-font-color-base)'
    },
    beforeValue: {
      color: 'var(--ifm-color-emphasis-500)'
    },
    afterValue: {
      color: '#059669',
      fontWeight: '500'
    },
    improvement: {
      fontWeight: '600',
      color: '#059669',
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem'
    },
    improvementBar: {
      width: '3px',
      height: '14px',
      background: '#059669',
      borderRadius: '2px'
    },
    doraGrid: {
      display: 'grid',
      gap: '1rem'
    },
    doraCard: {
      display: 'grid',
      gridTemplateColumns: '0.5fr 2fr 2fr 2fr',
      gap: '1rem',
      padding: '1rem',
      background: 'var(--ifm-background-surface-color)',
      borderRadius: '6px',
      fontSize: '0.875rem',
      alignItems: 'center',
      border: '1px solid var(--ifm-color-emphasis-200)'
    },
    doraIcon: {
      fontSize: '1.5rem',
      textAlign: 'center'
    },
    doraMetric: {
      fontWeight: '600',
      color: 'var(--ifm-font-color-base)'
    },
    doraContribution: {
      color: 'var(--ifm-font-color-base)'
    },
    doraMethod: {
      color: 'var(--ifm-color-emphasis-600)',
      fontSize: '0.8125rem'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: 'var(--ifm-background-surface-color)',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--ifm-color-emphasis-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    },
    doraHeader: {
      display: 'grid',
      gridTemplateColumns: '0.5fr 2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: 'var(--ifm-background-surface-color)',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--ifm-color-emphasis-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    }
  };
  return <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 {isKo ? '측정 지표' : 'Metrics'}</h2>
        <p style={styles.subtitle}>{isKo ? 'AIDLC 도입 효과 측정' : 'Measuring AIDLC Adoption Impact'}</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? '주요 측정 항목' : 'Key Metrics'}</h3>
        <div style={styles.tableHeader}>
          <div>{isKo ? '지표' : 'Metric'}</div>
          <div>{isKo ? '설명' : 'Description'}</div>
          <div>{isKo ? 'AIDLC 이전' : 'Before AIDLC'}</div>
          <div>{isKo ? 'AIDLC 이후' : 'After AIDLC'}</div>
          <div>{isKo ? '개선율' : 'Improvement'}</div>
        </div>
        <div style={styles.metricsGrid}>
          {metrics.map((item, idx) => <div key={idx} style={{
          ...styles.metricCard,
          borderLeftColor: item.color
        }}>
              <div style={styles.metricName}>{item.metric}</div>
              <div style={styles.metricDescription}>{item.description}</div>
              <div style={styles.beforeValue}>{item.before}</div>
              <div style={styles.afterValue}>{item.after}</div>
              <div style={styles.improvement}>
                <div style={styles.improvementBar} />
                {item.improvement}
              </div>
            </div>)}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? 'DORA 메트릭 매핑' : 'DORA Metrics Mapping'}</h3>
        <div style={styles.doraHeader}>
          <div></div>
          <div>{isKo ? 'DORA 메트릭' : 'DORA Metric'}</div>
          <div>{isKo ? 'AIDLC 기여' : 'AIDLC Contribution'}</div>
          <div>{isKo ? '개선 방법' : 'Improvement Method'}</div>
        </div>
        <div style={styles.doraGrid}>
          {doraMetrics.map((dora, idx) => <div key={idx} style={styles.doraCard}>
              <div style={styles.doraIcon}>{dora.icon}</div>
              <div style={styles.doraMetric}>{dora.metric}</div>
              <div style={styles.doraContribution}>{dora.contribution}</div>
              <div style={styles.doraMethod}>{dora.method}</div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default DetailedMetrics;