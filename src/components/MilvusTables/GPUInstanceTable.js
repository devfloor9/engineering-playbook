import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GPUInstanceTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const instances = [
    {
      instanceType: 'g5.xlarge',
      gpu: '1x A10G (24GB)',
      vcpu: '4',
      memory: '16GB',
      useCase: isKo ? '소규모 인덱싱, 개발/테스트' : 'Small-scale indexing, dev/test',
      hourlyCost: '~$1.00'
    },
    {
      instanceType: 'g5.2xlarge',
      gpu: '1x A10G (24GB)',
      vcpu: '8',
      memory: '32GB',
      useCase: isKo ? '중규모 인덱싱' : 'Medium-scale indexing',
      hourlyCost: '~$1.50'
    },
    {
      instanceType: 'g5.12xlarge',
      gpu: '4x A10G (96GB)',
      vcpu: '48',
      memory: '192GB',
      useCase: isKo ? '대규모 인덱싱, 병렬 처리' : 'Large-scale indexing, parallel processing',
      hourlyCost: '~$5.70'
    },
    {
      instanceType: 'p4d.24xlarge',
      gpu: '8x A100 (320GB)',
      vcpu: '96',
      memory: '1152GB',
      useCase: isKo ? '초대규모 인덱싱, 최고 성능' : 'Ultra-large indexing, maximum performance',
      hourlyCost: '~$32.77'
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
        {isKo ? '권장 GPU 인스턴스' : 'Recommended GPU Instances'}
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
                minWidth: '140px'
              }}>
                {isKo ? '인스턴스 타입' : 'Instance Type'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '160px'
              }}>
                GPU
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '80px'
              }}>
                vCPU
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '100px'
              }}>
                {isKo ? '메모리' : 'Memory'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '200px'
              }}>
                {isKo ? '적합한 사용 사례' : 'Use Case'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '140px'
              }}>
                {isKo ? '시간당 비용 (ap-northeast-2)' : 'Hourly Cost (ap-northeast-2)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  color: '#059669',
                  fontSize: '13px',
                  borderBottom: index < instances.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {instance.instanceType}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: index < instances.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {instance.gpu}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: index < instances.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {instance.vcpu}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: index < instances.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {instance.memory}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#6b7280',
                  borderBottom: index < instances.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {instance.useCase}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < instances.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {instance.hourlyCost}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GPUInstanceTable;
