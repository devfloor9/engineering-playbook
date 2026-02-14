import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostOptimizationStrategies = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["전략", "적용 방법", "예상 절감률", "연간 절감액 (중규모 기준)"]
    : ["Component", "Purpose", "Cost Optimization"];

  const data = isKo
    ? [
      [
            "**Spot 인스턴스**",
            "Karpenter NodePool",
            "60-70%",
            "$137,926"
      ],
      [
            "**Consolidation**",
            "Karpenter disruption",
            "20-30%",
            "$39,407"
      ],
      [
            "**Right-sizing**",
            "워크로드별 인스턴스 선택",
            "15-25%",
            "$29,556"
      ],
      [
            "**Savings Plans**",
            "1년 약정 (학습용)",
            "30-35%",
            "$796,400"
      ],
      [
            "**복합 적용**",
            "위 전략 조합",
            "50-75%",
            "$98,519 - $147,778"
      ]
]
    : [
      [
            "**Dedicated NodePool**",
            "Isolate training from inference",
            "Spot instances, right-sized for training"
      ],
      [
            "**Kubeflow/AWS Batch**",
            "Distributed training orchestration",
            "Multi-node GPU utilization"
      ],
      [
            "**Checkpointing**",
            "Spot interruption recovery",
            "Minimize wasted compute"
      ],
      [
            "**FSx for Lustre**",
            "High-throughput data access",
            "Reduce training time"
      ],
      [
            "**EFA Networking**",
            "Low-latency GPU communication",
            "Faster distributed training"
      ]
];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffd93d 0%, #ffd93ddd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '비용 최적화 전략 요약' : 'Cost Optimization Strategies Summary'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              background: 'var(--ifm-color-emphasis-100)',
              borderBottom: '2px solid var(--ifm-color-emphasis-300)'
            }}>
              {headers.map((header, idx) => (
                <th key={idx} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'var(--ifm-font-color-base)',
                  whiteSpace: 'nowrap'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} style={{
                borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{
                    padding: '12px 16px',
                    color: 'var(--ifm-font-color-base)',
                    verticalAlign: 'top'
                  }}>
                    {cell.startsWith('**') && cell.endsWith('**')
                      ? <strong>{cell.slice(2, -2)}</strong>
                      : cell.includes('✅')
                        ? <span>{cell}</span>
                        : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostOptimizationStrategies;
