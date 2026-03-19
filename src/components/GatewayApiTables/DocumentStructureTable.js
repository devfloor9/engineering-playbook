import React from 'react';

const groups = {
  ko: [
    {
      label: '필수', color: '#e53935', bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { num: '1', name: '개요', desc: '문서 구조, 대상 독자' },
        { num: '2', name: 'NGINX Retirement', desc: 'EOL 타임라인, 보안 위험' },
        { num: '3', name: 'Gateway API 아키텍처', desc: '3-Tier 모델, 역할 분리' },
        { num: '4', name: 'Gateway API 구현체 비교', desc: 'AWS Native vs Open Source, NGINX 매핑, 코드 예제' },
        { num: '6', name: '결론', desc: '권장사항, 로드맵' },
      ],
    },
    {
      label: '상황별', color: '#1565c0', bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { num: '5', name: '벤치마크 계획', desc: '테스트 설계' },
      ],
    },
  ],
  en: [
    {
      label: 'Required', color: '#e53935', bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { num: '1', name: 'Overview', desc: 'Structure, audience' },
        { num: '2', name: 'NGINX Retirement', desc: 'EOL timeline, security' },
        { num: '3', name: 'Gateway API Architecture', desc: '3-Tier model, roles' },
        { num: '4', name: 'Implementation Comparison', desc: 'AWS Native vs Open Source, NGINX mappings, code' },
        { num: '6', name: 'Conclusion', desc: 'Recommendations, roadmap' },
      ],
    },
    {
      label: 'Situational', color: '#1565c0', bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { num: '5', name: 'Benchmark Planning', desc: 'Test design' },
      ],
    },
  ],
};

export default function DocumentStructureTable({ locale = 'ko' }) {
  const data = groups[locale] || groups.ko;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', borderRadius: '12px 12px 0 0', padding: '0.75rem 1.25rem', color: 'white' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{locale === 'ko' ? '📚 문서 구조' : '📚 Document Structure'}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.6rem' }}>
        {data.map((group) => (
          <div key={group.label} style={{ marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{ background: group.color, color: '#fff', borderRadius: 6, padding: '1px 10px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{group.label}</span>
              <div style={{ flex: 1, height: 1, background: `${group.color}30` }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', paddingLeft: '0.25rem' }}>
              {group.items.map((item) => (
                <span key={item.num} style={{ background: group.bg, border: `1px solid ${group.color}25`, borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', color: 'var(--ifm-font-color-base)', lineHeight: 1.4 }}>
                  <strong style={{ color: group.color }}>{item.num}.</strong> {item.name} <span style={{ color: 'var(--ifm-color-emphasis-500)', fontSize: '0.66rem' }}>— {item.desc}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
