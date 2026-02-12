import React from 'react';

const ServiceComparison = () => {
  const services = [
    {
      name: 'AMP',
      type: 'Managed OSS',
      color: '#059669',
      cost: '수집 메트릭 기반',
      bestFor: 'Prometheus 호환 메트릭 장기 저장'
    },
    {
      name: 'AMG',
      type: 'Managed OSS',
      color: '#059669',
      cost: '사용자/워크스페이스 기반',
      bestFor: '통합 대시보드 + 알림'
    },
    {
      name: 'CloudWatch',
      type: 'AWS Native',
      color: '#3b82f6',
      cost: '로그/메트릭/요청 기반',
      bestFor: 'AWS 서비스 통합 모니터링'
    },
    {
      name: 'X-Ray',
      type: 'AWS Native',
      color: '#3b82f6',
      cost: '트레이스 샘플링 기반',
      bestFor: '분산 트레이싱'
    },
    {
      name: 'DevOps Guru',
      type: 'AWS AI',
      color: '#8b5cf6',
      cost: '분석 리소스 기반',
      bestFor: 'ML 이상 탐지'
    },
    {
      name: 'Application Signals',
      type: 'AWS Native',
      color: '#3b82f6',
      cost: 'CloudWatch 요금에 포함',
      bestFor: 'zero-code APM'
    }
  ];

  const typeColors = {
    'Managed OSS': '#059669',
    'AWS Native': '#3b82f6',
    'AWS AI': '#8b5cf6'
  };

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)',
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

  const tableContainerStyle = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0 0 8px 8px',
    overflow: 'hidden'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const headerRowStyle = {
    background: '#f3f4f6',
    borderBottom: '2px solid #d1d5db'
  };

  const headerCellStyle = {
    padding: '0.75rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase'
  };

  const rowStyle = (index) => ({
    borderBottom: index < services.length - 1 ? '1px solid #e5e7eb' : 'none'
  });

  const cellStyle = {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#1f2937'
  };

  const serviceNameStyle = {
    fontWeight: 'bold',
    fontSize: '1rem'
  };

  const typeBadgeStyle = (type) => ({
    display: 'inline-block',
    background: typeColors[type],
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  });

  const costStyle = {
    color: '#6b7280',
    fontSize: '0.8125rem'
  };

  const bestForStyle = {
    color: '#059669',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>📊 관찰성 서비스 비교</h3>
        <p style={subtitleStyle}>AWS Native vs Managed OSS vs AI 서비스</p>
      </div>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={headerCellStyle}>Service</th>
              <th style={headerCellStyle}>Type</th>
              <th style={headerCellStyle}>Cost Model</th>
              <th style={headerCellStyle}>Best For</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={index} style={rowStyle(index)}>
                <td style={{...cellStyle, ...serviceNameStyle}}>{service.name}</td>
                <td style={cellStyle}>
                  <span style={typeBadgeStyle(service.type)}>{service.type}</span>
                </td>
                <td style={{...cellStyle, ...costStyle}}>{service.cost}</td>
                <td style={{...cellStyle, ...bestForStyle}}>{service.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceComparison;
