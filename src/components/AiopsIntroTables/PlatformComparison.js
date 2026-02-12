import React from 'react';

const PlatformComparison = () => {
  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  };

  const subtitleStyle = {
    fontSize: '0.95rem',
    color: '#6b7280',
    lineHeight: '1.6',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  };

  const cardHeaderPurpleStyle = {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    padding: '1rem',
    color: '#ffffff',
  };

  const cardHeaderBlueStyle = {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    padding: '1rem',
    color: '#ffffff',
  };

  const cardTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0',
  };

  const cardBodyStyle = {
    padding: '1.25rem',
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '0.875rem',
  };

  const lastItemStyle = {
    ...itemStyle,
    marginBottom: '0',
  };

  const iconStyle = {
    fontSize: '1.25rem',
    marginRight: '0.75rem',
    flexShrink: '0',
    marginTop: '0.125rem',
  };

  const textStyle = {
    fontSize: '0.9375rem',
    color: '#374151',
    lineHeight: '1.5',
  };

  const summaryStyle = {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    color: '#6b7280',
    fontWeight: '500',
  };

  const leftCardData = [
    { icon: '🧠', text: 'LLM 서빙 및 추론 최적화' },
    { icon: '🚀', text: 'vLLM, llm-d 배포 구성' },
    { icon: '🎮', text: 'GPU 리소스 관리' },
    { icon: '⚡', text: '실시간 추론 패턴' },
  ];

  const rightCardData = [
    { icon: '🤖', text: 'AI로 플랫폼 자체를 운영하고 개발' },
    { icon: '🔧', text: 'Kiro+MCP 기반 프로그래머틱 자동화' },
    { icon: '📊', text: '예측 스케일링, AI Agent 자율 운영' },
    { icon: '📐', text: '관찰성 스택, AIDLC 개발 방법론' },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>플랫폼 비교</h2>
        <p style={subtitleStyle}>
          AI 인프라의 두 가지 핵심 관점: 워크로드 실행 vs 운영 방법론
        </p>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderPurpleStyle}>
            <h3 style={cardTitleStyle}>Agentic AI Platform</h3>
          </div>
          <div style={cardBodyStyle}>
            {leftCardData.map((item, index) => (
              <div
                key={index}
                style={index === leftCardData.length - 1 ? lastItemStyle : itemStyle}
              >
                <span style={iconStyle}>{item.icon}</span>
                <span style={textStyle}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderBlueStyle}>
            <h3 style={cardTitleStyle}>AIops & AIDLC</h3>
          </div>
          <div style={cardBodyStyle}>
            {rightCardData.map((item, index) => (
              <div
                key={index}
                style={index === rightCardData.length - 1 ? lastItemStyle : itemStyle}
              >
                <span style={iconStyle}>{item.icon}</span>
                <span style={textStyle}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={summaryStyle}>
        AI 워크로드를 실행하는 플랫폼 vs AI로 플랫폼을 운영하는 방법론
      </div>
    </div>
  );
};

export default PlatformComparison;
