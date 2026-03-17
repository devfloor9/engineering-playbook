import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const VllmVsTgi = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const comparisons = [
    {
      characteristic: isKo ? '처리량 (tokens/s)' : isZh ? '吞吐量 (tokens/s)' : 'Throughput (tokens/s)',
      vllm: isKo ? '높음' : isZh ? '高' : 'High',
      tgi: isKo ? '중상' : isZh ? '中上' : 'Medium-High',
      icon: '⚡'
    },
    {
      characteristic: isKo ? '지연시간 (TTFT)' : isZh ? '延迟 (TTFT)' : 'Latency (TTFT)',
      vllm: isKo ? '낮음' : isZh ? '低' : 'Low',
      tgi: isKo ? '중간' : isZh ? '中等' : 'Medium',
      icon: '⏱️'
    },
    {
      characteristic: isKo ? '메모리 효율성' : isZh ? '内存效率' : 'Memory Efficiency',
      vllm: isKo ? '매우 높음 (PagedAttention)' : isZh ? '非常高 (PagedAttention)' : 'Very High (PagedAttention)',
      tgi: isKo ? '높음' : isZh ? '高' : 'High',
      icon: '💾'
    },
    {
      characteristic: isKo ? 'MoE 최적화' : isZh ? 'MoE 优化' : 'MoE Optimization',
      vllm: isKo ? '우수' : isZh ? '优秀' : 'Excellent',
      tgi: isKo ? '양호' : isZh ? '良好' : 'Good',
      icon: '🎯'
    },
    {
      characteristic: isKo ? '양자화 지원' : isZh ? '量化支持' : 'Quantization Support',
      vllm: 'AWQ, GPTQ, SqueezeLLM',
      tgi: 'AWQ, GPTQ, EETQ',
      icon: '🔢'
    },
    {
      characteristic: isKo ? 'API 호환성' : isZh ? 'API 兼容性' : 'API Compatibility',
      vllm: isKo ? 'OpenAI 호환' : isZh ? 'OpenAI 兼容' : 'OpenAI compatible',
      tgi: isKo ? '자체 API + OpenAI 호환' : isZh ? '自定义 API + OpenAI 兼容' : 'Custom API + OpenAI compatible',
      icon: '🔌'
    },
    {
      characteristic: isKo ? '커뮤니티' : isZh ? '社区' : 'Community',
      vllm: isKo ? '활발' : isZh ? '活跃' : 'Active',
      tgi: isKo ? '활발' : isZh ? '活跃' : 'Active',
      icon: '👥'
    }
  ];

  return (
    <div style={{
      maxWidth: '1000px',
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
          {isKo ? 'vLLM vs TGI 성능 비교' : isZh ? 'vLLM vs TGI 性能比较' : 'vLLM vs TGI Performance Comparison'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 220px 1fr 1fr',
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)'
        }}>
          <div></div>
          <div>{isKo ? '특성' : isZh ? '特性' : 'Characteristic'}</div>
          <div style={{ color: '#3b82f6', fontWeight: '700' }}>
            vLLM <span style={{ fontSize: '11px', padding: '2px 6px', background: '#3b82f6', color: 'white', borderRadius: '3px', marginLeft: '6px' }}>{isKo ? '권장' : isZh ? '推荐' : 'Recommended'}</span>
          </div>
          <div style={{ color: '#8b5cf6', fontSize: '13px' }}>
            TGI <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '6px' }}>{isKo ? '(Legacy 참고용)' : isZh ? '(旧版参考)' : '(Legacy Reference)'}</span>
          </div>
        </div>

        {comparisons.map((comp, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 220px 1fr 1fr',
              padding: '16px 20px',
              borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ fontSize: '24px' }}>{comp.icon}</div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)'
            }}>
              {comp.characteristic}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              lineHeight: '1.5',
              paddingRight: '16px'
            }}>
              {comp.vllm}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              lineHeight: '1.5'
            }}>
              {comp.tgi}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VllmVsTgi;
