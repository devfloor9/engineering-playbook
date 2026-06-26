import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const MoeVsDense = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const comparisons = [{
    characteristic: isKo ? '파라미터 활성화' : 'Parameter Activation',
    dense: isKo ? '100% (전체)' : '100% (all)',
    moe: isKo ? '10-25% (일부 Expert)' : '10-25% (some experts)',
    icon: '⚡'
  }, {
    characteristic: isKo ? '추론 연산량' : 'Inference Computation',
    dense: isKo ? '높음' : 'High',
    moe: isKo ? '상대적으로 낮음' : 'Relatively low',
    icon: '🔢'
  }, {
    characteristic: isKo ? '메모리 요구량' : 'Memory Requirements',
    dense: isKo ? '파라미터 수에 비례' : 'Proportional to parameter count',
    moe: isKo ? '전체 파라미터 로드 필요' : 'Must load all parameters',
    icon: '💾'
  }, {
    characteristic: isKo ? '학습 효율성' : 'Learning Efficiency',
    dense: isKo ? '표준' : 'Standard',
    moe: isKo ? '더 많은 데이터로 효율적 학습' : 'Efficient learning with more data',
    icon: '📚'
  }, {
    characteristic: isKo ? '확장성' : 'Scalability',
    dense: isKo ? '선형 증가' : 'Linear growth',
    moe: isKo ? 'Expert 추가로 효율적 확장' : 'Efficient scaling by adding experts',
    icon: '📈'
  }];
  return <div style={{
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
        <div style={{
        fontSize: '20px',
        fontWeight: '600'
      }}>
          {isKo ? 'MoE vs Dense 모델 비교' : 'MoE vs Dense Model Comparison'}
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
          <div>{isKo ? '특성' : 'Characteristic'}</div>
          <div style={{
          color: '#3b82f6'
        }}>Dense {isKo ? '모델' : 'Model'}</div>
          <div style={{
          color: '#8b5cf6'
        }}>MoE {isKo ? '모델' : 'Model'}</div>
        </div>

        {comparisons.map((comp, index) => <div key={index} style={{
        display: 'grid',
        gridTemplateColumns: '40px 220px 1fr 1fr',
        padding: '16px 20px',
        borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
        transition: 'background-color 0.2s'
      }}>
            <div style={{
          fontSize: '24px'
        }}>{comp.icon}</div>
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
              {comp.dense}
            </div>
            <div style={{
          fontSize: '14px',
          color: 'var(--ifm-color-emphasis-800)',
          lineHeight: '1.5',
          fontWeight: '500'
        }}>
              {comp.moe}
            </div>
          </div>)}
      </div>
    </div>;
};
export default MoeVsDense;