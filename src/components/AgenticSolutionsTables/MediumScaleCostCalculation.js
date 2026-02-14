import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MediumScaleCostCalculation = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["구성", "월간 비용", "연간 비용"]
    : ["Strategy", "Cost Impact", "Implementation"];

  const data = isKo
    ? [
      [
            "On-Demand",
            "$16,420",
            "$197,037"
      ],
      [
            "Spot (70% 절감)",
            "$4,926",
            "$59,111"
      ],
      [
            "Karpenter Consolidation 추가 (20%)",
            "$3,941",
            "$47,289"
      ],
      [
            "**절감액**",
            "**$12,479**",
            "**$149,748**"
      ]
]
    : [
      [
            "**Spot Instances**",
            "60-90% cheaper than On-Demand",
            "Karpenter `capacity-type: spot`"
      ],
      [
            "**Consolidation**",
            "20-40% reduction in idle nodes",
            "`consolidateAfter: 30s`"
      ],
      [
            "**Right-sizing**",
            "10-30% savings from optimal instances",
            "Diverse `instance-family`"
      ],
      [
            "**Scale-to-zero**",
            "100% savings during idle periods",
            "KEDA `minReplicaCount: 0`"
      ],
      [
            "**Token Limits**",
            "10-50% reduction in LLM costs",
            "Application-level limits"
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
        background: 'linear-gradient(135deg, #45b7d1 0%, #45b7d1dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '중규모 비용 계산 (p4d.24xlarge)' : 'Medium Scale Cost Calculation (p4d.24xlarge)'}
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

export default MediumScaleCostCalculation;
