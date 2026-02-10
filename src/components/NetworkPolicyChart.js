export default function NetworkPolicyChart({ locale = 'en' }) {
  const i18n = {
    en: {
      title: 'Network Policy Feature Comparison',
      feature: 'Feature',
      vpcCni: 'VPC CNI (EKS Network Policy)',
      cilium: 'Cilium',
      supported: 'Supported',
      notSupported: 'Not supported',
      limitedSupport: 'Limited support'
    },
    ko: {
      title: '네트워크 정책 기능 비교',
      feature: '기능',
      vpcCni: 'VPC CNI (EKS 네트워크 정책)',
      cilium: 'Cilium',
      supported: '지원',
      notSupported: '미지원',
      limitedSupport: '제한적 지원'
    }
  };

  const t = i18n[locale];

  const data = [
    {
      feature: 'Kubernetes NetworkPolicy API',
      vpcCni: { supported: true, detail: t.supported },
      cilium: { supported: true, detail: t.supported }
    },
    {
      feature: 'L3/L4 Filtering',
      vpcCni: { supported: true, detail: t.supported },
      cilium: { supported: true, detail: t.supported }
    },
    {
      feature: 'L7 Filtering (HTTP/gRPC/Kafka)',
      vpcCni: { supported: false, detail: t.notSupported },
      cilium: { supported: true, detail: 'CiliumNetworkPolicy CRD' }
    },
    {
      feature: 'FQDN-based Policies',
      vpcCni: { supported: false, detail: t.notSupported },
      cilium: { supported: true, detail: 'toFQDNs rules' }
    },
    {
      feature: 'Identity-based Matching',
      vpcCni: { supported: false, detail: 'IP-based' },
      cilium: { supported: true, detail: 'Cilium Identity (eBPF, O(1))' }
    },
    {
      feature: 'Cluster-wide Policies',
      vpcCni: { supported: false, detail: 'Namespace-scoped only' },
      cilium: { supported: true, detail: 'CiliumClusterwideNetworkPolicy' }
    },
    {
      feature: 'Host-level Policies',
      vpcCni: { supported: false, detail: 'Pod traffic only' },
      cilium: { supported: true, detail: 'Host traffic control' }
    },
    {
      feature: 'Policy Enforcement Visibility',
      vpcCni: { supported: false, detail: 'CloudWatch Logs (limited)' },
      cilium: { supported: true, detail: 'Hubble (real-time)' }
    },
    {
      feature: 'Policy Editor/UI',
      vpcCni: { supported: false, detail: t.notSupported },
      cilium: { supported: true, detail: 'Cilium Network Policy Editor' }
    },
    {
      feature: 'Implementation',
      vpcCni: { supported: true, detail: 'eBPF (AWS agent)' },
      cilium: { supported: true, detail: 'eBPF (Cilium agent)' }
    },
    {
      feature: 'Performance Impact',
      vpcCni: { supported: true, detail: 'Low' },
      cilium: { supported: true, detail: 'Low' }
    }
  ];

  const renderCell = (item) => {
    if (!item.supported && item.detail === t.notSupported) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#dc2626',
          fontSize: '14px'
        }}>
          <span style={{ fontSize: '16px' }}>❌</span>
          <span>{item.detail}</span>
        </span>
      );
    }

    if (item.supported) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px'
        }}>
          <span style={{ fontSize: '16px' }}>✅</span>
          <span style={{ color: '#059669' }}>{item.detail}</span>
        </span>
      );
    }

    return (
      <span style={{
        fontSize: '14px',
        color: '#6b7280'
      }}>{item.detail}</span>
    );
  };

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
                width: '30%'
              }}>{t.feature}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '35%'
              }}>{t.vpcCni}</th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e5e7eb',
                width: '35%'
              }}>{t.cilium}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
                borderBottom: index < data.length - 1 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: row.cilium.supported && !row.vpcCni.supported ? '#f0fdf4' : 'transparent'
              }}>
                <td style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#1f2937',
                  fontWeight: '500'
                }}>{row.feature}</td>
                <td style={{
                  padding: '12px 16px'
                }}>{renderCell(row.vpcCni)}</td>
                <td style={{
                  padding: '12px 16px'
                }}>{renderCell(row.cilium)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f0fdf4',
        borderRadius: '6px',
        borderLeft: '4px solid #10b981'
      }}>
        <p style={{
          fontSize: '13px',
          color: '#065f46',
          margin: 0
        }}>
          <strong style={{ fontWeight: '600' }}>Highlighted rows</strong> indicate features where Cilium provides capabilities not available in VPC CNI.
        </p>
      </div>
    </div>
  );
}
