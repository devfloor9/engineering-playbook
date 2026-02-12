import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const QualityGates = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const gates = [
    {
      gate: isKo ? '코드 품질' : 'Code Quality',
      tools: 'Q Developer, Copilot',
      checks: isKo ? '코딩 표준, 복잡도, 중복' : 'Coding standards, Complexity, Duplication',
      color: '#3b82f6'
    },
    {
      gate: isKo ? '보안 스캔' : 'Security Scan',
      tools: 'Q Developer Security',
      checks: isKo ? 'OWASP Top 10, 시크릿 탐지' : 'OWASP Top 10, Secret Detection',
      color: '#dc2626'
    },
    {
      gate: isKo ? 'IaC 검증' : 'IaC Validation',
      tools: 'tflint, OPA',
      checks: isKo ? 'Terraform 모범사례, 정책 준수' : 'Terraform Best Practices, Policy Compliance',
      color: '#7c3aed'
    },
    {
      gate: isKo ? 'K8s 검증' : 'K8s Validation',
      tools: 'Kube-linter, Datree',
      checks: isKo ? '보안 컨텍스트, 리소스 제한' : 'Security Context, Resource Limits',
      color: '#0891b2'
    },
    {
      gate: isKo ? '테스트 커버리지' : 'Test Coverage',
      tools: 'Go test, pytest',
      checks: isKo ? '최소 80% 커버리지' : 'Minimum 80% Coverage',
      color: '#059669'
    },
    {
      gate: isKo ? '성능 회귀' : 'Performance Regression',
      tools: 'k6, Artillery',
      checks: isKo ? '레이턴시, 처리량 기준' : 'Latency, Throughput Benchmarks',
      color: '#ea580c'
    }
  ];

  const approvalCriteria = [
    {
      condition: isKo ? '보안 스캔 결과' : 'Security Scan Results',
      autoApprove: isKo ? 'Critical/High 0건' : '0 Critical/High',
      manualReview: isKo ? 'Critical/High 1건 이상' : '≥1 Critical/High',
      severity: 'critical'
    },
    {
      condition: isKo ? '테스트 커버리지' : 'Test Coverage',
      autoApprove: '≥ 80%',
      manualReview: '< 80%',
      severity: 'high'
    },
    {
      condition: isKo ? 'K8s 검증' : 'K8s Validation',
      autoApprove: isKo ? '경고 0건' : '0 Warnings',
      manualReview: isKo ? '경고 1건 이상' : '≥1 Warning',
      severity: 'medium'
    },
    {
      condition: isKo ? '성능 회귀' : 'Performance Regression',
      autoApprove: isKo ? 'P99 < SLO 목표' : 'P99 < SLO Target',
      manualReview: isKo ? 'P99 > SLO 목표' : 'P99 > SLO Target',
      severity: 'high'
    },
    {
      condition: isKo ? '변경 범위' : 'Change Scope',
      autoApprove: isKo ? '< 500줄' : '< 500 lines',
      manualReview: isKo ? '≥ 500줄' : '≥ 500 lines',
      severity: 'medium'
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
      background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 100%)',
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
    gatesGrid: {
      display: 'grid',
      gap: '0.75rem'
    },
    gateRow: {
      display: 'grid',
      gridTemplateColumns: '1.5fr 2fr 2.5fr',
      gap: '1rem',
      padding: '1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      borderLeft: '4px solid',
      fontSize: '0.875rem'
    },
    gateCell: {
      color: '#374151',
      lineHeight: '1.5'
    },
    gateName: {
      fontWeight: '600',
      color: '#111827'
    },
    approvalTable: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    approvalHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 2fr',
      gap: '0.75rem',
      padding: '0.75rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    approvalRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 2fr',
      gap: '0.75rem',
      padding: '1rem 0.75rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      alignItems: 'center'
    },
    conditionCell: {
      fontWeight: '500',
      color: '#111827'
    },
    approveCell: {
      color: '#059669',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    reviewCell: {
      color: '#dc2626',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    severityBadge: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.6875rem',
      fontWeight: '600',
      textTransform: 'uppercase'
    },
    critical: {
      background: '#fee2e2',
      color: '#991b1b'
    },
    high: {
      background: '#fed7aa',
      color: '#9a3412'
    },
    medium: {
      background: '#fef3c7',
      color: '#92400e'
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
        <h2 style={styles.title}>🛡️ Quality Gates</h2>
        <p style={styles.subtitle}>{isKo ? 'AI 주도 다중 검증 레이어' : 'AI-Driven Multi-Layer Validation'}</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? 'AI 코드 리뷰 검증 항목' : 'AI Code Review Validation Items'}</h3>
        <div style={styles.gatesGrid}>
          {gates.map((gate, idx) => (
            <div
              key={idx}
              style={{
                ...styles.gateRow,
                borderLeftColor: gate.color
              }}
            >
              <div style={{...styles.gateCell, ...styles.gateName}}>
                {gate.gate}
              </div>
              <div style={styles.gateCell}>
                {gate.tools}
              </div>
              <div style={styles.gateCell}>
                {gate.checks}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? '자동 승인 기준' : 'Auto-Approval Criteria'}</h3>
        <div style={styles.approvalTable}>
          <div style={styles.approvalHeader}>
            <div>{isKo ? '조건' : 'Condition'}</div>
            <div>{isKo ? '자동 승인' : 'Auto Approve'}</div>
            <div>{isKo ? '수동 리뷰 필요' : 'Manual Review Required'}</div>
          </div>
          {approvalCriteria.map((criteria, idx) => (
            <div key={idx} style={styles.approvalRow}>
              <div style={styles.conditionCell}>
                {criteria.condition}
              </div>
              <div style={styles.approveCell}>
                ✓ {criteria.autoApprove}
              </div>
              <div style={styles.reviewCell}>
                ⚠ {criteria.manualReview}
              </div>
            </div>
          ))}
        </div>
        <div style={styles.footer}>
          <strong>{isKo ? '주의:' : 'Note:'}</strong> {isKo ? 'AI 코드 리뷰는 패턴 기반 문제를 잘 탐지하지만, 비즈니스 로직의 정확성이나 아키텍처 적합성은 사람의 판단이 필요합니다. AI 리뷰를 1차 필터로 활용하고, 핵심 변경사항은 사람이 최종 검토하는 하이브리드 접근을 권장합니다.' : 'AI code review excels at detecting pattern-based issues, but business logic accuracy and architectural suitability require human judgment. We recommend a hybrid approach: use AI review as a first filter, with humans performing final review of critical changes.'}
        </div>
      </div>
    </div>
  );
};

export default QualityGates;
