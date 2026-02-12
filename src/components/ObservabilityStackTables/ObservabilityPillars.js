import React from 'react';

const ObservabilityPillars = () => {
  const pillars = [
    {
      pillar: 'Metrics',
      role: '수치적 시계열 데이터',
      service: 'AMP (Amazon Managed Prometheus), CloudWatch Metrics'
    },
    {
      pillar: 'Logs',
      role: '이벤트 기반 텍스트 데이터',
      service: 'CloudWatch Logs, OpenSearch'
    },
    {
      pillar: 'Traces',
      role: '분산 요청 추적',
      service: 'AWS X-Ray, ADOT'
    },
    {
      pillar: 'AI 분석',
      role: 'ML 기반 이상 탐지 및 인사이트',
      service: 'DevOps Guru, CloudWatch AI, Q Developer'
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          3-Pillar 관찰성 + AI 분석 레이어
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          관찰성의 세 기둥과 AI 분석의 결합
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 200px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            필러
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            역할
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            AWS 서비스
          </div>
        </div>

        {/* Data Rows */}
        {pillars.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 200px 1fr',
            borderBottom: idx < pillars.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.pillar}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.role}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.service}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ObservabilityPillars;
