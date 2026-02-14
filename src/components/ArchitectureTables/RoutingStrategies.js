import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RoutingStrategies = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const strategies = [
    {
      strategy: isKo ? '가중치 기반' : isZh ? '基于权重' : 'Weight-Based',
      description: isKo ? '트래픽을 비율로 분배' : isZh ? '按比例分配流量' : 'Distribute traffic by ratio',
      useCase: isKo ? 'A/B 테스트, 카나리 배포' : isZh ? 'A/B 测试、金丝雀部署' : 'A/B testing, canary deployment',
      icon: '⚖️',
      color: '#3b82f6'
    },
    {
      strategy: isKo ? '헤더 기반' : isZh ? '基于标头' : 'Header-Based',
      description: isKo ? '요청 헤더로 라우팅 결정' : isZh ? '根据请求标头决定路由' : 'Routing decision based on request headers',
      useCase: isKo ? '모델 선택, 테넌트 분리' : isZh ? '模型选择、租户隔离' : 'Model selection, tenant separation',
      icon: '🏷️',
      color: '#8b5cf6'
    },
    {
      strategy: isKo ? '지연 시간 기반' : isZh ? '基于延迟' : 'Latency-Based',
      description: isKo ? '가장 빠른 백엔드로 라우팅' : isZh ? '路由到最快的后端' : 'Route to fastest backend',
      useCase: isKo ? '성능 최적화' : isZh ? '性能优化' : 'Performance optimization',
      icon: '⚡',
      color: '#10b981'
    },
    {
      strategy: isKo ? '폴백' : isZh ? '回退' : 'Fallback',
      description: isKo ? '실패 시 대체 백엔드로 전환' : isZh ? '失败时切换到替代后端' : 'Switch to alternative backend on failure',
      useCase: isKo ? '고가용성' : isZh ? '高可用性' : 'High availability',
      icon: '🔄',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
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
          {isKo ? '라우팅 전략' : isZh ? '路由策略' : 'Routing Strategies'}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '16px'
        }}>
          {strategies.map((strategy, index) => (
            <div
              key={index}
              style={{
                background: `${strategy.color}10`,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${strategy.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>{strategy.icon}</span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: strategy.color
                }}>
                  {strategy.strategy}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '설명' : isZh ? '说明' : 'Description'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--ifm-font-color-base)',
                  lineHeight: '1.5'
                }}>
                  {strategy.description}
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
                  {isKo ? '사용 사례' : isZh ? '用例' : 'Use Case'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--ifm-color-emphasis-800)',
                  fontWeight: '500'
                }}>
                  {strategy.useCase}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoutingStrategies;
