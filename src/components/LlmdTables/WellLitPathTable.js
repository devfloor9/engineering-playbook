import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const WellLitPathTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const rows = [
    {
      path: 'Intelligent Inference Scheduling',
      description: isKo ? 'KV Cache-aware 라우팅으로 지능적 요청 분배' : 'Intelligent request distribution with KV Cache-aware routing',
      workload: isKo ? '범용 LLM 서빙 (본 가이드)' : 'General-purpose LLM serving (this guide)',
      recommended: true
    },
    {
      path: 'Prefill/Decode Disaggregation',
      description: isKo ? 'Prefill과 Decode 단계를 분리하여 처리' : 'Separates Prefill and Decode stages for processing',
      workload: isKo ? '대규모 배치, 긴 컨텍스트 처리' : 'Large batch processing, long context handling',
      recommended: false
    },
    {
      path: 'Wide Expert-Parallelism',
      description: isKo ? 'MoE 모델의 Expert를 여러 노드에 분산' : 'Distributes MoE model Experts across multiple nodes',
      workload: isKo ? 'MoE 모델 (Mixtral, DeepSeek 등)' : 'MoE models (Mixtral, DeepSeek, etc.)',
      recommended: false
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'llm-d의 3가지 Well-Lit Path' : "llm-d's 3 Well-Lit Paths"}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              padding: '16px 20px',
              borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              background: row.recommended ? '#f0fdf4' : 'transparent'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: row.recommended ? '#059669' : 'var(--ifm-font-color-base)'
              }}>
                {row.path}
              </span>
              {row.recommended && (
                <span style={{
                  background: '#059669',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {isKo ? '권장' : 'RECOMMENDED'}
                </span>
              )}
            </div>
            <div style={{ color: '#6b7280', marginBottom: '6px' }}>
              {row.description}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#059669',
              fontWeight: '500'
            }}>
              📌 {row.workload}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WellLitPathTable;
