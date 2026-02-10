import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    finding1: {
      title: "TCP Throughput Saturated by NIC Bandwidth",
      text: "All scenarios achieved 12.34-12.41 Gbps, limited by m6i.xlarge's 12.5 Gbps baseline bandwidth. TCP throughput is effectively identical across all configurations."
    },
    finding2: {
      title: "UDP Loss Rate: Key Differentiator",
      tag: "Key Differentiator",
      tableHeaders: ["Scenario", "UDP Loss", "Reason"],
      rows: [
        { scenario: "A (VPC CNI)", loss: "20.39%", reason: "Native ENI, no eBPF rate limiting", highlight: "red" },
        { scenario: "B (Cilium+kp)", loss: "0.94%", reason: "eBPF Bandwidth Manager", highlight: "green" },
        { scenario: "C (kp-less)", loss: "0.69%", reason: "eBPF Bandwidth Manager", highlight: "green" },
        { scenario: "D (ENI)", loss: "20.42%", reason: "No tuning", highlight: "red" },
        { scenario: "E (ENI+Tuning)", loss: "0.03%", reason: "Bandwidth Manager + BBR", highlight: "green" }
      ],
      insight: "eBPF Bandwidth Manager enforces pod-level rate limits without kernel qdisc overhead, preventing UDP packet drops at high throughput."
    },
    finding3: {
      title: "RTT Improvement Through Tuning",
      tag: "36% Improvement",
      metric1: { label: "A: VPC CNI", value: "4,894µs" },
      metric2: { label: "D: ENI", value: "4,453µs", change: "-9%" },
      metric3: { label: "E: ENI+Tuning", value: "3,135µs", change: "-36%" },
      footer: "Key contributors: BPF Host Routing (bypasses iptables), Socket LB (direct connection), BBR congestion control"
    },
    finding4: {
      title: "kube-proxy Removal Effect",
      tag: "B vs C",
      metrics: [
        { label: "TCP/UDP Throughput", value: "No difference", highlight: "gray" },
        { label: "RTT", value: "+3% worse", detail: "4955→5092µs", highlight: "gray" },
        { label: "HTTP p99@1000", value: "-10% better", detail: "9.87→8.91ms", highlight: "green" },
        { label: "DNS p99", value: "-50% better", detail: "4ms→2ms", highlight: "green" }
      ],
      insight: "At small scale (~10 services), kube-proxy removal shows minimal benefit. At 1,000 services, iptables rules grew 101× (99→10,059) with +16% per-connection overhead, while Cilium eBPF maintained O(1) lookup performance regardless of service count."
    },
    finding5: {
      title: "ENI Mode vs Overlay Mode",
      tag: "C vs D",
      tableHeaders: ["Metric", "C (VXLAN)", "D (ENI)", "Change"],
      rows: [
        { metric: "TCP Throughput", vxlan: "12.34 Gbps", eni: "12.41 Gbps", change: "+0.6%", highlight: "gray" },
        { metric: "RTT", vxlan: "5,092 µs", eni: "4,453 µs", change: "-12.5%", highlight: "green", bold: "eni" },
        { metric: "HTTP p99@1000", vxlan: "8.91 ms", eni: "8.75 ms", change: "-1.8%", highlight: "green", bold: "eni" },
        { metric: "UDP Loss", vxlan: "0.69%", eni: "20.42%", change: "Needs tuning", highlight: "red", vxlanGreen: true, eniRed: true }
      ],
      insight: "VXLAN overlay adds ~640µs RTT overhead due to encapsulation. ENI mode provides lower latency but requires UDP tuning."
    },
    finding6: {
      title: "Tuning Cumulative Effect",
      tag: "D → E",
      tableHeaders: ["Metric", "D (ENI)", "E (ENI+Tuning)", "Change"],
      rows: [
        { metric: "RTT", base: "4,453 µs", tuned: "3,135 µs", change: "-30%", highlight: "green", boldTuned: true },
        { metric: "UDP Loss", base: "20.42%", tuned: "0.03%", change: "-99.9%", highlight: "green", baseRed: true, boldTuned: true },
        { metric: "HTTP QPS@max", base: "4,026", tuned: "4,182", change: "+3.9%", highlight: "green", semiboldTuned: true },
        { metric: "HTTP p99@1000", base: "8.75 ms", tuned: "9.89 ms", change: "+13%", highlight: "red" }
      ],
      tunings: [
        "Bandwidth Manager + BBR — UDP loss 20% → 0.03%",
        "Socket LB — Direct connection",
        "BPF Host Routing — Bypasses iptables"
      ],
      note: "XDP acceleration and DSR unavailable in ENI mode"
    },
    finding7: {
      title: "1,000-Service Scaling: iptables O(n) vs eBPF O(1)",
      tag: "Scaling",
      tableHeaders: ["Metric", "4 Services", "1,000 Services", "Change"],
      rows: [
        { metric: "iptables NAT Rules", base: "99", tuned: "10,059", change: "+101×", highlight: "red" },
        { metric: "Sync Cycle Time", base: "~130ms", tuned: "~170ms", change: "+31%", highlight: "red" },
        { metric: "Per-conn Setup (close)", base: "164µs", tuned: "190µs", change: "+16%", highlight: "red" },
        { metric: "Max QPS (keepalive)", base: "4,197", tuned: "4,178", change: "~0%", highlight: "gray" }
      ],
      insight: "With keepalive connections, conntrack caching bypasses iptables chain traversal, hiding the O(n) cost. Without keepalive, every SYN packet traverses the full KUBE-SERVICES chain. At 5,000+ services, this overhead becomes critical, adding hundreds of µs per connection."
    }
  },
  ko: {
    finding1: {
      title: "TCP Throughput은 NIC 대역폭에 포화",
      text: "모든 시나리오에서 12.34-12.41 Gbps를 달성했으며, m6i.xlarge의 12.5 Gbps baseline 대역폭에 의해 제한됩니다. TCP throughput은 모든 구성에서 사실상 동일합니다."
    },
    finding2: {
      title: "UDP Loss Rate: 핵심 차별화 요소",
      tag: "핵심 차별화 요소",
      tableHeaders: ["시나리오", "UDP Loss", "원인"],
      rows: [
        { scenario: "A (VPC CNI)", loss: "20.39%", reason: "Native ENI, eBPF rate limiting 없음", highlight: "red" },
        { scenario: "B (Cilium+kp)", loss: "0.94%", reason: "eBPF Bandwidth Manager", highlight: "green" },
        { scenario: "C (kp-less)", loss: "0.69%", reason: "eBPF Bandwidth Manager", highlight: "green" },
        { scenario: "D (ENI)", loss: "20.42%", reason: "튜닝 미적용", highlight: "red" },
        { scenario: "E (ENI+Tuning)", loss: "0.03%", reason: "Bandwidth Manager + BBR", highlight: "green" }
      ],
      insight: "eBPF Bandwidth Manager는 커널 qdisc 오버헤드 없이 pod 수준의 rate limit을 적용하여 고속 throughput 환경에서 UDP 패킷 드롭을 방지합니다."
    },
    finding3: {
      title: "튜닝을 통한 RTT 개선",
      tag: "36% 개선",
      metric1: { label: "A: VPC CNI", value: "4,894µs" },
      metric2: { label: "D: ENI", value: "4,453µs", change: "-9%" },
      metric3: { label: "E: ENI+Tuning", value: "3,135µs", change: "-36%" },
      footer: "주요 기여 요소: BPF Host Routing (iptables 우회), Socket LB (직접 연결), BBR congestion control"
    },
    finding4: {
      title: "kube-proxy 제거의 효과",
      tag: "B vs C 비교",
      metrics: [
        { label: "TCP/UDP Throughput", value: "차이 없음", highlight: "gray" },
        { label: "RTT", value: "+3% 악화", detail: "4955→5092µs", highlight: "gray" },
        { label: "HTTP p99@1000", value: "-10% 개선", detail: "9.87→8.91ms", highlight: "green" },
        { label: "DNS p99", value: "-50% 개선", detail: "4ms→2ms", highlight: "green" }
      ],
      insight: "소규모(~10 services)에서는 kube-proxy 제거 효과가 미미합니다. 1,000개 서비스에서 iptables 규칙이 101배(99→10,059개) 증가하며 연결당 +16% 오버헤드가 발생한 반면, Cilium eBPF는 서비스 수에 무관한 O(1) 룩업 성능을 유지했습니다."
    },
    finding5: {
      title: "ENI 모드 vs Overlay 모드",
      tag: "C vs D",
      tableHeaders: ["지표", "C (VXLAN)", "D (ENI)", "변화"],
      rows: [
        { metric: "TCP Throughput", vxlan: "12.34 Gbps", eni: "12.41 Gbps", change: "+0.6%", highlight: "gray" },
        { metric: "RTT", vxlan: "5,092 µs", eni: "4,453 µs", change: "-12.5%", highlight: "green", bold: "eni" },
        { metric: "HTTP p99@1000", vxlan: "8.91 ms", eni: "8.75 ms", change: "-1.8%", highlight: "green", bold: "eni" },
        { metric: "UDP Loss", vxlan: "0.69%", eni: "20.42%", change: "튜닝 필요", highlight: "red", vxlanGreen: true, eniRed: true }
      ],
      insight: "VXLAN overlay는 캡슐화로 인해 ~640µs RTT 오버헤드를 추가합니다. ENI 모드는 낮은 지연시간을 제공하지만 UDP 튜닝이 필요합니다."
    },
    finding6: {
      title: "튜닝 적용의 누적 효과",
      tag: "D → E 전환",
      tableHeaders: ["지표", "D (ENI)", "E (ENI+Tuning)", "변화"],
      rows: [
        { metric: "RTT", base: "4,453 µs", tuned: "3,135 µs", change: "-30%", highlight: "green", boldTuned: true },
        { metric: "UDP Loss", base: "20.42%", tuned: "0.03%", change: "-99.9%", highlight: "green", baseRed: true, boldTuned: true },
        { metric: "HTTP QPS@max", base: "4,026", tuned: "4,182", change: "+3.9%", highlight: "green", semiboldTuned: true },
        { metric: "HTTP p99@1000", base: "8.75 ms", tuned: "9.89 ms", change: "+13%", highlight: "red" }
      ],
      tunings: [
        "Bandwidth Manager + BBR — UDP loss 20% → 0.03%",
        "Socket LB — 직접 연결",
        "BPF Host Routing — iptables 우회"
      ],
      note: "ENI 모드에서는 XDP acceleration 및 DSR 사용 불가"
    },
    finding7: {
      title: "1,000개 서비스 스케일링: iptables O(n) vs eBPF O(1)",
      tag: "스케일링",
      tableHeaders: ["지표", "4 Services", "1,000 Services", "변화"],
      rows: [
        { metric: "iptables NAT 규칙 수", base: "99", tuned: "10,059", change: "+101배", highlight: "red" },
        { metric: "Sync 주기 시간", base: "~130ms", tuned: "~170ms", change: "+31%", highlight: "red" },
        { metric: "연결당 설정 시간 (close)", base: "164µs", tuned: "190µs", change: "+16%", highlight: "red" },
        { metric: "최대 QPS (keepalive)", base: "4,197", tuned: "4,178", change: "~0%", highlight: "gray" }
      ],
      insight: "keepalive 연결에서는 conntrack 캐시가 iptables 체인 순회를 우회하여 O(n) 비용이 숨겨집니다. keepalive 없이는 모든 SYN 패킷이 KUBE-SERVICES 체인 전체를 순회합니다. 5,000개 이상 서비스에서는 연결당 수백 µs가 추가되어 실질적 성능 저하가 발생합니다."
    }
  }
};

