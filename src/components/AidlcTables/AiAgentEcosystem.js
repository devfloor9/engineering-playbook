import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const AiAgentEcosystem = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const agents = [{
    name: 'Kagent',
    color: '#3b82f6',
    characteristics: isKo ? 'K8s 네이티브' : 'K8s Native',
    features: [isKo ? 'CRD로 관리' : 'CRD Management', isKo ? 'kmcp 통합' : 'kmcp Integration', isKo ? '클러스터 내 실행' : 'In-Cluster Execution']
  }, {
    name: 'Strands Agents',
    color: '#059669',
    characteristics: isKo ? 'AWS 프로덕션 검증' : 'AWS Production Verified',
    features: ['Agent SOPs', isKo ? '자연어 워크플로우' : 'Natural Language Workflows', isKo ? 'AWS SDK 통합' : 'AWS SDK Integration']
  }, {
    name: 'Amazon Q Developer',
    color: '#ea580c',
    characteristics: isKo ? '완전 관리형' : 'Fully Managed',
    features: ['CloudWatch Investigations', isKo ? 'EKS 트러블슈팅' : 'EKS Troubleshooting', isKo ? 'AWS 네이티브 통합' : 'AWS Native Integration']
  }];
  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
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
    agentsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.5rem',
      marginTop: '1.5rem'
    },
    agentCard: {
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderTop: '4px solid'
    },
    agentName: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--ifm-font-color-base)'
    },
    characteristics: {
      fontSize: '0.875rem',
      color: 'var(--ifm-color-emphasis-600)',
      fontWeight: '500',
      marginBottom: '1rem',
      paddingBottom: '0.75rem',
      borderBottom: '1px solid #f3f4f6'
    },
    featuresTitle: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--ifm-color-emphasis-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    },
    featuresList: {
      margin: 0,
      paddingLeft: '1.25rem',
      fontSize: '0.8125rem',
      color: 'var(--ifm-font-color-base)',
      lineHeight: '1.8'
    },
    featureItem: {
      marginBottom: '0.375rem'
    },
    footer: {
      marginTop: '2rem',
      padding: '1.25rem',
      background: 'var(--ifm-color-emphasis-100)',
      borderRadius: '8px',
      fontSize: '0.875rem',
      color: 'var(--ifm-color-emphasis-700)',
      lineHeight: '1.7'
    },
    footerTitle: {
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: 'var(--ifm-color-emphasis-700)'
    }
  };
  return <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 {isKo ? 'AI Agent 생태계' : 'AI Agent Ecosystem'}</h2>
        <p style={styles.subtitle}>{isKo ? 'Kiro + MCP 기반 운영 자동화 확장' : 'Kiro + MCP-based Operations Automation Extension'}</p>
      </div>
      <div style={styles.agentsGrid}>
        {agents.map((agent, idx) => <div key={idx} style={{
        ...styles.agentCard,
        borderTopColor: agent.color
      }}>
            <h3 style={styles.agentName}>{agent.name}</h3>
            <div style={styles.characteristics}>{agent.characteristics}</div>
            <div style={styles.featuresTitle}>{isKo ? '핵심 기능' : 'Key Features'}</div>
            <ul style={styles.featuresList}>
              {agent.features.map((feature, featureIdx) => <li key={featureIdx} style={styles.featureItem}>{feature}</li>)}
            </ul>
          </div>)}
      </div>
      <div style={styles.footer}>
        <div style={styles.footerTitle}>{isKo ? 'AI Agent 운영 자동화의 핵심' : 'Core of AI Agent Operations Automation'}</div>
        {isKo ? '다양한 데이터 소스(CloudWatch, EKS API, X-Ray)를 MCP로 통합하여 운영 인사이트를 도출하고, 세부적이면서도 광범위한 컨트롤을 제공합니다. Q Developer(GA)의 완전 관리형 분석을 먼저 도입하고, Strands(OSS)의 SOP 기반 워크플로우, Kagent(초기 단계)의 K8s 네이티브 접근을 점진적으로 확장합니다.' : 'Integrate diverse data sources (CloudWatch, EKS API, X-Ray) through MCP to derive operational insights and provide detailed yet comprehensive control. Start with Q Developer (GA) fully managed analysis, then progressively expand with Strands (OSS) SOP-based workflows and Kagent (early stage) K8s-native approach.'}
      </div>
    </div>;
};
export default AiAgentEcosystem;