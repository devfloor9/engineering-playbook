import React from 'react';

const solutionColors = {
  'AWS Native': '#ff9800',
  'Cilium': '#2196f3',
  'NGINX Fabric': '#4caf50',
  'Envoy GW': '#f44336',
  'kGateway': '#9c27b0',
};

const data = {
  ko: [
    { num: 1, feature: 'Basic Auth', aws: 'Lambda/JWT', cilium: 'L7 Policy', nginx: 'OIDC Policy', envoy: 'ExtAuth', kgateway: 'JWT/OIDC' },
    { num: 2, feature: 'IP Allowlist', aws: 'WAF IP Sets + SG', cilium: 'CiliumNetworkPolicy', nginx: 'NginxProxy', envoy: 'SecurityPolicy', kgateway: 'RouteOption' },
    { num: 3, feature: 'Rate Limiting', aws: 'WAF Rate Rule', cilium: 'L7 Rate Limit', nginx: 'NginxProxy', envoy: 'BackendTrafficPolicy', kgateway: 'RouteOption' },
    { num: 4, feature: 'URL Rewrite', aws: 'HTTPRoute Filter', cilium: 'HTTPRoute Filter', nginx: 'HTTPRoute Filter', envoy: 'HTTPRoute Filter', kgateway: 'HTTPRoute Filter' },
    { num: 5, feature: 'Body Size', aws: 'WAF Size Rule', cilium: '-', nginx: 'NginxProxy', envoy: 'ClientTrafficPolicy', kgateway: 'RouteOption' },
    { num: 6, feature: 'Custom Error', aws: 'ALB Fixed Response', cilium: '-', nginx: 'Custom Backend', envoy: 'Direct Response', kgateway: 'DirectResponse' },
    { num: 7, feature: 'Header Routing', aws: 'HTTPRoute matches', cilium: 'HTTPRoute matches', nginx: 'HTTPRoute matches', envoy: 'HTTPRoute matches', kgateway: 'HTTPRoute matches' },
    { num: 8, feature: 'Cookie Affinity', aws: 'TG Stickiness', cilium: '-', nginx: 'Upstream Config', envoy: 'Session Persistence', kgateway: 'RouteOption' },
  ],
  en: [
    { num: 1, feature: 'Basic Auth', aws: 'Lambda/JWT', cilium: 'L7 Policy', nginx: 'OIDC Policy', envoy: 'ExtAuth', kgateway: 'JWT/OIDC' },
    { num: 2, feature: 'IP Allowlist', aws: 'WAF IP Sets + SG', cilium: 'CiliumNetworkPolicy', nginx: 'NginxProxy', envoy: 'SecurityPolicy', kgateway: 'RouteOption' },
    { num: 3, feature: 'Rate Limiting', aws: 'WAF Rate Rule', cilium: 'L7 Rate Limit', nginx: 'NginxProxy', envoy: 'BackendTrafficPolicy', kgateway: 'RouteOption' },
    { num: 4, feature: 'URL Rewrite', aws: 'HTTPRoute Filter', cilium: 'HTTPRoute Filter', nginx: 'HTTPRoute Filter', envoy: 'HTTPRoute Filter', kgateway: 'HTTPRoute Filter' },
    { num: 5, feature: 'Body Size', aws: 'WAF Size Rule', cilium: '-', nginx: 'NginxProxy', envoy: 'ClientTrafficPolicy', kgateway: 'RouteOption' },
    { num: 6, feature: 'Custom Error', aws: 'ALB Fixed Response', cilium: '-', nginx: 'Custom Backend', envoy: 'Direct Response', kgateway: 'DirectResponse' },
    { num: 7, feature: 'Header Routing', aws: 'HTTPRoute matches', cilium: 'HTTPRoute matches', nginx: 'HTTPRoute matches', envoy: 'HTTPRoute matches', kgateway: 'HTTPRoute matches' },
    { num: 8, feature: 'Cookie Affinity', aws: 'TG Stickiness', cilium: '-', nginx: 'Upstream Config', envoy: 'Session Persistence', kgateway: 'RouteOption' },
  ],
};

export default function FeatureMappingTable({ locale = 'ko' }) {
  const items = data[locale];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '100%', margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🔀 {locale === 'ko' ? 'NGINX 기능 → Gateway API 매핑' : 'NGINX Features → Gateway API Mapping'}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{locale === 'ko' ? '구현체별 NGINX 기능 재현 방식' : 'NGINX feature implementation by solution'}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.6rem 0.5rem', textAlign: 'center', background: 'var(--ifm-color-emphasis-100)', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: 700, fontSize: '0.7rem', color: 'var(--ifm-font-color-base)', width: '40px' }}>#</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', background: 'var(--ifm-color-emphasis-100)', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: 700, fontSize: '0.76rem', color: 'var(--ifm-font-color-base)', minWidth: '120px' }}>{locale === 'ko' ? 'NGINX 기능' : 'NGINX Feature'}</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `3px solid ${solutionColors['AWS Native']}`, background: 'var(--ifm-color-emphasis-100)', fontWeight: 700, fontSize: '0.74rem', color: 'var(--ifm-font-color-base)', minWidth: '140px' }}>AWS Native</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `3px solid ${solutionColors['Cilium']}`, background: 'var(--ifm-color-emphasis-100)', fontWeight: 700, fontSize: '0.74rem', color: 'var(--ifm-font-color-base)', minWidth: '140px' }}>Cilium</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `3px solid ${solutionColors['NGINX Fabric']}`, background: 'var(--ifm-color-emphasis-100)', fontWeight: 700, fontSize: '0.74rem', color: 'var(--ifm-font-color-base)', minWidth: '140px' }}>NGINX Fabric</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `3px solid ${solutionColors['Envoy GW']}`, background: 'var(--ifm-color-emphasis-100)', fontWeight: 700, fontSize: '0.74rem', color: 'var(--ifm-font-color-base)', minWidth: '140px' }}>Envoy GW</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', borderBottom: `3px solid ${solutionColors['kGateway']}`, background: 'var(--ifm-color-emphasis-100)', fontWeight: 700, fontSize: '0.74rem', color: 'var(--ifm-font-color-base)', minWidth: '140px' }}>kGateway</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--ifm-color-emphasis-100)' : 'var(--ifm-background-surface-color)' }}>
                <td style={{ padding: '0.7rem 0.5rem', textAlign: 'center', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e65100', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, margin: '0 auto' }}>{item.num}</div>
                </td>
                <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600, color: 'var(--ifm-font-color-base)', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>{item.feature}</td>
                <td style={{ padding: '0.7rem 0.8rem', color: 'var(--ifm-font-color-base)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>{item.aws}</td>
                <td style={{ padding: '0.7rem 0.8rem', color: 'var(--ifm-font-color-base)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>{item.cilium}</td>
                <td style={{ padding: '0.7rem 0.8rem', color: 'var(--ifm-font-color-base)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>{item.nginx}</td>
                <td style={{ padding: '0.7rem 0.8rem', color: 'var(--ifm-font-color-base)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>{item.envoy}</td>
                <td style={{ padding: '0.7rem 0.8rem', color: 'var(--ifm-font-color-base)', borderBottom: '1px solid var(--ifm-color-emphasis-200)', background: 'var(--ifm-color-emphasis-100)' }}>{item.kgateway}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
