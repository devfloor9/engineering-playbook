import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TensorParallelismConfig = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const configs = [
    {
      model: 'Mixtral 8x7B',
      tpSize: '2',
      gpuConfig: '2x A100 80GB',
      memoryPerGpu: '~47GB',
      color: '#3b82f6'
    },
    {
      model: 'Mixtral 8x22B',
      tpSize: '4',
      gpuConfig: '4x H100 80GB',
      memoryPerGpu: '~70GB',
      color: '#8b5cf6'
    },
    {
      model: 'DeepSeek-MoE 16B',
      tpSize: '1',
      gpuConfig: '1x A100 40GB',
      memoryPerGpu: '~33GB',
      color: '#10b981'
    },
    {
      model: 'DBRX',
      tpSize: '4-8',
      gpuConfig: '4-8x H100 80GB',
      memoryPerGpu: '~33-66GB',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
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
          {isKo ? 'vLLM 텐서 병렬화 권장 설정' : isZh ? 'vLLM Tensor Parallelism 推荐配置' : 'vLLM Tensor Parallelism Recommended Configuration'}
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
          gridTemplateColumns: '200px 120px 200px 150px',
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)'
        }}>
          <div>{isKo ? '모델' : isZh ? '模型' : 'Model'}</div>
          <div>{isKo ? '권장 TP 크기' : isZh ? '推荐 TP 大小' : 'Recommended TP Size'}</div>
          <div>{isKo ? 'GPU 구성' : isZh ? 'GPU 配置' : 'GPU Configuration'}</div>
          <div>{isKo ? '메모리/GPU' : isZh ? '内存/GPU' : 'Memory/GPU'}</div>
        </div>

        {configs.map((config, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 120px 200px 150px',
              padding: '16px 20px',
              borderBottom: index < configs.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: config.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '30px',
                background: config.color,
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              {config.model}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center'
            }}>
              {config.tpSize}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--ifm-color-emphasis-700)',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center'
            }}>
              {config.gpuConfig}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center'
            }}>
              {config.memoryPerGpu}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TensorParallelismConfig;
