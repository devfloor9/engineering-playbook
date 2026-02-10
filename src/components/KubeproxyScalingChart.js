import React from 'react';

const i18n = {
  en: {
    title: 'kube-proxy (iptables) Service Scaling',
    subtitle: '4 → 104 → 1,000 Services — iptables rule growth vs eBPF O(1)',
    svcLabels: ['4 Svc', '104 Svc', '1,000 Svc'],
    sections: {
      iptables: 'iptables Rule Growth',
      keepalive: 'keepalive HTTP Performance',
      connclose: 'Connection:close Overhead',
      sync: 'kube-proxy Sync',
      cilium: 'Cilium eBPF (comparison)',
    },
    insight: {
      title: 'Key Insight',
      text: 'At 1,000 services, iptables NAT rules grow 101× (99→10,059) while per-connection setup adds +26µs (+16%). keepalive connections are unaffected due to conntrack caching. Cilium eBPF maintains O(1) hash map lookups regardless of service count.',
    },
    threshold: {
      title: '⚠️ Scaling Threshold',
      text: 'At 5,000+ services, kube-proxy sync exceeds 500ms and chain traversal adds hundreds of µs per connection.',
    },
    note: 'Lower is better (except Max QPS)',
  },
  ko: {
    title: 'kube-proxy (iptables) 서비스 스케일링',
    subtitle: '4 → 104 → 1,000개 서비스 — iptables 규칙 증가 vs eBPF O(1)',
    svcLabels: ['4개', '104개', '1,000개'],
    sections: {
      iptables: 'iptables 규칙 증가',
      keepalive: 'keepalive HTTP 성능',
      connclose: 'Connection:close 오버헤드',
      sync: 'kube-proxy Sync',
      cilium: 'Cilium eBPF (비교)',
    },
    insight: {
      title: '핵심 인사이트',
      text: '1,000개 서비스에서 iptables NAT 규칙이 101배 증가(99→10,059)하며, 연결당 설정 시간이 +26µs(+16%) 추가됩니다. keepalive 연결은 conntrack 캐싱으로 영향 없음. Cilium eBPF는 서비스 수와 무관하게 O(1) 해시 맵 조회를 유지합니다.',
    },
    threshold: {
      title: '⚠️ 스케일링 임계점',
      text: '5,000개 이상 서비스에서 kube-proxy sync가 500ms를 초과하고, 체인 순회가 연결당 수백 µs를 추가합니다.',
    },
    note: '낮을수록 좋음 (Max QPS 제외)',
  },
};

const metrics = {
  iptables: [
    { label: 'NAT Rules', v: ['99', '699', '10,059'], pct: [1, 7, 100], diff: '+101×', diffColor: '#dc2626', highlight: 2 },
    { label: 'kube-proxy Sync', v: ['~130ms', '~160ms', '~170ms'], pct: [76, 94, 100], diff: '+31%', diffColor: '#dc2626' },
  ],
  keepalive: [
    { label: 'HTTP p99 @QPS=1000', v: ['5.86ms', '5.99ms', '2.96ms'], pct: [98, 100, 49], diff: '~noise', diffColor: '#059669' },
    { label: 'Max QPS', v: ['4,197', '4,231', '4,178'], pct: [99, 100, 99], diff: '~same', diffColor: '#059669', higher: true },
  ],
  connclose: [
    { label: 'Conn Setup Avg', v: ['164 µs', '—', '190 µs'], pct: [86, 0, 100], diff: '+16% (+26µs)', diffColor: '#dc2626' },
    { label: 'HTTP p99', v: ['8.11ms', '—', '8.53ms'], pct: [95, 0, 100], diff: '+5%', diffColor: '#f59e0b' },
    { label: 'HTTP Total Avg', v: ['4.399ms', '—', '4.621ms'], pct: [95, 0, 100], diff: '+5%', diffColor: '#f59e0b' },
  ],
  cilium: [
    { label: 'HTTP p99 @QPS=1000', v: ['3.94ms', '3.64ms', '—'], pct: [100, 92, 0], diff: '-8% (noise)', diffColor: '#059669' },
    { label: 'eBPF Map Lookup', v: ['O(1)', 'O(1)', 'O(1)'], pct: [50, 50, 50], diff: 'constant', diffColor: '#059669', isConstant: true },
  ],
};

const barColors = ['#cbd5e1', '#64748b', '#1e293b'];
const ciliumColors = ['#86efac', '#22c55e', '#15803d'];

