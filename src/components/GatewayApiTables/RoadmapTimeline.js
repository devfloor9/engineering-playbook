import React, { useState } from 'react';

const roadmapData = {
  ko: [
    {
      phase: '현재',
      period: 'Now',
      color: '#4CAF50',
      icon: '🚀',
      items: [
        'Gateway API 마이그레이션',
        'NGINX Ingress EOL 대응',
        '솔루션 선택 및 PoC',
      ],
    },
    {
      phase: '6개월 후',
      period: '6 Months',
      color: '#FFC107',
      icon: '📊',
      items: [
        'Policy Attachment v1 표준 안정화',
        'Rate Limiting, CORS, Auth 정책 표준화',
        '벤치마크 보고서 완료',
        '5개 솔루션 실전 성능 데이터',
      ],
    },
    {
      phase: '1년 후',
      period: '1 Year',
      color: '#2196F3',
      icon: '🔗',
      items: [
        'GAMMA East-West 트래픽 관리',
        'Gateway API로 서비스 메시 표준화',
        'Istio Ambient Mesh 통합',
        '사이드카 없는 서비스 메시',
      ],
    },
    {
      phase: '2년 후',
      period: '2 Years',
      color: '#9C27B0',
      icon: '🤖',
      items: [
        'AI Gateway 통합 (LLM 라우팅)',
        '토큰 기반 Rate Limiting',
        'ML 기반 카나리 배포 자동화',
        '예측 기반 오토스케일링',
      ],
    },
  ],
  en: [
    {
      phase: 'Now',
      period: 'Now',
      color: '#4CAF50',
      icon: '🚀',
      items: [
        'Gateway API Migration',
        'NGINX Ingress EOL Response',
        'Solution Selection & PoC',
      ],
    },
    {
      phase: '6 Months',
      period: '6 Months',
      color: '#FFC107',
      icon: '📊',
      items: [
        'Policy Attachment v1 Standardization',
        'Rate Limiting, CORS, Auth Policy Standardization',
        'Benchmark Report Completion',
        '5 Solution Performance Data',
      ],
    },
    {
      phase: '1 Year',
      period: '1 Year',
      color: '#2196F3',
      icon: '🔗',
      items: [
        'GAMMA East-West Traffic Management',
        'Service Mesh Standardization via Gateway API',
        'Istio Ambient Mesh Integration',
        'Sidecar-less Service Mesh',
      ],
    },
    {
      phase: '2 Years',
      period: '2 Years',
      color: '#9C27B0',
      icon: '🤖',
      items: [
        'AI Gateway Integration (LLM Routing)',
        'Token-based Rate Limiting',
        'ML-based Canary Deployment Automation',
        'Predictive Auto-scaling',
      ],
    },
  ],
};

const labels = {
  ko: {
    title: '향후 확장 로드맵',
    subtitle: 'Gateway API 생태계 진화 경로 — 클릭하여 상세 보기',
  },
  en: {
    title: 'Future Expansion Roadmap',
    subtitle: 'Gateway API Ecosystem Evolution Path — click to expand',
  },
};

export default function RoadmapTimeline({ locale = 'ko' }) {
  const phases = roadmapData[locale] || roadmapData.ko;
  const lb = labels[locale] || labels.ko;
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', borderRadius: '12px 12px 0 0', padding: '0.85rem 1.25rem', color: 'white' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>
          🗺️ {lb.title}
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>
          {lb.subtitle}
        </div>
      </div>

      {/* Timeline container */}
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          {phases.map((phase, idx) => {
            const isOpen = expanded === idx;
            const isLast = idx === phases.length - 1;

            return (
              <div key={idx} style={{ position: 'relative', marginBottom: isLast ? 0 : '1.5rem' }}>
                {/* Connecting line */}
                {!isLast && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '1.5rem',
                      top: '3rem',
                      width: '2px',
                      height: 'calc(100% + 1.5rem)',
                      background: 'linear-gradient(180deg, ' + phase.color + ' 0%, ' + phases[idx + 1].color + ' 100%)',
                      opacity: 0.3,
                    }}
                  />
                )}

                {/* Phase card */}
                <div
                  style={{
                    position: 'relative',
                    border: `1.5px solid ${isOpen ? phase.color : 'var(--ifm-color-emphasis-200)'}`,
                    borderLeft: `4px solid ${phase.color}`,
                    borderRadius: 8,
                    background: isOpen ? 'var(--ifm-color-emphasis-100)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  onClick={() => setExpanded(isOpen ? null : idx)}
                >
                  {/* Header */}
                  <div style={{ padding: '0.7rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{phase.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#212121' }}>{phase.phase}</div>
                      <div style={{ fontSize: '0.68rem', color: '#757575', marginTop: 1 }}>{phase.period}</div>
                    </div>
                    <span
                      style={{
                        background: phase.color,
                        color: '#fff',
                        borderRadius: 20,
                        padding: '3px 10px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}/{phases.length}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#9e9e9e',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    >
                      ▼
                    </span>
                  </div>

                  {/* Expanded items */}
                  {isOpen && (
                    <div style={{ padding: '0 0.9rem 0.8rem', borderTop: '1px solid var(--ifm-color-emphasis-200)' }}>
                      <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {phase.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.5rem',
                              background: 'var(--ifm-color-emphasis-100)',
                              borderRadius: 6,
                              padding: '0.5rem 0.6rem',
                              borderLeft: `3px solid ${phase.color}`,
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', color: phase.color, marginTop: 1 }}>✓</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ifm-font-color-base)', fontWeight: 500, lineHeight: 1.4 }}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
