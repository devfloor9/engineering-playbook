import React from 'react';

const ScalingComparison = () => {
  const approaches = [
    {
      name: '수동',
      nameEn: 'Manual',
      color: '#dc2626',
      trigger: '운영자 판단',
      responseTime: '분~시간',
      accuracy: '낮음',
      complexity: '낮음',
      description: 'kubectl scale 수동 실행'
    },
    {
      name: '반응형',
      nameEn: 'HPA',
      color: '#d97706',
      trigger: 'CPU/메모리 임계값',
      responseTime: '1-3분',
      accuracy: '중간',
      complexity: '낮음',
      description: '후행 지표 기반 자동 스케일링'
    },
    {
      name: '예측형',
      nameEn: 'Predictive',
      color: '#3b82f6',
      trigger: 'ML 예측 모델',
      responseTime: '선제적',
      accuracy: '높음',
      complexity: '높음',
      description: '시계열 예측 기반 선제 프로비저닝'
    },
    {
      name: '자율형',
      nameEn: 'AI Agent',
      color: '#059669',
      trigger: 'AI 컨텍스트 분석',
      responseTime: '실시간',
      accuracy: '매우 높음',
      complexity: '중간',
      description: 'MCP+Agent 자율 스케일링 결정'
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
    background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.625rem 0',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '0.875rem'
  };

  const labelStyle = {
    fontWeight: '600',
    color: '#374151'
  };

  const valueStyle = {
    color: '#6b7280'
  };

  const descriptionStyle = {
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: '1.5'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>⚡ 스케일링 접근 방식 비교</h2>
        <p style={subtitleStyle}>수동 → 반응형 → 예측형 → 자율형</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {approaches.map((approach, index) => (
            <div key={index} style={cardStyle(approach.color)}>
              <div style={badgeStyle(approach.color)}>
                {approach.name} ({approach.nameEn})
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>트리거</span>
                <span style={valueStyle}>{approach.trigger}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>응답 시간</span>
                <span style={valueStyle}>{approach.responseTime}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>정확도</span>
                <span style={valueStyle}>{approach.accuracy}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>복잡도</span>
                <span style={valueStyle}>{approach.complexity}</span>
              </div>
              <div style={descriptionStyle}>
                {approach.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScalingComparison;
