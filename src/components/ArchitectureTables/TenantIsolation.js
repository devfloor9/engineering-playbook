import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TenantIsolation = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const isolations = [
    {
      level: isKo ? '네임스페이스' : isZh ? '命名空间' : 'Namespace',
      method: isKo ? '테넌트별 네임스페이스' : isZh ? '每个租户一个命名空间' : 'Tenant per namespace',
      advantages: isKo ? '간단한 구현, 리소스 격리' : isZh ? '简单实现，资源隔离' : 'Simple implementation, resource isolation',
      disadvantages: isKo ? '네트워크 정책 필요' : isZh ? '需要网络策略' : 'Network policy required',
      icon: '📦',
      color: '#3b82f6',
      recommendedFor: isKo ? '일반적인 멀티테넌시' : isZh ? '常规多租户' : 'General multi-tenancy'
    },
    {
      level: isKo ? '노드' : isZh ? '节点' : 'Node',
      method: isKo ? '테넌트별 노드 풀' : isZh ? '每个租户一个节点池' : 'Tenant per node pool',
      advantages: isKo ? '완전한 격리' : isZh ? '完全隔离' : 'Complete isolation',
      disadvantages: isKo ? '비용 증가' : isZh ? '成本增加' : 'Cost increase',
      icon: '🖥️',
      color: '#8b5cf6',
      recommendedFor: isKo ? '규제 준수가 필요한 환경' : isZh ? '需要合规的环境' : 'Compliance-required environments'
    },
    {
      level: isKo ? '클러스터' : isZh ? '集群' : 'Cluster',
      method: isKo ? '테넌트별 클러스터' : isZh ? '每个租户一个集群' : 'Tenant per cluster',
      advantages: isKo ? '최고 수준 격리' : isZh ? '最高级别隔离' : 'Highest level isolation',
      disadvantages: isKo ? '관리 복잡성' : isZh ? '管理复杂性' : 'Management complexity',
      icon: '🏢',
      color: '#10b981',
      recommendedFor: isKo ? '엔터프라이즈 고객' : isZh ? '企业客户' : 'Enterprise customers'
    }
  ];

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? '테넌트 격리 전략' : isZh ? '租户隔离策略' : 'Tenant Isolation Strategy'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {isolations.map((isolation, index) => (
          <div
            key={index}
            style={{
              background: `${isolation.color}08`,
              padding: '24px',
              borderRadius: '8px',
              borderLeft: `4px solid ${isolation.color}`,
              marginBottom: index < isolations.length - 1 ? '16px' : '0',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '32px' }}>{isolation.icon}</span>
              <div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: isolation.color
                }}>
                  {isolation.level}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--ifm-color-emphasis-600)',
                  fontStyle: 'italic',
                  marginTop: '2px'
                }}>
                  {isolation.recommendedFor}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '방법' : isZh ? '方法' : 'Method'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--ifm-font-color-base)',
                  lineHeight: '1.5'
                }}>
                  {isolation.method}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '장점' : isZh ? '优点' : 'Advantages'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#10b981',
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  ✓ {isolation.advantages}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '단점' : isZh ? '缺点' : 'Disadvantages'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#ef4444',
                  lineHeight: '1.5',
                  fontWeight: '500'
                }}>
                  ✗ {isolation.disadvantages}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenantIsolation;
