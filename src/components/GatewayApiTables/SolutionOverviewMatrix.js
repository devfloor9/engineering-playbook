import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const solutions = [
  {
    id: 'aws',
    name: 'AWS Native (LBC v3)',
    color: '#ff9800',
    provider: 'AWS',
    dataPlane: { ko: 'ALB/NLB (관리형)', en: 'ALB/NLB (managed)' },
    license: { ko: 'AWS 서비스', en: 'AWS Service' },
    maturity: { ko: '높음', en: 'High' },
    gaDate: '2026-01',
    keyFeatures: {
      ko: ['L4/L7 지원', 'JWT 검증', 'AWS WAF/Shield/ACM 통합', '관리형 서비스 SLA 99.99%'],
      en: ['L4/L7 support', 'JWT verification', 'AWS WAF/Shield/ACM integration', 'Managed service SLA 99.99%']
    },
    limitations: {
      ko: ['mTLS 제한적', 'Rate Limiting에 WAF 비용 필요', 'AWS 종속'],
      en: ['Limited mTLS', 'WAF cost required for rate limiting', 'AWS lock-in']
    },
    bestFor: {
      ko: ['AWS 올인 환경', '운영팀 규모가 작은 조직', 'SLA 보장 필요', '규제 산업'],
      en: ['AWS-only environment', 'Small ops team', 'SLA required', 'Regulated industries']
    },
    notFor: {
      ko: ['멀티클라우드 전략', '비용 최적화가 최우선'],
      en: ['Multi-cloud', 'Cost optimization priority']
    }
  },
  {
    id: 'cilium',
    name: 'Cilium',
    color: '#2196f3',
    provider: 'Isovalent/Cisco',
    dataPlane: { ko: 'Envoy + eBPF', en: 'Envoy + eBPF' },
    license: 'Apache 2.0',
    maturity: { ko: '높음 (8년+)', en: 'High (8+ years)' },
    gaDate: '2024-05',
    keyFeatures: {
      ko: ['eBPF 고성능', 'ENI 모드 VPC 네이티브', 'GAMMA 지원', 'Hubble 관측성', 'CiliumNetworkPolicy'],
      en: ['eBPF high performance', 'ENI mode VPC native', 'GAMMA support', 'Hubble observability', 'CiliumNetworkPolicy']
    },
    limitations: {
      ko: ['학습 곡선 높음', 'Self-managed 노드 필요', 'SLA 보장 없음'],
      en: ['High learning curve', 'Self-managed nodes required', 'No SLA']
    },
    bestFor: {
      ko: ['고성능 최우선', '서비스 메시 통합', '네트워크 정책 강화', 'Hubble 관측성'],
      en: ['High performance priority', 'Service mesh integration', 'Network policy', 'Hubble observability']
    },
    notFor: {
      ko: ['경험 부족한 소규모 팀', 'EKS Auto Mode'],
      en: ['Small inexperienced team', 'EKS Auto Mode']
    }
  },
  {
    id: 'nginx',
    name: 'NGINX Gateway Fabric',
    color: '#4caf50',
    provider: 'F5/NGINX',
    dataPlane: 'NGINX',
    license: { ko: 'Apache 2.0 / 상용', en: 'Apache 2.0 / Commercial' },
    maturity: { ko: '높음 (NGINX 20년+)', en: 'High (NGINX 20+ years)' },
    gaDate: '2024-09',
    keyFeatures: {
      ko: ['20년+ 검증된 안정성', 'NginxProxy CRD', 'NGINX 지식 재활용', 'F5 엔터프라이즈 지원', '멀티클라우드'],
      en: ['20+ years proven stability', 'NginxProxy CRD', 'NGINX knowledge reuse', 'F5 enterprise support', 'Multi-cloud']
    },
    limitations: {
      ko: ['GAMMA 미지원', 'L4 라우팅 제한', '커뮤니티 상대적 소규모'],
      en: ['No GAMMA support', 'Limited L4 routing', 'Smaller community']
    },
    bestFor: {
      ko: ['NGINX 경험 보유', '멀티클라우드 환경', '엔터프라이즈 지원 필요', '검증된 안정성 우선'],
      en: ['NGINX experience', 'Multi-cloud', 'Enterprise support needed', 'Proven stability']
    },
    notFor: {
      ko: ['서비스 메시 계획', 'TCP/UDP 라우팅 필요'],
      en: ['Service mesh planning', 'TCP/UDP routing needed']
    }
  },
  {
    id: 'envoy',
    name: 'Envoy Gateway',
    color: '#f44336',
    provider: 'CNCF',
    dataPlane: 'Envoy Proxy',
    license: 'Apache 2.0',
    maturity: { ko: '중간 (2년)', en: 'Medium (2 years)' },
    gaDate: '2024-03',
    keyFeatures: {
      ko: ['CNCF 졸업', 'Policy Attachment 패턴', '고급 L7 (mTLS, ExtAuth, Rate Limiting, Circuit Breaking)', 'Istio 호환'],
      en: ['CNCF graduated', 'Policy Attachment pattern', 'Advanced L7 (mTLS, ExtAuth, Rate Limiting, Circuit Breaking)', 'Istio compatible']
    },
    limitations: {
      ko: ['상대적 신규 프로젝트', 'Envoy 복잡성', '관리형 서비스 없음'],
      en: ['Relatively new project', 'Complex Envoy', 'No managed service']
    },
    bestFor: {
      ko: ['CNCF 표준 준수', 'Istio/서비스 메시', '복잡한 L7 정책'],
      en: ['CNCF standards', 'Istio/service mesh', 'Complex L7 policies']
    },
    notFor: {
      ko: ['빠른 프로덕션 검증', '소규모 팀'],
      en: ['Fast production validation', 'Small teams']
    }
  },
  {
    id: 'kgateway',
    name: 'kGateway',
    color: '#9c27b0',
    provider: 'CNCF (Solo.io)',
    dataPlane: 'Envoy Proxy',
    license: 'Apache 2.0',
    maturity: { ko: '높음 (8년+)', en: 'High (8+ years)' },
    gaDate: '2018-03',
    keyFeatures: {
      ko: ['통합 게이트웨이 (4-in-1)', 'AI/ML 워크로드 라우팅', 'JWT/OAuth/OIDC 네이티브', 'Gateway API v1.4.0 완전 지원'],
      en: ['Unified gateway (4-in-1)', 'AI/ML workload routing', 'JWT/OAuth/OIDC native', 'Gateway API v1.4.0 full support']
    },
    limitations: {
      ko: ['CNCF Sandbox 단계', 'AI 프로덕션 사례 제한적', '작은 프로젝트엔 오버엔지니어링'],
      en: ['CNCF Sandbox stage', 'Limited AI production cases', 'Overengineering for small projects']
    },
    bestFor: {
      ko: ['AI/ML 라우팅', '통합 플랫폼', '미래 지향적 아키텍처'],
      en: ['AI/ML routing', 'Unified platform', 'Future architecture']
    },
    notFor: {
      ko: ['단순 인그레스만 필요', '보수적 환경'],
      en: ['Simple ingress only', 'Conservative environments']
    }
  }
];

