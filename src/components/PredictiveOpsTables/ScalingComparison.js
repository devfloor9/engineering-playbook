import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ScalingComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const approaches = [
    {
      name: isKo ? '수동' : 'Manual',
      nameEn: 'Manual',
      color: '#dc2626',
      trigger: isKo ? '운영자 판단' : 'Operator decision',
      responseTime: isKo ? '분~시간' : 'Minutes to hours',
      accuracy: isKo ? '낮음' : 'Low',
      complexity: isKo ? '낮음' : 'Low',
      description: isKo ? 'kubectl scale 수동 실행' : 'Manual kubectl scale execution'
    },
    {
      name: isKo ? '반응형' : 'Reactive',
      nameEn: 'HPA',
      color: '#d97706',
      trigger: isKo ? 'CPU/메모리 임계값' : 'CPU/Memory thresholds',
      responseTime: '1-3' + (isKo ? '분' : ' min'),
      accuracy: isKo ? '중간' : 'Medium',
      complexity: isKo ? '낮음' : 'Low',
      description: isKo ? '후행 지표 기반 자동 스케일링' : 'Autoscaling based on lagging indicators'
    },
    {
      name: isKo ? '예측형' : 'Predictive',
      nameEn: 'Predictive',
      color: '#3b82f6',
      trigger: isKo ? 'ML 예측 모델' : 'ML prediction model',
      responseTime: isKo ? '선제적' : 'Proactive',
      accuracy: isKo ? '높음' : 'High',
      complexity: isKo ? '높음' : 'High',
      description: isKo ? '시계열 예측 기반 선제 프로비저닝' : 'Proactive provisioning based on time series forecasting'
    },
    {
      name: isKo ? '자율형' : 'Autonomous',
      nameEn: 'AI Agent',
      color: '#059669',
      trigger: isKo ? 'AI 컨텍스트 분석' : 'AI context analysis',
      responseTime: isKo ? '실시간' : 'Real-time',
      accuracy: isKo ? '매우 높음' : 'Very high',
      complexity: isKo ? '중간' : 'Medium',
      description: 'MCP+Agent ' + (isKo ? '자율 스케일링 결정' : 'autonomous scaling decisions')
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
        <h2 style={titleStyle}>⚡ {isKo ? '스케일링 접근 방식 비교' : 'Scaling Approach Comparison'}</h2>
        <p style={subtitleStyle}>{isKo ? '수동 → 반응형 → 예측형 → 자율형' : 'Manual → Reactive → Predictive → Autonomous'}</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {approaches.map((approach, index) => (
            <div key={index} style={cardStyle(approach.color)}>
              <div style={badgeStyle(approach.color)}>
                {approach.name} ({approach.nameEn})
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{isKo ? '트리거' : 'Trigger'}</span>
                <span style={valueStyle}>{approach.trigger}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{isKo ? '응답 시간' : 'Response Time'}</span>
                <span style={valueStyle}>{approach.responseTime}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{isKo ? '정확도' : 'Accuracy'}</span>
                <span style={valueStyle}>{approach.accuracy}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>{isKo ? '복잡도' : 'Complexity'}</span>
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
