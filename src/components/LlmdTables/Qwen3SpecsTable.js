import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const Qwen3SpecsTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const specs = [{
    label: isKo ? '모델명' : 'Model Name',
    value: 'Qwen/Qwen3-32B'
  }, {
    label: isKo ? '파라미터' : 'Parameters',
    value: '32B (Dense)'
  }, {
    label: isKo ? '라이선스' : 'License',
    value: 'Apache 2.0'
  }, {
    label: isKo ? '정밀도' : 'Precision',
    value: isKo ? 'BF16 (가중치 약 66GB, KV·런타임 별도)' : 'BF16 (~66GB weights; KV cache and runtime extra)'
  }, {
    label: isKo ? '컨텍스트' : 'Context',
    value: isKo ? '네이티브 32,768 토큰, YaRN으로 최대 131,072 토큰' : '32,768 tokens native; up to 131,072 with YaRN'
  }, {
    label: isKo ? '특징' : 'Features',
    value: isKo ? 'Optimized Baseline 레시피의 기본 모델, 다국어(100개 이상 언어) 지원' : 'Default model in the Optimized Baseline recipe; multilingual support (100+ languages)'
  }];
  return <div style={{
    maxWidth: '700px',
    margin: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? 'Qwen3-32B 모델 선정 이유' : 'Why Qwen3-32B Was Selected'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        {specs.map((spec, index) => <div key={index} style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        padding: '14px 20px',
        borderBottom: index < specs.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
        gap: '16px'
      }}>
            <div style={{
          fontWeight: '600',
          color: 'var(--ifm-font-color-base)'
        }}>
              {spec.label}
            </div>
            <div style={{
          color: 'var(--ifm-font-color-base)'
        }}>
              {spec.value}
            </div>
          </div>)}
      </div>
    </div>;
};
export default Qwen3SpecsTable;