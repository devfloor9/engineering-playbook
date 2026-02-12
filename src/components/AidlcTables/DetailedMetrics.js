import React from 'react';

const DetailedMetrics = () => {
  const metrics = [
    {
      metric: '코드 생성 속도',
      description: '기능당 코드 작성 시간',
      before: '8시간',
      after: '2시간',
      improvement: '75% ↓',
      color: '#3b82f6'
    },
    {
      metric: 'PR 리뷰 시간',
      description: 'PR 제출→승인 소요 시간',
      before: '24시간',
      after: '4시간',
      improvement: '83% ↓',
      color: '#3b82f6'
    },
    {
      metric: '배포 빈도',
      description: '프로덕션 배포 횟수/주',
      before: '2회',
      after: '10회',
      improvement: '5x ↑',
      color: '#3b82f6'
    },
    {
      metric: 'MTTR',
      description: '장애 평균 복구 시간',
      before: '45분',
      after: '12분',
      improvement: '73% ↓',
      color: '#059669'
    },
    {
      metric: 'Change Failure Rate',
      description: '배포 실패율',
      before: '15%',
      after: '3%',
      improvement: '80% ↓',
      color: '#059669'
    },
    {
      metric: '테스트 커버리지',
      description: '코드 테스트 범위',
      before: '45%',
      after: '85%',
      improvement: '89% ↑',
      color: '#059669'
    },
    {
      metric: '보안 취약점',
      description: '프로덕션 보안 이슈/분기',
      before: '8건',
      after: '1건',
      improvement: '87% ↓',
      color: '#dc2626'
    }
  ];

  const doraMetrics = [
    {
      metric: '배포 빈도',
      contribution: 'Managed Argo CD + AI 자동 승인',
      method: '수동 게이트 제거',
      icon: '🚀'
    },
    {
      metric: '변경 리드 타임',
      contribution: 'Kiro Spec → 코드 자동 생성',
      method: '개발 단계 가속',
      icon: '⚡'
    },
    {
      metric: '변경 실패율',
      contribution: 'AI Quality Gates',
      method: '배포 전 다중 검증',
      icon: '🛡️'
    },
    {
      metric: '서비스 복구 시간',
      contribution: 'AI Agent 자동 대응',
      method: '수동 진단 제거',
      icon: '🔧'
    }
  ];

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
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      margin: '0 0 1.25rem 0',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#111827',
      borderBottom: '2px solid #e5e7eb',
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
      background: '#f9fafb',
      borderRadius: '6px',
      borderLeft: '4px solid',
      fontSize: '0.875rem',
      alignItems: 'center'
    },
    metricName: {
      fontWeight: '600',
      color: '#111827'
    },
    metricDescription: {
      color: '#6b7280',
      fontSize: '0.8125rem'
    },
    metricValue: {
      color: '#4b5563'
    },
    beforeValue: {
      color: '#9ca3af'
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
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.875rem',
      alignItems: 'center',
      border: '1px solid #e5e7eb'
    },
    doraIcon: {
      fontSize: '1.5rem',
      textAlign: 'center'
    },
    doraMetric: {
      fontWeight: '600',
      color: '#111827'
    },
    doraContribution: {
      color: '#4b5563'
    },
    doraMethod: {
      color: '#6b7280',
      fontSize: '0.8125rem'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    },
    doraHeader: {
      display: 'grid',
      gridTemplateColumns: '0.5fr 2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 측정 지표</h2>
        <p style={styles.subtitle}>AIDLC 도입 효과 측정</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>주요 측정 항목</h3>
        <div style={styles.tableHeader}>
          <div>지표</div>
          <div>설명</div>
          <div>AIDLC 이전</div>
          <div>AIDLC 이후</div>
          <div>개선율</div>
        </div>
        <div style={styles.metricsGrid}>
          {metrics.map((item, idx) => (
            <div
              key={idx}
              style={{
                ...styles.metricCard,
                borderLeftColor: item.color
              }}
            >
              <div style={styles.metricName}>{item.metric}</div>
              <div style={styles.metricDescription}>{item.description}</div>
              <div style={styles.beforeValue}>{item.before}</div>
              <div style={styles.afterValue}>{item.after}</div>
              <div style={styles.improvement}>
                <div style={styles.improvementBar} />
                {item.improvement}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>DORA 메트릭 매핑</h3>
        <div style={styles.doraHeader}>
          <div></div>
          <div>DORA 메트릭</div>
          <div>AIDLC 기여</div>
          <div>개선 방법</div>
        </div>
        <div style={styles.doraGrid}>
          {doraMetrics.map((dora, idx) => (
            <div key={idx} style={styles.doraCard}>
              <div style={styles.doraIcon}>{dora.icon}</div>
              <div style={styles.doraMetric}>{dora.metric}</div>
              <div style={styles.doraContribution}>{dora.contribution}</div>
              <div style={styles.doraMethod}>{dora.method}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedMetrics;
