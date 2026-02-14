import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const NemoComponents = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const components = [
    {
      component: 'NeMo Core',
      role: isKo ? '기본 프레임워크' : isZh ? '基础框架' : 'Core Framework',
      features: isKo ? '모델 정의, 학습 루프' : isZh ? '模型定义，训练循环' : 'Model definition, training loop',
      color: '#76b900'
    },
    {
      component: 'NeMo Curator',
      role: isKo ? '데이터 처리' : isZh ? '数据处理' : 'Data Processing',
      features: isKo ? '데이터 필터링, 중복 제거' : isZh ? '数据过滤，去重' : 'Data filtering, deduplication',
      color: '#4285f4'
    },
    {
      component: 'NeMo Aligner',
      role: isKo ? '정렬 학습' : isZh ? '对齐训练' : 'Alignment Training',
      features: 'RLHF, DPO, SFT',
      color: '#34a853'
    },
    {
      component: 'NeMo Guardrails',
      role: isKo ? '안전성' : isZh ? '安全性' : 'Safety',
      features: isKo ? '입출력 필터링' : isZh ? '输入输出过滤' : 'Input/output filtering',
      color: '#ea4335'
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
        background: 'linear-gradient(135deg, #76b900 0%, #5a8a00 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'NeMo 프레임워크 구성요소' : isZh ? 'NeMo 框架组件' : 'NeMo Framework Components'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {components.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-color-emphasis-50)',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${item.color}`,
                display: 'grid',
                gridTemplateColumns: '180px 150px 1fr',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: '600', color: item.color, fontSize: '15px' }}>
                {item.component}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                {item.role}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                {item.features}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NemoComponents;
