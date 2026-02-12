import React from 'react';

const ApplicationSignalsLanguages = () => {
  const languages = [
    {
      language: 'Java',
      instrumentation: 'ADOT Java Agent 자동 주입',
      status: 'GA',
      statusColor: '#10b981'
    },
    {
      language: 'Python',
      instrumentation: 'ADOT Python Auto-instrumentation',
      status: 'GA',
      statusColor: '#10b981'
    },
    {
      language: '.NET',
      instrumentation: 'ADOT .NET Auto-instrumentation',
      status: 'GA',
      statusColor: '#10b981'
    },
    {
      language: 'Node.js',
      instrumentation: 'ADOT Node.js Auto-instrumentation',
      status: 'GA',
      statusColor: '#10b981'
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
        background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          Application Signals 지원 언어
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Zero-code 계측 지원 현황
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
          gridTemplateColumns: '120px 1fr 100px',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            언어
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            계측 방식
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            상태
          </div>
        </div>

        {/* Data Rows */}
        {languages.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 100px',
            borderBottom: idx < languages.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.language}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.instrumentation}
            </div>
            <div style={{
              padding: '14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                background: item.statusColor,
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {item.status}
              </span>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          💡 <strong>Zero-code 계측:</strong> Instrumentation CRD로 Pod에 annotation만 추가하면 자동으로 계측 에이전트가 주입됩니다.
          코드 변경 없이 서비스 맵, SLI/SLO가 생성됩니다.
        </div>
      </div>
    </div>
  );
};

export default ApplicationSignalsLanguages;
