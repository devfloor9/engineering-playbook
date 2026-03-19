import React from 'react';

const data = {
  ko: [
    { type: 'm7g.xlarge', vcpu: '4', memory: '16GB', bandwidth: '최대 12.5Gbps', eni: '4', ipPerEni: '15', usage: '범용, 비용 효율', family: 'm7g' },
    { type: 'c7gn.xlarge', vcpu: '4', memory: '8GB', bandwidth: '최대 30Gbps', eni: '4', ipPerEni: '15', usage: '고성능 게이트웨이', family: 'c7gn' },
    { type: 'm7g.2xlarge', vcpu: '8', memory: '32GB', bandwidth: '최대 15Gbps', eni: '4', ipPerEni: '15', usage: '중규모 워크로드', family: 'm7g' },
    { type: 'c7gn.4xlarge', vcpu: '16', memory: '32GB', bandwidth: '최대 50Gbps', eni: '8', ipPerEni: '30', usage: '대규모 트래픽', family: 'c7gn' },
    { type: 'm7g.8xlarge', vcpu: '32', memory: '128GB', bandwidth: '25Gbps', eni: '8', ipPerEni: '30', usage: '고밀도 파드', family: 'm7g' },
    { type: 'c7gn.12xlarge', vcpu: '48', memory: '96GB', bandwidth: '100Gbps', eni: '15', ipPerEni: '50', usage: '초고성능', family: 'c7gn' },
  ],
  en: [
    { type: 'm7g.xlarge', vcpu: '4', memory: '16GB', bandwidth: 'Up to 12.5Gbps', eni: '4', ipPerEni: '15', usage: 'General purpose, cost efficient', family: 'm7g' },
    { type: 'c7gn.xlarge', vcpu: '4', memory: '8GB', bandwidth: 'Up to 30Gbps', eni: '4', ipPerEni: '15', usage: 'High-performance gateway', family: 'c7gn' },
    { type: 'm7g.2xlarge', vcpu: '8', memory: '32GB', bandwidth: 'Up to 15Gbps', eni: '4', ipPerEni: '15', usage: 'Medium workloads', family: 'm7g' },
    { type: 'c7gn.4xlarge', vcpu: '16', memory: '32GB', bandwidth: 'Up to 50Gbps', eni: '8', ipPerEni: '30', usage: 'Large-scale traffic', family: 'c7gn' },
    { type: 'm7g.8xlarge', vcpu: '32', memory: '128GB', bandwidth: '25Gbps', eni: '8', ipPerEni: '30', usage: 'High-density pods', family: 'm7g' },
    { type: 'c7gn.12xlarge', vcpu: '48', memory: '96GB', bandwidth: '100Gbps', eni: '15', ipPerEni: '50', usage: 'Ultra-high performance', family: 'c7gn' },
  ],
};

export default function InstanceTypeTable({ locale = 'ko' }) {
  const rows = data[locale];
  const title = locale === 'ko' ? '💻 인스턴스 타입 권장사항' : '💻 Instance Type Recommendations';
  const subtitle = locale === 'ko' ? 'Gateway API 노드 그룹에 최적화된 인스턴스 선택' : 'Optimized instance selection for Gateway API node groups';
  const headers = locale === 'ko'
    ? { type: '인스턴스 타입', vcpu: 'vCPU', memory: '메모리', bandwidth: '네트워크 대역폭', eni: 'ENI', ipPerEni: 'IP/ENI', usage: '권장 용도' }
    : { type: 'Instance Type', vcpu: 'vCPU', memory: 'Memory', bandwidth: 'Network Bandwidth', eni: 'ENI', ipPerEni: 'IP/ENI', usage: 'Recommended Use' };

  const maxBandwidth = 100;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0', whiteSpace: 'nowrap' }}>{headers.type}</th>
              <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.vcpu}</th>
              <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.memory}</th>
              <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.bandwidth}</th>
              <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.eni}</th>
              <th style={{ padding: '0.75rem 0.6rem', textAlign: 'center', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.ipPerEni}</th>
              <th style={{ padding: '0.75rem 0.8rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.usage}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isNetworkOptimized = row.family === 'c7gn';
              const bgColor = isNetworkOptimized ? '#e3f2fd' : '#f1f8f4';
              const bandwidthNum = parseFloat(row.bandwidth.match(/[\d.]+/)[0]);
              const barWidth = (bandwidthNum / maxBandwidth) * 100;

              return (
                <tr key={idx} style={{ background: bgColor, borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                  <td style={{ padding: '0.7rem 0.8rem', whiteSpace: 'nowrap' }}>
                    <code style={{ background: isNetworkOptimized ? '#1565c0' : '#2e7d32', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: '0.76rem', fontWeight: 600 }}>{row.type}</code>
                  </td>
                  <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', color: 'var(--ifm-font-color-base)', fontWeight: 600 }}>{row.vcpu}</td>
                  <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', color: 'var(--ifm-font-color-base)' }}>{row.memory}</td>
                  <td style={{ padding: '0.7rem 0.8rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--ifm-font-color-base)' }}>{row.bandwidth}</span>
                      <div style={{ width: '100%', maxWidth: 120, height: 6, background: 'var(--ifm-color-emphasis-200)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${barWidth}%`, height: '100%', background: isNetworkOptimized ? 'linear-gradient(90deg, #1565c0 0%, #42a5f5 100%)' : 'linear-gradient(90deg, #2e7d32 0%, #66bb6a 100%)' }}></div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', color: 'var(--ifm-font-color-base)' }}>{row.eni}</td>
                  <td style={{ padding: '0.7rem 0.6rem', textAlign: 'center', color: 'var(--ifm-font-color-base)' }}>{row.ipPerEni}</td>
                  <td style={{ padding: '0.7rem 0.8rem', fontSize: '0.76rem', color: 'var(--ifm-color-emphasis-600)' }}>{row.usage}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
