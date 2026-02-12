import React from 'react';

const DashboardPanels = () => {
  const panels = [
    {
      panel: '트래픽 예측 vs 실제',
      dataSource: 'AMP',
      purpose: '예측 정확도 시각화',
      color: '#3b82f6'
    },
    {
      panel: '스케일링 이벤트',
      dataSource: 'AMP + K8s',
      purpose: '선제 vs 반응 스케일링 비교',
      color: '#8b5cf6'
    },
    {
      panel: 'SLO 현황',
      dataSource: 'AMP',
      purpose: 'Error Budget 소진 상태',
      color: '#ec4899'
    },
    {
      panel: '인시던트 타임라인',
      dataSource: 'CloudWatch',
      purpose: '장애 발생·대응·복구 추적',
      color: '#f59e0b'
    },
    {
      panel: '비용 추이',
      dataSource: 'Cost Explorer',
      purpose: 'Right-sizing 효과 모니터링',
      color: '#10b981'
    },
    {
      panel: 'Agent 활동 로그',
      dataSource: 'Kagent/Strands',
      purpose: 'AI Agent 조치 이력',
      color: '#06b6d4'
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: '1.6'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
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

  const panelBadgeStyle = (color) => ({
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
    marginBottom: '0.75rem'
  };

  const labelStyle = {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    marginBottom: '0.25rem'
  };

  const valueStyle = {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: '1.5'
  };

  const footerStyle = {
    backgroundColor: '#fef3c7',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    color: '#92400e',
    borderTop: '2px solid #fbbf24',
    lineHeight: '1.6'
  };

  const footerLabelStyle = {
    fontWeight: '700',
    color: '#78350f'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📊 통합 운영 대시보드 구성</h2>
        <p style={subtitleStyle}>AMG 핵심 대시보드 패널</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {panels.map((panel, index) => (
            <div key={index} style={cardStyle(panel.color)}>
              <div style={panelBadgeStyle(panel.color)}>
                {panel.panel}
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>데이터 소스</div>
                <div style={valueStyle}>{panel.dataSource}</div>
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>목적</div>
                <div style={valueStyle}>{panel.purpose}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>통합 가시성:</span> 통합 운영 대시보드는 예측 데이터와 실제 데이터를 함께 표시하여 예측 정확도, SLO 현황, Error Budget, 인시던트 대응 상황을 한눈에 파악할 수 있습니다.
      </div>
    </div>
  );
};

export default DashboardPanels;
