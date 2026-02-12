import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AidlcPipeline = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    section: {
      marginBottom: '3rem'
    },
    header: {
      background: 'linear-gradient(135deg, #0e4a5c 0%, #0891b2 100%)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
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
    pipelineContainer: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    flowContainer: {
      display: 'flex',
      alignItems: 'stretch',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    column: {
      flex: 1,
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column'
    },
    columnTitle: {
      fontSize: '0.8125rem',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '0.75rem',
      textAlign: 'center',
      lineHeight: '1.3'
    },
    itemsList: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      fontSize: '0.75rem',
      color: '#4b5563',
      lineHeight: '1.6'
    },
    item: {
      marginBottom: '0.375rem',
      paddingLeft: '0.5rem',
      position: 'relative'
    },
    arrow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      color: '#0891b2',
      fontWeight: '600',
      flexShrink: 0
    },
    stagesContainer: {
      display: 'flex',
      alignItems: 'stretch',
      gap: '0.75rem'
    },
    stageCard: {
      flex: 1,
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    stageHeader: {
      padding: '0.75rem 1rem',
      fontWeight: '600',
      fontSize: '0.8125rem',
      color: 'white',
      textAlign: 'center'
    },
    stageBody: {
      padding: '1rem',
      background: '#f9fafb'
    },
    stageList: {
      margin: 0,
      padding: 0,
      listStyle: 'none',
      fontSize: '0.75rem',
      color: '#4b5563',
      lineHeight: '1.6'
    },
    stageItem: {
      marginBottom: '0.375rem',
      paddingLeft: '0.5rem',
      position: 'relative'
    },
    loopback: {
      marginTop: '0.75rem',
      padding: '0.625rem',
      background: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '4px',
      fontSize: '0.7rem',
      color: '#92400e',
      textAlign: 'center',
      fontWeight: '500'
    },
    footer: {
      marginTop: '1.5rem',
      padding: '1rem',
      background: '#fef3c7',
      borderLeft: '4px solid #f59e0b',
      borderRadius: '4px',
      fontSize: '0.8125rem',
      color: '#78350f',
      lineHeight: '1.5'
    },
    footerTitle: {
      fontWeight: '600',
      marginBottom: '0.25rem'
    }
  };

  return (
    <div style={styles.container}>
      {/* Part 1: IaC 자동화 파이프라인 */}
      <div style={styles.section}>
        <div style={styles.header}>
          <h2 style={styles.title}>🔧 {isKo ? 'IaC 자동화 파이프라인' : 'IaC Automation Pipeline'}</h2>
          <p style={styles.subtitle}>Kiro → MCP → IaC → Argo CD</p>
        </div>
        <div style={styles.pipelineContainer}>
          <div style={styles.flowContainer}>
            <div style={{ ...styles.column, borderTop: '3px solid #3b82f6' }}>
              <div style={styles.columnTitle}>Kiro Spec-Driven</div>
              <ul style={styles.itemsList}>
                <li style={styles.item}>requirements.md</li>
                <li style={styles.item}>design.md</li>
                <li style={styles.item}>tasks.md</li>
              </ul>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={{ ...styles.column, borderTop: '3px solid #059669' }}>
              <div style={styles.columnTitle}>Hosted MCP Servers</div>
              <ul style={styles.itemsList}>
                <li style={styles.item}>EKS MCP</li>
                <li style={styles.item}>Cost MCP</li>
                <li style={styles.item}>AWS Docs MCP</li>
              </ul>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={{ ...styles.column, borderTop: '3px solid #8b5cf6' }}>
              <div style={styles.columnTitle}>{isKo ? '자동 생성 산출물' : 'Auto-Generated Artifacts'}</div>
              <ul style={styles.itemsList}>
                <li style={styles.item}>Terraform</li>
                <li style={styles.item}>Helm Chart</li>
                <li style={styles.item}>ACK CRD</li>
                <li style={styles.item}>KRO ResourceGroup</li>
              </ul>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={{ ...styles.column, borderTop: '3px solid #0891b2' }}>
              <div style={styles.columnTitle}>{isKo ? '배포' : 'Deployment'}</div>
              <ul style={styles.itemsList}>
                <li style={styles.item}>Git Repository</li>
                <li style={styles.item}>↓</li>
                <li style={styles.item}>Managed Argo CD</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: AI/CD 파이프라인 개념도 */}
      <div style={styles.section}>
        <div style={styles.header}>
          <h2 style={styles.title}>🚀 {isKo ? 'AI/CD 파이프라인 개념도' : 'AI/CD Pipeline Conceptual Diagram'}</h2>
          <p style={styles.subtitle}>Inception → Construction → Deploy</p>
        </div>
        <div style={styles.pipelineContainer}>
          <div style={styles.stagesContainer}>
            <div style={styles.stageCard}>
              <div style={{ ...styles.stageHeader, background: '#3b82f6' }}>
                Stage 1: Inception
              </div>
              <div style={styles.stageBody}>
                <ul style={styles.stageList}>
                  <li style={styles.stageItem}>{isKo ? 'Spec 커밋 감지' : 'Spec Commit Detection'}</li>
                  <li style={styles.stageItem}>requirements.md</li>
                  <li style={styles.stageItem}>{isKo ? 'design.md 검증' : 'design.md Validation'}</li>
                </ul>
              </div>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.stageCard}>
              <div style={{ ...styles.stageHeader, background: '#059669' }}>
                Stage 2: Construction
              </div>
              <div style={styles.stageBody}>
                <ul style={styles.stageList}>
                  <li style={styles.stageItem}>{isKo ? 'AI 코드 생성' : 'AI Code Generation'}</li>
                  <li style={styles.stageItem}>{isKo ? 'AI 보안 스캔 (Q Dev)' : 'AI Security Scan (Q Dev)'}</li>
                  <li style={styles.stageItem}>{isKo ? 'AI 코드 리뷰' : 'AI Code Review'}</li>
                  <li style={styles.stageItem}>{isKo ? '테스트 실행' : 'Test Execution'}</li>
                  <li style={styles.stageItem}>{isKo ? 'Loss Function 검증 ◀ (사람)' : 'Loss Function Validation ◀ (Human)'}</li>
                </ul>
                <div style={styles.loopback}>
                  {isKo ? '↻ Loss Function 실패 시 재생성' : '↻ Regenerate on Loss Function Failure'}
                </div>
              </div>
            </div>
            <div style={styles.arrow}>→</div>
            <div style={styles.stageCard}>
              <div style={{ ...styles.stageHeader, background: '#8b5cf6' }}>
                Stage 3: Deploy
              </div>
              <div style={styles.stageBody}>
                <ul style={styles.stageList}>
                  <li style={styles.stageItem}>{isKo ? '컨테이너 빌드' : 'Container Build'}</li>
                  <li style={styles.stageItem}>{isKo ? 'ECR 푸시' : 'ECR Push'}</li>
                  <li style={styles.stageItem}>{isKo ? 'Kustomize 업데이트' : 'Kustomize Update'}</li>
                  <li style={styles.stageItem}>{isKo ? 'Argo CD 자동 배포' : 'Argo CD Auto Deploy'}</li>
                </ul>
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <div style={styles.footerTitle}>{isKo ? '핵심 통찰' : 'Key Insight'}</div>
            {isKo ? 'AI/CD는 코드 품질을 Loss Function으로 측정하고, 인간은 품질 기준(임계값)만 설정합니다. 기준 미달 시 AI가 자동으로 재생성하여 지속적 품질 개선을 달성합니다.' : 'AI/CD measures code quality through Loss Functions, while humans only set quality criteria (thresholds). When standards are not met, AI automatically regenerates to achieve continuous quality improvement.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AidlcPipeline;
