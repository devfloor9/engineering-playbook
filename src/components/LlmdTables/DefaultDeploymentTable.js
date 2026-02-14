import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DefaultDeploymentTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const settings = [
    {
      setting: isKo ? '모델' : 'Model',
      defaultValue: 'Qwen/Qwen3-32B',
      description: 'Apache 2.0, BF16 ~65GB VRAM'
    },
    {
      setting: isKo ? 'vLLM 버전' : 'vLLM Version',
      defaultValue: 'v0.6+',
      description: isKo ? 'CUDA 12.x 지원, H100/H200 최적화' : 'CUDA 12.x support, H100/H200 optimized'
    },
    {
      setting: 'Tensor Parallelism',
      defaultValue: 'TP=2',
      description: isKo ? 'replica당 2 GPU 사용' : '2 GPUs per replica'
    },
    {
      setting: 'Replicas',
      defaultValue: '8',
      description: isKo ? '총 16 GPU (2× p5.48xlarge)' : '16 GPUs total (2× p5.48xlarge)'
    },
    {
      setting: 'Max Model Length',
      defaultValue: '32,768',
      description: isKo ? '최대 컨텍스트 길이' : 'Maximum context length'
    },
    {
      setting: 'GPU Memory Utilization',
      defaultValue: '0.90',
      description: isKo ? 'KV Cache 할당 비율' : 'KV Cache allocation ratio'
    }
  ];

  return (
    <div style={{
      maxWidth: '100%',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      overflowX: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '기본 배포 구성' : 'Default Deployment Configuration'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '180px'
              }}>
                {isKo ? '설정' : 'Setting'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '기본값' : 'Default Value'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '250px'
              }}>
                {isKo ? '설명' : 'Description'}
              </th>
            </tr>
          </thead>
          <tbody>
            {settings.map((setting, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '500',
                  borderBottom: index < settings.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {setting.setting}
                </td>
                <td style={{
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  color: '#059669',
                  fontWeight: '600',
                  borderBottom: index < settings.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {setting.defaultValue}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < settings.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {setting.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DefaultDeploymentTable;
