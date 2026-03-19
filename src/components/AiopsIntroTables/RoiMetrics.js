import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RoiMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      name: isKo ? 'MTTR 개선' : isZh ? 'MTTR 改善' : 'MTTR Improvement',
      before: isKo ? '4시간' : isZh ? '4 小时' : '4 hours',
      after: isKo ? '45분' : isZh ? '45 分钟' : '45 min',
      improvement: '-81%',
      color: '#059669'
    },
    {
      name: isKo ? 'MTTD 개선' : isZh ? 'MTTD 改善' : 'MTTD Improvement',
      before: isKo ? '30분' : isZh ? '30 分钟' : '30 min',
      after: isKo ? '3분' : isZh ? '3 分钟' : '3 min',
      improvement: '-90%',
      color: '#3b82f6'
    },
    {
      name: isKo ? '알림 노이즈 감소' : isZh ? '告警噪音降低' : 'Alert Noise Reduction',
      before: isKo ? '500건/일' : isZh ? '500 条/日' : '500/day',
      after: isKo ? '50건/일' : isZh ? '50 条/日' : '50/day',
      improvement: '-90%',
      color: '#8b5cf6'
    },
    {
      name: isKo ? '비용 절감' : isZh ? '成本降低' : 'Cost Reduction',
      before: isKo ? '과잉 프로비저닝' : isZh ? '过度配置' : 'Over-provisioning',
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
          {isKo ? '💰 AIOps ROI 핵심 지표' : isZh ? '💰 AIOps ROI 核心指标' : '💰 AIOps ROI Key Metrics'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
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
                background: 'var(--ifm-background-surface-color)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--ifm-color-emphasis-200)',
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
                color: 'var(--ifm-font-color-base)',
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
                color: 'var(--ifm-color-emphasis-600)'
              }}>
                <span style={{
                  background: 'var(--ifm-color-emphasis-100)',
                  color: '#dc2626',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {metric.before}
                </span>
                <span>→</span>
                <span style={{
                  background: 'var(--ifm-color-emphasis-100)',
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
