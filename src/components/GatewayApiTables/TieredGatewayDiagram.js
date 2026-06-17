import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

// Agentic 워크로드를 위한 2-Tier 게이트웨이 구조 시각화.
// Tier 1: 범용 Gateway API (북-남) / Tier 2: 추론 게이트웨이 (LLM 전용)
const data = {
  ko: {
    title: 'Agentic 워크로드를 위한 2-Tier 게이트웨이',
    subtitle: 'Tier 1 범용 Gateway API + Tier 2 추론 트래픽 계층의 역할 분리',
    client: '클라이언트 · 에이전트 · 외부 API',
    tier1: {
      label: 'Tier 1 — 범용 Gateway API (북-남)',
      role: '인증 · TLS · 라우팅 · Rate Limiting · WAF',
      solutions: '범용 Gateway API 구현체 (§4 비교 참조)',
      doc: '이 문서',
    },
    tier2: {
      label: 'Tier 2 — 추론 트래픽 (LLM 전용)',
      role: '① Inference Routing(클러스터 내 Pod) · ② LLM API Gateway(프로바이더 프록시)',
      solutions: '① Gateway API Inference Extension · ② Bifrost · LiteLLM · OpenRouter',
      doc: '티어드 게이트웨이 아키텍처',
    },
    backends: ['일반 API / 웹 서비스', 'LLM 추론 Pod · 외부 LLM API'],
    note: 'Tier 2는 두 유형으로 나뉩니다 — ① Inference Routing(Inference Extension)은 클러스터 내 추론 Pod로 KV 캐시 인지 라우팅, ② LLM API Gateway(Bifrost·LiteLLM·OpenRouter)는 외부/내부 모델 API를 추상화. 용어 정의는 티어드 게이트웨이 아키텍처 문서를 참조하세요.',
  },
  en: {
    title: '2-Tier Gateway for Agentic Workloads',
    subtitle: 'Role separation: Tier 1 general Gateway API + Tier 2 inference traffic layer',
    client: 'Clients · Agents · External APIs',
    tier1: {
      label: 'Tier 1 — General Gateway API (North-South)',
      role: 'Auth · TLS · Routing · Rate Limiting · WAF',
      solutions: 'General Gateway API implementations (see §4 comparison)',
      doc: 'This document',
    },
    tier2: {
      label: 'Tier 2 — Inference Traffic (LLM-specific)',
      role: '① Inference Routing (in-cluster pods) · ② LLM API Gateway (provider proxy)',
      solutions: '① Gateway API Inference Extension · ② Bifrost · LiteLLM · OpenRouter',
      doc: 'Tiered Gateway Architecture',
    },
    backends: ['General API / web services', 'LLM inference pods · external LLM APIs'],
    note: 'Tier 2 splits into two types — ① Inference Routing (Inference Extension) does KV-cache-aware routing to in-cluster inference pods, while ② LLM API Gateway (Bifrost·LiteLLM·OpenRouter) abstracts external/internal model APIs. See the Tiered Gateway Architecture document for definitions.',
  },
};

export default function TieredGatewayDiagram({ locale = 'ko' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const t = data[locale] || data.ko;
  const surface = isDark ? '#1e1e1e' : '#fff';
  const border = isDark ? '#333' : 'var(--ifm-color-emphasis-200)';

  const box = (bg, borderColor) => ({
    background: bg,
    border: `2px solid ${borderColor}`,
    borderRadius: 10,
    padding: '0.7rem 0.9rem',
    textAlign: 'center',
  });

  const arrow = (
    <div style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-500)', fontSize: '1.1rem', lineHeight: 1, margin: '0.1rem 0' }}>▼</div>
  );

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 720, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #00695c 0%, #00897b 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{t.title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 2 }}>{t.subtitle}</div>
      </div>

      <div style={{ background: isDark ? '#181818' : '#f8fafc', border: `1px solid ${border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1rem' }}>
        {/* Client */}
        <div style={box(isDark ? '#263238' : '#eceff1', '#607d8b')}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isDark ? '#b0bec5' : '#455a64' }}>{t.client}</div>
        </div>
        {arrow}

        {/* Tier 1 */}
        <div style={box(isDark ? '#0d2818' : '#e8f5e9', '#2e7d32')}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#2e7d32' }}>{t.tier1.label}</div>
          <div style={{ fontSize: '0.72rem', margin: '0.25rem 0', color: 'var(--ifm-font-color-base)' }}>{t.tier1.role}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--ifm-color-emphasis-700)' }}>{t.tier1.solutions}</div>
          <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.66rem', padding: '2px 8px', borderRadius: 10, background: '#2e7d32', color: '#fff', fontWeight: 600 }}>📄 {t.tier1.doc}</span>
        </div>
        {arrow}

        {/* Split: backends + tier2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div style={box(surface, '#607d8b')}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ifm-font-color-base)' }}>{t.backends[0]}</div>
          </div>
          <div style={box(isDark ? '#311b1b' : '#e0f2f1', '#00897b')}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#00897b' }}>{t.tier2.label}</div>
            <div style={{ fontSize: '0.7rem', margin: '0.25rem 0', color: 'var(--ifm-font-color-base)' }}>{t.tier2.role}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--ifm-color-emphasis-700)' }}>{t.tier2.solutions}</div>
            <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.66rem', padding: '2px 8px', borderRadius: 10, background: '#00897b', color: '#fff', fontWeight: 600 }}>📄 {t.tier2.doc}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.4rem' }}>
          <div />
          <div style={{ textAlign: 'center', color: 'var(--ifm-color-emphasis-500)', fontSize: '1.1rem' }}>▼</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div />
          <div style={box(surface, '#00897b')}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ifm-font-color-base)' }}>{t.backends[1]}</div>
          </div>
        </div>

        <div style={{ marginTop: '0.85rem', fontSize: '0.7rem', lineHeight: 1.5, color: 'var(--ifm-color-emphasis-700)', borderLeft: '3px solid #00b9aa', paddingLeft: '0.6rem', background: isDark ? '#1a2c2a' : '#e0f7f5', padding: '0.5rem 0.6rem', borderRadius: 4 }}>
          ℹ️ {t.note}
        </div>
      </div>
    </div>
  );
}
