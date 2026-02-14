import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ModelServingComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const solutions = [
    {
      name: 'vLLM',
      version: 'v0.6+',
      role: isKo ? '추론 엔진' : isZh ? '推理引擎' : 'Inference Engine',
      features: isKo ? 'PagedAttention, Continuous Batching, Speculative Decoding' : isZh ? 'PagedAttention，连续批处理，推测解码' : 'PagedAttention, Continuous Batching, Speculative Decoding',
      color: '#e74c3c'
    },
    {
      name: 'llm-d',
      version: 'v0.4+',
      role: isKo ? '분산 스케줄러' : isZh ? '分布式调度器' : 'Distributed Scheduler',
      features: isKo ? '로드 밸런싱, Prefix Caching 인식 라우팅, 장애 복구' : isZh ? '负载均衡，前缀缓存感知路由，故障恢复' : 'Load balancing, Prefix Caching-aware routing, Failure recovery',
      color: '#c0392b'
    }
  ];

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🚀 모델 서빙 솔루션 비교' : isZh ? '🚀 模型服务解决方案比较' : '🚀 Model Serving Solutions'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'vLLM vs llm-d 역할과 기능' : isZh ? 'vLLM vs llm-d 角色和功能' : 'vLLM vs llm-d roles and capabilities'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {solutions.map((solution, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 80px 1fr',
              gap: '16px',
              padding: '20px',
              borderBottom: index < solutions.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              alignItems: 'start'
            }}
          >
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: solution.color,
                marginBottom: '4px'
              }}>
                {solution.name}
              </div>
              <div style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: `${solution.color}20`,
                color: solution.color,
                border: `1px solid ${solution.color}40`
              }}>
                {solution.version}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                {isKo ? '역할' : isZh ? '角色' : 'Role'}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: solution.color
              }}>
                {solution.role}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '6px'
              }}>
                {isKo ? '핵심 기능' : isZh ? '核心功能' : 'Key Features'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.5'
              }}>
                {solution.features}
              </div>
            </div>
          </div>
        ))}

        <div style={{
          padding: '16px 20px',
          background: '#fef2f2',
          borderTop: '1px solid var(--ifm-color-emphasis-200)'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <span>
              {isKo ? 'vLLM은 추론 최적화를, llm-d는 분산 스케줄링을 담당하여 상호 보완적으로 작동합니다.' : isZh ? 'vLLM 负责推理优化，llm-d 负责分布式调度，两者互补工作。' : 'vLLM handles inference optimization while llm-d manages distributed scheduling in a complementary manner.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelServingComparison;
