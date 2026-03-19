import React from 'react';

const i18n = {
  en: {
    title: 'Test Environment',
    subtitle: 'EKS 1.31 · Single AZ · Median of 3+ runs',
    rows: [
      { label: 'EKS Version', value: '1.31 (Platform: eks.51)' },
      { label: 'Cilium Version', value: '1.16.5 (Helm Chart: cilium-1.16.5)' },
      { label: 'Node Type', value: 'm6i.xlarge (4 vCPU, 16 GB RAM, ENA NIC)' },
      { label: 'Node Count', value: '3 (single AZ: ap-northeast-2a)' },
      { label: 'OS / Kernel', value: 'Amazon Linux 2023 · 6.1.159-182.297.amzn2023' },
      { label: 'Container Runtime', value: 'containerd 2.1.5' },
      { label: 'Service CIDR', value: '10.100.0.0/16' },
      { label: 'Tools', value: 'kubectl 1.31+, Cilium CLI 0.16+, Helm 3.16+, Fortio 1.65+, iperf3 3.17+' },
      { label: 'Measurement', value: 'Median of 3+ repeated runs' },
    ],
  },
  ko: {
    title: '테스트 환경',
    subtitle: 'EKS 1.31 · 단일 AZ · 최소 3회 반복 측정 중앙값',
    rows: [
      { label: 'EKS 버전', value: '1.31 (Platform: eks.51)' },
      { label: 'Cilium 버전', value: '1.16.5 (Helm Chart: cilium-1.16.5)' },
      { label: '노드 타입', value: 'm6i.xlarge (4 vCPU, 16 GB RAM, ENA NIC)' },
      { label: '노드 수', value: '3 (단일 AZ: ap-northeast-2a)' },
      { label: 'OS / Kernel', value: 'Amazon Linux 2023 · 6.1.159-182.297.amzn2023' },
      { label: '컨테이너 런타임', value: 'containerd 2.1.5' },
      { label: 'Service CIDR', value: '10.100.0.0/16' },
      { label: '도구', value: 'kubectl 1.31+, Cilium CLI 0.16+, Helm 3.16+, Fortio 1.65+, iperf3 3.17+' },
      { label: '측정 방식', value: '최소 3회 반복 측정 후 중앙값 사용' },
    ],
  },
};

export default function TestEnvironmentChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px', margin: '0 0 1.5rem 0',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🖥️ {t.title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '2px' }}>{t.subtitle}</div>
      </div>
      <div style={{
        background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none',
        borderRadius: '0 0 12px 12px', overflow: 'hidden',
      }}>
        {t.rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', borderBottom: i < t.rows.length - 1 ? '1px solid #f1f5f9' : 'none',
            fontSize: '0.82rem',
          }}>
            <div style={{
              width: '140px', flexShrink: 0, padding: '0.6rem 1rem',
              background: 'var(--ifm-background-surface-color)', fontWeight: 600, color: 'var(--ifm-color-emphasis-600)',
              borderRight: '1px solid #f1f5f9',
            }}>
              {row.label}
            </div>
            <div style={{
              flex: 1, padding: '0.6rem 1rem', color: 'var(--ifm-font-color-base)',
              fontFamily: 'SFMono-Regular, Menlo, monospace',
              fontSize: '0.78rem',
            }}>
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
