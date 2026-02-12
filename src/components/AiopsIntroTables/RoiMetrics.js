import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RoiMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const metrics = [
    {
      name: isKo ? 'MTTR 개선' : 'MTTR Improvement',
      before: isKo ? '4시간' : '4 hours',
      after: isKo ? '45분' : '45 min',
      improvement: '-81%',
      color: '#059669'
    },
    {
      name: isKo ? 'MTTD 개선' : 'MTTD Improvement',
      before: isKo ? '30분' : '30 min',
      after: isKo ? '3분' : '3 min',
      improvement: '-90%',
      color: '#3b82f6'
    },
    {
      name: isKo ? '알림 노이즈 감소' : 'Alert Noise Reduction',
      before: isKo ? '500건/일' : '500/day',
      after: isKo ? '50건/일' : '50/day',
      improvement: '-90%',
      color: '#8b5cf6'
    },
    {
      name: isKo ? '비용 절감' : 'Cost Reduction',
      before: isKo ? '과잉 프로비저닝' : 'Over-provisioning',
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
          {isKo ? '💰 AIOps ROI 핵심 지표' : '💰 AIOps ROI Key Metrics'}
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
