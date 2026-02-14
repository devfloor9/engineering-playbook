import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const BatchOptimization = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const techniques = [
    {
      technique: 'Continuous Batching',
      description: isKo ? '요청을 동적으로 배치에 추가/제거' : isZh ? '动态添加/删除批次中的请求' : 'Dynamically add/remove requests from batch',
      effect: isKo ? '처리량 2-3x 향상' : isZh ? '吞吐量提高 2-3 倍' : '2-3x throughput improvement',
      color: '#3b82f6',
      icon: '🔄'
    },
    {
      technique: 'Chunked Prefill',
      description: isKo ? 'Prefill을 청크로 분할하여 Decode와 병행' : isZh ? '将 Prefill 分块以与 Decode 并行' : 'Split prefill into chunks for concurrent decode',
      effect: isKo ? '지연시간 감소' : isZh ? '延迟降低' : 'Reduced latency',
      color: '#8b5cf6',
      icon: '⚡'
    },
    {
      technique: 'Dynamic SplitFuse',
      description: isKo ? 'Prefill/Decode 동적 분리' : isZh ? 'Prefill/Decode 动态分离' : 'Dynamically separate/combine prefill and decode',
      effect: isKo ? 'GPU 활용률 향상' : isZh ? 'GPU 利用率提高' : 'Improved GPU utilization',
      color: '#10b981',
      icon: '🎯'
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
          {isKo ? '배치 처리 최적화 기법' : isZh ? '批处理优化技术' : 'Batch Processing Optimization Techniques'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {techniques.map((tech, index) => (
          <div
            key={index}
            style={{
              background: `${tech.color}08`,
              padding: '24px',
              borderRadius: '8px',
              borderLeft: `4px solid ${tech.color}`,
              marginBottom: index < techniques.length - 1 ? '16px' : '0',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '32px' }}>{tech.icon}</span>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: tech.color
              }}>
                {tech.technique}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '20px',
              alignItems: 'center'
            }}>
              <div>
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
                  {tech.description}
                </div>
              </div>

              <div style={{
                background: `${tech.color}20`,
                padding: '12px 20px',
                borderRadius: '8px',
                border: `2px solid ${tech.color}`,
                textAlign: 'center',
                minWidth: '180px'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '효과' : isZh ? '效果' : 'Effect'}
                </div>
                <div style={{
                  fontSize: '15px',
                  color: tech.color,
                  fontWeight: '600'
                }}>
                  {tech.effect}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchOptimization;
