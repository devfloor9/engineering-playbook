import React from 'react';

const categories = [
  {
    id: 'basic',
    title: { ko: '기본 정보', en: 'Basic Info' },
    color: '#1565c0',
    rows: [
      { label: { ko: '제공사', en: 'Provider' }, values: ['AWS', 'Isovalent/Cisco', 'F5/NGINX', 'CNCF Envoy', 'CNCF (Solo.io)'] },
      { label: { ko: '데이터플레인', en: 'Data Plane' }, values: ['AWS ALB/NLB (관리형)', 'Envoy + eBPF', 'NGINX', 'Envoy Proxy', 'Envoy Proxy'] },
      { label: { ko: '라이선스', en: 'License' }, values: ['AWS 서비스', 'Apache 2.0', 'Apache 2.0 / 상용', 'Apache 2.0', 'Apache 2.0'] },
      { label: { ko: 'CNCF 상태', en: 'CNCF Status' }, values: ['-', 'CNCF 졸업 (eBPF)', '-', 'CNCF 졸업 (Envoy)', 'CNCF Sandbox'] },
      { label: { ko: '성숙도', en: 'Maturity' }, values: ['✅ 높음 (AWS 검증)', '✅ 높음 (8년+)', '✅ 높음 (NGINX 20년+)', '⚠️ 중간 (2년)', '✅ 높음 (8년+)'] }
    ]
  },
  {
    id: 'gateway',
    title: { ko: 'Gateway API', en: 'Gateway API' },
    color: '#2e7d32',
    rows: [
      { label: { ko: '지원 버전', en: 'Supported Version' }, values: ['v1.3', 'v1.3', 'v1.3+', 'v1.3', 'v1.4'] },
      { label: { ko: 'HTTPRoute', en: 'HTTPRoute' }, values: ['✅', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'GRPCRoute', en: 'GRPCRoute' }, values: ['✅', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'TLSRoute', en: 'TLSRoute' }, values: ['✅ (NLB)', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'TCPRoute', en: 'TCPRoute' }, values: ['✅ (NLB)', '⚠️ Experimental', '❌', '✅', '✅'] },
      { label: { ko: 'UDPRoute', en: 'UDPRoute' }, values: ['✅ (NLB)', '⚠️ Experimental', '❌', '✅', '✅'] }
    ]
  },
  {
    id: 'core',
    title: { ko: '핵심 기능', en: 'Core Features' },
    color: '#e65100',
    rows: [
      { label: { ko: 'TLS Termination', en: 'TLS Termination' }, values: ['✅ ACM 통합', '✅ Secret', '✅ Secret', '✅ Secret', '✅ Secret'] },
      { label: { ko: 'mTLS', en: 'mTLS' }, values: ['⚠️ 제한적', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'Rate Limiting', en: 'Rate Limiting' }, values: ['❌ WAF 필요', '✅ L7 Policy', '✅ NginxProxy', '✅ BackendTrafficPolicy', '✅ RouteOption'] },
      { label: { ko: 'Header 조작', en: 'Header Manipulation' }, values: ['✅ LBC v3', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'URL Rewrite', en: 'URL Rewrite' }, values: ['✅', '✅', '✅', '✅', '✅'] },
      { label: { ko: '인증/인가', en: 'Auth' }, values: ['Lambda/Cognito/JWT', 'L7 Policy', 'OIDC Policy', 'ExtAuth/OIDC', 'JWT/OAuth/OIDC'] },
      { label: { ko: 'Canary 배포', en: 'Canary Deploy' }, values: ['✅ Weight', '✅ Weight', '✅ Weight', '✅ Weight', '✅ Weight'] },
      { label: { ko: '세션 어피니티', en: 'Session Affinity' }, values: ['✅ TG Stickiness', '⚠️ 수동', '✅ Upstream Config', '✅ Session Persistence', '✅ RouteOption'] }
    ]
  },
  {
    id: 'security',
    title: { ko: '보안', en: 'Security' },
    color: '#b71c1c',
    rows: [
      { label: { ko: 'WAF 통합', en: 'WAF Integration' }, values: ['✅ AWS WAF', '❌', '⚠️ ModSecurity', '⚠️ 별도 구성', '⚠️ 별도 구성'] },
      { label: { ko: 'DDoS 보호', en: 'DDoS Protection' }, values: ['✅ AWS Shield', '⚠️ 수동', '⚠️ 수동', '⚠️ 수동', '⚠️ 수동'] },
      { label: { ko: 'IP 제어', en: 'IP Control' }, values: ['SG + WAF', 'CiliumNetworkPolicy', 'NginxProxy', 'SecurityPolicy', 'RouteOption'] },
      { label: { ko: '클라이언트 인증서', en: 'Client Cert' }, values: ['⚠️ 제한적', '✅', '✅', '✅', '✅'] }
    ]
  },
  {
    id: 'performance',
    title: { ko: '성능', en: 'Performance' },
    color: '#2e7d32',
    rows: [
      { label: { ko: '처리량', en: 'Throughput' }, values: ['AWS 관리형 (고성능)', '✅✅✅ 최고 (eBPF)', '✅✅ 높음', '✅✅ 높음', '✅✅ 높음'] },
      { label: { ko: '지연시간', en: 'Latency' }, values: ['낮음', '✅ 가장 낮음', '낮음', '낮음', '낮음'] },
      { label: { ko: '리소스 사용', en: 'Resource Usage' }, values: ['- (관리형)', '✅ 가장 낮음', '중간', '중간', '중간'] }
    ]
  },
  {
    id: 'operations',
    title: { ko: '운영', en: 'Operations' },
    color: '#4e342e',
    rows: [
      { label: { ko: '스케일링', en: 'Scaling' }, values: ['AWS Auto Scaling', 'DaemonSet', 'HPA/수동', 'HPA/수동', 'HPA/수동'] },
      { label: { ko: '고가용성', en: 'HA' }, values: ['AWS 내장 HA', 'DaemonSet', 'Pod + PDB', 'Pod + PDB', 'Pod + PDB'] },
      { label: { ko: '모니터링', en: 'Monitoring' }, values: ['CloudWatch', 'Hubble + Prometheus', 'Prometheus', 'Prometheus', 'Prometheus'] },
      { label: { ko: '운영 부담', en: 'Ops Overhead' }, values: ['✅ 낮음', '중간', '중간', '중간', '중간'] },
      { label: { ko: 'SLA 보장', en: 'SLA' }, values: ['✅ 99.99%', '❌', '⚠️ F5 지원 시', '❌', '⚠️ Solo 지원 시'] }
    ]
  },
  {
    id: 'mesh',
    title: { ko: '메시 통합', en: 'Mesh Integration' },
    color: '#4a148c',
    rows: [
      { label: { ko: 'GAMMA', en: 'GAMMA' }, values: ['❌', '✅ GA', '❌', '⚠️ 제한적', '✅ GA'] },
      { label: { ko: 'Service Mesh', en: 'Service Mesh' }, values: ['❌', '✅ (네이티브)', '❌', 'Istio 호환', '✅ (네이티브)'] },
      { label: { ko: 'East-West', en: 'East-West' }, values: ['❌', '✅ eBPF', '❌', '⚠️', '✅'] },
      { label: { ko: '사이드카 불필요', en: 'No Sidecar' }, values: ['-', '✅', '-', '❌', '⚠️'] }
    ]
  },
  {
    id: 'advanced',
    title: { ko: '고급 기능', en: 'Advanced Features' },
    color: '#0d47a1',
    rows: [
      { label: { ko: 'Circuit Breaking', en: 'Circuit Breaking' }, values: ['❌', '✅', '⚠️ 제한적', '✅', '✅'] },
      { label: { ko: 'Fault Injection', en: 'Fault Injection' }, values: ['❌', '✅', '❌', '✅', '✅'] },
      { label: { ko: 'Retry 정책', en: 'Retry Policy' }, values: ['⚠️ 기본', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'Timeout 정책', en: 'Timeout Policy' }, values: ['✅', '✅', '✅', '✅', '✅'] },
      { label: { ko: 'GraphQL Gateway', en: 'GraphQL Gateway' }, values: ['❌', '❌', '❌', '❌', '✅'] },
      { label: { ko: 'WebAssembly', en: 'WebAssembly' }, values: ['❌', '❌', '❌', '⚠️ 실험적', '✅'] }
    ]
  },
  {
    id: 'aiml',
    title: { ko: 'AI/ML', en: 'AI/ML' },
    color: '#880e4f',
    rows: [
      { label: { ko: '추론 라우팅', en: 'Inference Routing' }, values: ['❌', '❌', '❌', '❌', '✅'] },
      { label: { ko: 'MCP Gateway', en: 'MCP Gateway' }, values: ['❌', '❌', '❌', '❌', '✅'] },
      { label: { ko: '모델 A/B 테스트', en: 'Model A/B Testing' }, values: ['⚠️ Weight만', '⚠️ Weight만', '⚠️ Weight만', '⚠️ Weight만', '✅ 네이티브'] }
    ]
  },
  {
    id: 'observability',
    title: { ko: '관측성', en: 'Observability' },
    color: '#006064',
    rows: [
      { label: { ko: '메트릭', en: 'Metrics' }, values: ['CloudWatch', 'Hubble + Prometheus', 'Prometheus', 'Prometheus', 'Prometheus'] },
      { label: { ko: '로그', en: 'Logs' }, values: ['CloudWatch Logs', 'Loki/ELK', 'ELK', 'ELK', 'ELK'] },
      { label: { ko: '추적', en: 'Tracing' }, values: ['X-Ray', 'Jaeger/Zipkin', 'Jaeger', 'Jaeger', 'Jaeger'] },
      { label: { ko: 'Service Map', en: 'Service Map' }, values: ['❌', '✅ Hubble', '❌', '⚠️ 별도', '⚠️ 별도'] }
    ]
  },
  {
    id: 'cost',
    title: { ko: '비용', en: 'Cost' },
    color: '#e65100',
    rows: [
      { label: { ko: '기본 비용', en: 'Base Cost' }, values: ['ALB 시간당 + LCU', '컴퓨팅 리소스', '컴퓨팅 리소스', '컴퓨팅 리소스', '컴퓨팅 리소스'] },
      { label: { ko: '월 예상', en: 'Monthly Est.' }, values: ['$50-200', '$30-100', '$50-150', '$50-150', '$50-150'] },
      { label: { ko: '벤더 종속', en: 'Vendor Lock-in' }, values: ['높음 (AWS)', '낮음', '낮음', '없음', '낮음'] },
      { label: { ko: '멀티클라우드', en: 'Multi-cloud' }, values: ['❌', '✅', '✅', '✅', '✅'] },
      { label: { ko: '온프레미스', en: 'On-premises' }, values: ['❌', '✅', '✅', '✅', '✅'] }
    ]
  },
  {
    id: 'community',
    title: { ko: '커뮤니티', en: 'Community' },
    color: '#37474f',
    rows: [
      { label: { ko: 'GitHub Stars', en: 'GitHub Stars' }, values: ['-', '19k+ (Cilium)', '2k+', '5k+', '4k+ (Gloo)'] },
      { label: { ko: '활발도', en: 'Activity' }, values: ['AWS 공식', '✅ 매우 활발', '중간', '✅ 활발', '✅ 활발'] },
      { label: { ko: '문서 품질', en: 'Doc Quality' }, values: ['✅ 우수', '✅ 우수', '중간', '✅ 우수', '✅ 우수'] },
      { label: { ko: '프로덕션 사례', en: 'Production Cases' }, values: ['✅ 많음', '✅ 많음', '중간', '중간', '✅ 많음'] }
    ]
  }
];

