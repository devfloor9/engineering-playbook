import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const WeeklyChecksTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const checks = [
    {
      item: isKo ? '비용 분석' : 'Cost Analysis',
      howToCheck: isKo ? 'Kubecost 리포트' : 'Kubecost report',
      action: isKo ? '이상 비용 식별' : 'Identify anomalous costs'
    },
    {
      item: isKo ? '용량 계획' : 'Capacity Planning',
      howToCheck: isKo ? '리소스 트렌드' : 'Resource trends',
      action: isKo ? '스케일링 계획' : 'Plan scaling'
    },
    {
      item: isKo ? '보안 패치' : 'Security Patches',
      howToCheck: isKo ? '이미지 스캔' : 'Image scan',
      action: isKo ? '취약점 패치' : 'Patch vulnerabilities'
    },
    {
      item: isKo ? '백업 검증' : 'Backup Validation',
      howToCheck: isKo ? '복구 테스트' : 'Recovery test',
      action: isKo ? '백업 정책 확인' : 'Verify backup policy'
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
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '주간 점검 항목' : 'Weekly Checks'}
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
                minWidth: '180px'
              }}>
                {isKo ? '확인 방법' : 'How to Check'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '200px'
              }}>
                {isKo ? '조치 사항' : 'Action'}
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
                  color: '#6b7280',
                  borderBottom: index < checks.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {check.howToCheck}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#059669',
                  fontWeight: '500',
                  borderBottom: index < checks.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {check.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyChecksTable;
