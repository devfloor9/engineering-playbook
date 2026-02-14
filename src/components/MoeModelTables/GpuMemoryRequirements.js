import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GpuMemoryRequirements = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const models = [
    {
      model: 'Mixtral 8x7B',
      totalParams: '46.7B',
      activeParams: '12.9B',
      fp16Memory: '~94GB',
      int8Memory: '~47GB',
      recommendedGpu: '2x A100 80GB',
      color: '#3b82f6'
    },
    {
      model: 'Mixtral 8x22B',
      totalParams: '141B',
      activeParams: '39B',
      fp16Memory: '~282GB',
      int8Memory: '~141GB',
      recommendedGpu: '4x H100 80GB',
      color: '#8b5cf6'
    },
    {
      model: 'DeepSeek-V3',
      totalParams: '671B',
      activeParams: '37B',
      fp16Memory: '~800GB*',
      int8Memory: '~400GB*',
      recommendedGpu: '8x H100 80GB',
      color: '#10b981'
    },
    {
      model: 'DeepSeek-MoE 16B',
      totalParams: '16.4B',
      activeParams: '2.8B',
      fp16Memory: '~33GB',
      int8Memory: '~17GB',
      recommendedGpu: '1x A100 40GB',
      color: '#f59e0b'
    },
    {
      model: 'Qwen2.5-MoE-A14B',
      totalParams: '~50B',
      activeParams: '14B',
      fp16Memory: '~100GB',
      int8Memory: '~50GB',
      recommendedGpu: '2x A100 80GB',
      color: '#ec4899'
    },
    {
      model: 'Qwen1.5-MoE-A2.7B',
      totalParams: '14.3B',
      activeParams: '2.7B',
      fp16Memory: '~29GB',
      int8Memory: '~15GB',
      recommendedGpu: '1x A100 40GB',
      color: '#06b6d4'
    },
    {
      model: 'DBRX',
      totalParams: '132B',
      activeParams: '36B',
      fp16Memory: '~264GB',
      int8Memory: '~132GB',
      recommendedGpu: '4x H100 80GB',
      color: '#84cc16'
    }
  ];

  return (
    <div style={{
      maxWidth: '1100px',
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
          {isKo ? 'MoE 모델 GPU 메모리 요구사항' : isZh ? 'MoE 模型 GPU 内存需求' : 'MoE Model GPU Memory Requirements'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              background: 'var(--ifm-color-emphasis-100)',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)'
            }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-300)' }}>
                {isKo ? '모델' : isZh ? '模型' : 'Model'}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid var(--ifm-color-emphasis-300)' }}>
                {isKo ? '총 파라미터' : isZh ? '总参数' : 'Total Parameters'}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid var(--ifm-color-emphasis-300)' }}>
                {isKo ? '활성 파라미터' : isZh ? '活跃参数' : 'Active Parameters'}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid var(--ifm-color-emphasis-300)' }}>
                FP16 {isKo ? '메모리' : isZh ? '内存' : 'Memory'}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '2px solid var(--ifm-color-emphasis-300)' }}>
                INT8 {isKo ? '메모리' : isZh ? '内存' : 'Memory'}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-300)' }}>
                {isKo ? '권장 GPU' : isZh ? '推荐 GPU' : 'Recommended GPU'}
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((model, index) => (
              <tr key={index} style={{
                borderBottom: index < models.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
              }}>
                <td style={{
                  padding: '14px 16px',
                  fontWeight: '600',
                  color: model.color,
                  borderLeft: `4px solid ${model.color}`
                }}>
                  {model.model}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--ifm-color-emphasis-800)' }}>
                  {model.totalParams}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--ifm-color-emphasis-800)' }}>
                  {model.activeParams}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--ifm-color-emphasis-800)' }}>
                  {model.fp16Memory}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--ifm-color-emphasis-800)' }}>
                  {model.int8Memory}
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--ifm-color-emphasis-700)' }}>
                  {model.recommendedGpu}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GpuMemoryRequirements;
