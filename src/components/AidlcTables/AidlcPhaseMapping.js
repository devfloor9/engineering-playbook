import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AidlcPhaseMapping = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const phases = [
    {
      number: 1,
      name: 'Inception',
      nameKo: '구상',
      color: '#3b82f6',
      description: isKo ? '요구사항 정의 + 아키텍처 설계' : 'Requirements Definition + Architecture Design',
      tools: ['Amazon Q Developer', 'Kiro Requirements', 'Claude Code'],
      outputs: ['requirements.md', 'design.md']
    },
    {
      number: 2,
      name: 'Construction',
      nameKo: '구축',
      color: '#059669',
      description: isKo ? '코드 생성 + 테스트 + 리뷰' : 'Code Generation + Testing + Review',
      tools: ['Kiro', 'GitHub Copilot', 'Claude Code', 'Q Developer'],
      outputs: isKo ? ['소스 코드', '테스트', 'IaC'] : ['Source Code', 'Tests', 'IaC']
    },
    {
      number: 3,
      name: 'Operations',
      nameKo: '운영',
      color: '#8b5cf6',
      description: isKo ? '배포 + 모니터링 + 최적화' : 'Deployment + Monitoring + Optimization',
      tools: ['Managed Argo CD', 'ACK', 'MCP', 'AI Agents'],
      outputs: isKo ? ['GitOps 배포', '관찰성', '자동 복구'] : ['GitOps Deployment', 'Observability', 'Auto Remediation']
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
      background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',
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
    phasesGrid: {
      display: 'grid',
      gap: '1.5rem',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
    },
    phaseCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    phaseHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    phaseNumber: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '600',
      fontSize: '0.875rem',
      flexShrink: 0
    },
    phaseTitle: {
      margin: 0,
      fontSize: '1rem',
      fontWeight: '600',
      lineHeight: '1.2'
    },
    phaseNameKo: {
      fontSize: '0.75rem',
      color: '#6b7280',
      fontWeight: '400'
    },
    description: {
      fontSize: '0.875rem',
      color: '#4b5563',
      marginBottom: '1rem',
      lineHeight: '1.4'
    },
    sectionLabel: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '0.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    toolsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.375rem',
      marginBottom: '1rem'
    },
    toolBadge: {
      background: '#f3f4f6',
      color: '#374151',
      padding: '0.25rem 0.625rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    outputsList: {
      margin: 0,
      paddingLeft: '1.25rem',
      fontSize: '0.8125rem',
      color: '#4b5563'
    },
    outputItem: {
      marginBottom: '0.25rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔄 {isKo ? 'AIDLC 3단계 프레임워크' : 'AIDLC 3-Phase Framework'}</h2>
        <p style={styles.subtitle}>Inception → Construction → Operations</p>
      </div>
      <div style={styles.phasesGrid}>
        {phases.map((phase) => (
          <div
            key={phase.number}
            style={{
              ...styles.phaseCard,
              borderTop: `4px solid ${phase.color}`
            }}
          >
            <div style={styles.phaseHeader}>
              <div style={{
                ...styles.phaseNumber,
                background: phase.color
              }}>
                {phase.number}
              </div>
              <div>
                <h3 style={styles.phaseTitle}>{phase.name}</h3>
                <div style={styles.phaseNameKo}>{phase.nameKo}</div>
              </div>
            </div>
            <p style={styles.description}>{phase.description}</p>
            <div style={styles.sectionLabel}>{isKo ? '도구' : 'Tools'}</div>
            <div style={styles.toolsContainer}>
              {phase.tools.map((tool, idx) => (
                <span key={idx} style={styles.toolBadge}>{tool}</span>
              ))}
            </div>
            <div style={styles.sectionLabel}>{isKo ? '산출물' : 'Outputs'}</div>
            <ul style={styles.outputsList}>
              {phase.outputs.map((output, idx) => (
                <li key={idx} style={styles.outputItem}>{output}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AidlcPhaseMapping;
