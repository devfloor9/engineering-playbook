import React from 'react';

const AiopsMaturityModel = () => {
  const levels = [
    {
      level: 0,
      name: '수동',
      color: '#6b7280',
      description: '수동 모니터링, kubectl 기반, 장애 발생 후 대응',
      tools: ['kubectl', '수동 대시보드', '수동 알림']
    },
    {
      level: 1,
      name: '반응형',
      color: '#059669',
      description: 'Managed Add-ons + AMP/AMG, 대시보드 기반 알림',
      tools: ['Managed Add-ons', 'AMP', 'AMG', '대시보드 알림']
    },
    {
      level: 2,
      name: '선언형',
      color: '#3b82f6',
      description: 'Managed Argo CD + ACK + KRO, GitOps 선언적 자동화',
      tools: ['Argo CD', 'ACK', 'KRO', 'GitOps']
    },
    {
      level: 3,
      name: '예측형',
      color: '#8b5cf6',
      description: 'CloudWatch AI + Q Developer, ML 이상 탐지 + 예측 분석',
      tools: ['CloudWatch AI', 'Q Developer', 'ML 이상 탐지', '예측 분석']
    },
    {
      level: 4,
      name: '자율형',
      color: '#d97706',
      description: 'Kiro + MCP + AI Agent 확장, 자율 운영',
      tools: ['Kiro', 'MCP', 'Q Developer', 'Strands', 'Kagent']
    }
  ];

  return (
    <div style={{
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
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          📊 AIOps 성숙도 모델
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Level 0(수동) → Level 4(자율형) 진화 단계
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {levels.map((level, index) => (
          <div
            key={level.level}
            style={{
              borderLeft: `4px solid ${level.color}`,
              padding: '20px',
              borderBottom: index < levels.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
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
                color: '#111827'
              }}>
                {level.name}
              </div>
            </div>

            <div style={{
              color: '#4b5563',
              marginBottom: '12px'
            }}>
              {level.description}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {level.tools.map((tool, i) => (
                <span
                  key={i}
                  style={{
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiopsMaturityModel;
