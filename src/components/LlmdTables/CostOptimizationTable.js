import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostOptimizationTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const strategies = [
    {
      strategy: 'Savings Plans',
      description: isKo ? '1년/3년 Compute Savings Plans 약정' : '1-year/3-year Compute Savings Plans commitment',
      savings: '30-60%'
    },
    {
      strategy: isKo ? '비피크 시간 스케일 다운' : 'Off-Peak Scale Down',
      description: isKo ? '야간/주말 replicas 축소 (CronJob 활용)' : 'Reduce replicas during nights/weekends (using CronJob)',
      savings: '40-60%'
    },
    {
      strategy: isKo ? '모델 양자화' : 'Model Quantization',
      description: isKo ? 'INT8/INT4로 GPU 수 절감' : 'Reduce GPU count with INT8/INT4',
      savings: isKo ? 'GPU 비용 50%' : '50% GPU cost'
    },
    {
      strategy: 'Spot Instances',
      description: isKo ? '내결함성 워크로드에 적용 (중단 위험 있음)' : 'Apply to fault-tolerant workloads (risk of interruption)',
      savings: '60-90%'
    },
    {
      strategy: isKo ? 'TP 최적화' : 'TP Optimization',
      description: isKo ? '모델 크기에 맞는 최소 TP 값 사용' : 'Use minimum TP value appropriate for model size',
      savings: isKo ? '불필요한 GPU 절약' : 'Avoid unnecessary GPUs'
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
        {isKo ? '비용 최적화 전략' : 'Cost Optimization Strategies'}
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
                minWidth: '160px'
              }}>
                {isKo ? '전략' : 'Strategy'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '300px'
              }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '2px solid var(--ifm-color-emphasis-200)',
                minWidth: '120px'
              }}>
                {isKo ? '예상 절감' : 'Estimated Savings'}
              </th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy, index) => (
              <tr key={index}>
                <td style={{
                  padding: '12px 16px',
                  fontWeight: '600',
                  color: '#059669',
                  borderBottom: index < strategies.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {strategy.strategy}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: 'var(--ifm-font-color-base)',
                  borderBottom: index < strategies.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {strategy.description}
                </td>
                <td style={{
                  padding: '12px 16px',
                  color: '#dc2626',
                  fontWeight: '600',
                  borderBottom: index < strategies.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
                }}>
                  {strategy.savings}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostOptimizationTable;
