import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const PrerequisitesTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const items = [
    {
      item: isKo ? 'AWS 계정' : 'AWS Account',
      requirement: isKo ? 'p5.48xlarge 쿼터 승인' : 'p5.48xlarge quota approved',
      notes: isKo ? 'Service Quotas → Running On-Demand P instances ≥ 192' : 'Service Quotas → Running On-Demand P instances ≥ 192'
    },
    {
      item: 'eksctl',
      requirement: '>= 0.200.0',
      notes: isKo ? 'EKS Auto Mode 지원 버전' : 'Version supporting EKS Auto Mode'
    },
    {
      item: 'kubectl',
      requirement: '>= 1.33',
      notes: isKo ? 'EKS 1.33/1.34 호환' : 'Compatible with EKS 1.33/1.34'
    },
    {
      item: 'Helm',
      requirement: '>= 3.0',
      notes: isKo ? 'Helm chart 배포용' : 'For Helm chart deployment'
    },
    {
      item: 'helmfile',
      requirement: isKo ? '최신 버전' : 'Latest version',
      notes: isKo ? 'llm-d 통합 배포 도구' : 'llm-d unified deployment tool'
    },
    {
      item: 'yq',
      requirement: '>= 4.0',
      notes: isKo ? 'YAML 처리 도구' : 'YAML processing tool'
    },
    {
      item: isKo ? 'HuggingFace Token' : 'HuggingFace Token',
      requirement: isKo ? 'Qwen3-32B 접근 권한' : 'Access to Qwen3-32B',
      notes: 'https://huggingface.co/settings/tokens'
    },
    {
      item: 'AWS CLI',
      requirement: isKo ? 'v2 최신' : 'v2 latest',
      notes: isKo ? '자격 증명 구성 완료' : 'Credentials configured'
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
        {isKo ? '사전 요구사항' : 'Prerequisites'}
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
                {isKo ? '항목' : 'Item'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '180px'
              }}>
                {isKo ? '요구사항' : 'Requirement'}
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
            {items.map((item, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < items.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {item.item}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < items.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {item.requirement}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  fontSize: '13px',
                  borderBottom: index < items.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {item.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrerequisitesTable;
