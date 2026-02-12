import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DataFlowSummary = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const layers = [
    {
      layer: isKo ? '수집' : 'Collection',
      components: 'ADOT, CW Agent, Fluent Bit, Node Monitor, Flow Monitor',
      role: isKo ? '메트릭/로그/트레이스/이벤트 수집' : 'Collect metrics/logs/traces/events'
    },
    {
      layer: isKo ? '전송' : 'Transport',
      components: 'OTLP, Remote Write, CW API, X-Ray API',
      role: isKo ? '표준 프로토콜로 데이터 전달' : 'Deliver data via standard protocols'
    },
    {
      layer: isKo ? '저장' : 'Storage',
      components: 'AMP, CloudWatch Logs/Metrics, X-Ray',
      role: isKo ? '시계열 저장 및 인덱싱' : 'Time-series storage and indexing'
    },
    {
      layer: isKo ? '분석' : 'Analysis',
      components: 'AMG, CloudWatch AI, DevOps Guru, Application Signals',
      role: isKo ? 'AI/ML 기반 분석 및 시각화' : 'AI/ML-based analysis and visualization'
    },
    {
      layer: isKo ? '실행' : 'Action',
      components: 'Hosted MCP, Kiro, Q Developer, Kagent',
      role: isKo ? 'AI 기반 자동 대응 및 복구' : 'AI-based auto-response and remediation'
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
          {isKo ? '데이터 흐름 요약' : 'Data Flow Summary'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '5개 레이어의 역할과 구성 요소' : 'Roles and components of 5 layers'}
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
            {isKo ? '레이어' : 'Layer'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '구성 요소' : 'Components'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '역할' : 'Role'}
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
