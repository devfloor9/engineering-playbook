import React from 'react';

const i18n = {
  en: {
    title: 'Benchmark Key Results Summary',
    subtitle: 'EKS 1.31 · m6i.xlarge × 3 Nodes · Real-world measurements across 5 scenarios',
    rttLatency: 'RTT Latency Improvement',
    rttSub: 'Scenario E vs A',
    udpLoss: 'UDP Loss Improvement',
    udpSub: '20.39% → 0.03%',
    iptablesGrowth: 'iptables Rule Growth',
    iptablesSub: '99 → 10,059 (1000 svc)',
    ebpfLookup: 'eBPF Service Lookup',
    ebpfSub: 'vs iptables O(n)'
  },
  ko: {
    title: '벤치마크 핵심 결과 요약',
    subtitle: 'EKS 1.31 · m6i.xlarge × 3 Nodes · 5개 시나리오 실측 데이터 기반',
    rttLatency: 'RTT 지연 개선',
    rttSub: '시나리오 E vs A',
    udpLoss: 'UDP 손실 개선',
    udpSub: '20.39% → 0.03%',
    iptablesGrowth: 'iptables 규칙 증가',
    iptablesSub: '99 → 10,059 (1000 svc)',
    ebpfLookup: 'eBPF 서비스 룩업',
    ebpfSub: 'vs iptables O(n)'
  }
};

export default function KeyResultsSummaryChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;

  const metrics = [
    { value: '-36%', label: t.rttLatency, sub: t.rttSub, color: '#5eead4' },
    { value: '680×', label: t.udpLoss, sub: t.udpSub, color: '#5eead4' },
    { value: '101×', label: t.iptablesGrowth, sub: t.iptablesSub, color: '#fb923c' },
    { value: 'O(1)', label: t.ebpfLookup, sub: t.ebpfSub, color: '#fbbf24' }
  ];

  return (
    <div style={{
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d7377 100%)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white'
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          letterSpacing: '-0.02em'
        }}>
          {t.title}
        </h2>
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          opacity: '0.8',
          lineHeight: '1.5'
        }}>
          {t.subtitle}
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {metrics.map((metric, idx) => (
            <div key={idx} style={{
              flex: '1 1 calc(50% - 8px)',
              minWidth: '200px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: metric.color,
                marginBottom: '8px',
                letterSpacing: '-0.02em'
              }}>
                {metric.value}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '4px',
                lineHeight: '1.3'
              }}>
                {metric.label}
              </div>
              <div style={{
                fontSize: '12px',
                opacity: '0.7',
                lineHeight: '1.3'
              }}>
                {metric.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
