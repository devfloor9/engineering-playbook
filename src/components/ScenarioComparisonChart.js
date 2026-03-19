import React from 'react';

const colors = ['#64748b', '#8b5cf6', '#10b981', '#3b82f6', '#059669'];

const i18n = {
  en: {
    title: 'Test Scenarios',
    subtitle: '5 configurations isolating CNI, kube-proxy, IP allocation, and tuning variables',
    scenarios: [
      { id: 'A', name: 'VPC CNI Baseline', cni: 'VPC CNI', kp: 'iptables', ip: 'ENI Secondary IP', tuning: 'Default', purpose: 'Baseline' },
      { id: 'B', name: 'Cilium + kube-proxy', cni: 'Cilium', kp: 'iptables', ip: 'Overlay (VXLAN)', tuning: 'Default', purpose: 'Migration impact' },
      { id: 'C', name: 'Cilium kube-proxy-less', cni: 'Cilium', kp: 'eBPF', ip: 'Overlay (VXLAN)', tuning: 'Default', purpose: 'kube-proxy removal' },
      { id: 'D', name: 'Cilium ENI Mode', cni: 'Cilium', kp: 'eBPF', ip: 'AWS ENI (native)', tuning: 'Default', purpose: 'Overlay vs Native' },
      { id: 'E', name: 'Cilium ENI + Full Tuning', cni: 'Cilium', kp: 'eBPF', ip: 'AWS ENI (native)', tuning: 'All applied', purpose: 'Cumulative tuning' },
    ],
    labels: { cni: 'CNI', kp: 'kube-proxy', ip: 'IP Allocation', tuning: 'Tuning', purpose: 'Purpose' },
  },
  ko: {
    title: '테스트 시나리오',
    subtitle: 'CNI, kube-proxy 모드, IP 할당 방식, 튜닝 적용 여부를 조합한 5개 구성',
    scenarios: [
      { id: 'A', name: 'VPC CNI 기본', cni: 'VPC CNI', kp: 'iptables', ip: 'ENI Secondary IP', tuning: '기본값', purpose: '베이스라인' },
      { id: 'B', name: 'Cilium + kube-proxy', cni: 'Cilium', kp: 'iptables 유지', ip: 'Overlay (VXLAN)', tuning: '기본값', purpose: 'CNI 전환 영향' },
      { id: 'C', name: 'Cilium kube-proxy-less', cni: 'Cilium', kp: 'eBPF 대체', ip: 'Overlay (VXLAN)', tuning: '기본값', purpose: 'kube-proxy 제거 효과' },
      { id: 'D', name: 'Cilium ENI 모드', cni: 'Cilium', kp: 'eBPF 대체', ip: 'AWS ENI (native)', tuning: '기본값', purpose: 'Overlay vs Native' },
      { id: 'E', name: 'Cilium ENI + 풀 튜닝', cni: 'Cilium', kp: 'eBPF 대체', ip: 'AWS ENI (native)', tuning: '전체 적용', purpose: '튜닝 누적 효과' },
    ],
    labels: { cni: 'CNI', kp: 'kube-proxy', ip: 'IP 할당', tuning: '튜닝', purpose: '측정 목적' },
  },
};

function Tag({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
      fontSize: '0.68rem', fontWeight: 600, background: `${color}18`, color,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

export default function ScenarioComparisonChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px', margin: '0 0 1.5rem 0',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🧪 {t.title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: '2px' }}>{t.subtitle}</div>
      </div>
      <div style={{
        background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none',
        borderRadius: '0 0 12px 12px', padding: '1rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}>
        {t.scenarios.map((s, i) => (
          <div key={i} style={{
            border: `1.5px solid ${colors[i]}30`,
            borderLeft: `4px solid ${colors[i]}`,
            borderRadius: '8px', padding: '0.7rem 1rem',
            background: `${colors[i]}06`,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '0.4rem',
            }}>
              <span style={{
                background: colors[i], color: 'white', borderRadius: '50%',
                width: '22px', height: '22px', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
              }}>
                {s.id}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ifm-font-color-base)' }}>
                {s.name}
              </span>
              <span style={{
                marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--ifm-color-emphasis-600)',
                fontStyle: 'italic',
              }}>
                {s.purpose}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Tag text={`${t.labels.cni}: ${s.cni}`} color={colors[i]} />
              <Tag text={`${t.labels.kp}: ${s.kp}`} color="#6b7280" />
              <Tag text={`${t.labels.ip}: ${s.ip}`} color="#6b7280" />
              <Tag text={`${t.labels.tuning}: ${s.tuning}`} color={s.tuning !== 'Default' && s.tuning !== '기본값' ? '#059669' : '#94a3b8'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
