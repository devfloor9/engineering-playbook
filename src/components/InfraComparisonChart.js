import { useColorMode } from '@docusaurus/theme-common';

export default function InfraComparisonChart({ locale = 'en' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#94a3b8' : '#6b7280',
    textMono: isDark ? '#cbd5e1' : '#6b7280',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e5e7eb',
  };

  const i18n = {
    en: {
      title: 'Instance Specifications',
      subtitle: '5 Test Scenarios · us-east-1 On-Demand pricing',
      accelerator: 'Accelerator',
      memoryPerChip: 'Memory per Chip',
      totalMemory: 'Total Accelerator Memory',
      network: 'Network Bandwidth',
      onDemand: 'On-Demand Price',
      costPerAccel: 'Cost per Accelerator-Hour',
      interconnect: 'Chip Interconnect'
    },
    ko: {
      title: '인스턴스 사양',
      subtitle: '5개 테스트 시나리오 · us-east-1 온디맨드 가격',
      accelerator: '가속기',
      memoryPerChip: '칩당 메모리',
      totalMemory: '총 가속기 메모리',
      network: '네트워크 대역폭',
      onDemand: '온디맨드 가격',
      costPerAccel: '가속기당 시간 비용',
      interconnect: '칩 인터커넥트'
    }
  };

  const t = i18n[locale] || i18n.en;

  const scenarioColors = {
    a: '#64748b',
    b: '#8b5cf6',
    c: '#f59e0b',
    d: '#3b82f6',
    e: '#10b981'
  };

  const data = [
    { label: t.accelerator, a: '8× H100', b: '8× A100', c: '8× L40S', d: '16× Trainium2', e: '12× Inferentia2' },
    { label: t.memoryPerChip, a: '80 GB HBM3', b: '40 GB HBM2', c: '48 GB GDDR6', d: '96 GB HBM', e: '32 GB HBM' },
    { label: t.totalMemory, a: '640 GB', b: '320 GB', c: '384 GB', d: '1,536 GB', e: '384 GB' },
    { label: t.network, a: '3,200 Gbps', b: '400 Gbps', c: '400 Gbps', d: '3,200 Gbps', e: '200 Gbps' },
    { label: t.onDemand, a: '$98.32', b: '$21.96', c: '$54.91', d: '~$45.00', e: '$12.89' },
    { label: t.costPerAccel, a: '$12.29', b: '$2.75', c: '$6.86', d: '~$2.81', e: '$1.07' },
    { label: t.interconnect, a: 'NVSwitch 900GB/s', b: 'NVSwitch 600GB/s', c: 'PCIe Gen5', d: 'NeuronLink', e: 'NeuronLink 192GB/s' }
  ];

  return (
    <div style={{
      width: '100%',
      padding: '16px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '12px 12px 0 0',
        padding: '1rem 1.5rem',
        color: 'white'
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{t.title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '2px' }}>{t.subtitle}</div>
      </div>

      <div style={{
        border: `1px solid ${theme.border}`,
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        overflowY: 'hidden',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: theme.bgSurface
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: theme.text,
                borderBottom: `1px solid ${theme.border}`,
                backgroundColor: theme.bgHeader
              }}>Spec</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: scenarioColors.a,
                color: 'white',
                borderBottom: `1px solid ${theme.border}`
              }}>A: p5.48xl</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: scenarioColors.b,
                color: 'white',
                borderBottom: `1px solid ${theme.border}`
              }}>B: p4d.24xl</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: scenarioColors.c,
                color: 'white',
                borderBottom: `1px solid ${theme.border}`
              }}>C: g6e.48xl</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: scenarioColors.d,
                color: 'white',
                borderBottom: `1px solid ${theme.border}`
              }}>D: trn2.48xl</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: scenarioColors.e,
                color: 'white',
                borderBottom: `1px solid ${theme.border}`
              }}>E: inf2.48xl</th>
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
                }}>{row.label}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.a}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.b}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.c}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.d}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.e}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
