import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const StorageCostComparisonTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const options = [
    {
      storageOption: isKo ? 'MinIO (EBS gp3)' : 'MinIO (EBS gp3)',
      monthlyCost: '~$8',
      requestCost: isKo ? '없음' : 'None',
      latency: isKo ? '낮음' : 'Low',
      useCase: isKo ? '완전한 제어, 온프레미스 호환' : 'Full control, on-premises compatible'
    },
    {
      storageOption: 'S3 Standard',
      monthlyCost: '~$2.3',
      requestCost: '~$0.40',
      latency: isKo ? '중간' : 'Medium',
      useCase: isKo ? '일반적인 사용 사례, 비용 효율' : 'General use case, cost efficient'
    },
    {
      storageOption: 'S3 Express One Zone',
      monthlyCost: '~$16',
      requestCost: '~$0.20',
      latency: isKo ? '매우 낮음' : 'Very low',
      useCase: isKo ? '고성능 요구, 낮은 지연 시간' : 'High performance, low latency'
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
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '스토리지 비용 비교' : 'Storage Cost Comparison'}
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
                minWidth: '180px'
              }}>
                {isKo ? '스토리지 옵션' : 'Storage Option'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '월간 비용 (100GB)' : 'Monthly Cost (100GB)'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '160px'
              }}>
                {isKo ? '요청 비용 (100만 건)' : 'Request Cost (1M requests)'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '100px'
              }}>
                {isKo ? '지연 시간' : 'Latency'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '250px'
              }}>
                {isKo ? '적합한 사용 사례' : 'Use Case'}
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((option, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '600',
                  color: '#059669',
                  borderBottom: index < options.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {option.storageOption}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < options.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {option.monthlyCost}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < options.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {option.requestCost}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: index < options.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {option.latency}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < options.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {option.useCase}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StorageCostComparisonTable;
