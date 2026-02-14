import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SavingsPlansPricingTraining = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["인스턴스 타입", "GPU", "네트워크", "On-Demand", "Savings Plans (1년)", "절감률", "적합 워크로드"]
    : ["Component", "Purpose", "Scaling Trigger"];

  const data = isKo
    ? [
      [
            "p4d.24xlarge",
            "8x A100 40GB",
            "400 Gbps EFA",
            "$32.77",
            "$21.30",
            "35%",
            "중규모 학습"
      ],
      [
            "p4de.24xlarge",
            "8x A100 80GB",
            "400 Gbps EFA",
            "$40.97",
            "$26.63",
            "35%",
            "대규모 학습"
      ],
      [
            "p5.48xlarge",
            "8x H100 80GB",
            "3200 Gbps EFA",
            "$98.32",
            "$63.91",
            "35%",
            "초대규모 학습"
      ]
]
    : [
      [
            "**KEDA**",
            "Pod autoscaling",
            "Redis queue depth, SQS, CloudWatch"
      ],
      [
            "**Karpenter**",
            "Node autoscaling",
            "Pod pressure from KEDA scaling"
      ],
      [
            "**ALB Ingress**",
            "Multi-model routing",
            "Path-based routing"
      ],
      [
            "**Redis Streams**",
            "Task queue",
            "Persistent, distributed queue"
      ],
      [
            "**CloudWatch**",
            "Observability",
            "Custom metrics for latency, throughput"
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
        background: 'linear-gradient(135deg, #ff9900 0%, #ff9900dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Savings Plans 가격 (학습용)' : 'Savings Plans Pricing (Training)'}
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

export default SavingsPlansPricingTraining;
