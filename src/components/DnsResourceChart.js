import React from 'react';

const scenarios = ['A: VPC CNI', 'B: Cilium+kp', 'C: kp-less', 'D: ENI', 'E: ENI+Tuned'];
const colors = ['#64748b', '#8b5cf6', '#10b981', '#3b82f6', '#059669'];

const i18n = {
  en: {
    dnsTitle: 'DNS Resolution Performance',
    dnsSubtitle: 'dig · 100 queries · median',
    resourceTitle: 'CNI Resource Usage (per node, under load)',
    resourceSubtitle: 'Cilium agent · during iperf3/Fortio benchmark',
    p50: 'p50', p99: 'p99', cpu: 'CPU', memory: 'Memory', nm: 'N/M',
    dnsSummary: 'DNS resolution latency is 2–4 ms across all scenarios — CNI choice has negligible impact.',
    resourceSummary: 'Scenario C (kp-less) uses more memory because it combines VXLAN overlay eBPF maps (tunnel endpoints, encapsulation state) with kube-proxy replacement eBPF maps (Service endpoints). Scenarios D/E also replace kube-proxy, but ENI native routing eliminates overlay maps, resulting in lower memory.',
  },
  ko: {
    dnsTitle: 'DNS 해석 성능',
    dnsSubtitle: 'dig · 100회 쿼리 · 중앙값',
    resourceTitle: 'CNI 리소스 사용량 (노드당, 부하 시)',
    resourceSubtitle: 'Cilium agent · iperf3/Fortio 벤치마크 중 측정',
    p50: 'p50', p99: 'p99', cpu: 'CPU', memory: 'Memory', nm: '미측정',
    dnsSummary: 'DNS 해석 지연은 모든 시나리오에서 2–4 ms 범위로, CNI 구성에 따른 차이가 거의 없습니다.',
    resourceSummary: '시나리오 C(kp-less)의 메모리가 높은 이유는 VXLAN 오버레이 eBPF 맵(터널 엔드포인트, 캡슐화 상태)과 kube-proxy 대체 eBPF 맵(Service endpoint)을 동시에 유지하기 때문입니다. D/E도 kube-proxy를 대체하지만 ENI native 라우팅으로 오버레이 맵이 불필요하여 메모리가 낮습니다.',
  },
};

const dnsData = {
  p50: [2, 2, 2, 2, 2],
  p99: [4, 4, 2, 4, 3],
};

const resourceData = {
  cpu: [null, '4-6m', '4-6m', '5-6m', '4-5m'],
  memory: [null, '83Mi', '129Mi', '81Mi', '82Mi'],
};

function DnsPill({ value, best }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
      fontSize: '0.78rem', fontWeight: 700, minWidth: '36px', textAlign: 'center',
      background: best ? '#d1fae5' : '#f1f5f9',
      color: best ? '#065f46' : '#475569',
    }}>
      {value} ms
    </span>
  );
}

export default function DnsResourceChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;
  const minP99 = Math.min(...dnsData.p99);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1rem',
      margin: '0 0 1.5rem 0',
    }}>
      {/* DNS Section */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{
          background: '#f8fafc', padding: '0.8rem 1.2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
            🌐 {t.dnsTitle}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
            {t.dnsSubtitle}
          </span>
        </div>
        <div style={{ padding: '1rem 1.2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {scenarios.map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: '110px', background: '#fafbfc',
                border: '1px solid #f1f5f9', borderRadius: '8px',
                padding: '0.6rem 0.5rem', textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600, color: colors[i],
                  marginBottom: '0.4rem',
                }}>
                  {s}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{t.p50}:</span>
                  <DnsPill value={dnsData.p50[i]} best={false} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{t.p99}:</span>
                  <DnsPill value={dnsData.p99[i]} best={dnsData.p99[i] === minP99} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
            {t.dnsSummary}
          </div>
        </div>
      </div>

      {/* Resource Section */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{
          background: '#f8fafc', padding: '0.8rem 1.2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
            📊 {t.resourceTitle}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
            {t.resourceSubtitle}
          </span>
        </div>
        <div style={{ padding: '1rem 1.2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {scenarios.map((s, i) => (
              <div key={i} style={{
                flex: 1, minWidth: '110px', background: '#fafbfc',
                border: '1px solid #f1f5f9', borderRadius: '8px',
                padding: '0.6rem 0.5rem', textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600, color: colors[i],
                  marginBottom: '0.4rem',
                }}>
                  {s}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.15rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{t.cpu}: </span>
                  <span style={{ fontWeight: 600 }}>
                    {resourceData.cpu[i] || t.nm}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{t.memory}: </span>
                  <span style={{
                    fontWeight: 600,
                    color: resourceData.memory[i] === '129Mi' ? '#f59e0b' : '#475569',
                  }}>
                    {resourceData.memory[i] || t.nm}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5 }}>
            {t.resourceSummary}
          </div>
        </div>
      </div>
    </div>
  );
}
