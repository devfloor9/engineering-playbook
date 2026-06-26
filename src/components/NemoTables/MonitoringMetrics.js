import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const MonitoringMetrics = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const metrics = [{
    metric: 'training_loss',
    description: isKo ? '학습 손실' : 'Training loss',
    threshold: isKo ? '지속적 감소' : 'Continuous decrease',
    color: '#4285f4',
    status: 'good'
  }, {
    metric: 'validation_loss',
    description: isKo ? '검증 손실' : 'Validation loss',
    threshold: isKo ? '학습 손실과 유사' : 'Similar to training loss',
    color: '#34a853',
    status: 'good'
  }, {
    metric: 'gpu_utilization',
    description: isKo ? 'GPU 사용률' : 'GPU utilization',
    threshold: '> 80%',
    color: '#fbbc04',
    status: 'warning'
  }, {
    metric: 'gpu_memory_used',
    description: isKo ? 'GPU 메모리 사용량' : 'GPU memory usage',
    threshold: '< 95%',
    color: '#ea4335',
    status: 'critical'
  }, {
    metric: 'throughput_tokens_per_sec',
    description: isKo ? '처리량' : 'Throughput',
    threshold: isKo ? '모니터링' : 'Monitor',
    color: '#9c27b0',
    status: 'good'
  }];
  return <div style={{
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #76b900 0%, #5a8a00 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? '주요 모니터링 메트릭' : 'Key Monitoring Metrics'}
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
        gap: '12px'
      }}>
          {metrics.map((item, index) => <div key={index} style={{
          background: 'var(--ifm-color-emphasis-50)',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: `4px solid ${item.color}`,
          display: 'grid',
          gridTemplateColumns: '250px 1fr 150px',
          gap: '16px',
          alignItems: 'center'
        }}>
              <div style={{
            fontWeight: '600',
            color: item.color,
            fontFamily: 'monospace'
          }}>
                {item.metric}
              </div>
              <div style={{
            fontSize: '14px',
            color: 'var(--ifm-font-color-base)'
          }}>
                {item.description}
              </div>
              <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: item.status === 'good' ? '#059669' : item.status === 'warning' ? '#d97706' : '#dc2626',
            textAlign: 'center'
          }}>
                {item.threshold}
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default MonitoringMetrics;