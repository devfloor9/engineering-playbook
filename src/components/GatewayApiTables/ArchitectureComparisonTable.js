import React from 'react';

const comparisons = {
  ko: [
    { aspect: '리소스 구조', nginx: '단일 Ingress 리소스에 모든 설정 포함', gateway: '3개 리소스로 관심사 분리 (GatewayClass, Gateway, HTTPRoute)' },
    { aspect: '설정 방식', nginx: '비표준 어노테이션 (50개 이상)', gateway: '표준 CRD 필드' },
    { aspect: '권한 관리', nginx: '네임스페이스 레벨 Ingress 권한으로 모든 설정 제어 가능', gateway: '리소스별 RBAC 분리 (인프라/플랫폼/앱 팀)' },
    { aspect: '컨트롤러 교체', nginx: '전체 Ingress 재작성 필요', gateway: 'GatewayClass만 변경' },
    { aspect: '확장성', nginx: 'Snippet 주입 또는 커스텀 컨트롤러', gateway: 'Policy Attachment 패턴' },
  ],
  en: [
    { aspect: 'Resource Structure', nginx: 'All settings in a single Ingress resource', gateway: 'Separation of concerns with 3 resources (GatewayClass, Gateway, HTTPRoute)' },
    { aspect: 'Configuration', nginx: 'Non-standard annotations (50+)', gateway: 'Standard CRD fields' },
    { aspect: 'Permission Management', nginx: 'All settings controllable with namespace-level Ingress permission', gateway: 'Per-resource RBAC separation (Infra/Platform/App teams)' },
    { aspect: 'Controller Replacement', nginx: 'Full Ingress rewrite required', gateway: 'Only change GatewayClass' },
    { aspect: 'Extensibility', nginx: 'Snippet injection or custom controllers', gateway: 'Policy Attachment pattern' },
  ],
};

export default function ArchitectureComparisonTable({ locale = 'ko' }) {
  const data = comparisons[locale] || comparisons.ko;
  const title = locale === 'ko' ? '🔄 NGINX Ingress vs Gateway API 비교' : '🔄 NGINX Ingress vs Gateway API Comparison';
  const subtitle = locale === 'ko' ? '아키텍처 및 설정 방식 차이' : 'Architecture and configuration differences';
  const labels = locale === 'ko'
    ? { aspect: '측면', nginx: 'NGINX Ingress', gateway: 'Gateway API' }
    : { aspect: 'Aspect', nginx: 'NGINX Ingress', gateway: 'Gateway API' };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ border: '1.5px solid var(--ifm-color-emphasis-200)', borderRadius: 8, padding: '0.7rem 1rem', background: 'var(--ifm-background-surface-color)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ifm-font-color-base)', marginBottom: '0.5rem' }}>{item.aspect}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ background: '#ef5350', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{labels.nginx}</span>
                <span style={{ fontSize: '0.76rem', color: 'var(--ifm-color-emphasis-600)', lineHeight: 1.4 }}>{item.nginx}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ background: '#66bb6a', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>{labels.gateway}</span>
                <span style={{ fontSize: '0.76rem', color: 'var(--ifm-color-emphasis-600)', lineHeight: 1.4 }}>{item.gateway}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
