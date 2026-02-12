import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EksCapabilities = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const capabilities = [
    {
      name: 'Managed Argo CD',
      color: '#ea580c',
      status: 'GA',
      description: isKo ? 'AWS 관리형 GitOps' : isZh ? 'AWS 托管 GitOps' : 'AWS-managed GitOps',
      features: isKo ? ['자동 업그레이드', 'HA 구성', 'AWS 인증 통합', '멀티클러스터'] : isZh ? ['自动升级', 'HA 配置', 'AWS 认证集成', '多集群'] : ['Auto upgrade', 'HA configuration', 'AWS auth integration', 'Multi-cluster']
    },
    {
      name: 'ACK (AWS Controllers for K8s)',
      color: '#3b82f6',
      status: 'GA',
      description: isKo ? '50+ AWS 서비스 CRD 관리' : isZh ? '50+ AWS 服务 CRD 管理' : '50+ AWS service CRD management',
      features: isKo ? ['S3/RDS/SQS CRD', '클러스터 외부 실행', '선언적 AWS 관리'] : isZh ? ['S3/RDS/SQS CRD', '集群外执行', '声明式 AWS 管理'] : ['S3/RDS/SQS CRD', 'Out-of-cluster execution', 'Declarative AWS management']
    },
    {
      name: 'KRO (K8s Resource Orchestrator)',
      color: '#8b5cf6',
      status: 'Preview',
      description: isKo ? 'ResourceGroup CRD 복합 리소스' : isZh ? 'ResourceGroup CRD 复合资源' : 'ResourceGroup CRD composite resources',
      features: isKo ? ['단일 배포 단위', '의존성 관리', '템플릿 변수'] : isZh ? ['单一部署单元', '依赖管理', '模板变量'] : ['Single deployment unit', 'Dependency management', 'Template variables']
    },
    {
      name: 'LBC v3',
      color: '#059669',
      status: 'GA',
      description: isKo ? 'Gateway API GA 지원' : isZh ? 'Gateway API GA 支持' : 'Gateway API GA support',
      features: isKo ? ['Gateway API', 'JWT 검증', '헤더 변환', '다중 TG 바인딩'] : isZh ? ['Gateway API', 'JWT 验证', '头部转换', '多 TG 绑定'] : ['Gateway API', 'JWT validation', 'Header transformation', 'Multi TG binding']
    }
  ];

  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '8px 8px 0 0',
      marginBottom: '1.5rem'
    },
    title: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.5rem',
      fontWeight: '600'
    },
    subtitle: {
      margin: 0,
      fontSize: '0.875rem',
      opacity: 0.9
    },
    capabilitiesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    capabilityCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    capabilityHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.75rem',
      gap: '1rem'
    },
    capabilityName: {
      margin: 0,
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#111827'
    },
    statusBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      flexShrink: 0
    },
    statusGA: {
      background: '#d1fae5',
      color: '#065f46'
    },
    statusPreview: {
      background: '#fef3c7',
      color: '#92400e'
    },
    description: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginBottom: '0.875rem'
    },
    featuresContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem'
    },
    featureTag: {
      background: '#f9fafb',
      color: '#374151',
      padding: '0.375rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.8125rem',
      border: '1px solid #e5e7eb'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>⚡ EKS Capabilities (2025.11)</h2>
        <p style={styles.subtitle}>{isKo ? 'AWS 관리형 K8s 네이티브 도구' : isZh ? 'AWS 托管 K8s 原生工具' : 'AWS-managed K8s native tools'}</p>
      </div>
      <div style={styles.capabilitiesList}>
        {capabilities.map((capability, idx) => (
          <div
            key={idx}
            style={{
              ...styles.capabilityCard,
              borderLeft: `4px solid ${capability.color}`
            }}
          >
            <div style={styles.capabilityHeader}>
              <h3 style={styles.capabilityName}>{capability.name}</h3>
              <span style={{
                ...styles.statusBadge,
                ...(capability.status === 'GA' ? styles.statusGA : styles.statusPreview)
              }}>
                {capability.status}
              </span>
            </div>
            <p style={styles.description}>{capability.description}</p>
            <div style={styles.featuresContainer}>
              {capability.features.map((feature, featureIdx) => (
                <span key={featureIdx} style={styles.featureTag}>{feature}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EksCapabilities;
