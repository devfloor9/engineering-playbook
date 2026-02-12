import React from 'react';

const ChaosExperiments = () => {
  const experiments = [
    {
      experiment: 'Pod 종료',
      injectedFault: '2/3 Pod 종료',
      systemReaction: 'HPA 30초 후 복구',
      aiLearning: '"Pod 종료 → HPA 반응 패턴"',
      color: '#ef4444'
    },
    {
      experiment: '노드 장애',
      injectedFault: '노드 1대 drain',
      systemReaction: 'Karpenter 2분 후 대체',
      aiLearning: '"노드 장애 → Karpenter 대응 시간"',
      color: '#f97316'
    },
    {
      experiment: '네트워크 지연',
      injectedFault: '100ms 추가 지연',
      systemReaction: '타임아웃 에러 급증',
      aiLearning: '"네트워크 지연 → 타임아웃 임계값"',
      color: '#f59e0b'
    },
    {
      experiment: 'CPU 스트레스',
      injectedFault: '90% CPU 부하',
      systemReaction: '스로틀링 발생',
      aiLearning: '"CPU 스트레스 → 스로틀링 패턴"',
      color: '#84cc16'
    },
    {
      experiment: '메모리 누수',
      injectedFault: '점진적 메모리 증가',
      systemReaction: 'OOMKilled 발생',
      aiLearning: '"메모리 누수 패턴 → 사전 감지 규칙"',
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
    background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '15px'
  };

  const thStyle = {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '700',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '0.9375rem'
  };

  const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '15px',
    verticalAlign: 'top'
  };

  const experimentBadgeStyle = (color) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600'
  });

  const learningStyle = {
    fontStyle: 'italic',
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: '0.5rem',
    borderRadius: '4px',
    borderLeft: '3px solid #10b981'
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
        <h2 style={titleStyle}>💥 Chaos Engineering 실험 결과</h2>
        <p style={subtitleStyle}>AWS FIS 기반 장애 주입 및 AI 학습</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>실험</th>
              <th style={thStyle}>주입 장애</th>
              <th style={thStyle}>시스템 반응</th>
              <th style={thStyle}>AI 학습</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>
                  <div style={experimentBadgeStyle(item.color)}>
                    {item.experiment}
                  </div>
                </td>
                <td style={tdStyle}>{item.injectedFault}</td>
                <td style={tdStyle}>{item.systemReaction}</td>
                <td style={tdStyle}>
                  <div style={learningStyle}>
                    {item.aiLearning}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>피드백 루프:</span> FIS로 장애를 주입하고 AI가 시스템 반응 패턴을 학습하면, AI Agent의 자동 대응 능력이 지속적으로 향상됩니다. "장애 주입 → 관찰 → 학습 → 대응 개선"의 선순환이 자율 운영의 핵심입니다.
      </div>
    </div>
  );
};

export default ChaosExperiments;
