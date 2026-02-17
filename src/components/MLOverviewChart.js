import { useColorMode } from '@docusaurus/theme-common';

export default function MLOverviewChart({ locale = 'en' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#94a3b8' : '#6b7280',
    textMono: isDark ? '#cbd5e1' : '#6b7280',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e5e7eb',
    borderLight: isDark ? '#1e293b' : '#f1f5f9',
  };

  const i18n = {
    en: {
      title: 'Benchmark Summary (Llama 4 Scout)',
      metric: 'Metric',
      colA: 'A: p5/H100',
      colB: 'B: p4d/A100',
      colC: 'C: g6e/L40S',
      colD: 'D: trn2',
      colE: 'E: inf2',
      ttft: 'TTFT (Time to First Token)',
      itl: 'ITL (Inter-Token Latency)',
      throughput: 'Throughput (tokens/sec)',
      cost: 'Cost ($/1M tokens)',
      footnote: '* Projected values based on published specs and architectural analysis. Input 512 / Output 128 tokens.'
    },
    ko: {
      title: '벤치마크 요약 (Llama 4 Scout)',
      metric: '지표',
      colA: 'A: p5/H100',
      colB: 'B: p4d/A100',
      colC: 'C: g6e/L40S',
      colD: 'D: trn2',
      colE: 'E: inf2',
      ttft: 'TTFT (첫 토큰 시간)',
      itl: 'ITL (토큰 간 지연)',
      throughput: '처리량 (tokens/sec)',
      cost: '비용 ($/1M tokens)',
      footnote: '* 공개된 스펙 및 아키텍처 분석 기반 추정치. 입력 512 / 출력 128 토큰.'
    }
  };

  const t = i18n[locale] || i18n.en;

  const data = [
    {
      metric: t.ttft,
      a: '120ms',
      b: '280ms',
      c: '350ms',
      d: '150ms',
      e: '200ms',
      bestCol: 'a'
    },
    {
      metric: t.itl,
      a: '8ms',
      b: '18ms',
      c: '22ms',
      d: '10ms',
      e: '14ms',
      bestCol: 'a'
    },
    {
      metric: t.throughput,
      a: '4,200',
      b: '1,800',
      c: '1,400',
      d: '3,500',
      e: '2,800',
      bestCol: 'a'
    },
    {
      metric: t.cost,
      a: '$0.85',
      b: '$0.72',
      c: '$0.52',
      d: '$0.35',
      e: '$0.28',
      bestCol: 'e'
    }
  ];

  const renderCell = (value, col, bestCol) => {
    const isBest = col === bestCol;
    return (
      <td style={{
        padding: '12px 16px',
        textAlign: 'right',
        fontSize: '14px'
      }}>
        {isBest ? (
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: isDark ? '#065f46' : '#d1fae5',
            color: isDark ? '#d1fae5' : '#065f46',
            fontFamily: 'monospace'
          }}>{value}</span>
        ) : (
          <span style={{
            color: theme.textMono,
            fontFamily: 'monospace'
          }}>{value}</span>
        )}
      </td>
    );
  };

  return (
    <div style={{
      width: '100%',
      padding: '16px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        overflowY: 'hidden',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: theme.bgHeader }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.metric}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.colA}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.colB}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.colC}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.colD}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.colE}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
                borderBottom: index < data.length - 1 ? `1px solid ${theme.border}` : 'none'
              }}>
                <td style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: theme.text,
                  fontWeight: '500'
                }}>{row.metric}</td>
                {renderCell(row.a, 'a', row.bestCol)}
                {renderCell(row.b, 'b', row.bestCol)}
                {renderCell(row.c, 'c', row.bestCol)}
                {renderCell(row.d, 'd', row.bestCol)}
                {renderCell(row.e, 'e', row.bestCol)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{
        marginTop: '12px',
        fontSize: '13px',
        color: theme.textSecondary,
        fontStyle: 'italic'
      }}>{t.footnote}</p>
    </div>
  );
}
