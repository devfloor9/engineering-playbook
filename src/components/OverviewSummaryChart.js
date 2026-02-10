export default function OverviewSummaryChart({ locale = 'en' }) {
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
      identical: 'Identical (NIC-saturated)',
      reduction680x: '680× reduction',
      lower36: '36% lower',
      lower20: '20% lower',
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
      identical: '동일 (NIC 포화)',
      reduction680x: '680배 개선',
      lower36: '36% 단축',
      lower20: '20% 감소',
      footnote: '* HTTP p99 개선은 최적화된 네트워크 경로와 감소된 지연시간을 반영'
    }
  };

  const t = i18n[locale];

  const data = [
    { metric: t.tcpThroughput, vpcCni: '12.41 Gbps', cilium: '12.40 Gbps', improvement: t.identical, color: '#6b7280' },
    { metric: t.udpPacketLoss, vpcCni: '20.39%', cilium: '0.03%', improvement: t.reduction680x, color: '#10b981' },
    { metric: t.podToPodRtt, vpcCni: '4,894 µs', cilium: '3,135 µs', improvement: t.lower36, color: '#10b981' },
    { metric: t.httpP99, vpcCni: '10.92 ms', cilium: '8.75 ms*', improvement: t.lower20, color: '#10b981' }
  ];

  return (
    <div style={{
      width: '100%',
      padding: '24px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflowY: 'hidden',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb'
              }}>{t.metric}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb'
              }}>{t.vpcCni}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb'
              }}>{t.cilium}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb'
              }}>{t.improvement}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
                borderBottom: index < data.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}>
                <td style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#1f2937',
                  fontWeight: '500'
                }}>{row.metric}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: '#6b7280',
                  fontFamily: 'monospace'
                }}>{row.vpcCni}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: '#6b7280',
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
                    backgroundColor: row.color === '#10b981' ? '#d1fae5' : '#f3f4f6',
                    color: row.color === '#10b981' ? '#065f46' : '#374151'
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
        color: '#6b7280',
        fontStyle: 'italic'
      }}>{t.footnote}</p>
    </div>
  );
}
