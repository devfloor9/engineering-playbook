import { useColorMode } from '@docusaurus/theme-common';

export default function OverviewSummaryChart({ locale = 'en' }) {
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
      title: 'Benchmark Summary',
      metric: 'Metric',
      vpcCni: 'VPC CNI (A)',
      cilium: 'Cilium ENI+Tuning (E)',
      improvement: 'Improvement',
      tcpThroughput: 'TCP Throughput',
      udpPacketLoss: 'UDP Packet Loss',
      podToPodRtt: 'Pod-to-Pod RTT',
      httpP99: 'HTTP p99 @QPS=1000',
      serviceScaling: 'Service Scaling (1000 svc)',
      identical: 'Identical (NIC-saturated)',
      reduction680x: '680× reduction',
      lower36: '36% lower',
      lower20: '20% lower',
      iptablesGrowth101x: '101× iptables growth, +16%/conn',
      ebpfO1: 'O(1) constant performance',
      ebpfO1Advantage: 'O(1) vs O(n)',
      footnote: '* HTTP p99 improvements reflect optimized network path and reduced latency'
    },
    ko: {
      title: '벤치마크 요약',
      metric: '지표',
      vpcCni: 'VPC CNI (A)',
      cilium: 'Cilium ENI+Tuning (E)',
      improvement: '개선폭',
      tcpThroughput: 'TCP 처리량',
      udpPacketLoss: 'UDP 패킷 손실',
      podToPodRtt: 'Pod 간 RTT',
      httpP99: 'HTTP p99 @QPS=1000',
      serviceScaling: '서비스 스케일링 (1000 svc)',
      identical: '동일 (NIC 포화)',
      reduction680x: '680배 개선',
      lower36: '36% 단축',
      lower20: '20% 감소',
      iptablesGrowth101x: 'iptables 101배 증가, 연결당 +16%',
      ebpfO1: 'O(1) 성능 일정',
      ebpfO1Advantage: 'O(1) vs O(n)',
      footnote: '* HTTP p99 개선은 최적화된 네트워크 경로와 감소된 지연시간을 반영'
    }
  };

  const t = i18n[locale];

  const data = [
    { metric: t.tcpThroughput, vpcCni: '12.41 Gbps', cilium: '12.40 Gbps', improvement: t.identical, color: '#6b7280' },
    { metric: t.udpPacketLoss, vpcCni: '20.39%', cilium: '0.03%', improvement: t.reduction680x, color: '#10b981' },
    { metric: t.podToPodRtt, vpcCni: '4,894 µs', cilium: '3,135 µs', improvement: t.lower36, color: '#10b981' },
    { metric: t.httpP99, vpcCni: '10.92 ms', cilium: '8.75 ms*', improvement: t.lower20, color: '#10b981' },
    { metric: t.serviceScaling, vpcCni: t.iptablesGrowth101x, cilium: t.ebpfO1, improvement: t.ebpfO1Advantage, color: '#10b981' }
  ];

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
              }}>{t.vpcCni}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.cilium}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#374151',
                borderBottom: `1px solid ${theme.border}`
              }}>{t.improvement}</th>
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
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.vpcCni}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: theme.textMono,
                  fontFamily: 'monospace'
                }}>{row.cilium}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'right'
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: row.color === '#10b981' ? '#d1fae5' : (isDark ? '#374151' : '#f3f4f6'),
                    color: row.color === '#10b981' ? '#065f46' : (isDark ? '#d1d5db' : '#374151')
                  }}>{row.improvement}</span>
                </td>
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
