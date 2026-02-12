import React from 'react';

const DataFlowSummary = () => {
  const layers = [
    {
      layer: '수집',
      components: 'ADOT, CW Agent, Fluent Bit, Node Monitor, Flow Monitor',
      role: '메트릭/로그/트레이스/이벤트 수집'
    },
    {
      layer: '전송',
      components: 'OTLP, Remote Write, CW API, X-Ray API',
      role: '표준 프로토콜로 데이터 전달'
    },
    {
      layer: '저장',
      components: 'AMP, CloudWatch Logs/Metrics, X-Ray',
      role: '시계열 저장 및 인덱싱'
    },
    {
      layer: '분석',
      components: 'AMG, CloudWatch AI, DevOps Guru, Application Signals',
      role: 'AI/ML 기반 분석 및 시각화'
    },
    {
      layer: '실행',
      components: 'Hosted MCP, Kiro, Q Developer, Kagent',
      role: 'AI 기반 자동 대응 및 복구'
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
        background: 'linear-gradient(135deg, #155e75 0%, #0891b2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          데이터 흐름 요약
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          5개 레이어의 역할과 구성 요소
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
          gridTemplateColumns: '100px 1fr 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            레이어
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            구성 요소
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
        </div>

        {/* Data Rows */}
        {layers.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 1fr',
            borderBottom: idx < layers.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.layer}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.components}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataFlowSummary;
