import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GPURequirements = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const requirements = [
    {
      modelSize: '8B',
      minGPU: '1x A100 80GB',
      recommendedInstance: 'p4d.24xlarge',
      memoryRequired: '80GB+',
      color: '#4285f4'
    },
    {
      modelSize: '13B',
      minGPU: '2x A100 80GB',
      recommendedInstance: 'p4d.24xlarge',
      memoryRequired: '160GB+',
      color: '#34a853'
    },
    {
      modelSize: '70B',
      minGPU: '8x A100 80GB',
      recommendedInstance: 'p4d.24xlarge / p5.48xlarge',
      memoryRequired: '640GB+',
      color: '#fbbc04'
    },
    {
      modelSize: '405B',
      minGPU: '32x H100',
      recommendedInstance: 'p5.48xlarge x4',
      memoryRequired: '2.5TB+',
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
        {isKo ? 'GPU 노드 요구사항' : isZh ? 'GPU 节点要求' : 'GPU Node Requirements'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '모델 크기' : isZh ? '模型大小' : 'Model Size'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '최소 GPU' : isZh ? '最小 GPU' : 'Minimum GPU'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '권장 인스턴스' : isZh ? '推荐实例' : 'Recommended Instance'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '메모리 요구' : isZh ? '内存需求' : 'Memory Required'}
              </th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((row, index) => (
              <tr key={index} style={{
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
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.minGPU}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.recommendedInstance}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', fontWeight: '600' }}>
                  {row.memoryRequired}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GPURequirements;
