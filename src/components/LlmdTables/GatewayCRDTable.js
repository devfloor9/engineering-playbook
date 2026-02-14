import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GatewayCRDTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const crds = [
    {
      crd: 'Gateway',
      role: isKo ? 'Envoy 기반 프록시 인스턴스 정의' : 'Defines Envoy-based proxy instances'
    },
    {
      crd: 'HTTPRoute',
      role: isKo ? '라우팅 규칙 정의' : 'Defines routing rules'
    },
    {
      crd: 'InferencePool',
      role: isKo ? 'vLLM Pod 그룹 (서빙 엔드포인트 풀) 정의' : 'Defines vLLM Pod groups (serving endpoint pools)'
    },
    {
      crd: 'InferenceModel',
      role: isKo ? '모델 이름과 InferencePool 매핑' : 'Maps model names to InferencePools'
    }
  ];

  return (
    <div style={{
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
        {isKo ? '설치되는 CRD' : 'Installed CRDs'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {crds.map((crd, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              padding: '14px 20px',
              borderBottom: index < crds.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              gap: '16px'
            }}
          >
            <div style={{
              fontFamily: 'monospace',
              fontWeight: '600',
              color: '#059669',
              fontSize: '13px'
            }}>
              {crd.crd}
            </div>
            <div style={{
              color: 'var(--ifm-font-color-base)'
            }}>
              {crd.role}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GatewayCRDTable;
