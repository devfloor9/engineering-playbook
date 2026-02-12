import React from 'react';

const EksCapabilities = () => {
  const capabilities = [
    {
      name: 'Managed Argo CD',
      color: '#ea580c',
      status: 'GA',
      description: 'AWS 관리형 GitOps',
      features: ['자동 업그레이드', 'HA 구성', 'AWS 인증 통합', '멀티클러스터']
    },
    {
      name: 'ACK (AWS Controllers for K8s)',
      color: '#3b82f6',
      status: 'GA',
      description: '50+ AWS 서비스 CRD 관리',
      features: ['S3/RDS/SQS CRD', '클러스터 외부 실행', '선언적 AWS 관리']
    },
    {
      name: 'KRO (K8s Resource Orchestrator)',
      color: '#8b5cf6',
      status: 'Preview',
      description: 'ResourceGroup CRD 복합 리소스',
      features: ['단일 배포 단위', '의존성 관리', '템플릿 변수']
    },
    {
      name: 'LBC v3',
      color: '#059669',
      status: 'GA',
      description: 'Gateway API GA 지원',
      features: ['Gateway API', 'JWT 검증', '헤더 변환', '다중 TG 바인딩']
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
        <p style={styles.subtitle}>AWS 관리형 K8s 네이티브 도구</p>
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
