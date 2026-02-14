import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ModelLoadingTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const methods = [
    {
      method: isKo ? 'HuggingFace Hub (최초)' : 'HuggingFace Hub (initial)',
      expectedTime: isKo ? '10-20분' : '10-20 min',
      notes: isKo ? '네트워크 속도에 따라 다름' : 'Varies by network speed'
    },
    {
      method: isKo ? 'S3 캐시' : 'S3 Cache',
      expectedTime: isKo ? '3-5분' : '3-5 min',
      notes: isKo ? '같은 리전 S3에서 로딩' : 'Loading from same-region S3'
    },
    {
      method: isKo ? '노드 로컬 캐시' : 'Node Local Cache',
      expectedTime: isKo ? '1-2분' : '1-2 min',
      notes: isKo ? '동일 노드 재배포 시' : 'When redeploying on the same node'
    }
  ];

  return (
    <div style={{
      maxWidth: '800px',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '모델 로딩 방식별 예상 시간' : 'Expected Time by Model Loading Method'}
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
                minWidth: '200px'
              }}>
                {isKo ? '로딩 방식' : 'Loading Method'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '120px'
              }}>
                {isKo ? '예상 시간' : 'Expected Time'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '250px'
              }}>
                {isKo ? '비고' : 'Notes'}
              </th>
            </tr>
          </thead>
          <tbody>
            {methods.map((method, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < methods.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {method.method}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < methods.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {method.expectedTime}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < methods.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {method.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelLoadingTable;
