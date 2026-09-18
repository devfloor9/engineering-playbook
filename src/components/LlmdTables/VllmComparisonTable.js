import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const VllmComparisonTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const rows = [{
    feature: isKo ? '라우팅 방식' : 'Routing Method',
    traditional: isKo ? 'Round-Robin / Random' : 'Round-Robin / Random',
    llmd: isKo ? 'KV Cache-aware Intelligent Routing' : 'KV Cache-aware Intelligent Routing'
  }, {
    feature: isKo ? 'Gateway 통합' : 'Gateway Integration',
    traditional: isKo ? '별도 Ingress/Service 구성' : 'Separate Ingress/Service configuration',
    llmd: isKo ? 'Gateway API 네이티브 통합' : 'Native Gateway API integration'
  }, {
    feature: isKo ? '스케일링 관리' : 'Scaling Management',
    traditional: isKo ? '수동 HPA 구성' : 'Manual HPA configuration',
    llmd: isKo ? '별도 워크로드/오토스케일러가 replica 수 관리; InferencePool은 Pod 검색' : 'Workload/autoscaler manages replicas; InferencePool discovers Pods'
  }, {
    feature: isKo ? 'KV Cache 활용' : 'KV Cache Utilization',
    traditional: isKo ? 'Pod별 독립적 관리' : 'Independent management per Pod',
    llmd: isKo ? '캐시를 보유한 Pod로 라우팅; 전송/오프로딩은 별도 설정' : 'Routes to cached Pods; transfer/offloading requires separate configuration'
  }, {
    feature: isKo ? '설치 방식' : 'Installation Method',
    traditional: isKo ? '개별 Helm chart 조합' : 'Combining individual Helm charts',
    llmd: isKo ? 'v0.8.1 예제: router Helm chart + 모델 서버 Kustomize' : 'v0.8.1 recipe: router Helm chart + model-server Kustomize'
  }, {
    feature: isKo ? '모델 정의' : 'Model Definition',
    traditional: isKo ? 'Deployment YAML 직접 작성' : 'Writing Deployment YAML directly',
    llmd: isKo ? 'Deployment/LeaderWorkerSet 등에서 이미지·GPU·replica 정의; InferencePool은 엔드포인트, InferenceObjective는 요청 우선순위' : 'Deployment/LeaderWorkerSet defines image, GPUs, and replicas; InferencePool selects endpoints and InferenceObjective sets request priority'
  }];
  return <div style={{
    maxWidth: '100%',
    margin: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    overflowX: 'auto'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? 'llm-d vs 기존 vLLM 배포 비교' : 'llm-d vs Traditional vLLM Deployment Comparison'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-background-surface-color)'
          }}>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '160px'
            }}>
                {isKo ? '특성' : 'Feature'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '200px'
            }}>
                {isKo ? '기존 vLLM 배포' : 'Traditional vLLM Deployment'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: '#059669',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '200px',
              background: 'var(--ifm-color-emphasis-100)'
            }}>
                {isKo ? 'llm-d 배포' : 'llm-d Deployment'} ✨
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => <tr key={index}>
                <td style={{
              padding: '12px 16px',
              fontWeight: '500',
              borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {row.feature}
                </td>
                <td style={{
              padding: '12px 16px',
              color: 'var(--ifm-color-emphasis-600)',
              borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {row.traditional}
                </td>
                <td style={{
              padding: '12px 16px',
              color: '#059669',
              fontWeight: '500',
              background: 'var(--ifm-color-emphasis-100)',
              borderBottom: index < rows.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
            }}>
                  {row.llmd}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default VllmComparisonTable;