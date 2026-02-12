import React from 'react';

const RoiMetrics = () => {
  const metrics = [
    {
      name: 'MTTR 개선',
      before: '4시간',
      after: '45분',
      improvement: '-81%',
      color: '#059669'
    },
    {
      name: 'MTTD 개선',
      before: '30분',
      after: '3분',
      improvement: '-90%',
      color: '#3b82f6'
    },
    {
      name: '알림 노이즈 감소',
      before: '500건/일',
      after: '50건/일',
      improvement: '-90%',
      color: '#8b5cf6'
    },
    {
      name: '비용 절감',
      before: '과잉 프로비저닝',
      after: 'AI Right-Sizing',
      improvement: '-35%',
      color: '#d97706'
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
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          💰 AIOps ROI 핵심 지표
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px'
        }}>
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                background: '#f9fafb',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: metric.color,
                marginBottom: '8px'
              }}>
                {metric.improvement}
              </div>

              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '12px'
              }}>
                {metric.name}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <span style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {metric.before}
                </span>
                <span>→</span>
                <span style={{
                  background: '#dcfce7',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {metric.after}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoiMetrics;
