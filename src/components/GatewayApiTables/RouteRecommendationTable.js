import React from 'react';

const data = {
  ko: [
    { route: 'AWS Native', bestFor: 'AWS 올인 조직', advantages: '완전 관리형, 자동 스케일링, 제로 운영', color: '#ff9800' },
    { route: 'Cilium', bestFor: '고성능 + 관측성 중시', advantages: 'eBPF 최고 성능, Hubble 가시성, ENI 네이티브', color: '#2196f3' },
    { route: 'NGINX Fabric', bestFor: 'NGINX 경험 활용', advantages: '검증된 안정성, 익숙한 설정, 빠른 전환', color: '#4caf50' },
    { route: 'Envoy Gateway', bestFor: 'CNCF 표준 + 서비스 메시', advantages: 'L7 기능 풍부, Istio 통합, 확장성', color: '#f44336' },
    { route: 'kGateway', bestFor: 'AI/ML 통합 필요', advantages: 'AI 라우팅, 엔터프라이즈 지원, Solo.io 생태계', color: '#9c27b0' },
  ],
  en: [
    { route: 'AWS Native', bestFor: 'AWS all-in organizations', advantages: 'Fully managed, auto-scaling, zero ops', color: '#ff9800' },
    { route: 'Cilium', bestFor: 'High performance + observability focus', advantages: 'Best eBPF performance, Hubble visibility, ENI native', color: '#2196f3' },
    { route: 'NGINX Fabric', bestFor: 'Leveraging NGINX experience', advantages: 'Proven stability, familiar config, fast transition', color: '#4caf50' },
    { route: 'Envoy Gateway', bestFor: 'CNCF standard + service mesh', advantages: 'Rich L7 features, Istio integration, extensibility', color: '#f44336' },
    { route: 'kGateway', bestFor: 'AI/ML integration needs', advantages: 'AI routing, enterprise support, Solo.io ecosystem', color: '#9c27b0' },
  ],
};

export default function RouteRecommendationTable({ locale = 'ko' }) {
  const rows = data[locale];
  const title = locale === 'ko' ? '🎯 Gateway API 구현체 선택 가이드' : '🎯 Gateway API Implementation Selection Guide';
  const subtitle = locale === 'ko' ? '조직 요구사항에 맞는 최적 경로' : 'Optimal route for your organization needs';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map((row, idx) => {
          const bgColor = `${row.color}10`;
          const borderColor = `${row.color}40`;
          return (
            <div key={idx} style={{ border: `1.5px solid ${borderColor}`, borderLeft: `4px solid ${row.color}`, borderRadius: 8, padding: '0.8rem 1rem', background: bgColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ background: row.color, color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700 }}>
                  {row.route}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--ifm-color-emphasis-600)', fontStyle: 'italic' }}>→ {row.bestFor}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ifm-font-color-base)', paddingLeft: '0.5rem', borderLeft: `3px solid ${row.color}`, marginLeft: '0.2rem' }}>
                <strong style={{ color: row.color }}>✓</strong> {row.advantages}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
