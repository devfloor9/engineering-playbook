import React from 'react';

const data = {
  ko: [
    { feature: 'Basic Auth', cost: '없음 (자체 구현)' },
    { feature: 'IP Allowlist', cost: '없음 (NetworkPolicy)' },
    { feature: 'Rate Limiting', cost: '없음 (L7 Policy)' },
    { feature: 'Body Size', cost: '없음 (Proxy Config)' },
    { feature: '모든 기능', cost: '없음 (컴퓨팅 리소스만)' },
  ],
  en: [
    { feature: 'Basic Auth', cost: 'None (self-implemented)' },
    { feature: 'IP Allowlist', cost: 'None (NetworkPolicy)' },
    { feature: 'Rate Limiting', cost: 'None (L7 Policy)' },
    { feature: 'Body Size', cost: 'None (Proxy Config)' },
    { feature: 'All Features', cost: 'None (compute resources only)' },
  ],
};

export default function OpenSourceCostTable({ locale = 'ko' }) {
  const items = data[locale];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #004d40 0%, #00695c 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>💚 {locale === 'ko' ? '오픈소스 추가 비용' : 'Open Source Additional Costs'}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{locale === 'ko' ? 'Cilium, NGINX Fabric, Envoy GW, kGateway' : 'Cilium, NGINX Fabric, Envoy GW, kGateway'}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ border: '1.5px solid #e0e0e0', borderLeft: '4px solid #00897b', borderRadius: 8, padding: '0.7rem 1rem', background: idx === items.length - 1 ? '#e0f2f1' : '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#004d40' }}>{item.feature}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00897b', background: '#e0f2f1', padding: '0.3rem 0.8rem', borderRadius: 6 }}>
                {item.cost}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
