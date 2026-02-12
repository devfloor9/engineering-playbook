import React from 'react';

const ErrorBudget = () => {
  const budgets = [
    {
      slo: '99.9%',
      budget: '0.1%',
      downtime: '43.2분'
    },
    {
      slo: '99.95%',
      budget: '0.05%',
      downtime: '21.6분'
    },
    {
      slo: '99.99%',
      budget: '0.01%',
      downtime: '4.32분'
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
        background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          Error Budget 개념
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          SLO 기반 허용 오류율 및 다운타임
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
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            SLO
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            월간 Error Budget
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            허용 다운타임
          </div>
        </div>

        {/* Data Rows */}
        {budgets.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: idx < budgets.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              fontSize: '16px',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {item.slo}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '14px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {item.budget}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '14px',
              color: '#dc2626',
              fontWeight: '600',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {item.downtime}
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
          💡 <strong>Error Budget 기반 알림:</strong> 단순 임계값 대신 Error Budget 소진율로 알림하면 Alert Fatigue를 70% 감소시킬 수 있습니다.
        </div>
      </div>
    </div>
  );
};

export default ErrorBudget;
