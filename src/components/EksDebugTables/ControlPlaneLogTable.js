import React from 'react';

const logs = [
  { type: 'api', component: 'kube-apiserver', stream: 'kube-apiserver-audit-*', purpose: 'API 요청/응답 기록', color: '#3b82f6' },
  { type: 'audit', component: 'kube-apiserver-audit', stream: 'kube-apiserver-audit-*', purpose: '감사 로그 (누가, 무엇을, 언제)', color: '#8b5cf6' },
  { type: 'authenticator', component: 'aws-iam-authenticator', stream: 'authenticator-*', purpose: 'IAM 인증 이벤트', color: '#059669' },
  { type: 'controllerManager', component: 'kube-controller-manager', stream: 'kube-controller-manager-*', purpose: '컨트롤러 동작 로그', color: '#ea580c' },
  { type: 'scheduler', component: 'kube-scheduler', stream: 'scheduler-*', purpose: '스케줄링 결정 및 실패', color: '#ca8a04' },
];

export default function ControlPlaneLogTable() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>📋 EKS 컨트롤 플레인 로그 타입</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>로그 그룹: /aws/eks/&lt;cluster-name&gt;/cluster</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {logs.map((l) => (
          <div key={l.type} style={{ border: `1.5px solid ${l.color}30`, borderLeft: `4px solid ${l.color}`, borderRadius: 8, padding: '0.6rem 1rem', background: `${l.color}06` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <code style={{ background: `${l.color}18`, color: l.color, padding: '2px 8px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}>{l.type}</code>
              <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>{l.component}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
              <span style={{ color: '#6b7280' }}>{l.purpose}</span>
              <code style={{ color: '#94a3b8', fontSize: '0.68rem' }}>{l.stream}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
