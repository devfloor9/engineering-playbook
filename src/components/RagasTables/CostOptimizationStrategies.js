import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const CostOptimizationStrategies = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const strategies = [{
    strategy: isKo ? '샘플링 평가' : 'Sampling Evaluation',
    description: isKo ? '전체 데이터셋 대신 대표 샘플만 평가' : 'Evaluate only representative samples instead of full dataset',
    savings: '50-80%',
    color: '#4285f4'
  }, {
    strategy: isKo ? '캐싱' : 'Caching',
    description: isKo ? '동일한 질문-답변 쌍은 캐싱하여 재사용' : 'Cache and reuse identical question-answer pairs',
    savings: '30-50%',
    color: '#34a853'
  }, {
    strategy: isKo ? '배치 처리' : 'Batch Processing',
    description: isKo ? '여러 평가를 배치로 묶어 처리' : 'Bundle multiple evaluations in batches',
    savings: '20-30%',
    color: '#fbbc04'
  }, {
    strategy: isKo ? '저렴한 모델 사용' : 'Use Cheaper Model',
    description: isKo ? 'GPT-4 대신 GPT-3.5 사용 (정확도 trade-off)' : 'Use GPT-3.5 instead of GPT-4 (accuracy trade-off)',
    savings: '90%',
    color: '#ea4335'
  }, {
    strategy: isKo ? '증분 평가' : 'Incremental Evaluation',
    description: isKo ? '변경된 부분만 재평가' : 'Re-evaluate only changed portions',
    savings: '60-90%',
    color: '#9c27b0'
  }];
  return <div style={{
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
        {isKo ? '💰 비용 최적화 전략' : '💰 Cost Optimization Strategies'}
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
        gap: '12px'
      }}>
          {strategies.map((item, index) => <div key={index} style={{
          background: 'var(--ifm-color-emphasis-50)',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: `4px solid ${item.color}`,
          display: 'grid',
          gridTemplateColumns: '150px 1fr 100px',
          gap: '16px',
          alignItems: 'center'
        }}>
              <div style={{
            fontWeight: '600',
            color: item.color
          }}>
                {item.strategy}
              </div>
              <div style={{
            fontSize: '14px',
            color: 'var(--ifm-font-color-base)'
          }}>
                {item.description}
              </div>
              <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: item.color,
            textAlign: 'center'
          }}>
                {item.savings}
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default CostOptimizationStrategies;