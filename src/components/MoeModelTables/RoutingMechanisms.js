import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RoutingMechanisms = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const mechanisms = [
    {
      method: 'Top-K Routing',
      description: isKo ? '상위 K개의 Expert만 활성화' : isZh ? '仅激活前 K 个 Expert' : 'Activate only top K experts',
      model: 'Mixtral (K=2)',
      color: '#3b82f6',
      icon: '🎯'
    },
    {
      method: 'Expert Choice',
      description: isKo ? 'Expert가 처리할 토큰을 선택' : isZh ? 'Expert 选择要处理的令牌' : 'Expert selects tokens to process',
      model: 'Switch Transformer',
      color: '#8b5cf6',
      icon: '🔄'
    },
    {
      method: 'Soft MoE',
      description: isKo ? '모든 Expert에 가중치 분배' : isZh ? '将权重分配给所有 Expert' : 'Distribute weights to all experts',
      model: 'Soft MoE',
      color: '#10b981',
      icon: '⚖️'
    },
    {
      method: 'Hash Routing',
      description: isKo ? '해시 기반 결정적 라우팅' : isZh ? '基于哈希的确定性路由' : 'Hash-based deterministic routing',
      model: 'Hash Layers',
      color: '#f59e0b',
      icon: '#️⃣'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? 'MoE 라우팅 메커니즘' : isZh ? 'MoE 路由机制' : 'MoE Routing Mechanisms'}
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
          {mechanisms.map((mech, index) => (
            <div
              key={index}
              style={{
                background: `${mech.color}10`,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${mech.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>{mech.icon}</span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: mech.color
                }}>
                  {mech.method}
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
                  {mech.description}
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
                  {isKo ? '대표 모델' : isZh ? '代表模型' : 'Representative Model'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--ifm-color-emphasis-800)',
                  fontWeight: '500',
                  fontFamily: 'monospace'
                }}>
                  {mech.model}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoutingMechanisms;
