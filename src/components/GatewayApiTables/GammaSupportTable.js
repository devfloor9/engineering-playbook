import React from 'react';

const data = {
  ko: [
    { impl: 'Istio', support: '✅ GA', supportColor: '#4caf50', version: 'v1.22+', notes: 'Ambient Mode + waypoint proxy로 완전한 GAMMA 지원' },
    { impl: 'Cilium', support: '✅ GA', supportColor: '#4caf50', version: 'v1.16+', notes: 'eBPF 기반 L7 정책, HTTPRoute attach to Service' },
    { impl: 'Linkerd', support: '✅ Beta', supportColor: '#ff9800', version: 'v2.15+', notes: 'HTTPRoute 기반 메시 정책, Gateway API v1.2+' },
    { impl: 'Envoy Gateway', support: '⚠️ 제한적', supportColor: '#fbc02d', version: 'v1.7+', notes: '인그레스 중심, 메시는 간접 지원 (Istio 연동 필요)' },
    { impl: 'kGateway', support: '✅ GA', supportColor: '#4caf50', version: 'v2.1+', notes: '통합 게이트웨이 (인그레스+메시+AI), HTTPRoute/GRPCRoute 메시 지원' },
    { impl: 'Consul', support: '⚠️ 개발 중', supportColor: '#fbc02d', version: 'v1.19+', notes: 'Gateway API 실험 단계, 기존 Consul Config Entries 병행' },
  ],
  en: [
    { impl: 'Istio', support: '✅ GA', supportColor: '#4caf50', version: 'v1.22+', notes: 'Full GAMMA support with Ambient Mode + waypoint proxy' },
    { impl: 'Cilium', support: '✅ GA', supportColor: '#4caf50', version: 'v1.16+', notes: 'eBPF-based L7 policies, HTTPRoute attach to Service' },
    { impl: 'Linkerd', support: '✅ Beta', supportColor: '#ff9800', version: 'v2.15+', notes: 'HTTPRoute-based mesh policies, Gateway API v1.2+' },
    { impl: 'Envoy Gateway', support: '⚠️ Limited', supportColor: '#fbc02d', version: 'v1.7+', notes: 'Ingress-focused, mesh requires Istio integration' },
    { impl: 'kGateway', support: '✅ GA', supportColor: '#4caf50', version: 'v2.1+', notes: 'Unified gateway (ingress+mesh+AI), HTTPRoute/GRPCRoute mesh support' },
    { impl: 'Consul', support: '⚠️ In Development', supportColor: '#fbc02d', version: 'v1.19+', notes: 'Gateway API experimental, existing Consul Config Entries' },
  ],
};

export default function GammaSupportTable({ locale = 'ko' }) {
  const items = data[locale];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🔄 {locale === 'ko' ? 'GAMMA 지원 현황' : 'GAMMA Support Status'}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{locale === 'ko' ? '주요 구현체별 메시 Gateway API 지원 수준' : 'Gateway API for Mesh support level by implementation'}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ border: '1.5px solid #e0e0e0', borderLeft: `4px solid ${item.supportColor}`, borderRadius: 8, padding: '0.7rem 1rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#212121' }}>{item.impl}</span>
              <span style={{ background: item.supportColor, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{item.support}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 600, color: '#616161', background: '#e3f2fd', padding: '2px 8px', borderRadius: 4 }}>{item.version}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#6b7280', fontStyle: 'italic' }}>{item.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
