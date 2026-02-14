import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringMetricsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      id: 'requests-total',
      metric: 'kgateway_requests_total',
      description: isKo ? '총 요청 수' : isZh ? '总请求数' : 'Total request count',
      usage: isKo ? '트래픽 모니터링' : isZh ? '流量监控' : 'Traffic monitoring',
      color: '#3b82f6'
    },
    {
      id: 'request-duration',
      metric: 'kgateway_request_duration_seconds',
      description: isKo ? '요청 처리 시간' : isZh ? '请求处理时间' : 'Request processing time',
      usage: isKo ? '지연 시간 분석' : isZh ? '延迟分析' : 'Latency analysis',
      color: '#8b5cf6'
    },
    {
      id: 'upstream-rq',
      metric: 'kgateway_upstream_rq_xx',
      description: isKo ? '백엔드 응답 코드별 수' : isZh ? '后端响应代码计数' : 'Backend response codes',
      usage: isKo ? '오류율 추적' : isZh ? '错误率追踪' : 'Error tracking',
      color: '#f59e0b'
    },
    {
      id: 'upstream-cx',
      metric: 'kgateway_upstream_cx_active',
      description: isKo ? '활성 연결 수' : isZh ? '活动连接数' : 'Active connections',
      usage: isKo ? '용량 계획' : isZh ? '容量规划' : 'Capacity planning',
      color: '#10b981'
    },
    {
      id: 'retry-count',
      metric: 'kgateway_retry_count',
      description: isKo ? '재시도 횟수' : isZh ? '重试次数' : 'Retry count',
      usage: isKo ? '안정성 분석' : isZh ? '稳定性分析' : 'Stability analysis',
      color: '#ef4444'
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '📊 Kgateway Prometheus 메트릭' : isZh ? '📊 Kgateway Prometheus 指标' : '📊 Kgateway Prometheus Metrics'}
      </div>

      <div style={{
        overflowX: 'auto',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '30%'
              }}>
                {isKo ? '메트릭' : isZh ? '指标' : 'Metric'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '35%'
              }}>
                {isKo ? '설명' : isZh ? '描述' : 'Description'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '35%'
              }}>
                {isKo ? '활용' : isZh ? '用途' : 'Usage'}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((item, index) => (
              <tr key={item.id} style={{
                background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-50)'
              }}>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      borderRadius: '2px',
                      background: item.color
                    }}></div>
                    <code style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      background: 'var(--ifm-code-background)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--ifm-code-color)'
                    }}>
                      {item.metric}
                    </code>
                  </div>
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  {item.description}
                </td>
                <td style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-200)'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: 'var(--ifm-color-emphasis-100)',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    {item.usage}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitoringMetricsTable;
