import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const GatewayCRDTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const crds = [{
    crd: 'Gateway',
    role: isKo ? 'Gateway API v1: 선택한 GatewayClass의 리스너와 진입점 정의' : 'Gateway API v1: listeners and entry point for the selected GatewayClass'
  }, {
    crd: 'HTTPRoute',
    role: isKo ? 'Gateway API v1: 경로·헤더·가중치로 Service 또는 InferencePool 참조' : 'Gateway API v1: path/header/weight rules referencing Services or InferencePools'
  }, {
    crd: 'InferencePool',
    role: isKo ? 'GIE v1: Pod selector·targetPorts·endpointPickerRef 정의; replica/GPU 관리 제외' : 'GIE v1: Pod selector, targetPorts, endpointPickerRef; no replica/GPU management'
  }, {
    crd: 'InferenceObjective',
    role: isKo ? 'llm-d v1alpha2 (선택): poolRef와 정수 priority로 요청 정책 정의; GPU 예약 아님' : 'llm-d v1alpha2 (optional): poolRef and integer priority for request policy; no GPU reservation'
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
        {isKo ? '검토 기준의 API 리소스' : 'API Resources at the Reviewed Baseline'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        {crds.map((crd, index) => <div key={index} style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        padding: '14px 20px',
        borderBottom: index < crds.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
        gap: '16px'
      }}>
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
          </div>)}
      </div>
    </div>;
};
export default GatewayCRDTable;