import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const AiopsMaturityModel = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const levels = [{
    level: 0,
    name: isKo ? '수동' : 'Manual',
    color: 'var(--ifm-color-emphasis-600)',
    description: isKo ? '수동 모니터링, kubectl 기반, 장애 발생 후 대응' : 'Manual monitoring, kubectl-based, reactive to failures',
    tools: isKo ? ['kubectl', '수동 대시보드', '수동 알림'] : ['kubectl', 'Manual dashboards', 'Manual alerts']
  }, {
    level: 1,
    name: isKo ? '반응형' : 'Reactive',
    color: '#059669',
    description: isKo ? 'Managed Add-ons + AMP/AMG, 대시보드 기반 알림' : 'Managed Add-ons + AMP/AMG, dashboard-based alerting',
    tools: isKo ? ['Managed Add-ons', 'AMP', 'AMG', '대시보드 알림'] : ['Managed Add-ons', 'AMP', 'AMG', 'Dashboard alerts']
  }, {
    level: 2,
    name: isKo ? '선언형' : 'Declarative',
    color: '#3b82f6',
    description: isKo ? 'Managed Argo CD + ACK + KRO, GitOps 선언적 자동화' : 'Managed Argo CD + ACK + KRO, GitOps declarative automation',
    tools: ['Argo CD', 'ACK', 'KRO', 'GitOps']
  }, {
    level: 3,
    name: isKo ? '예측형' : 'Predictive',
    color: '#8b5cf6',
    description: isKo ? 'CloudWatch AI + Q Developer, ML 이상 탐지 + 예측 분석' : 'CloudWatch AI + Q Developer, ML anomaly detection + predictive analytics',
    tools: isKo ? ['CloudWatch AI', 'Q Developer', 'ML 이상 탐지', '예측 분석'] : ['CloudWatch AI', 'Q Developer', 'ML Anomaly Detection', 'Predictive Analytics']
  }, {
    level: 4,
    name: isKo ? '자율형' : 'Autonomous',
    color: '#d97706',
    description: isKo ? 'Kiro + MCP + AI Agent 확장, 자율 운영' : 'Kiro + MCP + AI Agent expansion, autonomous operations',
    tools: ['Kiro', 'MCP', 'Q Developer', 'Strands', 'Kagent']
  }];
  return <div style={{
    maxWidth: '760px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '📊 AIOps 성숙도 모델' : '📊 AIOps Maturity Model'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'Level 0(수동) → Level 4(자율형) 진화 단계' : 'Evolution: Level 0 (Manual) → Level 4 (Autonomous)'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        {levels.map((level, index) => <div key={level.level} style={{
        borderLeft: `4px solid ${level.color}`,
        padding: '20px',
        borderBottom: index < levels.length - 1 ? '1px solid #f3f4f6' : 'none'
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
              <div style={{
            background: level.color,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
                Level {level.level}
              </div>
              <div style={{
            fontSize: '17px',
            fontWeight: '600',
            color: 'var(--ifm-font-color-base)'
          }}>
                {level.name}
              </div>
            </div>

            <div style={{
          color: 'var(--ifm-font-color-base)',
          marginBottom: '12px'
        }}>
              {level.description}
            </div>

            <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
              {level.tools.map((tool, i) => <span key={i} style={{
            background: 'var(--ifm-color-emphasis-100)',
            color: 'var(--ifm-color-emphasis-600)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
                  {tool}
                </span>)}
            </div>
          </div>)}
      </div>
    </div>;
};
export default AiopsMaturityModel;