const solutions = ['AWS Native (LBC v3)', 'Cilium', 'NGINX Fabric', 'Envoy Gateway', 'kGateway'];

const getCellBg = (value) => {
  if (value.includes('✅✅✅') || value.includes('매우 활발')) return '#e8f5e9';
  if (value.startsWith('✅')) return '#e8f5e9';
  if (value.startsWith('⚠️')) return '#fff3e0';
  if (value.startsWith('❌')) return '#ffebee';
  return 'transparent';
};

export default function FeatureComparisonMatrix({ locale = 'ko' }) {
  const [expanded, setExpanded] = React.useState({});
  const [allExpanded, setAllExpanded] = React.useState(false);

  const toggleCategory = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = () => {
    const newState = !allExpanded;
    setAllExpanded(newState);
    const newExpanded = {};
    categories.forEach(cat => { newExpanded[cat.id] = newState; });
    setExpanded(newExpanded);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '100%', margin: '0 0 1.5rem 0', overflowX: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          {locale === 'ko' ? 'Gateway API 솔루션 종합 비교' : 'Gateway API Solution Comprehensive Comparison'}
        </div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>
          {locale === 'ko' ? '72개 비교 항목 · 10개 카테고리 · 5개 솔루션' : '72 comparison items · 10 categories · 5 solutions'}
        </div>
      </div>

      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', padding: '0.75rem' }}>
        <button onClick={toggleAll} style={{ marginBottom: '0.75rem', padding: '0.4rem 0.8rem', background: '#4a148c', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
          {allExpanded ? (locale === 'ko' ? '모두 접기' : 'Collapse All') : (locale === 'ko' ? '모두 펼치기' : 'Expand All')}
        </button>

        <div style={{ minWidth: 900 }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '0.5rem', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => toggleCategory(cat.id)} style={{ background: cat.color, color: '#fff', padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                <span>{cat.title[locale]} ({cat.rows.length}개)</span>
                <span style={{ fontSize: '1rem' }}>{expanded[cat.id] ? '▼' : '▶'}</span>
              </div>

              {expanded[cat.id] && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--ifm-background-surface-color)', borderBottom: '2px solid var(--ifm-color-emphasis-200)' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600, minWidth: 150, position: 'sticky', left: 0, background: 'var(--ifm-background-surface-color)', zIndex: 1 }}>{locale === 'ko' ? '비교 항목' : 'Feature'}</th>
                        {solutions.map((sol, i) => (
                          <th key={i} style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', minWidth: 140 }}>{sol}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cat.rows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, background: 'var(--ifm-background-surface-color)', position: 'sticky', left: 0, zIndex: 1 }}>{row.label[locale]}</td>
                          {row.values.map((val, i) => (
                            <td key={i} style={{ padding: '0.5rem', background: getCellBg(val), whiteSpace: 'nowrap' }}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!expanded[cat.id] && (
                <div style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', fontStyle: 'italic', background: 'var(--ifm-background-surface-color)' }}>
                  {locale === 'ko' ? '클릭하여 펼치기' : 'Click to expand'} · {cat.rows.length}개 항목
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
