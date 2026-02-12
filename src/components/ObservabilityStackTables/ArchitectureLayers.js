import React from 'react';

const ArchitectureLayers = () => {
  const layers = [
    {
      name: '수집 (Collection)',
      color: '#3b82f6',
      description: '관찰성 데이터를 생성하고 수집',
      components: ['ADOT Collector', 'CloudWatch Agent', 'Fluent Bit', 'Node Monitoring Agent']
    },
    {
      name: '전송 (Transport)',
      color: '#8b5cf6',
      description: '수집된 데이터를 백엔드로 전송',
      components: ['OTLP/gRPC', 'Prometheus Remote Write', 'CloudWatch API', 'X-Ray API']
    },
    {
      name: '저장 (Storage)',
      color: '#059669',
      description: '관찰성 데이터를 장기 저장',
      components: ['AMP (Prometheus)', 'CloudWatch Logs/Metrics', 'X-Ray Traces', 'S3']
    },
    {
      name: '분석 (Analysis)',
      color: '#d97706',
      description: '데이터를 쿼리하고 시각화',
      components: ['AMG (Grafana)', 'CloudWatch AI', 'DevOps Guru', 'Q Developer']
    },
    {
      name: '액션 (Action)',
      color: '#dc2626',
      description: '인사이트에 기반한 자동화',
      components: ['Kiro + MCP', 'AI Agents', '자동 복구', '에스컬레이션']
    }
  ];

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '8px 8px 0 0',
    marginBottom: '1rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    opacity: 0.9,
    margin: 0
  };

  const layersContainerStyle = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0 0 8px 8px',
    padding: '1rem'
  };

  const layerStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    padding: '1rem',
    marginBottom: '1rem',
    background: '#f9fafb',
    borderRadius: '4px'
  });

  const badgeStyle = (color) => ({
    display: 'inline-block',
    background: color,
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  });

  const descriptionStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.75rem'
  };

  const componentsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  };

  const componentTagStyle = {
    background: 'white',
    border: '1px solid #d1d5db',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#374151'
  };

  const arrowStyle = {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: '#9ca3af',
    margin: '0.5rem 0'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🏗️ 관찰성 아키텍처 레이어</h3>
        <p style={subtitleStyle}>수집 → 전송 → 저장 → 분석 → 액션</p>
      </div>
      <div style={layersContainerStyle}>
        {layers.map((layer, index) => (
          <React.Fragment key={index}>
            <div style={layerStyle(layer.color)}>
              <div style={badgeStyle(layer.color)}>{layer.name}</div>
              <div style={descriptionStyle}>{layer.description}</div>
              <div style={componentsStyle}>
                {layer.components.map((component, idx) => (
                  <span key={idx} style={componentTagStyle}>{component}</span>
                ))}
              </div>
            </div>
            {index < layers.length - 1 && (
              <div style={arrowStyle}>↓</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ArchitectureLayers;
