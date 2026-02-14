import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LangFuseVsLangSmithTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const rows = [
    {
      feature: isKo ? '라이선스' : 'License',
      langfuse: isKo ? '오픈소스 (MIT)' : 'Open source (MIT)',
      langsmith: isKo ? '상용 (무료 티어 제공)' : 'Commercial (free tier)'
    },
    {
      feature: isKo ? '배포 방식' : 'Deployment',
      langfuse: 'Self-hosted / Cloud',
      langsmith: 'Cloud only'
    },
    {
      feature: isKo ? '데이터 주권' : 'Data Sovereignty',
      langfuse: isKo ? '완전한 제어' : 'Full control',
      langsmith: isKo ? 'LangChain 서버' : 'LangChain servers'
    },
    {
      feature: isKo ? '통합' : 'Integration',
      langfuse: isKo ? '다양한 프레임워크' : 'Multiple frameworks',
      langsmith: isKo ? 'LangChain 최적화' : 'LangChain optimized'
    },
    {
      feature: isKo ? '비용' : 'Cost',
      langfuse: isKo ? '인프라 비용만' : 'Infrastructure only',
      langsmith: isKo ? '사용량 기반 과금' : 'Usage-based pricing'
    },
    {
      feature: isKo ? '확장성' : 'Scalability',
      langfuse: isKo ? 'Kubernetes 네이티브' : 'Kubernetes native',
      langsmith: isKo ? '관리형' : 'Managed'
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
        {isKo ? 'LangFuse vs LangSmith 비교' : 'LangFuse vs LangSmith Comparison'}
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
                {isKo ? '특성' : 'Feature'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#059669',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '200px',
                background: '#f0fdf4'
              }}>
                LangFuse
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '200px'
              }}>
                LangSmith
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {row.feature}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#059669',
                  fontWeight: '500',
                  background: '#f0fdf4',
                  borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {row.langfuse}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {row.langsmith}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LangFuseVsLangSmithTable;
