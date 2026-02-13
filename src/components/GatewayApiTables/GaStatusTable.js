import React from 'react';

const resources = {
  ko: [
    { resource: 'GatewayClass', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: '컨트롤러 정의, 파라미터 참조', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'Gateway', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: '리스너, TLS, 로드밸런서 설정', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'HTTPRoute', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: 'HTTP 라우팅, 헤더/쿼리 매칭', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'GRPCRoute', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: 'gRPC 서비스 메시 매칭', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'ReferenceGrant', channel: 'Standard', status: 'GA (v1beta1)', recommended: '✅', notes: '크로스 네임스페이스 참조 보안', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'BackendTLSPolicy', channel: 'Standard', status: 'Beta (v1alpha3)', recommended: '⚠️', notes: '백엔드 TLS 종단 (mTLS)', statusColor: '#ff9800', recColor: '#ff9800' },
    { resource: 'TLSRoute', channel: 'Experimental', status: 'Alpha (v1alpha2)', recommended: '❌', notes: 'TLS Passthrough (SNI 라우팅)', statusColor: '#f44336', recColor: '#f44336' },
    { resource: 'TCPRoute', channel: 'Experimental', status: 'Alpha (v1alpha2)', recommended: '❌', notes: 'L4 TCP 라우팅', statusColor: '#f44336', recColor: '#f44336' },
    { resource: 'UDPRoute', channel: 'Experimental', status: 'Alpha (v1alpha2)', recommended: '❌', notes: 'L4 UDP 라우팅 (DNS, VoIP)', statusColor: '#f44336', recColor: '#f44336' },
  ],
  en: [
    { resource: 'GatewayClass', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: 'Controller definition, parameter reference', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'Gateway', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: 'Listeners, TLS, load balancer settings', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'HTTPRoute', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: 'HTTP routing, header/query matching', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'GRPCRoute', channel: 'Standard', status: 'GA (v1)', recommended: '✅', notes: 'gRPC service mesh matching', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'ReferenceGrant', channel: 'Standard', status: 'GA (v1beta1)', recommended: '✅', notes: 'Cross-namespace reference security', statusColor: '#4caf50', recColor: '#4caf50' },
    { resource: 'BackendTLSPolicy', channel: 'Standard', status: 'Beta (v1alpha3)', recommended: '⚠️', notes: 'Backend TLS termination (mTLS)', statusColor: '#ff9800', recColor: '#ff9800' },
    { resource: 'TLSRoute', channel: 'Experimental', status: 'Alpha (v1alpha2)', recommended: '❌', notes: 'TLS Passthrough (SNI routing)', statusColor: '#f44336', recColor: '#f44336' },
    { resource: 'TCPRoute', channel: 'Experimental', status: 'Alpha (v1alpha2)', recommended: '❌', notes: 'L4 TCP routing', statusColor: '#f44336', recColor: '#f44336' },
    { resource: 'UDPRoute', channel: 'Experimental', status: 'Alpha (v1alpha2)', recommended: '❌', notes: 'L4 UDP routing (DNS, VoIP)', statusColor: '#f44336', recColor: '#f44336' },
  ],
};

export default function GaStatusTable({ locale = 'ko' }) {
  const data = resources[locale] || resources.ko;
  const title = locale === 'ko' ? '✅ Gateway API GA 상태' : '✅ Gateway API GA Status';
  const subtitle = locale === 'ko' ? '리소스별 안정성 및 프로덕션 권장 여부' : 'Resource stability and production recommendation';
  const headers = locale === 'ko'
    ? { resource: '리소스', channel: '채널', status: '상태', recommended: '프로덕션 권장', notes: '비고' }
    : { resource: 'Resource', channel: 'Channel', status: 'Status', recommended: 'Production Recommended', notes: 'Notes' };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((item) => (
          <div key={item.resource} style={{ border: `1.5px solid ${item.statusColor}30`, borderLeft: `4px solid ${item.statusColor}`, borderRadius: 8, padding: '0.7rem 1rem', background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1f2937' }}>{item.resource}</span>
              <span style={{ background: '#64748b', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>{item.channel}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ background: item.statusColor, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{item.status}</span>
                <span style={{ fontSize: '1rem' }}>{item.recommended}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>{item.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
