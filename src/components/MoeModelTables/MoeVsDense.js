import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MoeVsDense = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const comparisons = [
    {
      characteristic: isKo ? '파라미터 활성화' : isZh ? '参数激活' : 'Parameter Activation',
      dense: isKo ? '100% (전체)' : isZh ? '100%（全部）' : '100% (all)',
      moe: isKo ? '10-25% (일부 Expert)' : isZh ? '10-25%（部分 Expert）' : '10-25% (some experts)',
      icon: '⚡'
    },
    {
      characteristic: isKo ? '추론 연산량' : isZh ? '推理计算量' : 'Inference Computation',
      dense: isKo ? '높음' : isZh ? '高' : 'High',
      moe: isKo ? '상대적으로 낮음' : isZh ? '相对较低' : 'Relatively low',
      icon: '🔢'
    },
    {
      characteristic: isKo ? '메모리 요구량' : isZh ? '内存需求' : 'Memory Requirements',
      dense: isKo ? '파라미터 수에 비례' : isZh ? '与参数数量成正比' : 'Proportional to parameter count',
      moe: isKo ? '전체 파라미터 로드 필요' : isZh ? '需要加载全部参数' : 'Must load all parameters',
      icon: '💾'
    },
    {
      characteristic: isKo ? '학습 효율성' : isZh ? '学习效率' : 'Learning Efficiency',
      dense: isKo ? '표준' : isZh ? '标准' : 'Standard',
      moe: isKo ? '더 많은 데이터로 효율적 학습' : isZh ? '使用更多数据进行高效学习' : 'Efficient learning with more data',
      icon: '📚'
    },
    {
      characteristic: isKo ? '확장성' : isZh ? '可扩展性' : 'Scalability',
      dense: isKo ? '선형 증가' : isZh ? '线性增长' : 'Linear growth',
      moe: isKo ? 'Expert 추가로 효율적 확장' : isZh ? '通过添加 Expert 高效扩展' : 'Efficient scaling by adding experts',
      icon: '📈'
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
          {isKo ? 'MoE vs Dense 모델 비교' : isZh ? 'MoE vs Dense 模型比较' : 'MoE vs Dense Model Comparison'}
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
          <div style={{ color: '#3b82f6' }}>Dense {isKo ? '모델' : isZh ? '模型' : 'Model'}</div>
          <div style={{ color: '#8b5cf6' }}>MoE {isKo ? '모델' : isZh ? '模型' : 'Model'}</div>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoeVsDense;
