import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    title: "Cost Efficiency ($/1M tokens)",
    lowerBetter: "Lower is better",
    scoutLabel: "Llama 4 Scout",
    maverickLabel: "Llama 4 Maverick",
    best: "Most Cost-Efficient",
    costPerHr: "Cost/Hour",
    throughput: "Throughput",
    costPerToken: "$/1M tokens",
    scenario: "Scenario"
  },
  ko: {
    title: "비용 효율성 ($/1M 토큰)",
    lowerBetter: "낮을수록 좋음",
    scoutLabel: "Llama 4 Scout",
    maverickLabel: "Llama 4 Maverick",
    best: "최고 비용 효율",
    costPerHr: "시간당 비용",
    throughput: "처리량",
    costPerToken: "$/1M 토큰",
    scenario: "시나리오"
  }
};

const scoutData = [
  { label: "A: p5/H100", costPerHr: "$98.32", throughput: "4,200", costPerToken: 0.85, color: '#64748b' },
  { label: "B: p4d/A100", costPerHr: "$21.96", throughput: "1,800", costPerToken: 0.72, color: '#8b5cf6' },
  { label: "C: g6e/L40S", costPerHr: "$54.91", throughput: "1,400", costPerToken: 0.52, color: '#f59e0b' },
  { label: "D: trn2", costPerHr: "$45.00", throughput: "3,500", costPerToken: 0.35, color: '#3b82f6' },
  { label: "E: inf2", costPerHr: "$12.89", throughput: "2,800", costPerToken: 0.28, color: '#10b981', best: true }
];

const maverickData = [
  { label: "A: p5/H100", costPerHr: "$98.32", throughput: "2,800", costPerToken: 1.28, color: '#64748b' },
  { label: "D: trn2", costPerHr: "$45.00", throughput: "2,200", costPerToken: 0.74, color: '#3b82f6' }
];

export default function CostPerTokenChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e5e7eb'
  };

  const maxCost = Math.max(...scoutData.map(d => d.costPerToken));

  return (
    <div style={{
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Scout Chart */}
      <div style={{
        background: theme.bgSurface,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: theme.text
          }}>
            {t.title} — {t.scoutLabel}
          </h3>
          <span style={{
            fontSize: '13px',
            color: theme.textSecondary,
            fontStyle: 'italic'
          }}>
            {t.lowerBetter}
          </span>
        </div>

        {/* Horizontal Bar Chart */}
        <div style={{ marginBottom: '20px' }}>
          {scoutData.map((item, idx) => {
            const barWidth = (item.costPerToken / maxCost) * 100;
            return (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '4px'
                }}>
                  <div style={{
                    width: '100px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: theme.text
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    flex: 1,
                    position: 'relative',
                    height: '28px'
                  }}>
                    <div style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '8px',
                      transition: 'width 0.3s ease'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'white'
                      }}>
                        ${item.costPerToken.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {item.best && (
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.best}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost Breakdown Table */}
        <div style={{
          overflowX: 'auto',
          marginTop: '20px',
          borderTop: `1px solid ${theme.border}`,
          paddingTop: '16px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ background: theme.bgHeader }}>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.scenario}
                </th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.costPerHr}
                </th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.throughput}
                </th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.costPerToken}
                </th>
              </tr>
            </thead>
            <tbody>
              {scoutData.map((row, idx) => (
                <tr key={idx} style={{
                  borderBottom: idx < scoutData.length - 1 ? `1px solid ${theme.border}` : 'none'
                }}>
                  <td style={{
                    padding: '10px 12px',
                    color: theme.text,
                    fontWeight: '500'
                  }}>
                    {row.label}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    color: theme.textSecondary
                  }}>
                    {row.costPerHr}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    color: theme.textSecondary
                  }}>
                    {row.throughput}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontWeight: '700',
                    color: row.best ? '#10b981' : theme.text
                  }}>
                    ${row.costPerToken.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maverick Comparison */}
      <div style={{
        background: theme.bgSurface,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: theme.text
        }}>
          {t.maverickLabel} — {t.costPerToken}
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ background: theme.bgHeader }}>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.scenario}
                </th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.costPerHr}
                </th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.throughput}
                </th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: theme.textSecondary,
                  borderBottom: `2px solid ${theme.border}`
                }}>
                  {t.costPerToken}
                </th>
              </tr>
            </thead>
            <tbody>
              {maverickData.map((row, idx) => (
                <tr key={idx} style={{
                  borderBottom: idx < maverickData.length - 1 ? `1px solid ${theme.border}` : 'none'
                }}>
                  <td style={{
                    padding: '10px 12px',
                    color: theme.text,
                    fontWeight: '500'
                  }}>
                    {row.label}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    color: theme.textSecondary
                  }}>
                    {row.costPerHr}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    color: theme.textSecondary
                  }}>
                    {row.throughput}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontWeight: '700',
                    color: theme.text
                  }}>
                    ${row.costPerToken.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
