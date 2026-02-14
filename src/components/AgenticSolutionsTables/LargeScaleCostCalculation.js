import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LargeScaleCostCalculation = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["구성", "월간 비용", "연간 비용"]
    : ["Configuration", "Monthly Cost", "Savings"];

  const data = isKo
    ? [
      [
            "On-Demand",
            "$189,619",
            "$2,275,430"
      ],
      [
            "Savings Plans 1년 (35% 절감)",
            "$123,252",
            "$1,479,030"
      ],
      [
            "**절감액**",
            "**$66,367**",
            "**$796,400**"
      ]
]
    : [
      [
            "**Baseline (On-Demand g5.2xlarge)**",
            "$12,100",
            "-"
      ],
      [
            "**With Spot (70% coverage)**",
            "$4,235",
            "65%"
      ],
      [
            "**+ Consolidation (30% idle reduction)**",
            "$2,965",
            "75%"
      ],
      [
            "**+ Right-sizing (20% better packing)**",
            "$2,372",
            "80%"
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
        background: 'linear-gradient(135deg, #96ceb4 0%, #96ceb4dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '대규모 비용 계산 (p5.48xlarge)' : 'Large Scale Cost Calculation (p5.48xlarge)'}
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

export default LargeScaleCostCalculation;
