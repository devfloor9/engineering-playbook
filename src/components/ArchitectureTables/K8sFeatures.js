import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const K8sFeatures = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const features133 = [
    {
      feature: isKo ? 'Stable Sidecar Containers' : isZh ? '稳定的 Sidecar 容器' : 'Stable Sidecar Containers',
      description: isKo ? 'Init 컨테이너가 Pod 전체 라이프사이클 동안 실행' : isZh ? 'Init 容器在 Pod 整个生命周期内运行' : 'Init containers run during Pod entire lifecycle',
      application: isKo ? 'Agent Pod의 로깅/메트릭 수집 사이드카 안정화' : isZh ? '稳定 Agent Pod 的日志/指标收集 sidecar' : 'Agent Pod logging/metrics collection sidecar stabilization',
      color: '#3b82f6'
    },
    {
      feature: isKo ? 'Topology-Aware Routing' : isZh ? '拓扑感知路由' : 'Topology-Aware Routing',
      description: isKo ? '노드 토폴로지 기반 트래픽 라우팅' : isZh ? '基于节点拓扑的流量路由' : 'Node topology-based traffic routing',
      application: isKo ? '크로스 AZ 트래픽 비용 절감, 지연 시간 개선' : isZh ? '降低跨 AZ 流量成本，改善延迟' : 'Cross-AZ traffic cost reduction, latency improvement',
      color: '#8b5cf6'
    },
    {
      feature: isKo ? 'In-Place Resource Resizing' : isZh ? '就地资源调整' : 'In-Place Resource Resizing',
      description: isKo ? 'Pod 재시작 없이 리소스 조정' : isZh ? '无需重启 Pod 即可调整资源' : 'Adjust resources without Pod restart',
      application: isKo ? 'GPU 메모리 동적 조정 (제한적)' : isZh ? 'GPU 内存动态调整（有限）' : 'GPU memory dynamic adjustment (limited)',
      color: '#10b981'
    },
    {
      feature: isKo ? 'DRA v1beta1 안정화' : isZh ? 'DRA v1beta1 稳定' : 'DRA v1beta1 stabilization',
      description: isKo ? 'Dynamic Resource Allocation API 안정화' : isZh ? 'Dynamic Resource Allocation API 稳定' : 'Dynamic Resource Allocation API stabilization',
      application: isKo ? '프로덕션 GPU 파티셔닝 지원' : isZh ? '生产 GPU 分区支持' : 'Production GPU partitioning support',
      color: '#f59e0b'
    }
  ];

  const features134 = [
    {
      feature: isKo ? 'Projected Service Account Tokens' : isZh ? '投影服务账户令牌' : 'Projected Service Account Tokens',
      description: isKo ? '향상된 서비스 계정 토큰 관리' : isZh ? '增强的服务账户令牌管理' : 'Enhanced service account token management',
      application: isKo ? 'Agent Pod의 보안 강화' : isZh ? '增强 Agent Pod 安全性' : 'Agent Pod security enhancement',
      color: '#ec4899'
    },
    {
      feature: isKo ? 'DRA Prioritized Alternatives' : isZh ? 'DRA 优先替代方案' : 'DRA Prioritized Alternatives',
      description: isKo ? '리소스 할당 우선순위 대안' : isZh ? '资源分配优先级替代方案' : 'Resource allocation prioritized alternatives',
      application: isKo ? 'GPU 리소스 경합 시 지능적 스케줄링' : isZh ? 'GPU 资源竞争时的智能调度' : 'Intelligent scheduling during GPU resource contention',
      color: '#06b6d4'
    },
    {
      feature: isKo ? 'Improved Resource Quota' : isZh ? '改进的资源配额' : 'Improved Resource Quota',
      description: isKo ? '리소스 쿼터 세분화' : isZh ? '资源配额细化' : 'Resource quota refinement',
      application: isKo ? 'GPU 테넌트별 정밀한 할당 제어' : isZh ? 'GPU 租户精确分配控制' : 'GPU precise allocation control per tenant',
      color: '#84cc16'
    }
  ];

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Kubernetes 1.33+ Features */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0',
        marginTop: '30px'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? 'Kubernetes 1.33+ 기능' : isZh ? 'Kubernetes 1.33+ 功能' : 'Kubernetes 1.33+ Features'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
        marginBottom: '30px'
      }}>
        {features133.map((feature, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr 300px',
              padding: '16px 20px',
              borderBottom: index < features133.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: feature.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '30px',
                background: feature.color,
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              {feature.feature}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              lineHeight: '1.5',
              paddingRight: '16px'
            }}>
              {feature.description}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--ifm-color-emphasis-700)',
              fontStyle: 'italic',
              lineHeight: '1.4'
            }}>
              {feature.application}
            </div>
          </div>
        ))}
      </div>

      {/* Kubernetes 1.34+ Features */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? 'Kubernetes 1.34+ 기능' : isZh ? 'Kubernetes 1.34+ 功能' : 'Kubernetes 1.34+ Features'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {features134.map((feature, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 1fr 300px',
              padding: '16px 20px',
              borderBottom: index < features134.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: feature.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '30px',
                background: feature.color,
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              {feature.feature}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              lineHeight: '1.5',
              paddingRight: '16px'
            }}>
              {feature.description}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--ifm-color-emphasis-700)',
              fontStyle: 'italic',
              lineHeight: '1.4'
            }}>
              {feature.application}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default K8sFeatures;
