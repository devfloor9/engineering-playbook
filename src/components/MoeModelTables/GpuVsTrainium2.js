import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GpuVsTrainium2 = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const comparisons = [
    {
      config: isKo ? 'GPU (NVIDIA)' : isZh ? 'GPU (NVIDIA)' : 'GPU (NVIDIA)',
      instance: 'p5.48xlarge (8x H100)',
      hourlyCost: '$98.32',
      monthlyCost: '$71,774',
      relativeCost: '100%',
      color: '#3b82f6',
      icon: '🎮'
    },
    {
      config: isKo ? 'GPU (NVIDIA)' : isZh ? 'GPU (NVIDIA)' : 'GPU (NVIDIA)',
      instance: 'p4d.24xlarge (8x A100)',
      hourlyCost: '$32.77',
      monthlyCost: '$23,922',
      relativeCost: '33%',
      color: '#8b5cf6',
      icon: '🎮'
    },
    {
      config: 'Trainium2',
      instance: 'trn2.48xlarge (16 cores)',
      hourlyCost: '$21.50',
      monthlyCost: '$15,695',
      relativeCost: '22%',
      color: '#10b981',
      icon: '⚡',
      highlight: true
    }
  ];

  const instanceTypes = [
    {
      instance: 'trn2.48xlarge',
      neuronCores: '16',
      memory: '512GB',
      network: '800 Gbps',
      suitableModels: isKo ? 'Mixtral 8x7B, Llama 3.1 70B' : isZh ? 'Mixtral 8x7B、Llama 3.1 70B' : 'Mixtral 8x7B, Llama 3.1 70B',
      color: '#10b981'
    },
    {
      instance: 'trn2.48xlarge (UltraServer)',
      neuronCores: '32',
      memory: '1TB',
      network: '1600 Gbps',
      suitableModels: isKo ? 'Mixtral 8x22B, Llama 3.1 405B' : isZh ? 'Mixtral 8x22B、Llama 3.1 405B' : 'Mixtral 8x22B, Llama 3.1 405B',
      color: '#06b6d4'
    }
  ];

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Trainium2 Instance Types */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0',
        marginBottom: '0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? 'AWS Trainium2 인스턴스 타입' : isZh ? 'AWS Trainium2 实例类型' : 'AWS Trainium2 Instance Types'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
        marginBottom: '30px'
      }}>
        {instanceTypes.map((type, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '240px 100px 120px 120px 1fr',
              padding: '16px 20px',
              borderBottom: index < instanceTypes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              alignItems: 'center'
            }}
          >
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: type.color,
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '30px',
                background: type.color,
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              {type.instance}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ifm-color-emphasis-800)', fontFamily: 'monospace' }}>
              {type.neuronCores}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ifm-color-emphasis-800)', fontFamily: 'monospace' }}>
              {type.memory}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ifm-color-emphasis-800)', fontFamily: 'monospace' }}>
              {type.network}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-emphasis-700)', fontStyle: 'italic' }}>
              {type.suitableModels}
            </div>
          </div>
        ))}
      </div>

      {/* GPU vs Trainium2 Cost Comparison */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? 'GPU vs Trainium2 비용 비교' : isZh ? 'GPU vs Trainium2 成本比较' : 'GPU vs Trainium2 Cost Comparison'}
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
          gridTemplateColumns: '40px 160px 260px 120px 140px 120px',
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)'
        }}>
          <div></div>
          <div>{isKo ? '구성' : isZh ? '配置' : 'Configuration'}</div>
          <div>{isKo ? '인스턴스' : isZh ? '实例' : 'Instance'}</div>
          <div>{isKo ? '시간당 비용' : isZh ? '每小时成本' : 'Hourly Cost'}</div>
          <div>{isKo ? '월간 비용 (730h)' : isZh ? '月成本 (730h)' : 'Monthly Cost (730h)'}</div>
          <div>{isKo ? '상대 비용' : isZh ? '相对成本' : 'Relative Cost'}</div>
        </div>

        {comparisons.map((comp, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 160px 260px 120px 140px 120px',
              padding: '16px 20px',
              borderBottom: index < comparisons.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              background: comp.highlight ? `${comp.color}10` : 'transparent',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{ fontSize: '24px' }}>{comp.icon}</div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: comp.color
            }}>
              {comp.config}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              fontFamily: 'monospace'
            }}>
              {comp.instance}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              fontFamily: 'monospace',
              fontWeight: '500'
            }}>
              {comp.hourlyCost}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              fontFamily: 'monospace',
              fontWeight: '500'
            }}>
              {comp.monthlyCost}
            </div>
            <div style={{
              fontSize: '15px',
              color: comp.color,
              fontWeight: '600',
              fontFamily: 'monospace'
            }}>
              {comp.relativeCost}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#ecfdf5',
        border: '2px solid #10b981',
        borderRadius: '8px',
        padding: '16px 20px',
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '24px' }}>💡</div>
        <div style={{
          fontSize: '14px',
          color: '#065f46',
          lineHeight: '1.5'
        }}>
          <strong>{isKo ? '비용 절감 효과:' : isZh ? '成本节약효果：' : 'Cost Savings:'}</strong>{' '}
          {isKo
            ? 'Trainium2는 H100 GPU 대비 78%, A100 GPU 대비 34% 비용 절감'
            : isZh
            ? 'Trainium2 相比 H100 GPU 节省 78%，相比 A100 GPU 节省 34%'
            : 'Trainium2 saves 78% vs H100 GPU, 34% vs A100 GPU'}
        </div>
      </div>
    </div>
  );
};

export default GpuVsTrainium2;
