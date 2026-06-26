import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const CostOptimization = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const items = [{
    category: isKo ? '인스턴스 비용' : 'Instance Cost',
    sagemaker: isKo ? '학습 시에만 과금' : 'Charged Only During Training',
    eks: isKo ? '24/7 운영 비용' : '24/7 Operating Costs',
    strategy: isKo ? 'Spot 인스턴스 활용' : 'Utilize Spot Instances',
    icon: '💵',
    color: '#10b981'
  }, {
    category: isKo ? '스토리지' : 'Storage',
    sagemaker: isKo ? 'S3 (저렴)' : 'S3 (Low Cost)',
    eks: 'EBS + S3',
    strategy: isKo ? 'S3 중심 아키텍처' : 'S3-Centric Architecture',
    icon: '💾',
    color: '#3b82f6'
  }, {
    category: isKo ? '네트워크' : 'Network',
    sagemaker: isKo ? 'VPC 내 무료' : 'Free Within VPC',
    eks: isKo ? '데이터 전송 비용' : 'Data Transfer Costs',
    strategy: isKo ? 'VPC Endpoint 사용' : 'Use VPC Endpoints',
    icon: '🌐',
    color: '#8b5cf6'
  }, {
    category: isKo ? '관리 오버헤드' : 'Management Overhead',
    sagemaker: isKo ? '없음' : 'None',
    eks: isKo ? '운영 인력 필요' : 'Operations Staff Required',
    strategy: isKo ? '자동화로 상쇄' : 'Offset with Automation',
    icon: '👥',
    color: '#f59e0b'
  }];
  return <div style={{
    maxWidth: '1100px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '💰 비용 최적화 전략 비교' : '💰 Cost Optimization Strategy Comparison'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? '학습 vs 서빙 비용 분석 및 최적화 방안' : 'Training vs Serving Cost Analysis and Optimization'}
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
        gap: '16px'
      }}>
          {items.map((item, index) => <div key={index} style={{
          background: 'var(--ifm-background-surface-color)',
          padding: '20px',
          borderRadius: '8px',
          border: `2px solid ${item.color}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
                <span style={{
              fontSize: '32px'
            }}>{item.icon}</span>
                <span style={{
              fontSize: '18px',
              fontWeight: '700',
              color: item.color
            }}>
                  {item.category}
                </span>
              </div>

              <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.2fr',
            gap: '20px',
            alignItems: 'start'
          }}>
                <div>
                  <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#ff9900',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                    SageMaker {isKo ? '학습' : 'Training'}
                  </div>
                  <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)',
                padding: '8px 12px',
                background: 'var(--ifm-color-emphasis-100)',
                borderRadius: '6px'
              }}>
                    {item.sagemaker}
                  </div>
                </div>

                <div>
                  <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#326ce5',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                    EKS {isKo ? '서빙' : 'Serving'}
                  </div>
                  <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)',
                padding: '8px 12px',
                background: 'var(--ifm-color-emphasis-100)',
                borderRadius: '6px'
              }}>
                    {item.eks}
                  </div>
                </div>

                <div>
                  <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: item.color,
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                    {isKo ? '최적화 전략' : 'Optimization Strategy'}
                  </div>
                  <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)',
                fontWeight: '600',
                padding: '8px 12px',
                background: `${item.color}20`,
                borderRadius: '6px',
                border: `1px solid ${item.color}40`
              }}>
                    {item.strategy}
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default CostOptimization;