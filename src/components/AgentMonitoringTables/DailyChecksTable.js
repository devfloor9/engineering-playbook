import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DailyChecksTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const checks = [
    {
      item: isKo ? 'GPU 상태' : 'GPU Status',
      howToCheck: '`kubectl get nodes -l nvidia.com/gpu.present=true`',
      normalStatus: isKo ? '모든 노드 Ready' : 'All nodes Ready'
    },
    {
      item: isKo ? '모델 Pod' : 'Model Pods',
      howToCheck: '`kubectl get pods -n inference`',
      normalStatus: isKo ? 'Running 상태' : 'Running state'
    },
    {
      item: isKo ? '에러율' : 'Error Rate',
      howToCheck: isKo ? 'Grafana 대시보드' : 'Grafana dashboard',
      normalStatus: '< 1%'
    },
    {
      item: isKo ? '응답 시간' : 'Response Time',
      howToCheck: isKo ? 'P99 레이턴시' : 'P99 latency',
      normalStatus: isKo ? '< 5초' : '< 5 seconds'
    },
    {
      item: isKo ? 'GPU 사용률' : 'GPU Utilization',
      howToCheck: isKo ? 'DCGM 메트릭' : 'DCGM metrics',
      normalStatus: '40-80%'
    },
    {
      item: isKo ? '메모리 사용' : 'Memory Usage',
      howToCheck: isKo ? 'GPU 메모리' : 'GPU memory',
      normalStatus: '< 90%'
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      overflowX: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '일일 점검 항목' : 'Daily Checks'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '점검 항목' : 'Check Item'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '300px'
              }}>
                {isKo ? '확인 방법' : 'How to Check'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '정상 기준' : 'Normal Status'}
              </th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < checks.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {check.item}
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontFamily: check.howToCheck.includes('`') ? 'monospace' : 'inherit',
                  fontSize: check.howToCheck.includes('`') ? '13px' : '14px',
                  color: '#6b7280',
                  borderBottom: index < checks.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {check.howToCheck}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#059669',
                  fontWeight: '600',
                  borderBottom: index < checks.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {check.normalStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyChecksTable;
