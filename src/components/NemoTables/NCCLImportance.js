import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const NCCLImportance = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    aspect: isKo ? '모델 병렬화 (Model Parallelism)' : 'Model Parallelism',
    impact: isKo ? '높음' : 'High',
    optimization: isKo ? '각 GPU 간 활성화/그래디언트 전송 최적화' : 'Optimize activation/gradient transfer between GPUs',
    color: '#4285f4'
  }, {
    aspect: isKo ? '데이터 병렬화 (Data Parallelism)' : 'Data Parallelism',
    impact: isKo ? '매우 높음' : 'Very High',
    optimization: isKo ? 'AllReduce로 그래디언트 동기화 빠름' : 'Fast gradient synchronization via AllReduce',
    color: '#34a853'
  }, {
    aspect: isKo ? '파이프라인 병렬화 (Pipeline Parallelism)' : 'Pipeline Parallelism',
    impact: isKo ? '높음' : 'High',
    optimization: isKo ? '스테이지 간 활성화 전송 최적화' : 'Optimize activation transfer between stages',
    color: '#fbbc04'
  }, {
    aspect: isKo ? '혼합 정밀도 학습 (Mixed Precision)' : 'Mixed Precision Training',
    impact: isKo ? '중간' : 'Medium',
    optimization: isKo ? '압축된 그래디언트 통신 최적화' : 'Optimize compressed gradient communication',
    color: '#9c27b0'
  }];
  return <div style={{
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
        {isKo ? '분산 학습에서 NCCL의 중요성' : 'NCCL Importance in Distributed Training'}
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
          {data.map((item, index) => <div key={index} style={{
          background: 'var(--ifm-color-emphasis-50)',
          padding: '18px',
          borderRadius: '8px',
          borderLeft: `4px solid ${item.color}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
              <div style={{
            display: 'grid',
            gridTemplateColumns: '280px 100px 1fr',
            gap: '16px',
            alignItems: 'center'
          }}>
                <div style={{
              fontWeight: '600',
              color: item.color,
              fontSize: '15px'
            }}>
                  {item.aspect}
                </div>
                <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: item.impact === (isKo ? '매우 높음' : 'Very High') ? '#059669' : item.impact === (isKo ? '높음' : 'High') ? '#34a853' : '#fbbc04',
              textAlign: 'center',
              padding: '4px 12px',
              borderRadius: '12px',
              background: 'var(--ifm-color-emphasis-100)'
            }}>
                  {item.impact}
                </div>
                <div style={{
              fontSize: '14px',
              color: 'var(--ifm-font-color-base)'
            }}>
                  {item.optimization}
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default NCCLImportance;