import React from 'react';

const i18n = {
  en: {
    title: 'AI/ML Workload Relevance Guide',
    subtitle: 'How this CNI benchmark applies to training and inference on EKS',
    sectionTitle: 'Relevance by Workload Type',
    note: 'Note:',
    caveat: 'This benchmark used m6i.xlarge (12.5 Gbps, no GPU). GPU instances (g5, p4d, p5, inf2) have 25–400 Gbps NICs and optional EFA. A dedicated AI/ML benchmark on GPU instances is recommended for production sizing.',
    relevance: { high: 'High', medium: 'Medium', low: 'Low', none: 'None' },
    keyFindings: [
      { metric: 'HTTP p99 Latency', value: '-20%', note: 'Inference serving', color: '#10b981' },
      { metric: 'Pod-to-Pod RTT', value: '-36%', note: 'Pipeline hops', color: '#3b82f6' },
      { metric: 'Service Scaling', value: 'O(1)', note: 'Model endpoints', color: '#8b5cf6' },
      { metric: 'EFA Training', value: 'N/A', note: 'Bypasses CNI', color: 'var(--ifm-color-emphasis-500)' },
    ],
    workloads: [
      { label: 'Real-time Inference Serving', reason: 'HTTP/gRPC based · Service scaling directly applies', icon: '⚡', relevance: 'high', pct: 95 },
      { label: 'Inference Pipeline (multi-hop)', reason: 'RTT improvement compounds per hop', icon: '🔗', relevance: 'high', pct: 85 },
      { label: 'Batch Inference', reason: 'Throughput-oriented · CNI gap is small', icon: '📦', relevance: 'medium', pct: 50 },
      { label: 'Distributed Training (no EFA)', reason: 'NCCL TCP/UDP partially affected', icon: '🧠', relevance: 'medium', pct: 45 },
      { label: 'Distributed Training (EFA)', reason: 'Kernel network stack bypassed entirely', icon: '🚀', relevance: 'low', pct: 15 },
      { label: 'Single-node Training', reason: 'No network dependency', icon: '💻', relevance: 'none', pct: 5 },
    ],
  },
  ko: {
    title: 'AI/ML 워크로드 관련성 가이드',
    subtitle: '본 CNI 벤치마크가 EKS 기반 Training 및 Inference에 미치는 영향',
    sectionTitle: '워크로드 유형별 관련성',
    note: '참고:',
    caveat: '본 벤치마크는 m6i.xlarge (12.5 Gbps, GPU 미탑재) 환경에서 측정되었습니다. GPU 인스턴스(g5, p4d, p5, inf2)는 25–400 Gbps NIC과 EFA를 지원하므로, 프로덕션 사이징을 위해서는 GPU 인스턴스 전용 AI/ML 벤치마크를 별도로 수행하는 것을 권장합니다.',
    relevance: { high: '높음', medium: '보통', low: '낮음', none: '없음' },
    keyFindings: [
      { metric: 'HTTP p99 Latency', value: '-20%', note: 'Inference 서빙', color: '#10b981' },
      { metric: 'Pod-to-Pod RTT', value: '-36%', note: 'Pipeline hop 누적', color: '#3b82f6' },
      { metric: 'Service Scaling', value: 'O(1)', note: 'Model Endpoint', color: '#8b5cf6' },
      { metric: 'EFA Training', value: 'N/A', note: 'CNI 우회', color: 'var(--ifm-color-emphasis-500)' },
    ],
    workloads: [
      { label: '실시간 Inference 서빙', reason: 'HTTP/gRPC 기반 · Service Scaling 결과 직접 적용', icon: '⚡', relevance: 'high', pct: 95 },
      { label: 'Inference Pipeline (multi-hop)', reason: 'RTT 개선이 hop마다 누적', icon: '🔗', relevance: 'high', pct: 85 },
      { label: 'Batch Inference', reason: 'Throughput 중심 · CNI 차이 미미', icon: '📦', relevance: 'medium', pct: 50 },
      { label: '분산 Training (EFA 미사용)', reason: 'NCCL TCP/UDP 통신에 일부 영향', icon: '🧠', relevance: 'medium', pct: 45 },
      { label: '분산 Training (EFA 사용)', reason: 'Kernel 네트워크 스택 완전 우회', icon: '🚀', relevance: 'low', pct: 15 },
      { label: '단일 노드 Training', reason: '네트워크 의존성 없음', icon: '💻', relevance: 'none', pct: 5 },
    ],
  },
};

const colorMap = {
  high: { bar: '#10b981', bg: 'var(--ifm-color-emphasis-100)', text: 'var(--ifm-font-color-base)' },
  medium: { bar: '#f59e0b', bg: 'var(--ifm-color-emphasis-100)', text: 'var(--ifm-font-color-base)' },
  low: { bar: '#94a3b8', bg: 'var(--ifm-color-emphasis-100)', text: 'var(--ifm-color-emphasis-600)' },
  none: { bar: '#cbd5e1', bg: 'var(--ifm-color-emphasis-100)', text: 'var(--ifm-color-emphasis-500)' },
};

export default function AimlRelevanceChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px', margin: '0 0 2rem 0',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: '12px 12px 0 0', padding: '1.2rem 1.5rem', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🤖</span>
          <span style={{ fontSize: '1rem', fontWeight: 700 }}>{t.title}</span>
        </div>
        <div style={{ fontSize: '0.78rem', opacity: 0.8, lineHeight: 1.5 }}>{t.subtitle}</div>
      </div>

      {/* Key metrics row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0',
        border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none',
      }}>
        {t.keyFindings.map((kf, i) => (
          <div key={i} style={{
            padding: '0.8rem 0.6rem', textAlign: 'center',
            borderRight: i < 3 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
            background: 'var(--ifm-background-surface-color)',
          }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: kf.color }}>{kf.value}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ifm-font-color-base)', marginTop: '2px' }}>{kf.metric}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--ifm-color-emphasis-500)' }}>{kf.note}</div>
          </div>
        ))}
      </div>

      {/* Relevance bars */}
      <div style={{
        background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none',
        borderRadius: '0 0 12px 12px', padding: '1.2rem 1.5rem',
      }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ifm-font-color-base)', marginBottom: '0.8rem' }}>
          {t.sectionTitle}
        </div>

        {t.workloads.map((w, i) => {
          const c = colorMap[w.relevance];
          return (
            <div key={i} style={{ marginBottom: '0.7rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '0.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>{w.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ifm-font-color-base)' }}>{w.label}</span>
                </div>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, padding: '1px 8px',
                  borderRadius: '10px', background: c.bg, color: c.text,
                }}>
                  {t.relevance[w.relevance]}
                </span>
              </div>
              <div style={{
                background: 'var(--ifm-color-emphasis-100)', borderRadius: '6px', height: '22px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${w.pct}%`, height: '100%', borderRadius: '6px',
                  background: `${c.bar}cc`, transition: 'width 0.6s ease',
                  minWidth: w.pct > 0 ? '4px' : '0',
                }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--ifm-color-emphasis-600)', marginTop: '2px', lineHeight: 1.4 }}>
                {w.reason}
              </div>
            </div>
          );
        })}

        {/* Caveat */}
        <div style={{
          marginTop: '1rem', padding: '0.7rem 1rem',
          background: 'var(--ifm-color-emphasis-100)', border: '1px solid #fde68a',
          borderRadius: '8px', fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-700)', lineHeight: 1.6,
        }}>
          <strong>{t.note}</strong> {t.caveat}
        </div>
      </div>
    </div>
  );
}
