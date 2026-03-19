import React from 'react';

const solutionColors = {
  'AWS Native': '#ff9800',
  'Cilium': '#2196f3',
  'NGINX Fabric': '#4caf50',
  'Envoy GW': '#f44336',
  'kGateway': '#9c27b0',
  'NGINX/Envoy': '#757575',
};

const data = {
  ko: [
    { scenario: 'AWS 올인 + 운영 최소화', first: 'AWS Native', second: 'Cilium', reason: '관리형, SLA 보장, 운영팀 규모 작음' },
    { scenario: '고성능 + 관측성', first: 'Cilium', second: 'Envoy GW', reason: 'eBPF 최고 성능, Hubble Service Map' },
    { scenario: 'NGINX 경험 + 멀티클라우드', first: 'NGINX Fabric', second: 'Envoy GW', reason: '기존 NGINX 지식 활용, 클라우드 중립' },
    { scenario: 'CNCF + 서비스 메시', first: 'Envoy GW', second: 'kGateway', reason: 'Istio 호환, CNCF 표준 준수' },
    { scenario: 'AI/ML + 통합 게이트웨이', first: 'kGateway', second: 'Cilium', reason: 'AI 라우팅, MCP Gateway, 미래 지향' },
    { scenario: '금융/의료 보안', first: 'AWS Native', second: 'Cilium', reason: 'WAF, Shield, 감사 추적, 컴플라이언스' },
    { scenario: '스타트업 + 비용 최적화', first: 'Cilium', second: 'NGINX/Envoy', reason: '고정 비용, 벤더 종속 회피' },
    { scenario: '하이브리드/멀티클러스터', first: 'Cilium', second: 'kGateway', reason: 'BGP Control Plane, 멀티사이트 메시' },
    { scenario: '빠른 PoC (검증)', first: 'AWS Native', second: 'NGINX Fabric', reason: '빠른 설정, 관리형, 검증된 안정성' },
    { scenario: '장기 전략적 투자', first: 'Cilium', second: 'Envoy GW', reason: 'eBPF 미래 기술, CNCF 생태계' },
  ],
  en: [
    { scenario: 'AWS All-in + Minimal Ops', first: 'AWS Native', second: 'Cilium', reason: 'Managed, SLA guaranteed, small ops team' },
    { scenario: 'High Performance + Observability', first: 'Cilium', second: 'Envoy GW', reason: 'Best eBPF performance, Hubble Service Map' },
    { scenario: 'NGINX Experience + Multi-cloud', first: 'NGINX Fabric', second: 'Envoy GW', reason: 'Leverage existing NGINX knowledge, cloud neutral' },
    { scenario: 'CNCF + Service Mesh', first: 'Envoy GW', second: 'kGateway', reason: 'Istio compatible, CNCF standard compliance' },
    { scenario: 'AI/ML + Unified Gateway', first: 'kGateway', second: 'Cilium', reason: 'AI routing, MCP Gateway, future-oriented' },
    { scenario: 'Finance/Healthcare Security', first: 'AWS Native', second: 'Cilium', reason: 'WAF, Shield, audit trails, compliance' },
    { scenario: 'Startup + Cost Optimization', first: 'Cilium', second: 'NGINX/Envoy', reason: 'Fixed costs, avoid vendor lock-in' },
    { scenario: 'Hybrid/Multi-cluster', first: 'Cilium', second: 'kGateway', reason: 'BGP Control Plane, multi-site mesh' },
    { scenario: 'Quick PoC (Validation)', first: 'AWS Native', second: 'NGINX Fabric', reason: 'Fast setup, managed, proven stability' },
    { scenario: 'Long-term Strategic Investment', first: 'Cilium', second: 'Envoy GW', reason: 'eBPF future tech, CNCF ecosystem' },
  ],
};

export default function ScenarioRecommendationTable({ locale = 'ko' }) {
  const items = data[locale];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #283593 0%, #3949ab 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🎯 {locale === 'ko' ? '시나리오별 추천 솔루션' : 'Scenario-based Solution Recommendations'}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{locale === 'ko' ? '사용 사례에 따른 최적 Gateway API 구현체 선택 가이드' : 'Optimal Gateway API implementation selection guide by use case'}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ border: '1.5px solid var(--ifm-color-emphasis-200)', borderRadius: 8, padding: '0.8rem 1rem', background: 'var(--ifm-background-surface-color)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a237e', marginBottom: '0.4rem' }}>{item.scenario}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#757575' }}>{locale === 'ko' ? '1순위' : '1st'}</span>
              <span style={{ background: solutionColors[item.first], color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}>{item.first}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#757575', marginLeft: '0.5rem' }}>{locale === 'ko' ? '2순위' : '2nd'}</span>
              <span style={{ background: solutionColors[item.second], color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: '0.74rem', fontWeight: 700 }}>{item.second}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ifm-color-emphasis-600)', fontStyle: 'italic' }}>{item.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