function TripleBar({ metric, colors, svcLabels }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '0.3rem',
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1f2937' }}>{metric.label}</span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 600, color: metric.diffColor,
          padding: '1px 8px', borderRadius: '10px',
          background: metric.diffColor === '#dc2626' ? '#fef2f2' :
                     metric.diffColor === '#f59e0b' ? '#fffbeb' : '#f0fdf4',
        }}>
          {metric.diff}
        </span>
      </div>
      {metric.v.map((val, i) => {
        if (val === '—') return null;
        const isHighlighted = metric.highlight === i;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: i < 2 ? '0.18rem' : 0,
          }}>
            <div style={{
              width: '52px', textAlign: 'right', fontSize: '0.68rem',
              color: '#6b7280', flexShrink: 0, fontWeight: i === 2 ? 600 : 400,
            }}>
              {svcLabels[i]}
            </div>
            <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '5px', height: '22px' }}>
              {metric.isConstant ? (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '5px',
                  background: `repeating-linear-gradient(90deg, ${colors[i]}40 0px, ${colors[i]}40 8px, transparent 8px, transparent 16px)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colors[i] }}>{val}</span>
                </div>
              ) : (
                <div style={{
                  width: `${Math.max(metric.pct[i], 8)}%`,
                  background: isHighlighted
                    ? 'linear-gradient(90deg, #fca5a5, #ef4444)'
                    : colors[i],
                  height: '100%', borderRadius: '5px',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: '8px', minWidth: '40px',
                  boxShadow: isHighlighted ? '0 0 8px #ef444440' : 'none',
                }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: i === 0 ? '#1e293b' : '#fff',
                  }}>{val}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, metrics: sectionMetrics, colors, svcLabels, borderColor }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${borderColor || '#e2e8f0'}`,
      borderRadius: '10px', padding: '1rem 1.3rem', marginBottom: '0.6rem',
    }}>
      <h4 style={{
        margin: '0 0 0.7rem 0', fontSize: '0.85rem',
        color: borderColor === '#d1fae5' ? '#065f46' : '#374151',
      }}>
        {title}
      </h4>
      {sectionMetrics.map((m, i) => (
        <TripleBar key={i} metric={m} colors={colors} svcLabels={svcLabels} />
      ))}
    </div>
  );
}

export default function KubeproxyScalingChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px', margin: '0 0 1.5rem 0',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        borderRadius: '12px 12px 0 0', padding: '1rem 1.3rem', color: 'white',
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.2rem' }}>{t.title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>{t.subtitle}</div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: '0.8rem',
        padding: '0.5rem 1.3rem', background: '#fafbfc',
        border: '1px solid #e2e8f0', borderTop: 'none',
      }}>
        {t.svcLabels.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{
              width: '12px', height: '10px', background: barColors[i],
              borderRadius: '2px',
            }} />
            <span style={{ fontSize: '0.7rem', color: '#374151' }}>{label}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic' }}>{t.note}</div>
      </div>

      {/* Content area */}
      <div style={{
        padding: '0.8rem 1.3rem 1rem', background: '#f8fafc',
        border: '1px solid #e2e8f0', borderTop: 'none',
        borderRadius: '0 0 12px 12px',
      }}>
        <Section
          title={t.sections.iptables}
          metrics={metrics.iptables}
          colors={barColors}
          svcLabels={t.svcLabels}
        />
        <Section
          title={t.sections.keepalive}
          metrics={metrics.keepalive}
          colors={barColors}
          svcLabels={t.svcLabels}
        />
        <Section
          title={t.sections.connclose}
          metrics={metrics.connclose}
          colors={barColors}
          svcLabels={t.svcLabels}
        />
        <Section
          title={t.sections.cilium}
          metrics={metrics.cilium}
          colors={ciliumColors}
          svcLabels={t.svcLabels}
          borderColor="#d1fae5"
        />

        {/* Insight box */}
        <div style={{
          background: '#eff6ff', border: '2px solid #3b82f6',
          borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '0.5rem',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.2rem' }}>
            {t.insight.title}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#1e40af', lineHeight: 1.6 }}>
            {t.insight.text}
          </div>
        </div>

        {/* Threshold warning */}
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b',
          borderRadius: '8px', padding: '0.6rem 1rem',
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e', marginBottom: '0.15rem' }}>
            {t.threshold.title}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#92400e', lineHeight: 1.5 }}>
            {t.threshold.text}
          </div>
        </div>
      </div>
    </div>
  );
}
