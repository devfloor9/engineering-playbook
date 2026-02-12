import React from 'react';

const CoreTechStack = () => {
  const techStack = [
    { area: '관찰성', color: '#059669', aws: 'CloudWatch, X-Ray, AMP, AMG', oss: 'ADOT (OpenTelemetry), Grafana' },
    { area: '이상 탐지', color: '#dc2626', aws: 'DevOps Guru, CloudWatch AI, Anomaly Detection', oss: 'Prometheus + ML' },
    { area: 'AI 개발', color: '#7c3aed', aws: 'Kiro, Amazon Q Developer', oss: 'Claude Code' },
    { area: 'MCP 통합', color: '#2563eb', aws: '개별 MCP (50+ GA), Fully Managed MCP (Preview), AWS MCP Server 통합 (Preview)', oss: 'Kagent (kmcp)' },
    { area: 'GitOps', color: '#ea580c', aws: 'Managed Argo CD (EKS Capability)', oss: 'Argo CD' },
    { area: '인프라 선언', color: '#0891b2', aws: 'ACK (50+ AWS CRD), KRO (ResourceGroup)', oss: 'Terraform, Helm' },
    { area: '네트워킹', color: '#ca8a04', aws: 'LBC v3 (Gateway API GA), Container Network Observability', oss: 'Gateway API' },
    { area: 'AI Agent', color: '#be185d', aws: 'Amazon Q Developer, Strands Agents', oss: 'Kagent' },
    { area: '예측 스케일링', color: '#4f46e5', aws: 'CloudWatch Anomaly Detection', oss: 'Prophet, ARIMA' },
    { area: '노드 관리', color: '#65a30d', aws: 'Karpenter', oss: '-' }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
    color: 'white',
    padding: '2rem',
    borderRadius: '12px 12px 0 0',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0'
  };

  const subtitleStyle = {
    fontSize: '0.95rem',
    opacity: '0.9',
    margin: '0',
    fontWeight: '400'
  };

  const cardsContainerStyle = {
    background: '#ffffff',
    borderRadius: '0 0 12px 12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  };

  const cardStyle = {
    borderLeft: '4px solid',
    padding: '1.25rem',
    marginBottom: '1rem',
    background: '#f9fafb',
    borderRadius: '0 8px 8px 0',
    transition: 'all 0.2s ease',
    cursor: 'default'
  };

  const areaNameStyle = {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    display: 'block'
  };

  const sectionStyle = {
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem'
  };

  const badgeStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    minWidth: '45px',
    textAlign: 'center',
    flexShrink: 0
  };

  const awsBadgeStyle = {
    ...badgeStyle,
    background: '#fff7ed',
    color: '#ea580c',
    border: '1px solid #fed7aa'
  };

  const ossBadgeStyle = {
    ...badgeStyle,
    background: '#f0fdf4',
    color: '#059669',
    border: '1px solid #bbf7d0'
  };

  const contentStyle = {
    fontSize: '0.9rem',
    color: '#374151',
    lineHeight: '1.6',
    flex: 1
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>핵심 기술 스택</h2>
        <p style={subtitleStyle}>AIops & AIDLC를 구성하는 AWS 서비스와 오픈소스 도구</p>
      </div>
      <div style={cardsContainerStyle}>
        {techStack.map((item, index) => (
          <div
            key={index}
            style={{
              ...cardStyle,
              borderLeftColor: item.color
            }}
          >
            <span style={{ ...areaNameStyle, color: item.color }}>
              {item.area}
            </span>
            <div style={sectionStyle}>
              <span style={awsBadgeStyle}>AWS</span>
              <span style={contentStyle}>{item.aws}</span>
            </div>
            <div style={sectionStyle}>
              <span style={ossBadgeStyle}>OSS</span>
              <span style={contentStyle}>{item.oss}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreTechStack;
