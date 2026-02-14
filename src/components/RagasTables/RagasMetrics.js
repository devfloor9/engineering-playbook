import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RagasMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'Faithfulness',
      target: isKo ? '생성 품질' : isZh ? '生成质量' : 'Generation Quality',
      description: isKo ? '답변이 컨텍스트에 충실한지' : isZh ? '答案是否忠实于上下文' : 'Whether answer is faithful to context',
      color: '#4285f4'
    },
    {
      metric: 'Answer Relevancy',
      target: isKo ? '생성 품질' : isZh ? '生成质量' : 'Generation Quality',
      description: isKo ? '답변이 질문과 관련있는지' : isZh ? '答案是否与问题相关' : 'Whether answer is relevant to question',
      color: '#34a853'
    },
    {
      metric: 'Context Precision',
      target: isKo ? '검색 품질' : isZh ? '检索质量' : 'Retrieval Quality',
      description: isKo ? '검색된 컨텍스트의 정밀도' : isZh ? '检索上下文的精度' : 'Precision of retrieved context',
      color: '#fbbc04'
    },
    {
      metric: 'Context Recall',
      target: isKo ? '검색 품질' : isZh ? '检索质量' : 'Retrieval Quality',
      description: isKo ? '필요한 정보가 검색되었는지' : isZh ? '是否检索到必要信息' : 'Whether required information is retrieved',
      color: '#ea4335'
    },
    {
      metric: 'Answer Correctness',
      target: isKo ? '종합 품질' : isZh ? '综合质量' : 'Overall Quality',
      description: isKo ? '답변의 정확성' : isZh ? '答案的准确性' : 'Answer accuracy',
      color: '#9c27b0'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Ragas 핵심 메트릭' : isZh ? 'Ragas 核心指标' : 'Ragas Core Metrics'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {metrics.map((metric, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-color-emphasis-50)',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${metric.color}`,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 2fr',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: '600', color: metric.color }}>
                {metric.metric}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                {metric.target}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RagasMetrics;
