import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CoreTechStack = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const groups = [
    {
      title: isKo ? '데이터 & 관찰성' : isZh ? '数据与可观测性' : 'Data & Observability',
      color: '#059669',
      bgColor: '#ecfdf5',
      items: [
        { icon: '📊', area: isKo ? '관찰성' : isZh ? '可观测性' : 'Observability', aws: 'CloudWatch, X-Ray, AMP, AMG', oss: 'ADOT, Grafana' },
        { icon: '🔍', area: isKo ? '이상 탐지' : isZh ? '异常检测' : 'Anomaly Detection', aws: 'DevOps Guru, CloudWatch AI', oss: 'Prometheus + ML' }
      ]
    },
    {
      title: isKo ? 'AI 개발' : isZh ? 'AI 开发' : 'AI Development',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      items: [
        { icon: '🤖', area: isKo ? 'AI 코딩' : isZh ? 'AI 编码' : 'AI Coding', aws: 'Kiro, Q Developer', oss: 'Claude Code, Cursor' },
        { icon: '🔗', area: isKo ? 'MCP 통합' : isZh ? 'MCP 集成' : 'MCP Integration', aws: isKo ? 'Individual (50+ GA), Managed, Unified' : isZh ? '独立（50+ GA）、托管、统一' : 'Individual (50+ GA), Managed, Unified', oss: 'Kagent (kmcp)' }
      ]
    },
    {
      title: isKo ? '배포 & 인프라' : isZh ? '部署与基础设施' : 'Deployment & Infra',
      color: '#ea580c',
      bgColor: '#fff7ed',
      items: [
        { icon: '🔄', area: 'GitOps', aws: 'Managed Argo CD', oss: 'Argo CD' },
        { icon: '📦', area: 'IaC', aws: 'ACK (50+ CRD), KRO', oss: 'Terraform, Helm' },
        { icon: '🌐', area: isKo ? '네트워킹' : isZh ? '网络' : 'Networking', aws: 'LBC v3 (Gateway API GA)', oss: 'Gateway API' }
      ]
    },
    {
      title: isKo ? '지능형 운영' : isZh ? '智能运维' : 'Intelligent Ops',
      color: '#2563eb',
      bgColor: 'var(--ifm-color-emphasis-100)',
      items: [
        { icon: '🧠', area: 'AI Agent', aws: 'Q Developer, Strands', oss: 'Kagent' },
        { icon: '📈', area: isKo ? '예측 스케일링' : isZh ? '预测性扩展' : 'Predictive Scaling', aws: 'CloudWatch Anomaly Detection', oss: 'Prophet, ARIMA' },
        { icon: '⚙️', area: isKo ? '노드 관리' : isZh ? '节点管理' : 'Node Mgmt', aws: 'Karpenter', oss: '-' }
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
          {isKo ? '핵심 기술 스택' : isZh ? '核心技术栈' : 'Core Technology Stack'}
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
          {isKo ? 'AIops & AIDLC를 위한 AWS 서비스 & 오픈소스 도구' : isZh ? 'AIops & AIDLC 的 AWS 服务与开源工具' : 'AWS Services & Open Source Tools for AIops & AIDLC'}
        </p>
      </div>

      {/* Body */}
      <div style={{
        background: 'var(--ifm-background-surface-color)',
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
                      color: 'var(--ifm-font-color-base)'
                    }}>
                      {item.area}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    lineHeight: '1.5',
                    color: 'var(--ifm-font-color-base)'
                  }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <span style={{
                        display: 'inline-block',
                        background: 'var(--ifm-color-emphasis-100)',
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
                          background: 'var(--ifm-color-emphasis-100)',
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
          background: 'var(--ifm-background-surface-color)',
          borderRadius: '8px',
          border: '1px solid var(--ifm-color-emphasis-200)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--ifm-color-emphasis-600)',
          fontFamily: 'Menlo, Monaco, Courier New, monospace'
        }}>
          {isKo ? '관찰성 → 이상 탐지 → AI Agent 대응 → 예측 스케일링 → 자동 복구' : isZh ? '可观测性 → 异常检测 → AI Agent 响应 → 预测性扩展 → 自动修复' : 'Observability → Anomaly Detection → AI Agent Response → Predictive Scaling → Auto-Remediation'}
        </div>
      </div>
    </div>
  );
};

export default CoreTechStack;
