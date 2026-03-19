import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AnomalyMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'pod_cpu_utilization',
      target: isKo ? 'CPU 급증/급감' : isZh ? 'CPU 峰值/骤降' : 'CPU spike/drop',
      threshold: isKo ? '2 표준편차' : isZh ? '2 个标准差' : '2 standard deviations',
      color: '#ef4444'
    },
    {
      metric: 'pod_memory_utilization',
      target: isKo ? '메모리 누수' : isZh ? '内存泄漏' : 'Memory leak',
      threshold: isKo ? '2 표준편차' : isZh ? '2 个标准差' : '2 standard deviations',
      color: '#f97316'
    },
    {
      metric: 'node_network_rx_bytes',
      target: isKo ? '네트워크 이상' : isZh ? '网络异常' : 'Network anomaly',
      threshold: isKo ? '3 표준편차' : isZh ? '3 个标准差' : '3 standard deviations',
      color: '#f59e0b'
    },
    {
      metric: 'apiserver_request_total',
      target: isKo ? 'API 서버 부하' : isZh ? 'API 服务器负载' : 'API server load',
      threshold: isKo ? '2 표준편차' : isZh ? '2 个标准差' : '2 standard deviations',
      color: '#eab308'
    },
    {
      metric: 'container_restart_count',
      target: isKo ? 'Pod 불안정' : isZh ? 'Pod 不稳定' : 'Pod instability',
      threshold: isKo ? '3 표준편차' : isZh ? '3 个标准差' : '3 standard deviations',
      color: '#84cc16'
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: 'var(--ifm-background-surface-color)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: '1.6'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
    color: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: '0.95rem',
    opacity: 0.95,
    fontWeight: '400'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '15px'
  };

  const thStyle = {
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    color: 'var(--ifm-font-color-base)',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '700',
    borderBottom: '2px solid var(--ifm-color-emphasis-200)',
    fontSize: '0.9375rem'
  };

  const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid var(--ifm-color-emphasis-200)',
    color: 'var(--ifm-font-color-base)',
    fontSize: '15px'
  };

  const metricBadgeStyle = (color) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.25rem 0.625rem',
    borderRadius: '4px',
    fontSize: '0.8125rem',
    fontWeight: '600',
    fontFamily: 'monospace'
  });

  const footerStyle = {
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    color: 'var(--ifm-color-emphasis-700)',
    borderTop: '2px solid #fbbf24',
    lineHeight: '1.6'
  };

  const footerLabelStyle = {
    fontWeight: '700',
    color: 'var(--ifm-color-emphasis-700)'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📊 {isKo ? 'EKS 핵심 Anomaly Detection 메트릭' : isZh ? 'EKS 核心异常检测指标' : 'Key EKS Anomaly Detection Metrics'}</h2>
        <p style={subtitleStyle}>{isKo ? 'CloudWatch Anomaly Detection 적용 대상' : isZh ? 'CloudWatch 异常检测应用目标' : 'CloudWatch Anomaly Detection Targets'}</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{isKo ? '메트릭' : isZh ? '指标' : 'Metric'}</th>
              <th style={thStyle}>{isKo ? '탐지 대상' : isZh ? '检测目标' : 'Detection Target'}</th>
              <th style={thStyle}>{isKo ? '임계값 밴드' : isZh ? '阈值范围' : 'Threshold Band'}</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>
                  <div style={metricBadgeStyle(item.color)}>
                    {item.metric}
                  </div>
                </td>
                <td style={tdStyle}>{item.target}</td>
                <td style={tdStyle}>{item.threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>{isKo ? '설정 팁:' : isZh ? '配置提示：' : 'Configuration Tip:'}</span> {isKo ? 'CloudWatch Anomaly Detection은 메트릭별로 최소 2주간의 데이터가 필요하며, 학습 기간 동안 발생한 장애 구간은 제외 설정을 통해 정상 패턴으로 학습되지 않도록 해야 합니다.' : isZh ? 'CloudWatch 异常检测每个指标至少需要 2 周的数据，学习期间发生的事件区间应通过排除设置避免被学习为正常模式。' : 'CloudWatch Anomaly Detection requires at least 2 weeks of data per metric, and incident periods during the learning phase should be excluded to prevent them from being learned as normal patterns.'}
      </div>
    </div>
  );
};

export default AnomalyMetrics;
