import React from 'react';

const CoreTechStack = () => {
  const groups = [
    {
      title: 'Data & Observability',
      color: '#059669',
      bgColor: '#ecfdf5',
      items: [
        { icon: '📊', area: 'Observability', aws: 'CloudWatch, X-Ray, AMP, AMG', oss: 'ADOT, Grafana' },
        { icon: '🔍', area: 'Anomaly Detection', aws: 'DevOps Guru, CloudWatch AI', oss: 'Prometheus + ML' }
      ]
    },
    {
      title: 'AI Development',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      items: [
        { icon: '🤖', area: 'AI Coding', aws: 'Kiro, Q Developer', oss: 'Claude Code, Cursor' },
        { icon: '🔗', area: 'MCP Integration', aws: 'Individual (50+ GA), Managed, Unified', oss: 'Kagent (kmcp)' }
      ]
    },
    {
      title: 'Deployment & Infra',
      color: '#ea580c',
      bgColor: '#fff7ed',
      items: [
        { icon: '🔄', area: 'GitOps', aws: 'Managed Argo CD', oss: 'Argo CD' },
        { icon: '📦', area: 'IaC', aws: 'ACK (50+ CRD), KRO', oss: 'Terraform, Helm' },
        { icon: '🌐', area: 'Networking', aws: 'LBC v3 (Gateway API GA)', oss: 'Gateway API' }
      ]
    },
    {
      title: 'Intelligent Ops',
      color: '#2563eb',
      bgColor: '#eff6ff',
      items: [
        { icon: '🧠', area: 'AI Agent', aws: 'Q Developer, Strands', oss: 'Kagent' },
        { icon: '📈', area: 'Predictive Scaling', aws: 'CloudWatch Anomaly Detection', oss: 'Prophet, ARIMA' },
        { icon: '⚙️', area: 'Node Mgmt', aws: 'Karpenter', oss: '-' }
      ]
    }
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
        color: 'white',
        padding: '1.5rem 2rem',
        borderRadius: '12px 12px 0 0',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
          Core Technology Stack
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
          AWS Services & Open Source Tools for AIops & AIDLC
        </p>
      </div>

      {/* Body */}
      <div style={{
        background: '#ffffff',
        borderRadius: '0 0 12px 12px',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? '1rem' : 0 }}>
            {/* Group Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.625rem'
            }}>
              <div style={{
                width: '4px',
                height: '20px',
                background: group.color,
                borderRadius: '2px'
              }} />
              <span style={{
                fontSize: '0.8125rem',
                fontWeight: '700',
                color: group.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {group.title}
              </span>
            </div>

            {/* Items Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: group.items.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              {group.items.map((item, ii) => (
                <div key={ii} style={{
                  background: group.bgColor,
                  borderRadius: '8px',
                  padding: '0.75rem',
                  border: `1px solid ${group.color}20`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span style={{
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      {item.area}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    lineHeight: '1.5',
                    color: '#374151'
                  }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <span style={{
                        display: 'inline-block',
                        background: '#fff7ed',
                        color: '#ea580c',
                        border: '1px solid #fed7aa',
                        padding: '0 0.375rem',
                        borderRadius: '3px',
                        fontSize: '0.625rem',
                        fontWeight: '700',
                        marginRight: '0.375rem',
                        verticalAlign: 'middle'
                      }}>AWS</span>
                      <span style={{ verticalAlign: 'middle' }}>{item.aws}</span>
                    </div>
                    {item.oss !== '-' && (
                      <div>
                        <span style={{
                          display: 'inline-block',
                          background: '#f0fdf4',
                          color: '#059669',
                          border: '1px solid #bbf7d0',
                          padding: '0 0.375rem',
                          borderRadius: '3px',
                          fontSize: '0.625rem',
                          fontWeight: '700',
                          marginRight: '0.375rem',
                          verticalAlign: 'middle'
                        }}>OSS</span>
                        <span style={{ verticalAlign: 'middle' }}>{item.oss}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Flow Indicator */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#64748b',
          fontFamily: 'Menlo, Monaco, Courier New, monospace'
        }}>
          Observability → Anomaly Detection → AI Agent Response → Predictive Scaling → Auto-Remediation
        </div>
      </div>
    </div>
  );
};

export default CoreTechStack;
