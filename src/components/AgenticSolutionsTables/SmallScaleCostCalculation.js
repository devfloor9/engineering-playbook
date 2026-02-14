import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SmallScaleCostCalculation = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["구성", "월간 비용", "연간 비용"]
    : ["Metric", "Without KEDA", "With KEDA + Karpenter"];

  const data = isKo
    ? [
      [
            "On-Demand",
            "$1,753",
            "$21,034"
      ],
      [
            "Spot (70% 절감)",
            "$526",
            "$6,310"
      ],
      [
            "**절감액**",
            "**$1,227**",
            "**$14,724**"
      ]
]
    : [
      [
            "**Scale-up latency**",
            "3-5 minutes (CPU-based HPA)",
            "30-60 seconds (queue-based)"
      ],
      [
            "**Scale-down safety**",
            "Aggressive, may kill tasks",
            "Cooldown + stabilization"
      ],
      [
            "**Cold start handling**",
            "minReplicas=0, slow start",
            "minReplicas=1, warm pool"
      ],
      [
            "**Burst handling**",
            "Delayed, CPU threshold based",
            "Immediate, queue depth based"
      ],
      [
            "**Cost efficiency**",
            "Moderate (always-on capacity)",
            "High (scale to zero capable)"
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
        background: 'linear-gradient(135deg, #4ecdc4 0%, #4ecdc4dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '소규모 비용 계산 (g5.xlarge)' : 'Small Scale Cost Calculation (g5.xlarge)'}
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

export default SmallScaleCostCalculation;
