import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ComponentRolesTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const components = [
    {
      component: 'Proxy',
      role: isKo ? '클라이언트 요청 라우팅' : 'Client request handling, routing',
      scaling: isKo ? '수평 확장' : 'Horizontal scaling'
    },
    {
      component: 'Query Node',
      role: isKo ? '벡터 검색 수행' : 'Vector search execution',
      scaling: isKo ? '수평 확장' : 'Horizontal scaling'
    },
    {
      component: 'Data Node',
      role: isKo ? '데이터 삽입/삭제 처리' : 'Data insertion/deletion processing',
      scaling: isKo ? '수평 확장' : 'Horizontal scaling'
    },
    {
      component: 'Index Node',
      role: isKo ? '인덱스 빌드' : 'Index building',
      scaling: isKo ? '수평 확장' : 'Horizontal scaling'
    },
    {
      component: 'etcd',
      role: isKo ? '메타데이터 저장' : 'Metadata storage',
      scaling: isKo ? '3-5 노드 클러스터' : '3-5 node cluster'
    },
    {
      component: 'MinIO/S3',
      role: isKo ? '벡터 데이터 저장' : 'Vector data storage',
      scaling: isKo ? '무제한' : 'Unlimited'
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
        {isKo ? '컴포넌트 역할' : 'Component Roles'}
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
                {isKo ? '컴포넌트' : 'Component'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '250px'
              }}>
                {isKo ? '역할' : 'Role'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '160px'
              }}>
                {isKo ? '스케일링' : 'Scaling'}
              </th>
            </tr>
          </thead>
          <tbody>
            {components.map((comp, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '600',
                  color: '#059669',
                  borderBottom: index < components.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.component}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: index < components.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.role}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  fontWeight: '500',
                  borderBottom: index < components.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {comp.scaling}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComponentRolesTable;
