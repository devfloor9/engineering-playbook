import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostOptimization = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const items = [
    {
      category: isKo ? '인스턴스 비용' : isZh ? '实例成本' : 'Instance Cost',
      sagemaker: isKo ? '학습 시에만 과금' : isZh ? '仅在训练时计费' : 'Charged Only During Training',
      eks: isKo ? '24/7 운영 비용' : isZh ? '24/7 运营成本' : '24/7 Operating Costs',
      strategy: isKo ? 'Spot 인스턴스 활용' : isZh ? '利用 Spot 实例' : 'Utilize Spot Instances',
      icon: '💵',
      color: '#10b981'
    },
    {
      category: isKo ? '스토리지' : isZh ? '存储' : 'Storage',
      sagemaker: isKo ? 'S3 (저렴)' : isZh ? 'S3（低成本）' : 'S3 (Low Cost)',
      eks: 'EBS + S3',
      strategy: isKo ? 'S3 중심 아키텍처' : isZh ? '以 S3 为中心的架构' : 'S3-Centric Architecture',
      icon: '💾',
      color: '#3b82f6'
    },
    {
      category: isKo ? '네트워크' : isZh ? '网络' : 'Network',
      sagemaker: isKo ? 'VPC 내 무료' : isZh ? 'VPC 内免费' : 'Free Within VPC',
      eks: isKo ? '데이터 전송 비용' : isZh ? '数据传输成本' : 'Data Transfer Costs',
      strategy: isKo ? 'VPC Endpoint 사용' : isZh ? '使用 VPC Endpoint' : 'Use VPC Endpoints',
      icon: '🌐',
      color: '#8b5cf6'
    },
    {
      category: isKo ? '관리 오버헤드' : isZh ? '管理开销' : 'Management Overhead',
      sagemaker: isKo ? '없음' : isZh ? '无' : 'None',
      eks: isKo ? '운영 인력 필요' : isZh ? '需要运营人员' : 'Operations Staff Required',
      strategy: isKo ? '자동화로 상쇄' : isZh ? '通过自动化抵消' : 'Offset with Automation',
      icon: '👥',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
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
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '💰 비용 최적화 전략 비교' : isZh ? '💰 成本优化策略比较' : '💰 Cost Optimization Strategy Comparison'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '학습 vs 서빙 비용 분석 및 최적화 방안' : isZh ? '训练 vs 服务成本分析及优化方案' : 'Training vs Serving Cost Analysis and Optimization'}
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
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-background-surface-color)',
                padding: '20px',
                borderRadius: '8px',
                border: `2px solid ${item.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '32px' }}>{item.icon}</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>
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
                    SageMaker {isKo ? '학습' : isZh ? '训练' : 'Training'}
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
                    EKS {isKo ? '서빙' : isZh ? '服务' : 'Serving'}
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
                    {isKo ? '최적화 전략' : isZh ? '优化策略' : 'Optimization Strategy'}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CostOptimization;
