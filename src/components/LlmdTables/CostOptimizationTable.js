import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const CostOptimizationTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const strategies = [{
    strategy: 'Savings Plans',
    description: isKo ? '1년/3년 Compute Savings Plans 약정 (약정 기간·선결제 비율에 따라 할인율 변동)' : '1-year/3-year Compute Savings Plans commitment (discount varies by term and upfront option)',
    savings: isKo ? 'On-Demand 대비 할인율 (약정 조건별)' : 'Discount vs On-Demand (per commitment terms)'
  }, {
    strategy: isKo ? '비피크 시간 스케일 다운' : 'Off-Peak Scale Down',
    description: isKo ? '야간/주말 replicas 축소 (CronJob 활용). 축소된 시간의 billed 인스턴스 수에 비례해 절감' : 'Reduce replicas during nights/weekends (CronJob); saves in proportion to billed instance-hours removed',
    savings: isKo ? '축소된 인스턴스-시간에 비례' : 'Scales with removed instance-hours'
  }, {
    strategy: isKo ? '모델 양자화' : 'Model Quantization',
    description: isKo ? 'INT8/INT4로 GPU 수 절감 가능 (정확도·처리량 영향 검증 필요)' : 'May reduce GPU count via INT8/INT4 (validate accuracy and throughput impact)',
    savings: isKo ? 'billed GPU 수가 실제로 줄 때만 절감' : 'Only when billed GPU count actually drops'
  }, {
    strategy: 'Spot Instances',
    description: isKo ? '내결함성 워크로드에 적용 (중단 위험 있음)' : 'Apply to fault-tolerant workloads (risk of interruption)',
    savings: isKo ? 'On-Demand 대비 Spot 할인 (가변, 중단 위험 수반)' : 'Spot discount vs On-Demand (variable, with interruption risk)'
  }, {
    strategy: isKo ? 'TP 최적화' : 'TP Optimization',
    description: isKo ? '모델 크기에 맞는 최소 TP 값 사용' : 'Use minimum TP value appropriate for model size',
    savings: isKo ? '불필요한 GPU 할당 회피' : 'Avoids over-allocating GPUs'
  }];
  return <div style={{
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
        <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-background-surface-color)'
          }}>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '160px'
            }}>
                {isKo ? '전략' : 'Strategy'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '300px'
            }}>
                {isKo ? '설명' : 'Description'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              minWidth: '120px'
            }}>
                {isKo ? '예상 절감' : 'Estimated Savings'}
              </th>
            </tr>
          </thead>
          <tbody>
            {strategies.map((strategy, index) => <tr key={index}>
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
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default CostOptimizationTable;