// Helper: Finding Card Container
function FindingCard({ number, title, tag, tagColor, borderColor, bgColor, isDark, children }) {
  return (
    <div style={{
      border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '8px',
      padding: '20px',
      background: bgColor,
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: borderColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          fontSize: '16px'
        }}>
          {number}
        </div>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: isDark ? '#f1f5f9' : '#1e293b', flex: 1 }}>
          {title}
        </h3>
        {tag && (
          <span style={{
            background: tagColor,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// Helper: Metric Table
function MetricTable({ headers, rows, locale, isDark }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
        background: isDark ? '#1e293b' : 'white',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 12px',
                textAlign: 'left',
                fontWeight: '600',
                color: isDark ? '#cbd5e1' : '#475569',
                borderBottom: isDark ? '2px solid #334155' : '2px solid #e2e8f0'
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? (isDark ? '1px solid #334155' : '1px solid #f1f5f9') : 'none' }}>
              {Object.keys(row).filter(k => k !== 'highlight' && k !== 'bold' && k !== 'vxlanGreen' && k !== 'eniRed' && k !== 'baseRed' && k !== 'boldTuned' && k !== 'semiboldTuned').map((key, j) => {
                let color = isDark ? '#e2e8f0' : '#334155';
                let fontWeight = '400';
                let bgColor = 'transparent';

                if (key === 'loss' || (key === 'vxlan' && row.vxlanGreen) || (key === 'tuned' && row.baseRed)) {
                  if (row[key].includes('20.') || row[key] === '20.42%') {
                    color = '#dc2626';
                    bgColor = isDark ? 'rgba(220, 38, 38, 0.15)' : '#fee';
                  } else if (parseFloat(row[key]) < 1 || row[key].includes('0.03') || row[key].includes('0.69') || row[key].includes('0.94')) {
                    color = '#059669';
                    bgColor = isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5';
                  }
                }

                if (key === 'eni' && row.eniRed) {
                  color = '#dc2626';
                  bgColor = isDark ? 'rgba(220, 38, 38, 0.15)' : '#fee';
                }

                if (key === 'base' && row.baseRed && row[key].includes('20.42')) {
                  color = '#dc2626';
                  bgColor = isDark ? 'rgba(220, 38, 38, 0.15)' : '#fee';
                }

                if (row.bold === key || (key === 'eni' && row.bold === 'eni')) {
                  fontWeight = '700';
                }

                if (row.boldTuned && key === 'tuned') {
                  fontWeight = '700';
                  if (row.metric === 'UDP Loss') {
                    color = '#059669';
                    bgColor = isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5';
                  }
                }

                if (row.semiboldTuned && key === 'tuned') {
                  fontWeight = '600';
                }

                if (key === 'change') {
                  if (row.highlight === 'green') {
                    color = '#059669';
                  } else if (row.highlight === 'red') {
                    color = '#dc2626';
                  } else if (row.highlight === 'gray') {
                    color = '#64748b';
                  }
                }

                return (
                  <td key={j} style={{
                    padding: '10px 12px',
                    color,
                    fontWeight,
                    background: bgColor
                  }}>
                    {row[key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper: Insight Box
function InsightBox({ text, bgColor = '#fef2f2', isDark }) {
  return (
    <div style={{
      background: isDark ? 'rgba(220, 38, 38, 0.1)' : bgColor,
      border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #fecaca',
      borderRadius: '6px',
      padding: '12px 16px',
      marginTop: '16px',
      fontSize: '14px',
      lineHeight: '1.6',
      color: isDark ? '#fca5a5' : '#991b1b'
    }}>
      <strong>Insight:</strong> {text}
    </div>
  );
}

// Helper: Metric Box (for RTT visualization)
function MetricBox({ label, value, change, color = '#64748b', isDark }) {
  return (
    <div style={{
      flex: 1,
      padding: '16px',
      background: isDark ? '#1e293b' : 'white',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '6px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color, marginBottom: '4px' }}>{value}</div>
      {change && (
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: color === '#10b981' ? '#059669' : '#3b82f6'
        }}>
          {change}
        </div>
      )}
    </div>
  );
}

// Helper: Metric Grid Card (for kube-proxy removal)
function MetricGridCard({ label, value, detail, highlight, isDark }) {
  const colors = {
    green: { bg: '#ecfdf5', text: '#059669' },
    gray: { bg: '#f8fafc', text: '#64748b' }
  };
  const c = colors[highlight] || colors.gray;

  return (
    <div style={{
      padding: '16px',
      background: isDark ? '#1e293b' : 'white',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '6px'
    }}>
      <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px' }}>{label}</div>
      <div style={{
        fontSize: '18px',
        fontWeight: '700',
        color: c.text,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      {detail && (
        <div style={{ fontSize: '12px', color: isDark ? '#64748b' : '#94a3b8' }}>{detail}</div>
      )}
    </div>
  );
}

export default function KeyFindingsChart({ locale = 'en' }) {
  const t = i18n[locale];
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <div style={{
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Finding 1: TCP Saturated */}
      <FindingCard
        number="1"
        title={t.finding1.title}
        borderColor="#94a3b8"
        bgColor={isDark ? '#1e293b' : '#f8fafc'}
        isDark={isDark}
      >
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: isDark ? '#94a3b8' : '#475569' }}>
          {t.finding1.text}
        </p>
      </FindingCard>

      {/* Finding 2: UDP Loss (KEY) */}
      <FindingCard
        number="2"
        title={t.finding2.title}
        tag={t.finding2.tag}
        tagColor="#ef4444"
        borderColor="#ef4444"
        bgColor={isDark ? '#1e293b' : 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)'}
        isDark={isDark}
      >
        <MetricTable headers={t.finding2.tableHeaders} rows={t.finding2.rows} locale={locale} isDark={isDark} />
        <InsightBox text={t.finding2.insight} isDark={isDark} />
      </FindingCard>

      {/* Finding 3: RTT Improvement */}
      <FindingCard
        number="3"
        title={t.finding3.title}
        tag={t.finding3.tag}
        tagColor="#10b981"
        borderColor="#10b981"
        bgColor={isDark ? '#1e293b' : 'linear-gradient(135deg, #fff 0%, #ecfdf5 100%)'}
        isDark={isDark}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
          <MetricBox
            label={t.finding3.metric1.label}
            value={t.finding3.metric1.value}
            color="#64748b"
            isDark={isDark}
          />
          <div style={{ fontSize: '20px', color: isDark ? '#475569' : '#94a3b8' }}>→</div>
          <MetricBox
            label={t.finding3.metric2.label}
            value={t.finding3.metric2.value}
            change={t.finding3.metric2.change}
            color="#3b82f6"
            isDark={isDark}
          />
          <div style={{ fontSize: '20px', color: isDark ? '#475569' : '#94a3b8' }}>→</div>
          <MetricBox
            label={t.finding3.metric3.label}
            value={t.finding3.metric3.value}
            change={t.finding3.metric3.change}
            color="#10b981"
            isDark={isDark}
          />
        </div>
        <div style={{
          marginTop: '16px',
          fontSize: '13px',
          color: isDark ? '#94a3b8' : '#64748b',
          fontStyle: 'italic',
          paddingLeft: '12px',
          borderLeft: '3px solid #10b981'
        }}>
          {t.finding3.footer}
        </div>
      </FindingCard>

      {/* Finding 4: kube-proxy Removal */}
      <FindingCard
        number="4"
        title={t.finding4.title}
        tag={t.finding4.tag}
        tagColor="#8b5cf6"
        borderColor="#8b5cf6"
        bgColor={isDark ? '#1e293b' : 'linear-gradient(135deg, #fff 0%, #f5f3ff 100%)'}
        isDark={isDark}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '16px'
        }}>
          {t.finding4.metrics.map((m, i) => (
            <MetricGridCard key={i} {...m} isDark={isDark} />
          ))}
        </div>
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: isDark ? 'rgba(139, 92, 246, 0.1)' : '#faf5ff',
          border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #e9d5ff',
          borderRadius: '6px',
          fontSize: '13px',
          color: isDark ? '#c4b5fd' : '#6b21a8',
          lineHeight: '1.5'
        }}>
          <strong>Insight:</strong> {t.finding4.insight}
        </div>
      </FindingCard>

      {/* Finding 5: ENI vs Overlay */}
      <FindingCard
        number="5"
        title={t.finding5.title}
        tag={t.finding5.tag}
        tagColor="#3b82f6"
        borderColor="#3b82f6"
        bgColor={isDark ? '#1e293b' : 'linear-gradient(135deg, #fff 0%, #eff6ff 100%)'}
        isDark={isDark}
      >
        <MetricTable headers={t.finding5.tableHeaders} rows={t.finding5.rows} locale={locale} isDark={isDark} />
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#dbeafe',
          border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #93c5fd',
          borderRadius: '6px',
          fontSize: '13px',
          color: isDark ? '#93c5fd' : '#1e40af',
          lineHeight: '1.5'
        }}>
          <strong>Insight:</strong> {t.finding5.insight}
        </div>
      </FindingCard>

      {/* Finding 6: Tuning Cumulative Effect */}
      <FindingCard
        number="6"
        title={t.finding6.title}
        tag={t.finding6.tag}
        tagColor={locale === 'ko' ? '#f59e0b' : '#06b6d4'}
        borderColor={locale === 'ko' ? '#f59e0b' : '#06b6d4'}
        bgColor={isDark ? '#1e293b' : (locale === 'ko' ? 'linear-gradient(135deg, #fff 0%, #fffbeb 100%)' : 'linear-gradient(135deg, #fff 0%, #ecfeff 100%)')}
        isDark={isDark}
      >
        <MetricTable headers={t.finding6.tableHeaders} rows={t.finding6.rows} locale={locale} isDark={isDark} />
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: isDark ? '#0f172a' : 'white',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#e2e8f0' : '#334155', marginBottom: '8px' }}>
            {locale === 'en' ? 'Most Impactful Tunings:' : '가장 영향력 있는 튜닝:'}
          </div>
          <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.8' }}>
            {t.finding6.tunings.map((tuning, i) => (
              <li key={i}>{tuning}</li>
            ))}
          </ol>
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: isDark ? '#64748b' : '#94a3b8',
            fontStyle: 'italic',
            paddingTop: '12px',
            borderTop: isDark ? '1px solid #334155' : '1px solid #f1f5f9'
          }}>
            {t.finding6.note}
          </div>
        </div>
      </FindingCard>

      {/* Finding 7: 1000-Service Scaling */}
      <FindingCard
        number="7"
        title={t.finding7.title}
        tag={t.finding7.tag}
        tagColor="#f59e0b"
        borderColor="#f59e0b"
        bgColor={isDark ? '#1e293b' : 'linear-gradient(135deg, #fff 0%, #fffbeb 100%)'}
        isDark={isDark}
      >
        <MetricTable headers={t.finding7.tableHeaders} rows={t.finding7.rows} locale={locale} isDark={isDark} />
        <InsightBox text={t.finding7.insight} bgColor="#fffbeb" isDark={isDark} />
      </FindingCard>
    </div>
  );
}
