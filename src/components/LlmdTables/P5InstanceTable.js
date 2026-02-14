import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const P5InstanceTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const specs = [
    { label: 'GPU', value: '8× NVIDIA H100 80GB HBM3' },
    { label: isKo ? 'GPU 메모리' : 'GPU Memory', value: isKo ? '총 640GB' : '640GB total' },
    { label: 'vCPU', value: '192' },
    { label: isKo ? '시스템 메모리' : 'System Memory', value: '2,048 GiB' },
    { label: isKo ? 'GPU 인터커넥트' : 'GPU Interconnect', value: 'NVSwitch (900 GB/s)' },
    { label: isKo ? '네트워크' : 'Network', value: 'EFA 3,200 Gbps' },
    { label: isKo ? '스토리지' : 'Storage', value: '8× 3.84TB NVMe SSD' }
  ];

  return (
    <div style={{
      maxWidth: '600px',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'p5.48xlarge 인스턴스 사양' : 'p5.48xlarge Instance Specifications'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {specs.map((spec, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr',
              padding: '14px 20px',
              borderBottom: index < specs.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              gap: '16px'
            }}
          >
            <div style={{
              fontWeight: '600',
              color: '#374151'
            }}>
              {spec.label}
            </div>
            <div style={{
              color: 'var(--ifm-font-color-base)',
              fontWeight: '500'
            }}>
              {spec.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default P5InstanceTable;
