import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KvCacheConfig = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const parameters = [
    {
      parameter: 'gpu-memory-utilization',
      description: isKo ? 'GPU 메모리 사용 비율' : isZh ? 'GPU 内存使用比例' : 'GPU memory usage ratio',
      recommended: '0.85-0.92',
      color: '#3b82f6',
      icon: '💾'
    },
    {
      parameter: 'max-model-len',
      description: isKo ? '최대 컨텍스트 길이' : isZh ? '最大上下文长度' : 'Maximum context length',
      recommended: isKo ? '모델 지원 범위 내' : isZh ? '模型支持范围内' : 'Within model support range',
      color: '#8b5cf6',
      icon: '📏'
    },
    {
      parameter: 'max-num-batched-tokens',
      description: isKo ? '배치당 최대 토큰' : isZh ? '每批次最大令牌数' : 'Maximum tokens per batch',
      recommended: isKo ? '메모리에 따라 조정' : isZh ? '根据内存调整' : 'Adjust based on memory',
      color: '#10b981',
      icon: '🔢'
    },
    {
      parameter: 'enable-chunked-prefill',
      description: isKo ? 'Chunked Prefill 활성화' : isZh ? '启用 Chunked Prefill' : 'Enable chunked prefill',
      recommended: isKo ? '권장' : isZh ? '推荐' : 'Recommended',
      color: '#f59e0b',
      icon: '✅'
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
          {isKo ? 'vLLM KV Cache 설정 파라미터' : isZh ? 'vLLM KV Cache 配置参数' : 'vLLM KV Cache Configuration Parameters'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {parameters.map((param, index) => (
          <div
            key={index}
            style={{
              background: `${param.color}10`,
              padding: '20px',
              borderRadius: '8px',
              borderLeft: `4px solid ${param.color}`,
              marginBottom: index < parameters.length - 1 ? '12px' : '0',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '28px' }}>{param.icon}</span>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: param.color,
                fontFamily: 'monospace'
              }}>
                --{param.parameter}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
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
                  {param.description}
                </div>
              </div>

              <div style={{
                background: 'var(--ifm-background-surface-color)',
                padding: '8px 16px',
                borderRadius: '6px',
                border: `2px solid ${param.color}`,
                whiteSpace: 'nowrap'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '2px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '권장값' : isZh ? '推荐值' : 'Recommended'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: param.color,
                  fontWeight: '600',
                  fontFamily: 'monospace'
                }}>
                  {param.recommended}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KvCacheConfig;
