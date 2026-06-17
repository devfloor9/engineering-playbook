import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

// 6개 Gateway API 구현체를 한눈에 비교하기 위한 요약 카드.
// 상세 매트릭스(SolutionOverviewMatrix / FeatureComparisonMatrix) 앞에 배치하여
// "큰 그림 → 상세" 순서로 가독성을 높인다.
const solutions = [
  {
    id: 'aws',
    name: 'AWS Native (LBC v3)',
    color: '#ff9800',
    tagline: { ko: '완전 관리형 · SLA 99.99%', en: 'Fully managed · SLA 99.99%' },
    dataPlane: 'ALB / NLB',
    tier: 'north-south',
    pick: { ko: 'AWS 올인 + 운영 최소화', en: 'AWS all-in + minimal ops' },
    strength: { ko: 'WAF/Shield/ACM 통합, 제로 운영', en: 'WAF/Shield/ACM integration, zero ops' },
    watch: { ko: 'AWS 종속, Rate Limiting에 WAF 비용', en: 'AWS lock-in, WAF cost for rate limiting' },
  },
  {
    id: 'cilium',
    name: 'Cilium',
    color: '#2196f3',
    tagline: { ko: 'eBPF 최고 성능 · Hubble 관측성', en: 'Top eBPF performance · Hubble' },
    dataPlane: 'Envoy + eBPF',
    tier: 'north-south',
    pick: { ko: '고성능 + 네트워크 정책 + 메시', en: 'High perf + netpol + mesh' },
    strength: { ko: '최저 지연, ENI 네이티브, GAMMA GA', en: 'Lowest latency, ENI native, GAMMA GA' },
    watch: { ko: '학습 곡선, Self-managed 노드', en: 'Learning curve, self-managed nodes' },
  },
  {
    id: 'nginx',
    name: 'NGINX Gateway Fabric',
    color: '#4caf50',
    tagline: { ko: 'NGINX 20년+ · F5 엔터프라이즈', en: 'NGINX 20+ yrs · F5 enterprise' },
    dataPlane: 'NGINX',
    tier: 'north-south',
    pick: { ko: 'NGINX 경험 활용 + 멀티클라우드', en: 'NGINX experience + multi-cloud' },
    strength: { ko: '검증된 안정성, 익숙한 설정', en: 'Proven stability, familiar config' },
    watch: { ko: 'GAMMA 미지원, L4 라우팅 제한', en: 'No GAMMA, limited L4 routing' },
  },
  {
    id: 'envoy',
    name: 'Envoy Gateway',
    color: '#f44336',
    tagline: { ko: 'CNCF 표준 · Istio 호환', en: 'CNCF standard · Istio compatible' },
    dataPlane: 'Envoy Proxy',
    tier: 'north-south',
    pick: { ko: 'CNCF 표준 + 서비스 메시', en: 'CNCF standard + service mesh' },
    strength: { ko: 'Policy Attachment, 고급 L7', en: 'Policy Attachment, advanced L7' },
    watch: { ko: '상대적 신규(2년), Envoy 복잡성', en: 'Relatively new (2 yrs), Envoy complexity' },
  },
  {
    id: 'kgateway',
    name: 'kGateway',
    color: '#9c27b0',
    tagline: { ko: 'AI/ML 라우팅 · 통합 게이트웨이', en: 'AI/ML routing · unified gateway' },
    dataPlane: 'Envoy Proxy',
    tier: 'both',
    pick: { ko: '클러스터 내 추론 라우팅 + 통합', en: 'In-cluster inference + unified' },
    strength: { ko: 'Inference Extension, MCP, API+메시+AI', en: 'Inference Extension, MCP, API+mesh+AI' },
    watch: { ko: 'CNCF Sandbox, AI 프로덕션 사례 제한', en: 'CNCF Sandbox, limited AI prod cases' },
  },
  {
    id: 'kong',
    name: 'Kong',
    color: '#00b9aa',
    tagline: { ko: '100+ 플러그인 · 24x7 지원', en: '100+ plugins · 24x7 support' },
    dataPlane: 'OpenResty (NGINX+Lua)',
    tier: 'north-south',
    pick: { ko: '엔터프라이즈 API 관리 + LLM API 프록시', en: 'Enterprise API mgmt + LLM API proxy' },
    strength: { ko: 'KongPlugin 생태계, Kong AI Gateway', en: 'KongPlugin ecosystem, Kong AI Gateway' },
    watch: { ko: '정책은 KongPlugin 경유, TLSRoute 미지원', en: 'Policies via KongPlugin, no TLSRoute' },
  },
];

const tierLabel = {
  'north-south': { ko: '북-남 (범용)', en: 'North-South (general)' },
  'both': { ko: '북-남 + 추론', en: 'North-South + Inference' },
};

export default function SolutionSelectorCards({ locale = 'ko' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const cardBg = isDark ? '#1e1e1e' : '#fff';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          {locale === 'ko' ? '6개 Gateway API 솔루션 — 한눈에 보기' : '6 Gateway API Solutions — At a Glance'}
        </div>
        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 2 }}>
          {locale === 'ko' ? '각 카드: 데이터플레인 · 적합 시나리오 · 강점 · 주의점. 상세는 아래 비교 매트릭스 참조' : 'Each card: data plane · best fit · strength · watch-out. See matrices below for detail'}
        </div>
      </div>

      <div style={{
        background: isDark ? '#181818' : '#f8fafc',
        border: `1px solid ${isDark ? '#333' : 'var(--ifm-color-emphasis-200)'}`,
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '0.75rem',
      }}>
        {solutions.map((sol) => (
          <div key={sol.id} style={{
            background: cardBg,
            border: `1px solid ${isDark ? '#333' : 'var(--ifm-color-emphasis-200)'}`,
            borderTop: `4px solid ${sol.color}`,
            borderRadius: 8,
            padding: '0.85rem 0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: sol.color }}>{sol.name}</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--ifm-color-emphasis-700)', fontStyle: 'italic' }}>{sol.tagline[locale]}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', margin: '0.1rem 0' }}>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: `${sol.color}22`, color: sol.color, fontWeight: 600 }}>
                {sol.dataPlane}
              </span>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 10, background: isDark ? '#2a2a2a' : 'var(--ifm-color-emphasis-200)', color: 'var(--ifm-color-emphasis-800)', fontWeight: 600 }}>
                {tierLabel[sol.tier][locale]}
              </span>
            </div>

            <div style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
              <div style={{ marginBottom: '0.2rem' }}>
                <strong style={{ color: '#1565c0' }}>{locale === 'ko' ? '🎯 적합' : '🎯 Best fit'}</strong> {sol.pick[locale]}
              </div>
              <div style={{ marginBottom: '0.2rem', color: '#2e7d32' }}>
                <strong>✓</strong> {sol.strength[locale]}
              </div>
              <div style={{ color: isDark ? '#ffab91' : '#bf360c' }}>
                <strong>⚠</strong> {sol.watch[locale]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
