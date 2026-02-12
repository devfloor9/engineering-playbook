import React from 'react';

const MaturityTable = () => {
  const levels = [
    {
      name: '반응형',
      nameEn: 'Reactive',
      color: '#dc2626',
      characteristics: [
        '장애 후 대응',
        '수동 분석',
        '정적 임계값 알림'
      ],
      tools: [
        'CloudWatch Alarms',
        'EventBridge',
        'Lambda 런북'
      ],
      kpis: [
        'MTTR 4시간',
        'MTTD 30분',
        '알림 500건/일'
      ]
    },
    {
      name: '예측형',
      nameEn: 'Predictive',
      color: '#3b82f6',
      characteristics: [
        'ML 이상 탐지',
        '선제적 스케일링',
        '패턴 기반 분석'
      ],
      tools: [
        'DevOps Guru',
        'CloudWatch AI',
        'Prophet',
        'Karpenter'
      ],
      kpis: [
        'MTTR 1시간',
        'MTTD 5분',
        '알림 100건/일'
      ]
    },
    {
      name: '자율형',
      nameEn: 'Autonomous',
      color: '#059669',
      characteristics: [
        'AI 자율 대응',
        '자가 치유',
        '지속 학습'
      ],
      tools: [
        'Kiro+MCP',
        'Kagent',
        'Strands',
        'Q Developer'
      ],
      kpis: [
        'MTTR 15분',
        'MTTD 1분',
        '알림 20건/일'
      ]
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)',
    color: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: '0.95rem',
    opacity: 0.95,
    fontWeight: '400'
  };

  const contentStyle = {
    padding: '1.5rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem'
  };

  const cardStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  });

  const badgeStyle = (color) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem'
  });

  const sectionStyle = {
    marginBottom: '1.25rem'
  };

  const sectionTitleStyle = {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '0.625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  };

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const listItemStyle = {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '0.5rem',
    paddingLeft: '1rem',
    position: 'relative'
  };

  const bulletStyle = {
    position: 'absolute',
    left: 0,
    top: '0.5em',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🎯 운영 성숙도 모델</h2>
        <p style={subtitleStyle}>반응형 → 예측형 → 자율형 진화</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {levels.map((level, index) => (
            <div key={index} style={cardStyle(level.color)}>
              <div style={badgeStyle(level.color)}>
                {level.name} ({level.nameEn})
              </div>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>특성</div>
                <ul style={listStyle}>
                  {level.characteristics.map((item, idx) => (
                    <li key={idx} style={listItemStyle}>
                      <span style={bulletStyle}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>도구</div>
                <ul style={listStyle}>
                  {level.tools.map((item, idx) => (
                    <li key={idx} style={listItemStyle}>
                      <span style={bulletStyle}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>KPI</div>
                <ul style={listStyle}>
                  {level.kpis.map((item, idx) => (
                    <li key={idx} style={listItemStyle}>
                      <span style={bulletStyle}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaturityTable;
