import React from 'react';

const AiCodingAgentComparison = () => {
  const qDeveloperFeatures = [
    { feature: '코드 생성', description: 'AWS SDK, CDK, Terraform 코드 자동 생성' },
    { feature: 'Security Scan', description: '코드 보안 취약점 자동 탐지' },
    { feature: '코드 변환', description: 'Java 8→17, .NET Framework→.NET Core 등' },
    { feature: 'CloudWatch Investigations', description: '운영 이슈 AI 분석' },
    { feature: 'EKS 트러블슈팅', description: 'kubectl 명령어 제안, YAML 오류 수정' }
  ];

  const agentComparison = [
    {
      feature: 'AWS 서비스 이해',
      qDeveloper: { stars: 5, label: '★★★★★' },
      kiro: { stars: 4, label: '★★★★ (MCP)' },
      claudeCode: { stars: 3, label: '★★★' }
    },
    {
      feature: 'Spec-driven 개발',
      qDeveloper: { stars: 2, label: '★★' },
      kiro: { stars: 5, label: '★★★★★' },
      claudeCode: { stars: 3, label: '★★★ (CLAUDE.md)' }
    },
    {
      feature: '보안 스캔',
      qDeveloper: { stars: 5, label: '★★★★★' },
      kiro: { stars: 3, label: '★★★' },
      claudeCode: { stars: 3, label: '★★★' }
    },
    {
      feature: 'MCP 통합',
      qDeveloper: { stars: 4, label: '★★★★' },
      kiro: { stars: 5, label: '★★★★★' },
      claudeCode: { stars: 5, label: '★★★★★' }
    },
    {
      feature: 'EKS 운영',
      qDeveloper: { stars: 5, label: '★★★★★' },
      kiro: { stars: 4, label: '★★★★' },
      claudeCode: { stars: 4, label: '★★★★ (MCP)' }
    },
    {
      feature: 'AI 모델',
      qDeveloper: { stars: 0, label: 'Claude (Anthropic)' },
      kiro: { stars: 0, label: 'Claude + Open Weight' },
      claudeCode: { stars: 0, label: 'Claude Opus/Sonnet' }
    },
    {
      feature: '비용',
      qDeveloper: { stars: 0, label: 'Pro $19/월' },
      kiro: { stars: 0, label: '별도' },
      claudeCode: { stars: 0, label: 'Max $100-200/월' }
    },
    {
      feature: '특화 영역',
      qDeveloper: { stars: 0, label: 'AWS 네이티브 + 보안' },
      kiro: { stars: 0, label: 'Spec-driven + MCP' },
      claudeCode: { stars: 0, label: '자율 에이전트 + MCP' }
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
      background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
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
      borderLeft: '4px solid #ea580c',
      borderRadius: '0 8px 8px 0',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      margin: '0 0 1.25rem 0',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#111827'
    },
    featuresGrid: {
      display: 'grid',
      gap: '0.75rem'
    },
    featureRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      gap: '1rem',
      padding: '0.875rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.875rem'
    },
    featureName: {
      fontWeight: '600',
      color: '#111827'
    },
    featureDescription: {
      color: '#4b5563',
      lineHeight: '1.5'
    },
    comparisonTable: {
      marginTop: '2rem'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr',
      gap: '0.75rem',
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
    comparisonRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr',
      gap: '0.75rem',
      padding: '0.875rem 0.75rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      alignItems: 'center'
    },
    featureCell: {
      fontWeight: '500',
      color: '#111827'
    },
    ratingCell: {
      color: '#f59e0b',
      fontSize: '0.8125rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    footer: {
      marginTop: '1.5rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '6px',
      fontSize: '0.875rem',
      color: '#78350f',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 AI 코딩 에이전트</h2>
        <p style={styles.subtitle}>Amazon Q Developer, Kiro, Claude Code 비교</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Amazon Q Developer 주요 기능</h3>
        <div style={styles.featuresGrid}>
          {qDeveloperFeatures.map((item, idx) => (
            <div key={idx} style={styles.featureRow}>
              <div style={styles.featureName}>{item.feature}</div>
              <div style={styles.featureDescription}>{item.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>AI 코딩 에이전트 비교</h3>
        <div style={styles.tableHeader}>
          <div>기능</div>
          <div>Amazon Q Developer</div>
          <div>Kiro</div>
          <div>Claude Code</div>
        </div>
        {agentComparison.map((row, idx) => (
          <div key={idx} style={styles.comparisonRow}>
            <div style={styles.featureCell}>{row.feature}</div>
            <div style={styles.ratingCell}>{row.qDeveloper.label}</div>
            <div style={styles.ratingCell}>{row.kiro.label}</div>
            <div style={styles.ratingCell}>{row.claudeCode.label}</div>
          </div>
        ))}
        <div style={styles.footer}>
          <strong>선택 가이드:</strong> AWS 중심 개발·보안 스캔은 Q Developer, 체계적 Spec-driven 워크플로우는 Kiro, MCP 기반 자율 에이전트 개발은 Claude Code를 권장합니다. 세 도구 모두 <strong>Anthropic Claude</strong> 모델을 사용하며, Kiro는 오픈 웨이트 모델도 지원하여 비용 최적화와 특수 도메인 확장이 가능합니다.
        </div>
      </div>
    </div>
  );
};

export default AiCodingAgentComparison;
