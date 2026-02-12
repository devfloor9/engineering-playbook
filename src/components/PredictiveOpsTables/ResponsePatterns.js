import React from 'react';

const ResponsePatterns = () => {
  const traditional = {
    name: '전통적 대응',
    nameEn: 'Traditional',
    color: '#dc2626',
    steps: [
      'CloudWatch 알림 발생',
      'EventBridge 규칙 매칭',
      'Lambda 함수 실행',
      '정적 런북 실행 (재시작/스케일)',
      '수동 에스컬레이션'
    ],
    limitation: '정적 규칙, 제한적 컨텍스트, 근본 원인 미해결'
  };

  const aiAgent = {
    name: 'AI 에이전트 대응',
    nameEn: 'AI Agent',
    color: '#059669',
    steps: [
      'CloudWatch 알림 + K8s 이벤트 수신',
      'MCP로 메트릭+로그+트레이스+이벤트 통합 수집',
      'AI 근본 원인 분석',
      '컨텍스트 기반 동적 런북 생성',
      '안전한 자동 복구 실행',
      '복구 검증 + 피드백 학습'
    ],
    advantage: '다양한 데이터 소스, 근본 원인 해결, 자가 학습'
  };

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
    background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
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

  const columnsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  };

  const columnStyle = (color) => ({
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

  const stepsContainerStyle = {
    marginBottom: '1rem'
  };

  const stepStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    lineHeight: '1.5'
  };

  const stepNumberStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: color,
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginRight: '0.75rem',
    flexShrink: 0
  });

  const stepTextStyle = {
    color: '#374151',
    paddingTop: '2px'
  };

  const summaryStyle = {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #e5e7eb',
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: '1.5',
    fontWeight: '500'
  };

  const summaryLabelStyle = {
    fontWeight: '700',
    color: '#111827',
    marginBottom: '0.375rem'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🚨 인시던트 대응 패턴 비교</h2>
        <p style={subtitleStyle}>전통적 대응 vs AI 에이전트 대응</p>
      </div>
      <div style={contentStyle}>
        <div style={columnsStyle}>
          <div style={columnStyle(traditional.color)}>
            <div style={badgeStyle(traditional.color)}>
              {traditional.name} ({traditional.nameEn})
            </div>
            <div style={stepsContainerStyle}>
              {traditional.steps.map((step, index) => (
                <div key={index} style={stepStyle}>
                  <span style={stepNumberStyle(traditional.color)}>{index + 1}</span>
                  <span style={stepTextStyle}>{step}</span>
                </div>
              ))}
            </div>
            <div style={summaryStyle}>
              <div style={summaryLabelStyle}>한계:</div>
              {traditional.limitation}
            </div>
          </div>

          <div style={columnStyle(aiAgent.color)}>
            <div style={badgeStyle(aiAgent.color)}>
              {aiAgent.name} ({aiAgent.nameEn})
            </div>
            <div style={stepsContainerStyle}>
              {aiAgent.steps.map((step, index) => (
                <div key={index} style={stepStyle}>
                  <span style={stepNumberStyle(aiAgent.color)}>{index + 1}</span>
                  <span style={stepTextStyle}>{step}</span>
                </div>
              ))}
            </div>
            <div style={summaryStyle}>
              <div style={summaryLabelStyle}>장점:</div>
              {aiAgent.advantage}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsePatterns;
