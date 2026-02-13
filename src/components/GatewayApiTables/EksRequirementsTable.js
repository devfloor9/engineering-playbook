import React from 'react';

const data = {
  ko: [
    { item: 'EKS 버전', requirement: '1.28 이상 (권장: 1.32)', notes: 'Gateway API v1.4 호환성', badge: 'version' },
    { item: '컨트롤 플레인', requirement: 'kube-proxy 비활성화', notes: 'Cilium이 kube-proxy 대체', badge: 'critical' },
    { item: '노드 운영체제', requirement: 'Amazon Linux 2023 또는 Ubuntu 22.04', notes: 'eBPF 커널 지원 필요 (5.10+)', badge: 'os' },
    { item: '컨테이너 런타임', requirement: 'containerd 1.6+', notes: 'CRI 호환성', badge: 'runtime' },
    { item: 'VPC CNI 제거', requirement: '필수', notes: 'Cilium이 CNI 역할 수행', badge: 'critical' },
  ],
  en: [
    { item: 'EKS Version', requirement: '1.28+ (recommended: 1.32)', notes: 'Gateway API v1.4 compatibility', badge: 'version' },
    { item: 'Control Plane', requirement: 'Disable kube-proxy', notes: 'Cilium replaces kube-proxy', badge: 'critical' },
    { item: 'Node OS', requirement: 'Amazon Linux 2023 or Ubuntu 22.04', notes: 'eBPF kernel support required (5.10+)', badge: 'os' },
    { item: 'Container Runtime', requirement: 'containerd 1.6+', notes: 'CRI compatibility', badge: 'runtime' },
    { item: 'VPC CNI Removal', requirement: 'Required', notes: 'Cilium performs CNI role', badge: 'critical' },
  ],
};

const badgeColors = {
  version: { bg: '#e3f2fd', text: '#1565c0' },
  critical: { bg: '#ffebee', text: '#c62828' },
  os: { bg: '#f3e5f5', text: '#7b1fa2' },
  runtime: { bg: '#e8f5e9', text: '#2e7d32' },
};

export default function EksRequirementsTable({ locale = 'ko' }) {
  const items = data[locale];
  const title = locale === 'ko' ? '⚙️ EKS 클러스터 요구사항' : '⚙️ EKS Cluster Requirements';
  const subtitle = locale === 'ko' ? 'Gateway API 구축을 위한 필수 환경 설정' : 'Required environment setup for Gateway API deployment';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((row, idx) => {
          const badge = badgeColors[row.badge];
          return (
            <div key={idx} style={{ border: '1.5px solid #fb8c0020', borderLeft: '4px solid #f57c00', borderRadius: 8, padding: '0.7rem 1rem', background: '#fff3e0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ background: badge.bg, color: badge.text, borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{row.item}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.76rem', fontWeight: 600, color: '#e65100' }}>{row.requirement}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', fontStyle: 'italic' }}>{row.notes}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
