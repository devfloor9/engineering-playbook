import React from 'react';

const roles = {
  ko: [
    { resource: 'GatewayClass', manager: '인프라 팀 (SRE, 클러스터 관리자)', responsibility: '컨트롤러 선택, 전역 정책, 비용 최적화', frequency: '분기별 1-2회', color: '#e53935' },
    { resource: 'Gateway', manager: '플랫폼 팀 (네트워크 엔지니어)', responsibility: '리스너 구성, TLS 인증서, 로드밸런서 설정', frequency: '월 1-2회', color: '#fb8c00' },
    { resource: 'HTTPRoute', manager: '애플리케이션 팀 (개발자)', responsibility: '서비스별 라우팅, Canary 배포, A/B 테스트', frequency: '일 단위', color: '#43a047' },
    { resource: 'Service', manager: '애플리케이션 팀 (개발자)', responsibility: '백엔드 엔드포인트 관리', frequency: '배포 시마다', color: '#43a047' },
  ],
  en: [
    { resource: 'GatewayClass', manager: 'Infrastructure Team (SRE, Cluster Admin)', responsibility: 'Controller selection, global policies, cost optimization', frequency: '1-2 per quarter', color: '#e53935' },
    { resource: 'Gateway', manager: 'Platform Team (Network Engineers)', responsibility: 'Listener config, TLS certificates, load balancer settings', frequency: '1-2 per month', color: '#fb8c00' },
    { resource: 'HTTPRoute', manager: 'Application Team (Developers)', responsibility: 'Per-service routing, Canary deployment, A/B testing', frequency: 'Daily', color: '#43a047' },
    { resource: 'Service', manager: 'Application Team (Developers)', responsibility: 'Backend endpoint management', frequency: 'Per deployment', color: '#43a047' },
  ],
};

export default function RoleSeparationTable({ locale = 'ko' }) {
  const data = roles[locale] || roles.ko;
  const title = locale === 'ko' ? '👥 역할 기반 책임 분리' : '👥 Role-Based Responsibility Separation';
  const subtitle = locale === 'ko' ? '리소스별 관리 주체 및 변경 빈도' : 'Resource managers and change frequency';
  const headers = locale === 'ko'
    ? { manager: '관리 주체', responsibility: '책임 범위', frequency: '일반적인 변경 빈도' }
    : { manager: 'Manager', responsibility: 'Responsibility', frequency: 'Typical Change Frequency' };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #004d40 0%, #00695c 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((role) => (
          <div key={role.resource} style={{ border: `1.5px solid ${role.color}30`, borderLeft: `4px solid ${role.color}`, borderRadius: 8, padding: '0.7rem 1rem', background: 'var(--ifm-background-surface-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ background: role.color, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{role.resource}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ifm-color-emphasis-600)', marginLeft: 'auto' }}>⏱ {role.frequency}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--ifm-font-color-base)', flexShrink: 0 }}>{headers.manager}:</span>
                <span style={{ color: 'var(--ifm-color-emphasis-600)' }}>{role.manager}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--ifm-font-color-base)', flexShrink: 0 }}>{headers.responsibility}:</span>
                <span style={{ color: 'var(--ifm-color-emphasis-600)' }}>{role.responsibility}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
