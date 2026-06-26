import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const HybridComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const aspects = [{
    name: isKo ? '비용' : 'Cost',
    sagemaker: isKo ? '학습 시에만 과금' : 'Charged Only During Training',
    eks: isKo ? '상시 운영 비용' : 'Continuous Operating Costs',
    hybrid: isKo ? '학습은 관리형, 서빙은 최적화' : 'Managed Training, Optimized Serving',
    icon: '💰',
    color: '#10b981'
  }, {
    name: isKo ? '확장성' : 'Scalability',
    sagemaker: isKo ? '자동 스케일링' : 'Auto-scaling',
    eks: isKo ? 'Karpenter 동적 프로비저닝' : 'Karpenter Dynamic Provisioning',
    hybrid: isKo ? '워크로드별 최적 스케일링' : 'Optimal Scaling per Workload',
    icon: '📈',
    color: '#3b82f6'
  }, {
    name: isKo ? '유연성' : 'Flexibility',
    sagemaker: isKo ? '제한적 커스터마이징' : 'Limited Customization',
    eks: isKo ? '완전한 제어' : 'Full Control',
    hybrid: isKo ? '학습 표준화 + 서빙 커스터마이징' : 'Standardized Training + Custom Serving',
    icon: '🔧',
    color: '#f59e0b'
  }, {
    name: isKo ? '운영' : 'Operations',
    sagemaker: isKo ? '완전 관리형' : 'Fully Managed',
    eks: 'Self-managed',
    hybrid: isKo ? '학습 부담 감소 + 서빙 제어' : 'Reduced Training Burden + Serving Control',
    icon: '⚙️',
    color: '#8b5cf6'
  }, {
    name: isKo ? '통합' : 'Integration',
    sagemaker: isKo ? 'AWS 네이티브' : 'AWS Native',
    eks: isKo ? 'Kubernetes 생태계' : 'Kubernetes Ecosystem',
    hybrid: isKo ? '양쪽 생태계 활용' : 'Leverage Both Ecosystems',
    icon: '🔗',
    color: '#ec4899'
  }];
  return <div style={{
    maxWidth: '1100px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '🔀 하이브리드 아키텍처 비교' : '🔀 Hybrid Architecture Comparison'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'SageMaker 학습 vs EKS 서빙 vs 하이브리드 접근' : 'SageMaker Training vs EKS Serving vs Hybrid Approach'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      padding: '20px'
    }}>
        <div style={{
        display: 'grid',
        gap: '12px'
      }}>
          {aspects.map((aspect, index) => <div key={index} style={{
          background: 'var(--ifm-background-surface-color)',
          padding: '16px',
          borderRadius: '8px',
          border: `2px solid ${aspect.color}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
                <span style={{
              fontSize: '28px'
            }}>{aspect.icon}</span>
                <span style={{
              fontSize: '18px',
              fontWeight: '700',
              color: aspect.color
            }}>
                  {aspect.name}
                </span>
              </div>

              <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px'
          }}>
                <div>
                  <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#ff9900',
                marginBottom: '6px'
              }}>
                    SageMaker {isKo ? '학습' : 'Training'}
                  </div>
                  <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)'
              }}>
                    {aspect.sagemaker}
                  </div>
                </div>

                <div>
                  <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#326ce5',
                marginBottom: '6px'
              }}>
                    EKS {isKo ? '서빙' : 'Serving'}
                  </div>
                  <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)'
              }}>
                    {aspect.eks}
                  </div>
                </div>

                <div>
                  <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: aspect.color,
                marginBottom: '6px'
              }}>
                    {isKo ? '하이브리드 이점' : 'Hybrid Benefit'}
                  </div>
                  <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)',
                fontWeight: '600'
              }}>
                    {aspect.hybrid}
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default HybridComparison;