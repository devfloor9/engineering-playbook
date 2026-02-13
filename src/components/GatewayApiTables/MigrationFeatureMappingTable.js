import React from 'react';

const data = {
  ko: [
    { nginx: 'host: example.com', gateway: 'HTTPRoute.spec.hostnames', notes: '직접 매핑', status: 'direct' },
    { nginx: 'path: /api', gateway: 'HTTPRoute.spec.rules[].matches[].path', notes: '직접 매핑', status: 'direct' },
    { nginx: 'pathType: Prefix', gateway: 'path.type: PathPrefix', notes: '동일', status: 'identical' },
    { nginx: 'annotations: rewrite-target', gateway: 'filters[].type: URLRewrite', notes: '표준화됨', status: 'standardized' },
    { nginx: 'annotations: rate-limit', gateway: 'Policy Attachment (구현체별 상이)', notes: '표준화 진행 중', status: 'in-progress' },
    { nginx: 'annotations: cors-*', gateway: 'Policy Attachment', notes: '표준화 진행 중', status: 'in-progress' },
    { nginx: 'annotations: auth-*', gateway: 'Policy Attachment 또는 외부 인증', notes: 'OAuth2-Proxy 등 권장', status: 'external' },
    { nginx: 'annotations: ssl-redirect', gateway: 'Gateway TLS 리스너 자동 처리', notes: '자동화됨', status: 'automated' },
  ],
  en: [
    { nginx: 'host: example.com', gateway: 'HTTPRoute.spec.hostnames', notes: 'Direct mapping', status: 'direct' },
    { nginx: 'path: /api', gateway: 'HTTPRoute.spec.rules[].matches[].path', notes: 'Direct mapping', status: 'direct' },
    { nginx: 'pathType: Prefix', gateway: 'path.type: PathPrefix', notes: 'Identical', status: 'identical' },
    { nginx: 'annotations: rewrite-target', gateway: 'filters[].type: URLRewrite', notes: 'Standardized', status: 'standardized' },
    { nginx: 'annotations: rate-limit', gateway: 'Policy Attachment (varies by implementation)', notes: 'Standardization in progress', status: 'in-progress' },
    { nginx: 'annotations: cors-*', gateway: 'Policy Attachment', notes: 'Standardization in progress', status: 'in-progress' },
    { nginx: 'annotations: auth-*', gateway: 'Policy Attachment or external auth', notes: 'OAuth2-Proxy etc. recommended', status: 'external' },
    { nginx: 'annotations: ssl-redirect', gateway: 'Gateway TLS listener auto-handling', notes: 'Automated', status: 'automated' },
  ],
};

const statusColors = {
  direct: { bg: '#e8f5e9', text: '#2e7d32', label: { ko: '직접 매핑', en: 'Direct' } },
  identical: { bg: '#e8f5e9', text: '#2e7d32', label: { ko: '동일', en: 'Identical' } },
  standardized: { bg: '#e3f2fd', text: '#1565c0', label: { ko: '표준화됨', en: 'Standardized' } },
  'in-progress': { bg: '#fff3e0', text: '#e65100', label: { ko: '진행 중', en: 'In Progress' } },
  external: { bg: '#fff3e0', text: '#e65100', label: { ko: '외부', en: 'External' } },
  automated: { bg: '#e0f2f1', text: '#00695c', label: { ko: '자동화됨', en: 'Automated' } },
};

export default function MigrationFeatureMappingTable({ locale = 'ko' }) {
  const rows = data[locale];
  const title = locale === 'ko' ? '🔄 NGINX Ingress → Gateway API 마이그레이션 매핑' : '🔄 NGINX Ingress → Gateway API Migration Mapping';
  const subtitle = locale === 'ko' ? '기존 Ingress 기능의 Gateway API 대안' : 'Gateway API alternatives for existing Ingress features';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #4e342e 0%, #5d4037 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map((row, idx) => {
          const statusStyle = statusColors[row.status];
          return (
            <div key={idx} style={{ border: '1.5px solid #5d403720', borderRadius: 8, padding: '0.7rem 1rem', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <code style={{ background: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 600 }}>{row.nginx}</code>
                <span style={{ fontSize: '1rem', color: '#5d4037' }}>→</span>
                <code style={{ background: '#e3f2fd', color: '#1565c0', padding: '3px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 600, flex: 1, minWidth: 180 }}>{row.gateway}</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem' }}>
                <span style={{ background: statusStyle.bg, color: statusStyle.text, padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: '0.72rem' }}>
                  {statusStyle.label[locale]}
                </span>
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>{row.notes}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
