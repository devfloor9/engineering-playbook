import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const translations = {
  ko: {
    title: '벤치마크 결론',
    cards: [
      {
        icon: '=',
        value: '≈ 동일',
        label: 'TCP Throughput',
        sub: 'NIC 대역폭 포화 (12.5 Gbps), CNI 무관'
      },
      {
        icon: '⚙️',
        value: '기능 차이',
        label: 'UDP 패킷 손실',
        sub: 'Bandwidth Manager 유무 차이 (iperf3 극한 조건, 일반 환경에서 발생 어려움)'
      },
      {
        icon: '🔗',
        value: '-36% RTT',
        label: 'Multi-hop 추론 파이프라인',
        sub: 'Gateway→Router→vLLM→RAG→VectorDB 다단 hop에서 RTT 절감 누적, HTTP/gRPC 실시간 추론 서빙 시 유의미'
      },
      {
        icon: '🔍',
        value: '기능 > 성능',
        label: '핵심 선택 기준',
        sub: 'L7 정책, FQDN 필터링, Hubble 관찰성, kube-proxy-less'
      }
    ],
    takeaway: '두 CNI의 성능 차이는 실환경에서 미미하며, 선택의 핵심은 eBPF 기반 관찰성·정책·아키텍처 등 기능입니다. 다만 multi-hop 추론 파이프라인에서는 RTT 누적 절감이 체감될 수 있습니다.'
  },
  en: {
    title: 'Benchmark Conclusion',
    cards: [
      {
        icon: '=',
        value: '≈ Identical',
        label: 'TCP Throughput',
        sub: 'NIC bandwidth saturated (12.5 Gbps), CNI-independent'
      },
      {
        icon: '⚙️',
        value: 'Feature Gap',
        label: 'UDP Packet Loss',
        sub: 'Bandwidth Manager availability (iperf3 extreme conditions, unlikely in normal environments)'
      },
      {
        icon: '🔗',
        value: '-36% RTT',
        label: 'Multi-hop Inference Pipeline',
        sub: 'RTT savings compound across Gateway→Router→vLLM→RAG→VectorDB hops, meaningful for real-time HTTP/gRPC inference serving'
      },
      {
        icon: '🔍',
        value: 'Features > Perf',
        label: 'Key Selection Criteria',
        sub: 'L7 policies, FQDN filtering, Hubble observability, kube-proxy-less'
      }
    ],
    takeaway: 'The performance gap between the two CNIs is negligible in practice — the real differentiator is features like eBPF observability, policies, and architecture. However, cumulative RTT reduction across multi-hop inference pipelines can be meaningful.'
  }
};

const cardColors = {
  light: [
    { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280' }, // neutral gray
    { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6' },  // info blue
    { bg: 'rgba(20, 184, 166, 0.1)', border: '#14b8a6' },  // teal/emerald
    { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7' }   // purple
  ],
  dark: [
    { bg: 'rgba(156, 163, 175, 0.15)', border: '#9ca3af' }, // neutral gray
    { bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa' },  // info blue
    { bg: 'rgba(45, 212, 191, 0.15)', border: '#2dd4bf' },  // teal/emerald
    { bg: 'rgba(192, 132, 252, 0.15)', border: '#c084fc' }  // purple
  ]
};

export default function CniConclusionInfographic({ locale = 'ko' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const t = translations[locale] || translations.ko;
  const colors = cardColors[colorMode] || cardColors.light;

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    background: isDark
      ? 'linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%)'
      : 'linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%)',
    borderRadius: '12px',
    padding: '2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    boxShadow: isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem'
  };

  const cardStyle = (index) => ({
    backgroundColor: colors[index].bg,
    border: `2px solid ${colors[index].border}`,
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
    ':hover': {
      transform: 'translateY(-4px)'
    }
  });

  const iconStyle = {
    fontSize: '2rem',
    marginBottom: '0.75rem',
    display: 'block'
  };

  const valueStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: isDark ? '#f3f4f6' : '#111827'
  };

  const labelStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: isDark ? 'var(--ifm-color-emphasis-200)' : '#374151'
  };

  const subStyle = {
    fontSize: '0.875rem',
    lineHeight: '1.4',
    color: isDark ? 'var(--ifm-color-emphasis-300)' : '#6b7280'
  };

  const takeawayStyle = {
    backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)',
    border: `1px solid ${isDark ? '#4b5563' : 'var(--ifm-color-emphasis-300)'}`,
    borderRadius: '8px',
    padding: '1.25rem',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: isDark ? 'var(--ifm-color-emphasis-200)' : '#374151',
    textAlign: 'center',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{t.title}</h2>
      </div>

      <div style={gridStyle}>
        {t.cards.map((card, index) => (
          <div
            key={index}
            style={cardStyle(index)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = isDark
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
                : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={iconStyle}>{card.icon}</div>
            <div style={valueStyle}>{card.value}</div>
            <div style={labelStyle}>{card.label}</div>
            <div style={subStyle}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={takeawayStyle}>
        {t.takeaway}
      </div>
    </div>
  );
}
