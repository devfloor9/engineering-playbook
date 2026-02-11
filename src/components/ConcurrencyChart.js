import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    title: 'Concurrent Request Scaling (Llama 4 Scout)',
    subtitle: 'Throughput (tokens/sec) by concurrent request count',
    concurrency: 'Concurrent Requests',
    footnote: '* Throughput scales sub-linearly due to memory bandwidth and compute contention',
  },
  ko: {
    title: '동시 요청 스케일링 (Llama 4 Scout)',
    subtitle: '동시 요청 수에 따른 처리량 (tokens/sec)',
    concurrency: '동시 요청 수',
    footnote: '* 메모리 대역폭 및 연산 경합으로 인해 처리량이 비선형적으로 증가',
  },
};

const scenarios = [
  { id: 'A', label: 'p5/H100', color: '#64748b' },
  { id: 'B', label: 'p4d/A100', color: '#8b5cf6' },
  { id: 'C', label: 'g6e/L40S', color: '#f59e0b' },
  { id: 'D', label: 'trn2', color: '#3b82f6' },
  { id: 'E', label: 'inf2', color: '#10b981' },
];

const data = [
  { concurrency: 1, values: [4200, 1800, 1400, 3500, 2800] },
  { concurrency: 4, values: [14800, 5600, 4200, 12500, 9800] },
  { concurrency: 8, values: [24500, 8400, 6800, 21000, 16200] },
  { concurrency: 16, values: [35200, 11200, 8500, 30800, 22400] },
  { concurrency: 32, values: [42000, 12800, 9200, 38500, 28000] },
];

export default function ConcurrencyChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e5e7eb',
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      <div style={{
        background: theme.bgSurface,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '1.2rem 1.5rem',
      }}>
        <div style={{
          marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: theme.text, fontWeight: 600 }}>
            {t.title}
          </h4>
          <div style={{ fontSize: '0.75rem', color: theme.textSecondary, marginTop: '0.25rem' }}>
            {t.subtitle}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.8rem',
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '0.6rem 0.8rem',
                  background: theme.bgHeader,
                  color: theme.text,
                  fontWeight: 600,
                  borderBottom: `2px solid ${theme.border}`,
                }}>
                  {t.concurrency}
                </th>
                {scenarios.map(s => (
                  <th key={s.id} style={{
                    textAlign: 'center',
                    padding: '0.6rem 0.8rem',
                    background: theme.bgHeader,
                    color: s.color,
                    fontWeight: 600,
                    borderBottom: `2px solid ${theme.border}`,
                    fontFamily: 'SFMono-Regular, Menlo, monospace',
                  }}>
                    {s.id}: {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => {
                const maxValue = Math.max(...row.values);
                return (
                  <tr key={row.concurrency}>
                    <td style={{
                      padding: '0.6rem 0.8rem',
                      borderBottom: rowIdx < data.length - 1 ? `1px solid ${theme.border}` : 'none',
                      fontWeight: 600,
                      color: theme.text,
                    }}>
                      {row.concurrency}
                    </td>
                    {row.values.map((value, colIdx) => (
                      <td key={colIdx} style={{
                        padding: '0.6rem 0.8rem',
                        textAlign: 'center',
                        borderBottom: rowIdx < data.length - 1 ? `1px solid ${theme.border}` : 'none',
                        fontFamily: 'SFMono-Regular, Menlo, monospace',
                        color: theme.text,
                        fontWeight: value === maxValue ? 700 : 400,
                        background: value === maxValue ? (isDark ? '#1e40af20' : '#dbeafe') : 'transparent',
                      }}>
                        {value.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: '1rem',
          fontSize: '0.72rem',
          color: theme.textSecondary,
          fontStyle: 'italic',
        }}>
          {t.footnote}
        </div>
      </div>
    </div>
  );
}
