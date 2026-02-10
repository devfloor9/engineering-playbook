export default function TuningPointsChart({ locale = 'en' }) {
  const i18n = {
    en: {
      title: 'Cilium Scenario E Tuning Points',
      tuningItem: 'Tuning Item',
      helmValue: 'Helm Value',
      effect: 'Effect',
      applied: 'Applied',
      yes: 'Yes',
      no: 'No'
    },
    ko: {
      title: 'Cilium 시나리오 E 튜닝 항목',
      tuningItem: '튜닝 항목',
      helmValue: 'Helm 값',
      effect: '효과',
      applied: '적용 여부',
      yes: '적용됨',
      no: '미적용'
    }
  };

  const t = i18n[locale];

  const data = [
    {
      item: 'BPF Host Routing',
      helm: 'bpf.hostLegacyRouting=false',
      effect: 'Host NS iptables bypass',
      applied: true
    },
    {
      item: 'DSR',
      helm: 'loadBalancer.mode=dsr',
      effect: 'NodePort/LB direct return',
      applied: false,
      note: 'ENA compat'
    },
    {
      item: 'Bandwidth Manager',
      helm: 'bandwidthManager.enabled=true',
      effect: 'EDT rate limiting',
      applied: true
    },
    {
      item: 'BPF Masquerade',
      helm: 'bpf.masquerade=true',
      effect: 'iptables MASQUERADE → eBPF',
      applied: true
    },
    {
      item: 'Socket-level LB',
      helm: 'socketLB.enabled=true',
      effect: 'LB at connect()',
      applied: true
    },
    {
      item: 'XDP Acceleration',
      helm: 'loadBalancer.acceleration=native',
      effect: 'NIC driver processing',
      applied: false,
      note: 'ENA bpf_link'
    },
    {
      item: 'BBR',
      helm: 'bandwidthManager.bbr=true',
      effect: 'Google BBR congestion',
      applied: true
    },
    {
      item: 'Native Routing',
      helm: 'routingMode=native',
      effect: 'Remove VXLAN',
      applied: true
    },
    {
      item: 'CT Table Expansion',
      helm: 'bpf.ctGlobalAnyMax/TcpMax',
      effect: 'Expand Connection Tracking',
      applied: true
    },
    {
      item: 'Hubble Disabled',
      helm: 'hubble.enabled=false',
      effect: 'Remove observability overhead',
      applied: true
    }
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
                borderBottom: '1px solid #e5e7eb',
                width: '20%'
              }}>{t.tuningItem}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '30%'
              }}>{t.helmValue}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '35%'
              }}>{t.effect}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '15%'
              }}>{t.applied}</th>
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
                }}>{row.item}</td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#6b7280',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word'
                }}>{row.helm}</td>
                <td style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#4b5563'
                }}>{row.effect}</td>
                <td style={{
                  padding: '12px 16px',
                  textAlign: 'center'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: row.applied ? '#d1fae5' : '#fee2e2',
                    color: row.applied ? '#065f46' : '#991b1b'
                  }}>
                    {row.applied ? '✅' : '❌'}
                    <span style={{ marginLeft: '4px' }}>
                      {row.applied ? t.yes : t.no}
                    </span>
                  </span>
                  {row.note && (
                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      marginTop: '4px'
                    }}>({row.note})</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
