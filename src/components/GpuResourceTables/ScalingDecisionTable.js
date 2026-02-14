import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ScalingDecisionTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const decisions = [
    {
      condition: isKo ? 'Model A GPU 사용률 > 80%' : isZh ? 'Model A GPU 使用率 > 80%' : 'Model A GPU utilization > 80%',
      action: isKo ? 'Model A Pod 스케일 아웃 트리거' : isZh ? '触发 Model A Pod 扩展' : 'Trigger Model A Pod scale out',
      icon: '📈',
      color: '#dc2626'
    },
    {
      condition: isKo ? 'Model B GPU 사용률 < 30%' : isZh ? 'Model B GPU 使用率 < 30%' : 'Model B GPU utilization < 30%',
      action: isKo ? 'Model B Pod 스케일 인 가능' : isZh ? 'Model B Pod 可以缩减' : 'Model B Pod scale in possible',
      icon: '📉',
      color: '#2563eb'
    },
    {
      condition: isKo ? 'Elastic Pool 가용' : isZh ? 'Elastic Pool 可用' : 'Elastic Pool available',
      action: isKo ? 'Elastic Pool에서 리소스 할당' : isZh ? '从 Elastic Pool 分配资源' : 'Allocate resources from Elastic Pool',
      icon: '🔄',
      color: '#16a34a'
    }
  ];

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          {isKo ? '⚙️ 스케일링 결정 로직' : isZh ? '⚙️ 扩展决策逻辑' : '⚙️ Scaling Decision Logic'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px'
      }}>
        {decisions.map((decision, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              marginBottom: index < decisions.length - 1 ? '12px' : '0',
              background: 'var(--ifm-color-emphasis-50)',
              borderRadius: '8px',
              borderLeft: `4px solid ${decision.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              fontSize: '32px',
              marginRight: '16px',
              flexShrink: 0
            }}>
              {decision.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: decision.color,
                marginBottom: '6px'
              }}>
                {decision.condition}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '8px' }}>→</span>
                {decision.action}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScalingDecisionTable;
