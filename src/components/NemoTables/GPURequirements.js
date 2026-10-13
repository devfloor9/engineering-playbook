import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const GPURequirements = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const requirements = [{
    modelSize: '8B',
    minGPU: '1x A100 80GB',
    recommendedInstance: 'p4de.24xlarge',
    memoryRequired: '80GB+',
    color: '#4285f4'
  }, {
    modelSize: '13B',
    minGPU: '2x A100 80GB',
    recommendedInstance: 'p4de.24xlarge',
    memoryRequired: '160GB+',
    color: '#34a853'
  }, {
    modelSize: '70B',
    minGPU: '8x A100 80GB',
    recommendedInstance: 'p4de.24xlarge / p5.48xlarge',
    memoryRequired: '640GB+',
    color: '#fbbc04'
  }, {
    modelSize: '405B',
    minGPU: '32x H100',
    recommendedInstance: 'p5.48xlarge x4',
    memoryRequired: '2.5TB+',
    color: '#ea4335'
  }];
  const note = isKo
    ? 'A100 80GB가 필요한 행은 GPU당 80GB인 p4de.24xlarge를 권장합니다(p4d.24xlarge는 GPU당 40GB). 위 메모리 값은 추론 시 가중치 기준의 대략치이며, 학습에는 가중치 외에 옵티마이저 상태·그래디언트·활성값과 병렬화·시퀀스 길이에 따라 추가 메모리가 필요합니다.'
    : 'Rows requiring A100 80GB recommend p4de.24xlarge (80GB per GPU); p4d.24xlarge has 40GB per GPU. The memory values above are rough weight-based figures for inference; training needs additional memory for optimizer state, gradients, and activations, varying with parallelism and sequence length.';
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
        {isKo ? 'GPU 노드 요구사항' : 'GPU Node Requirements'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-color-emphasis-100)'
          }}>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '모델 크기' : 'Model Size'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '최소 GPU' : 'Minimum GPU'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '권장 인스턴스' : 'Recommended Instance'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '메모리 요구' : 'Memory Required'}
              </th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((row, index) => <tr key={index} style={{
            background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)',
            transition: 'background 0.2s'
          }}>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)',
              fontWeight: '700',
              color: row.color,
              fontSize: '16px',
              borderLeft: `4px solid ${row.color}`
            }}>
                  {row.modelSize}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.minGPU}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.recommendedInstance}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)',
              fontWeight: '600'
            }}>
                  {row.memoryRequired}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div style={{
      fontSize: '13px',
      color: 'var(--ifm-color-emphasis-700)',
      marginTop: '10px',
      lineHeight: '1.5'
    }}>
        {note}
      </div>
    </div>;
};
export default GPURequirements;