const categories = [
  {
    id: 'overview',
    title: { ko: '개요', en: 'Overview' },
    color: '#1565c0'
  },
  {
    id: 'features',
    title: { ko: '핵심 특징', en: 'Key Features' },
    color: '#2e7d32'
  },
  {
    id: 'limitations',
    title: { ko: '주요 제약사항', en: 'Key Limitations' },
    color: '#e65100'
  },
  {
    id: 'bestFor',
    title: { ko: '적합한 사용 사례', en: 'Best Use Cases' },
    color: '#1b5e20'
  },
  {
    id: 'notFor',
    title: { ko: '부적합 사례', en: 'Not Recommended' },
    color: '#b71c1c'
  }
];

export default function SolutionOverviewMatrix({ locale = 'ko' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
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

  const bgColor = isDark ? '#1e1e1e' : '#fff';
  const borderColor = isDark ? '#333' : '#e2e8f0';
  const headerBg = isDark ? '#2a2a2a' : '#f8fafc';
  const cellBg = isDark ? '#252525' : '#fafafa';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '100%', margin: '0 0 1.5rem 0', overflowX: 'auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
          {locale === 'ko' ? 'Gateway API 솔루션 개요 비교' : 'Gateway API Solution Overview Comparison'}
        </div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>
          {locale === 'ko' ? '5개 솔루션 · 5개 비교 카테고리' : '5 solutions · 5 comparison categories'}
        </div>
      </div>

      <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderTop: 'none', padding: '0.75rem' }}>
        <button onClick={toggleAll} style={{ marginBottom: '0.75rem', padding: '0.4rem 0.8rem', background: '#5e35b1', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
          {allExpanded ? (locale === 'ko' ? '모두 접기' : 'Collapse All') : (locale === 'ko' ? '모두 펼치기' : 'Expand All')}
        </button>

        <div style={{ minWidth: 900 }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '0.5rem', border: `1px solid ${borderColor}`, borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => toggleCategory(cat.id)} style={{ background: cat.color, color: '#fff', padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                <span>{cat.title[locale]}</span>
                <span style={{ fontSize: '1rem' }}>{expanded[cat.id] ? '▼' : '▶'}</span>
              </div>

              {expanded[cat.id] && (
                <div style={{ overflowX: 'auto' }}>
                  {cat.id === 'overview' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                      <thead>
                        <tr style={{ background: headerBg, borderBottom: `2px solid ${borderColor}` }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600, minWidth: 120, position: 'sticky', left: 0, background: headerBg, zIndex: 1 }}>{locale === 'ko' ? '항목' : 'Item'}</th>
                          {solutions.map((sol, i) => (
                            <th key={i} style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', minWidth: 140, borderLeft: `2px solid ${sol.color}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sol.color }}></div>
                                {sol.name}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, background: cellBg, position: 'sticky', left: 0, zIndex: 1 }}>{locale === 'ko' ? '제공사' : 'Provider'}</td>
                          {solutions.map((sol, i) => (
                            <td key={i} style={{ padding: '0.5rem', borderLeft: `1px solid ${borderColor}` }}>{sol.provider}</td>
                          ))}
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, background: cellBg, position: 'sticky', left: 0, zIndex: 1 }}>{locale === 'ko' ? '데이터플레인' : 'Data Plane'}</td>
                          {solutions.map((sol, i) => (
                            <td key={i} style={{ padding: '0.5rem', borderLeft: `1px solid ${borderColor}` }}>{typeof sol.dataPlane === 'object' ? sol.dataPlane[locale] : sol.dataPlane}</td>
                          ))}
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, background: cellBg, position: 'sticky', left: 0, zIndex: 1 }}>{locale === 'ko' ? '라이선스' : 'License'}</td>
                          {solutions.map((sol, i) => (
                            <td key={i} style={{ padding: '0.5rem', borderLeft: `1px solid ${borderColor}` }}>{typeof sol.license === 'object' ? sol.license[locale] : sol.license}</td>
                          ))}
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, background: cellBg, position: 'sticky', left: 0, zIndex: 1 }}>{locale === 'ko' ? '성숙도' : 'Maturity'}</td>
                          {solutions.map((sol, i) => (
                            <td key={i} style={{ padding: '0.5rem', borderLeft: `1px solid ${borderColor}` }}>{typeof sol.maturity === 'object' ? sol.maturity[locale] : sol.maturity}</td>
                          ))}
                        </tr>
                        <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600, background: cellBg, position: 'sticky', left: 0, zIndex: 1 }}>GA Date</td>
                          {solutions.map((sol, i) => (
                            <td key={i} style={{ padding: '0.5rem', borderLeft: `1px solid ${borderColor}` }}>{sol.gaDate}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {cat.id === 'features' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', padding: '0.75rem' }}>
                      {solutions.map((sol, i) => (
                        <div key={i} style={{ border: `2px solid ${sol.color}`, borderRadius: 8, padding: '0.75rem', background: isDark ? '#252525' : '#fafafa' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', color: sol.color }}>{sol.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {sol.keyFeatures[locale].map((feat, idx) => (
                              <div key={idx} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: sol.color, color: '#fff', borderRadius: 4 }}>{feat}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cat.id === 'limitations' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', padding: '0.75rem' }}>
                      {solutions.map((sol, i) => (
                        <div key={i} style={{ border: `2px solid ${sol.color}`, borderRadius: 8, padding: '0.75rem', background: isDark ? '#252525' : '#fff3e0' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', color: sol.color }}>{sol.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {sol.limitations[locale].map((lim, idx) => (
                              <div key={idx} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: isDark ? '#3e2723' : '#ffebee', border: '1px solid #e65100', borderRadius: 4, color: isDark ? '#ffccbc' : '#b71c1c' }}>⚠️ {lim}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cat.id === 'bestFor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', padding: '0.75rem' }}>
                      {solutions.map((sol, i) => (
                        <div key={i} style={{ border: `2px solid ${sol.color}`, borderRadius: 8, padding: '0.75rem', background: isDark ? '#252525' : '#e8f5e9' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', color: sol.color }}>{sol.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {sol.bestFor[locale].map((use, idx) => (
                              <div key={idx} style={{ fontSize: '0.7rem', display: 'flex', gap: '0.3rem' }}>
                                <span style={{ color: '#2e7d32' }}>✅</span>
                                <span>{use}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cat.id === 'notFor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', padding: '0.75rem' }}>
                      {solutions.map((sol, i) => (
                        <div key={i} style={{ border: `2px solid ${sol.color}`, borderRadius: 8, padding: '0.75rem', background: isDark ? '#252525' : '#ffebee' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem', color: sol.color }}>{sol.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {sol.notFor[locale].map((use, idx) => (
                              <div key={idx} style={{ fontSize: '0.7rem', display: 'flex', gap: '0.3rem' }}>
                                <span style={{ color: '#c62828' }}>❌</span>
                                <span>{use}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!expanded[cat.id] && (
                <div style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', background: cellBg }}>
                  {locale === 'ko' ? '클릭하여 펼치기' : 'Click to expand'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
