import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ErrorBudget = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const budgets = [
    {
      slo: '99.9%',
      budget: '0.1%',
      downtime: isKo ? '43.2분' : isZh ? '43.2 分钟' : '43.2 min'
    },
    {
      slo: '99.95%',
      budget: '0.05%',
      downtime: isKo ? '21.6분' : isZh ? '21.6 分钟' : '21.6 min'
    },
    {
      slo: '99.99%',
      budget: '0.01%',
      downtime: isKo ? '4.32분' : isZh ? '4.32 分钟' : '4.32 min'
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
          {isKo ? 'Error Budget 개념' : isZh ? 'Error Budget 概念' : 'Error Budget Concept'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'SLO 기반 허용 오류율 및 다운타임' : isZh ? '基于 SLO 的可接受错误率和停机时间' : 'SLO-based acceptable error rate and downtime'}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '2px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            SLO
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '월간 Error Budget' : isZh ? '月度 Error Budget' : 'Monthly Error Budget'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '허용 다운타임' : isZh ? '允许的停机时间' : 'Allowed Downtime'}
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
              background: 'var(--ifm-background-surface-color)',
              fontWeight: '700',
              fontSize: '16px',
              color: 'var(--ifm-font-color-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {item.slo}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '14px',
              color: 'var(--ifm-font-color-base)',
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
          background: 'var(--ifm-color-emphasis-100)',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-700)',
          lineHeight: '1.6'
        }}>
          💡 <strong>{isKo ? 'Error Budget 기반 알림:' : isZh ? '基于 Error Budget 的告警:' : 'Error Budget-based Alerts:'}</strong> {isKo ? '단순 임계값 대신 Error Budget 소진율로 알림하면 Alert Fatigue를 70% 감소시킬 수 있습니다.' : isZh ? '基于 Error Budget 消耗率进行告警而非简单阈值，可将告警疲劳减少 70%。' : 'Alerting based on Error Budget burn rate instead of simple thresholds can reduce Alert Fatigue by 70%.'}
        </div>
      </div>
    </div>
  );
};

export default ErrorBudget;
