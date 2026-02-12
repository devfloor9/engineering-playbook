import React from 'react';

const AidlcPhaseActivities = () => {
  const phases = [
    {
      name: 'Inception 단계',
      color: '#3b82f6',
      activities: [
        { activity: '요구사항 분석', tools: 'Kiro, Q Developer', outputs: 'requirements.md' },
        { activity: '아키텍처 설계', tools: 'Kiro, Claude', outputs: 'design.md' },
        { activity: '기술 스택 결정', tools: 'Kiro (MCP 기반 AWS 서비스 탐색)', outputs: '기술 스택 문서' },
        { activity: '비용 추정', tools: 'Cost Analysis MCP', outputs: '비용 산정서' }
      ]
    },
    {
      name: 'Construction 단계',
      color: '#059669',
      activities: [
        { activity: '태스크 분해', tools: 'Kiro', outputs: 'tasks.md' },
        { activity: '코드 생성', tools: 'Kiro, Q Developer, Copilot', outputs: '소스 코드' },
        { activity: '코드 리뷰', tools: 'Q Developer (Security Scan)', outputs: '리뷰 코멘트' },
        { activity: '테스트 생성', tools: 'Kiro, Q Developer', outputs: '테스트 코드' },
        { activity: 'IaC 생성', tools: 'Kiro + AWS MCP', outputs: 'Terraform, Helm' }
      ]
    },
    {
      name: 'Operations 단계',
      color: '#8b5cf6',
      activities: [
        { activity: 'GitOps 배포', tools: 'Managed Argo CD', outputs: '자동 배포' },
        { activity: '관찰성 분석', tools: 'AMP/AMG + CloudWatch AI', outputs: '대시보드, 알림' },
        { activity: '이상 탐지', tools: 'DevOps Guru, CloudWatch', outputs: '인사이트' },
        { activity: '자동 대응', tools: 'Kagent, Strands, Q Developer', outputs: '자동 복구' },
        { activity: '인프라 관리', tools: 'ACK + KRO', outputs: 'K8s CRD 기반 관리' }
      ]
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
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
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
    phasesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      marginTop: '1.5rem'
    },
    phaseSection: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    phaseHeader: {
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '1.125rem',
      fontWeight: '600'
    },
    activitiesTable: {
      padding: '1.25rem'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.75rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.5rem'
    },
    activityRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.875rem 0.75rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      lineHeight: '1.5'
    },
    activityCell: {
      color: '#374151'
    },
    activityName: {
      fontWeight: '500',
      color: '#111827'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔨 AIDLC 단계별 활동</h2>
        <p style={styles.subtitle}>각 단계의 주요 활동, AI 도구, 산출물</p>
      </div>
      <div style={styles.phasesContainer}>
        {phases.map((phase, idx) => (
          <div key={idx} style={styles.phaseSection}>
            <div style={{
              ...styles.phaseHeader,
              background: `linear-gradient(135deg, ${phase.color} 0%, ${phase.color}dd 100%)`
            }}>
              {phase.name}
            </div>
            <div style={styles.activitiesTable}>
              <div style={styles.tableHeader}>
                <div>활동</div>
                <div>AI 도구</div>
                <div>산출물</div>
              </div>
              {phase.activities.map((activity, activityIdx) => (
                <div key={activityIdx} style={styles.activityRow}>
                  <div style={{...styles.activityCell, ...styles.activityName}}>
                    {activity.activity}
                  </div>
                  <div style={styles.activityCell}>
                    {activity.tools}
                  </div>
                  <div style={styles.activityCell}>
                    {activity.outputs}
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

export default AidlcPhaseActivities;
